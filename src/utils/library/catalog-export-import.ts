/**
 * Library catalog Export / Import — Phase 5.
 * ─────────────────────────────────────────────────────────────────────
 * Pure helpers that turn Admin draft state (localStorage records of
 * `ContentMetadata` + `SeriesMetadata`) into a downloadable
 * `catalog.json` payload, and the other way around: validate an
 * uploaded `catalog.json` and split it back into the two draft maps
 * the Admin UI already edits.
 *
 * Constraints:
 *   - **Client-safe**. No `fs`. No Astro globals. Bundled into the
 *     /admin script. Only imports the build-time JSON via Vite.
 *   - **Pure**. No DOM, no I/O, no localStorage reads — callers pass
 *     the draft maps explicitly and decide what to do with results.
 *   - **Lossless within scope**. Editorial fields round-trip. Derived
 *     fields (readingMinutes, wordCount, chapterCount, relatedIds,
 *     topics, frontImage) are intentionally NOT written to the export
 *     so the file stays small and the pipeline remains authoritative.
 *
 * Workflow this module enables:
 *   1. Admin edits land in `localStorage` as today.
 *   2. /admin Export reads the drafts + the existing catalog.json
 *      seed and produces a merged catalog.json the user downloads.
 *   3. User commits the downloaded file at
 *      `src/data/library/catalog.json` → next build picks it up.
 *   4. /admin Import lets the same user round-trip: load a
 *      committed catalog back into localStorage so editing continues
 *      from the published state.
 */

import type {
  LibraryCatalogItem,
  LibraryCatalogItemType,
  LibraryCatalogStatus,
  LibraryCatalogSourceKind,
  LibraryCatalogVisibility,
} from '../../types/library-catalog';
import {
  DEFAULT_LIBRARY_CATALOG_VISIBILITY,
  LIBRARY_CATALOG_ITEM_TYPES,
  LIBRARY_CATALOG_STATUSES,
  LIBRARY_CATALOG_SOURCE_KINDS,
  seriesMetadataToLibraryCatalogItem,
  contentMetadataToLibraryCatalogPatch,
  contentMetadataToLibraryCatalogItem,
} from '../../types/library-catalog';
import type {
  ContentMetadata,
  SeriesMetadata,
} from '../../types/content-metadata';
import baseCatalog from '../../data/library/catalog.json';

// ════════════════════════════════════════════════════════════════════
// Schema
// ════════════════════════════════════════════════════════════════════

/**
 * Schema version of the catalog.json file. Bump only if the consumer
 * (`library-catalog-store.ts`) cannot read older versions transparently.
 * For Phase 5 we stay at v1 — the store already normalizes unknown
 * fields away.
 */
export const CATALOG_SCHEMA_VERSION = 1;

export interface CatalogJsonShape {
  version: number;
  description?: string;
  items: LibraryCatalogItem[];
}

export interface ExportInputs {
  /** Per-item editorial drafts. Keyed by slug, matching
   *  `getAllMetadata()` in `content-metadata.ts`. */
  contentDrafts: Record<string, ContentMetadata>;
  /** Per-series editorial drafts. Keyed by series name, matching
   *  `getAllSeriesMetadata()`. */
  seriesDrafts: Record<string, SeriesMetadata>;
}

export interface ImportValidation {
  ok: boolean;
  reason?: string;
  items?: LibraryCatalogItem[];
}

export interface ImportSplit {
  /** Records ready for `replaceAllMetadata(items)`. */
  contentItems: Record<string, ContentMetadata>;
  /** Records ready for `replaceAllSeriesMetadata(items)`. */
  seriesItems: Record<string, SeriesMetadata>;
}

// ════════════════════════════════════════════════════════════════════
// Export
// ════════════════════════════════════════════════════════════════════

/**
 * Build a downloadable catalog.json payload.
 *
 * Merge order (last writer wins on editorial fields, slug-keyed):
 *   1. The existing `catalog.json` at build time — the production
 *      source of truth. Provides seeds (e.g. `ai-engineering-series`)
 *      and any prior editorial overrides already committed to disk.
 *   2. Admin series drafts (in-memory; see `content-metadata.ts`).
 *      Each is converted via the Phase 2 adapter
 *      `seriesMetadataToLibraryCatalogItem`. Derived fields are
 *      stripped before merging.
 *   3. Admin content drafts (in-memory). Each is
 *      converted to a `Partial<LibraryCatalogItem>` patch via the
 *      Phase 2 adapter `contentMetadataToLibraryCatalogPatch` and
 *      applied only when a base item with the same slug already
 *      exists in the export. Content drafts cannot materialize a
 *      new record on their own — they're metadata overlays, not
 *      catalog entries.
 *
 * Result:
 *   - Deduped by slug (case-insensitive).
 *   - sourceKind is preserved per record:
 *       - existing catalog records keep their stored value.
 *       - admin-series drafts surface as `'admin'` (the adapter sets
 *         this) when they introduce a new entry; when overlaying an
 *         existing entry the existing sourceKind is kept.
 *       - manual_seed values from catalog.json never get upgraded
 *         to admin unless the admin explicitly edited that series.
 *   - All visibility / status fields are normalized.
 */
