/**
 * Unified Library Catalog Model — Phase 2 (types + adapters only).
 * ─────────────────────────────────────────────────────────────────────
 * Goal of this file:
 *   Define ONE shape (`LibraryCatalogItem`) that can losslessly express
 *   every card the /library orbit, /admin, and the side panels render
 *   today, regardless of which of the three competing sources it came
 *   from:
 *
 *     1. Pipeline discovery       — discoverAllBooks() / discoverCourses()
 *                                   mapped via mapDiscoveredBookToLibraryItem.
 *     2. MANUAL_SERIES_ITEMS      — hardcoded seed in library-catalog.ts.
 *     3. SeriesMetadata + ContentMetadata in localStorage (Admin overlay).
 *     4. libraryMockCatalog       — fallback when output/ is empty.
 *     5. output/_editorial.json   — file-based overlay already read by
 *                                   editorial-metadata-file.ts (SSR-only).
 *
 *   Phase 2 does NOT change runtime. Nothing imports this file yet.
 *   It exists so Phase 3 can introduce src/data/library/catalog.json
 *   (or extend output/_editorial.json) and Phase 4 can rewire
 *   getLibraryItems() to read from a single store.
 *
 * Design constraints honoured here:
 *   - Multi-language fields (title/subtitle/description) keep the
 *     LibraryLanguageMap shape from src/types/library.ts. Collapsing
 *     them to single strings would lose every per-language manifest
 *     value Yuval already ships, so the user-spec "title" field is
 *     interpreted as "the localized title bundle". shortDescription
 *     stays a single string because SeriesMetadata stores it that way
 *     (admin types one short line, not per-language).
 *   - `languages` stays an array (LibraryItem already exposes
 *     `languages: Language[]`). The spec "language" field is mapped to
 *     this array; the first entry is the primary content language.
 *   - sourceKind is a NEW, broader union here. The existing
 *     LibrarySourceKind ('pipeline' | 'manual' | 'generated' |
 *     'external') is preserved by `libraryCatalogItemToLibraryItem()`
 *     so legacy consumers see the values they expect.
 *   - `visibility.showInOrbit` is the data-side expression of the two
 *     current runtime predicates (`isOrbitVisible` + `hasOrbitArtifact`).
 *     It does NOT remove the artifact check from runtime — Phase 4
 *     will fold the asset-existence probe into the loader so the flag
 *     reflects reality, but until then `showInOrbit === true` only
 *     promises intent, not artifact presence.
 *
 * No I/O. No DOM. No Astro. Pure types + pure functions.
 */

import type { Language, BookLevel } from './index';
import type {
  LibraryItem,
  LibraryItemStatus,
  LibraryItemType,
  LibraryLanguageMap,
  LibraryLanguageListMap,
  LibrarySourceKind,
} from './library';
import type {
  ContentMetadata,
  SeriesMetadata,
  SeriesStatus,
} from './content-metadata';

// ════════════════════════════════════════════════════════════════════
// Enumerations
// ════════════════════════════════════════════════════════════════════

/**
 * Unified type union for every card the library can surface. Mirrors
 * the existing `LibraryItemType` but narrows to the kinds the spec
 * calls out explicitly (book | course_lesson | series | article |
 * course). The runtime catalog still tolerates the broader
 * `LibraryItemType` for legacy items (lesson_summary, slides, lab,
 * transcript, document); those map onto `'article'` when projected
 * into a `LibraryCatalogItem` so the unified shape stays closed.
 *
 * Order is alphabetical-ish by importance, not by display order; UI
 * ordering is driven by `order` + `orderInSeries`, never by enum
 * position.
 */
export type LibraryCatalogItemType =
  | 'book'
  | 'course_lesson'
  | 'series'
  | 'article'
  | 'course';

export const LIBRARY_CATALOG_ITEM_TYPES: readonly LibraryCatalogItemType[] = [
  'book',
  'course_lesson',
  'series',
  'article',
  'course',
] as const;

