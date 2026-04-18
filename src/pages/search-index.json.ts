import type { APIRoute } from 'astro';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { discoverAllBooks } from '../utils/book-discovery';
import { SUPPORTED_LANGUAGES, SOURCE_LANGUAGE } from '../utils/language';

/** Strip Markdown → plain text */
function mdToText(md: string): string {
  return md
    .replace(/^---[\s\S]*?---/m, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/[*_~>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function snippet(text: string, maxLen = 180): string {
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}

type LocalizedMap = Record<string, string | undefined>;

function getLocalized(value: LocalizedMap | undefined, lang: string): string {
  if (!value) return '';
  return value[lang] ?? value[SOURCE_LANGUAGE] ?? Object.values(value)[0] ?? '';
}

export const GET: APIRoute = () => {
  const books = discoverAllBooks();

  const languages = SUPPORTED_LANGUAGES.map(l => l.code);

  const index: {
    book: string;
    bookTitles: Record<string, string>;
    chapterId: number;
    chapterTitles: Record<string, string>;
    url: string;
    texts: Record<string, string>;
  }[] = [];

  for (const book of books) {
    for (const chapter of book.chapters) {
      const pad = String(chapter.id).padStart(2, '0');

      const texts: Record<string, string> = {};

      for (const lang of languages) {
        const path = resolve(`output/${book.slug}/chapter-${pad}.${lang}.md`);

        if (!existsSync(path)) continue;

        try {
          const raw = readFileSync(path, 'utf-8');
          const cleaned = mdToText(raw);
          texts[lang] = snippet(cleaned, 2000);
        } catch {
          continue;
        }
      }

      // אם אין טקסט באף שפה – דלג
      if (Object.keys(texts).length === 0) continue;

      const bookTitles: Record<string, string> = {};
      const chapterTitles: Record<string, string> = {};

      for (const lang of languages) {
        bookTitles[lang] = getLocalized(book.titles, lang);
        chapterTitles[lang] = getLocalized(chapter.titles, lang);
      }

      index.push({
        book: book.slug,
        bookTitles,
        chapterId: chapter.id,
        chapterTitles,
        url: `/read/${book.slug}/${chapter.id}`,
        texts,
      });
    }
  }

  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json' },
  });
};