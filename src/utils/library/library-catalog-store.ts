/**
 * Library Catalog Store — Phase 3.
 * ─────────────────────────────────────────────────────────────────────
 * Single read API for the unified `LibraryCatalogItem` model defined in
 * `src/types/library-catalog.ts`. Backed by a file at
 * `src/data/library/catalog.json` (Vite imports it at build time, so
 * the same module is safe to import from both SSR and the browser).
 *
 * Responsibilities (intentionally narrow):
 *   1. Load & normalize records from `catalog.json`.
 *   2. Merge them with discovered pipeline items by slug, where
 *      catalog.json wins for editorial fields and discovery wins for
 *      derived/pipeline fields.
 *   3. Surface lookup helpers (`getCatalogItemBySlug`).
 *
 * Non-goals here:
 *   - No write path. Admin edits still go to `localStorage` via
 *     `setSeriesMetadata` / `setMetadata`; the Phase 4 / 5 plan
 *     introduces an Export-to-JSON flow that produces a new
 *     `catalog.json` for commit.
 *   - No removal of `MANUAL_SERIES_ITEMS`, `withAdminSeriesOverlay`,
 *     or the client-side hydrators. Those keep doing what they do
 *     today; the store sits beside them so the runtime is additive.
 *   - No DOM, no fs (Vite handles the JSON load), no Astro globals.
 *
 * Failure mode:
 *   A malformed entry is dropped, not thrown. Empty `catalog.json`
 *   resolves to `[]`. This keeps SSR robust if the file is mid-edit.
 */

import type { LibraryItem } from '../../types/library';
import type { ContentMetadata, SeriesMetadata } from '../../types/content-metadata';
import {
  type LibraryCatalogItem,
  type LibraryCatalogStatus,
  type LibraryCatalogSourceKind,
  type LibraryCatalogItemType,
  type LibraryCatalogVisibility,
  DEFAULT_LIBRARY_CATALOG_VISIBILITY,
  LIBRARY_CATALOG_ITEM_TYPES,
  LIBRARY_CATALOG_STATUSES,
  LIBRARY_CATALOG_SOURCE_KINDS,
  libraryItemToLibraryCatalogItem,
  contentMetadataToLibraryCatalogPatch,
  fromSeriesStatus,
} from '../../types/library-catalog';
import catalogJson from '../../data/library/catalog.json';
import {
  getAllMetadataFromFile,
  getAllSeriesMetadataFromFile,
} from '../editorial-metadata-file';
import { getKnowledgeCardAssets } from './knowledge-cards';

// ════════════════════════════════════════════════════════════════════
// Raw JSON shape
// ════════════════════════════════════════════════════════════════════

/**
 * Loose shape we accept from the JSON file. Every field is optional /
 * unknown so a hand-edited file with a typo never crashes SSR;
 * normalization fills in defaults and drops irrecoverable entries.
 */
interface RawCatalogFile {
  version?: number;
  description?: string;
  items?: unknown[];
}

const rawFile = catalogJson as RawCatalogFile;

// ════════════════════════════════════════════════════════════════════
// Normalization
// ════════════════════════════════════════════════════════════════════

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringRecord(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== 'object') return false;
  for (const v of Object.values(value)) {
    if (typeof v !== 'string') return false;
  }
  return true;
}

function normalizeStatus(value: unknown): LibraryCatalogStatus {
  if (typeof value === 'string'
      && (LIBRARY_CATALOG_STATUSES as readonly string[]).includes(value)) {
    return value as LibraryCatalogStatus;
  }
  return 'ready';
}

function normalizeSourceKind(value: unknown): LibraryCatalogSourceKind {
  if (typeof value === 'string'
      && (LIBRARY_CATALOG_SOURCE_KINDS as readonly string[]).includes(value)) {
    return value as LibraryCatalogSourceKind;
  }
  return 'json';
}

function normalizeType(value: unknown): LibraryCatalogItemType | undefined {
  if (typeof value === 'string'
      && (LIBRARY_CATALOG_ITEM_TYPES as readonly string[]).includes(value)) {
    return value as LibraryCatalogItemType;
  }
  return undefined;
}

