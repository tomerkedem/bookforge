/**
 * header-earth-3d
 *
 * Tiny dedicated Three.js wrapper that paints the SMALL header globe
 * as a real miniature Earth. Built on top of `earth-rendering-core.ts`
 * (the shared visual source of truth), so the small globe is now a
 * true miniature of the cinematic overlay Earth — same texture,
 * same material, same sun direction, same atmospheric rim, same
 * lighting model. Identity continuity: when the user clicks the
 * small globe, the large globe that launches is recognizably the
 * SAME object scaled up, not a CSS sticker opening into a
 * photorealistic sphere.
 *
 * What's different from the overlay wrapper — miniature-presentation
 * pass + interaction surface only, NOT visual identity. None of these
 * changes touch material, lighting, exposure, sun position, or the
 * atmosphere shader; all of those are inherited from the core
 * identically to the overlay.
 *
 *   • Geometry density: matches the overlay exactly (earth 96,
 *     atmosphere 64). The header now renders the full-resolution
 *     sphere so the silhouette and the Fresnel rim are byte-identical
 *     to the overlay's. Earlier passes used reduced counts (32, then
 *     64) on the assumption that small canvas == fewer triangles
 *     needed; the cost difference at 50 px viewport is invisible on
 *     any modern GPU and the silhouette quality gain reads clearly.
 *   • Pixel-ratio cap: 3 (vs 2 for the overlay). The header canvas
 *     is ~50 CSS px; even at DPR 3 the backing buffer is just 150²
 *     pixels, well under the overlay's 880² at DPR 2. The extra
 *     subpixel density makes the rim glow, the specular highlight,
 *     and the silhouette curve crisper — small render targets
 *     amplify perception of partially-blended thin pixel bands, so
 *     adding density there is the cheapest "presence" gain
 *     available without touching the lighting model.
 *   • Camera distance: 3.55 (vs 3.85 for the overlay). Brings the
 *     Earth slightly forward inside the canvas so it fills ~89% of
 *     the viewport vertically and the atmosphere halo sits at ~94%
 *     — eliminating the empty margin between the rim glow and the
 *     circular `border-radius: 50%` clip that previously read as
 *     "wasted space" in the header. Camera is still in telephoto
 *     range (FOV 35° unchanged), so perspective compression and the
 *     cinematic framing character are preserved. 3.55 keeps the
 *     atmosphere a comfortable margin inside the canvas; values
 *     under ~3.4 risk clipping the rim at the border-radius edge.
 *   • Renderer hint: powerPreference 'low-power'. The header canvas
 *     renders on demand only; no point waking a discrete GPU.
 *   • Render cadence: on-demand only. No requestAnimationFrame loop,
 *     no idle rotation, no drag handlers, no focus animation. A
 *     render() runs on four events:
 *       1. First paint (after constructor wires up the scene)
 *       2. Texture-load completion (after async fetch)
 *       3. setFocus() — language change
 *       4. setParallax() — pointer-hover offset
 *       5. ResizeObserver — host container size change
 *     Total cost while the header sits idle: zero GPU work.
 *   • No drag interaction. The CSS `pointer-events: none` on the
 *     canvas ensures the host's existing click + hover handlers on
 *     `.lgs-trigger` fire on the button, not the canvas.
 *
 * What's identical to the overlay — the shared core enforces this:
 *
 *   • Texture URL                 /assets/globe/earth-day-2k.webp
 *   • Fallback canvas texture     none — there is no fake-continents
 *                                 fallback anywhere in the pipeline.
 *                                 The Earth + atmosphere are hidden
 *                                 until the real NASA WebP decodes;
 *                                 on failure they are revealed with
 *                                 a neutral dark solid color.
 *   • Texture color space         sRGB, anisotropy capped at 16
 *   • Camera                      35° FOV, position (0, 0, 3.85)
 *   • Sun world position          (-1.2, 1.3, 3.2)
 *   • Material                    MeshPhongMaterial, specular
 *                                 #1c2a3a, shininess 22, no specularMap
 *   • Lighting                    Ambient #fff3dc 0.55,
 *                                 DirectionalLight white 1.55 at sun,
 *                                 HemisphereLight 0x9ab8ff/
 *                                 0x7a5e3a 0.48
 *   • Tone mapping                Linear, exposure 1.12
 *   • Atmosphere shader           same vertex + fragment program
 *                                 (back-side sphere at 1.06, Fresnel
 *                                 `pow(rim, 5.0)`, sun-side blend
 *                                 with mix(0.18, 0.78), additive,
 *                                 no depth write)
 *   • Rotation convention         rotation.y = (-90° - lng) DEG,
 *                                 rotation.x = +lat DEG (clamped at
 *                                 the poles). Same UV calibration as
 *                                 the overlay.
 *
 * The previous header-specific tuning (exposure 1.25, sun 2.10,
 * specular #4a6c98 / shininess 30, atmosphere pow 3.0 with intensity
 * mix(0.26, 1.00)) was an attempt to compensate for perceived
 * dimming at small render targets. The compensations DROVE the
 * miniature away from the overlay's visual identity — wider fuzzy
 * halo, brighter plastic specular, washed-out terminator. Dropped.
 * The shared core's values give the same visual at every size; the
 * brightness illusion that motivated those overrides came from
 * different sources (silhouette resolution, fallback solid color,
 * lack of fallback continents) that are now fixed in the core.
 *
 * The handle's public surface is unchanged from the previous
 * implementation: createHeaderEarth, setFocus, setParallax, destroy,
 * canvas. LanguageGlobeSelector.astro is not touched.
 */

