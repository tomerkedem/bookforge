/**
 * interactive-earth-3d
 *
 * Browser-only Three.js wrapper that renders the cinematic overlay
 * Earth into a host element. Loaded lazily (dynamic import) by
 * LanguageGlobeSelector.astro when the language overlay first opens —
 * never imported from .astro frontmatter, never reached during SSR.
 *
 * Visual identity (texture, material, lighting, atmosphere, tone
 * mapping, sun position, rotation convention) lives in
 * `earth-rendering-core.ts`. This file owns ONLY the overlay-specific
 * concerns:
 *
 *   • rAF loop with idle rotation
 *   • Pointer drag (mouse + touch + pen via Pointer Events)
 *   • Eased focus animation (`animateFocusLatLng`)
 *   • Geographic-coordinate projection to CSS pixels (`projectLatLng`)
 *   • Resize observer + `refit()` diagnostic
 *   • Lifecycle (`destroy`, `setIdleRotation`)
 *
 * Reveal-on-load contract: the overlay does NOT bind the CPU
 * fallback texture. Earth + atmosphere are hidden at construction
 * and revealed only after the real NASA Blue Marble WebP decodes.
 * If the WebP load fails, the meshes are revealed with a neutral
 * dark solid color (and an error is logged) — never with the old
 * hand-drawn continents, which were visually distinct from the
 * real Earth and broke the cinematic feel. The generator is kept
 * in the core for emergency/debug use only.
 *
 * Lifecycle contract (unchanged from earlier steps):
 *   - createInteractiveEarth(container, options) builds the scene,
 *     mounts a single canvas inside `container`, starts the rAF loop,
 *     and returns a handle.
 *   - handle.setIdleRotation(false) pauses the rAF loop without
 *     tearing anything down — re-open is instant; no second canvas.
 *   - handle.destroy() stops the loop, removes listeners, disposes
 *     geometries / materials / textures / renderer, and removes the
 *     canvas from the DOM. Called on `astro:before-swap` and
 *     `beforeunload` so view transitions and full page exits don't
 *     leak GPU resources.
 *   - handle.focusLatLng(lat, lng) snaps the globe so a point faces
 *     the camera. Used today for initial focus only.
 *
 * Visual layers (back-to-front in render order) are documented in
 * `earth-rendering-core.ts`. Nothing in this file constructs
 * materials, lights, textures, or the atmosphere shader.
 */

import * as THREE from 'three';
import {
  createEarthScene,
  rotationYForLng,
  clamp,
  DEG,
  POLE_CLAMP,
  DAY_TEXTURE_URL,
} from './earth-rendering-core';

export interface FocusPoint {
  lat: number;
  lng: number;
  /** Human-readable label for telemetry / logs. Not rendered. */
  label?: string;
}

export interface InteractiveEarthOptions {
  /** Snap the globe so this point faces the camera on first paint. */
  initialFocus?: FocusPoint | null;
  /** Idle rotation speed in radians/second. 0 disables idle spin. */
  idleSpeed?: number;
}

export interface RefitDiagnostic {
  /** Bounding-rect width of the host container at refit time (CSS px). */
  containerWidth: number;
  containerHeight: number;
  /** Canvas's CSS-laid-out size — what the user sees on screen. */
  canvasClientWidth: number;
  canvasClientHeight: number;
  /** Canvas's drawing-buffer size — pixels actually rendered by WebGL. */
  canvasWidth: number;
  canvasHeight: number;
  /** Renderer pixel ratio cap (currently min(devicePixelRatio, 2)). */
  rendererPixelRatio: number;
  /** Three.js's reported drawing-buffer size (sanity check vs canvas.width). */
  drawingBufferWidth: number;
  drawingBufferHeight: number;
  /** Window DPR — independent of the renderer's clamp. */
  devicePixelRatio: number;
  /** Currently-bound day texture's image dimensions. Null if undecodable. */
  textureWidth: number | null;
  textureHeight: number | null;
  /** Whether the real NASA WebP is currently bound. 'real-webp' once
   *  the texture has decoded and been attached to the material;
   *  'pending' during the load window and after a load failure
   *  (no CPU fallback texture exists — failure leaves the material
   *  at the neutral `fallbackSolidColor`). */
  textureSource: 'real-webp' | 'pending';
}

