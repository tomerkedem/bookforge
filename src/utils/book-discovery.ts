/**
 * Book Discovery — auto-discovers books and chapters from output/ folder.
 * Drop a new book folder with MD files into output/ and everything works.
 *
 * Priority:
 * 1. content-structure.json (if present) — used for rich metadata
 * 2. MD files scanned directly — titles extracted from # headings,
 *    word count from content, sections from ## headings
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import type { Chapter } from '../types/index';
import { PATHS } from '../config';

const OUTPUT_DIR = PATHS.OUTPUT_DIR;

export interface DiscoveredBook {
  slug: string;
  title_he: string;
  title_en: string;
  description_he: string;
  description_en: string;
  coverImage: string;
  dominantColor: string;
  chapters: Chapter[];
}

interface ContentStructure {
  book: {
    title_he: string;
    title_en: string;
    chapters: Array<{
      id: number;
      title_he: string;
      title_en: string;
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
 * Discover all chapters in a book folder by scanning MD files
 */
function discoverChaptersFromFiles(bookDir: string): Chapter[] {
  const files = readdirSync(bookDir);

  // Find all Hebrew chapter files: chapter-XX.he.md
  const heFiles = files
    .filter(f => /^chapter-\d+\.he\.md$/.test(f))
    .sort();

  const chapters: Chapter[] = [];

  for (const heFile of heFiles) {
    const match = heFile.match(/^chapter-(\d+)\.he\.md$/);
    if (!match) continue;

    const num = parseInt(match[1], 10);
    const hePath = join(bookDir, heFile);
    const enFile = heFile.replace('.he.md', '.en.md');
    const enPath = join(bookDir, enFile);

    const heMeta = extractFromMd(hePath);
    const enMeta = existsSync(enPath) ? extractFromMd(enPath) : null;

    chapters.push({
      id: num,
      title_he: heMeta.title,
      title_en: enMeta?.title || heMeta.title,
      sections: Math.max(heMeta.sections, enMeta?.sections || 0),
      has_images: heMeta.hasImages || (enMeta?.hasImages ?? false),
      word_count: Math.max(heMeta.wordCount, enMeta?.wordCount || 0),
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
      const chId = ch.id !== undefined ? ch.id + 1 : idx + 1;
      const num = String(chId).padStart(2, '0');

      // Always read titles from actual MD files (source of truth)
      const hePath = join(bookDir, `chapter-${num}.he.md`);
      const enPath = join(bookDir, `chapter-${num}.en.md`);
      const heTitle = existsSync(hePath) ? extractFromMd(hePath).title : ch.title_he;
      const enTitle = existsSync(enPath) ? extractFromMd(enPath).title : ch.title_en;

      return {
        id: chId,
        title_he: heTitle,
        title_en: enTitle,
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
 * Infer book-level metadata from content-structure.json or folder name
 */
function loadBookMeta(bookDir: string, slug: string): {
  title_he: string;
  title_en: string;
  description_he: string;
  description_en: string;
} {
  const jsonPath = join(bookDir, 'content-structure.json');
  if (existsSync(jsonPath)) {
    try {
      const data: ContentStructure = JSON.parse(readFileSync(jsonPath, 'utf-8'));
      return {
        title_he: data.book.title_he || slug,
        title_en: data.book.title_en || slug,
        description_he: '',
        description_en: '',
      };
    } catch { /* fall through */ }
  }

  // Fallback: format slug as title
  const formatted = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return {
    title_he: formatted,
    title_en: formatted,
    description_he: '',
    description_en: '',
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

  // Check for cover image — find first existing file
  const coverCandidates = [
    `/covers/${slug}.png`,
    `/covers/${slug}.jpg`,
    '/covers/cover.png',
    '/covers/cover.jpg',
  ];

  const publicDir = PATHS.PUBLIC_DIR;
  const coverImage = coverCandidates.find(c => existsSync(join(publicDir, c))) || coverCandidates[0];

  return {
    slug,
    ...meta,
    coverImage,
    dominantColor: '#1a1a1a',
    chapters,
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