function normalizeVisibility(value: unknown): LibraryCatalogVisibility {
  if (!value || typeof value !== 'object') {
    return { ...DEFAULT_LIBRARY_CATALOG_VISIBILITY };
  }
  const v = value as Partial<Record<keyof LibraryCatalogVisibility, unknown>>;
  return {
    showInLibrary:          v.showInLibrary          !== false,
    showInUniverse:         v.showInUniverse         !== false,
    showInOrbit:            v.showInOrbit            !== false,
    showInAtlas:            v.showInAtlas            !== false,
    showInContinueLearning: v.showInContinueLearning !== false,
  };
}

function normalizeLanguages(value: unknown): string[] {
  if (!Array.isArray(value)) return ['en'];
  const cleaned = value.filter((v): v is string => isNonEmptyString(v));
  return cleaned.length > 0 ? cleaned : ['en'];
}

/**
 * Convert a raw JSON record into a fully-typed `LibraryCatalogItem`.
 * Returns `null` for irrecoverable records (missing slug, missing
 * type, missing href) so the caller can drop them silently.
 */
function normalizeRawItem(raw: unknown): LibraryCatalogItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const slug = isNonEmptyString(r.slug) ? r.slug.trim() : undefined;
  if (!slug) return null;

  const type = normalizeType(r.type);
  if (!type) return null;

  const href = isNonEmptyString(r.href) ? r.href.trim() : undefined;
  if (!href) return null;

  const id = isNonEmptyString(r.id) ? r.id.trim() : slug;
  const title = isStringRecord(r.title) ? r.title : { en: slug };
  const languages = normalizeLanguages(r.languages);

  const item: LibraryCatalogItem = {
    id,
    slug,
    type,
    status: normalizeStatus(r.status),
    sourceKind: normalizeSourceKind(r.sourceKind),
    title,
    languages: languages as LibraryCatalogItem['languages'],
    visibility: normalizeVisibility(r.visibility),
    href,
  };

  if (isStringRecord(r.subtitle))    item.subtitle    = r.subtitle    as typeof item.subtitle;
  if (isStringRecord(r.description)) item.description = r.description as typeof item.description;
  if (isStringRecord(r.author))      item.author      = r.author      as typeof item.author;
  if (isNonEmptyString(r.shortDescription)) item.shortDescription = r.shortDescription.trim();

  if (isNonEmptyString(r.categoryKey))      item.categoryKey      = r.categoryKey.trim();
  if (isNonEmptyString(r.seriesId))         item.seriesId         = r.seriesId.trim();
  if (isNonEmptyString(r.parentSeriesSlug)) item.parentSeriesSlug = r.parentSeriesSlug.trim();
  if (isNonEmptyString(r.seriesName))       item.seriesName       = r.seriesName.trim();
  if (isNonEmptyString(r.courseSlug))       item.courseSlug       = r.courseSlug.trim();
  if (isNonEmptyString(r.assetFolder))      item.assetFolder      = r.assetFolder.trim();
  if (isNonEmptyString(r.coverImage))       item.coverImage       = r.coverImage.trim();
  if (isNonEmptyString(r.dominantColor))    item.dominantColor    = r.dominantColor.trim();
  if (isNonEmptyString(r.createdAt))        item.createdAt        = r.createdAt.trim();
  if (isNonEmptyString(r.updatedAt))        item.updatedAt        = r.updatedAt.trim();

  if (typeof r.order         === 'number' && Number.isFinite(r.order))         item.order         = r.order;
  if (typeof r.orderInSeries === 'number' && Number.isFinite(r.orderInSeries)) item.orderInSeries = r.orderInSeries;
  if (typeof r.readingMinutes === 'number' && Number.isFinite(r.readingMinutes)) item.readingMinutes = r.readingMinutes;
  if (typeof r.wordCount     === 'number' && Number.isFinite(r.wordCount))     item.wordCount     = r.wordCount;
  if (typeof r.chapterCount  === 'number' && Number.isFinite(r.chapterCount))  item.chapterCount  = r.chapterCount;

  if (Array.isArray(r.relatedIds)) {
    const ids = r.relatedIds.filter((v): v is string => isNonEmptyString(v));
    if (ids.length > 0) item.relatedIds = ids;
  }

  return item;
}

