/**
 * Library Catalog - Utility Functions
 * ────────────────────────────────────────────────────────────────────────────
 * Pure, side-effect-free helpers operating over `LibraryItem[]`.
 *
 * Source today: mock data only (`libraryMockCatalog`).
 * Source tomorrow: an adapter on top of `discoverAllBooks()` /
 * `_catalog.json`. Consumers won't change because the shape is stable.
 *
 * No I/O, no DOM, no Astro globals. Safe to import from anywhere.
 */

import type { Language } from '../types/index';
import type {
  LibraryCatalog,
  LibraryFilter,
  LibraryItem,
  LibraryItemStatus,
  LibraryItemType,
  LibrarySortKey,
  LibraryStats,
} from '../types/library';
import { libraryMockCatalog } from '../data/library-mock';
import { getRealLibraryItems } from './library-adapter';
import { isReadableLibraryItem } from './library-display';
import { getAdminSeriesLibraryItems } from './library/admin-series';
import { getKnowledgeCardAssets } from './library/knowledge-cards';

// ── Source ──────────────────────────────────────────────────────────────────

/** Returns the mock catalog items. Stable order = source order. */
export function getMockLibraryItems(): LibraryItem[] {
  return libraryMockCatalog.items;
}

/** Returns the full mock catalog (items + series + meta). */
export function getMockLibraryCatalog(): LibraryCatalog {
  return libraryMockCatalog;
}

// ── Manual series overlay ───────────────────────────────────────────────────
// BookForge does not yet emit series entities (the pipeline produces
// books and course lessons; series are an organizing layer above
// them). To let the /library orbit surface a series capsule today
// without inventing a fake book, we keep a tiny, explicit list of
// manually-authored series items here and merge them on top of
// whatever source `getLibraryItems()` returns.
//
// Removing this entire block (the constant + the merge call below) is
// the one-step undo when BookForge starts producing series natively.
// No other consumer of `getLibraryItems()` knows about the overlay,
// because everything downstream operates on the unified `LibraryItem`
// shape.
//
// Constraints carried from the product spec:
//   - status: 'new'             (no manifest behind it yet)
//   - sourceKind: 'manual'      (truthful provenance)
//   - href: '/series/...'       (intentionally NOT in
//                                isSafeLibraryHref's allow-list, so
//                                LibraryCard renders it as a disabled
//                                <article> and library.astro hides
//                                its galaxy-cta-open chevron)
const MANUAL_SERIES_ITEMS: LibraryItem[] = [
  {
    id: 'ai-engineering-series',
    slug: 'ai-engineering-series',
    type: 'series',
    status: 'new',
    sourceKind: 'manual',
    titles:    { en: 'EI Engineering Course' },
    summaries: { en: 'A structured AI Engineering learning series' },
    author:    { en: 'Tomer Kedem' },
    categoryKey: 'ai-engineering',
    languages: ['en'],
    createdAt: '2026-05-09T00:00:00.000Z',
    updatedAt: '2026-05-09T00:00:00.000Z',
    href: '/series/ai-engineering-series',
  },
];

/**
 * Append manual series overlay entries onto a base catalog. Dedupes
 * on `slug` (case-insensitive) so the manual list never produces a
 * duplicate when the underlying source already owns the slug — this
 * is the forward-compat hook for the day BookForge emits a real
 * `ai-engineering-series` item from its own pipeline; the manual
 * entry will silently drop out then.
 */
function withManualSeries(base: LibraryItem[]): LibraryItem[] {
  if (MANUAL_SERIES_ITEMS.length === 0) return base;
  const taken = new Set(base.map((it) => it.slug.toLowerCase()));
  const additions = MANUAL_SERIES_ITEMS.filter(
    (it) => !taken.has(it.slug.toLowerCase()),
  );
  return additions.length === 0 ? base : [...base, ...additions];
}

// ── Admin series overlay ────────────────────────────────────────────
// The /admin "ניהול סדרות" section persists series records to
// `localStorage` (`yuval_series_metadata`). This overlay projects
// those records onto the public LibraryItem shape so admin edits flow
// straight into `/library` once the page hydrates.
//
// At SSR / build time `localStorage` does not exist, so
// `getAdminSeriesLibraryItems` returns `[]` and this overlay is a
// no-op — the SSR catalog continues to use the manual seed for
// `ai-engineering-series`. On the client (e.g. in the page-level
// hydrator at `src/scripts/library/admin-series-hydrator.ts`) the
// same overlay returns the admin records, so the pipeline is
// consistent across both sides.
//
// Dedupe runs against the merged slug set so admin records never
// duplicate the manual seed (the admin's `assetFolder` field
// resolves to the same `ai-engineering-series` slug used by the
// manual entry — when both exist, the manual seed wins at SSR and
// the client-side hydrator overrides only the visible label, never
// the orbit station identity).

