/**
 * Per-chapter progress arc for the chapter sidebar badges.
 *
 * (Module/class names retain "ParticleTube" wording for legacy
 * compatibility; the visual is now a clean two-tone gradient arc
 * with a soft glow + breathing animation, not a particle tube.)
 *
 * Each chapter badge (`.usb-node`, 32×32) gets a sibling canvas that
 * paints:
 *   - A faint gray full-circle "track" (always visible, frames the
 *     ring on chapters at 0%).
 *   - A thin purple gradient arc from 12 o'clock clockwise to the
 *     chapter's scroll-progress angle, with a soft purple glow.
 *
 * The active chapter's arc breathes (subtle opacity oscillation) and
 * tweens between target pcts. All other arcs paint a single static
 * frame when their pct is set — no continuous animation off-screen.
 *
 * `prefers-reduced-motion: reduce` collapses the active arc to static
 * frames too (still tweens between pcts, just no breathing).
 */

import { getChapterScrollPercent } from './sidebar-storage';
import { getBookSlug } from './sidebar-helpers';

const SIZE = 32;
const CENTER = SIZE / 2;
const START_ANGLE = -Math.PI / 2;
const RING_RADIUS = 14;
const TRACK_WIDTH = 1;
const ARC_WIDTH = 1.5;
const TRACK_COLOR = 'rgba(127, 127, 127, 0.22)';

/* Two color palettes — purple for in-progress chapters, green for
   completed ones. The active chapter's arc breathes in whichever
   palette is currently active. */
const PURPLE_LIGHT = '#a89cf5';
const PURPLE_MID = '#7c5cf0';
const PURPLE_DARK = '#5b3fd8';
const PURPLE_GLOW = 'rgba(124, 92, 240, 0.55)';

const GREEN_LIGHT = '#86efac';
const GREEN_MID = '#22c55e';
const GREEN_DARK = '#1f8a4d';
const GREEN_GLOW = 'rgba(34, 197, 94, 0.55)';

/* Gold palette — rendered as a full ring on chapters that haven't
   been opened yet (pct === 0 and not completed). Signals "pristine,
   waiting to be read", visually distinct from both the in-progress
   purple and the completed green. */