// ════════════════════════════════════════════════════════════════════
// Load (lazy, deduped)
// ════════════════════════════════════════════════════════════════════

let cached: LibraryCatalogItem[] | null = null;
let bySlug: Map<string, LibraryCatalogItem> | null = null;

function loadCatalog(): LibraryCatalogItem[] {
  if (cached) return cached;

  const rawItems = Array.isArray(rawFile.items) ? rawFile.items : [];
  const normalized: LibraryCatalogItem[] = [];
  const seen = new Set<string>();

  for (const raw of rawItems) {
    const item = normalizeRawItem(raw);
    if (!item) continue;
    const key = item.slug.toLowerCase();
    if (seen.has(key)) continue; // first-wins on duplicate slug
    seen.add(key);
    normalized.push(item);
  }

  cached = normalized;
  bySlug = new Map(normalized.map((it) => [it.slug.toLowerCase(), it]));
  return cached;
}

// ════════════════════════════════════════════════════════════════════
// Public read API
// ════════════════════════════════════════════════════════════════════

/**
 * Returns every `LibraryCatalogItem` declared in `catalog.json`,
 * fully normalized. The slice is immutable from the caller's
 * perspective — mutate at your peril (we return the cached array,
 * not a copy, so writes would corrupt subsequent reads).
 */
export function getCatalogItems(): LibraryCatalogItem[] {
  return loadCatalog();
}

/**
 * Returns the catalog record for `slug`, case-insensitive. Returns
 * `undefined` when no record exists. Use this for spot lookups; for
 * bulk merges, prefer the lazy map built inside `loadCatalog()` via
 * `getCatalogItems()` then index yourself.
 */
export function getCatalogItemBySlug(slug: string): LibraryCatalogItem | undefined {
  loadCatalog();
  return bySlug?.get(slug.toLowerCase());
}

// ════════════════════════════════════════════════════════════════════
// Merge with discovered pipeline items
// ════════════════════════════════════════════════════════════════════

/**
 * Editorial fields catalog.json owns. Pipeline values are kept when
 * the catalog entry leaves the field undefined, so a partial editorial
 * record stays safe to author.
 *
 * Anything NOT in this list — href, readingMinutes, wordCount,
 * chapterCount, relatedIds, topics, frontImage, coverImage,
 * dominantColor, courseSlug, seriesId, orderInSeries, createdAt,
 * updatedAt — stays sourced from the pipeline side (the `base`
 * argument to `applyEditorialOverlay`).
 */
type EditorialOverlayField =
  | 'title'
  | 'subtitle'
  | 'description'
  | 'shortDescription'
  | 'status'
  | 'visibility'
  | 'order'
  | 'parentSeriesSlug'
  | 'seriesName'
  | 'categoryKey'
  | 'assetFolder'
  | 'author';

const EDITORIAL_FIELDS: readonly EditorialOverlayField[] = [
  'title',
  'subtitle',
  'description',
  'shortDescription',
  'status',
  'visibility',
  'order',
  'parentSeriesSlug',
  'seriesName',
  'categoryKey',
  'assetFolder',
  'author',
];

function applyEditorialOverlay(
  base: LibraryCatalogItem,
  overlay: LibraryCatalogItem,
): LibraryCatalogItem {
  // Start from the discovered/base record so all derived/pipeline
  // fields are preserved verbatim; only `EDITORIAL_FIELDS` may flip
  // to the overlay's value (when the overlay actually defines them).
  const merged: LibraryCatalogItem = { ...base };
  const writable = merged as unknown as Record<string, unknown>;
  for (const field of EDITORIAL_FIELDS) {
    const overlayValue = overlay[field];
    if (overlayValue !== undefined) {
      writable[field] = overlayValue;
    }
  }
  return merged;
}

