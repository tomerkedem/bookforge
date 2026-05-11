/**
 * Universe core micro-interactions — single lightning strike that
 * fires FROM the hovered orbit card TO the open book in the central
 * scene-background image, then vanishes.
 *
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │ Direction                                                      │
 *   │                                                                │
 *   │   source = centre of the hovered orbit card                    │
 *   │   target = centre of the open book glyph inside the            │
 *   │            `.knowledge-scene-background img` PNG               │
 *   │                                                                │
 *   │   The book's pixel position is computed at strike time from    │
 *   │   the image's natural dimensions and the current viewport,     │
 *   │   reproducing the `object-fit: cover; object-position: center  │
 *   │   center` math so the strike lands on the actual book glyph    │
 *   │   regardless of viewport size or aspect ratio.                 │
 *   │                                                                │
 *   │   Tunables: BOOK_REL_X / BOOK_REL_Y (the book's relative       │
 *   │   coordinates inside the PNG, 0–1).                            │
 *   └────────────────────────────────────────────────────────────────┘
 *
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │ Visual recipe for "real lightning"                             │
 *   │                                                                │
 *   │   1.  High-frequency, high-amplitude jagged path with sharp    │
 *   │       miter corners (no smooth round-join).                    │
 *   │   2.  One to three stochastic *branches* forking off the main  │
 *   │       path mid-flight and dying in space.                      │
 *   │   3.  Three render layers per stroke:                          │
 *   │         • Outer halo  — wide, heavily blurred, accent colour.  │
 *   │         • Mid glow    — medium, lightly blurred, accent.       │
 *   │         • White-hot core — thin, no blur, pure white.          │
 *   │   4.  Origin spark at the card centre — bolt visibly leaves    │
 *   │       the orbiting object.                                     │
 *   │   5.  Impact flash on the book — bolt visibly hits the core.   │
 *   │   6.  Instant-on, brief hold (~60 ms), opacity fade (~200 ms). │
 *   │       Real lightning appears whole in a flash, then is gone.   │
 *   │   7.  ONE strike per card-entry. No flicker loop.              │
 *   └────────────────────────────────────────────────────────────────┘
 *
 *   Stacking:
 *     The SVG overlay sits at z-index 25 with `mix-blend-mode: screen`
 *     so bolts brighten the cards they cross instead of overpainting,
 *     and they reach the card's exact centre rather than stopping at
 *     its edge. Pointer events are off, so clicks still pass through
 *     to the cards. See library.astro for the matching CSS.
 *
 *   Reduced motion:
 *     The flicker loop is disabled — a single static bolt is fired
 *     instead, with longer life and fade so the visual feedback still
 *     happens but without rapid pulsing.
 *
 *   Cost: zero idle work. Pointer events drive everything; bolt nodes
 *   are created on demand and self-remove. No animation-frame loop.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const HALO_FILTER_ID = 'yuval-bolt-halo';
const MID_FILTER_ID  = 'yuval-bolt-mid';

/** Book glyph position inside `galaxy-stage-core-medium.png`, expressed
 *  as fractions of the image's natural width / height. The PNG shows
 *  an open book glowing at the upper-middle of the cosmic field; if
 *  the asset is ever swapped these may need re-tuning. Verified
 *  visually against the current asset.                                */
const BOOK_REL_X = 0.50;
const BOOK_REL_Y = 0.40;

/** Final viewport-pixel offsets applied AFTER the image-relative
 *  position is computed. Use these for fine-tuning without re-deriving
 *  fractional anchors. Positive Y = lower on screen.                  */
const BOOK_OFFSET_X_PX = 10;
const BOOK_OFFSET_Y_PX = 160;

/** Card kind → CSS variable reference for the bolt's accent colour.
 *  Mirrors the `.galaxy-card[data-kind="…"]` rules in library.astro;
 *  adding a new kind there means adding a row here.                    */
const COLOR_BY_KIND: Readonly<Record<string, string>> = {
  book:   'var(--yuval-galaxy-accent-gold)',
  lesson: 'var(--yuval-galaxy-accent-cyan)',
  series: 'var(--yuval-galaxy-accent-purple)',
};

