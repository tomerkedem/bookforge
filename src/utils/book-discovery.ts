/**
 * Book Discovery - auto-discovers books and chapters from output/ folder.
 *
 * Priority:
 * 1. content-structure.json if present
 * 2. MD files scanned directly
 *
 * Dynamic language support is derived from SUPPORTED_LANGUAGES.
 * No flat legacy fields are used here.
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import type { Chapter } from '../types/index';
import { PATHS } from '../config';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, SOURCE_LANGUAGE } from './language';

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

export interface DiscoveredBook {
  slug: string;
  titles: Record<string, string>;
  subtitles: Record<string, string>;
  descriptions: Record<string, string>;
  category: Record<string, string>;
  coverImage: string;
  dominantColor: string;
  chapters: Chapter[];
  languages: string[];
  credits?: BookCredits;
}

interface ContentStructure {
  book: {
    titles?: Record<string, string>;
    subtitles?: Record<string, string>;
    descriptions?: Record<string, string>;
    languages?: string[];
    credits?: BookCredits;
    category?: string | Record<string, string>;
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

  return chapters.sort((a, b) => a.id - b.id);
}

/**
 * Load chapters from content-structure.json if available.
 * Titles are always refreshed from actual MD files when possible.
 */
function loadFromContentStructure(bookDir: string): Chapter[] | null {
  const jsonPath = join(bookDir, 'content-structure.json');
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
        id: typeof chId === 'string' ? 0 : chId,
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
} {
  const formatted = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const jsonPath = join(bookDir, 'content-structure.json');
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

      return {
        titles,
        subtitles,
        descriptions,
        category,
        languages: languages.length > 0 ? languages : [SOURCE_LANGUAGE],
        credits: book.credits,
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
  };
}

/**
 * Discover a single book by slug.
 */
export function discoverBook(slug: string): DiscoveredBook | null {
  const bookDir = join(OUTPUT_DIR, slug);
  if (!existsSync(bookDir) || !statSync(bookDir).isDirectory()) return null;

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

  return {
    slug,
    titles: meta.titles,
    subtitles: meta.subtitles,
    descriptions: meta.descriptions,
    category: meta.category,
    coverImage,
    dominantColor: '#1a1a1a',
    chapters,
    languages: meta.languages,
    credits: meta.credits,
  };
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