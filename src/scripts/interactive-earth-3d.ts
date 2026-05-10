/**
 * interactive-earth-3d
 *
 * Browser-only Three.js module that renders a single interactive Earth
 * sphere into a host element. Loaded lazily (dynamic import) by
 * LanguageGlobeSelector.astro when the language overlay first opens —
 * never imported from .astro frontmatter, never reached during SSR.
 *
 * Scope: Earth visual + interaction only. Language selection,
 * persistence, URL handling, and event dispatch stay in the host
 * component. This module has no knowledge of language codes; it just
 * accepts an optional initial focus point as { lat, lng } in degrees.
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
 * Visual layers (back-to-front in render order):
 *   1. Earth sphere — color map (canvas-generated, refined continents)
 *      + specular map (ocean glints, land matte) on MeshPhongMaterial.
 *   2. Cloud sphere — child of Earth at radius 1.012, MeshLambertMaterial
 *      with alpha-blended cloud texture; drifts slightly faster than
 *      the Earth so the atmosphere reads as alive.
 *   3. Atmosphere halo — back-side sphere at radius 1.06 with a
 *      Fresnel-style ShaderMaterial in additive blend mode. Cyan rim,
 *      no bloom, no post-processing.
 */

import * as THREE from 'three';

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
  /** Whether the real WebP or the canvas-generated fallback is bound. */
  textureSource: 'real-webp' | 'fallback';
}

export interface InteractiveEarthHandle {
  /** Stop animation, remove listeners, dispose all GPU resources, remove canvas. */
  destroy(): void;
  /** Snap-rotate the globe so (lat, lng) faces the camera. */
  focusLatLng(lat: number, lng: number): void;
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

const DEG = Math.PI / 180;
const POLE_CLAMP = Math.PI / 2 - 0.05;

/**
 * Continent silhouettes in (lat, lng) pairs, traced clockwise around
 * each landmass. Vertex counts are deliberate: dense enough to read as
 * organic at full overlay size (~440 px wide), sparse enough that the
 * texture generator runs in well under one frame on first open.
 *
 * These polygons are NOT cartographically accurate. They're meant to
 * be recognizable as continents at a glance, not to support
 * navigation. Pre-rendered into the color and specular maps.
 */
const CONTINENT_POLYGONS: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
  // Africa — the prototypical continent silhouette: northern Sahara
  // bulge, eastern Horn, southern Cape, western Gulf-of-Guinea curve.
  [
    [37, -5], [37, 4], [35, 11], [33, 19], [32, 27], [31, 32], [29, 34],
    [22, 36], [16, 39], [12, 42], [9, 49], [3, 49], [-2, 41],
    [-12, 40], [-20, 36], [-26, 33], [-30, 30], [-33, 26], [-34, 22],
    [-34, 18], [-30, 16], [-25, 14], [-15, 11], [-5, 8], [4, 5],
    [9, -2], [12, -10], [15, -16], [22, -17], [27, -14], [32, -10], [35, -8],
  ],
  // Eurasia — single big landmass; peninsulas (Iberia, Italy, Korea)
  // are blended into the perimeter rather than rendered separately,
  // which reads cleaner at this scale than detailed coastline.
  [
    [40, -10], [44, -10], [50, -5], [55, -5], [60, 5], [65, 12],
    [70, 25], [72, 40], [78, 55], [78, 75], [78, 95], [76, 115],
    [73, 130], [68, 142], [60, 160], [52, 168], [50, 158], [44, 148],
    [39, 142], [35, 138], [32, 130], [28, 124], [22, 115], [12, 110],
    [8, 100], [12, 98], [16, 95], [22, 92], [25, 88], [22, 80], [15, 78],
    [10, 78], [8, 80], [12, 70], [22, 70], [22, 60], [12, 50],
    [12, 45], [25, 38], [33, 35], [38, 28], [40, 22], [42, 14],
    [44, 6], [44, -3], [42, -8],
  ],
  // North America — from Aleutians around the Arctic, down the East
  // Coast, around the Gulf, up Mexico, back to Alaska.
  [
    [72, -160], [78, -120], [78, -90], [70, -75], [62, -60], [50, -55],
    [42, -65], [38, -75], [32, -78], [28, -80], [25, -85], [22, -97],
    [18, -94], [16, -90], [16, -100], [25, -110], [32, -116], [42, -125],
    [50, -130], [58, -135], [65, -150], [70, -165],
  ],
  // South America — narrow vertical mass with the Andean west-coast
  // bulge and the Patagonian taper at the south.
  [
    [12, -82], [10, -75], [10, -65], [5, -55], [0, -48], [-5, -36],
    [-15, -38], [-22, -42], [-30, -50], [-38, -58], [-45, -65], [-52, -70],
    [-55, -68], [-50, -73], [-40, -73], [-30, -73], [-20, -75],
    [-10, -78], [-2, -80], [5, -80], [10, -80],
  ],
  // Australia.
  [
    [-12, 113], [-12, 130], [-15, 145], [-22, 152], [-30, 153],
    [-37, 148], [-39, 143], [-37, 138], [-32, 128], [-30, 116],
    [-22, 113],
  ],
  // Greenland.
  [
    [83, -45], [80, -25], [76, -22], [70, -25], [64, -42], [62, -52],
    [70, -60], [78, -68], [82, -55],
  ],
  // Madagascar.
  [
    [-12, 49], [-15, 50], [-18, 49], [-22, 47], [-25, 45], [-23, 44],
    [-17, 44], [-13, 46],
  ],
  // New Guinea.
  [
    [-1, 132], [-2, 138], [-6, 145], [-10, 150], [-9, 144], [-7, 138], [-3, 134],
  ],
  // British Isles — small but characteristic at the NW edge of Eurasia.
  [
    [60, -2], [58, -4], [55, -6], [51, -5], [50, -2], [52, 1], [55, 0], [58, -1],
  ],
  // Iceland.
  [
    [66, -23], [65, -15], [63, -16], [63, -22], [65, -25],
  ],
  // Japan — three connected blobs read as the archipelago.
  [
    [44, 144], [40, 141], [35, 137], [33, 135], [37, 138], [40, 141], [43, 144],
  ],
  // New Zealand (north + south islands as one outline at this scale).
  [
    [-35, 174], [-37, 176], [-41, 175], [-44, 171], [-46, 167],
    [-43, 169], [-40, 173], [-37, 174],
  ],
];

