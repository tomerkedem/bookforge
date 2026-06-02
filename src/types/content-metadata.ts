/**
 * Editorial metadata layer for Yuval content items.
 *
 * This is intentionally separate from:
 *  - reader progress data (yuval_bookmarks_*, yuval_reading_progress_*, …)
 *  - global reader preferences (yuval_language, yuval-theme, …)
 *  - source-of-truth book data emitted by the BookForge pipeline
 *    (book-manifest.json, _catalog.json) and surfaced via
 *    `DiscoveredBook` in src/utils/book-discovery.ts
 *
 * Source-of-truth data describes what the file system contains.
 * Editorial metadata describes how Tomer wants an item presented in
 * Yuval — title overrides, grouping, visibility — and is therefore
 * stored client-side and edited from the Knowledge Control Center.
 *
 * The existing `ContentType` exported from book-discovery.ts is a
 * structural classification ('book' | 'course_lesson'). The editorial
 * type below is a presentation classification and is named
 * `ContentItemType` to avoid the collision.
 */

export type ContentItemType = 'book' | 'course' | 'article';

export type VisualMode = 'card' | 'hidden';

export interface ContentMetadata {
  slug: string;
  displayTitle: string;
  contentType: ContentItemType;
  category: string;
  seriesName: string;
  isVisibleInUniverse: boolean;
  visualMode: VisualMode;
}

export interface ContentMetadataStore {
  version: number;
  items: Record<string, ContentMetadata>;
}

export const CONTENT_METADATA_VERSION = 1;

/**
 * Series metadata layer.
 *
 * A series is implicitly created the moment two or more items share a
 * non-empty `seriesName` in their `ContentMetadata`. The series name
 * itself lives on each item; this layer stores the *presentation*
 * properties of the series — its visual type and an optional color —
 * so that derived series can be styled without duplicating the name
 * onto every item.
 *
 * Stored under its own localStorage key so neither item metadata nor
 * reader progress is affected when a series record is added or
 * edited.
 */

/**
 * Visual mode for a series. Drives how the series capsule renders in
 * the universe. The list grows additively — new modes append at the
 * end; `'capsule'` remains the default so older stored records keep
 * working without migration.
 */
export type SeriesVisualMode = 'capsule' | 'card' | 'orbit-node';

/**
 * Editorial publication state. Distinct from `isVisibleInUniverse`:
 *   - `status` is the publication lifecycle of the series record itself
 *     (still being authored vs. ready for the public universe).
 *   - `isVisibleInUniverse` is the runtime show/hide toggle on a
 *     status='active' series, kept for back-compat with prior code.
 *
 * Default behaviour for legacy (pre-status) records is `'active'` so
 * existing series remain visible.
 */
export type SeriesStatus = 'active' | 'draft' | 'hidden';

export interface SeriesMetadata {
  /**
   * Primary key — the `seriesName` typed by the user on a content item.
   * This is the identifier that links items together; do NOT replace it
   * with a synthetic id.
   */
  name: string;
  /**
   * Human-readable label rendered in the admin Series Management
   * section and (in a future phase) on the universe capsule. Defaults
   * to the same value as `name` so a freshly-detected series reads
   * sensibly until the project owner overrides it.
   */
  displayTitle: string;
  /** Visual rendering mode. Default: 'capsule'. */
  visualMode: SeriesVisualMode;
  /** Optional CSS color (hex like '#c9a96e'). Undefined = use default. */
  color?: string;
  /**
   * Optional integer that the universe will use to sort series. Lower
   * comes first. Undefined = fall back to alphabetical by displayTitle.
   * The universe rendering does NOT consume this yet — Phase 3 is
   * admin-only — but the field is editable now so editorial intent is
   * captured before downstream rendering wires up.
   */
  order?: number;
  /** Default true — when false, the universe should hide the series. */
  isVisibleInUniverse: boolean;

  // ── Optional editorial fields, added in the rich-card redesign ────
  // All of these are optional on disk: legacy stored records (which
  // simply do not have these keys) keep working unchanged. Each field
  // is `undefined` when the user has not yet filled it in.

  /** One-line tagline shown on the series card under the title. */
  shortDescription?: string;
  /** Long-form paragraph; used by the focused presentation later. */
  fullDescription?: string;
  /**
   * Editorial intent — how many books / items this series will
   * eventually contain. Drives the "X מתוך Y" counter and the progress
   * bar on the admin series card. Undefined → only "X items" is shown
   * with no Y target and no progress bar.
   */
  plannedBooksCount?: number;
  /**
   * Folder name under `src/assets/knowledge-cards/<slug>/` that holds
   * the series's visual artifact (front.png at minimum). When omitted,
   * the admin card surfaces a hint that no folder is wired yet.
   * Editable text; the asset discovery in `knowledge-cards.ts` matches
   * folder names case-insensitively. This is also the storage slug
   * used by /api/upload-front when the user uploads a series's front
   * image from the admin table; if the user has not authored an
   * `assetFolder` value, the upload uses `slugifySeriesName(name)`.
   */
  assetFolder?: string;
  /** Publication lifecycle. Defaults to `'active'` on read. */
  status?: SeriesStatus;
}

/**
 * Resolve the canonical public slug for a `SeriesMetadata` record.
 * The asset-folder field (when set by the editor) is the explicit
 * mapping; otherwise we fall back to a slugified name. Empty result
 * means the record cannot be referenced as a series and should be
 * treated as ineligible by callers.
 *
 * Mirrors the slugify rule used in `slugifySeriesName` but without
 * the hex-hashed Hebrew fallback — for asset-folder purposes only
 * ASCII slugs match a real directory under
 * `src/assets/knowledge-cards/<slug>/`.
 */
export function slugFromSeries(meta: SeriesMetadata): string {
  const explicit = meta.assetFolder?.trim();
  if (explicit && explicit.length > 0) return explicit;
  return (meta.name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Deterministic slug for a series name, used as the asset-folder name
 * under `src/assets/knowledge-cards/<slug>/` when the user has not set
 * a custom `assetFolder` for the series. Kept intentionally aggressive
 * (ASCII-only, lowercase, hyphenated) so the same name always maps to
 * the same folder regardless of casing or surrounding whitespace; for
 * fully non-ASCII (e.g. Hebrew) names a stable hex-hashed fallback is
 * emitted so different names still produce different folders.
 */
export function slugifySeriesName(name: string): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return '';
  // Keep ASCII alphanumerics and a few separators; replace everything
  // else with a hyphen, then collapse and trim hyphens.
  let s = trimmed.toLowerCase();
  s = s.replace(/[^a-z0-9]+/g, '-');
  s = s.replace(/^-+|-+$/g, '');
  // If the original name contained no ASCII alphanumerics (e.g. pure
  // Hebrew name), fall back to a stable hex-encoded form so different
  // names still produce different filenames.
  if (!s) {
    let hash = 0;
    for (let i = 0; i < trimmed.length; i++) {
      hash = ((hash << 5) - hash + trimmed.charCodeAt(i)) | 0;
    }
    s = `series-${(hash >>> 0).toString(16)}`;
  }
  // Filesystem cap; avoids accidentally producing a 1KB filename from a
  // very long series name.
  return s.slice(0, 80);
}

export interface SeriesMetadataStore {
  version: number;
  items: Record<string, SeriesMetadata>;
}

export const SERIES_METADATA_VERSION = 1;