interface Point { x: number; y: number; }

/** Build the main bolt path AND a handful of branch paths. The main
 *  path's intermediate node coordinates are also returned so branches
 *  can be anchored on real elbows of the bolt instead of arbitrary
 *  midpoints — branches that "fork" out of an actual elbow look
 *  more like real lightning than ones that grow out of empty air.    */
function buildLightning(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
): { main: string; branches: string[] } {
  const dx = tx - sx;
  const dy = ty - sy;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return { main: `M ${sx} ${sy} L ${tx} ${ty}`, branches: [] };

  // Higher segment density + bigger jitter than the previous beam-style
  // implementation. Real lightning zigzags hard; smooth jitter reads
  // as a glow ribbon, not a strike.
  const segments  = Math.max(10, Math.round(dist / 16));
  const px        = -dy / dist;
  const py        =  dx / dist;
  const maxJitter = Math.min(36, dist * 0.10);

  // Walk the main path, keeping the elbow nodes for branch anchors.
  const nodes: Point[] = [{ x: sx, y: sy }];
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    // sin(t·π) damps the jitter at both endpoints so the bolt stays
    // anchored on the core and on the card.
    const damp = Math.sin(t * Math.PI);
    const jitter = (Math.random() * 2 - 1) * maxJitter * damp;
    nodes.push({
      x: sx + dx * t + px * jitter,
      y: sy + dy * t + py * jitter,
    });
  }
  nodes.push({ x: tx, y: ty });

  const main =
    'M ' + nodes.map((n) => `${n.x.toFixed(1)} ${n.y.toFixed(1)}`).join(' L ');

  // 0–1 branches. Light branching keeps the bolt delicate — a single
  // fork most of the time, sometimes none.
  const branchCount = Math.random() < 0.55 ? 1 : 0;
  const branches: string[] = [];
  const baseAngle = Math.atan2(dy, dx);

  for (let b = 0; b < branchCount; b++) {
    // Pick an inner node — never the start (origin) nor the end
    // (impact). Bias toward middle/upper third so branches feel like
    // they fork from the strike rather than its arrival.
    const idx = 1 + Math.floor((nodes.length - 2) * (0.20 + Math.random() * 0.55));
    const start = nodes[idx];
    if (!start) continue;

    // Branch direction skewed off the main axis — ±30°…±100°.
    const skew = (0.5 + Math.random() * 1.2) * (Math.random() < 0.5 ? -1 : 1);
    const angle = baseAngle + skew;
    const length = dist * (0.15 + Math.random() * 0.20);
    const ex = start.x + Math.cos(angle) * length;
    const ey = start.y + Math.sin(angle) * length;

    const segs = Math.max(3, Math.round(length / 14));
    const bdx = ex - start.x;
    const bdy = ey - start.y;
    const blen = Math.hypot(bdx, bdy) || 1;
    const bpx = -bdy / blen;
    const bpy =  bdx / blen;
    const bMaxJitter = length * 0.18;

    let bp = `M ${start.x.toFixed(1)} ${start.y.toFixed(1)}`;
    for (let i = 1; i <= segs; i++) {
      const t = i / segs;
      const damp = Math.sin(t * Math.PI);
      const j = (Math.random() * 2 - 1) * bMaxJitter * damp;
      const px2 = start.x + bdx * t + bpx * j;
      const py2 = start.y + bdy * t + bpy * j;
      bp += ` L ${px2.toFixed(1)} ${py2.toFixed(1)}`;
    }
    branches.push(bp);
  }

  return { main, branches };
}

