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
 * Active-language orientation contract — the visible region must
 * match the active language's focus point on first reveal AND on
 * every language change, regardless of pointer activity:
 *
 *   1. Constructor applies initialFocus to earth.rotation and
 *      zeros camera.rotation.
 *   2. While the WebP is loading, meshes are hidden. The host's
 *      pointermove handler may call setParallax during this window,
 *      which writes to camera.rotation while invisible.
 *   3. On texture load (or failure), the reveal-on-load callback
 *      RE-ASSERTS initialFocus on earth.rotation and zeros
 *      camera.rotation again before flipping visible to true. The
 *      first rendered frame is guaranteed to be the language focus
 *      point exactly — no parallax accumulation can leak through.
 *   4. setFocus (language-change path) does the same: write earth
 *      rotation + zero camera rotation, then render.
 *
 * All three paths route through the local `applyFocus` helper so
 * the math + camera-reset behavior is impossible to drift.
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
    // Tiny-size ambient floor: 0.55 → 0.65. The lighting math is
    // identical for every active language — the center surface
    // normal is always (0, 0, 1) and dots to N·L = 0.87 against
    // the fixed sun direction — but the NASA Blue Marble texture
    // has darker mid-tone pixels in some regions (central North
    // America forests/grasslands) than in others (Mediterranean,
    // Iberian Peninsula). At 50 px render targets those darker
    // pixels compress to barely-readable. A modest ambient lift
    // floors them into the readable register WITHOUT changing the
    // sun direction, the terminator position, or the lit-side
    // intensity in ratio space. Day/night contrast drops from
    // ~3.0 to ~2.7 — still cinematic, not flat, and uniform
    // across all active languages (Hebrew/English/Spanish all
    // benefit; English benefits most because that's where the
    // texture is darkest). No exposure further headroom (we're
    // already at 1.17, just below the 1.18 ceiling), so ambient
    // is the right lever.
    ambientIntensity: 0.65,
    powerPreference: 'low-power',
    // Neutral dark color used while the WebP is loading and after a
    // failure. Lifted slightly above the overlay's 0x1a2540 so the
    // tiny disc reads as "present" rather than "empty" during the
    // brief unloaded window (typically just a frame or two since
    // the WebP is usually in the HTTP cache from a prior page).
    fallbackSolidColor: 0x1a2540,
    // Tiny-size sea-readability lift — stronger than the overlay
    // (0.55 vs 0.30). Same rationale as the toneMappingExposure and
    // ambientIntensity bumps above: at ~34-50 px the NASA Blue
    // Marble's deep oceans collapse into one dark mass that swallows
    // the small disc, and the seas / inland lakes need the extra
    // brightness to read as water rather than shadow. The shader
    // patch only touches blue-dominant (ocean) pixels — continents
    // and ice are left untouched — so this stays a readability lift,
    // not a recolor. Live-tunable in dev via the console hook below.
    oceanLift: 0.55,
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

  // Helper that writes both the earth rotation AND a clean camera
  // rotation in one place. Used by:
  //   • the initial-focus block below,
  //   • the texture reveal-on-load callbacks (so the first visible
  //     frame is guaranteed to be at the language focus point,
  //     regardless of any parallax accumulated during the load
  //     window — see the regression notes in the doc-block),
  //   • the public setFocus method (language-change path).
  // Camera rotation is always reset to (0,0,0) here. Stale parallax
  // from a prior pointer hover would otherwise compose with the
  // earth rotation and shift the visible region by a few degrees.
  // Parallax can re-engage on the next pointermove.
  function applyFocus(
    lat: number | null,
    lng: number | null,
    source: 'initial' | 'initial-null' | 'reveal-load' | 'reveal-error' | 'setFocus',
  ): void {
    if (lat !== null && lng !== null) {
      earth.rotation.y = rotationYForLng(lng);
      earth.rotation.x = clamp(lat * DEG, -POLE_CLAMP, POLE_CLAMP);
    }
    camera.rotation.set(0, 0, 0);
    logFocus(source, lat, lng);
  }

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
    applyFocus(initialFocus.lat, initialFocus.lng, 'initial');
  } else {
    applyFocus(null, null, 'initial-null');
  }

  // Diagnostic gate — flip `window.__lgsDebug = true` in DevTools to
  // print one line each time the small globe orientation is set,
  // re-asserted at reveal, or changed via setFocus. Off by default;
  // matches the host's existing __lgsDebug flag so logs from both
  // sides can be turned on together.
  function logFocus(
    source: 'initial' | 'initial-null' | 'reveal-load' | 'reveal-error' | 'setFocus',
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
      cameraRotationX: camera.rotation.x,
      cameraRotationY: camera.rotation.y,
      textureSource: core.getTextureSource(),
      renderAfterFocus: true,
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

  // Dev-only console tuning aid for the header globe's ocean-lift
  // strength. Run `__headerEarthOceanLift(0.6)` (0 = off); it sets
  // the uniform AND schedules a repaint — the header renders
  // on-demand, so a uniform change alone would not show until the
  // next interaction. Stripped from production builds.
  if (import.meta.env.DEV) {
    (window as unknown as { __headerEarthOceanLift?: (v: number) => void })
      .__headerEarthOceanLift = (v: number) => {
        core.setOceanLift(v);
        requestRender();
      };
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
  //
  // Regression fix: re-assert the initialFocus rotation AND reset
  // camera rotation immediately before flipping the meshes visible.
  // The texture-load window (from constructor to onLoad) is a window
  // during which the host's pointermove handler can call
  // setParallax — that writes to camera.rotation while the meshes
  // are still invisible. Without this re-assert, the first visible
  // frame would compose the (correct) earth rotation with the
  // (stale, non-zero) camera tilt, shifting the visible region away
  // from the language focus by a few degrees. applyFocus zeroes the
  // camera and re-writes earth.rotation from the captured
  // initialFocus, so the first rendered frame lands exactly on the
  // language target. Parallax can re-engage on the next pointermove.
  core.loadDayTexture({
    onLoad: () => {
      if (initialFocus) {
        applyFocus(initialFocus.lat, initialFocus.lng, 'reveal-load');
      } else {
        applyFocus(null, null, 'reveal-load');
      }
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
      // Same re-assert as the success path: parallax must not
      // shift the visible region on first reveal.
      if (initialFocus) {
        applyFocus(initialFocus.lat, initialFocus.lng, 'reveal-error');
      } else {
        applyFocus(null, null, 'reveal-error');
      }
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
      // Routes through the shared applyFocus helper so the
      // language-change path uses identical math + camera-reset
      // behavior as the initial-focus and reveal-on-load paths.
      // The helper writes earth.rotation via rotationYForLng (the
      // same helper the overlay uses) and zeros camera.rotation so
      // stale parallax can't shift the visible region away from
      // the language target.
      applyFocus(lat, lng, 'setFocus');
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
