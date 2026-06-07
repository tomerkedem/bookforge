/**
 * Library Adapter — maps real BookForge discovered content into LibraryItem[].
 *
 * Single source of truth for /library when output/ contains content:
 *   discoverAllBooks()    → real books + course lessons (per output folder)
 *   discoverCourses()     → synthetic course meta (from _catalog.json)
 *
 * Pure mapping. No side effects, no Astro globals, no UI imports.
 *
 * Why a synthetic course item:
 *   The `ai-engineering` course exists as catalog metadata (title,
 *   description, lecturer, lesson count) but has NO file folder of its
 *   own. Without a synthetic LibraryItem the course can never appear on
 *   /library as a navigable card. We mark it as type='course' with an
 *   unsafe `/courses/{slug}` href — `isSafeLibraryHref` returns false, so
 *   it renders as a non-clickable <article>. The day a /courses/{slug}
 *   route ships, only `isSafeLibraryHref` needs to learn that prefix.
 */

import {
  discoverAllBooks,
  discoverCourses,
  type DiscoveredBook,
  type DiscoveredCourse,
} from './book-discovery';
import type {
  LibraryCourseProgress,
  LibraryItem,
  LibraryItemType,
  LibraryLanguageMap,
  LibraryLanguageListMap,
} from '../types/library';
import type { Language } from '../types/index';
import { SUPPORTED_LANGUAGES, SOURCE_LANGUAGE } from './language';

const SUPPORTED_LANG_CODES = new Set<string>(
  SUPPORTED_LANGUAGES.map((l) => l.code),
);

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Convert a generic record-of-strings (manifest format) to LibraryLanguageMap,
 * filtering out keys that are not supported language codes and dropping
 * empty strings.
 */
function toLanguageMap(
  input: Record<string, string> | undefined,
): LibraryLanguageMap {
  if (!input || typeof input !== 'object') return {};
  const result: LibraryLanguageMap = {};
  for (const [key, value] of Object.entries(input)) {
    if (
      SUPPORTED_LANG_CODES.has(key) &&
      typeof value === 'string' &&
      value.trim().length > 0
    ) {
      result[key as Language] = value;
    }
  }
  return result;
}

/**
 * Map a `LocalizedOrPlain` author value (string OR per-language map) into
 * a `LibraryLanguageMap`. A plain string is replicated across the
 * supported languages so any UI language picks it up. Missing or empty
 * input → undefined so consumers can short-circuit without rendering
 * an empty byline.
 */
function toAuthorMap(
  input: string | Record<string, string> | undefined,
): LibraryLanguageMap | undefined {
  if (input == null) return undefined;
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed.length === 0) return undefined;
    const out: LibraryLanguageMap = {};
    for (const code of SUPPORTED_LANG_CODES) {
      out[code as Language] = trimmed;
    }
    return out;
  }
  const mapped = toLanguageMap(input);
  return Object.keys(mapped).length > 0 ? mapped : undefined;
}

/** Filter raw string[] to only valid Language codes. */
function toLanguagesList(arr: string[] | undefined): Language[] {
  if (!Array.isArray(arr)) return [SOURCE_LANGUAGE as Language];
  const valid = arr.filter((c): c is Language => SUPPORTED_LANG_CODES.has(c));
  return valid.length > 0 ? valid : [SOURCE_LANGUAGE as Language];
}

/** Sum word counts across all chapters. */
function sumWordCount(book: DiscoveredBook): number {
  let total = 0;
  for (const ch of book.chapters) {
    if (typeof ch.word_count === 'number' && Number.isFinite(ch.word_count)) {
      total += ch.word_count;
    }
  }
  return total;
}

/**
 * Estimate reading minutes from word count.
 * 200 wpm is a reasonable midpoint for technical Hebrew/English content.
 * Returns at least 1 minute when there is any content; 0 when empty.
 */
function estimateMinutes(words: number): number {
  if (!Number.isFinite(words) || words <= 0) return 0;
  return Math.max(1, Math.round(words / 200));
}