/**
 * Unified publication status. Narrower than `LibraryItemStatus`
 * (which carries pipeline-only states like `'processing'` and
 * `'failed'`); the admin spec asked for only ready | draft | archived.
 *
 * Mapping (round-trip safe):
 *   ready    ←→ ready          (also receives 'processing' from legacy)
 *   draft    ←→ new            (admin `'draft'` maps to legacy `'new'`)
 *   archived ←→ archived       (also receives 'failed' from legacy)
 */
export type LibraryCatalogStatus = 'ready' | 'draft' | 'archived';

export const LIBRARY_CATALOG_STATUSES: readonly LibraryCatalogStatus[] = [
  'ready',
  'draft',
  'archived',
] as const;

/**
 * Provenance of a unified record. Wider than the legacy
 * `LibrarySourceKind` because the spec wants to distinguish:
 *
 *   - discovered   — found on disk by the pipeline (DiscoveredBook /
 *                    DiscoveredCourse). Maps to legacy 'pipeline'.
 *   - admin        — authored in /admin, persisted to localStorage
 *                    (SeriesMetadata / ContentMetadata). Maps to
 *                    legacy 'manual' so existing readers see the same
 *                    provenance signal as MANUAL_SERIES_ITEMS today.
 *   - manual_seed  — hardcoded in `MANUAL_SERIES_ITEMS`. Same legacy
 *                    'manual' mapping; the distinction matters only
 *                    inside Phase 5 cleanup.
 *   - mock         — produced by `libraryMockCatalog`. Maps to legacy
 *                    'manual' because the mock data already declares
 *                    itself that way.
 *   - json         — read from a future src/data/library/catalog.json
 *                    or the existing output/_editorial.json file.
 *                    Maps to legacy 'manual' (file-authored = manual
 *                    provenance from the consumer's perspective).
 */
export type LibraryCatalogSourceKind =
  | 'discovered'
  | 'admin'
  | 'manual_seed'
  | 'mock'
  | 'json';

export const LIBRARY_CATALOG_SOURCE_KINDS: readonly LibraryCatalogSourceKind[] = [
  'discovered',
  'admin',
  'manual_seed',
  'mock',
  'json',
] as const;

// ════════════════════════════════════════════════════════════════════
// Visibility
// ════════════════════════════════════════════════════════════════════

/**
 * Where an item is allowed to appear. Each flag is a data-side
 * expression of a runtime predicate that currently lives in code:
 *
 *   showInLibrary           — global include/exclude for the /library
 *                             page. Maps to ContentMetadata.
 *                             isVisibleInUniverse AND
 *                             ContentMetadata.visualMode !== 'hidden'
 *                             AND (cascade from SeriesMetadata.
 *                             isVisibleInUniverse on the parent
 *                             series, if any).
 *   showInUniverse          — broader "should this exist anywhere in
 *                             Yuval at all" gate. Today shadows
 *                             showInLibrary; reserved for the future
 *                             when Yuval grows additional surfaces
 *                             (mobile widget, RSS, etc).
 *   showInOrbit             — eligible for the desktop/mobile orbit
 *                             stage on /library. Series additionally
 *                             require a real knowledge-card artifact
 *                             at runtime (hasOrbitArtifact). The flag
 *                             expresses intent; Phase 4 will fold the
 *                             artifact probe in.
 *   showInAtlas             — eligible for the KnowledgeAtlas overlay.
 *                             Currently derived from `orbitItems`, so
 *                             defaults to mirror showInOrbit.
 *   showInContinueLearning  — eligible to be picked as the "Continue
 *                             reading" suggestion by
 *                             getContinueReadingItem. Synthetic items
 *                             without a navigable href (e.g. the
 *                             ai-engineering synthetic course) set
 *                             this to false; everything else true.
 *
 * Every flag defaults to `true` when absent — the legacy behaviour
 * for items without ContentMetadata is "visible everywhere".
 */
