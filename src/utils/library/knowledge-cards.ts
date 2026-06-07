/**
 * Knowledge Cards — artifact assets for orbit cards.
 *
 * DISCOVERY MODEL — fully automatic, zero hardcoded slugs
 *
 *   Drop a folder under `src/assets/knowledge-cards/<slug>/` containing:
 *     front.png      — REQUIRED. The single visible face for every
 *                      orbit position. New cards only need this one.
 *     left.png       — OPTIONAL legacy face shown on the left arc.
 *     right.png      — OPTIONAL legacy face shown on the right arc.
 *     selected.png   — OPTIONAL legacy face for click-focused / center.
 *
 *   …and on the next build / dev-server reload the matching library
 *   item will appear in artifact mode. Vite's `import.meta.glob` walks
 *   the tree at build time, so adding / removing a folder Just Works
 *   without touching code, configs, or any registry.
 *
 *   - `front.png` present → returned as a complete asset bundle. Any
 *     legacy face that also exists on disk is included verbatim;
 *     consumers (e.g. LibraryCard.astro) fall back to `front` when a
 *     legacy face is absent, so single-image folders still render.
 *   - `front.png` missing → undefined → the page-level filter drops
 *     the item from the orbit and the existing medallion fallback
 *     remains in place for non-orbit views (e.g. mobile carousel).
 *   - Slug matching is case-insensitive (Windows-friendly): an item with
 *     slug `AI-Developer-Fitness` matches a folder named
 *     `ai-developer-fitness` and vice versa.
 *
 *   Why `src/assets/` and not `public/`?
 *     `src/assets/` flows through Vite's pipeline, so the URLs are
 *     content-hashed (cache-busting on rebuild) and the discovery is
 *     glob-based (no hand-rolled `fs.readdirSync`).
 *
 *   Build-time visibility: every SSR pass logs a discovery report
 *   listing each detected folder, which faces are present, and whether
 *   the bundle is complete. Look for lines starting with
 *   `[knowledge-cards]` in the dev-server console / build output.
 */

// ── Vite glob discovery ────────────────────────────────────────────────
// One glob per face. `eager: true` returns URLs synchronously at module
// load; `import: 'default'` + `query: '?url'` resolves each PNG to its
// bundled URL. The four-glob shape (instead of one wildcard) lets us
// require each named face without parsing filenames at runtime.
const FRONT_GLOBS = import.meta.glob<string>(
  '/src/assets/knowledge-cards/*/front.png',
  { eager: true, query: '?url', import: 'default' },
);
const LEFT_GLOBS = import.meta.glob<string>(
  '/src/assets/knowledge-cards/*/left.png',
  { eager: true, query: '?url', import: 'default' },
);
const RIGHT_GLOBS = import.meta.glob<string>(
  '/src/assets/knowledge-cards/*/right.png',
  { eager: true, query: '?url', import: 'default' },
);
const SELECTED_GLOBS = import.meta.glob<string>(
  '/src/assets/knowledge-cards/*/selected.png',
  { eager: true, query: '?url', import: 'default' },
);

// ── Per-card icon ─────────────────────────────────────────────────────
// `icon.png` is an OPTIONAL small badge image — distinct from the orbit
// `front.png` cover. It is used in the "all items" surfaces (desktop
// KnowledgeAtlas capsule + mobile all-items sheet) in place of the
// generic type glyph. Same folder convention and case-insensitive slug
// matching as the faces above; missing icons simply leave the existing
// fallback (front.png thumb / type glyph) untouched.
const ICON_GLOBS = import.meta.glob<string>(
  '/src/assets/knowledge-cards/*/icon.png',
  { eager: true, query: '?url', import: 'default' },
);

// ── Shared placeholder asset ──────────────────────────────────────────
// `_placeholders/book-front.png` is the single fallback image used by
// any regular content item (book / lesson / generic content) that does
// not yet have its own `front.png`. The file lives outside the per-slug
// folder convention so:
//   • the per-slug front.png glob never picks it up (the wildcard `*`
//     would match `_placeholders` as a folder, but the filename here
//     is `book-front.png`, not `front.png`, so the patterns don't
//     collide);
//   • `slugFromGlobPath` defensively skips any `_`-prefixed folder
//     name, so even if a future placeholder is ever named `front.png`
//     it still won't surface as a discoverable item slug.
// Series capsules MUST keep using their real folder asset, so the
// placeholder helper below is opted-in per call (`{ allowPlaceholder }`).
const PLACEHOLDER_GLOBS = import.meta.glob<string>(
  '/src/assets/knowledge-cards/_placeholders/book-front.png',
  { eager: true, query: '?url', import: 'default' },
);
const BOOK_PLACEHOLDER_URL: string | undefined =
  Object.values(PLACEHOLDER_GLOBS)[0];