/**
 * Collect topics from chapters into a single de-duplicated list keyed
 * under the source language. Topics are not currently localized in
 * book-manifest.json, so we attach them to `he`. The view layer falls
 * back through the lang chain anyway, so consumers will see them.
 */
function collectTopics(book: DiscoveredBook): LibraryLanguageListMap {
  const merged: string[] = [];
  for (const ch of book.chapters) {
    if (Array.isArray(ch.topics)) {
      for (const t of ch.topics) {
        if (typeof t === 'string' && t.trim().length > 0) {
          merged.push(t.trim());
        }
      }
    }
  }
  if (merged.length === 0) return {};
  const unique = Array.from(new Set(merged));
  return { [SOURCE_LANGUAGE as Language]: unique };
}

// ── Mappers ─────────────────────────────────────────────────────────────────

/**
 * Map a single DiscoveredBook → LibraryItem.
 *
 * - course_lesson contentType  → LibraryItem type 'course_lesson'
 * - book contentType (default) → LibraryItem type 'book'
 *
 * href is /books/{slug} for both — a real, safe route per
 * isSafeLibraryHref. Lesson chapters can be reached from there.
 */
export function mapDiscoveredBookToLibraryItem(
  book: DiscoveredBook,
): LibraryItem {
  const wordCount = sumWordCount(book);
  const isLesson = book.contentType === 'course_lesson';
  const type: LibraryItemType = isLesson ? 'course_lesson' : 'book';

  return {
    id: `pipeline-${book.slug}`,
    slug: book.slug,
    type,
    status: 'ready',
    sourceKind: 'pipeline',
    titles: toLanguageMap(book.titles),
    subtitles: toLanguageMap(book.subtitles),
    summaries: toLanguageMap(book.descriptions),
    topics: collectTopics(book),
    author: toAuthorMap(book.credits?.author),
    categoryKey: book.categoryKey,
    level: book.level,
    seriesId: book.courseSlug ? `course-${book.courseSlug}` : undefined,
    // seriesName is an editorial decision — it comes from catalog.json via
    // the overlay in mergeDiscoveredWithCatalog (applyEditorialOverlay),
    // not from the pipeline. Left undefined here so the overlay is the
    // single source for it.
    seriesName: undefined,
    courseSlug: book.courseSlug,
    orderInSeries: book.lessonNumber,
    coverImage: book.coverImage,
    dominantColor: book.dominantColor,
    languages: toLanguagesList(book.languages),
    href: `/books/${book.slug}`,
    readingMinutes: estimateMinutes(wordCount) || undefined,
    wordCount: wordCount > 0 ? wordCount : undefined,
    chapterCount: Array.isArray(book.chapters) ? book.chapters.length : undefined,
  };
}

/**
 * Map a DiscoveredCourse → synthetic LibraryItem of type 'course'.
 *
 * No file folder ⇒ no real route. We assign /courses/{slug} which is
 * deliberately NOT in isSafeLibraryHref, so the card renders as a
 * non-clickable <article aria-disabled="true">. This is the right
 * behaviour today: the course is a real entity (real lecturer, real
 * lessons) but has no overview page yet. The card communicates "this
 * course exists" without faking a link.
 */
export function mapDiscoveredCourseToLibraryItem(
  course: DiscoveredCourse,
): LibraryItem {
  const courseLanguages = toLanguagesList(
    Object.keys(course.titles ?? {}),
  );

  return {
    id: `pipeline-course-${course.slug}`,
    slug: course.slug,
    type: 'course',
    status: 'ready',
    sourceKind: 'pipeline',
    titles: toLanguageMap(course.titles),
    summaries: toLanguageMap(course.descriptions),
    languages: courseLanguages,
    href: `/courses/${course.slug}`,
    seriesId: `course-${course.slug}`,
    coverImage: course.coverImage,
  };
}

// ── Relationship wiring ─────────────────────────────────────────────────────

/**
 * Wire relatedIds in both directions:
 *   course      → all of its lessons
 *   each lesson → its parent course (if present)
 *
 * This lets getRecommendedItems surface the course when the user's
 * current item is a lesson, and vice-versa.
 */
