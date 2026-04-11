/**
 * Build-time search index — generates /search-index.json
 * Contains all chapters across all books for client-side full-book search.
 */

import type { APIRoute } from 'astro';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { discoverAllBooks } from '../utils/book-discovery';

/** Strip Markdown syntax → plain text */
function mdToText(md: string): string {
  return md
    .replace(/^---[\s\S]*?---/m, '')          // frontmatter
    .replace(/```[\s\S]*?```/g, '')            // code blocks
    .replace(/`[^`]+`/g, '')                   // inline code
    .replace(/!\[.*?\]\(.*?\)/g, '')           // images
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')    // links → text
    .replace(/#{1,6}\s+/g, '')                 // headings
    .replace(/[*_~>|]/g, '')                   // markdown chars
    .replace(/\s+/g, ' ')                      // collapse whitespace
    .trim();
}

/** Extract a short snippet around the first occurrence of query */
function snippet(text: string, maxLen = 180): string {
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}

export const GET: APIRoute = () => {
  const books = discoverAllBooks();
  const index: {
    book: string;
    bookTitle_he: string;
    bookTitle_en: string;
    chapterId: number;
    title_he: string;
    title_en: string;
    url_he: string;
    url_en: string;
    text_he: string;
    text_en: string;
  }[] = [];

  for (const book of books) {
    for (const chapter of book.chapters) {
      const pad = String(chapter.id).padStart(2, '0');

      const readFile = (lang: string) => {
        const path = resolve(`output/${book.slug}/chapter-${pad}.${lang}.md`);
        if (!existsSync(path)) return '';
        try { return mdToText(readFileSync(path, 'utf-8')); } catch { return ''; }
      };

      const text_he = readFile('he');
      const text_en = readFile('en');

      // Skip if both empty
      if (!text_he && !text_en) continue;

      index.push({
        book:         book.slug,
        bookTitle_he: book.title_he,
        bookTitle_en: book.title_en,
        chapterId:    chapter.id,
        title_he:     chapter.title_he,
        title_en:     chapter.title_en,
        url_he:       `/read/${book.slug}/${chapter.id}?lang=he`,
        url_en:       `/read/${book.slug}/${chapter.id}`,
        text_he:      snippet(text_he, 2000),
        text_en:      snippet(text_en, 2000),
      });
    }
  }

  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json' },
  });
};
