/**
 * Book Discovery - auto-discovers books and chapters from output/ folder.
 *
 * Priority:
 * 1. book-manifest.json if present
 * 2. MD files scanned directly
 *
 * Dynamic language support is derived from SUPPORTED_LANGUAGES.
 * No flat legacy fields are used here.
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import type { BookLevel, Chapter } from '../types/index';
import { isBookLevel } from '../types/index';
import { PATHS } from '../config';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, SOURCE_LANGUAGE } from './language';
import { t } from '../i18n';

const OUTPUT_DIR = PATHS.OUTPUT_DIR;
const LANGUAGE_CODES = SUPPORTED_LANGUAGES.map((l) => l.code);

/**
 * Credits for a book.
 */
export type LocalizedOrPlain = string | Record<string, string>;

export interface BookCredits {
  type: 'lecture_summary' | 'original';
  lecturer?: LocalizedOrPlain;
  editor?: LocalizedOrPlain;
  author?: LocalizedOrPlain;
}

export type ContentType = 'book' | 'course_lesson';

export interface DiscoveredBook {
  slug: string;
  titles: Record<string, string>;
  subtitles: Record<string, string>;
  descriptions: Record<string, string>;
  category: Record<string, string>;
  /** Machine-readable category key from _catalog.json (e.g. 'foundations'). */
  categoryKey?: string;
  coverImage: string;
  dominantColor: string;
  chapters: Chapter[];
  languages: string[];
  credits?: BookCredits;
  /**
   * Difficulty level key. Display labels live in i18n under
   * `library.level.<key>`. Undefined when no level was declared in
   * the manifest, the book's catalog entry, or the parent course.
   */
  level?: BookLevel;
  contentType: ContentType;
  /** Present when contentType === 'course_lesson'. */
  courseSlug?: string;
  lessonNumber?: number;
}

export interface DiscoveredCourse {
  slug: string;
  titles: Record<string, string>;
  descriptions: Record<string, string>;
  lecturer?: Record<string, string>;
  summaryAuthor?: Record<string, string>;
  totalLessons: number;
  availableLessons: number;
  lessons: DiscoveredBook[];
  coverImage: string;
}

interface CatalogBookEntry {
  contentType?: ContentType;
  category?: string;
  course?: string;
  lessonNumber?: number;
  /** Difficulty level key — see BookLevel. Validated at resolution time. */
  level?: string;
}

interface CatalogCourseEntry {
  titles?: Record<string, string>;
  descriptions?: Record<string, string>;
  totalLessons?: number;
  lecturer?: Record<string, string>;
  /** Person who authored the lesson summaries (separate from the course lecturer). */
  summaryAuthor?: Record<string, string>;
  /** Category key for the course; inherited by its lessons when they don't declare their own. */
  category?: string;
  /** Difficulty level for the course; inherited by its lessons when they don't declare their own. */
  level?: string;
}

interface Catalog {
  courses: Record<string, CatalogCourseEntry>;
  books: Record<string, CatalogBookEntry>;
}

/**
 * Build a Record<lang, label> for a category key, sourced from i18n.
 * This is the single source of truth for category display labels — adding
 * a language is one entry in translations.ts, not two files.
 */
function categoryLabelsFromI18n(key: string): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const lang of LANGUAGE_CODES) {
    labels[lang] = t(`library.category.${key}`, lang);
  }
  return labels;
}

let cachedCatalog: Catalog | null = null;

function loadCatalog(): Catalog {
  if (cachedCatalog) return cachedCatalog;

  const empty: Catalog = { courses: {}, books: {} };
  const catalogPath = join(OUTPUT_DIR, '_catalog.json');
  if (!existsSync(catalogPath)) {
    cachedCatalog = empty;
    return empty;
  }

  try {
    const raw = readFileSync(catalogPath, 'utf-8');
    const parsed = JSON.parse(raw);
    cachedCatalog = {
      courses: parsed.courses || {},
      books: parsed.books || {},
    };
    return cachedCatalog;
  } catch {
    cachedCatalog = empty;
    return empty;
  }
}