/**
 * Merge a list of discovered pipeline items (already in
 * `LibraryItem` shape from `getRealLibraryItems()`) with the
 * editorial records from `catalog.json`. Result is the unified
 * catalog the renderers will consume after `libraryCatalogItemToLibraryItem`.
 *
 * Semantics:
 *   - Slug is the merge key, case-insensitive.
 *   - Discovered items are projected via
 *     `libraryItemToLibraryCatalogItem(it, 'discovered')` first.
 *   - When a JSON entry shares a slug with a discovered item:
 *       → the JSON entry overlays the editorial fields on top of
 *         the discovered base (so the pipeline's word_count /
 *         readingMinutes / chapterCount / href / cover survive).
 *   - JSON entries with no matching discovered slug are appended
 *     verbatim (this is how series capsules like
 *     `ai-engineering-series` reach the orbit).
 *   - Discovered entries with no matching JSON entry pass through
 *     unchanged.
 *   - Output order: discovered items first (in discovery order),
 *     then JSON-only items (in catalog.json order). Matches the
 *     legacy `withManualSeries` append-at-end behaviour, so the
 *     orbit layout is byte-stable.
 */
export function mergeDiscoveredWithCatalog(
  discoveredItems: LibraryItem[],
): LibraryCatalogItem[] {
  const discoveredCatalog = discoveredItems.map(
    (it) => libraryItemToLibraryCatalogItem(it, 'discovered'),
  );

  // Phase 3 merge — catalog.json overlays discovered items by slug,
  // and catalog-only entries are appended. When `catalog.json` is empty
  // the loop is still cheap and we still need to run the Phase 4
  // overlays below (file-based ContentMetadata / SeriesMetadata,
  // artifact probe, cascade), so this branch must NOT early-return.
  const jsonItems = getCatalogItems();
  const overlayBySlug = new Map<string, LibraryCatalogItem>();
  for (const it of jsonItems) {
    overlayBySlug.set(it.slug.toLowerCase(), it);
  }

  const consumed = new Set<string>();
  const merged: LibraryCatalogItem[] = [];

  for (const disc of discoveredCatalog) {
    const key = disc.slug.toLowerCase();
    const overlay = overlayBySlug.get(key);
    if (overlay) {
      merged.push(applyEditorialOverlay(disc, overlay));
      consumed.add(key);
    } else {
      merged.push(disc);
    }
  }

  for (const cat of jsonItems) {
    if (!consumed.has(cat.slug.toLowerCase())) {
      merged.push(cat);
    }
  }

  // ── Phase 4 overlays — SSR-side editorial decisions ─────────────────
  // Order matters:
  //   1. File-based per-item ContentMetadata overlay (e.g. visibility
  //      flags, displayTitle, category, seriesName from
  //      output/_editorial.json).
  //   2. File-based per-series SeriesMetadata overlay (titles, status,
  //      visibility flags from the same file).
  //   3. Orbit-artifact probe — series capsules without a real
  //      front.png get showInOrbit=false. Items (books/lessons) are
  //      untouched so the placeholder fallback in index.astro still
  //      works.
  //   4. Series → child cascade — items whose parent series is hidden
  //      in library/universe inherit the hide. Orbit-only suppression
  //      (e.g. missing artifact) does NOT cascade to children so a
  //      member can still be read.
  let result = merged;
  result = applyFileContentMetadataOverlay(result);
  result = applyFileSeriesMetadataOverlay(result);
  result = applyOrbitArtifactProbe(result);
  result = applySeriesVisibilityCascade(result);
  return result;
}

// ════════════════════════════════════════════════════════════════════
// Phase 4 overlays
// ════════════════════════════════════════════════════════════════════

/**
 * Apply per-item `ContentMetadata` records read from
 * `output/_editorial.json` to the merged catalog. The file is partial
 * per record (any field can be omitted), so we fill missing fields
 * with the same defaults `defaultMetadataFor` uses on the localStorage
 * side and hand a complete record to `contentMetadataToLibraryCatalogPatch`.
 *
 * A patch that only flips visibility is still applied — the field is
 * not present on the base record (which defaults to "visible
 * everywhere"), so the spread cleanly turns the booleans off.
 *
 * SSR-only — the underlying reader uses `fs`.
 */