export interface LibraryCatalogVisibility {
  showInLibrary: boolean;
  showInUniverse: boolean;
  showInOrbit: boolean;
  showInAtlas: boolean;
  showInContinueLearning: boolean;
}

/**
 * The legacy implicit default: visible everywhere. Used by readers
 * that receive a record without a `visibility` block.
 */
export const DEFAULT_LIBRARY_CATALOG_VISIBILITY: LibraryCatalogVisibility = {
  showInLibrary: true,
  showInUniverse: true,
  showInOrbit: true,
  showInAtlas: true,
  showInContinueLearning: true,
};

// ════════════════════════════════════════════════════════════════════
// Unified item shape
// ════════════════════════════════════════════════════════════════════

/**
 * The single source-of-truth shape for every card the library renders.
 * Required fields are the minimum a renderer must have; everything
 * else is optional because the union spans books (pipeline-rich),
 * series (admin-light), and articles/courses (sparse).
 *
 * Identity:
 *   - `id` is globally unique. For pipeline-discovered items the
 *     adapter prefixes with the source kind (`pipeline-<slug>`,
 *     `pipeline-course-<slug>`) to disambiguate from admin records
 *     that may share a slug.
 *   - `slug` is the URL-safe identifier shared with the asset folder,
 *     the manifest, and the SeriesMetadata.assetFolder field.
 *
 * Relationships:
 *   - `seriesId` is the auto-derived course id (`course-<slug>`).
 *   - `parentSeriesSlug` is the human-edited link to a series
 *     authored in Admin (replaces the implicit `seriesName` join).
 *   - `orderInSeries` is the position inside its parent series.
 */
export interface LibraryCatalogItem {
  // ── Identity ─────────────────────────────────────────────────
  id: string;
  slug: string;
  type: LibraryCatalogItemType;
  status: LibraryCatalogStatus;
  sourceKind: LibraryCatalogSourceKind;

  // ── Display copy (multi-language) ────────────────────────────
  /** Localized display title bundle. Required. */
  title: LibraryLanguageMap;
  /** Localized subtitle / byline-style secondary line. */
  subtitle?: LibraryLanguageMap;
  /** Long-form localized description (paragraph). */
  description?: LibraryLanguageMap;
  /**
   * Free-text single-line tagline shown on capsules / focused cards.
   * Single string (not per-language) because SeriesMetadata stores it
   * that way; localizing requires a schema growth at that source.
   */
  shortDescription?: string;
  /** Per-language topic chips list. */
  topics?: LibraryLanguageListMap;
  /** Localized author / byline. */
  author?: LibraryLanguageMap;

  // ── Content metadata ─────────────────────────────────────────
  /** Machine-readable category, e.g. 'ai-engineering'. */
  categoryKey?: string;
  /** Pipeline-supplied difficulty tier. */
  level?: BookLevel;
  /** Languages the content itself is authored in (not the UI). */
  languages: Language[];

  // ── Visibility & ordering ────────────────────────────────────
  /** Per-surface visibility flags. Defaults to "visible everywhere". */
  visibility: LibraryCatalogVisibility;
  /**
   * Sort key inside the global catalog (used by the orbit
   * sortStations() and any future list view). Lower comes first.
   * Undefined → fall back to alphabetical by `title[language]`, then
   * to source order. Matches the current SeriesMetadata.order
   * semantics.
   */
  order?: number;

  // ── Series / course relationships ────────────────────────────
  /** Auto-derived course id, e.g. `course-ai-engineering`. */
  seriesId?: string;
  /**
   * Slug of the parent series (matches another LibraryCatalogItem
   * whose `type === 'series'` and whose `slug` is this value).
   * Replaces the implicit join via `seriesName` from
   * ContentMetadata once the catalog is unified.
   */
  parentSeriesSlug?: string;
  /** Position inside the parent series. Course lessons = lessonNumber. */
  orderInSeries?: number;
  /**
   * Legacy free-text series name from ContentMetadata.seriesName.
   * Kept so the existing linked-glow handler on /index.astro
   * (`data-series-name`) does not break before Phase 4 swaps it
   * for `parentSeriesSlug`.
   */
  seriesName?: string;
  /** Course slug for course_lesson items. */
  courseSlug?: string;

