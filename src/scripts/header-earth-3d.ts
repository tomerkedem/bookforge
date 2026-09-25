/**
 * header-earth-3d
 *
 * Tiny dedicated Three.js wrapper that paints the SMALL header globe
 * as a real miniature Earth. Built on top of `earth-rendering-core.ts`
 * (the shared visual source of truth): same texture, material, sun
 * direction, atmosphere shader and lighting model as the cinematic
 * overlay Earth, so the small globe that launches into the overlay is
 * recognizably the SAME object scaled up.
 *
 * What's different from the overlay wrapper — presentation knobs and
 * interaction surface only, never the visual model:
 *
 *   • Pixel-ratio cap 3 (vs 2). The canvas is ~34 CSS px; even at
 *     DPR 3 the backing buffer is ~100² pixels. The extra density
 *     keeps the silhouette, rim and specular crisp at tiny size.
 *   • Camera distance 3.55 (vs 3.85). The Earth fills more of the
 *     round canvas so no dead margin shows inside the circular clip.
 *     The host's flight math depends on this ratio (see
 *     MINI_SPHERE_SCALE in LanguageGlobeSelector.astro).
 *   • Brightness lift (exposure, ambient, ocean lift). Tuned at the
 *     real ~34 px size against both the light and dark headers: at
 *     overlay values the NASA Blue Marble collapses into a dark blob
 *     where sea and land can't be told apart. The lift is uniform
 *     (same sun, same terminator position, same atmosphere shader),
 *     only brighter.
 *   • powerPreference 'low-power' — no reason to wake a discrete GPU.
 *   • Render cadence: on demand. There is no idle loop; a frame is
 *     drawn on texture load, resize, focus changes and while the
 *     globe is being dragged or easing back to its region.
 *
 * Active-language orientation: the globe faces the active language's
 * focus point (`setFocus`). With a mouse or pen the user can drag it
 * to look around (`interactionTarget` receives the pointer events —
 * the canvas itself is pointer-events: none so the host button keeps
 * its normal click / keyboard behavior). When the pointer leaves, the
 * globe eases back to the language region. Touch never drags: a tap
 * opens the selector and vertical swipes keep scrolling the page.
 * A press that turned into a drag is reported once via `takeDrag()`
 * so the host can ignore the click that follows it.
 *
 * Reduced motion: dragging still works (it is user-driven), but the
 * return to the language region and focus changes snap instead of
 * easing.
 */

import {
  createEarthScene,
  rotationYForLng,
  wrapAngle,
  clamp,
  DEG,
  POLE_CLAMP,
} from './earth-rendering-core';

export interface HeaderEarthFocus {
  lat: number;
  lng: number;
}

export interface HeaderEarthOptions {
  /** Element that receives mouse/pen drags (the trigger button). */
  interactionTarget?: HTMLElement | null;
  reducedMotion?: boolean;
}

export interface HeaderEarthHandle {
  /** Stop rendering, dispose all GPU resources, remove listeners and
   *  the canvas. Safe to call more than once. */
  destroy(): void;
  /**
   * Face (lat, lng) — the active language's region. Eases there
   * unless `snap` is set (or reduced motion is on). An in-progress
   * drag is never interrupted; the new region becomes the place the
   * globe returns to once the pointer leaves.
   */
  setFocus(lat: number, lng: number, snap?: boolean): void;
  /** PNG data URL of the globe as currently drawn, or null before the
   *  Earth is revealed. Used as the launch-flight stand-in while the
   *  large globe's texture is still decoding. */
  snapshot(): string | null;
  /** True once if the last press was a drag, so the host can swallow
   *  the click that the browser dispatches right after pointerup. */
  takeDrag(): boolean;
  /** The mounted <canvas>. Host uses this only for cleanup hooks. */
  readonly canvas: HTMLCanvasElement;
}