function applyFileContentMetadataOverlay(
  items: LibraryCatalogItem[],
): LibraryCatalogItem[] {
  const all = getAllMetadataFromFile();
  if (Object.keys(all).length === 0) return items;

  return items.map((item) => {
    const partial = all[item.slug];
    if (!partial) return item;

    const complete: ContentMetadata = {
      slug: item.slug,
      displayTitle: partial.displayTitle?.trim() ?? '',
      contentType: partial.contentType ?? 'book',
      category: partial.category ?? '',
      seriesName: partial.seriesName ?? '',
      isVisibleInUniverse: partial.isVisibleInUniverse !== false,
      visualMode: partial.visualMode ?? 'card',
    };

    const patch = contentMetadataToLibraryCatalogPatch(complete);
    if (Object.keys(patch).length === 0) return item;

    return { ...item, ...patch };
  });
}

/**
 * Apply per-series `SeriesMetadata` records read from
 * `output/_editorial.json` to the merged catalog. Matching is by
 * slug: the file's record is keyed by the editorial `name`, and we
 * derive the public slug the same way `slugFromSeries()` does in
 * admin-series.ts (assetFolder explicit → otherwise slugified name).
 *
 * Editorial fields (display title, descriptions, order, assetFolder,
 * status, visibility flag) overlay onto the existing catalog item.
 * Items that are not of type 'series' are passed through unchanged.
 *
 * SSR-only.
 */
function applyFileSeriesMetadataOverlay(
  items: LibraryCatalogItem[],
): LibraryCatalogItem[] {
  const all = getAllSeriesMetadataFromFile();
  if (Object.keys(all).length === 0) return items;

  const overlayBySlug = new Map<string, Partial<SeriesMetadata>>();
  for (const [name, meta] of Object.entries(all)) {
    const slug = resolveSeriesSlug(name, meta.assetFolder);
    if (slug.length > 0) overlayBySlug.set(slug.toLowerCase(), meta);
  }
  if (overlayBySlug.size === 0) return items;

  return items.map((item) => {
    if (item.type !== 'series') return item;
    const overlay = overlayBySlug.get(item.slug.toLowerCase());
    if (!overlay) return item;

    const next: LibraryCatalogItem = { ...item };

    if (isFilledString(overlay.displayTitle)) {
      next.title = { en: overlay.displayTitle.trim() };
    }
    if (isFilledString(overlay.shortDescription)) {
      next.shortDescription = overlay.shortDescription.trim();
    }
    if (isFilledString(overlay.fullDescription)) {
      next.description = { en: overlay.fullDescription.trim() };
    }
    if (typeof overlay.order === 'number' && Number.isFinite(overlay.order)) {
      next.order = overlay.order;
    }
    if (isFilledString(overlay.assetFolder)) {
      next.assetFolder = overlay.assetFolder.trim();
    }

    if (overlay.status !== undefined) {
      next.status = fromSeriesStatus(overlay.status);
    }

    const isHiddenByFlag = overlay.isVisibleInUniverse === false;
    const isHiddenByStatus = next.status === 'archived';
    if (isHiddenByFlag || isHiddenByStatus) {
      next.visibility = {
        showInLibrary: false,
        showInUniverse: false,
        showInOrbit: false,
        showInAtlas: false,
        showInContinueLearning: false,
      };
    }

    return next;
  });
}

/**
 * Series capsules require a real per-slug artifact at
 * `src/assets/knowledge-cards/<assetFolder>/front.png` (no placeholder
 * fallback, by design — a placeholder series would hide the
 * editorial identity). Items that fail the probe get
 * `visibility.showInOrbit = false` so the orbit filter in
 * `getLibraryItems` can drop them before they reach index.astro.
 *
 * The library-wide visibility flags (showInLibrary, showInUniverse,
 * showInAtlas) are NOT touched here — those decisions are editorial,
 * not asset-driven. Books and lessons are untouched at any flag
 * because they fall back to the shared placeholder image.
 */
function applyOrbitArtifactProbe(
  items: LibraryCatalogItem[],
): LibraryCatalogItem[] {
  return items.map((item) => {
    if (item.type !== 'series') return item;
    const folder = (item.assetFolder ?? item.slug).trim();
    if (folder.length === 0) return item;
    if (getKnowledgeCardAssets(folder) !== undefined) return item;
    return {
      ...item,
      visibility: { ...item.visibility, showInOrbit: false },
    };
  });
}

