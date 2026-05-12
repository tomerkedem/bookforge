/**
 * earth-rendering-core
 *
 * Shared visual source of truth for every Earth that Yuval renders.
 * Consumed by `interactive-earth-3d.ts` (cinematic overlay) and
 * `header-earth-3d.ts` (header miniature). The core enforces a
 * single material, lighting rig, atmosphere shader, sun position,
 * exposure, and tone-mapping — so "is the small globe the same
 * Earth as the large one?" is answerable by looking at one file.
 *
 * Callers may differ on geometry density, pixel-ratio cap, camera
 * distance, atmosphere rim exponent / intensity, exposure, and
 * power preference. Callers OWN their own lifecycle: rAF loop vs
 * on-demand render, resize observer, drag listeners, focus
 * animation, hotspot projection, refit diagnostics. The core
 * provides primitives (`sizeFromContainer`, `loadDayTexture`,
 * `disposeAll`); it does not impose a render cadence.
 *
 * Texture pipeline:
 *   The ONLY surface texture this module knows about is the real
 *   NASA Blue Marble WebP at `/assets/globe/earth-day-2k.webp`.
 *   There is no CPU-generated fallback. While the WebP is in
 *   flight the material has `map: null` and renders with a
 *   neutral dark solid color (`fallbackSolidColor`, default
 *   0x0a0a0a). Callers that want the Earth to remain hidden
 *   until the texture decodes can set `earth.visible = false`
 *   and `atmosphere.visible = false` after construction and flip
 *   them back inside the `loadDayTexture` callbacks. The neutral
 *   solid color is the only thing visible if the WebP fails.
 *
 * Visual contract (locked, do not edit without Tomer's approval):
 *   • Camera                35° FOV, position (0, 0, 3.85)
 *   • Sun world position    (-1.2, 1.3, 3.2)
 *   • Renderer              sRGB output, Linear tone-map, exposure 1.12
 *   • Material              MeshPhongMaterial, specular #1c2a3a,
 *                           shininess 22, no specularMap
 *   • Lights                Ambient #fff3dc 0.55,
 *                           DirectionalLight white 1.55 at sun,
 *                           HemisphereLight 0x9ab8ff/0x7a5e3a 0.48
 *   • Atmosphere            back-side sphere at radius 1.06, Fresnel
 *                           `pow(rim, 5.0)`, sun-side blend with
 *                           maxIntensity `mix(0.18, 0.78, sunSide)`,
 *                           additive blend, no depth write
 *   • Anisotropy            min(16, capability)
 *   • Day texture URL       /assets/globe/earth-day-2k.webp
 *   • Rotation convention   rotation.y = (-90° - lng) DEG,
 *                           rotation.x = +lat DEG (clamped at poles)
 */

import * as THREE from 'three';

// ── Shared constants ───────────────────────────────────────────────

export const DEG = Math.PI / 180;
export const POLE_CLAMP = Math.PI / 2 - 0.05;

/**
 * THREE.SphereGeometry's default UV mapping puts lng = -90° on the
 * +Z axis (facing the camera at the identity rotation). The texture
 * is equirectangular with u = (lng + 180) / 360, and the sphere
 * geometry's vertex formula x = -cos(phi)·sin(theta), z = sin(phi)·
 * sin(theta) at phi = (lng+180)·DEG places lng = 0 at +X (camera's
 * right) when rotation is zero.
 *
 * To bring an arbitrary (lat, lng) to face the camera (+Z), we need
 * to rotate around Y by (-90° - lng) and around X by +lat. The
 * constant below captures the offset once so every call site agrees.
 */
export const LNG_TO_ROTATION_Y_OFFSET_DEG = -90;

/** Bundled day texture, served from public/. No remote URLs. */
export const DAY_TEXTURE_URL = '/assets/globe/earth-day-2k.webp';

/**
 * Scene-level sun position. The DirectionalLight ("key") and the
 * atmosphere shader's `uSunDir` uniform BOTH reference this vector,
 * so the surface terminator and the atmospheric scatter ring line up
 * exactly. Frozen so callers can't accidentally mutate the canonical
 * source while building their scene.
 */