interface ContentStructure {
  book: {
    titles?: Record<string, string>;
    subtitles?: Record<string, string>;
    descriptions?: Record<string, string>;
    languages?: string[];
    credits?: BookCredits;
    category?: string | Record<string, string>;
    /** Difficulty level key authored in book-manifest.json. */
    level?: string;
    chapters: Array<{
      id: number | string;
      file_slug?: string;
      titles?: Record<string, string>;
      sections: number;
      has_images: boolean;
      word_count: number;
      topics: string[];
    }>;
    [key: string]: any;
  };
}

/**
 * Extract metadata from a single MD file.
 */
function extractFromMd(filepath: string): {
  title: string;
  wordCount: number;
  sections: number;
  hasImages: boolean;
} {
  const content = readFileSync(filepath, 'utf-8');
  const lines = content.split('\n');

  const titleLine = lines.find((l) => /^#\s+/.test(l));
  const title = titleLine ? titleLine.replace(/^#\s+/, '').trim() : '';

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const sections = lines.filter((l) => /^##\s+/.test(l)).length;
  const hasImages = /!\[.*?\]\(.*?\)/.test(content) || /assets\//.test(content);

  return { title, wordCount, sections, hasImages };
}

/**
 * Discover all chapters directly from MD files.
 * Source language files are the canonical source for chapter existence.
 */
function discoverChaptersFromFiles(bookDir: string): Chapter[] {
  const files = readdirSync(bookDir);

  const sourceFiles = files
    .filter((f) => new RegExp(`^chapter-\\d+\\.${SOURCE_LANGUAGE}\\.md$`).test(f))
    .sort();

  const chapters: Chapter[] = [];

  for (const sourceFile of sourceFiles) {
    const match = sourceFile.match(new RegExp(`^chapter-(\\d+)\\.${SOURCE_LANGUAGE}\\.md$`));
    if (!match) continue;

    const num = parseInt(match[1], 10);
    const sourcePath = join(bookDir, sourceFile);
    const sourceMeta = extractFromMd(sourcePath);

    const titles: Record<string, string> = {
      [SOURCE_LANGUAGE]: sourceMeta.title,
    };

    for (const lang of LANGUAGE_CODES) {
      if (lang === SOURCE_LANGUAGE) continue;

      const langFile = sourceFile.replace(`.${SOURCE_LANGUAGE}.md`, `.${lang}.md`);
      const langPath = join(bookDir, langFile);

      if (existsSync(langPath)) {
        titles[lang] = extractFromMd(langPath).title;
      }
    }

    chapters.push({
      id: num,
      titles,
      sections: sourceMeta.sections,
      has_images: sourceMeta.hasImages,
      word_count: sourceMeta.wordCount,
      topics: [],
    });
  }

  return chapters.sort((a, b) => {
    if (a.type === 'intro') return -1;
    if (b.type === 'intro') return 1;
    return Number(a.id) - Number(b.id);
  });
}

/**
 * Load chapters from book-manifest.json if available.
 * Titles are always refreshed from actual MD files when possible.
 */
function loadFromContentStructure(bookDir: string): Chapter[] | null {
  const jsonPath = join(bookDir, 'book-manifest.json');
  if (!existsSync(jsonPath)) return null;

  try {
    const raw = readFileSync(jsonPath, 'utf-8');
    const data: ContentStructure = JSON.parse(raw);

    if (!data.book?.chapters?.length) return null;

    return data.book.chapters.map((ch, idx) => {
      const chId = typeof ch.id === 'string' ? ch.id : (ch.id ?? idx + 1);
      const fileSlug =
        ch.file_slug ||
        (typeof chId === 'string' ? chId : `chapter-${String(chId).padStart(2, '0')}`);

      const titles: Record<string, string> = { ...(ch.titles || {}) };

      for (const lang of LANGUAGE_CODES) {
        const fileName = `${fileSlug}.${lang}.md`;
        const filePath = join(bookDir, fileName);

        if (existsSync(filePath)) {
          titles[lang] = extractFromMd(filePath).title;
        }
      }

      return {
        id: chId, // 🔥 חשוב: לא לגעת!
        file_slug: fileSlug, // 🔥 קריטי
        type: typeof chId === 'string' ? 'intro' : 'content',
        titles,
        sections: ch.sections,
        has_images: ch.has_images,
        word_count: ch.word_count,
        topics: ch.topics || [],
      };
    });
  } catch {
    return null;
  }
}

/**
 * Load book-level metadata.
 */
function loadBookMeta(bookDir: string, slug: string): {
  titles: Record<string, string>;
  subtitles: Record<string, string>;
  descriptions: Record<string, string>;
  category: Record<string, string>;
  languages: string[];
  credits?: BookCredits;
  /** Level declared in book-manifest.json, validated against BOOK_LEVELS. */
  level?: BookLevel;
} {
  const formatted = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const jsonPath = join(bookDir, 'book-manifest.json');
  if (existsSync(jsonPath)) {
    try {
      const data: ContentStructure = JSON.parse(readFileSync(jsonPath, 'utf-8'));
      const book = data.book;

      const titles: Record<string, string> = { ...(book.titles || {}) };
      const subtitles: Record<string, string> = { ...(book.subtitles || {}) };
      const descriptions: Record<string, string> = { ...(book.descriptions || {}) };

      if (!titles[DEFAULT_LANGUAGE] && !titles[SOURCE_LANGUAGE]) {
        titles[DEFAULT_LANGUAGE] = formatted;
      }

      const availableLanguages = LANGUAGE_CODES.filter((lang) => {
        const hasFile =
          existsSync(join(bookDir, `chapter-01.${lang}.md`)) ||
          existsSync(join(bookDir, `intro.${lang}.md`));
        return hasFile || Boolean(titles[lang]);
      });

      const normalizedBookLanguages = Array.isArray(book.languages)
        ? book.languages.filter((lang): lang is string => typeof lang === 'string' && LANGUAGE_CODES.includes(lang))
        : [];

      const languages = normalizedBookLanguages.length > 0
        ? normalizedBookLanguages.filter((lang) => availableLanguages.includes(lang))
        : availableLanguages;

      if (!languages.includes(SOURCE_LANGUAGE) && availableLanguages.includes(SOURCE_LANGUAGE)) {
        languages.unshift(SOURCE_LANGUAGE);
      }

      let category: Record<string, string>;
      if (typeof book.category === 'object' && book.category !== null) {
        category = book.category;
      } else if (typeof book.category === 'string') {
        category = {
          [SOURCE_LANGUAGE]: book.category,
          en: book.category,
        };
      } else {
        category = {
          [SOURCE_LANGUAGE]: 'כללי',
          en: 'General',
        };
      }

      const manifestLevel = isBookLevel(book.level) ? book.level : undefined;

      return {
        titles,
        subtitles,
        descriptions,
        category,
        languages: languages.length > 0 ? languages : [SOURCE_LANGUAGE],
        credits: book.credits,
        level: manifestLevel,
      };
    } catch {
      // fall through
    }
  }

  return {
    titles: {
      [SOURCE_LANGUAGE]: formatted,
      en: formatted,
    },
    subtitles: {},
    descriptions: {},
    category: {
      [SOURCE_LANGUAGE]: 'כללי',
      en: 'General',
    },
    languages: [SOURCE_LANGUAGE],
    credits: undefined,
    level: undefined,
  };
}

/**
 * Discover a single book by slug.
 */
export function discoverBook(slug: string): DiscoveredBook | null {
  const bookDir = join(OUTPUT_DIR, slug);
  if (!existsSync(bookDir) || !statSync(bookDir).isDirectory()) return null;

  // Skip catalog/control files at the top level of output/
  if (slug.startsWith('_') || slug.startsWith('.')) return null;

  const meta = loadBookMeta(bookDir, slug);
  const chapters = loadFromContentStructure(bookDir) || discoverChaptersFromFiles(bookDir);

  if (chapters.length === 0) return null;

  const coverCandidates = [
    `/${slug}/assets/cover.png`,
    `/${slug}/assets/cover.jpg`,
    `/covers/${slug}.png`,
    `/covers/${slug}.jpg`,
  ];

  const publicDir = PATHS.PUBLIC_DIR;
  const existingCover = coverCandidates.find((c) => existsSync(join(publicDir, c.slice(1))));
  const coverImage = existingCover || '/covers/placeholder.svg';

  // Catalog overrides: structural classification only (machine-readable
  // categoryKey + contentType). Display labels live in i18n — see
  // categoryLabelsFromI18n() below.
  const catalog = loadCatalog();
  const entry = catalog.books[slug];

  // Course lessons inherit their category from the parent course so the
  // unified "all content" view can place them in the right bucket.
  const inheritedCourseCategory =
    entry?.contentType === 'course_lesson' && entry.course
      ? catalog.courses[entry.course]?.category
      : undefined;
  const categoryKey = entry?.category || inheritedCourseCategory;
  const categoryFromI18n = categoryKey ? categoryLabelsFromI18n(categoryKey) : undefined;

  // i18n labels win over manifest. Books that aren't in the catalog keep
  // whatever the manifest had (or the default "כללי") so the homepage
  // doesn't silently drop unmapped content during a partial migration.
  const category = categoryFromI18n || meta.category;

  const contentType: ContentType = entry?.contentType || 'book';
  const courseSlug = contentType === 'course_lesson' ? entry?.course : undefined;
  const lessonNumber = contentType === 'course_lesson' ? entry?.lessonNumber : undefined;

  // Level resolution: manifest wins, then catalog book entry, then the
  // parent course (for course lessons). Each candidate is validated
  // against BOOK_LEVELS so an invalid value never reaches the UI —
  // the badge just won't render.
  const inheritedCourseLevel =
    contentType === 'course_lesson' && entry?.course
      ? catalog.courses[entry.course]?.level
      : undefined;

  const levelCandidates = [meta.level, entry?.level, inheritedCourseLevel];
  const level = levelCandidates.find(isBookLevel);

  return {
    slug,
    titles: meta.titles,
    subtitles: meta.subtitles,
    descriptions: meta.descriptions,
    category,
    categoryKey,
    coverImage,
    dominantColor: '#1a1a1a',
    chapters,
    languages: meta.languages,
    credits: meta.credits,
    level,
    contentType,
    courseSlug,
    lessonNumber,
  };
}

/**
 * Discover all courses by grouping course_lesson books from the catalog.
 * Returns one DiscoveredCourse per course slug, with lessons sorted by
 * lessonNumber. Lessons that haven't been authored yet are reflected in
 * the gap between `availableLessons` and `totalLessons`.
 */
export function discoverCourses(): DiscoveredCourse[] {
  const catalog = loadCatalog();
  const allBooks = discoverAllBooks();

  const courses: DiscoveredCourse[] = [];

  for (const [courseSlug, courseMeta] of Object.entries(catalog.courses)) {
    const lessons = allBooks
      .filter((b) => b.contentType === 'course_lesson' && b.courseSlug === courseSlug)
      .sort((a, b) => (a.lessonNumber ?? 0) - (b.lessonNumber ?? 0));

    if (lessons.length === 0 && !courseMeta.totalLessons) continue;

    courses.push({
      slug: courseSlug,
      titles: courseMeta.titles || {},
      descriptions: courseMeta.descriptions || {},
      lecturer: courseMeta.lecturer,
      summaryAuthor: courseMeta.summaryAuthor,
      totalLessons: courseMeta.totalLessons ?? lessons.length,
      availableLessons: lessons.length,
      lessons,
      coverImage: lessons[0]?.coverImage || '/covers/placeholder.svg',
    });
  }

  return courses;
}

/**
 * Discover all books in the output folder.
 */
export function discoverAllBooks(): DiscoveredBook[] {
  if (!existsSync(OUTPUT_DIR)) return [];

  const entries = readdirSync(OUTPUT_DIR);
  const books: DiscoveredBook[] = [];

  for (const entry of entries) {
    const bookDir = join(OUTPUT_DIR, entry);
    if (!statSync(bookDir).isDirectory()) continue;

    const book = discoverBook(entry);
    if (book) books.push(book);
  }

  return books;
}