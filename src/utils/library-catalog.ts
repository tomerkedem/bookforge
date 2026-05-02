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

// ── Source ──────────────────────────────────────────────────────────────────

/** Returns the mock catalog items. Stable order = source order. */
export function getMockLibraryItems(): LibraryItem[] {
  return libraryMockCatalog.items;
}

/** Returns the full mock catalog (items + series + meta). */
export function getMockLibraryCatalog(): LibraryCatalog {
  return libraryMockCatalog;
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
    byType: {},
    byStatus: {},
    byCategory: {},
    byLanguage: {},
    totalReadingMinutes: 0,
    totalWordCount: 0,
  };

  for (const it of items) {
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