  // ── Visual assets ────────────────────────────────────────────
  /** Pipeline-supplied cover image URL (relative to /assets). */
  coverImage?: string;
  /**
   * Slug used to look up the orbit `front.png` artifact under
   * src/assets/knowledge-cards/<assetFolder>/. Same value as `slug`
   * for pipeline items; admin records may override via
   * SeriesMetadata.assetFolder when the editorial name differs from
   * the asset folder.
   */
  assetFolder?: string;
  /**
   * Resolved orbit artifact path, if the loader has already
   * looked it up. Optional — the runtime may set this lazily; the
   * unified store does not have to persist it.
   */
  frontImage?: string;
  /** Dominant cover color, used by some recommendation pills. */
  dominantColor?: string;

  // ── Routing ──────────────────────────────────────────────────
  /**
   * Reading-page href. Pipeline items: `/books/<slug>`. Series and
   * synthetic courses: `/series/<slug>` / `/courses/<slug>` (not in
   * isSafeLibraryHref's allow-list today → rendered as
   * non-clickable).
   */
  href: string;

  // ── Effort / stats ───────────────────────────────────────────
  readingMinutes?: number;
  wordCount?: number;
  chapterCount?: number;

  // ── Recommendation graph ─────────────────────────────────────
  relatedIds?: string[];

  // ── Lifecycle timestamps (ISO 8601) ──────────────────────────
  createdAt?: string;
  updatedAt?: string;
}

// ════════════════════════════════════════════════════════════════════
// Bi-directional source-kind / status mapping
// ════════════════════════════════════════════════════════════════════

/**
 * Map the unified `LibraryCatalogSourceKind` to the legacy
 * `LibrarySourceKind` the runtime consumers (library-catalog.ts,
 * LibraryCard, etc.) currently expect. Wider unified values collapse
 * onto the existing 'manual' bucket so no consumer needs to learn
 * the new tags before Phase 5.
 */
export function toLegacySourceKind(
  kind: LibraryCatalogSourceKind,
): LibrarySourceKind {
  switch (kind) {
    case 'discovered': return 'pipeline';
    case 'admin':       return 'manual';
    case 'manual_seed': return 'manual';
    case 'mock':        return 'manual';
    case 'json':        return 'manual';
  }
}

/**
 * Best-effort inverse. The legacy `LibrarySourceKind` lacks the
 * source-distinguishing tags, so `'manual'` resolves to
 * `'manual_seed'` (the legacy default for hardcoded series).
 * Generated and external items both project as `'json'` — they
 * arrive from outside the pipeline and from outside admin, which
 * matches the file-authored bucket.
 */
export function fromLegacySourceKind(
  kind: LibrarySourceKind,
): LibraryCatalogSourceKind {
  switch (kind) {
    case 'pipeline':  return 'discovered';
    case 'manual':    return 'manual_seed';
    case 'generated': return 'json';
    case 'external':  return 'json';
  }
}

/**
 * Map admin-friendly status → legacy item status. Mirrors the
 * existing `statusToLibraryItemStatus` in admin-series.ts so behaviour
 * is preserved.
 */
export function toLegacyItemStatus(
  status: LibraryCatalogStatus,
): LibraryItemStatus {
  switch (status) {
    case 'ready':    return 'ready';
    case 'draft':    return 'new';
    case 'archived': return 'archived';
  }
}

/**
 * Inverse mapping. Pipeline transient states (`'processing'`,
 * `'failed'`) are not part of the admin-facing union; they collapse
 * to the nearest editorial concept (`'draft'` and `'archived'`).
 */