/** Compute where the open-book glyph in the page-level scene-background
 *  PNG actually paints in stage-local pixel coordinates RIGHT NOW.
 *
 *  The PNG sits at `position: fixed; inset: 0` on `.knowledge-scene-
 *  background`, the inner `<img>` is `object-fit: cover` with
 *  `object-position: center center`. We replay that math here:
 *
 *    1.  scale = max(viewportW / imgW, viewportH / imgH)   ← cover
 *    2.  rendered = (imgW, imgH) × scale
 *    3.  offset   = (viewport - rendered) / 2              ← center
 *    4.  bookViewport = offset + (BOOK_REL_X, BOOK_REL_Y) × rendered
 *    5.  bookStage    = bookViewport - stageRect.topLeft
 *
 *  Returns null if the image hasn't loaded yet (naturalWidth = 0);
 *  the caller falls back to stage centre in that rare case.            */
function findBookInStage(stage: HTMLElement): { x: number; y: number } | null {
  const img = document.querySelector<HTMLImageElement>('.knowledge-scene-background img');
  if (!img) return null;
  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;
  if (!imgW || !imgH) return null;

  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const scale = Math.max(viewportW / imgW, viewportH / imgH);
  const renderedW = imgW * scale;
  const renderedH = imgH * scale;
  const offsetX = (viewportW - renderedW) / 2;
  const offsetY = (viewportH - renderedH) / 2;

  const bookViewportX = offsetX + BOOK_REL_X * renderedW + BOOK_OFFSET_X_PX;
  const bookViewportY = offsetY + BOOK_REL_Y * renderedH + BOOK_OFFSET_Y_PX;

  const stageRect = stage.getBoundingClientRect();
  return {
    x: bookViewportX - stageRect.left,
    y: bookViewportY - stageRect.top,
  };
}

/** Lazily inject the SVG overlay + glow filters into a stage. Idempotent. */
function ensureOverlay(stage: HTMLElement): SVGSVGElement {
  const existing = stage.querySelector<SVGSVGElement>(':scope > svg[data-core-lightning]');
  if (existing) return existing;

  const svg = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement;
  svg.setAttribute('data-core-lightning', '');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('preserveAspectRatio', 'none');

  const defs = document.createElementNS(SVG_NS, 'defs');

  // Halo filter — wide soft bloom for the outer accent stroke and the
  // impact flash. Filter region expanded so the blur isn't clipped.
  const haloFilter = document.createElementNS(SVG_NS, 'filter');
  haloFilter.setAttribute('id', HALO_FILTER_ID);
  haloFilter.setAttribute('x', '-50%');
  haloFilter.setAttribute('y', '-50%');
  haloFilter.setAttribute('width', '200%');
  haloFilter.setAttribute('height', '200%');
  const haloBlur = document.createElementNS(SVG_NS, 'feGaussianBlur');
  haloBlur.setAttribute('stdDeviation', '3');
  haloBlur.setAttribute('result', 'blur');
  const haloMerge = document.createElementNS(SVG_NS, 'feMerge');
  for (const ref of ['blur', 'blur', 'SourceGraphic']) {
    const node = document.createElementNS(SVG_NS, 'feMergeNode');
    node.setAttribute('in', ref);
    haloMerge.appendChild(node);
  }
  haloFilter.appendChild(haloBlur);
  haloFilter.appendChild(haloMerge);
  defs.appendChild(haloFilter);

  // Mid filter — lighter bloom for the middle stroke layer.
  const midFilter = document.createElementNS(SVG_NS, 'filter');
  midFilter.setAttribute('id', MID_FILTER_ID);
  midFilter.setAttribute('x', '-50%');
  midFilter.setAttribute('y', '-50%');
  midFilter.setAttribute('width', '200%');
  midFilter.setAttribute('height', '200%');
  const midBlur = document.createElementNS(SVG_NS, 'feGaussianBlur');
  midBlur.setAttribute('stdDeviation', '0.9');
  midBlur.setAttribute('result', 'blur');
  const midMerge = document.createElementNS(SVG_NS, 'feMerge');
  for (const ref of ['blur', 'SourceGraphic']) {
    const node = document.createElementNS(SVG_NS, 'feMergeNode');
    node.setAttribute('in', ref);
    midMerge.appendChild(node);
  }
  midFilter.appendChild(midBlur);
  midFilter.appendChild(midMerge);
  defs.appendChild(midFilter);

  svg.appendChild(defs);

  // Insert as first child of the stage so future SSR / rerenders that
  // append cards don't push it off the dom tree.
  stage.insertBefore(svg, stage.firstChild);
  return svg;
}

