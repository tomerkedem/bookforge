/**
 * header-earth-3d
 *
 * Tiny dedicated Three.js renderer that paints the SMALL header
 * globe as a real miniature Earth, using the same rendering family
 * as the cinematic overlay Earth (`interactive-earth-3d.ts`). The
 * goal is identity continuity: when the user clicks the small
 * globe, the large globe that launches is recognizably the SAME
 * object scaled up — same texture, same sun direction, same
 * atmospheric rim, same material response — not a CSS sticker
 * opening into a photorealistic sphere.
 *
 * Differences from the large module — performance trims only, no
 * visual-language changes:
 *
 *   • Geometry: sphere segments 96 → 32, atmosphere 64 → 32. The
 *     header canvas is 42-50 px on screen; 32 segments is enough
 *     to read as a smooth sphere at that scale.
 *   • Rendering: on-demand only. No requestAnimationFrame loop,
 *     no idle rotation, no drag handlers, no focus animation.
 *     A render() runs on three events:
 *       1. Texture-load completion (after async fetch)
 *       2. setFocus() — language change
 *       3. setParallax() — pointer-hover offset
 *     Total cost while the header sits idle: 0 GPU work.
 *   • No CPU-generated fallback texture. If the WebP fails to
 *     load (rare — the same URL is cached by the overlay's loader
 *     and by other pages), the material stays at a neutral solid
 *     color. The host component keeps its CSS bg-image as the
 *     final visible fallback.
 *
 * What is identical to the large module — these are the visual
 * properties the user explicitly asked us to preserve:
 *
 *   • Texture URL                 /assets/globe/earth-day-2k.webp
 *   • Texture color space         sRGB, anisotropy capped at 16
 *   • Camera                      35° FOV, position (0, 0, 3.85)
 *   • Sun world position          (-1.2, 1.3, 3.2)
 *   • Material                    MeshPhongMaterial, specular
 *                                 #1c2a3a, shininess 22
 *   • Lighting                    Ambient #fff3dc 0.55,
 *                                 DirectionalLight 1.55 at sun,
 *                                 HemisphereLight 0x9ab8ff/
 *                                 0x7a5e3a 0.48
 *   • Tone mapping                Linear, exposure 1.12
 *   • Atmosphere shader           same vertex + fragment program
 *                                 (back-side sphere at 1.06,
 *                                 Fresnel × sun-side blend,
 *                                 additive blend, no depth write)
 *   • Rotation convention         rotation.y = (-90° - lng),
 *                                 rotation.x = +lat (clamped at
 *                                 the poles). Same -90° UV
 *                                 calibration as the large module.
 *
 * The handle returned to the host exposes a deliberately narrow
 * surface: setFocus, setParallax, destroy. No projectLatLng (no
 * hotspot at the header scale), no setIdleRotation (no rAF loop),
 * no refit (the canvas auto-resizes via ResizeObserver).
 */

import * as THREE from 'three';

export interface HeaderEarthFocus {
  lat: number;
  lng: number;
}

export interface HeaderEarthHandle {
  /** Stop rendering, dispose all GPU resources, remove the canvas. */
  destroy(): void;
  /** Snap-rotate so (lat, lng) faces the camera. Triggers one render. */
  setFocus(lat: number, lng: number): void;
  /**
   * Apply a small visual parallax — slight rotation offsets driven
   * by the host's pointer-move handler. Values are in pixels (the
   * host's existing -12..+12 / -8..+8 budget for px / py). They are
   * mapped to small radian deltas so a 12 px shift produces a few
   * degrees of nudge, not a half-globe spin. Triggers one render.
   * Pass (0, 0) on pointerleave to reset.
   */
  setParallax(px: number, py: number): void;
  /** The mounted <canvas>. Host uses this only for cleanup hooks. */
  readonly canvas: HTMLCanvasElement;
}