export function fromLegacyItemStatus(
  status: LibraryItemStatus,
): LibraryCatalogStatus {
  switch (status) {
    case 'ready':      return 'ready';
    case 'new':        return 'draft';
    case 'processing': return 'draft';
    case 'archived':   return 'archived';
    case 'failed':     return 'archived';
  }
}

/** Bridge `SeriesStatus` (admin) → `LibraryCatalogStatus` (unified). */
export function fromSeriesStatus(
  status: SeriesStatus | undefined,
): LibraryCatalogStatus {
  switch (status) {
    case 'draft':  return 'draft';
    case 'hidden': return 'archived';
    case 'active':
    default:       return 'ready';
  }
}

/**
 * Narrow the broader `LibraryItemType` to the unified
 * `LibraryCatalogItemType`. Less common pipeline kinds collapse onto
 * `'article'` so the unified shape stays closed.
 */
export function toCatalogItemType(
  type: LibraryItemType,
): LibraryCatalogItemType {
  switch (type) {
    case 'book':           return 'book';
    case 'course':         return 'course';
    case 'course_lesson':  return 'course_lesson';
    case 'article':        return 'article';
    case 'series':         return 'series';
    case 'lesson_summary': return 'article';
    case 'slides':         return 'article';
    case 'lab':            return 'article';
    case 'transcript':     return 'article';
    case 'document':       return 'article';
  }
}

// ════════════════════════════════════════════════════════════════════
// Adapters — pure, side-effect-free
// ════════════════════════════════════════════════════════════════════

/**
 * Project a `LibraryCatalogItem` back onto the legacy `LibraryItem`
 * shape the runtime currently consumes. This is the adapter that
 * Phase 4 will call inside `getLibraryItems()` so unified records
 * can flow through the existing renderers without any per-component
 * change.
 *
 * Visibility flags are NOT lost in the projection — the legacy shape
 * has no visibility object, but the loader that filters items is
 * supposed to drop hidden records BEFORE calling this adapter. If
 * `visibility.showInLibrary === false` reaches a renderer, that is
 * a loader bug, not a renderer bug.
 */
export function libraryCatalogItemToLibraryItem(
  it: LibraryCatalogItem,
): LibraryItem {
  const out: LibraryItem = {
    id: it.id,
    slug: it.slug,
    type: it.type,
    status: toLegacyItemStatus(it.status),
    sourceKind: toLegacySourceKind(it.sourceKind),
    titles: it.title,
    languages: it.languages,
    href: it.href,
  };

  if (it.subtitle && Object.keys(it.subtitle).length > 0) {
    out.subtitles = it.subtitle;
  }
  if (it.description && Object.keys(it.description).length > 0) {
    out.summaries = it.description;
  } else if (it.shortDescription && it.shortDescription.trim().length > 0) {
    // Fallback so the renderer still has a one-liner when only the
    // tagline is authored. Replicates the SeriesMetadata behaviour
    // in `seriesMetadataToLibraryItem` (admin-series.ts).
    out.summaries = { en: it.shortDescription.trim() };
  }
  if (it.topics && Object.keys(it.topics).length > 0) out.topics = it.topics;
  if (it.author && Object.keys(it.author).length > 0) out.author = it.author;

  if (it.categoryKey)      out.categoryKey      = it.categoryKey;
  if (it.level)            out.level            = it.level;
  if (it.seriesId)         out.seriesId         = it.seriesId;
  if (it.courseSlug)       out.courseSlug       = it.courseSlug;
  if (typeof it.orderInSeries === 'number') out.orderInSeries = it.orderInSeries;
  if (it.seriesName)       out.seriesName       = it.seriesName;
  if (it.coverImage)       out.coverImage       = it.coverImage;
  if (it.dominantColor)    out.dominantColor    = it.dominantColor;
  if (it.createdAt)        out.createdAt        = it.createdAt;
  if (it.updatedAt)        out.updatedAt        = it.updatedAt;
  if (typeof it.readingMinutes === 'number') out.readingMinutes = it.readingMinutes;
  if (typeof it.wordCount      === 'number') out.wordCount      = it.wordCount;
  if (typeof it.chapterCount   === 'number') out.chapterCount   = it.chapterCount;
  if (it.relatedIds && it.relatedIds.length > 0) out.relatedIds = [...it.relatedIds];

  return out;
}