/**
 * Cascade visibility from a hidden parent series to its members.
 *
 * Matching order (most explicit wins):
 *   1. `parentSeriesSlug` — the explicit editorial link.
 *   2. `seriesId` — the pipeline-derived course id, e.g.
 *      `course-ai-engineering`. Series carry this same value via
 *      catalog.json so course capsules cascade to their lessons even
 *      without per-item parentSeriesSlug.
 *
 * Cascade triggers ONLY when the parent series is hidden from
 * `showInLibrary` or `showInUniverse` (i.e. editorial removal).
 * Orbit-only suppression (artifact missing) does NOT cascade — a
 * series with no capsule still has individually-visible lessons
 * scattered on the orbit, which is the intended fallback.
 *
 * AND-masks the child's existing visibility, so a child that was
 * already locally hidden stays hidden after the cascade.
 */
function applySeriesVisibilityCascade(
  items: LibraryCatalogItem[],
): LibraryCatalogItem[] {
  const parentByCourseId = new Map<string, LibraryCatalogVisibility>();
  const parentBySlug = new Map<string, LibraryCatalogVisibility>();

  for (const item of items) {
    if (item.type !== 'series') continue;
    parentBySlug.set(item.slug.toLowerCase(), item.visibility);
    if (item.seriesId) parentByCourseId.set(item.seriesId, item.visibility);
  }

  if (parentByCourseId.size === 0 && parentBySlug.size === 0) return items;

  return items.map((item) => {
    if (item.type === 'series') return item;

    let parent: LibraryCatalogVisibility | undefined;
    if (item.parentSeriesSlug) {
      parent = parentBySlug.get(item.parentSeriesSlug.toLowerCase());
    }
    if (!parent && item.seriesId) {
      parent = parentByCourseId.get(item.seriesId);
    }
    if (!parent) return item;

    // Only library/universe-level hides cascade; orbit-only flags don't.
    if (parent.showInLibrary && parent.showInUniverse) return item;

    return {
      ...item,
      visibility: {
        showInLibrary:          item.visibility.showInLibrary          && parent.showInLibrary,
        showInUniverse:         item.visibility.showInUniverse         && parent.showInUniverse,
        showInOrbit:            item.visibility.showInOrbit            && parent.showInOrbit,
        showInAtlas:            item.visibility.showInAtlas            && parent.showInAtlas,
        showInContinueLearning: item.visibility.showInContinueLearning && parent.showInContinueLearning,
      },
    };
  });
}

// ── Helpers ─────────────────────────────────────────────────────────

function isFilledString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Same resolution rule as `slugFromSeries` in admin-series.ts. Kept
 * inline here to avoid a circular import (`admin-series` would
 * eventually depend on the store).
 */
function resolveSeriesSlug(
  name: string,
  assetFolder: string | undefined,
): string {
  const explicit = assetFolder?.trim();
  if (explicit && explicit.length > 0) return explicit;
  return (name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ════════════════════════════════════════════════════════════════════
// Visibility filter — used by getLibraryItems before mapping back to
// the legacy LibraryItem shape.
// ════════════════════════════════════════════════════════════════════

/**
 * Drop items that should not reach the renderer at all, BEFORE the
 * projection to `LibraryItem` (which has no visibility fields and so
 * would otherwise lose the signal).
 *
 * Rules:
 *   - `visibility.showInLibrary === false` → always dropped. This is
 *     the universal "hide from /library" gate; it also implies all
 *     other surfaces are off.
 *   - `type === 'series'` AND `visibility.showInOrbit === false` →
 *     dropped. Series have no surface beyond the orbit today
 *     (`/series/<slug>` is not a real route in `isSafeLibraryHref`),
 *     so a series without an orbit slot has nowhere to render.
 *     Books/lessons with `showInOrbit === false` are kept because
 *     they still have a working `/books/<slug>` route.
 */
export function filterVisibleCatalogItems(
  items: LibraryCatalogItem[],
): LibraryCatalogItem[] {
  return items.filter((it) => {
    if (!it.visibility.showInLibrary) return false;
    if (it.type === 'series' && !it.visibility.showInOrbit) return false;
    return true;
  });
}
