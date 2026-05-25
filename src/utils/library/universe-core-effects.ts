/**
 * Universe core micro-interaction — a calm "connection thread".
 *
 *   When a card becomes the selected / centered station it draws a
 *   soft luminous thread to the knowledge core, then gently fades.
 *   This replaces the previous hover-triggered lightning bolt.
 *
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │ Why this design                                                 │
 *   │                                                                 │
 *   │  • Trigger — selection, not hover. Hover is high-frequency and  │
 *   │    low-intent; a cross-screen effect there reads as noise.      │
 *   │    Selection is a deliberate moment, and it works on touch too  │
 *   │    — a tap centres a card, and mobile auto-centres one on load. │
 *   │  • Visual — one designed, deterministic curve. No jagged bolt,  │
 *   │    no random branches: a connection line, not an electric      │
 *   │    strike. Calmer reads as more premium on a knowledge surface. │
 *   │  • Target — the stage centre, which IS the orbit centre (cards  │
 *   │    are positioned top:50% / left:50% of the stage). It is       │
 *   │    deterministic and decoupled from the background image, whose │
 *   │    object-fit math the old bolt replayed — and which broke the  │
 *   │    aim every time the background moved.                         │
 *   └────────────────────────────────────────────────────────────────┘
 *
 *   Lifecycle: draw-in (stroke-dashoffset, ~460ms ease-out) → brief
 *   hold → opacity fade-out. One-shot per selection; only one thread
 *   is ever on screen; nodes self-remove after the fade.
 *
 *   Reduced motion: the draw-in is skipped — the thread fades in at
 *   full length and fades out (opacity only, no travelling motion).
 *
 *   Cost: zero idle work. A MutationObserver on `data-pos` drives it;
 *   thread nodes are created on demand and removed after the fade.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const GLOW_FILTER_ID = 'yuval-thread-glow';

/** Card kind → CSS variable for the thread's accent tint. Mirrors the
 *  `.galaxy-card[data-kind="…"]` rules in index.astro.                 */
const COLOR_BY_KIND: Readonly<Record<string, string>> = {
  book:   'var(--yuval-galaxy-accent-gold)',
  lesson: 'var(--yuval-galaxy-accent-cyan)',
  series: 'var(--yuval-galaxy-accent-purple)',
};

/** Lifecycle timing (ms). Selection is an occasional, deliberate
 *  action, so a slightly graceful draw is appropriate — this is not a
 *  hundred-times-a-day UI animation. */
const DRAW_MS = 460;
const HOLD_MS = 240;
const FADE_MS = 420;
/** Strong ease-out — the thread is entering, so it starts fast. */
const DRAW_EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';
/** Below this card→core distance there is nothing meaningful to draw. */
const MIN_DISTANCE = 40;

/**
 * Lazily inject the SVG overlay + one soft glow filter. Idempotent.
 *
 * The `data-core-lightning` attribute is kept (despite the effect no
 * longer being lightning) so the existing overlay CSS in index.astro
 * — absolute fill, blend mode, light-mode softening — keeps applying
 * unchanged. Renaming it would need a matching CSS edit.
 */
function ensureOverlay(stage: HTMLElement): SVGSVGElement {
  const existing = stage.querySelector<SVGSVGElement>(':scope > svg[data-core-lightning]');
  if (existing) return existing;

  const svg = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement;
  svg.setAttribute('data-core-lightning', '');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('preserveAspectRatio', 'none');

  const defs = document.createElementNS(SVG_NS, 'defs');
  const glow = document.createElementNS(SVG_NS, 'filter');
  glow.setAttribute('id', GLOW_FILTER_ID);
  glow.setAttribute('x', '-50%');
  glow.setAttribute('y', '-50%');
  glow.setAttribute('width', '200%');
  glow.setAttribute('height', '200%');
  const blur = document.createElementNS(SVG_NS, 'feGaussianBlur');
  blur.setAttribute('stdDeviation', '2.4');
  glow.appendChild(blur);
  defs.appendChild(glow);
  svg.appendChild(defs);

  // First child of the stage so later card re-renders never push it
  // off the DOM tree.
  stage.insertBefore(svg, stage.firstChild);
  return svg;
}

/** Build one stroke layer of the thread. `pathLength="1"` normalises
 *  the curve so the draw-in works with a dasharray/offset of 1
 *  regardless of the curve's real pixel length.                       */
function makeThreadPath(
  d: string,
  stroke: string,
  width: number,
  opacity: number,
): SVGPathElement {
  const p = document.createElementNS(SVG_NS, 'path') as SVGPathElement;
  p.setAttribute('d', d);
  p.setAttribute('fill', 'none');
  p.setAttribute('stroke-width', String(width));
  p.setAttribute('stroke-linecap', 'round');
  p.setAttribute('pathLength', '1');
  p.style.stroke = stroke;
  p.style.opacity = String(opacity);
  return p;
}