export interface InteractiveEarthHandle {
  /** Stop animation, remove listeners, dispose all GPU resources, remove canvas. */
  destroy(): void;
  /** Snap-rotate the globe so (lat, lng) faces the camera. */
  focusLatLng(lat: number, lng: number): void;
  /**
   * Smoothly rotate the globe so (lat, lng) faces the camera, taking
   * the shortest longitude path. `durationMs` defaults to 650.
   * Cancels any in-flight focus animation. Cancelled automatically
   * on user drag (pointerdown) so the host's hover/focus rotation
   * never fights the user's manual control. Driven inside the same
   * rAF loop as idle rotation; no extra animation frames are
   * scheduled, no GPU resources are added or changed.
   */
  animateFocusLatLng(lat: number, lng: number, durationMs?: number): void;
  /** Cancel any in-flight focus animation, leaving rotation as-is. */
  cancelFocusAnimation(): void;
  /**
   * Project a geographic coordinate to a CSS-pixel position inside
   * the host container, accounting for the Earth's current rotation
   * and the camera's perspective. Returns:
   *   - x, y: CSS pixels relative to the container's top-left.
   *   - frontFacing: true when the point is on the camera-facing
   *     hemisphere (worldPoint.z > 0). Hosts use this to hide a
   *     surface marker when the region has rotated to the back.
   * Returns null when the canvas has been disposed.
   *
   * Math note: the local-point construction uses the same UV→3D
   * formula as THREE.SphereGeometry (phi from lng+180, theta from
   * 90-lat, x = -cos(phi)·sin(theta), y = cos(theta),
   * z = sin(phi)·sin(theta)). That guarantees the projected point
   * is exactly the surface location the Blue Marble texture renders,
   * with no calibration drift between the texture and the marker.
   */
  projectLatLng(lat: number, lng: number): { x: number; y: number; frontFacing: boolean } | null;
  /** Pause/resume idle rotation + rAF loop. Does NOT dispose. */
  setIdleRotation(enabled: boolean): void;
  /**
   * Re-read the host container rect, resize the renderer to match,
   * update camera aspect/projection, render one frame. Returns a
   * snapshot of the resulting size state. Intended to be called once
   * after the launch flight completes (or after any layout change
   * the ResizeObserver might miss because it was driven by transform
   * rather than box size).
   */
  refit(): RefitDiagnostic;
  /** Convenience flag for callers that want to know the canvas is up. */
  readonly canvas: HTMLCanvasElement;
}