/** Build a triple-stroke representation of a single sub-path. Returns
 *  the three created elements so the caller can drive their fade.    */
function appendTripleStroke(
  svg: SVGSVGElement,
  d: string,
  accentColor: string,
  /** Width multiplier — branches use 0.7 so they feel thinner than
   *  the main bolt without needing a separate parameter set.         */
  scale: number,
): SVGPathElement[] {
  const halo = document.createElementNS(SVG_NS, 'path') as SVGPathElement;
  halo.setAttribute('d', d);
  halo.setAttribute('fill', 'none');
  halo.setAttribute('stroke-width', String((3.5 * scale).toFixed(2)));
  halo.setAttribute('stroke-linecap', 'round');
  halo.setAttribute('stroke-linejoin', 'miter');
  halo.setAttribute('stroke-miterlimit', '2');
  halo.setAttribute('filter', `url(#${HALO_FILTER_ID})`);
  halo.style.stroke = accentColor;
  halo.style.opacity = '0.30';

  const mid = document.createElementNS(SVG_NS, 'path') as SVGPathElement;
  mid.setAttribute('d', d);
  mid.setAttribute('fill', 'none');
  mid.setAttribute('stroke-width', String((1.6 * scale).toFixed(2)));
  mid.setAttribute('stroke-linecap', 'round');
  mid.setAttribute('stroke-linejoin', 'miter');
  mid.setAttribute('stroke-miterlimit', '2');
  mid.setAttribute('filter', `url(#${MID_FILTER_ID})`);
  mid.style.stroke = accentColor;
  mid.style.opacity = '0.55';

  const core = document.createElementNS(SVG_NS, 'path') as SVGPathElement;
  core.setAttribute('d', d);
  core.setAttribute('fill', 'none');
  core.setAttribute('stroke', '#ffffff');
  core.setAttribute('stroke-width', String((0.8 * scale).toFixed(2)));
  core.setAttribute('stroke-linecap', 'round');
  core.setAttribute('stroke-linejoin', 'miter');
  core.setAttribute('stroke-miterlimit', '2');
  core.style.opacity = '0.75';

  svg.appendChild(halo);
  svg.appendChild(mid);
  svg.appendChild(core);
  return [halo, mid, core];
}

function appendImpactFlash(
  svg: SVGSVGElement,
  x: number,
  y: number,
  accentColor: string,
): SVGCircleElement[] {
  // Outer accent halo at the strike point.
  const halo = document.createElementNS(SVG_NS, 'circle') as SVGCircleElement;
  halo.setAttribute('cx', x.toFixed(1));
  halo.setAttribute('cy', y.toFixed(1));
  halo.setAttribute('r', '10');
  halo.setAttribute('filter', `url(#${HALO_FILTER_ID})`);
  halo.style.fill = accentColor;
  halo.style.opacity = '0.40';

  // White-hot inner spark.
  const spark = document.createElementNS(SVG_NS, 'circle') as SVGCircleElement;
  spark.setAttribute('cx', x.toFixed(1));
  spark.setAttribute('cy', y.toFixed(1));
  spark.setAttribute('r', '2.5');
  spark.setAttribute('fill', '#ffffff');
  spark.style.opacity = '0.7';

  svg.appendChild(halo);
  svg.appendChild(spark);
  return [halo, spark];
}

/**
 * Wire the lightning effect onto a single galaxy stage.
 */