function wireCourseLessonRelations(items: LibraryItem[]): LibraryItem[] {
  const lessonsByCourseSlug = new Map<string, string[]>();
  const courseIdByCourseSlug = new Map<string, string>();

  for (const it of items) {
    if (it.type === 'course') {
      courseIdByCourseSlug.set(it.slug, it.id);
    }
  }
  for (const it of items) {
    if (it.type === 'course_lesson' && it.courseSlug) {
      const arr = lessonsByCourseSlug.get(it.courseSlug) ?? [];
      arr.push(it.id);
      lessonsByCourseSlug.set(it.courseSlug, arr);
    }
  }

  return items.map((it) => {
    if (it.type === 'course') {
      const lessonIds = lessonsByCourseSlug.get(it.slug) ?? [];
      return lessonIds.length > 0 ? { ...it, relatedIds: lessonIds } : it;
    }
    if (it.type === 'course_lesson' && it.courseSlug) {
      const courseId = courseIdByCourseSlug.get(it.courseSlug);
      return courseId ? { ...it, relatedIds: [courseId] } : it;
    }
    return it;
  });
}

// ── Public entry points ─────────────────────────────────────────────────────

/**
 * Returns LibraryItem[] derived purely from real BookForge content.
 *
 * Order:
 *   1. real books (non-lesson)
 *   2. real course lessons
 *   3. synthetic courses
 *
 * The order matters because helpers like getContinueReadingItem fall
 * back to "first ready item" when no updatedAt is present — putting
 * real readable books first means the continue card never lands on a
 * synthetic course that has no overview page yet.
 *
 * Returns an empty array if discovery finds nothing — caller decides
 * whether to fall back to mock data.
 */
export function getRealLibraryItems(): LibraryItem[] {
  let books: DiscoveredBook[] = [];
  let courses: DiscoveredCourse[] = [];

  // Discovery is fs-backed and runs at build time. Wrap defensively so
  // a broken manifest never breaks the page render.
  try {
    books = discoverAllBooks();
  } catch {
    books = [];
  }
  try {
    courses = discoverCourses();
  } catch {
    courses = [];
  }

  if (books.length === 0 && courses.length === 0) return [];

  const realBooks = books.filter((b) => b.contentType !== 'course_lesson');
  const realLessons = books.filter((b) => b.contentType === 'course_lesson');

  const items: LibraryItem[] = [
    ...realBooks.map(mapDiscoveredBookToLibraryItem),
    ...realLessons
      .sort((a, b) => (a.lessonNumber ?? 0) - (b.lessonNumber ?? 0))
      .map(mapDiscoveredBookToLibraryItem),
    ...courses.map(mapDiscoveredCourseToLibraryItem),
  ];

  return wireCourseLessonRelations(items);
}

/**
 * Per-course progress derived from `_catalog.json` (totalLessons) and
 * the actual count of discovered lesson folders (availableLessons).
 *
 * Used by the stats panel / sidebar to show honest "X of Y lesson
 * summaries available" lines without ever inventing the planned-lesson
 * count in UI code.
 *
 * Returns [] when no courses exist.
 *
 * TODO (follow-up — catalog.json as source of truth for classification):
 *   `discoverCourses()` counts lessons by the PIPELINE classification
 *   (`output/_catalog.json`), NOT the editorial overlay. So a lesson the
 *   editor reclassifies in /admin (e.g. Lesson-7 → course_lesson) is
 *   reflected in /library item counts (which go through
 *   mergeDiscoveredWithCatalog) but NOT yet in this course's
 *   `availableLessons`. To make the "Continue learning" widget honour
 *   catalog.json too, this should count merged library items of type
 *   `course_lesson` per `courseSlug`, not the raw discovery.
 */
export function getCourseProgressList(): LibraryCourseProgress[] {
  let courses: DiscoveredCourse[] = [];
  try {
    courses = discoverCourses();
  } catch {
    return [];
  }
  return courses.map((c) => ({
    slug: c.slug,
    titles: toLanguageMap(c.titles),
    available: c.availableLessons,
    total: c.totalLessons,
  }));
}