function withAdminSeriesOverlay(base: LibraryItem[]): LibraryItem[] {
  // SSR-safe predicate: `getKnowledgeCardAssets` works at SSR (Vite
  // glob discovery is build-time), so the artifact gate runs in both
  // environments without surprises.
  const hasOrbitArtifact = (slug: string): boolean =>
    getKnowledgeCardAssets(slug) !== undefined;
  const adminItems = getAdminSeriesLibraryItems(hasOrbitArtifact);
  if (adminItems.length === 0) return base;
  const taken = new Set(base.map((it) => it.slug.toLowerCase()));
  const additions = adminItems.filter(
    (it) => !taken.has(it.slug.toLowerCase()),
  );
  return additions.length === 0 ? base : [...base, ...additions];
}

/**
 * Primary source-of-truth for /library at build time.
 *
 * Returns real BookForge-discovered items when output/ contains content,
 * otherwise falls back to mock data (so unit tests / CI without an
 * output/ folder still get a populated catalog).
 *
 * Mock data is NEVER mixed with real data: it's all-or-nothing. This
 * keeps the on-screen counts honest — once Tomer has any real content,
 * the dashboard reflects only that, not made-up clean-code or legacy
 * placeholders.
 *
 * The manual-series overlay (see `MANUAL_SERIES_ITEMS` above) is the
 * single, explicit exception to the all-or-nothing rule — it carries
 * organizing entities the pipeline can't yet emit. The overlay applies
 * to BOTH the real and the mock branch so unit tests see the same
 * shape as production.
 */
export function getLibraryItems(): LibraryItem[] {
  const real = getRealLibraryItems();
  const base = real.length > 0 ? real : getMockLibraryItems();
  // Layered overlays — order matters:
  //   1. `withManualSeries` — hardcoded baseline series the pipeline
  //      cannot yet emit. Visible at SSR, so the orbit never appears
  //      empty for the seeded entries.
  //   2. `withAdminSeriesOverlay` — admin-edited series projected
  //      from `yuval_series_metadata`. SSR-empty, client-populated.
  //      Dedupes against (1) by slug.
  return withAdminSeriesOverlay(withManualSeries(base));
}

// ── Lookup ──────────────────────────────────────────────────────────────────

export function getLibraryItemById(
  id: string,
  items: LibraryItem[] = getMockLibraryItems(),
): LibraryItem | undefined {
  return items.find((it) => it.id === id);
}

export function getItemsByType(
  items: LibraryItem[],
  type: LibraryItemType,
): LibraryItem[] {
  return items.filter((it) => it.type === type);
}

export function getItemsBySeries(
  items: LibraryItem[],
  seriesId: string,
): LibraryItem[] {
  return items
    .filter((it) => it.seriesId === seriesId)
    .sort((a, b) => (a.orderInSeries ?? 0) - (b.orderInSeries ?? 0));
}

// ── Recently / Continue / Recommend ─────────────────────────────────────────

/**
 * Picks the most recently updated, non-archived, non-failed item.
 * The future UI will replace this with real reading-progress lookup.
 */
export function getContinueReadingItem(
  items: LibraryItem[] = getMockLibraryItems(),
): LibraryItem | undefined {
  const candidates = items.filter(
    (it) => it.status !== 'archived' && it.status !== 'failed',
  );
  return [...candidates].sort(byUpdatedDesc)[0];
}

export function getRecentlyUpdatedItems(
  items: LibraryItem[],
  limit = 5,
): LibraryItem[] {
  return [...items]
    .filter((it) => it.status !== 'archived' && it.status !== 'failed')
    .sort(byUpdatedDesc)
    .slice(0, Math.max(0, limit));
}

/**
 * Simple heuristic recommendation:
 *   1. Same categoryKey  (+3)
 *   2. Same seriesId     (+2)
 *   3. Shared topics     (+1 per shared topic, any language)
 *   4. Already in relatedIds → strong boost (+5)
 * Excludes archived and failed items by default.
 */