export function initCoreEffects(stage: HTMLElement): void {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const overlay = ensureOverlay(stage);

  // Tracks which card the cursor is currently over, so internal
  // pointerover events (bubbling up from child nodes of the same
  // card) don't re-fire the bolt. Cleared only when the cursor
  // truly leaves the card boundary, after which a re-entry can
  // legitimately fire a fresh strike.
  let currentCard: HTMLElement | null = null;

  /** Fire one bolt FROM the card centre TO the open book in the
   *  background image. Direction matters — the user perceives the
   *  card as the active object that "discharges" toward the central
   *  book of knowledge, not the other way around.                    */
  const emitBolt = (card: HTMLElement): void => {
    const stageRect = stage.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    if (stageRect.width === 0 || stageRect.height === 0) return;

    overlay.setAttribute(
      'viewBox',
      `0 0 ${stageRect.width.toFixed(1)} ${stageRect.height.toFixed(1)}`,
    );

    // Source = card centre.
    // Target = the open-book glyph inside the scene-background PNG,
    // located at runtime via findBookInStage(). Falls back to stage
    // centre only if the bg image hasn't loaded (rare — the strike
    // happens on hover, well after page load).
    const sx = cardRect.left - stageRect.left + cardRect.width / 2;
    const sy = cardRect.top  - stageRect.top  + cardRect.height / 2;

    const book = findBookInStage(stage);
    const tx = book?.x ?? stageRect.width / 2;
    const ty = book?.y ?? stageRect.height / 2;

    const dist = Math.hypot(tx - sx, ty - sy);
    if (dist < 24) return; // Card sits on the book — skip.

    const kind = card.dataset.kind ?? '';
    const accentColor = COLOR_BY_KIND[kind] ?? 'var(--yuval-galaxy-accent-cyan)';

    const { main, branches } = buildLightning(sx, sy, tx, ty);

    // Render layers: main bolt + branches + origin spark + impact flash.
    const elements: SVGElement[] = [];
    elements.push(...appendTripleStroke(overlay, main, accentColor, 1));
    for (const b of branches) {
      elements.push(...appendTripleStroke(overlay, b, accentColor, 0.7));
    }
    // Origin spark — at the card centre, where the bolt leaves. Smaller,
    // signalling departure rather than impact.
    const origin = appendImpactFlash(overlay, sx, sy, accentColor);
    origin[0].setAttribute('r', '6');
    origin[1].setAttribute('r', '1.8');
    // Impact flash — at the book centre, where the bolt strikes. Larger,
    // brighter; this is the focal point of the discharge.
    const flash = appendImpactFlash(overlay, tx, ty, accentColor);

    // Lifecycle timing — instant-on, brief hold, opacity fade. Real
    // lightning is a flash, not a beam draw. One-shot per card entry,
    // so the timing is tightened to feel like a single crack of
    // discharge rather than an animation.
    const holdMs = reducedMotion ? 220 : 60;
    const fadeMs = reducedMotion ? 320 : 200;

    const all: SVGElement[] = [...elements, ...flash, ...origin];
    all.forEach((el) => {
      el.style.transition = `opacity ${fadeMs}ms ease-out`;
    });

    window.setTimeout(() => {
      all.forEach((el) => { el.style.opacity = '0'; });
    }, holdMs);

    window.setTimeout(() => {
      all.forEach((el) => el.remove());
    }, holdMs + fadeMs + 40);
  };

  const onCardOver = (event: PointerEvent): void => {
    const target = event.target as Element | null;
    const card = target?.closest<HTMLElement>('[data-galaxy-card]');
    if (!card) return;
    // Same card as before — pointerover bubbled from a descendant.
    // Don't re-fire; the strike already happened on initial entry.
    if (currentCard === card) return;
    currentCard = card;
    emitBolt(card);
  };

  const onCardOut = (event: PointerEvent): void => {
    const target = event.target as Element | null;
    const card = target?.closest<HTMLElement>('[data-galaxy-card]');
    if (!card) return;
    // pointerout fires every time the cursor crosses an internal
    // element boundary, even while still inside the card. Use
    // relatedTarget — where the cursor is going next — to filter
    // those out. Only clear `currentCard` on a true exit so the
    // NEXT real entry can fire a fresh bolt.
    const related = event.relatedTarget as Node | null;
    if (related && card.contains(related)) return;
    if (currentCard === card) currentCard = null;
  };

  stage.addEventListener('pointerover', onCardOver);
  stage.addEventListener('pointerout', onCardOut);
}