/** Draw one connection thread from a freshly-selected card to the
 *  knowledge core, then fade and clean it up. */
function emitThread(
  card: HTMLElement,
  stage: HTMLElement,
  overlay: SVGSVGElement,
  reducedMotion: boolean,
): void {
  const stageRect = stage.getBoundingClientRect();
  if (stageRect.width === 0 || stageRect.height === 0) return;

  // Card centre. Read now: the card's centre-transition has only just
  // started, so getBoundingClientRect still reports its orbit
  // position — which is where the thread should begin.
  const cardRect = card.getBoundingClientRect();
  const sx = cardRect.left - stageRect.left + cardRect.width / 2;
  const sy = cardRect.top - stageRect.top + cardRect.height / 2;

  // Target = stage centre = orbit centre = the knowledge core.
  const tx = stageRect.width / 2;
  const ty = stageRect.height / 2;

  const dx = tx - sx;
  const dy = ty - sy;
  const dist = Math.hypot(dx, dy);
  if (dist < MIN_DISTANCE) return; // card already on the core

  overlay.setAttribute(
    'viewBox',
    `0 0 ${stageRect.width.toFixed(1)} ${stageRect.height.toFixed(1)}`,
  );

  // Only ever one thread on screen — drop any still mid-fade.
  overlay.querySelectorAll('g[data-thread]').forEach((g) => g.remove());

  // Gentle, deterministic curve: the control point is the midpoint
  // pushed perpendicular to the card→core line by a fixed 10% of the
  // span. The same rotational sense for every card gives the threads
  // one subtle shared swirl instead of looking arbitrary.
  const mx = (sx + tx) / 2;
  const my = (sy + ty) / 2;
  const cx = mx + (-dy / dist) * dist * 0.1;
  const cy = my + (dx / dist) * dist * 0.1;
  const d =
    `M ${sx.toFixed(1)} ${sy.toFixed(1)} ` +
    `Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}`;

  const accent =
    COLOR_BY_KIND[card.dataset.kind ?? ''] ?? 'var(--yuval-galaxy-accent-cyan)';

  const group = document.createElementNS(SVG_NS, 'g') as SVGGElement;
  group.setAttribute('data-thread', '');

  // Two layers only: a soft blurred glow + a thin crisp core. Calm,
  // not the previous three-layer electric stack.
  const glow = makeThreadPath(d, accent, 3.2, 0.22);
  glow.setAttribute('filter', `url(#${GLOW_FILTER_ID})`);
  const core = makeThreadPath(d, accent, 1.4, 0.7);

  group.appendChild(glow);
  group.appendChild(core);
  overlay.appendChild(group);

  if (reducedMotion) {
    // No travelling motion: the thread is fully drawn and fades in.
    group.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 240, easing: 'ease', fill: 'forwards' },
    );
  } else {
    // Draw-in: the dash slides into view from the card end toward the
    // core, so the card visibly "reaches" the centre.
    [glow, core].forEach((p) => {
      p.style.strokeDasharray = '1';
      p.style.strokeDashoffset = '1';
      p.animate(
        [{ strokeDashoffset: '1' }, { strokeDashoffset: '0' }],
        { duration: DRAW_MS, easing: DRAW_EASE, fill: 'forwards' },
      );
    });
  }

  const drawDone = reducedMotion ? 240 : DRAW_MS;
  window.setTimeout(() => {
    group.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: FADE_MS, easing: 'ease', fill: 'forwards' },
    );
  }, drawDone + HOLD_MS);

  window.setTimeout(() => group.remove(), drawDone + HOLD_MS + FADE_MS + 60);
}

/**
 * Wire the connection-thread effect onto a single galaxy stage.
 *
 * A MutationObserver watches `data-pos` across the stage; when a card
 * becomes `data-pos="center"` (set by universe-layout.ts on selection,
 * and by the mobile auto-focus on load) the thread is drawn. Pointer
 * and touch behave identically — selection is the trigger, not hover.
 */
export function initCoreEffects(stage: HTMLElement): void {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const overlay = ensureOverlay(stage);

  const observer = new MutationObserver((records) => {
    for (const rec of records) {
      const card = rec.target as HTMLElement;
      if (card.dataset.pos !== 'center') continue;          // not a select
      if (!card.matches('[data-galaxy-card]')) continue;    // defensive
      emitThread(card, stage, overlay, reducedMotion);
    }
  });

  observer.observe(stage, {
    subtree: true,
    attributes: true,
    attributeFilter: ['data-pos'],
  });
}