// ── Public API ─────────────────────────────────────────────────────────
export interface KnowledgeCardAssets {
  /** REQUIRED. The single visible face for every orbit position. */
  front: string;
  /** Optional legacy face. Consumers should fall back to `front`. */
  left?: string;
  /** Optional legacy face. Consumers should fall back to `front`. */
  right?: string;
  /**
   * Optional legacy face. Shown on the click-focused / promoted-to-center
   * card. Authored intentionally taller than `front.png` (~50 % more
   * vertical) so the focused presentation stands clearly apart from the
   * orbit-station artwork. Layout adapts: when this face is active, the
   * artifact container's aspect-ratio relaxes so the image renders at
   * its natural proportions without clipping. Consumers should fall back
   * to `front` when this face is absent.
   */
  selected?: string;
}

/** Names of every face the discovery code looks for. Single source of truth. */
const FACE_KEYS = ['front', 'left', 'right', 'selected'] as const;
type FaceKey = (typeof FACE_KEYS)[number];

/**
 * The only face required for an item to be considered COMPLETE. Legacy
 * faces (left/right/selected) are included if present but never gate
 * discovery — single-image folders are first-class citizens.
 */
const REQUIRED_FACE: FaceKey = 'front';

/**
 * Returns the four-face asset URLs for a slug, or `undefined` when
 * the slug has no complete set of assets. Matches case-insensitively.
 *
 * Behavior contract:
 *   - `front.png` present → `{ front, left?, right?, selected? }` with
 *     each optional face populated only if it exists on disk. This
 *     preserves backward compatibility: existing folders that still
 *     ship all four PNGs continue to expose distinct left/right/
 *     selected URLs and render unchanged.
 *   - `front.png` missing → `undefined`. The page-level filter then
 *     drops the item from the orbit and the existing medallion
 *     fallback remains in place for non-orbit views (e.g. mobile
 *     carousel).
 *
 * Discovery model: this function is queried per-slug by callers that
 * already have a discovered LibraryItem in hand — the slug list comes
 * from `discoverAllBooks()` (book-discovery.ts), which requires a real
 * `output/<slug>/` folder with chapters. As a result, ORPHAN folders
 * here (artwork left behind after a book was deleted, never re-imported)
 * are silently ignored: they live in the cache, but no caller ever
 * queries them. knowledge-cards is asset storage; it never produces a
 * book on its own.
 */
export function getKnowledgeCardAssets(slug: string): KnowledgeCardAssets | undefined {
  if (assetsCache === null) assetsCache = buildCache();
  return assetsCache.get(normalizeSlug(slug));
}

/**
 * Returns the asset bundle for `slug`, falling back to the shared
 * `_placeholders/book-front.png` when no per-slug `front.png` exists.
 *
 * Use this for regular content items (books, lessons, generic content)
 * where the placeholder is acceptable. The series capsule
 * (`ai-engineering-series` and any future series) must keep using its
 * real asset folder, so callers rendering a series should keep calling
 * `getKnowledgeCardAssets(slug)` directly — the helper below is opt-in.
 *
 * Returns `undefined` only when both the per-slug folder AND the shared
 * placeholder are missing on disk; in that case the caller's existing
 * "no artifact" path (medallion fallback) still applies.
 */
export function getKnowledgeCardAssetsOrPlaceholder(
  slug: string,
): KnowledgeCardAssets | undefined {
  const real = getKnowledgeCardAssets(slug);
  if (real) return real;
  if (!BOOK_PLACEHOLDER_URL) return undefined;
  // Single-face bundle. The orbit's resting state already shows the
  // front face for every station (the legacy left/right faces are now
  // optional, see KnowledgeCardAssets above), so a placeholder card
  // renders as a single static face — exactly the behaviour we want.
  return { front: BOOK_PLACEHOLDER_URL };
}

/**
 * True when the item is being rendered with the shared placeholder
 * rather than its own per-slug artwork. Lets consumers decide whether
 * to surface a "placeholder" hint without re-deriving the URL match.
 */
export function isPlaceholderArtifact(
  artifact: KnowledgeCardAssets | undefined,
): boolean {
  if (!artifact || !BOOK_PLACEHOLDER_URL) return false;
  return artifact.front === BOOK_PLACEHOLDER_URL;
}

/**
 * Card image viewing context. Kept as a type for caller ergonomics even
 * though every mode now resolves to the same `front.png` — the canonical
 * single face is used at every viewport size and every presentation state.
 */
export type CardImageViewMode = 'carousel' | 'selected' | 'detail';

/**
 * Returns the canonical `front.png` URL for the artifact, regardless of
 * viewport or presentation mode. Returns `undefined` only when the
 * artifact itself is undefined; callers keep their existing "no artifact"
 * fallback (medallion / placeholder).
 */
export function getCardImageSrc(
  artifact: KnowledgeCardAssets | undefined,
  _viewMode: CardImageViewMode,
  _isMobile: boolean,
): string | undefined {
  return artifact?.front;
}

/**
 * Returns the per-card `icon.png` URL for a slug, or `undefined` when the
 * folder has no `icon.png`. Matches the same case-insensitive slug/folder
 * identifier used for `front.png`, so no second naming system is created.
 *
 * Consumers (KnowledgeAtlas, MobileAllItemsSheet) render this image inside
 * the existing icon container when present, and fall back to their current
 * type glyph / cover thumbnail when it is `undefined`.
 */
