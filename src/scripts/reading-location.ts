/**
 * Shared reading-location helpers used by bookmarks and highlights:
 *  - chapter/book context from #chapter-container
 *  - active language content root
 *  - TOC-based chapter title resolution
 *  - nearest section heading detection
 *  - content-ready waiter for post-navigation scroll
 */

import { resolveLanguage } from '../i18n';

export const SOURCE_LANG = 'he';

export function getLang(): string {
  return resolveLanguage(
    new URLSearchParams(window.location.search).get('lang')
      || localStorage.getItem('yuval_language')
      || 'en'
  );
}

export function getCurrentBook(): string {
  return document.getElementById('chapter-container')?.dataset.book || '';
}

export type ChapterKey = number | string;

export function parseChapterKey(raw: string): ChapterKey {
  const n = parseInt(raw, 10);
  return !Number.isNaN(n) && String(n) === raw ? n : raw;
}

export function getCurrentChapter(): ChapterKey {
  const raw = document.getElementById('chapter-container')?.dataset.chapterId || '';
  return parseChapterKey(raw);
}

export function getContentRoot(): HTMLElement | null {
  const lang = getLang();
  const container = document.getElementById('chapter-container');
  if (!container) return null;
  return (container.querySelector<HTMLElement>(`[data-lang="${lang}"]`) || container) as HTMLElement;
}

export function getChapterTitlesForId(chapterId: ChapterKey): Record<string, string> {
  const tocEl = document.querySelector<HTMLElement>(
    `#toc-sidebar li[data-chapter-id="${chapterId}"] .toc-chapter-title-text`
  );
  const raw = tocEl?.dataset.titles;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function resolveChapterTitleByTitles(
  titles: Record<string, string> | undefined,
  chapterId: ChapterKey,
  sameBook: boolean,
): string {
  const lang = getLang();
  const fromTitles = titles?.[lang] || titles?.[SOURCE_LANG];
  if (fromTitles) return fromTitles;

  if (sameBook) {
    const fromToc = getChapterTitlesForId(chapterId);
    const tocPick = fromToc[lang] || fromToc[SOURCE_LANG];
    if (tocPick) return tocPick;
  }

  return '';
}

export function nearestSectionHeading(el: Element): string | undefined {
  const root = getContentRoot();
  if (!root) return undefined;
  const all = Array.from(root.querySelectorAll<HTMLElement>('p, h2, h3'));
  const idx = all.indexOf(el as HTMLElement);
  if (idx === -1) return undefined;
  for (let i = idx - 1; i >= 0; i--) {
    const tag = all[i].tagName.toLowerCase();
    if (tag === 'h2' || tag === 'h3') {
      const text = all[i].textContent?.trim() || '';
      return text || undefined;
    }
  }
  return undefined;
}

export function waitForContentReady(): Promise<void> {
  return new Promise(res => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => res());
    });
  });
}

export function nearestBmAnchor(el: Element | null): string | undefined {
  let cur: Element | null = el;
  while (cur && cur instanceof HTMLElement) {
    const a = cur.dataset.bmAnchor;
    if (a) return a;
    cur = cur.parentElement;
  }
  return undefined;
}