import {
  createEarthScene,
  rotationYForLng,
  clamp,
  DEG,
  POLE_CLAMP,
} from './earth-rendering-core';

export interface HeaderEarthFocus {
  lat: number;
  lng: number;
}

export interface HeaderEarthHandle {
  /** Stop rendering, dispose all GPU resources, remove the canvas.
   *  Safe to call more than once (the core's disposed flag prevents
   *  double-free). */
  destroy(): void;
  /** Snap-rotate so (lat, lng) faces the camera. Triggers one render. */
  setFocus(lat: number, lng: number): void;
  /**
   * Apply a small visual parallax — slight camera-rotation offsets
   * driven by the host's pointer-move handler. Values are in pixels
   * (the host's existing ±12 / ±8 px budget). Mapped to small radian
   * deltas so a 12 px shift produces a few degrees of nudge, not a
   * half-globe spin. Triggers one render. Pass (0, 0) on
   * pointerleave to reset to the base orientation.
   */
  setParallax(px: number, py: number): void;
  /** The mounted <canvas>. Host uses this only for cleanup hooks. */
  readonly canvas: HTMLCanvasElement;
}

export function createHeaderEarth(
  container: HTMLElement,
  initialFocus: HeaderEarthFocus | null = null,
): HeaderEarthHandle {
  // ── Build shared Earth scene ─────────────────────────────────────
  // Header-specific options only. Everything else (material, lighting,
  // exposure, atmosphere, sun position, rotation convention) is the
  // canonical visual identity that lives in earth-rendering-core.ts.
  //
  // No CPU fallback texture is generated anywhere in the pipeline.
  // The material starts with `map: null` and the neutral
  // `fallbackSolidColor` set below; Earth + atmosphere meshes are
  // hidden immediately after construction (see below) and revealed
  // only when the NASA WebP decodes (or, on failure, with the
  // neutral dark color and a logged warning).
  const core = createEarthScene(container, {
    // Miniature-presentation pass: full overlay-grade geometry, plus
    // higher pixel-ratio cap, slightly tighter framing, and a tiny
    // atmosphere-readability lift. Material, lighting, exposure, and
    // sun position are inherited from the core unchanged. The
    // atmosphere shader PROGRAM is the same one the overlay uses —
    // only two uniforms differ, and they are presentation knobs
    // (band width + lit-limb intensity ceiling), not a separate
    // visual model. The night-limb cap is hardcoded inside the
    // shader and stays at 0.18 for both Earths, so the lit/dark
    // asymmetry that makes the rim read as real atmosphere is
    // preserved exactly. See earth-rendering-core.ts for the
    // option-by-option rationale.
    earthSegments: 96,
    atmosphereSegments: 64,
    pixelRatioCap: 3,
    cameraDistance: 3.55,
    // Widen the rim band from 5.0 → 4.0. At 50 px viewport the
    // overlay's tight band has only a handful of high-alpha
    // fragments along the silhouette; 4.0 adds ~7% of radial
    // direction's worth of additional visible band, enough to make
    // the lit (left) limb register clearly without the band ever
    // bleeding inward across the continents.
    atmosphereRimExponent: 4.0,
    // Lift the lit-limb intensity ceiling from 0.78 → 0.88. Affects
    // ONLY the sun-facing side via the shader's sun-side mix; night
    // limb is hardcoded at 0.18 inside the shader and stays
    // restrained. Net: the left atmospheric crescent reads brighter
    // while the right side stays a quiet desaturated halo —
    // directional, not uniform.
    atmosphereMaxIntensityLit: 0.88,
    // Tiny-size readability multiplier on tone-mapping exposure:
    // 1.12 → 1.17. Stays inside the documented "noticeable but not
    // filmic" 1.10-1.18 range, well below the 1.18 hard ceiling.
    // Small render targets perceptually compress the visible
    // luminosity range; +5% of exposure on the composited frame
    // brings the camera-facing hemisphere back to roughly the same
    // perceived brightness the overlay has at large size.
    toneMappingExposure: 1.17,
    powerPreference: 'low-power',
    // Neutral dark color used while the WebP is loading and after a
    // failure. Lifted slightly above the overlay's 0x1a2540 so the
    // tiny disc reads as "present" rather than "empty" during the
    // brief unloaded window (typically just a frame or two since
    // the WebP is usually in the HTTP cache from a prior page).
    fallbackSolidColor: 0x1a2540,
  });
  const { scene, camera, renderer, canvas, earth, atmosphere } = core;

  // Hide Earth + atmosphere until the NASA texture is bound. With
  // the renderer constructed alpha-on, the canvas paints fully
  // transparent during the load window — the disc's underlying
  // CSS gradient shows through inside the circular border-radius,
  // which reads as a quiet placeholder rather than the old
  // hand-drawn continents flashing in for a frame.
  earth.visible = false;
  atmosphere.visible = false;

  // Header-specific canvas styling — preserved from the previous
  // implementation. The circular border-radius keeps the silhouette
  // perfectly round even if the host's CSS were stripped; the
  // `pointer-events: none` makes the host's existing click / hover
  // handlers on `.lgs-trigger` fire on the button, not the canvas.
  canvas.style.borderRadius = '50%';
  canvas.style.pointerEvents = 'none';

  // Apply the initial focus BEFORE the first render so the very
  // first frame paints with the active language's region already
  // facing the camera — no visible "flash at lat=0/lng=0" before
  // the host's setFocus call would correct it.
  //
  // Uses the SAME `rotationYForLng` helper the overlay uses (both
  // imported from earth-rendering-core), so the longitude
  // calibration is byte-identical: the same language code resolves
  // to the same visible region on both Earths.
  if (initialFocus) {
    earth.rotation.y = rotationYForLng(initialFocus.lng);
    earth.rotation.x = clamp(initialFocus.lat * DEG, -POLE_CLAMP, POLE_CLAMP);
    logFocus('initial', initialFocus.lat, initialFocus.lng);
  } else {
    logFocus('initial-null', null, null);
  }

  // Diagnostic gate — flip `window.__lgsDebug = true` in DevTools to
  // print one line each time the small globe orientation is set or
  // changed. Off by default; matches the host's existing __lgsDebug
  // flag so logs from both sides can be turned on together.
  function logFocus(
    source: 'initial' | 'initial-null' | 'setFocus',
    lat: number | null,
    lng: number | null,
  ): void {
    if (typeof window === 'undefined') return;
    if (!(window as unknown as { __lgsDebug?: boolean }).__lgsDebug) return;
    console.info('[header-earth-3d] focus applied', {
      source,
      lat,
      lng,
      rotationX: earth.rotation.x,
      rotationY: earth.rotation.y,
    });
  }

  // ── On-demand render scheduling ──────────────────────────────────
  // We don't run a rAF loop — the header globe is static unless the
  // language changes or the cursor moves. Coalesce multiple change
  // events fired in the same frame (e.g. setParallax called from a
  // pointermove stream) into a single render. The pendingRender
  // guard makes the per-frame cost worst-case one draw call even
  // under a rapid pointer-move stream.
  let pendingRender = false;
  function requestRender(): void {
    if (core.isDisposed() || pendingRender) return;
    pendingRender = true;
    requestAnimationFrame(() => {
      pendingRender = false;
      if (core.isDisposed()) return;
      renderer.render(scene, camera);
    });
  }

  // ── Real Earth day texture (reveal-on-load) ──────────────────────
  // Same WebP as the overlay. The browser HTTP cache dedupes the
  // request when the user opens the cinematic overlay later — the
  // header is usually the first thing to load this file on a fresh
  // session, so subsequent navigations resolve nearly instantly.
  //
  // The Earth + atmosphere are hidden at construction; this callback
  // is the SINGLE place that reveals them — on success with the
  // NASA texture bound, on failure with the neutral dark
  // `fallbackSolidColor` (and a logged warning so the failure is
  // visible without breaking the page). Never the old fake
  // continents — those are no longer generated anywhere in the
  // pipeline.
  core.loadDayTexture({
    onLoad: () => {
      earth.visible = true;
      atmosphere.visible = true;
      requestRender();
    },
    onError: (err) => {
      // Reveal with the neutral dark color so the header isn't
      // permanently empty if a CDN/asset failure prevents the
      // WebP from loading. The disc stays "present" — a quiet
      // dark sphere with the atmospheric rim — instead of a blank
      // canvas. Logged loudly so the failure is observable.
      earth.visible = true;
      atmosphere.visible = true;
      console.warn(
        `[header-earth-3d] Failed to load Earth day texture at /assets/globe/earth-day-2k.webp; showing neutral dark placeholder.`,
        { source: 'neutral-dark-placeholder', error: err },
      );
      requestRender();
    },
  });

  // ── Resize handling ──────────────────────────────────────────────
  // The host container can change size on viewport breakpoint hits
  // (mobile 42 → desktop 44 → desktop rail 50). ResizeObserver picks
  // up the change and resizes the renderer + camera + repaints.
  core.sizeFromContainer();
  const resizeObserver = new ResizeObserver(() => {
    if (core.isDisposed()) return;
    core.sizeFromContainer();
    requestRender();
  });
  resizeObserver.observe(container);

  // First paint — fallback continents until the texture upgrades,
  // then the load callback above schedules a second paint with the
  // real WebP.
  requestRender();

  return {
    canvas,
    destroy(): void {
      // Mark disposed BEFORE releasing resources so a still-in-flight
      // texture-load callback or coalesced rAF tick will no-op cleanly
      // without touching a freed material. disposeAll is idempotent —
      // calling destroy() twice is safe.
      core.markDisposed();
      resizeObserver.disconnect();
      core.disposeAll();
    },
    setFocus(lat: number, lng: number): void {
      // Rotate the earth to face the language's focus point. Same
      // helper the overlay uses (rotationYForLng from the shared
      // core) so a given language resolves to the same visible
      // region on both Earths.
      earth.rotation.y = rotationYForLng(lng);
      earth.rotation.x = clamp(lat * DEG, -POLE_CLAMP, POLE_CLAMP);
      // Reset any stale parallax that may still be on the camera
      // from a prior pointer hover. Without this, a hover followed
      // by a language switch would leave the visible region offset
      // by a few degrees of camera tilt — close to the target but
      // not exactly the language's focus point. setFocus is the
      // canonical "show me language X" call; it should land on the
      // language target exactly, regardless of prior input state.
      // Parallax can re-engage on the next pointermove.
      camera.rotation.set(0, 0, 0);
      logFocus('setFocus', lat, lng);
      requestRender();
    },
    setParallax(px: number, py: number): void {
      // Earth's BASE rotation comes from setFocus. Parallax is applied
      // to the CAMERA rotation instead, so a parallax update never
      // overwrites the language-driven base orientation — rotating
      // the camera by a tiny angle in the OPPOSITE direction of the
      // cursor offset reads as the planet tilting toward the cursor,
      // matching the percept of the bg-position-px parallax this
      // replaced. setParallax(0, 0) resets to the base orientation.
      const RAD_PER_PX_X = 0.0035; // ~0.20° per px of cursor offset
      const RAD_PER_PX_Y = 0.0030;
      camera.rotation.y = -px * RAD_PER_PX_X;
      camera.rotation.x = -py * RAD_PER_PX_Y;
      requestRender();
    },
  };
}