export function createInteractiveEarth(
  container: HTMLElement,
  options: InteractiveEarthOptions = {},
): InteractiveEarthHandle {
  const idleSpeed = options.idleSpeed ?? 0.06; // ≈ 3.4°/sec

  // ── Build shared Earth scene ─────────────────────────────────────
  // Overlay-specific options only — everything else (material,
  // lighting, atmosphere, exposure, sun position) is the canonical
  // visual identity that lives in earth-rendering-core.ts.
  //
  // The core no longer generates any CPU fallback texture; the
  // material starts with `map: null` and the neutral
  // `fallbackSolidColor` set below. Until the real WebP decodes,
  // the Earth + atmosphere meshes are HIDDEN (set just after
  // destructuring below). On WebP failure we log and reveal the
  // meshes with the neutral dark color so the user sees a
  // restrained dark sphere rather than nothing at all.
  const core = createEarthScene(container, {
    earthSegments: 96,
    atmosphereSegments: 64,
    powerPreference: 'high-performance',
    fallbackSolidColor: 0x1a2540,
  });
  const { scene, camera, renderer, canvas, earth, earthMaterial, atmosphere } = core;

  // Hide the Earth + atmosphere until the NASA texture is bound.
  // The canvas renders as fully transparent during this window
  // (renderer was constructed with alpha: true and a clear color
  // of 0x000000/0), so the overlay's existing CSS preflight state
  // shows through — no fake continents, no half-rendered sphere.
  earth.visible = false;
  atmosphere.visible = false;

  // Overlay-specific canvas style. The host wants pointer drag to
  // suppress the browser's default touch-scroll behavior so vertical
  // drags rotate the globe instead of scrolling the page underneath.
  canvas.style.touchAction = 'none';

  // Apply initial focus before the first paint so the user sees the
  // active language's region immediately, not a flash of lat=0/lng=0.
  // (Rotation is set even while hidden so the first VISIBLE frame
  // after texture load already faces the active language.)
  if (options.initialFocus) {
    earth.rotation.y = rotationYForLng(options.initialFocus.lng);
    earth.rotation.x = clamp(options.initialFocus.lat * DEG, -POLE_CLAMP, POLE_CLAMP);
  }

  // ── Real Earth day texture (reveal-on-load) ──────────────────────
  // Earth + atmosphere are hidden at construction. The onLoad
  // callback below is the SINGLE place that reveals them — either
  // with the NASA texture bound (success path) or, on failure, with
  // a neutral dark fallback solid color (failure path) so the user
  // is never staring at empty space and never sees the old generated
  // continents. The core handles in-flight disposal races; we own
  // the reveal/error logging.
  core.loadDayTexture({
    onLoad: (tex) => {
      // Texture is bound by the core. Reveal the meshes — the next
      // rAF frame paints the real NASA Earth with the atmospheric
      // rim. No fake continents were ever rendered.
      earth.visible = true;
      atmosphere.visible = true;
      console.info('[interactive-earth-3d] Earth day texture loaded', {
        url: DAY_TEXTURE_URL,
        width: tex.image?.width,
        height: tex.image?.height,
        source: 'real-webp',
      });
    },
    onError: (err) => {
      // Reveal with the neutral dark fallback color baked into the
      // material. The user sees a restrained dark sphere with the
      // atmospheric rim instead of empty space; we log loudly so
      // the failure is visible in the console.
      earth.visible = true;
      atmosphere.visible = true;
      console.error(
        `[interactive-earth-3d] Failed to load Earth day texture at ${DAY_TEXTURE_URL}; revealing neutral dark placeholder.`,
        { source: 'neutral-dark-placeholder', error: err },
      );
    },
  });

  // ── Resize handling ──────────────────────────────────────────────
  core.sizeFromContainer();
  const resizeObserver = new ResizeObserver(() => core.sizeFromContainer());
  resizeObserver.observe(container);

  // ── Pointer drag rotation (mouse + touch + pen via Pointer Events) ──
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let activePointerId: number | null = null;

  // ── Focus animation state (hover/focus geographic linkage) ──
  // Driven inside the same tick() rAF as idle rotation so we never
  // schedule a second loop, and so the two motions can't race-write
  // earth.rotation in the same frame. Null when no animation is
  // in flight. Cancelled on user drag (pointerdown) below — the host
  // never fights the user's manual control of the globe.
  interface FocusAnimState {
    startY: number;
    startX: number;
    deltaY: number;
    deltaX: number;
    t0: number;
    duration: number;
  }
  let focusAnim: FocusAnimState | null = null;

  const onPointerDown = (e: PointerEvent) => {
    if (activePointerId !== null) return;
    dragging = true;
    activePointerId = e.pointerId;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    // User took manual control — abandon any in-flight hover/focus
    // rotation immediately so the drag starts from wherever the
    // animation currently is, with no further automatic motion.
    focusAnim = null;
    e.preventDefault();
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!dragging || e.pointerId !== activePointerId) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    earth.rotation.y += dx * 0.005;
    earth.rotation.x = clamp(earth.rotation.x + dy * 0.005, -POLE_CLAMP, POLE_CLAMP);
    lastX = e.clientX;
    lastY = e.clientY;
  };

  const endPointer = (e: PointerEvent) => {
    if (e.pointerId !== activePointerId) return;
    dragging = false;
    activePointerId = null;
    if (canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('pointerleave', endPointer);

  // ── Animation loop ──────────────────────────────────────────────
  let idleEnabled = true;
  let rafId: number | null = null;
  let lastTime = 0;

  const tick = (time: number) => {
    rafId = null;
    if (!idleEnabled) return;
    const dt = lastTime ? Math.min(0.05, (time - lastTime) / 1000) : 0;
    lastTime = time;

    // Focus animation takes priority over idle drift. While a focus
    // anim is in flight, idle is paused so the eased rotation isn't
    // contaminated by 3.4°/sec of additive spin. The anim advances by
    // wall-clock time so a dropped frame can't desync it. Drag also
    // suppresses both (manual drag has its own rotation writes).
    if (focusAnim && !dragging) {
      const t = Math.min(1, (time - focusAnim.t0) / focusAnim.duration);
      // Ease-out cubic — quick start, gentle settle. Same easing
      // family the launch/return flights use, so the on-Earth motion
      // feels like part of the same cinematic language.
      const eased = 1 - Math.pow(1 - t, 3);
      earth.rotation.y = focusAnim.startY + focusAnim.deltaY * eased;
      earth.rotation.x = focusAnim.startX + focusAnim.deltaX * eased;
      if (t >= 1) {
        focusAnim = null;
      }
    } else if (!dragging && idleSpeed > 0) {
      earth.rotation.y += idleSpeed * dt;
    }

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(tick);
  };

  const startLoop = () => {
    if (rafId === null && idleEnabled) {
      lastTime = 0;
      rafId = requestAnimationFrame(tick);
    }
  };

  const stopLoop = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  renderer.render(scene, camera);
  startLoop();

  return {
    canvas,
    destroy(): void {
      // Mark disposed BEFORE releasing GPU resources so any in-flight
      // texture load that resolves during teardown disposes its own
      // result instead of binding it to a freed material.
      core.markDisposed();
      stopLoop();
      idleEnabled = false;

      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', endPointer);
      canvas.removeEventListener('pointercancel', endPointer);
      canvas.removeEventListener('pointerleave', endPointer);

      resizeObserver.disconnect();

      core.disposeAll();
    },
    focusLatLng(lat: number, lng: number): void {
      // Snap variant — cancels any in-flight animation so a later
      // animate call doesn't get a phantom start state.
      focusAnim = null;
      earth.rotation.y = rotationYForLng(lng);
      earth.rotation.x = clamp(lat * DEG, -POLE_CLAMP, POLE_CLAMP);
    },
    animateFocusLatLng(lat: number, lng: number, durationMs = 650): void {
      // Compute shortest-path delta on longitude. Without the modulo
      // wrap, rotating from -170° to +170° would sweep ~340° the
      // long way around the globe instead of the 20° the user
      // mentally expects. The wrap keeps deltaY in (-π, π].
      const startY = earth.rotation.y;
      const startX = earth.rotation.x;
      const targetY = rotationYForLng(lng);
      let deltaY = targetY - startY;
      const TWO_PI = Math.PI * 2;
      deltaY = ((deltaY % TWO_PI) + TWO_PI) % TWO_PI;
      if (deltaY > Math.PI) deltaY -= TWO_PI;
      const endX = clamp(lat * DEG, -POLE_CLAMP, POLE_CLAMP);
      const deltaX = endX - startX;

      // Zero-distance shortcut — both axes within ~0.05° of the
      // target. Skipping the anim keeps tick() on the idle-rotation
      // branch instead of paused-idle for the duration, which avoids
      // a perceptible "stutter" when the user re-hovers the option
      // the globe is already focused on.
      const EPS = 0.0009; // ~0.05° in radians
      if (Math.abs(deltaY) < EPS && Math.abs(deltaX) < EPS) {
        focusAnim = null;
        return;
      }

      focusAnim = {
        startY,
        startX,
        deltaY,
        deltaX,
        // performance.now() and the rAF callback's `time` arg share
        // the same time origin (DOMHighResTimeStamp), so subtracting
        // them inside tick() is well-defined.
        t0: performance.now(),
        duration: Math.max(1, durationMs),
      };
      // Make sure the loop is actually running — if idle has been
      // paused (e.g. between close and the next open), the eased
      // rotation would otherwise sit forever. startLoop() is a
      // no-op when the loop is already alive.
      if (idleEnabled) startLoop();
    },
    cancelFocusAnimation(): void {
      focusAnim = null;
    },
    projectLatLng(
      lat: number,
      lng: number,
    ): { x: number; y: number; frontFacing: boolean } | null {
      if (core.isDisposed()) return null;
      // Same UV→3D formula THREE.SphereGeometry uses internally, so
      // the point we project is exactly the surface location where
      // the Blue Marble texture renders this lat/lng. No calibration
      // gap between texture pixels and projected marker.
      const phi = (lng + 180) * DEG;
      const theta = (90 - lat) * DEG;
      const sinTheta = Math.sin(theta);
      const localPoint = new THREE.Vector3(
        -Math.cos(phi) * sinTheta,
        Math.cos(theta),
        Math.sin(phi) * sinTheta,
      );

      // earth.matrixWorld may be one frame stale if the host calls
      // this between tick() updates. updateMatrixWorld(true) refreshes
      // it from current rotation.{x,y,z} — cheap (a few muls/adds)
      // and avoids "marker lags rotation by one frame" jitter.
      earth.updateMatrixWorld(true);
      const worldPoint = localPoint.applyMatrix4(earth.matrixWorld);

      // Front-facing: the unit sphere is centered at origin, the
      // camera sits at (0, 0, +Z_cam). A point on the sphere is on
      // the camera-facing hemisphere when its world z > 0. We add a
      // small epsilon so points right at the silhouette (z ≈ 0)
      // don't flicker visible/hidden as floating-point noise
      // crosses zero across frames.
      const frontFacing = worldPoint.z > 0.02;

      // Project to NDC, then to CSS pixels inside the host container.
      // .project() applies the camera's projection + viewMatrix. NDC
      // is [-1, 1] with +Y up; CSS pixels go +X right, +Y down.
      const ndc = worldPoint.clone().project(camera);
      const rect = container.getBoundingClientRect();
      const cssX = (ndc.x * 0.5 + 0.5) * rect.width;
      const cssY = (-ndc.y * 0.5 + 0.5) * rect.height;
      return { x: cssX, y: cssY, frontFacing };
    },
    setIdleRotation(enabled: boolean): void {
      idleEnabled = enabled;
      if (enabled) {
        startLoop();
      } else {
        stopLoop();
      }
    },
    refit(): RefitDiagnostic {
      // Re-read the container's current bounding rect, resize the
      // renderer's drawing buffer to match, update the camera, and
      // render one frame. Two reasons this exists:
      //
      //   1) Compositor invalidation. A WAAPI flight from a small
      //      transform back to identity can leave the parent layer
      //      rasterized at the smallest size of the animation. The
      //      cached low-res bitmap then gets GPU-upscaled to the
      //      final natural size — what the user perceives as a
      //      "blurry" Earth. Calling renderer.setSize re-allocates
      //      the WebGL backing store (or no-ops if size matches),
      //      and the immediate render() pushes a fresh frame which
      //      forces the browser to invalidate and re-rasterize the
      //      composited layer at its true resolution.
      //
      //   2) ResizeObserver only fires on box-size changes. CSS
      //      transforms don't change box size, so layouts driven by
      //      transform-based animations can leave the renderer with
      //      stale dimensions if the box was actually different at
      //      construction time. refit() is the single defensive call
      //      that guarantees buffer == final layout.
      core.sizeFromContainer();
      renderer.render(scene, camera);

      const rect = container.getBoundingClientRect();
      const buf = renderer.getDrawingBufferSize(new THREE.Vector2());
      const activeMap = earthMaterial.map;
      const texW = activeMap?.image?.width ?? null;
      const texH = activeMap?.image?.height ?? null;

      return {
        containerWidth: rect.width,
        containerHeight: rect.height,
        canvasClientWidth: canvas.clientWidth,
        canvasClientHeight: canvas.clientHeight,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        rendererPixelRatio: renderer.getPixelRatio(),
        drawingBufferWidth: buf.x,
        drawingBufferHeight: buf.y,
        devicePixelRatio: window.devicePixelRatio,
        textureWidth: texW,
        textureHeight: texH,
        textureSource: core.getTextureSource(),
      };
    },
  };
}