export function buildExportedCatalog(inputs: ExportInputs): CatalogJsonShape {
  const itemsBySlug = new Map<string, LibraryCatalogItem>();

  // 1. Seed with existing catalog.json (build-time import).
  const raw = baseCatalog as { items?: unknown[] };
  for (const r of Array.isArray(raw.items) ? raw.items : []) {
    const item = normalizeForExport(r);
    if (!item) continue;
    itemsBySlug.set(item.slug.toLowerCase(), item);
  }

  // 2. Admin series drafts — convert and merge.
  for (const meta of Object.values(inputs.seriesDrafts)) {
    if (!meta) continue;
    const draft = seriesMetadataToLibraryCatalogItem(meta);
    if (!draft.slug) continue; // empty / non-slugifiable series — skip silently
    const key = draft.slug.toLowerCase();
    const stripped = stripDerivedFields(draft);
    const existing = itemsBySlug.get(key);
    if (existing) {
      // Overlay editorial fields on top of the existing catalog row,
      // preserving its `sourceKind` (so a 'manual_seed' baseline does
      // not get rebadged to 'admin' just because the admin edited
      // visible-on-orbit). The admin's status/visibility values DO
      // overwrite — those are the editorial intent.
      itemsBySlug.set(key, {
        ...existing,
        title:         stripped.title         ?? existing.title,
        subtitle:      stripped.subtitle      ?? existing.subtitle,
        description:   stripped.description   ?? existing.description,
        shortDescription: stripped.shortDescription ?? existing.shortDescription,
        status:        stripped.status,
        sourceKind:    existing.sourceKind, // keep provenance
        visibility:    stripped.visibility,
        order:         stripped.order ?? existing.order,
        assetFolder:   stripped.assetFolder ?? existing.assetFolder,
        author:        stripped.author ?? existing.author,
        categoryKey:   stripped.categoryKey ?? existing.categoryKey,
      });
    } else {
      itemsBySlug.set(key, stripped);
    }
  }

  // 3. Admin content drafts — overlay an existing record, or MATERIALIZE
  //    a new one. catalog.json is now the single editorial source of
  //    truth, so an edit to a pipeline-discovered item that isn't in the
  //    file yet must create a full record here; dropping it (the old
  //    overlay behaviour) is what made book edits vanish on save.
  for (const [slug, meta] of Object.entries(inputs.contentDrafts)) {
    if (!meta) continue;
    const key = slug.toLowerCase();
    const existing = itemsBySlug.get(key);
    if (existing) {
      const patch = contentMetadataToLibraryCatalogPatch(meta);
      if (Object.keys(patch).length === 0) continue;
      itemsBySlug.set(key, { ...existing, ...patch });
    } else {
      itemsBySlug.set(key, contentMetadataToLibraryCatalogItem(meta));
    }
  }

  // Final pass — ensure every record has a normalized visibility and
  // a known sourceKind, so the file stays portable across schema growth.
  const items = Array.from(itemsBySlug.values()).map((it) => ({
    ...it,
    visibility: { ...DEFAULT_LIBRARY_CATALOG_VISIBILITY, ...it.visibility },
  }));

  return {
    version: CATALOG_SCHEMA_VERSION,
    description:
      'Editorial source of truth for the Yuval /library page. '
      + 'Generated by /admin Export. Replace src/data/library/catalog.json '
      + 'with this file to publish. See src/utils/library/library-catalog-store.ts.',
    items,
  };
}

// ════════════════════════════════════════════════════════════════════
// Import
// ════════════════════════════════════════════════════════════════════

/**
 * Validate the shape of an uploaded JSON payload. Strict on the wrapper
 * (`{ version, items }`), tolerant on individual item fields — we
 * normalize per item and skip records that cannot survive normalization,
 * surfacing the first failure as the validation reason.
 */