export function createInteractiveEarth(
  container: HTMLElement,
  options: InteractiveEarthOptions = {}
): InteractiveEarthHandle {
  const idleSpeed = options.idleSpeed ?? 0.06; // ≈ 3.4°/sec
  // Cloud drift used to live here. The cloud layer was disabled in
  // the clarity-cleanup pass — generated blob clouds were washing out
  // the real Blue Marble continents. A real cloud WebP comes back in
  // Step D; until then the constant stays out so nothing references
  // a cloud mesh that doesn't exist.

  // ── Scene ────────────────────────────────────────────────────────
  const scene = new THREE.Scene();

  // Composition: FOV 35° + camera at z=3.85 frames the unit-radius
  // Earth so the sphere fills ~82% of the viewport vertically with
  // the atmosphere halo (radius 1.06) sitting at ~87% — ~6% margin
  // on every side. Two reasons this beats the previous 42° / z=2.7:
  //   • At 42° / 2.7, the visible half-height was 1.037 — barely
  //     larger than the atmosphere's 1.06 radius. The halo was
  //     clipped at the top and bottom and the planet felt cramped.
  //   • A narrower FOV gives telephoto compression: less perspective
  //     bulge at the silhouette, so the sphere reads as a real
  //     distant planet instead of a wide-angle ball. This is the
  //     framing NASA / cinema use for hero Earth shots.
  // The camera lives at the world origin's +Z axis; the planet stays
  // centered in the frame at all stage sizes because the renderer
  // square aspect-ratio (1:1) means horizontal and vertical FOV
  // match.
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 3.85);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    // The Earth overlay is a deliberate, short-lived modal — it only
    // exists between user-initiated open and close. While it's up we
    // want the cleanest possible render; the rest of the time no GL
    // work is happening at all (canvas isn't mounted, rAF is paused
    // on close). On laptops with switchable graphics this hint asks
    // the browser to use the discrete GPU for the session, which is
    // safe given the short duration. Mobile and integrated-only
    // devices ignore the hint and pay nothing.
    powerPreference: 'high-performance',
  });
  // Cap the pixel ratio at 2. Beyond 2 the visible sharpness gain is
  // marginal but the fragment-shader cost grows quadratically — a
  // DPR=3 phone would render 2.25× more pixels than at DPR=2 with no
  // perceptible improvement at the overlay's stage size. The browser
  // downscales our 2× buffer to the device's native pixel grid; the
  // result is sharper than letting Three.js render at 1× and CSS-up
  // would ever be.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  // Output color space — Three.js r152+ defaults this to sRGB, but we
  // set it explicitly so a future Three upgrade that changes the
  // default can't silently desaturate the Earth. Color textures
  // (loaded with colorSpace = SRGBColorSpace) are decoded correctly
  // only when the renderer's output is also sRGB.
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Linear tone-mapping keeps the ocean specular from clipping when
  // the directional light hits it at glancing angles. We deliberately
  // do NOT enable HDR / ACES / bloom — the look stays flat-to-camera
  // but punchy, exactly like the rest of Yuval's premium chrome.
  renderer.toneMapping = THREE.LinearToneMapping;
  // Exposure lifted from 1.00 → 1.06 in the stronger-lighting pass.
  // A 6% boost on the composited frame preserves the per-light
  // intensity ratios (so terminator contrast is unchanged in ratio
  // space) while giving the whole sphere a touch more on-screen
  // presence. Still well below filmic / HDR territory: bright land
  // that already saturated to white now saturates 6% sooner, which
  // is imperceptible. Forests and mid-latitude oceans — which were
  // sitting in the murky 0.30–0.45 range — get pushed visibly into
  // the lit register without clipping.
  renderer.toneMappingExposure = 1.06;

  const canvas = renderer.domElement;
  canvas.style.touchAction = 'none';
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.setAttribute('aria-hidden', 'true');
  container.appendChild(canvas);

  // Anisotropic filtering — applied to every Earth-sphere texture so
  // the equator stays sharp at the overlay's natural framing AND the
  // texels near the silhouette (which the camera samples at extreme
  // grazing angles) don't smear. 16× is the de-facto desktop maximum
  // and is essentially free on modern GPUs; we still clamp to the
  // device's reported capability so older mobile parts that report 4
  // or 8 fall back gracefully.
  const maxAniso = Math.min(16, renderer.capabilities.getMaxAnisotropy());

  // ── Earth sphere ─────────────────────────────────────────────────
  // Three textures, all CPU-generated, all disposable:
  //   • colorTex — RGB Earth surface (1536×768)
  //   • specularTex — grayscale specular intensity (768×384)
  //   • cloudTex — RGBA cloud cover (1024×512)
  // No remote assets. Total GPU memory ≈ 7 MB.
  const colorTex = generateEarthColorTexture(maxAniso);

  // Earth material — MeshPhongMaterial without a specularMap.
  //
  // The Step-B day texture shows real coastlines (Blue Marble), but
  // the polygon-derived specular mask we used to bind here was traced
  // from ~12 hand-drawn continents that don't line up with those
  // coastlines at all. The misalignment leaked ocean glint onto land
  // and matte zones into the Pacific — a subtle wrongness that drained
  // realism even when no single frame looked broken. Dropping the
  // mask entirely until Step C swaps in a real specular WebP gives
  // the whole sphere one consistent, gentle response to the sun.
  //
  // The remaining specular tuning aims for "cinematic restraint":
  //   • specular = #1c2a3a — deep cool steel-blue at ~30% the
  //     intensity of the previous #3a5e8c. Reads as moonlit ocean
  //     reflection rather than chrome.
  //   • shininess = 22 — broad soft sheen that wraps across the
  //     day-side instead of punching a single tight hotspot. The
  //     previous 90 was in the plastic/varnish range; planets earn
  //     their drama from the terminator, not from a glint.
  // Land regions in the Blue Marble texture are dark enough (forests,
  // mountains) that the soft sheen barely reads on them — the sphere
  // still feels matte where it should and ocean still picks up a
  // subtle highlight. We don't add a color tint or emissive: the
  // texture is already calibrated natural color.
  const earthMaterial = new THREE.MeshPhongMaterial({
    map: colorTex,
    specular: new THREE.Color(0x1c2a3a),
    shininess: 22,
  });
  const earthGeometry = new THREE.SphereGeometry(1, 96, 96);
  const earth = new THREE.Mesh(earthGeometry, earthMaterial);
  scene.add(earth);

  // Apply initial focus before the first paint so the user sees the
  // active language's region immediately, not a flash of lat=0/lng=0.
  if (options.initialFocus) {
    earth.rotation.y = -options.initialFocus.lng * DEG;
    earth.rotation.x = clamp(options.initialFocus.lat * DEG, -POLE_CLAMP, POLE_CLAMP);
  }

  // ── Real Earth day texture (deferred upgrade) ────────────────────
  // Async-load the local Blue Marble WebP and swap it onto the Earth
  // material once decoded. The CPU-generated colorTex stays bound
  // until the swap completes, so the first frame of the launch
  // animation always has a textured planet — no black flash.
  //
  // No remote URLs, no hotlinks. The asset is shipped under
  // public/assets/globe/ and served by Astro at the root path below.
  // If the load fails (404, decode error, offline) we keep the
  // fallback bound and log a single warning — the overlay remains
  // fully functional because the canvas-drawn Earth is still there.
  let upgradedDayTex: THREE.Texture | null = null;
  let fallbackColorDisposed = false;
  let disposed = false;
  // Tracks which texture is currently bound to earthMaterial.map so the
  // refit() diagnostic can report it without inspecting the material.
  let textureSource: 'real-webp' | 'fallback' = 'fallback';

  const DAY_TEXTURE_URL = '/assets/globe/earth-day-2k.webp';
  const textureLoader = new THREE.TextureLoader();
  textureLoader.load(
    DAY_TEXTURE_URL,
    (tex) => {
      // If destroy() ran while the request was in flight, the material
      // and renderer are already gone. Release the GPU memory we just
      // uploaded and bail — never touch a disposed material.
      if (disposed) {
        tex.dispose();
        return;
      }
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = maxAniso;
      tex.needsUpdate = true;

      upgradedDayTex = tex;
      earthMaterial.map = tex;
      earthMaterial.needsUpdate = true;

      // Fallback pixels are no longer sampled — release the canvas
      // texture's GPU memory now rather than at destroy().
      colorTex.dispose();
      fallbackColorDisposed = true;
      textureSource = 'real-webp';

      // Clarity diagnostic: confirm the real WebP arrived and was
      // bound to the material. Logs once per Earth instance.
      console.info('[interactive-earth-3d] Earth day texture loaded', {
        url: DAY_TEXTURE_URL,
        width: tex.image?.width,
        height: tex.image?.height,
        source: 'real-webp',
      });
    },
    undefined,
    (err) => {
      console.warn(
        `[interactive-earth-3d] Failed to load Earth day texture at ${DAY_TEXTURE_URL}; using generated fallback.`,
        { source: 'fallback', error: err }
      );
    }
  );

  // ── Cloud layer (disabled) ───────────────────────────────────────
  // Previously a separate sphere at radius 1.012 with an alpha-blended
  // generated cloud texture. Removed in the clarity-cleanup pass: the
  // procedural blobs were sitting on top of the real Blue Marble
  // continents and reading as smudges, which is what made the planet
  // feel hazy and cheap. A real cloud WebP comes back in Step D.

  // ── Atmospheric glow ─────────────────────────────────────────────
  // Single back-side sphere at radius 1.06 with an additive Fresnel
  // shader. No post-processing pass — this is one mesh, ~12 KB on
  // GPU, and reads as "atmosphere" without bloom or HDR. The shader
  // is unchanged in structure from the earlier step but tuned to a
  // cooler tint (less cyan-saturated, more hazy) and a slightly
  // sharper falloff so the atmosphere becomes a thinner halo
  // instead of a soft cloud around the planet.
  const atmosphereGeometry = new THREE.SphereGeometry(1.06, 64, 64);
  const atmosphereMaterial = new THREE.ShaderMaterial({
    uniforms: {},
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vNormal;
      void main() {
        float rim = 1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0));
        // Falloff tightened from pow(rim, 4.0) to pow(rim, 6.0) and
        // the intensity ceiling pulled from 0.78 to 0.55 in the
        // clarity-cleanup pass. The previous halo was bleeding a
        // faint cyan haze across the outer ~10% of the day-side disc
        // and washing out continent edges. Keeping pow at 6 and the
        // ceiling at 0.55 leaves a thin, premium rim glow that dies
        // quickly inward — atmosphere as silhouette accent, not as
        // global wash.
        float intensity = pow(clamp(rim, 0.0, 1.0), 6.0);
        // Two-tone halo: cooler core, warmer edge as it fades out.
        vec3 inner = vec3(0.36, 0.58, 0.96);
        vec3 outer = vec3(0.62, 0.82, 1.00);
        vec3 col = mix(inner, outer, smoothstep(0.0, 1.0, intensity));
        gl_FragColor = vec4(col, 1.0) * clamp(intensity * 0.55, 0.0, 1.0);
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
  });
  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  scene.add(atmosphere);

  // ── Lights ───────────────────────────────────────────────────────
  // Three lights, all cheap. Re-balanced in the stronger-lighting
  // pass after the previous moderate bump turned out too subtle to
  // dominate Blue Marble's dark mid-tones.
  //
  //   • DirectionalLight — the "sun". Two changes:
  //     (a) Pulled FORWARD toward the camera: (-2.0, 1.8, 3.0) →
  //         (-1.5, 1.5, 2.7). The previous position had a light
  //         direction of (-0.49, 0.44, 0.74), giving the dead-
  //         center pixel of the visible face only N·L = 0.74 of
  //         the sun's intensity. The new direction (-0.44, 0.44,
  //         0.79) yields N·L = 0.79 at the same pixel and lifts
  //         the entire camera-facing hemisphere into the
  //         high-cosine zone. Still 3/4 framing (upper-left and
  //         forward), not flat camera-axis lighting.
  //     (b) Intensity 1.20 → 1.45 — a real key-light bump, not a
  //         token nudge. Bright land (Sahara, polar ice) saturates
  //         to white slightly sooner; that's correct, those things
  //         ARE bright in reality. The visible mid-tones (forests,
  //         mid-latitude oceans) get pushed into the readable
  //         register where they should have been.
  //   • AmbientLight — warm earthshine fill. 0.40 → 0.50. The only
  //     light that touches the unlit hemisphere directly. The bump
  //     keeps the dark side as a soft visible "Earth at night" glow
  //     (~0.75 final shaded value) rather than a black void, while
  //     leaving it ~2.6× darker than the lit side so the terminator
  //     stays clear. Color (0xfff3dc) unchanged.
  //   • HemisphereLight — atmospheric scatter. 0.32 → 0.42. Sky tint
  //     (0x9ab8ff cool atmospheric blue) on top, ground bounce
  //     (0x7a5e3a warm earth) below. Hemi is direction-biased fill,
  //     not flat fill, so this bump adds dimensional richness — cool
  //     polar caps, warm equatorial deserts — without making the
  //     sphere read as a uniformly bright disc.
  //
  // No new lights, no shadow maps, no post-processing. Material
  // stays MeshPhongMaterial. This is purely a light-rebalance plus
  // the small exposure lift on the renderer.
  const ambient = new THREE.AmbientLight(0xfff3dc, 0.50);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffffff, 1.45);
  sun.position.set(-1.5, 1.5, 2.7);
  scene.add(sun);

  const hemi = new THREE.HemisphereLight(0x9ab8ff, 0x7a5e3a, 0.42);
  scene.add(hemi);

  // ── Resize handling ──────────────────────────────────────────────
  // Same as before: ResizeObserver sizes the renderer + camera to the
  // container. The third arg of setSize is `false` so the renderer
  // doesn't override the canvas's CSS sizing.
  const sizeFromContainer = () => {
    const rect = container.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  sizeFromContainer();

  const resizeObserver = new ResizeObserver(sizeFromContainer);
  resizeObserver.observe(container);

  // ── Pointer drag rotation (mouse + touch + pen via Pointer Events) ──
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let activePointerId: number | null = null;

  const onPointerDown = (e: PointerEvent) => {
    if (activePointerId !== null) return;
    dragging = true;
    activePointerId = e.pointerId;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
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
    if (!dragging && idleSpeed > 0) {
      earth.rotation.y += idleSpeed * dt;
    }
    // Cloud drift removed alongside the cloud layer in the
    // clarity-cleanup pass. Step D restores it with a real cloud WebP.
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
      disposed = true;
      stopLoop();
      idleEnabled = false;

      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', endPointer);
      canvas.removeEventListener('pointercancel', endPointer);
      canvas.removeEventListener('pointerleave', endPointer);

      resizeObserver.disconnect();

      // Dispose every GPU-owned object we created. Children (clouds)
      // are removed implicitly when their parent is removed; only
      // their geometry/material/texture need explicit dispose.
      earthGeometry.dispose();
      earthMaterial.dispose();
      // The fallback color texture may already be disposed by the
      // upgrade swap. Guard so we don't double-dispose.
      if (!fallbackColorDisposed) colorTex.dispose();
      if (upgradedDayTex) upgradedDayTex.dispose();
      // Cloud geometry / material / texture disposals removed with
      // the cloud layer itself. Step D will restore them.
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      renderer.dispose();

      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    },
    focusLatLng(lat: number, lng: number): void {
      earth.rotation.y = -lng * DEG;
      earth.rotation.x = clamp(lat * DEG, -POLE_CLAMP, POLE_CLAMP);
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
      const rect = container.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);

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
        textureSource,
      };
    },
  };
}