/**
 * Lift a legacy `LibraryItem` into the unified shape. Used by the
 * Phase 3/4 import path to convert MANUAL_SERIES_ITEMS, mock items,
 * and discovered items into unified records that can sit beside
 * admin-edited entries in one store.
 *
 * `sourceKindHint` lets the caller declare the originating bucket
 * since the legacy `LibrarySourceKind` cannot distinguish, for
 * example, mock vs. manual_seed. When omitted, the default mapping
 * via `fromLegacySourceKind` applies.
 */
export function libraryItemToLibraryCatalogItem(
  it: LibraryItem,
  sourceKindHint?: LibraryCatalogSourceKind,
): LibraryCatalogItem {
  const out: LibraryCatalogItem = {
    id: it.id,
    slug: it.slug,
    type: toCatalogItemType(it.type),
    status: fromLegacyItemStatus(it.status),
    sourceKind: sourceKindHint ?? fromLegacySourceKind(it.sourceKind),
    title: it.titles,
    languages: [...it.languages],
    visibility: { ...DEFAULT_LIBRARY_CATALOG_VISIBILITY },
    href: it.href,
    assetFolder: it.slug,
  };

  if (it.subtitles  && Object.keys(it.subtitles).length  > 0) out.subtitle    = it.subtitles;
  if (it.summaries  && Object.keys(it.summaries).length  > 0) out.description = it.summaries;
  if (it.topics     && Object.keys(it.topics).length     > 0) out.topics      = it.topics;
  if (it.author     && Object.keys(it.author).length     > 0) out.author      = it.author;

  if (it.categoryKey)      out.categoryKey      = it.categoryKey;
  if (it.level)            out.level            = it.level;
  if (it.seriesId)         out.seriesId         = it.seriesId;
  if (it.courseSlug)       out.courseSlug       = it.courseSlug;
  if (typeof it.orderInSeries === 'number') out.orderInSeries = it.orderInSeries;
  if (it.seriesName)       out.seriesName       = it.seriesName;
  if (it.coverImage)       out.coverImage       = it.coverImage;
  if (it.dominantColor)    out.dominantColor    = it.dominantColor;
  if (it.createdAt)        out.createdAt        = it.createdAt;
  if (it.updatedAt)        out.updatedAt        = it.updatedAt;
  if (typeof it.readingMinutes === 'number') out.readingMinutes = it.readingMinutes;
  if (typeof it.wordCount      === 'number') out.wordCount      = it.wordCount;
  if (typeof it.chapterCount   === 'number') out.chapterCount   = it.chapterCount;
  if (it.relatedIds && it.relatedIds.length > 0) out.relatedIds = [...it.relatedIds];

  return out;
}

/**
 * Direct mapping from an Admin `SeriesMetadata` record to a unified
 * `LibraryCatalogItem` of type `'series'`. Phase 4 will use this in
 * the Admin write path so the editor saves directly into the unified
 * store instead of the parallel `yuval_series_metadata` localStorage
 * key.
 *
 * Slug resolution follows the same rule as `slugFromSeries()` in
 * admin-series.ts: explicit `assetFolder` wins; otherwise the
 * lowercase ASCII-only slugification of `name`. An empty result
 * here indicates an un-saveable record and the caller should refuse
 * to write it.
 */