export const SUN_WORLD_POSITION: Readonly<THREE.Vector3> = Object.freeze(
  new THREE.Vector3(-1.2, 1.3, 3.2),
);

// ── Shared helpers ─────────────────────────────────────────────────

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Convert a longitude (degrees) into the corresponding Y-rotation
 *  needed to bring that meridian to face the camera. Used by every
 *  Earth wrapper so the focus math stays in lockstep. */
export function rotationYForLng(lng: number): number {
  return (LNG_TO_ROTATION_Y_OFFSET_DEG - lng) * DEG;
}

// ── Atmosphere shader (single source of truth) ─────────────────────
//
// Back-side sphere at radius 1.06, additive blend, no post-processing.
// SUN-AWARE: the rim glow is brightest on the lit limb (cyan-white,
// like real Rayleigh scatter at sunrise/sunset from orbit) and decays
// to a thin blue-violet haze on the night limb. Uniform halos read
// as UI borders; sun-modulated halos read as real atmosphere.

const ATMOSPHERE_VERTEX_SHADER = /* glsl */ `
  varying vec3 vNormalView;
  varying vec3 vNormalWorld;
  void main() {
    // View-space normal — used to compute the camera-relative
    // Fresnel rim. The atmosphere mesh lives at the scene root
    // with no rotation, so its world normal IS its local normal;
    // no model-matrix multiply needed for vNormalWorld.
    vNormalView = normalize(normalMatrix * normal);
    vNormalWorld = normalize(normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMOSPHERE_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uSunDir;
  uniform float uRimExponent;
  uniform float uMaxIntensityLit;
  varying vec3 vNormalView;
  varying vec3 vNormalWorld;
  void main() {
    // Fresnel — 1.0 at the silhouette, 0.0 at the camera-facing
    // pole. uRimExponent controls band width: 5.0 is the canonical
    // overlay value (tight, premium); miniature callers may pass
    // a slightly lower value (e.g. 4.0) so the band is a few pixels
    // wider in the tiny canvas and the lit limb has enough fragments
    // to actually deposit visible glow. Do NOT push below 4.0 —
    // 3.0 produces a fuzzy UI-style halo that erases the realism cue.
    float rim = 1.0 - dot(vNormalView, vec3(0.0, 0.0, 1.0));
    float rimI = pow(clamp(rim, 0.0, 1.0), uRimExponent);

    // Sun-side factor — 1 where this point of the atmosphere
    // faces the sun, 0 where it points opposite. The smoothstep
    // window (-0.2 → 0.4) places the crossfade right around the
    // terminator and prevents a hard color seam.
    float sunFacing = dot(vNormalWorld, uSunDir);
    float sunSide = smoothstep(-0.2, 0.4, sunFacing);

    // Day-limb palette — saturated atmospheric cyan-blue at the
    // inner band, cool white at the very edge.
    vec3 dayInner = vec3(0.30, 0.62, 1.05);
    vec3 dayOuter = vec3(0.72, 0.92, 1.10);
    vec3 dayCol = mix(dayInner, dayOuter, smoothstep(0.0, 1.0, rimI));

    // Night-limb tint — desaturated blue-violet, no white edge.
    vec3 nightTint = vec3(0.16, 0.24, 0.55);

    vec3 col = mix(nightTint, dayCol, sunSide);

    // Intensity ceiling lifts with the sun side. Night limb is
    // always capped at 0.18 (visible-but-restrained, asymmetry is
    // the realism cue — do NOT raise this). uMaxIntensityLit is the
    // sun-side ceiling: overlay 0.78 (canonical "thin bright crescent
    // against space"), miniature callers may pass slightly higher
    // (e.g. 0.88) so the lit limb has enough headroom to register at
    // tiny render targets where the rim is just a few pixels wide.
    // The cap remains < 1.0 so the rim never fully saturates into a
    // ring-around-the-button look.
    float maxIntensity = mix(0.18, uMaxIntensityLit, sunSide);
    float alpha = clamp(rimI * maxIntensity, 0.0, 1.0);

    gl_FragColor = vec4(col, 1.0) * alpha;
  }
`;

