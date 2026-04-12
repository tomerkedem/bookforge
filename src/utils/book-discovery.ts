/**
 * Book Discovery — auto-discovers books and chapters from output/ folder.
 * Drop a new book folder with MD files into output/ and everything works.
 *
 * Priority:
 * 1. content-structure.json (if present) — used for rich metadata
 * 2. MD files scanned directly — titles extracted from # headings,
 *    word count from content, sections from ## headings
 *
 * Supports dynamic languages - reads from SUPPORTED_LANGUAGES config.
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import type { Chapter } from '../types/index';
import { PATHS } from '../config';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './language';

const OUTPUT_DIR = PATHS.OUTPUT_DIR;
const LANGUAGE_CODES = SUPPORTED_LANGUAGES.map(l => l.code);

export interface DiscoveredBook {
  slug: string;
  titles: Record<string, string>;       // { he: '...', en: '...', fr: '...' }
  subtitles: Record<string, string>;
  descriptions: Record<string, string>;
  category: string;
  coverImage: string;
  dominantColor: string;
  chapters: Chapter[];
  languages: string[];                   // Available language codes
  // Legacy fields for backward compatibility
  title_he?: string;
  title_en?: string;
  title_es?: string;
  subtitle_he?: string;
  subtitle_en?: string;
  subtitle_es?: string;
  description_he?: string;
  description_en?: string;
  description_es?: string;
}

interface ContentStructure {
  book: {
    // New dynamic structure
    titles?: Record<string, string>;
    subtitles?: Record<string, string>;
    descriptions?: Record<string, string>;
    languages?: string[];
    // Legacy fields
    title_he?: string;
    title_en?: string;
    title_es?: string;
    subtitle_he?: string;
    subtitle_en?: string;
    subtitle_es?: string;
    description_he?: string;
    description_en?: string;
    description_es?: string;
    category?: string;
    chapters: Array<{
      id: number | string;
      titles?: Record<string, string>;
      title_he?: string;
      title_en?: string;
      title_es?: string;
      sections: number;
      has_images: boolean;
      word_count: number;
      topics: string[];
    }>;
    [key: string]: any;
  };
}

/**
 * Extract metadata from a single MD file
 */
