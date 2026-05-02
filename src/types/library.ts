/**
 * Library Catalog - Data Model
 * ────────────────────────────────────────────────────────────────────────────
 * Pure type definitions for the future BookForge living library screen.
 *
 * Design rules (binding):
 *  - No display strings here. All user-facing labels (item types, statuses,
 *    levels, filters) resolve at view time via i18n keys, e.g.
 *    `library.itemType.<type>`, `library.status.<status>`.
 *  - i18n-ready by default: every translatable field is
 *    `Partial<Record<Language, string | string[]>>`.
 *  - Theme-independent: no color tokens here. `dominantColor` is content
 *    metadata (cover hue), not a UI token.
 *  - Source-agnostic: the same shape is consumed from mock data today and
 *    from a real `_catalog.json` adapter later.
 *
 * This file does NOT replace any existing type. It coexists with
 * `DiscoveredBook` / `DiscoveredCourse` in `src/utils/book-discovery.ts`.
 * An adapter (future) will map those into `LibraryItem`.
 */

import type { BookLevel, Language } from './index';

// ── Localized helpers ───────────────────────────────────────────────────────

/** Localized scalar field, e.g. titles per language. */
export type LibraryLanguageMap = Partial<Record<Language, string>>;

/** Localized array field, e.g. topics per language. */
export type LibraryLanguageListMap = Partial<Record<Language, string[]>>;

// ── Enumerations ────────────────────────────────────────────────────────────

/**
 * Every kind of content the living library can surface.
 * Add new kinds here only; consumers must handle `unknown` defensively.
 */
export type LibraryItemType =
  | 'book'
  | 'course'
  | 'course_lesson'
  | 'article'
  | 'series'
  | 'lesson_summary'
  | 'slides'
  | 'lab'
  | 'transcript'
  | 'document';

export const LIBRARY_ITEM_TYPES: readonly LibraryItemType[] = [
  'book',
  'course',
  'course_lesson',
  'article',
  'series',
  'lesson_summary',
  'slides',
  'lab',
  'transcript',
  'document',
] as const;

export function isLibraryItemType(value: unknown): value is LibraryItemType {
  return typeof value === 'string'
    && (LIBRARY_ITEM_TYPES as readonly string[]).includes(value);
}

/**
 * Lifecycle status of an item. Drives badges, filters, and orbit animations
 * in the future UI ("processing" pulses, "new" glows, etc).
 */
export type LibraryItemStatus =
  | 'new'
  | 'processing'
  | 'ready'
  | 'failed'
  | 'archived';

export const LIBRARY_ITEM_STATUSES: readonly LibraryItemStatus[] = [
  'new', 'processing', 'ready', 'failed', 'archived',
] as const;

export function isLibraryItemStatus(value: unknown): value is LibraryItemStatus {
  return typeof value === 'string'
    && (LIBRARY_ITEM_STATUSES as readonly string[]).includes(value);
}

/**
 * Where the item came from. Useful for trust signals, filtering, and
 * deciding whether the item can be re-processed by the pipeline.
 */
export type LibrarySourceKind =
  | 'pipeline'   // produced by BookForge pipeline (.docx → MD)
  | 'manual'     // hand-authored MD or metadata
  | 'generated'  // AI-generated (article, summary)
  | 'external';  // linked from outside, not stored locally

export const LIBRARY_SOURCE_KINDS: readonly LibrarySourceKind[] = [
  'pipeline', 'manual', 'generated', 'external',
] as const;

// ── Sort & filter ───────────────────────────────────────────────────────────

export type LibrarySortKey =
  | 'recent'        // updatedAt desc
  | 'created'       // createdAt desc
  | 'title'         // title in current language asc
  | 'reading_time'  // readingMinutes asc
  | 'type'          // group by type
  | 'status';       // status order: new → processing → ready → archived → failed

/**
 * Client-side filter shape. All fields are optional and AND'd together.
 * Languages in `language` match if the item supports ANY of them.
 */
export interface LibraryFilter {
  type?: LibraryItemType | LibraryItemType[];
  status?: LibraryItemStatus | LibraryItemStatus[];
  categoryKey?: string | string[];
  language?: Language | Language[];
  seriesId?: string;
  courseSlug?: string;
  level?: BookLevel | BookLevel[];
  /** When true, archived items pass; otherwise hidden. Default false. */
  includeArchived?: boolean;
  /** When true, failed items pass; otherwise hidden. Default false. */
  includeFailed?: boolean;
}

// ── Core item ───────────────────────────────────────────────────────────────

/**
 * A single piece of content surfaced in the living library.
 *
 * Required fields are the ones we cannot render a card without.
 * Everything else is optional; the UI must be defensive.
 */
export interface LibraryItem {
  /** Globally unique id. Convention: same as `slug` for pipeline items. */
  id: string;
  /** URL-safe slug. */
  slug: string;
  type: LibraryItemType;
  status: LibraryItemStatus;
  sourceKind: LibrarySourceKind;

  /** Localized display fields. Missing language → fallback at view time. */
  titles: LibraryLanguageMap;
  subtitles?: LibraryLanguageMap;
  summaries?: LibraryLanguageMap;
  topics?: LibraryLanguageListMap;

  /** Machine-readable category key (e.g. 'foundations'). */
  categoryKey?: string;
  level?: BookLevel;

  /** Series / course relationships. */
  seriesId?: string;
  courseSlug?: string;
  orderInSeries?: number;

  /** Visual metadata only. Not a UI token. */
  coverImage?: string;
  dominantColor?: string;

  /** Languages the content is actually available in (not the UI). */
  languages: Language[];

  /** ISO 8601 timestamps. */
  createdAt?: string;
  updatedAt?: string;

  /** Reading effort. Articles/summaries primarily; books optional. */
  readingMinutes?: number;
  wordCount?: number;

  /** Link to the existing reading route (or external URL). */
  href: string;

  /** Other library item ids related semantically. Used by recommendations. */
  relatedIds?: string[];
}

// ── Aggregates ──────────────────────────────────────────────────────────────

/**
 * A series groups multiple `LibraryItem`s into an ordered narrative
 * (e.g. "AI Engineering" series spanning 12 lesson summaries + 3 articles).
 *
 * Ordering rule: prefer `orderInSeries` on each item when present;
 * otherwise fall back to the order of `itemIds` here.
 */
export interface LibrarySeries {
  id: string;
  titles: LibraryLanguageMap;
  summaries?: LibraryLanguageMap;
  categoryKey?: string;
  coverImage?: string;
  dominantColor?: string;
  itemIds: string[];
}

/**
 * Top-level catalog shape. Mock data and the future real adapter both
 * return this structure.
 */
export interface LibraryCatalog {
  schemaVersion: number;
  generatedAt: string; // ISO 8601
  items: LibraryItem[];
  series: LibrarySeries[];
}

/** Aggregate counts for the sidebar "library stats" panel. */
export interface LibraryStats {
  total: number;
  byType: Partial<Record<LibraryItemType, number>>;
  byStatus: Partial<Record<LibraryItemStatus, number>>;
  byCategory: Record<string, number>;
  byLanguage: Partial<Record<Language, number>>;
  totalReadingMinutes: number;
  totalWordCount: number;
}