// ── Helpers ────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Mulberry32 — small deterministic PRNG, used so the cloud layout
 *  is the same on every load. Avoids "different clouds every refresh"
 *  flicker when the page is hot-reloaded. */
function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return function next(): number {
    s = (s + 0x6D2B79F5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Equirectangular projection helper, shared across all texture
 *  generators so coastlines on color/specular maps line up exactly. */
function makeProjector(w: number, h: number) {
  return function project(lat: number, lng: number): [number, number] {
    return [
      ((lng + 180) / 360) * w,
      ((90 - lat) / 180) * h,
    ];
  };
}

/** Trace a continent polygon onto the given context. Used by both the
 *  color map (with a green/teal fill) and the specular map (with
 *  pure black, since land has no ocean glint). */
function fillContinents(
  ctx: CanvasRenderingContext2D,
  polygons: typeof CONTINENT_POLYGONS,
  fill: string | CanvasGradient | CanvasPattern,
  project: (lat: number, lng: number) => [number, number]
): void {
  ctx.fillStyle = fill;
  for (const poly of polygons) {
    if (poly.length < 3) continue;
    ctx.beginPath();
    const [lat0, lng0] = poly[0];
    const [x0, y0] = project(lat0, lng0);
    ctx.moveTo(x0, y0);
    for (let i = 1; i < poly.length; i++) {
      const [lat, lng] = poly[i];
      const [x, y] = project(lat, lng);
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * Build the Earth's RGB surface texture on a 2D canvas. Pure CPU
 * drawing — no remote assets, no hotlinking.
 *
 * Layers (back to front):
 *   1. Ocean — five-stop vertical gradient with deeper poles, lighter
 *      equatorial band, and subtle horizontal banding for atmospheric
 *      depth.
 *   2. Coastline halo — same continents drawn slightly larger with a
 *      desaturated darker fill + 3px blur, so the boundary between
 *      land and water reads as a soft beach-edge instead of a hard
 *      pixel cliff.
 *   3. Continents — green/teal land gradient.
 *   4. Polar ice caps — wavy band at top + bottom (not a flat
 *      rectangle) so the planet doesn't look like a stamped circle.
 *
 * 1536×768 keeps continent edges sharp at the overlay's 440 px stage
 * size while still fitting in ~4.7 MB of GPU memory.
 */
function generateEarthColorTexture(maxAniso: number): THREE.CanvasTexture {
  const w = 1536;
  const h = 768;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const project = makeProjector(w, h);

  // ── Ocean ─────────────────────────────────────────────────────
  // Five-stop gradient — equator brighter, poles deeper, mid-lats
  // in between. Reads as a sphere already, before any continent is
  // drawn, because the brightness peaks where the camera looks.
  const ocean = ctx.createLinearGradient(0, 0, 0, h);
  ocean.addColorStop(0.00, '#0a1a36');
  ocean.addColorStop(0.18, '#0e2c5a');
  ocean.addColorStop(0.42, '#1a4a7e');
  ocean.addColorStop(0.50, '#2a5e95');
  ocean.addColorStop(0.58, '#1a4a7e');
  ocean.addColorStop(0.82, '#0e2c5a');
  ocean.addColorStop(1.00, '#0a1a36');
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, w, h);

  // Subtle horizontal latitude bands — barely-perceptible alpha
  // stripes so the ocean has texture without ever looking noisy.
  for (let band = 0; band < 12; band++) {
    const y = (band / 12) * h;
    const a = 0.025 + (band % 2) * 0.012;
    ctx.fillStyle = `rgba(255, 255, 255, ${a.toFixed(3)})`;
    ctx.fillRect(0, y, w, h / 12);
  }

  // ── Coastline halo (drawn BEFORE continents) ────────────────
  // A blurred, semi-transparent darker pass so the green-on-blue
  // boundary has a soft atmospheric beach. Without this, continents
  // sit on the ocean like decals; with it, the planet feels lit.
  ctx.save();
  ctx.filter = 'blur(3px)';
  fillContinents(ctx, CONTINENT_POLYGONS, 'rgba(20, 50, 60, 0.45)', project);
  ctx.restore();

  // ── Continents ──────────────────────────────────────────────
  // Three-stop vertical gradient: brighter mid-latitude greens,
  // cooler near-arctic and arid-tropical edges. This mirrors how
  // real biomes vary by latitude without requiring per-continent
  // tinting.
  const land = ctx.createLinearGradient(0, 0, 0, h);
  land.addColorStop(0.00, '#3a6248');
  land.addColorStop(0.30, '#5a8862');
  land.addColorStop(0.50, '#6a9a6e');
  land.addColorStop(0.70, '#5a8862');
  land.addColorStop(1.00, '#3a5040');

  fillContinents(ctx, CONTINENT_POLYGONS, land, project);

  // Tiny island specks scattered through the Pacific/Indian — they
  // never read as named islands, but they break the "blank ocean"
  // monotony when the user rotates past them.
  const islandRng = seededRandom(0xA15);
  ctx.fillStyle = '#5a8862';
  for (let i = 0; i < 24; i++) {
    const lat = (islandRng() - 0.5) * 100; // -50..+50
    const lng = islandRng() * 360 - 180;
    const [x, y] = project(lat, lng);
    const r = 1.5 + islandRng() * 2.5;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Polar caps with wavy edges ──────────────────────────────
  // Antarctica.
  ctx.fillStyle = 'rgba(228, 238, 250, 0.95)';
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let lng = -180; lng <= 180; lng += 4) {
    const wave = Math.sin(lng * 0.05) * 4 + Math.cos(lng * 0.12) * 2;
    const lat = -68 + wave;
    const [x, y] = project(lat, lng);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  // Arctic ice pack — wavy upper edge, slightly translucent so the
  // ocean blue still bleeds through at the boundary. Otherwise the
  // North Pole reads as a solid lid, which kills the spherical feel.
  ctx.fillStyle = 'rgba(220, 232, 248, 0.78)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let lng = -180; lng <= 180; lng += 4) {
    const wave = Math.sin(lng * 0.04) * 3 + Math.cos(lng * 0.09) * 2;
    const lat = 76 + wave;
    const [x, y] = project(lat, lng);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, 0);
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAniso;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Build the Earth's specular map. Same continent silhouettes, but
 * everything is grayscale: water = bright (high specular), land =
 * dark (low specular), polar ice = mid-bright. Multiplied with the
 * material's specular base color (#3a5e8c), this is what makes the
 * ocean glint while the continents stay matte.
 *
 * Lower res than the color map (768×384) — specular is forgiving of
 * downsampling because the highlight is a low-frequency feature.
 */
function generateEarthSpecularTexture(maxAniso: number): THREE.CanvasTexture {
  const w = 768;
  const h = 384;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const project = makeProjector(w, h);

  // Ocean: bright (full specular).
  ctx.fillStyle = '#dcecff';
  ctx.fillRect(0, 0, w, h);

  // Land: matte (zero specular).
  fillContinents(ctx, CONTINENT_POLYGONS, '#000000', project);

  // Polar ice caps: bright like ocean — ice has a specular sheen
  // similar to open water.
  ctx.fillStyle = '#e8f0ff';
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let lng = -180; lng <= 180; lng += 6) {
    const wave = Math.sin(lng * 0.05) * 4 + Math.cos(lng * 0.12) * 2;
    const lat = -68 + wave;
    const [x, y] = project(lat, lng);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let lng = -180; lng <= 180; lng += 6) {
    const wave = Math.sin(lng * 0.04) * 3 + Math.cos(lng * 0.09) * 2;
    const lat = 76 + wave;
    const [x, y] = project(lat, lng);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, 0);
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  // Specular maps stay in linear space — they're not color, they're
  // intensities. SRGBColorSpace would over-bright them.
  texture.colorSpace = THREE.NoColorSpace;
  texture.anisotropy = maxAniso;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Build the cloud layer's RGBA texture. White, soft-edged blobs
 * scattered with a deterministic PRNG (so reloads look identical),
 * weighted toward mid-latitudes where weather actually accumulates.
 * Plus a faint equatorial band suggesting the ITCZ.
 *
 * The texture goes onto a separate sphere mesh at radius 1.012 so
 * clouds can drift independently of the Earth's continents.
 */
function generateCloudTexture(maxAniso: number): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, w, h);

  const rng = seededRandom(0xC10D);

  // Random cloud blobs — biased toward latitudes where real weather
  // tends to gather (tropics + temperate). Skewed normal distribution
  // approximated via two random samples averaged.
  const numClouds = 48;
  for (let i = 0; i < numClouds; i++) {
    const latBias = (rng() + rng() - 1) * 60; // -60..60, peaked at 0
    const lat = clamp(latBias + (rng() - 0.5) * 30, -75, 75);
    const lng = rng() * 360 - 180;
    const x = ((lng + 180) / 360) * w;
    const y = ((90 - lat) / 180) * h;

    // Vary cloud size + elongation for variety; bigger storm-system
    // blobs interleaved with smaller wisp blobs.
    const baseSize = 18 + rng() * 60;
    const elongation = 0.5 + rng() * 1.6;
    const angle = rng() * Math.PI * 2;

    // Soft radial gradient — full alpha at the core fading to zero
    // at the edge. Stacking a few blobs at the same point gives the
    // "puffy" look without procedural noise.
    const grad = ctx.createRadialGradient(x, y, 0, x, y, baseSize);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.78)');
    grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.42)');
    grad.addColorStop(0.8, 'rgba(255, 255, 255, 0.10)');
    grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.00)');

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(elongation, 1);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, baseSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Equatorial band (ITCZ feel) — very faint horizontal stripe.
  const eq = ctx.createLinearGradient(0, h * 0.46, 0, h * 0.54);
  eq.addColorStop(0.0, 'rgba(255, 255, 255, 0.00)');
  eq.addColorStop(0.5, 'rgba(255, 255, 255, 0.10)');
  eq.addColorStop(1.0, 'rgba(255, 255, 255, 0.00)');
  ctx.fillStyle = eq;
  ctx.fillRect(0, h * 0.46, w, h * 0.08);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAniso;
  texture.needsUpdate = true;
  return texture;
}