const GOLD_LIGHT = '#ffe28a';
const GOLD_MID = '#d4af37';
const GOLD_DARK = '#b8860b';
const GOLD_GLOW = 'rgba(212, 175, 55, 0.55)';

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export class ParticleTube {
  private ctx: CanvasRenderingContext2D | null;
  private targetPct: number;
  private currentPct: number;
  private active: boolean;
  private completed = false;
  private rafId: number | null = null;
  private dpr: number;
  private destroyed = false;
  private reducedMotion: boolean;

  constructor(canvas: HTMLCanvasElement, initialPct: number, isActive: boolean) {
    this.ctx = canvas.getContext('2d');
    const pct = Math.max(0, Math.min(100, initialPct));
    this.targetPct = pct;
    this.currentPct = pct;
    this.active = false;
    this.reducedMotion = prefersReducedMotion();

    this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    canvas.width = SIZE * this.dpr;
    canvas.height = SIZE * this.dpr;
    canvas.style.width = `${SIZE}px`;
    canvas.style.height = `${SIZE}px`;
    if (this.ctx) this.ctx.scale(this.dpr, this.dpr);

    /* Always paint at least one frame so persisted progress shows
       immediately, before any animation starts. */
    this.draw(0, /* breathing */ false);

    if (isActive) this.setActive(true);
  }

  setPct(pct: number): void {
    if (this.destroyed) return;
    this.targetPct = Math.max(0, Math.min(100, pct));
    if (!this.active) {
      /* Inactive: snap to target and paint once. */
      this.currentPct = this.targetPct;
      this.draw(0, /* breathing */ false);
    }
  }

  /** Switch the arc palette. true = green (chapter completed),
   *  false = purple (chapter in progress / not yet read). Repaints
   *  immediately on inactive arcs; active arcs pick it up on the
   *  next RAF tick. */
  setCompleted(completed: boolean): void {
    if (this.destroyed) return;
    if (completed === this.completed) return;
    this.completed = completed;
    if (!this.active) {
      this.draw(0, /* breathing */ false);
    }
  }

  setActive(isActive: boolean): void {
    if (this.destroyed) return;
    if (isActive === this.active) return;
    this.active = isActive;

    if (isActive) {
      this.startLoop();
    } else {
      this.stopLoop();
      /* Snap to target and freeze on a static frame for the inactive
         state. Avoids leaving a half-tweened pct on screen. */
      this.currentPct = this.targetPct;
      this.draw(0, /* breathing */ false);
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.stopLoop();
    if (this.ctx) {
      this.ctx.clearRect(0, 0, SIZE, SIZE);
    }
    this.ctx = null;
  }

  private startLoop(): void {
    if (this.rafId !== null) return;
    const tick = (t: number) => {
      if (!this.active || this.destroyed) {
        this.rafId = null;
        return;
      }
      const diff = this.targetPct - this.currentPct;
      if (Math.abs(diff) > 0.01) {
        this.currentPct += diff * 0.06;
      } else {
        this.currentPct = this.targetPct;
      }
      this.draw(t, /* breathing */ !this.reducedMotion);
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

  private draw(t: number, breathing: boolean): void {
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.clearRect(0, 0, SIZE, SIZE);

    const pct = this.currentPct;
    /* Three states drive the visual:
       - completed → green full ring
       - untouched (pct === 0) → gold full ring (pristine, waiting)
       - in progress → purple partial arc growing from 12 o'clock
       Untouched and completed both show a full ring; only the color
       differs. The gray track is drawn only when an arc would be
       partial (in-progress state) — a full-ring state paints over it
       anyway, so we skip it for cleanness. */
    const isUntouched = !this.completed && pct <= 0.5;
    const fullRing = this.completed || isUntouched;

    if (!fullRing) {
      ctx.strokeStyle = TRACK_COLOR;
      ctx.lineWidth = TRACK_WIDTH;
      ctx.lineCap = 'butt';
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, RING_RADIUS, 0, 2 * Math.PI);
      ctx.stroke();
    }

    /* Pick the palette per state. */
    let light: string;
    let mid: string;
    let dark: string;
    let glow: string;
    if (this.completed) {
      light = GREEN_LIGHT; mid = GREEN_MID; dark = GREEN_DARK; glow = GREEN_GLOW;
    } else if (isUntouched) {
      light = GOLD_LIGHT; mid = GOLD_MID; dark = GOLD_DARK; glow = GOLD_GLOW;
    } else {
      light = PURPLE_LIGHT; mid = PURPLE_MID; dark = PURPLE_DARK; glow = PURPLE_GLOW;
    }

    /* Two-tone gradient stroke: light at the start (12 o'clock),
       deepening as the arc grows. createConicGradient is supported in
       all modern engines (2022+); fall back to a single color where
       it isn't. */
    let stroke: CanvasGradient | string;
    const conicCtor = (ctx as CanvasRenderingContext2D & {
      createConicGradient?: (
        startAngle: number,
        x: number,
        y: number,
      ) => CanvasGradient;
    }).createConicGradient;
    if (typeof conicCtor === 'function') {
      const g = conicCtor.call(ctx, START_ANGLE, CENTER, CENTER);
      g.addColorStop(0, light);
      g.addColorStop(0.5, mid);
      g.addColorStop(1, dark);
      stroke = g;
    } else {
      stroke = mid;
    }

    /* Breathing: opacity oscillates 0.82–1.0 over ~3.4s. Active arcs
       only — keeps inactive chapters perfectly still. */
    const alpha = breathing
      ? 0.82 + 0.18 * (0.5 + 0.5 * Math.sin(t * 0.0018))
      : 1;
    ctx.globalAlpha = alpha;

    ctx.shadowBlur = 4;
    ctx.shadowColor = glow;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = ARC_WIDTH;
    ctx.lineCap = 'round';

    const endAngle = fullRing
      ? START_ANGLE + 2 * Math.PI
      : START_ANGLE + (pct / 100) * 2 * Math.PI;
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, RING_RADIUS, START_ANGLE, endAngle);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}

/** Registry of all live arcs, keyed by chapter id. Map name retained
 *  as `tubes` for legacy callers; values are the rewritten arc class. */
export const tubes = new Map<string, ParticleTube>();

/**
 * Wrap each `.usb-node` in a `.usb-node-wrap` (idempotent) and
 * instantiate a ParticleTube for every chapter that doesn't yet have
 * one. Reads persisted scroll progress from storage so the initial
 * frame matches reality.
 *
 * Should be called whenever the chapter list is (re)rendered. The
 * Astro template renders the rows once per page load; view
 * transitions persist them via `transition:persist`, so on a content
 * swap we only need to refresh arc state, not rebuild.
 */
export function ensureChapterTubes(activeChapterId: string | null): void {
  const book = getBookSlug();
  const rows = document.querySelectorAll<HTMLElement>('.usb-chapter[data-chapter-id]');

  rows.forEach(li => {
    const chId = li.dataset.chapterId || '';
    if (!chId) return;

    const link = li.querySelector<HTMLElement>('.usb-chapter-link');
    if (!link) return;

    let node = link.querySelector<HTMLElement>(':scope > .usb-node');
    let wrap = link.querySelector<HTMLElement>(':scope > .usb-node-wrap');

    if (!wrap) {
      wrap = document.createElement('span');
      wrap.className = 'usb-node-wrap';
      wrap.setAttribute('aria-hidden', 'true');

      if (node) {
        link.insertBefore(wrap, node);
        wrap.appendChild(node);
      } else {
        /* Defensive: if the node lives somewhere unexpected, leave it
           where it is and abort the wrap for this row. */
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.className = 'usb-particle-tube';
      canvas.setAttribute('aria-hidden', 'true');
      wrap.insertBefore(canvas, node);
    }

    if (!tubes.has(chId)) {
      const canvas = wrap.querySelector<HTMLCanvasElement>(':scope > canvas.usb-particle-tube');
      if (!canvas) return;
      const initialPct = book ? getChapterScrollPercent(book, chId) : 0;
      const tube = new ParticleTube(canvas, initialPct, chId === activeChapterId);
      tubes.set(chId, tube);
    } else if (chId === activeChapterId) {
      tubes.get(chId)!.setActive(true);
    }
  });

  /* Drop arcs whose chapters disappeared (rare — chapter list is
     stable per book — but keep the registry honest). */
  for (const id of Array.from(tubes.keys())) {
    if (!document.querySelector(`.usb-chapter[data-chapter-id="${id}"]`)) {
      tubes.get(id)?.destroy();
      tubes.delete(id);
    }
  }
}

/** Push the latest persisted scroll percent into every arc. Called
 *  on init, after completion changes, and after content swap. */
export function syncAllTubesFromStorage(): void {
  const book = getBookSlug();
  if (!book) return;
  tubes.forEach((tube, chId) => {
    tube.setPct(getChapterScrollPercent(book, chId));
  });
}

/** Toggle which arc is the "active" (animated) one. Pass null to
 *  deactivate all arcs. */
export function setActiveTube(chapterId: string | null): void {
  tubes.forEach((tube, id) => {
    tube.setActive(id === chapterId);
  });
}

/** Set live scroll percent on the active chapter's arc only. Used
 *  by the scroll listener on every tick. */
export function setActiveTubePct(chapterId: string, pct: number): void {
  const tube = tubes.get(chapterId);
  if (tube) tube.setPct(pct);
}