// ── Scene factory ──────────────────────────────────────────────────

export interface EarthSceneOptions {
  /** Earth sphere segments — default 96. Overlay uses 96; miniature
   *  callers may pass less (recommended floor ≈ 64 to avoid visible
   *  faceting at DPR ≥ 2). */
  earthSegments?: number;
  /** Atmosphere sphere segments — default 64. Lower values are fine
   *  for miniatures because the Fresnel shader is low-frequency. */
  atmosphereSegments?: number;
  /** WebGL power preference. Overlay 'high-performance' (short-lived
   *  hero render). Header should pass 'low-power' so laptops don't
   *  wake the discrete GPU for an idle 50 px globe. */
  powerPreference?: WebGLPowerPreference;
  /** Solid color used as the material's `color` while the day texture
   *  is unbound (still loading) or after a load failure. Defaults to
   *  a near-black (0x0a0a0a) so the unloaded state reads as "preflight
   *  / placeholder" rather than as a colored sphere. Callers that
   *  want a slightly lifted dark placeholder (e.g. for the failure
   *  path where the meshes are made visible) may pass a slightly
   *  brighter cool gray. */
  fallbackSolidColor?: number;
  /** Upper bound on `renderer.setPixelRatio` — default 2. Higher
   *  values give sharper pixels but quadratic fragment-shader cost.
   *  The overlay sits at 2 (large viewport, perceptual gains beyond
   *  2 are marginal). Tiny canvases like the header globe may pass 3
   *  safely: 150² pixels of backing buffer vs 100² is negligible
   *  GPU work but a meaningful sharpness boost for the silhouette,
   *  the specular highlight, and the atmospheric rim — all of which
   *  read as partially-blended thin pixel bands at small sizes. */
  pixelRatioCap?: number;
  /** Camera Z position — default 3.85, the canonical cinematic
   *  framing where the unit-radius Earth fills ~82% of the viewport
   *  vertically and the atmosphere halo sits at ~87% (≈6% margin on
   *  every side). Bringing the camera closer (smaller value) makes
   *  the Earth fill more of the viewport — useful for miniature
   *  callers where the canvas is masked by a circular border-radius
   *  and any margin reads as wasted space between the rim glow and
   *  the visible circle edge. Recommended floor ≈ 3.4 to keep the
   *  atmosphere at radius 1.06 from clipping the canvas bounds. */
  cameraDistance?: number;
  /** Fresnel exponent in the atmosphere shader — default 5.0, the
   *  canonical overlay value. Controls how quickly the rim band
   *  decays inward from the silhouette: higher = tighter, lower =
   *  wider. Miniature callers may pass 4.0 so the band is a few
   *  pixels wider on tiny render targets where the canonical band
   *  doesn't have enough fragments to deposit visible glow. Hard
   *  floor at 4.0 — values below produce a fuzzy UI-halo look. */
  atmosphereRimExponent?: number;
  /** Sun-side intensity ceiling for the atmosphere — default 0.78,
   *  the canonical overlay "thin bright crescent against space"
   *  value. Miniature callers may pass slightly higher (e.g. 0.88)
   *  so the lit limb has enough headroom to register at tiny render
   *  targets. Keep < 1.0 so the rim never fully saturates and the
   *  effect stays a thin atmospheric band rather than a uniform
   *  ring. The night-limb cap is hardcoded at 0.18 in the shader —
   *  the asymmetry between lit and dark limbs is the realism cue
   *  and is intentionally not adjustable. */
  atmosphereMaxIntensityLit?: number;
  /** `renderer.toneMappingExposure` — default 1.12, the canonical
   *  overlay value in the documented "noticeable but not filmic"
   *  1.10-1.18 range. Miniature callers may pass slightly higher
   *  (e.g. 1.17) as a tiny-size readability multiplier — small
   *  render targets perceptually compress the visible luminosity
   *  range, and a small exposure lift inside the documented safe
   *  band brings the camera-facing hemisphere back to the same
   *  perceived brightness the overlay has at large size. The lift
   *  is applied to the final composited frame; it preserves the
   *  per-light intensity ratios so the dark/light contrast and
   *  terminator character are unchanged in ratio space — they just
   *  sit slightly higher in absolute brightness. Hard ceiling at
   *  1.18 — values above leak into filmic / cartoonish territory. */
  toneMappingExposure?: number;
}