export function seriesMetadataToLibraryCatalogItem(
  meta: SeriesMetadata,
): LibraryCatalogItem {
  const explicit = meta.assetFolder?.trim();
  const slug = explicit && explicit.length > 0
    ? explicit
    : (meta.name ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

  const title = (meta.displayTitle ?? '').trim() || meta.name;
  const out: LibraryCatalogItem = {
    id: slug,
    slug,
    type: 'series',
    status: fromSeriesStatus(meta.status),
    sourceKind: 'admin',
    title: { en: title },
    languages: ['en'],
    href: `/series/${slug}`,
    visibility: {
      showInLibrary:          meta.isVisibleInUniverse !== false,
      showInUniverse:         meta.isVisibleInUniverse !== false,
      showInOrbit:            meta.isVisibleInUniverse !== false && (meta.status ?? 'active') === 'active',
      showInAtlas:            meta.isVisibleInUniverse !== false,
      showInContinueLearning: false, // series are organizing entities, never the "continue" target
    },
    assetFolder: explicit && explicit.length > 0 ? explicit : slug,
    categoryKey: 'ai-engineering', // matches admin-series.ts default
    author: { en: 'Tomer Kedem' }, // matches admin-series.ts default
  };

  if (meta.shortDescription && meta.shortDescription.trim().length > 0) {
    out.shortDescription = meta.shortDescription.trim();
  }
  if (meta.fullDescription && meta.fullDescription.trim().length > 0) {
    out.description = { en: meta.fullDescription.trim() };
  }
  if (typeof meta.order === 'number') out.order = meta.order;

  return out;
}

/**
 * Project a per-item `ContentMetadata` record onto a partial
 * `LibraryCatalogItem` patch. The patch carries only the fields
 * ContentMetadata actually owns (editorial overrides):
 *   - displayTitle overrides title.en when set.
 *   - isVisibleInUniverse / visualMode collapse into the visibility
 *     object.
 *   - seriesName populates the legacy `seriesName` link.
 *   - category populates `categoryKey`.
 *
 * Returned as a sparse `Partial<LibraryCatalogItem>` so callers can
 * spread it over a base record (from the pipeline / JSON / mock)
 * without forcing them to know which fields are editorial.
 */
export function contentMetadataToLibraryCatalogPatch(
  meta: ContentMetadata,
): Partial<LibraryCatalogItem> {
  const patch: Partial<LibraryCatalogItem> = {};

  const trimmedTitle = (meta.displayTitle ?? '').trim();
  if (trimmedTitle.length > 0 && trimmedTitle !== meta.slug) {
    patch.title = { en: trimmedTitle };
  }

  // Visibility cascade — only override flags the editor actually
  // touched. visualMode === 'hidden' wins over the boolean toggle
  // (matches the runtime predicate `isHidden()` in
  // universe-series-hydrator.ts).
  const isHiddenByMode = meta.visualMode === 'hidden';
  const isHiddenByFlag = meta.isVisibleInUniverse === false;
  if (isHiddenByMode || isHiddenByFlag) {
    patch.visibility = {
      showInLibrary:          false,
      showInUniverse:         false,
      showInOrbit:            false,
      showInAtlas:            false,
      showInContinueLearning: false,
    };
  }

  if (meta.seriesName && meta.seriesName.trim().length > 0) {
    patch.seriesName = meta.seriesName.trim();
  }
  if (meta.category && meta.category.trim().length > 0) {
    patch.categoryKey = meta.category.trim();
  }

  return patch;
}

// ════════════════════════════════════════════════════════════════════
// Type guards
// ════════════════════════════════════════════════════════════════════

export function isLibraryCatalogItemType(
  value: unknown,
): value is LibraryCatalogItemType {
  return typeof value === 'string'
    && (LIBRARY_CATALOG_ITEM_TYPES as readonly string[]).includes(value);
}

export function isLibraryCatalogStatus(
  value: unknown,
): value is LibraryCatalogStatus {
  return typeof value === 'string'
    && (LIBRARY_CATALOG_STATUSES as readonly string[]).includes(value);
}

export function isLibraryCatalogSourceKind(
  value: unknown,
): value is LibraryCatalogSourceKind {
  return typeof value === 'string'
    && (LIBRARY_CATALOG_SOURCE_KINDS as readonly string[]).includes(value);
}