export function validateImportedCatalog(parsed: unknown): ImportValidation {
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, reason: 'not a JSON object' };
  }
  const obj = parsed as Record<string, unknown>;

  if (typeof obj.version !== 'number') {
    return {
      ok: false,
      reason: `version must be a number (got ${JSON.stringify(obj.version)})`,
    };
  }
  if (obj.version !== CATALOG_SCHEMA_VERSION) {
    return {
      ok: false,
      reason: `unsupported version ${obj.version} (expected ${CATALOG_SCHEMA_VERSION})`,
    };
  }

  if (!Array.isArray(obj.items)) {
    return { ok: false, reason: 'items must be an array' };
  }

  const items: LibraryCatalogItem[] = [];
  for (let i = 0; i < obj.items.length; i++) {
    const item = normalizeForExport(obj.items[i]);
    if (!item) {
      return {
        ok: false,
        reason: `item #${i + 1} is missing required fields (slug, type, href)`,
      };
    }
    items.push(item);
  }

  return { ok: true, items };
}

/**
 * Split a validated catalog item array back into the two
 * localStorage-shaped draft maps the Admin UI edits today.
 *
 *   - Items of type `'series'` → SeriesMetadata, keyed by name.
 *     The display title becomes the canonical `name` field when
 *     no other name exists, so the round trip preserves identity.
 *   - All other items → ContentMetadata, keyed by slug. Visibility
 *     collapses back into `isVisibleInUniverse` + `visualMode`.
 *
 * Unknown / non-editorial fields are kept on the items array (the
 * caller can still inspect them) but do not appear in the drafts —
 * the drafts only carry what the Admin UI knows how to edit.
 */
export function splitImportedCatalogIntoDrafts(
  items: LibraryCatalogItem[],
): ImportSplit {
  const contentItems: Record<string, ContentMetadata> = {};
  const seriesItems: Record<string, SeriesMetadata> = {};

  for (const item of items) {
    const displayTitle = pickPrimaryString(item.title) ?? item.slug;

    if (item.type === 'series') {
      const name = displayTitle;
      const series: SeriesMetadata = {
        name,
        displayTitle,
        visualMode: 'capsule',
        isVisibleInUniverse: item.visibility.showInLibrary !== false,
        status: libraryStatusToSeriesStatus(item.status),
      };
      if (item.shortDescription) series.shortDescription = item.shortDescription;
      const full = pickPrimaryString(item.description);
      if (full) series.fullDescription = full;
      if (typeof item.order === 'number') series.order = item.order;
      if (item.assetFolder) series.assetFolder = item.assetFolder;
      seriesItems[name] = series;
      continue;
    }

    const contentType = mapCatalogTypeToContentType(item.type);
    const visualMode = item.visibility.showInLibrary === false ? 'hidden' : 'card';
    const meta: ContentMetadata = {
      slug: item.slug,
      displayTitle,
      contentType,
      category: item.categoryKey ?? '',
      seriesName: item.seriesName ?? '',
      isVisibleInUniverse: item.visibility.showInLibrary !== false,
      visualMode,
    };
    // Restore course linkage for lessons so the editor sees the same
    // course + lesson number + order it saved. `courseSlug` is the stable
    // link; `lessonNumber` falls back to `orderInSeries` for older files;
    // the admin "Order in course" field maps to the catalog `orderInSeries`
    // (a course IS a series), defaulting to lessonNumber.
    if (contentType === 'course_lesson') {
      if (item.courseSlug) meta.courseSlug = item.courseSlug;
      const lessonNumber =
        typeof item.lessonNumber === 'number' ? item.lessonNumber
        : typeof item.orderInSeries === 'number' ? item.orderInSeries
        : undefined;
      if (typeof lessonNumber === 'number') meta.lessonNumber = lessonNumber;
      const orderInCourse =
        typeof item.orderInSeries === 'number' ? item.orderInSeries
        : lessonNumber;
      if (typeof orderInCourse === 'number') meta.orderInCourse = orderInCourse;
    }
    contentItems[item.slug] = meta;
  }

  return { contentItems, seriesItems };
}

// ════════════════════════════════════════════════════════════════════
// Helpers (file-internal)
// ════════════════════════════════════════════════════════════════════

function stripDerivedFields(item: LibraryCatalogItem): LibraryCatalogItem {
  // Build a clone without the derived/pipeline-owned fields. Keeps
  // the export small and avoids stamping stale pipeline numbers (word
  // counts, reading minutes) into a manually-committed file.
  const clone: LibraryCatalogItem = { ...item };
  delete clone.readingMinutes;
  delete clone.wordCount;
  delete clone.chapterCount;
  delete clone.relatedIds;
  delete clone.topics;
  delete clone.frontImage;
  return clone;
}

function pickPrimaryString(
  map: { en?: string; he?: string; es?: string } | Record<string, string> | undefined,
): string | undefined {
  if (!map) return undefined;
  const m = map as Record<string, string>;
  const v = m.en ?? m.he ?? m.es;
  if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  return undefined;
}

function isFilledString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function isStringRecord(v: unknown): v is Record<string, string> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  for (const val of Object.values(v as Record<string, unknown>)) {
    if (typeof val !== 'string') return false;
  }
  return true;
}

