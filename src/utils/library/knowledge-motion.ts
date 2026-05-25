/**
 * Premium AI motion background for the library day mode.
 *
 * Sits ABOVE `knowledge-observatory-day-bg.png` and BELOW every UI
 * surface (cards, hero, side panels). Renders subtle floating
 * "knowledge particles" — warm amber dots — with thin connection lines
 * between near-neighbours. CSS handles the breathing glow and slow
 * flowing light paths next to this canvas layer; they are
 * intentionally split so each effect uses the cheapest available
 * primitive (CSS keyframes for steady, geometric motion; canvas only
 * for the per-particle physics it actually needs).
 *
 * Hard gates — the loop never starts if any match:
 *   1. <html> has `.dark` (night mode keeps its existing chrome).
 *   2. `prefers-reduced-motion: reduce` is set.
 *   3. The canvas element is missing from the DOM (page mismatch).
 *
 * Lifecycle:
 *   - First load / Astro `page-load`: a fresh instance boots and binds
 *     resize / visibility / (optional) mouse listeners.
 *   - Astro `before-swap`: the active instance stops, RAF is cancelled,
 *     listeners are removed, the canvas is cleared.
 *   - Theme toggle (html.dark ↔ light): a MutationObserver on
 *     <html>'s class attribute starts the loop when the user enters
 *     day mode and stops it when they leave.
 *   - `document.visibilitychange`: RAF pauses on hidden tabs.
 *
 * Performance budget:
 *   - 60 particles on desktop, 24 on mobile. n² connection scan stays
 *     ≤ 4k pair checks per frame in the worst case (60×60), well
 *     inside a single-digit ms even on integrated GPUs.
 *   - Only `clearRect` + `arc` + `moveTo/lineTo` — no per-frame
 *     allocations, no shadows, no canvas filters.
 *   - DPR clamped to 2× so retina displays don't quadruple fill cost.
 *   - Mouse parallax is disabled when `(hover: hover) and (pointer:
 *     fine)` is false (touch + stylus devices skip the listeners
 *     entirely; nothing to throttle, nothing to debounce).
 */

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  baseOpacity: number;
  pulseOffset: number;
  /** Cached render position after parallax shift (set inside the loop, read by the connection pass). */
  px: number;
  py: number;
};

/** Warm amber sampled near the observatory rings in the PNG. RGB only; alpha varies per use. */
const PARTICLE_COLOR = '187, 142, 76';
/** Pixel distance (CSS px) under which two particles are linked by a hairline. */
const CONNECT_DISTANCE = 140;
const DESKTOP_COUNT = 60;
const MOBILE_COUNT = 24;
/** Sentinel meaning "mouse is off-canvas" — chosen far below any real coordinate. */
const MOUSE_OFFSCREEN = -9999;

class KnowledgeMotion {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private raf = 0;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private mouseX = MOUSE_OFFSCREEN;
  private mouseY = MOUSE_OFFSCREEN;
  private parallaxEnabled = false;
  private active = false;
  private themeObserver: MutationObserver | null = null;

  init() {
    if (this.active) return;
    if (typeof window === 'undefined') return;

    // Reduced-motion users get zero canvas animation. The MutationObserver
    // is also skipped — if they later toggle the preference off mid-session
    // it'll be picked up on the next page-load.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Hook the theme observer first so a future light↔dark toggle is
    // always tracked, even if we bail out below because we're currently
    // in dark mode.
    this.watchTheme();

    if (document.documentElement.classList.contains('dark')) return;

    this.canvas = document.querySelector<HTMLCanvasElement>('[data-knowledge-motion-canvas]');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d', { alpha: true });
    if (!this.ctx) return;

    this.parallaxEnabled = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const count = this.parallaxEnabled ? DESKTOP_COUNT : MOBILE_COUNT;

    this.resize();
    this.particles = this.makeParticles(count);

    window.addEventListener('resize', this.onResize);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    if (this.parallaxEnabled) {
      // Listen on window so the canvas's `pointer-events: none` doesn't
      // block us, and so coordinates resolve consistently regardless of
      // which DOM layer the cursor is currently over.
      window.addEventListener('mousemove', this.onMouseMove);
      window.addEventListener('mouseout', this.onMouseLeave);
    }

    this.active = true;
    this.loop();
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.active = false;

    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseout', this.onMouseLeave);

    if (this.themeObserver) {
      this.themeObserver.disconnect();
      this.themeObserver = null;
    }

    if (this.ctx) this.ctx.clearRect(0, 0, this.width, this.height);
  }