export function getRecommendedItems(
  items: LibraryItem[],
  currentItemId: string,
  limit = 6,
): LibraryItem[] {
  const current = getLibraryItemById(currentItemId, items);
  if (!current) return [];

  const currentTopics = collectTopics(current);
  const relatedSet = new Set(current.relatedIds ?? []);

  const scored = items
    .filter((it) => it.id !== current.id)
    .filter((it) => it.status !== 'archived' && it.status !== 'failed')
    .map((it) => {
      let score = 0;
      if (relatedSet.has(it.id)) score += 5;
      if (it.categoryKey && it.categoryKey === current.categoryKey) score += 3;
      if (it.seriesId && it.seriesId === current.seriesId) score += 2;

      const otherTopics = collectTopics(it);
      for (const t of otherTopics) {
        if (currentTopics.has(t)) score += 1;
      }
      return { it, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || compareUpdated(a.it, b.it));

  return scored.slice(0, Math.max(0, limit)).map((x) => x.it);
}

// ── Sort ────────────────────────────────────────────────────────────────────

const STATUS_ORDER: Record<LibraryItemStatus, number> = {
  new: 0,
  processing: 1,
  ready: 2,
  archived: 3,
  failed: 4,
};

const TYPE_ORDER: Record<LibraryItemType, number> = {
  course: 0,
  series: 1,
  book: 2,
  course_lesson: 3,
  lesson_summary: 4,
  article: 5,
  slides: 6,
  lab: 7,
  transcript: 8,
  document: 9,
};

export function sortLibraryItems(
  items: LibraryItem[],
  sortKey: LibrarySortKey,
  language: Language = 'en',
): LibraryItem[] {
  const sorted = [...items];
  switch (sortKey) {
    case 'recent':
      return sorted.sort(byUpdatedDesc);
    case 'created':
      return sorted.sort(byCreatedDesc);
    case 'title':
      return sorted.sort((a, b) => titleFor(a, language).localeCompare(titleFor(b, language)));
    case 'reading_time':
      return sorted.sort((a, b) => (a.readingMinutes ?? Infinity) - (b.readingMinutes ?? Infinity));
    case 'type':
      return sorted.sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type]);
    case 'status':
      return sorted.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
    default:
      return sorted;
  }
}

// ── Filter ──────────────────────────────────────────────────────────────────

export function filterLibraryItems(
  items: LibraryItem[],
  filters: LibraryFilter,
): LibraryItem[] {
  const types = toArray(filters.type);
  const statuses = toArray(filters.status);
  const categories = toArray(filters.categoryKey);
  const languages = toArray(filters.language);
  const levels = toArray(filters.level);

  const includeArchived = filters.includeArchived === true;
  const includeFailed = filters.includeFailed === true;

  return items.filter((it) => {
    if (!includeArchived && it.status === 'archived') return false;
    if (!includeFailed && it.status === 'failed') return false;

    if (types.length && !types.includes(it.type)) return false;
    if (statuses.length && !statuses.includes(it.status)) return false;
    if (categories.length && (!it.categoryKey || !categories.includes(it.categoryKey))) return false;
    if (levels.length && (!it.level || !levels.includes(it.level))) return false;
    if (languages.length && !languages.some((lang) => it.languages.includes(lang))) return false;

    if (filters.seriesId && it.seriesId !== filters.seriesId) return false;
    if (filters.courseSlug && it.courseSlug !== filters.courseSlug) return false;

    return true;
  });
}

// ── Stats ───────────────────────────────────────────────────────────────────

export function getLibraryStats(items: LibraryItem[]): LibraryStats {
  const stats: LibraryStats = {
    total: items.length,
    readable: 0,
    byType: {},
    byStatus: {},
    byCategory: {},
    byLanguage: {},
    totalReadingMinutes: 0,
    totalWordCount: 0,
  };

  for (const it of items) {
    if (isReadableLibraryItem(it)) stats.readable += 1;
    stats.byType[it.type] = (stats.byType[it.type] ?? 0) + 1;
    stats.byStatus[it.status] = (stats.byStatus[it.status] ?? 0) + 1;
    if (it.categoryKey) {
      stats.byCategory[it.categoryKey] = (stats.byCategory[it.categoryKey] ?? 0) + 1;
    }
    for (const lang of it.languages) {
      stats.byLanguage[lang] = (stats.byLanguage[lang] ?? 0) + 1;
    }
    if (typeof it.readingMinutes === 'number') stats.totalReadingMinutes += it.readingMinutes;
    if (typeof it.wordCount === 'number') stats.totalWordCount += it.wordCount;
  }

  return stats;
}

// ── Internals ───────────────────────────────────────────────────────────────

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function titleFor(it: LibraryItem, lang: Language): string {
  return it.titles[lang] ?? it.titles.en ?? it.titles.he ?? it.slug;
}

function collectTopics(it: LibraryItem): Set<string> {
  const out = new Set<string>();
  if (!it.topics) return out;
  for (const list of Object.values(it.topics)) {
    if (!list) continue;
    for (const t of list) out.add(t.toLowerCase());
  }
  return out;
}

function tsOrZero(iso: string | undefined): number {
  return iso ? Date.parse(iso) || 0 : 0;
}

function byUpdatedDesc(a: LibraryItem, b: LibraryItem): number {
  return tsOrZero(b.updatedAt) - tsOrZero(a.updatedAt);
}

function byCreatedDesc(a: LibraryItem, b: LibraryItem): number {
  return tsOrZero(b.createdAt) - tsOrZero(a.createdAt);
}

function compareUpdated(a: LibraryItem, b: LibraryItem): number {
  return byUpdatedDesc(a, b);
}