export interface DayTextureCallbacks {
  /** Fired AFTER the WebP is decoded, anisotropy + sRGB set, and
   *  bound to `earthMaterial.map`. Callers that hide the Earth +
   *  atmosphere meshes at construction should set `.visible = true`
   *  here. The `HTMLImageElement` generic matches what
   *  `THREE.TextureLoader` actually returns (it extends
   *  `Loader<Texture<HTMLImageElement>>`), so callers can read
   *  `tex.image.width / height` for diagnostic logging without
   *  having to cast. */
  onLoad?: (tex: THREE.Texture<HTMLImageElement>) => void;
  /** Fired on network / decode failure. The material's `map`
   *  remains `null` and the material renders with whatever
   *  `fallbackSolidColor` the caller set. Callers should decide
   *  whether to reveal the meshes with the neutral placeholder
   *  or keep them hidden; log loudly either way. */
  onError?: (err: unknown) => void;
}

export interface EarthSceneHandle {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  canvas: HTMLCanvasElement;
  earth: THREE.Mesh;
  earthMaterial: THREE.MeshPhongMaterial;
  earthGeometry: THREE.SphereGeometry;
  atmosphere: THREE.Mesh;
  atmosphereMaterial: THREE.ShaderMaterial;
  atmosphereGeometry: THREE.SphereGeometry;
  ambient: THREE.AmbientLight;
  sun: THREE.DirectionalLight;
  hemi: THREE.HemisphereLight;
  /** Capability-clamped anisotropy applied to every Earth texture. */
  maxAniso: number;
  /** Start the async WebP load. Idempotent calls are not guarded —
   *  call once per scene. */
  loadDayTexture(callbacks?: DayTextureCallbacks): void;
  /** Re-read the container's bounding rect, resize the renderer's
   *  drawing buffer, update camera aspect/projection. Does NOT
   *  render — the wrapper decides when to paint. */
  sizeFromContainer(): void;
  /** Whether the real NASA WebP is currently bound. 'real-webp' once
   *  the texture decodes and is attached to the material; 'pending'
   *  during the load window AND after a load failure (no CPU
   *  fallback texture exists anymore — failure leaves the material
   *  at `map: null` with the neutral solid color). */
  getTextureSource(): 'real-webp' | 'pending';
  /** Returns the upgraded day texture if one has loaded, else null.
   *  Wrappers use this for diagnostic snapshots (e.g. `refit()`). */
  getUpgradedDayTexture(): THREE.Texture | null;
  /** Mark the scene disposed BEFORE freeing GPU resources so any
   *  in-flight texture-load callback no-ops cleanly. Calling
   *  `disposeAll` already does this; expose it separately so the
   *  wrapper can sequence its own teardown (listener removal,
   *  observer disconnect) in between. */
  markDisposed(): void;
  /** Has `markDisposed` or `disposeAll` been called? */
  isDisposed(): boolean;
  /** Dispose every GPU object the core owns: geometries, materials,
   *  textures, renderer; then remove the canvas from the DOM. Safe
   *  to call multiple times. */
  disposeAll(): void;
}

/**
 * Build the shared Earth scene and mount its canvas into `container`.
 * Returns the handle described above; the caller layers its own
 * lifecycle and interaction on top.
 *
 * The function does NOT call `renderer.render()` — that's the
 * wrapper's choice (the cinematic overlay paints inside an rAF loop;
 * the header miniature paints on demand). The wrapper should call
 * `sizeFromContainer()` once after construction and render at least
 * one frame before showing the canvas, or paint it via its own
 * lifecycle pump.
 *
 * No CPU-generated fallback texture is constructed. The earth
 * material starts with `map: null` and `color = fallbackSolidColor`,
 * so before the NASA WebP decodes (or after a load failure) the
 * mesh renders as a neutral dark sphere with the atmospheric rim.
 * Wrappers that prefer "hidden until loaded" should set
 * `earth.visible = false` + `atmosphere.visible = false` immediately
 * after this function returns, then flip them back inside the
 * `loadDayTexture` callbacks.
 */