// Radians per CSS pixel of drag. A ~34 px globe: a drag across its
// full width turns it about 50°, enough to explore without spinning.
const DRAG_SPEED = 0.025;
// A press that moves less than this is a click, not a drag.
const DRAG_THRESHOLD_PX = 4;
// Exponential ease rate for the return to the language region.
const RETURN_SPEED = 6;

export function createHeaderEarth(
  container: HTMLElement,
  initialFocus: HeaderEarthFocus | null = null,
  options: HeaderEarthOptions = {},
): HeaderEarthHandle {
  const reducedMotion = options.reducedMotion ?? false;
  const target = options.interactionTarget ?? null;

  const core = createEarthScene(container, {
    earthSegments: 96,
    atmosphereSegments: 64,
    pixelRatioCap: 3,
    cameraDistance: 3.55,
    // Rim band a little wider and the lit limb a little brighter than
    // the overlay so the atmosphere still registers at a few pixels.
    // The night-limb cap (0.18, in the shader) is unchanged, so the
    // lit/dark asymmetry that reads as real atmosphere is preserved.
    atmosphereRimExponent: 4.0,
    atmosphereMaxIntensityLit: 0.88,
    // Brightness lift tuned at the real header size in light and dark
    // themes (overlay: 1.12 / 0.55 / 0.3). Earlier 1.17 / 0.65 / 0.55
    // still left the Americas and the oceans reading as one dark mass.
    toneMappingExposure: 1.45,
    ambientIntensity: 1.05,
    oceanLift: 2.4,
    powerPreference: 'low-power',
    // Neutral dark color shown only if the WebP fails to load.
    fallbackSolidColor: 0x1a2540,
  });
  const { scene, camera, renderer, canvas, earth, atmosphere } = core;

  // Hidden until the NASA texture is bound; the canvas paints fully
  // transparent meanwhile and the disc's dark placeholder shows.
  earth.visible = false;
  atmosphere.visible = false;

  // Round silhouette even without host CSS; pointer events go to the
  // host button, not the canvas.
  canvas.style.borderRadius = '50%';
  canvas.style.pointerEvents = 'none';

  let homeX = 0;
  let homeY = 0;
  const setHome = (focus: HeaderEarthFocus) => {
    homeY = rotationYForLng(focus.lng);
    homeX = clamp(focus.lat * DEG, -POLE_CLAMP, POLE_CLAMP);
  };
  if (initialFocus) setHome(initialFocus);
  earth.rotation.set(homeX, homeY, 0);

  const render = () => {
    if (!core.isDisposed()) renderer.render(scene, camera);
  };

  // Coalesce bursts of change events (resize, focus) into one frame.
  let pendingRender = false;
  function requestRender(): void {
    if (core.isDisposed() || pendingRender) return;
    pendingRender = true;
    requestAnimationFrame(() => {
      pendingRender = false;
      render();
    });
  }

  // ── Return-to-region easing ──────────────────────────────────────
  let returnRaf: number | null = null;
  let lastTime = 0;
  const stopReturn = () => {
    if (returnRaf !== null) cancelAnimationFrame(returnRaf);
    returnRaf = null;
  };
  const returnTick = (time: number) => {
    returnRaf = null;
    const dt = lastTime ? Math.min(0.05, (time - lastTime) / 1000) : 0;
    lastTime = time;
    const k = 1 - Math.exp(-dt * RETURN_SPEED);
    const dy = wrapAngle(homeY - earth.rotation.y);
    const dx = homeX - earth.rotation.x;
    earth.rotation.y += dy * k;
    earth.rotation.x += dx * k;
    render();
    if (Math.abs(dx) + Math.abs(dy) > 0.002) returnRaf = requestAnimationFrame(returnTick);
  };
  const goHome = (snap: boolean) => {
    if (snap || reducedMotion) {
      stopReturn();
      earth.rotation.set(homeX, homeY, 0);
      requestRender();
    } else if (returnRaf === null) {
      lastTime = 0;
      returnRaf = requestAnimationFrame(returnTick);
    }
  };

  // ── Mouse / pen drag ─────────────────────────────────────────────
  let pointerId: number | null = null;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let dragged = false;

  const onPointerDown = (e: PointerEvent) => {
    if (!target || e.pointerType === 'touch' || e.button !== 0 || pointerId !== null) return;
    pointerId = e.pointerId;
    startX = lastX = e.clientX;
    startY = lastY = e.clientY;
    dragged = false;
    // Capture so a drag that strays slightly off the 46 px button
    // keeps turning the globe; pointerleave then fires on release.
    target.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    if (!dragged && Math.hypot(e.clientX - startX, e.clientY - startY) < DRAG_THRESHOLD_PX) return;
    dragged = true;
    stopReturn();
    earth.rotation.y += (e.clientX - lastX) * DRAG_SPEED;
    earth.rotation.x = clamp(earth.rotation.x + (e.clientY - lastY) * DRAG_SPEED, -POLE_CLAMP, POLE_CLAMP);
    lastX = e.clientX;
    lastY = e.clientY;
    requestRender();
  };
  const endPointer = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    if (target?.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId);
    // The click (if any) is dispatched in the same task as pointerup;
    // after that the flag is stale and must not swallow a later click.
    if (dragged) window.setTimeout(() => (dragged = false));
  };
  const onPointerLeave = () => {
    if (pointerId === null) goHome(false);
  };
  if (target) {
    target.addEventListener('pointerdown', onPointerDown);
    target.addEventListener('pointermove', onPointerMove);
    target.addEventListener('pointerup', endPointer);
    target.addEventListener('pointercancel', endPointer);
    target.addEventListener('pointerleave', onPointerLeave);
  }

  // Dev-only console tuning aid for the ocean-lift strength. Run
  // `__headerEarthOceanLift(2)` (0 = off). Stripped from production.
  if (import.meta.env.DEV) {
    (window as unknown as { __headerEarthOceanLift?: (v: number) => void })
      .__headerEarthOceanLift = (v: number) => {
        core.setOceanLift(v);
        requestRender();
      };
  }

  // ── Real Earth day texture (reveal-on-load) ──────────────────────
  // Same WebP as the overlay, so the HTTP cache serves the overlay's
  // request later. On failure the meshes are revealed with the
  // neutral dark color so the header is never an empty hole.
  const revealEarth = () => {
    earth.visible = true;
    atmosphere.visible = true;
    requestRender();
  };
  core.loadDayTexture({
    onLoad: revealEarth,
    onError: (err) => {
      console.warn(
        `[header-earth-3d] Failed to load Earth day texture at /assets/globe/earth-day-2k.webp; showing neutral dark placeholder.`,
        { source: 'neutral-dark-placeholder', error: err },
      );
      revealEarth();
    },
  });

  // ── Resize handling ──────────────────────────────────────────────
  core.sizeFromContainer();
  const resizeObserver = new ResizeObserver(() => {
    if (core.isDisposed()) return;
    core.sizeFromContainer();
    requestRender();
  });
  resizeObserver.observe(container);

  requestRender();

  return {
    canvas,
    destroy(): void {
      core.markDisposed();
      stopReturn();
      if (target) {
        target.removeEventListener('pointerdown', onPointerDown);
        target.removeEventListener('pointermove', onPointerMove);
        target.removeEventListener('pointerup', endPointer);
        target.removeEventListener('pointercancel', endPointer);
        target.removeEventListener('pointerleave', onPointerLeave);
      }
      resizeObserver.disconnect();
      core.disposeAll();
    },
    setFocus(lat: number, lng: number, snap = false): void {
      setHome({ lat, lng });
      if (pointerId === null) goHome(snap);
    },
    snapshot(): string | null {
      if (!earth.visible || core.isDisposed()) return null;
      // Without preserveDrawingBuffer the buffer is only readable in
      // the same task that drew it — draw, then read.
      render();
      return canvas.toDataURL();
    },
    takeDrag(): boolean {
      const d = dragged;
      dragged = false;
      return d;
    },
  };
}