function normalizeVisibility(value: unknown): LibraryCatalogVisibility {
  if (!value || typeof value !== 'object') {
    return { ...DEFAULT_LIBRARY_CATALOG_VISIBILITY };
  }
  const v = value as Record<string, unknown>;
  return {
    showInLibrary:          v.showInLibrary          !== false,
    showInUniverse:         v.showInUniverse         !== false,
    showInOrbit:            v.showInOrbit            !== false,
    showInAtlas:            v.showInAtlas            !== false,
    showInContinueLearning: v.showInContinueLearning !== false,
  };
}

function normalizeForExport(raw: unknown): LibraryCatalogItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const slug = isFilledString(r.slug) ? r.slug.trim() : null;
  if (!slug) return null;

  const type = isFilledString(r.type) && (LIBRARY_CATALOG_ITEM_TYPES as readonly string[]).includes(r.type)
    ? (r.type as LibraryCatalogItemType)
    : null;
  if (!type) return null;

  const href = isFilledString(r.href) ? r.href.trim() : null;
  if (!href) return null;

  const id = isFilledString(r.id) ? r.id.trim() : slug;
  const title = isStringRecord(r.title) ? r.title : { en: slug };

  const languagesArr = Array.isArray(r.languages)
    ? r.languages.filter((v): v is string => isFilledString(v))
    : [];
  const languages = (languagesArr.length > 0 ? languagesArr : ['en']) as LibraryCatalogItem['languages'];

  const status: LibraryCatalogStatus =
    isFilledString(r.status) && (LIBRARY_CATALOG_STATUSES as readonly string[]).includes(r.status)
      ? (r.status as LibraryCatalogStatus)
      : 'ready';

  const sourceKind: LibraryCatalogSourceKind =
    isFilledString(r.sourceKind) && (LIBRARY_CATALOG_SOURCE_KINDS as readonly string[]).includes(r.sourceKind)
      ? (r.sourceKind as LibraryCatalogSourceKind)
      : 'json';

  const item: LibraryCatalogItem = {
    id,
    slug,
    type,
    status,
    sourceKind,
    title,
    languages,
    visibility: normalizeVisibility(r.visibility),
    href,
  };

  if (isStringRecord(r.subtitle))    item.subtitle    = r.subtitle    as typeof item.subtitle;
  if (isStringRecord(r.description)) item.description = r.description as typeof item.description;
  if (isStringRecord(r.author))      item.author      = r.author      as typeof item.author;
  if (isFilledString(r.shortDescription)) item.shortDescription = r.shortDescription.trim();
  if (isFilledString(r.categoryKey))      item.categoryKey      = r.categoryKey.trim();
  if (isFilledString(r.seriesId))         item.seriesId         = r.seriesId.trim();
  if (isFilledString(r.parentSeriesSlug)) item.parentSeriesSlug = r.parentSeriesSlug.trim();
  if (isFilledString(r.seriesName))       item.seriesName       = r.seriesName.trim();
  if (isFilledString(r.courseSlug))       item.courseSlug       = r.courseSlug.trim();
  if (isFilledString(r.assetFolder))      item.assetFolder      = r.assetFolder.trim();
  if (isFilledString(r.coverImage))       item.coverImage       = r.coverImage.trim();
  if (isFilledString(r.dominantColor))    item.dominantColor    = r.dominantColor.trim();
  if (isFilledString(r.createdAt))        item.createdAt        = r.createdAt.trim();
  if (isFilledString(r.updatedAt))        item.updatedAt        = r.updatedAt.trim();

  if (typeof r.order === 'number'         && Number.isFinite(r.order))         item.order         = r.order;
  if (typeof r.orderInSeries === 'number' && Number.isFinite(r.orderInSeries)) item.orderInSeries = r.orderInSeries;
  if (typeof r.lessonNumber === 'number'  && Number.isFinite(r.lessonNumber))  item.lessonNumber  = r.lessonNumber;

  return item;
}

function mapCatalogTypeToContentType(
  type: LibraryCatalogItemType,
): ContentMetadata['contentType'] {
  switch (type) {
    case 'book':          return 'book';
    case 'course':        return 'course';
    case 'course_lesson': return 'course_lesson'; // round-trips the lesson classification back to the editor
    case 'article':       return 'article';
    case 'series':        return 'book';   // unreachable in practice — series go to the series branch
  }
}

function libraryStatusToSeriesStatus(
  status: LibraryCatalogStatus,
): SeriesMetadata['status'] {
  switch (status) {
    case 'ready':    return 'active';
    case 'draft':    return 'draft';
    case 'archived': return 'hidden';
  }
}