  private watchTheme() {
    if (this.themeObserver) return;
    this.themeObserver = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      if (isDark && this.active) {
        this.stopLoopOnly();
      } else if (!isDark && !this.active) {
        // Re-enter day mode mid-session: spin the loop back up. We
        // reuse the same instance, so the canvas reference and
        // listeners persist across the toggle.
        this.reactivate();
      }
    });
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  /** Pause the canvas without tearing down listeners / observer. */
  private stopLoopOnly() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.active = false;
    if (this.ctx) this.ctx.clearRect(0, 0, this.width, this.height);
  }

  /** Re-enter the loop after a theme toggle without re-binding listeners. */
  private reactivate() {
    if (!this.canvas) {
      this.canvas = document.querySelector<HTMLCanvasElement>('[data-knowledge-motion-canvas]');
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d', { alpha: true });
      if (!this.ctx) return;
      this.resize();
      this.particles = this.makeParticles(this.parallaxEnabled ? DESKTOP_COUNT : MOBILE_COUNT);
    }
    this.active = true;
    this.loop();
  }

  private makeParticles(count: number): Particle[] {
    const arr: Particle[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        // Velocity in CSS px per frame at ~60fps. Slow enough that the
        // field reads as "drifting," fast enough that it doesn't feel
        // frozen.
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: 0.6 + Math.random() * 1.4,
        baseOpacity: 0.22 + Math.random() * 0.32,
        // Random phase so pulses don't strobe in sync.
        pulseOffset: Math.random() * Math.PI * 2,
        px: 0,
        py: 0,
      });
    }
    return arr;
  }

  private resize = () => {
    if (!this.canvas || !this.ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    // Clamp DPR at 2 — past that, the visual benefit on a soft particle
    // field is invisible while the fill cost continues to climb.
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.max(1, Math.floor(this.width * this.dpr));
    this.canvas.height = Math.max(1, Math.floor(this.height * this.dpr));
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  };

  private onResize = () => {
    this.resize();
    // Reseed so wrap-around stays correct after viewport changes
    // (orientation flip, dev-tools dock toggle, etc.).
    this.particles = this.makeParticles(this.parallaxEnabled ? DESKTOP_COUNT : MOBILE_COUNT);
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
  };

  private onMouseLeave = () => {
    this.mouseX = MOUSE_OFFSCREEN;
    this.mouseY = MOUSE_OFFSCREEN;
  };

  private onVisibilityChange = () => {
    if (document.hidden) {
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = 0;
    } else if (this.active && !this.raf) {
      this.loop();
    }
  };

  private loop = () => {
    if (!this.active || !this.ctx) return;
    this.raf = requestAnimationFrame(this.loop);

    const t = performance.now() / 1000;
    this.ctx.clearRect(0, 0, this.width, this.height);

    const ps = this.particles;
    const mouseActive = this.mouseX > MOUSE_OFFSCREEN + 1;

    // Pass 1 — integrate, wrap, apply parallax, render the dots.
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      p.x += p.vx;
      p.y += p.vy;

      // Toroidal wrap with a small margin so particles don't pop in/out
      // exactly at the edge.
      if (p.x < -10) p.x = this.width + 10;
      else if (p.x > this.width + 10) p.x = -10;
      if (p.y < -10) p.y = this.height + 10;
      else if (p.y > this.height + 10) p.y = -10;

      // Parallax — particles near the cursor drift toward it gently.
      // Falls off linearly past 240px so the effect is localised, not
      // a full-field warp.
      let dx = 0;
      let dy = 0;
      if (mouseActive) {
        const mdx = this.mouseX - p.x;
        const mdy = this.mouseY - p.y;
        const md2 = mdx * mdx + mdy * mdy;
        if (md2 < 240 * 240) {
          const md = Math.sqrt(md2);
          const shift = (240 - md) / 240;
          dx = mdx * shift * 0.04;
          dy = mdy * shift * 0.04;
        }
      }

      p.px = p.x + dx;
      p.py = p.y + dy;

      // Brightness pulse — slow sin wave so the field "breathes."
      const pulse = 0.65 + 0.35 * Math.sin(t * 0.55 + p.pulseOffset);
      const opacity = p.baseOpacity * pulse;

      // Core dot.
      this.ctx.beginPath();
      this.ctx.arc(p.px, p.py, p.r, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${PARTICLE_COLOR}, ${opacity})`;
      this.ctx.fill();

      // Soft halo — wider, ~10% of core opacity. Cheaper than a CSS/SVG
      // blur and reads as a glow against the cream background.
      this.ctx.beginPath();
      this.ctx.arc(p.px, p.py, p.r * 3.2, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${PARTICLE_COLOR}, ${opacity * 0.10})`;
      this.ctx.fill();
    }

    // Pass 2 — connection hairlines. Distance² compared inline to avoid
    // a Math.sqrt for every pair that fails the gate.
    const maxD2 = CONNECT_DISTANCE * CONNECT_DISTANCE;
    this.ctx.lineWidth = 0.5;
    for (let i = 0; i < ps.length; i++) {
      const a = ps[i];
      for (let j = i + 1; j < ps.length; j++) {
        const b = ps[j];
        const dx = a.px - b.px;
        const dy = a.py - b.py;
        const d2 = dx * dx + dy * dy;
        if (d2 < maxD2) {
          const d = Math.sqrt(d2);
          const alpha = (1 - d / CONNECT_DISTANCE) * 0.16;
          this.ctx.strokeStyle = `rgba(${PARTICLE_COLOR}, ${alpha})`;
          this.ctx.beginPath();
          this.ctx.moveTo(a.px, a.py);
          this.ctx.lineTo(b.px, b.py);
          this.ctx.stroke();
        }
      }
    }
  };
}

let instance: KnowledgeMotion | null = null;

function bootstrap() {
  if (instance) instance.stop();
  instance = new KnowledgeMotion();
  instance.init();
}

function teardown() {
  if (instance) {
    instance.stop();
    instance = null;
  }
}

/**
 * Entry point — called from the page script in `src/pages/index.astro`.
 * Handles initial load, Astro View Transitions navigation
 * (`page-load`), and pre-swap cleanup (`before-swap`) in one place so
 * the page-side wiring stays a single call.
 */
export function initKnowledgeMotion() {
  if (typeof document === 'undefined') return;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
  } else {
    bootstrap();
  }
  document.addEventListener('astro:page-load', bootstrap);
  document.addEventListener('astro:before-swap', teardown);
}