export function getKnowledgeCardIcon(slug: string): string | undefined {
  if (iconCache === null) iconCache = buildIconCache();
  return iconCache.get(normalizeSlug(slug));
}

// ── Internals ──────────────────────────────────────────────────────────
let assetsCache: Map<string, KnowledgeCardAssets> | null = null;
let iconCache: Map<string, string> | null = null;

function buildIconCache(): Map<string, string> {
  const cache = new Map<string, string>();
  for (const [filePath, url] of Object.entries(ICON_GLOBS)) {
    // Path shape: `/src/assets/knowledge-cards/<slug>/icon.png`
    const m = filePath.match(/\/knowledge-cards\/([^/]+)\/icon\.png$/);
    if (!m) continue;
    // Reserved `_`-prefixed folders (`_placeholders/`, …) are never slugs.
    if (m[1].startsWith('_')) continue;
    cache.set(normalizeSlug(m[1]), url);
  }
  return cache;
}

function normalizeSlug(slug: string): string {
  // Lower-case so catalog slugs (mixed case, e.g. `AI-Developer-Fitness`)
  // match folder names (typically lower-case kebab) without the user
  // having to keep them perfectly aligned.
  return slug.toLowerCase();
}

function slugFromGlobPath(path: string): string | null {
  // Path shape: `/src/assets/knowledge-cards/<slug>/<face>.png`
  const m = path.match(
    /\/knowledge-cards\/([^/]+)\/(?:front|left|right|selected)\.png$/,
  );
  if (!m) return null;
  // Folders with a leading underscore are reserved for shared assets
  // (`_placeholders/`, future `_templates/`, etc.) and must never be
  // treated as a content slug — otherwise the orbit would surface a
  // ghost station for a non-existent item.
  if (m[1].startsWith('_')) return null;
  return m[1];
}

function buildCache(): Map<string, KnowledgeCardAssets> {
  // Pass 1: gather every face we found, keyed on the lower-cased slug.
  // The original on-disk slug is preserved alongside so the discovery
  // report can show authors what they actually named the folder.
  type PartialFaces = {
    onDiskSlug: string;
    faces: Partial<KnowledgeCardAssets>;
  };
  const partial = new Map<string, PartialFaces>();

  function collect(
    globs: Record<string, string>,
    face: FaceKey,
  ): void {
    for (const [filePath, url] of Object.entries(globs)) {
      const slug = slugFromGlobPath(filePath);
      if (!slug) continue;
      const key = normalizeSlug(slug);
      const entry = partial.get(key) ?? { onDiskSlug: slug, faces: {} };
      entry.faces[face] = url;
      partial.set(key, entry);
    }
  }

  collect(FRONT_GLOBS, 'front');
  collect(LEFT_GLOBS, 'left');
  collect(RIGHT_GLOBS, 'right');
  collect(SELECTED_GLOBS, 'selected');

  // Pass 2: keep slugs whose folder has the single required face
  // (`front.png`). Optional legacy faces (left/right/selected) are
  // carried over verbatim when present so existing four-face folders
  // keep their distinct artwork; missing legacy faces stay `undefined`
  // and consumers fall back to `front`.
  const cache = new Map<string, KnowledgeCardAssets>();
  for (const [key, { faces }] of partial) {
    if (faces[REQUIRED_FACE]) {
      // `faces.front` is guaranteed by the check above; the cast keeps
      // TypeScript happy without a runtime non-null assertion.
      cache.set(key, faces as KnowledgeCardAssets);
    }
  }

  reportDiscovery(partial, cache);
  return cache;
}

/**
 * Build-time discovery report — printed to the dev-server / build
 * console. Helps diagnose silent slug / case mismatches and missing
 * faces.
 */
function reportDiscovery(
  partial: Map<string, { onDiskSlug: string; faces: Partial<KnowledgeCardAssets> }>,
  complete: Map<string, KnowledgeCardAssets>,
): void {
  // Single, scoped headline so the report is easy to grep.
  // eslint-disable-next-line no-console
  console.log(
    `[knowledge-cards] discovered ${partial.size} folder(s); `
    + `${complete.size} complete (require ${REQUIRED_FACE}.png; `
    + `legacy faces ${FACE_KEYS.filter((f) => f !== REQUIRED_FACE).join('/')} `
    + `are optional).`,
  );
  for (const [key, { onDiskSlug, faces }] of partial) {
    const present = FACE_KEYS.filter((f) => faces[f]);
    const missingLegacy = FACE_KEYS
      .filter((f) => f !== REQUIRED_FACE && !faces[f]);
    const status = complete.has(key) ? 'COMPLETE' : 'INCOMPLETE';
    const detail = !faces[REQUIRED_FACE]
      ? `missing required: ${REQUIRED_FACE}`
      : missingLegacy.length === 0
        ? 'all faces present'
        : `legacy missing (will fall back to front): ${missingLegacy.join(', ')}`;
    // eslint-disable-next-line no-console
    console.log(
      `[knowledge-cards]   [${status}] ${onDiskSlug}`
      + ` (lookup key: ${key}) — `
      + `present: ${present.join(', ') || '(none)'}; ${detail}`,
    );
  }
}
