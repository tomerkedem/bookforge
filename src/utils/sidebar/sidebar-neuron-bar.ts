/**
 * Neuron particle bar for the sidebar's overall progress track.
 *
 * Replaces the static gradient fill with a canvas overlay where ~80
 * small colored particles oscillate gently around fixed anchor
 * positions along the bar. Particle visibility encodes progress:
 * particles in the "filled" zone (left of `currentPct%`) glow at full
 * opacity, particles past the leading edge fade to nearly invisible.
 *
 * The bar is a single instance per page — cheap to keep a continuous
 * RAF loop running without active/inactive split (unlike per-chapter
 * tubes, which can run 18 at a time).
 *
 * `prefers-reduced-motion: reduce` collapses the animation to a single
 * static frame at the correct percentage — particles still convey
 * progress, just without wobble or flicker.
 */

const PARTICLE_COUNT = 80;
const FADE_RANGE_PX = 14;

/** Five fixed RGB colors, mixed randomly across particles. Mirrors
 *  the per-chapter tube palette so the two indicators feel related. */
const COLORS: ReadonlyArray<readonly [number, number, number]> = [
  [201, 162, 39],   // gold
  [167, 139, 250],  // purple
  [74, 222, 128],   // green
  [96, 165, 250],   // blue
  [248, 113, 113],  // pink
];

/** Math / ML glyphs that each particle is "born with" and keeps for
 *  its whole life. Chosen to feel native to a Hebrew/English AI book
 *  audience: lowercase Greek that ML papers actually use heavily,
 *  plus the four most-recognized operators. */
const SYMBOLS: readonly string[] = [
  'λ', 'θ', 'α', 'β', 'μ', 'σ', 'π', 'ε',
  'γ', 'δ', 'φ', 'ψ', '∇', '∂', 'Σ', 'Ω',
];

const FONT_STACK =
  '"Cambria Math", "STIX Two Math", "Latin Modern Math", Cambria, "Times New Roman", serif';