function extractFromMd(filepath: string): {
  title: string;
  wordCount: number;
  sections: number;
  hasImages: boolean;
} {
  const content = readFileSync(filepath, 'utf-8');
  const lines = content.split('\n');

  // Title = first # heading
  const titleLine = lines.find(l => /^#\s+/.test(l));
  const title = titleLine ? titleLine.replace(/^#\s+/, '').trim() : '';

  // Word count = split on whitespace
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  // Sections = number of ## headings
  const sections = lines.filter(l => /^##\s+/.test(l)).length;

  // Images = check for markdown image syntax or asset references
  const hasImages = /!\[.*?\]\(.*?\)/.test(content) || /assets\//.test(content);

  return { title, wordCount, sections, hasImages };
}

/**
 * Discover all chapters in a book folder by scanning MD files.
 * Dynamically discovers all available languages.
 */
function discoverChaptersFromFiles(bookDir: string): Chapter[] {
  const files = readdirSync(bookDir);
  
  // Find source language files (Hebrew by default)
  const sourceFiles = files
    .filter(f => /^chapter-\d+\.he\.md$/.test(f))
    .sort();

  const chapters: Chapter[] = [];

  for (const sourceFile of sourceFiles) {
    const match = sourceFile.match(/^chapter-(\d+)\.he\.md$/);
    if (!match) continue;

    const num = parseInt(match[1], 10);
    const sourcePath = join(bookDir, sourceFile);
    const sourceMeta = extractFromMd(sourcePath);
    
    // Build titles for all available languages
    const titles: Record<string, string> = { he: sourceMeta.title };
    
    for (const lang of LANGUAGE_CODES) {
      if (lang === 'he') continue;
      const langFile = sourceFile.replace('.he.md', `.${lang}.md`);
      const langPath = join(bookDir, langFile);
      if (existsSync(langPath)) {
        titles[lang] = extractFromMd(langPath).title;
      }
    }

    chapters.push({
      id: num,
      titles,
      // Legacy fields
      title_he: titles['he'] || sourceMeta.title,
      title_en: titles['en'] || sourceMeta.title,
      title_es: titles['es'] || titles['en'] || sourceMeta.title,
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
 * Titles are ALWAYS overridden from actual MD file H1 headings
 * to prevent stale/mismatched titles in the JSON.
 */
function loadFromContentStructure(bookDir: string): Chapter[] | null {
  const jsonPath = join(bookDir, 'content-structure.json');
  if (!existsSync(jsonPath)) return null;

  try {
    const raw = readFileSync(jsonPath, 'utf-8');
    const data: ContentStructure = JSON.parse(raw);

    if (!data.book?.chapters?.length) return null;

    return data.book.chapters.map((ch, idx) => {
      // Handle both string ids ('intro') and numeric ids
      const chId = typeof ch.id === 'string' ? ch.id : (ch.id !== undefined ? ch.id : idx + 1);
      const fileSlug = typeof chId === 'string' ? chId : `chapter-${String(chId).padStart(2, '0')}`;

      // Build titles from all available languages
      const titles: Record<string, string> = ch.titles || {};
      
      // Read titles from actual MD files (source of truth) for each language
      for (const lang of LANGUAGE_CODES) {
        const fileName = `${fileSlug}.${lang}.md`;
        const filePath = join(bookDir, fileName);
        if (existsSync(filePath)) {
          titles[lang] = extractFromMd(filePath).title;
        } else if (!titles[lang]) {
          // Fallback to legacy fields or JSON titles
          titles[lang] = (ch as any)[`title_${lang}`] || titles['he'] || titles['en'] || '';
        }
      }

      return {
        id: typeof chId === 'string' ? 0 : chId,  // 0 for intro
        titles,
        // Legacy fields
        title_he: titles['he'] || '',
        title_en: titles['en'] || titles['he'] || '',
        title_es: titles['es'] || titles['en'] || titles['he'] || '',
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
 * Infer book-level metadata from content-structure.json or folder name.
 * Supports both new dynamic structure (titles: {}) and legacy (title_he, title_en).
 */
function loadBookMeta(bookDir: string, slug: string): {
  titles: Record<string, string>;
  subtitles: Record<string, string>;
  descriptions: Record<string, string>;
  category: string;
  languages: string[];
} {
  const formatted = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  
  const jsonPath = join(bookDir, 'content-structure.json');
  if (existsSync(jsonPath)) {
    try {
      const data: ContentStructure = JSON.parse(readFileSync(jsonPath, 'utf-8'));
      const book = data.book;
      
      // Use new dynamic structure if available, otherwise build from legacy fields
      const titles: Record<string, string> = book.titles || {};
      const subtitles: Record<string, string> = book.subtitles || {};
      const descriptions: Record<string, string> = book.descriptions || {};
      
      // Merge legacy fields
      for (const lang of LANGUAGE_CODES) {
        if (!titles[lang] && (book as any)[`title_${lang}`]) {
          titles[lang] = (book as any)[`title_${lang}`];
        }
        if (!subtitles[lang] && (book as any)[`subtitle_${lang}`]) {
          subtitles[lang] = (book as any)[`subtitle_${lang}`];
        }
        if (!descriptions[lang] && (book as any)[`description_${lang}`]) {
          descriptions[lang] = (book as any)[`description_${lang}`];
        }
      }
      
      // Ensure at least default language has a value
      if (!titles[DEFAULT_LANGUAGE] && !titles['he']) {
        titles[DEFAULT_LANGUAGE] = formatted;
      }
      
      // Detect available languages from existing files
      const availableLanguages = LANGUAGE_CODES.filter(lang => {
        const hasFile = existsSync(join(bookDir, `chapter-01.${lang}.md`)) ||
                       existsSync(join(bookDir, `intro.${lang}.md`));
        return hasFile || titles[lang];
      });
      
      return {
        titles,
        subtitles,
        descriptions,
        category: book.category || 'General',
        languages: book.languages || availableLanguages,
      };
    } catch { /* fall through */ }
  }

  // Fallback: format slug as title
  return {
    titles: { en: formatted, he: formatted },
    subtitles: {},
    descriptions: {},
    category: 'General',
    languages: ['he'],
  };
}

/**
 * Discover a single book by slug
 */
export function discoverBook(slug: string): DiscoveredBook | null {
  const bookDir = join(OUTPUT_DIR, slug);
  if (!existsSync(bookDir) || !statSync(bookDir).isDirectory()) return null;

  const meta = loadBookMeta(bookDir, slug);

  // Try content-structure.json first, then scan MD files
  const chapters = loadFromContentStructure(bookDir) || discoverChaptersFromFiles(bookDir);

  if (chapters.length === 0) return null;

  // Check for cover image — priority order:
  // 1. Book's own assets folder (from pipeline): /{slug}/assets/cover.png
  // 2. Dedicated covers folder: /covers/{slug}.png
  // 3. NO fallback to generic cover.png (prevents showing wrong book's cover)
  const coverCandidates = [
    `/${slug}/assets/cover.png`,    // Pipeline-generated cover
    `/${slug}/assets/cover.jpg`,
    `/covers/${slug}.png`,          // Manually added cover
    `/covers/${slug}.jpg`,
  ];

  const publicDir = PATHS.PUBLIC_DIR;
  // Find first existing cover, or use a placeholder (not another book's cover!)
  const existingCover = coverCandidates.find(c => existsSync(join(publicDir, c.slice(1))));
  const coverImage = existingCover || `/covers/placeholder.svg`;

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
    // Legacy fields for backward compatibility
    title_he: meta.titles['he'] || meta.titles['en'] || '',
    title_en: meta.titles['en'] || meta.titles['he'] || '',
    title_es: meta.titles['es'] || meta.titles['en'] || '',
    subtitle_he: meta.subtitles['he'] || '',
    subtitle_en: meta.subtitles['en'] || meta.subtitles['he'] || '',
    subtitle_es: meta.subtitles['es'] || meta.subtitles['en'] || '',
    description_he: meta.descriptions['he'] || '',
    description_en: meta.descriptions['en'] || '',
    description_es: meta.descriptions['es'] || meta.descriptions['en'] || '',
  };
}

/**
 * Discover ALL books in the output/ folder
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