export function createEarthScene(
  container: HTMLElement,
  options: EarthSceneOptions = {},
): EarthSceneHandle {
  const earthSegments = options.earthSegments ?? 96;
  const atmosphereSegments = options.atmosphereSegments ?? 64;
  const powerPreference = options.powerPreference ?? 'high-performance';
  const fallbackSolidColor = options.fallbackSolidColor ?? 0x0a0a0a;
  const pixelRatioCap = options.pixelRatioCap ?? 2;
  const cameraDistance = options.cameraDistance ?? 3.85;
  const atmosphereRimExponent = options.atmosphereRimExponent ?? 5.0;
  const atmosphereMaxIntensityLit = options.atmosphereMaxIntensityLit ?? 0.78;
  const toneMappingExposure = options.toneMappingExposure ?? 1.12;

  // ── Scene ────────────────────────────────────────────────────────
  const scene = new THREE.Scene();

  // Composition: FOV 35° + camera at z=3.85 frames the unit-radius
  // Earth so the sphere fills ~82% of the viewport vertically with
  // the atmosphere halo (radius 1.06) sitting at ~87% — ~6% margin
  // on every side. Telephoto compression reads as a real distant
  // planet instead of a wide-angle ball. Aspect updates on resize.
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, cameraDistance);

  // ── Renderer ─────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference,
  });
  // Pixel-ratio cap configurable per caller. Overlay defaults to 2
  // (large viewport — gains beyond 2 are marginal, cost grows
  // quadratically). Miniature callers may opt up to 3 for sharper
  // sub-pixel detail on a tiny backing buffer; the extra fragment
  // work is negligible at that viewport size.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.LinearToneMapping;
  // Exposure configurable per caller. Overlay defaults to 1.12 —
  // "noticeable but not filmic" 1.10-1.18 range. Miniature callers
  // may pass slightly higher (e.g. 1.17) as a tiny-size readability
  // multiplier; see `toneMappingExposure` in EarthSceneOptions for
  // the rationale and the 1.18 hard ceiling.
  renderer.toneMappingExposure = toneMappingExposure;

  const canvas = renderer.domElement;
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.setAttribute('aria-hidden', 'true');
  container.appendChild(canvas);

  const maxAniso = Math.min(16, renderer.capabilities.getMaxAnisotropy());

  // ── Earth sphere ─────────────────────────────────────────────────
  // Material starts with `map: null` — there is no fallback texture.
  // The NASA WebP swaps in once `loadDayTexture` resolves. Until
  // then (and forever if the load fails) the material renders with
  // `fallbackSolidColor` * lighting, producing a neutral dark sphere
  // with the atmospheric rim. Wrappers that prefer the Earth hidden
  // during loading should set `earth.visible = false` after this
  // function returns; the core does not impose that choice.
  //
  //   • specular #1c2a3a — deep cool steel-blue, restrained.
  //     Reads as moonlit ocean reflection rather than chrome.
  //   • shininess 22 — broad soft sheen that wraps across the
  //     day-side instead of punching a single tight hotspot.
  const earthMaterial = new THREE.MeshPhongMaterial({
    map: null,
    color: new THREE.Color(fallbackSolidColor),
    specular: new THREE.Color(0x1c2a3a),
    shininess: 22,
  });
  const earthGeometry = new THREE.SphereGeometry(1, earthSegments, earthSegments);
  const earth = new THREE.Mesh(earthGeometry, earthMaterial);
  scene.add(earth);

  // ── Atmosphere halo ──────────────────────────────────────────────
  const atmosphereGeometry = new THREE.SphereGeometry(1.06, atmosphereSegments, atmosphereSegments);
  const atmosphereMaterial = new THREE.ShaderMaterial({
    uniforms: {
      // Same vector the surface DirectionalLight uses for its world
      // position. Static for the lifetime of the scene.
      uSunDir: { value: SUN_WORLD_POSITION.clone().normalize() },
      // Rim-band width control — see `atmosphereRimExponent` in
      // EarthSceneOptions for the per-caller rationale. Default
      // 5.0 = canonical overlay; miniatures may opt to 4.0.
      uRimExponent: { value: atmosphereRimExponent },
      // Lit-limb intensity ceiling — see `atmosphereMaxIntensityLit`
      // in EarthSceneOptions. Default 0.78 = canonical overlay;
      // miniatures may opt to ~0.88.
      uMaxIntensityLit: { value: atmosphereMaxIntensityLit },
    },
    vertexShader: ATMOSPHERE_VERTEX_SHADER,
    fragmentShader: ATMOSPHERE_FRAGMENT_SHADER,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
  });
  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  scene.add(atmosphere);

  // ── Lights ───────────────────────────────────────────────────────
  // Three cheap lights, balanced so the camera-facing center of the
  // visible face lands in the readable mid-tone register and the
  // dark side stays clearly distinct (~2.7× darker than lit side).
  //
  //   • DirectionalLight ("sun") — key light, 1.55 at the sun
  //     position. The visible hemisphere reads clearly; bright land
  //     (Sahara, polar ice) saturates slightly sooner.
  //   • AmbientLight — warm earthshine fill, 0.55. Keeps the night
  //     side as a soft visible glow rather than a black void.
  //   • HemisphereLight — atmospheric scatter, 0.48. Cool top
  //     (0x9ab8ff) + warm bottom (0x7a5e3a) gives dimensional
  //     richness — polar caps cooler, equator warmer.
  const ambient = new THREE.AmbientLight(0xfff3dc, 0.55);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffffff, 1.55);
  sun.position.copy(SUN_WORLD_POSITION);
  scene.add(sun);

  const hemi = new THREE.HemisphereLight(0x9ab8ff, 0x7a5e3a, 0.48);
  scene.add(hemi);

  // ── Disposal / texture-state bookkeeping ─────────────────────────
  let disposed = false;
  let upgradedDayTex: THREE.Texture | null = null;
  let textureSource: 'real-webp' | 'pending' = 'pending';

  function sizeFromContainer(): void {
    const rect = container.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function loadDayTexture(callbacks: DayTextureCallbacks = {}): void {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      DAY_TEXTURE_URL,
      (tex) => {
        // If destroy ran while the request was in flight, the
        // material and renderer are already gone. Release the GPU
        // memory we just uploaded and bail.
        if (disposed) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = maxAniso;
        tex.needsUpdate = true;

        upgradedDayTex = tex;
        earthMaterial.map = tex;
        // Reset color to white so the bound texture's pixels render
        // at their true sRGB values — any tint from `fallbackSolidColor`
        // would multiply against the texture and darken the planet.
        earthMaterial.color.setHex(0xffffff);
        earthMaterial.needsUpdate = true;

        textureSource = 'real-webp';

        callbacks.onLoad?.(tex);
      },
      undefined,
      (err) => {
        // Material keeps `map: null` and the neutral
        // fallbackSolidColor. Callers decide whether to reveal the
        // meshes with the neutral placeholder or stay hidden.
        callbacks.onError?.(err);
      },
    );
  }

  function markDisposed(): void {
    disposed = true;
  }

  function disposeAll(): void {
    disposed = true;
    earthGeometry.dispose();
    earthMaterial.dispose();
    if (upgradedDayTex) upgradedDayTex.dispose();
    atmosphereGeometry.dispose();
    atmosphereMaterial.dispose();
    renderer.dispose();
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  }

  return {
    scene,
    camera,
    renderer,
    canvas,
    earth,
    earthMaterial,
    earthGeometry,
    atmosphere,
    atmosphereMaterial,
    atmosphereGeometry,
    ambient,
    sun,
    hemi,
    maxAniso,
    loadDayTexture,
    sizeFromContainer,
    getTextureSource: () => textureSource,
    getUpgradedDayTexture: () => upgradedDayTex,
    markDisposed,
    isDisposed: () => disposed,
    disposeAll,
  };
}