interface Particle {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  wobbleAmpX: number;
  wobbleAmpY: number;
  wobbleSpeedX: number;
  wobbleSpeedY: number;
  wobblePhaseX: number;
  wobblePhaseY: number;
  fontSize: number;
  symbol: string;
  color: readonly [number, number, number];
  baseOpacity: number;
  flickerSpeed: number;
  flickerPhase: number;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export class NeuronBar {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private particles: Particle[] = [];
  private targetPct: number;
  private currentPct: number;
  private rafId: number | null = null;
  private dpr: number;
  private width = 0;
  private height = 0;
  private destroyed = false;
  private reducedMotion: boolean;
  private resizeObserver: ResizeObserver | null = null;
  private rtl: boolean;

  constructor(canvas: HTMLCanvasElement, initialPct: number) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    this.reducedMotion = prefersReducedMotion();
    /* Layout direction is detected by walking up to the nearest
       directional ancestor. CSS-mirroring the canvas would also
       mirror the glyphs (ε would render as ɜ, etc.), so direction is
       handled in the draw math instead. */
    this.rtl = !!canvas.closest('[dir="rtl"], .unified-sidebar-rtl');

    const pct = Math.max(0, Math.min(100, initialPct));
    this.targetPct = pct;
    this.currentPct = pct;

    this.measureAndResize();
    this.particles = this.createParticles();
    this.renderStatic();

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.handleResize());
      this.resizeObserver.observe(canvas);
    }

    if (!this.reducedMotion) this.startLoop();
  }

  setPct(pct: number): void {
    if (this.destroyed) return;
    this.targetPct = Math.max(0, Math.min(100, pct));
    if (this.reducedMotion) {
      /* No tween in reduced-motion mode — snap and repaint once. */
      this.currentPct = this.targetPct;
      this.renderStatic();
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.stopLoop();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.width, this.height);
    }
    this.ctx = null;
  }

  /** Recompute canvas size from its CSS box and reset the DPR
   *  transform. Called on construction and on resize. */
  private measureAndResize(): void {
    const rect = this.canvas.getBoundingClientRect();
    /* getBoundingClientRect can return 0 in detached / display:none
       scenarios. Fall back to offset dimensions so we still produce a
       sane (non-NaN) canvas. */
    const cssWidth = rect.width || this.canvas.offsetWidth || 1;
    const cssHeight = rect.height || this.canvas.offsetHeight || 1;
    this.width = cssWidth;
    this.height = cssHeight;
    this.canvas.width = Math.max(1, Math.round(cssWidth * this.dpr));
    this.canvas.height = Math.max(1, Math.round(cssHeight * this.dpr));
    if (this.ctx) {
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }
  }

  private handleResize(): void {
    if (this.destroyed) return;
    const prevW = this.width;
    const prevH = this.height;
    this.measureAndResize();
    if (this.width === prevW && this.height === prevH) return;
    /* Re-anchor particles to the new geometry. Phases / amplitudes
       are kept so the animation continues to feel "alive" rather than
       resetting cold. */
    this.particles = this.createParticles(this.particles);
    if (this.reducedMotion || !this.rafId) this.renderStatic();
  }

  private createParticles(seed?: Particle[]): Particle[] {
    const out: Particle[] = [];
    const w = this.width;
    const h = this.height;
    /* Vertical spread: keep particles within the bar by clamping the
       baseY offset to half-height minus the largest possible radius. */
    const verticalRange = Math.max(0, h - 4);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const prev = seed?.[i];
      const baseX = (i / PARTICLE_COUNT) * w + (Math.random() - 0.5) * 4;
      const baseY = h * 0.5 + (Math.random() - 0.5) * verticalRange;
      out.push({
        baseX,
        baseY,
        x: baseX,
        y: baseY,
        wobbleAmpX: prev?.wobbleAmpX ?? 1.5 + Math.random() * 3,
        wobbleAmpY: prev?.wobbleAmpY ?? 1 + Math.random() * 1.8,
        wobbleSpeedX: prev?.wobbleSpeedX ?? 0.0008 + Math.random() * 0.0018,
        wobbleSpeedY: prev?.wobbleSpeedY ?? 0.0006 + Math.random() * 0.0014,
        wobblePhaseX: prev?.wobblePhaseX ?? Math.random() * 2 * Math.PI,
        wobblePhaseY: prev?.wobblePhaseY ?? Math.random() * 2 * Math.PI,
        /* Font size 7–9.5 px keeps glyphs readable at 14px-tall track
           without crowding when 80 particles overlap. */
        fontSize: prev?.fontSize ?? 7 + Math.random() * 2.5,
        symbol: prev?.symbol ?? SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        color: prev?.color ?? COLORS[Math.floor(Math.random() * COLORS.length)],
        baseOpacity: prev?.baseOpacity ?? 0.55 + Math.random() * 0.4,
        flickerSpeed: prev?.flickerSpeed ?? 0.001 + Math.random() * 0.002,
        flickerPhase: prev?.flickerPhase ?? Math.random() * 2 * Math.PI,
      });
    }
    return out;
  }

  private startLoop(): void {
    if (this.rafId !== null) return;
    const tick = (t: number) => {
      if (this.destroyed) {
        this.rafId = null;
        return;
      }
      const diff = this.targetPct - this.currentPct;
      if (Math.abs(diff) > 0.01) {
        this.currentPct += diff * 0.06;
      } else {
        this.currentPct = this.targetPct;
      }
      this.renderFrame(t);
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /** Single-frame render at t=0 — no wobble, no flicker. Used for
   *  reduced-motion mode and for the initial paint before RAF starts. */
  private renderStatic(): void {
    for (const p of this.particles) {
      p.x = p.baseX;
      p.y = p.baseY;
    }
    this.draw(0, /* applyMotion */ false);
  }

  private renderFrame(t: number): void {
    for (const p of this.particles) {
      p.x = p.baseX + Math.sin(t * p.wobbleSpeedX + p.wobblePhaseX) * p.wobbleAmpX;
      p.y = p.baseY + Math.sin(t * p.wobbleSpeedY + p.wobblePhaseY) * p.wobbleAmpY;
    }
    this.draw(t, /* applyMotion */ true);
  }

  private draw(t: number, applyMotion: boolean): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const w = this.width;
    const h = this.height;
    ctx.clearRect(0, 0, w, h);

    const pct = this.currentPct;
    const fillEndX = (pct / 100) * w;
    const fullyFilled = pct >= 99.5;

    /* Set text rendering mode once. textBaseline=middle + textAlign
       =center mean fillText(symbol, x, y) draws the glyph centered
       on (x, y) — the same anchor model the circle drawing used. */
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    for (const p of this.particles) {
      const flicker = applyMotion
        ? 0.78 + 0.22 * Math.sin(t * p.flickerSpeed + p.flickerPhase)
        : 1;

      /* Map physical (canvas-space) x to "logical" x measured from
         the inline-start side of the bar. In LTR that's the canvas
         left edge; in RTL it's the canvas right edge. The fill math
         below works the same in both directions. */
      const logicalX = this.rtl ? w - p.baseX : p.baseX;

      let opacity: number;
      if (fullyFilled) {
        opacity = p.baseOpacity * flicker;
      } else if (logicalX <= fillEndX) {
        const distFromEdge = fillEndX - logicalX;
        if (distFromEdge < FADE_RANGE_PX) {
          opacity = p.baseOpacity * (distFromEdge / FADE_RANGE_PX) * flicker;
        } else {
          opacity = p.baseOpacity * flicker;
        }
      } else {
        /* Past the leading edge: ghosted to near-zero so the contrast
           between "filled" and "empty" zones reads sharply. The < 0.02
           skip below culls almost all of these — only the brightest
           flicker peaks survive, keeping the empty zone alive with
           the faintest occasional twinkle rather than dead. */
        opacity = 0.018 * flicker;
      }

      if (opacity < 0.02) continue;

      const [r, g, b] = p.color;
      ctx.fillStyle = `rgba(${r},${g},${b},${opacity})`;
      ctx.font = `${p.fontSize.toFixed(2)}px ${FONT_STACK}`;
      ctx.fillText(p.symbol, p.x, p.y);
    }
  }
}