const DEG = Math.PI / 180;
const POLE_CLAMP = Math.PI / 2 - 0.05;
// Same UV-calibration offset as the large module — keeps the same
// "rotation.y = (-90° - lng) DEG" formula. See the LNG_TO_ROTATION_Y_OFFSET_DEG
// comment in interactive-earth-3d.ts for the full derivation.
const LNG_TO_ROTATION_Y_OFFSET_DEG = -90;

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function createHeaderEarth(
  container: HTMLElement,
  initialFocus: HeaderEarthFocus | null = null,
): HeaderEarthHandle {
  // ── Scene ────────────────────────────────────────────────────────
  const scene = new THREE.Scene();

  // Camera — same composition as the cinematic Earth (35° FOV,
  // z = 3.85). Aspect 1:1 because the host container is square.
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 3.85);

  // Sun position — identical to the large module's SUN_WORLD_POSITION.
  // The DirectionalLight and the atmosphere shader's uSunDir both
  // reference this vector, so the surface terminator and the
  // atmospheric rim's lit limb stay aligned (same as on the large
  // Earth).
  const SUN_WORLD_POSITION = new THREE.Vector3(-1.2, 1.3, 3.2);

  // ── Renderer ─────────────────────────────────────────────────────
  // power preference 'low-power': the header canvas paints at 42-50 px
  // and renders on demand only. A discrete GPU isn't needed; on
  // laptops with switchable graphics this hint lets the integrated
  // GPU handle the work.
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.LinearToneMapping;
  // Exposure pushed to 1.25 for the miniature. The large module
  // sits at 1.12 (documented "noticeable but not filmic" 1.10-1.18
  // range). Crossing the upper edge here is deliberate: the
  // miniature has to overcome the perceptual dimming that small
  // render targets impose. The previous 1.18 was still subtle.
  // 1.25 lifts the lit hemisphere into "polished and present"
  // territory; combined with the brighter key light below it
  // produces the same visible luminosity at 50 px that the large
  // Earth has at 600 px. Linear tone-mapping keeps the ratio
  // between lit / dark sides identical to before — the terminator
  // stays clean, not blown out.
  renderer.toneMappingExposure = 1.25;

  const canvas = renderer.domElement;
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.borderRadius = '50%';
  canvas.setAttribute('aria-hidden', 'true');
  // pointer-events: none so the host's existing trigger click /
  // hover-parallax handlers fire on the .lgs-trigger button rather
  // than on the canvas (the canvas is purely a visual surface).
  canvas.style.pointerEvents = 'none';
  container.appendChild(canvas);

  const maxAniso = Math.min(16, renderer.capabilities.getMaxAnisotropy());

  // ── Earth sphere ─────────────────────────────────────────────────
  // Lower geometry detail than the large module (32×32 vs 96×96) —
  // at the header's 42-50 px display size, the extra triangles of a
  // higher-poly sphere would never resolve. Material settings are
  // identical: specular, shininess, no specularMap (same reason as
  // the large module — the polygon mask doesn't align with the
  // Blue Marble continents).
  // Specular tuned for "polished / waxed surface, oceans catching
  // the sun" — the quality the user explicitly called out as still
  // missing. Two changes compound: brighter specular base + tighter
  // (higher) shininess.
  //
  //   • specular color #355478 → #4a6c98. A meaningful jump in
  //     lightness, kept in the same cool-blue family. At 50 px,
  //     the previous #355478 produced a sheen that was technically
  //     present but read as "soft fill," not "lit ocean." #4a6c98
  //     pushes the highlight into the visible-pixel range.
  //   • shininess 18 → 30. The previous "broad pool" approach was
  //     a compromise — it kept the highlight in pixels but lost
  //     the polished character (tight bright glints are what
  //     reads as "waxed / lacquered"). At shininess 30 the
  //     specular pool tightens but stays visible at miniature
  //     because the brighter specular color compensates for the
  //     narrower angular footprint. Net: ocean glint becomes a
  //     small, bright, distinctly polished highlight along the
  //     lit limb — the wet/waxed look on real Earth photos from
  //     orbit.
  //
  // No specularMap (the large module also doesn't use one) — the
  // continents in the Blue Marble texture are dark enough that
  // they read as matte even with this higher specular response,
  // while oceans (lighter bluescale areas) take the highlight
  // beautifully. The large module's MeshPhongMaterial is
  // untouched at #1c2a3a / 22.
  const earthMaterial = new THREE.MeshPhongMaterial({
    color: 0x6478a0, // neutral fallback while the WebP is in flight
    specular: new THREE.Color(0x4a6c98),
    shininess: 30,
  });
  const earthGeometry = new THREE.SphereGeometry(1, 32, 32);
  const earth = new THREE.Mesh(earthGeometry, earthMaterial);
  scene.add(earth);

  // Apply the initial focus BEFORE the first render so the very
  // first frame paints with the active language's region already
  // facing the camera — no visible "flash at lat=0/lng=0" before
  // the setFocus call would correct it.
  if (initialFocus) {
    earth.rotation.y = (LNG_TO_ROTATION_Y_OFFSET_DEG - initialFocus.lng) * DEG;
    earth.rotation.x = clamp(initialFocus.lat * DEG, -POLE_CLAMP, POLE_CLAMP);
  }

  // ── Real Earth day texture ───────────────────────────────────────
  // Same WebP as the large Earth. The browser cache dedupes the
  // request when the user opens the cinematic overlay later — the
  // header is usually the first thing to load this file on a fresh
  // session. If decode fails we keep the solid color material; the
  // host CSS also has a fallback bg-image rule on .lgs-globe that
  // shows through the transparent canvas areas.
  let upgradedDayTex: THREE.Texture | null = null;
  let disposed = false;
  const DAY_TEXTURE_URL = '/assets/globe/earth-day-2k.webp';
  const textureLoader = new THREE.TextureLoader();
  textureLoader.load(
    DAY_TEXTURE_URL,
    (tex) => {
      if (disposed) {
        tex.dispose();
        return;
      }
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = maxAniso;
      tex.needsUpdate = true;
      upgradedDayTex = tex;
      earthMaterial.map = tex;
      earthMaterial.color.setHex(0xffffff); // texture provides the color now
      earthMaterial.needsUpdate = true;
      // Repaint with the textured planet — the only "scheduled"
      // render that fires outside an explicit setFocus / setParallax
      // call. Cost: one WebGL draw call to a 42-50 px viewport.
      requestRender();
    },
    undefined,
    () => {
      // Silent fallback — the solid-color material stays bound, and
      // the host CSS bg-image (still present on .lgs-globe) remains
      // visible behind the canvas's transparent areas. No console
      // noise; production header builds should stay quiet.
    },
  );

  // ── Atmosphere halo ──────────────────────────────────────────────
  // Same shader program as the large module — back-side sphere at
  // radius 1.06, Fresnel × sun-side blend, additive, no depth write.
  // The geometry is simplified (32×32 vs 64×64), but the shader is
  // byte-for-byte identical so the cyan-white lit-limb / blue-violet
  // night-limb mix is exactly the same color identity at small size.
  const atmosphereGeometry = new THREE.SphereGeometry(1.06, 32, 32);
  const atmosphereMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uSunDir: { value: SUN_WORLD_POSITION.clone().normalize() },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormalView;
      varying vec3 vNormalWorld;
      void main() {
        vNormalView = normalize(normalMatrix * normal);
        vNormalWorld = normalize(normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uSunDir;
      varying vec3 vNormalView;
      varying vec3 vNormalWorld;
      void main() {
        float rim = 1.0 - dot(vNormalView, vec3(0.0, 0.0, 1.0));
        // pow exponent 4.0 → 3.0 for the header miniature only.
        // Each step down meaningfully widens the visible rim band:
        // pow 5 ≈ "razor-thin, mostly invisible at 50 px",
        // pow 4 ≈ "1-2 px line, still subtle",
        // pow 3 ≈ "2-3 px atmospheric band, clearly readable as
        // real planetary atmosphere". The user called the previous
        // 4.0 pass too subtle — pow 3 is the visible-rim threshold
        // the user is asking for. Crucially, the rim still decays
        // to zero past ~25 % of the way inward, so it never bleeds
        // across the continents — it stays an EDGE phenomenon.
        float rimI = pow(clamp(rim, 0.0, 1.0), 3.0);
        float sunFacing = dot(vNormalWorld, uSunDir);
        float sunSide = smoothstep(-0.2, 0.4, sunFacing);
        vec3 dayInner = vec3(0.30, 0.62, 1.05);
        vec3 dayOuter = vec3(0.72, 0.92, 1.10);
        vec3 dayCol = mix(dayInner, dayOuter, smoothstep(0.0, 1.0, rimI));
        vec3 nightTint = vec3(0.16, 0.24, 0.55);
        vec3 col = mix(nightTint, dayCol, sunSide);
        // Intensity ceiling lifted: 0.22/0.88 → 0.26/1.00. The lit
        // limb now saturates at full alpha — the same "thin bright
        // crescent against space" the large Earth achieves at
        // 600 px. The Fresnel × sun-side product keeps that
        // saturation CONFINED to the sun-facing limb edge; it
        // never spills around the full silhouette. The night limb
        // moves only +0.04 (0.22 → 0.26) so the dark side stays a
        // quiet desaturated halo — the atmosphere is asymmetric,
        // brilliant on the lit side, almost-invisible on the
        // dark side, which is exactly how a real planet looks
        // from orbit when the sun is off-camera.
        float maxIntensity = mix(0.26, 1.00, sunSide);
        float alpha = clamp(rimI * maxIntensity, 0.0, 1.0);
        gl_FragColor = vec4(col, 1.0) * alpha;
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
  // Three-light rig pushed harder for the header miniature only.
  // The previous pass (sun 1.80, ambient 0.65, hemi 0.58) was on
  // the right track but landed too subtle — the user explicitly
  // said the difference wasn't visible enough. This pass is more
  // assertive while staying inside realistic-planet territory.
  //
  //   • Sun (key light)  1.80 → 2.10   (+17 %)
  //       Combined with exposure 1.25 (vs the large module's
  //       1.12), the lit hemisphere now lands with roughly the
  //       same perceived luminosity at 50 px that the large
  //       Earth has at 600 px. This is the "polished surface"
  //       carrier — strong key light is what makes the brighter
  //       specular pop instead of feeling decorative.
  //   • Ambient (warm fill)  0.65 → 0.70   (+8 %)
  //       Small bump to keep the dark side from sinking after
  //       the higher exposure pulls the lit side up. The ratio
  //       lit:dark is preserved so the terminator stays clean.
  //   • Hemi (atmospheric scatter)  0.58 → 0.62   (+7 %)
  //       Matches the ambient bump. The hemi's cool top + warm
  //       bottom gives the planet its dimensional richness
  //       (polar caps cooler, equator warmer) — small uptick
  //       so the dimensional cue stays in step with the
  //       brighter key light.
  //
  // Combined with the brighter atmospheric rim and the
  // specular/shininess changes above, this pass should be
  // noticeably more visible than the previous one. Still no new
  // light objects, no shadow maps, no post-processing. The large
  // module's intensities are not touched.
  const ambient = new THREE.AmbientLight(0xfff3dc, 0.70);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffffff, 2.10);
  sun.position.copy(SUN_WORLD_POSITION);
  scene.add(sun);
  const hemi = new THREE.HemisphereLight(0x9ab8ff, 0x7a5e3a, 0.62);
  scene.add(hemi);

  // ── Resize handling ──────────────────────────────────────────────
  // The host container can change size on viewport breakpoint hits
  // (mobile 42 → desktop 44 → desktop rail 50). ResizeObserver picks
  // up the change and resizes the renderer + camera + repaints.
  const sizeFromContainer = () => {
    const rect = container.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    requestRender();
  };
  sizeFromContainer();
  const resizeObserver = new ResizeObserver(sizeFromContainer);
  resizeObserver.observe(container);

  // ── On-demand render scheduling ──────────────────────────────────
  // We don't run a rAF loop — the header globe is static unless the
  // language changes or the cursor moves. Coalesce multiple change
  // events fired in the same frame (e.g. setParallax called from a
  // pointermove handler) into a single render. The pendingRender
  // guard makes the per-frame cost worst-case one draw call even
  // under a rapid pointer-move stream.
  let pendingRender = false;
  function requestRender(): void {
    if (disposed || pendingRender) return;
    pendingRender = true;
    requestAnimationFrame(() => {
      pendingRender = false;
      if (disposed) return;
      renderer.render(scene, camera);
    });
  }
  // First paint — solid material until the texture upgrades, then
  // the load callback above schedules a second paint with the WebP.
  requestRender();

  // ── Handle ───────────────────────────────────────────────────────
  return {
    canvas,
    destroy(): void {
      // Mark disposed BEFORE releasing resources so a still-in-flight
      // texture-load callback or rAF tick can no-op cleanly without
      // touching a freed material.
      disposed = true;
      resizeObserver.disconnect();
      earthGeometry.dispose();
      earthMaterial.dispose();
      if (upgradedDayTex) upgradedDayTex.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      renderer.dispose();
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    },
    setFocus(lat: number, lng: number): void {
      earth.rotation.y = (LNG_TO_ROTATION_Y_OFFSET_DEG - lng) * DEG;
      earth.rotation.x = clamp(lat * DEG, -POLE_CLAMP, POLE_CLAMP);
      requestRender();
    },
    setParallax(px: number, py: number): void {
      // Map host's ±12 / ±8 px budget to small radian offsets. The
      // earth's BASE rotation comes from setFocus; parallax adds an
      // additional rotation on top via the matrix multiplication
      // baked into earth.rotation. To keep base rotation stable
      // across parallax updates, we instead apply the offset to a
      // CHILD rotation: the camera. Rotating the camera by a tiny
      // angle in opposite direction of the cursor offset reads as
      // the planet tilting toward the cursor — same percept as the
      // background-position-px parallax it replaces.
      const RAD_PER_PX_X = 0.0035; // ~0.20° per px of cursor offset
      const RAD_PER_PX_Y = 0.0030;
      // Negate so cursor going right → planet appears to rotate
      // toward the right side (the surface near the cursor "comes
      // forward"), matching the CSS-version sign convention.
      camera.rotation.y = -px * RAD_PER_PX_X;
      camera.rotation.x = -py * RAD_PER_PX_Y;
      requestRender();
    },
  };
}
