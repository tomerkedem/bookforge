/**
 * Per-chapter section cache + lazy prefetch.
 *
 * Sections under non-active chapters are loaded on demand. Hovering
 * the toggle button kicks off a background fetch (lazy prefetch) so
 * by the time the user clicks, the sections are usually already
 * parsed and the expansion is instant.
 *
 * Why we don't cache live HTMLElement references: non-active chapter
 * data comes from a parsed-but-detached document we throw away. We
 * keep only the values needed to render the section list (id, level,
 * text, char count for time distribution, and the chapter-level word
 * count).
 */

import { chapterContentUrl, getCurrentChapterId } from './sidebar-helpers';

export interface CachedSection {
  id: string;
  level: 'h2' | 'h3';
  text: string;
  chars: number;
}

export interface CachedChapter {
  headings: CachedSection[];
  chapterWords: number;
}

const sectionsCache = new Map<string, CachedChapter>();
/** Tracks chapters whose prefetch is currently in flight, so two
 *  rapid hover/click events don't fire two duplicate fetches. */
const sectionsPending = new Map<string, Promise<CachedChapter>>();

/** Wipe cache entry for a chapter. Used when navigating to a chapter
 *  that may have updated content — the active chapter's DOM is
 *  always re-extracted from scratch rather than served from cache. */
export function invalidateChapterCache(chapterId: string | number): void {
  sectionsCache.delete(String(chapterId));
}

/**
 * Extract section data from a Document object. Works on both the
 * live page document and a parsed fetch response, so the same code
 * path serves the active chapter and prefetched chapters.
 */
export function extractSectionsFromDoc(doc: Document): CachedChapter {
  const container =
    doc.querySelector('.chapter-content.visible') ||
    doc.querySelector('.chapter-content') ||
    doc.getElementById('chapter-container');

  if (!container) return { headings: [], chapterWords: 0 };

  const headings = Array.from(container.querySelectorAll('h2, h3')) as HTMLElement[];
  const result: CachedSection[] = headings.map((heading, idx) => {
    const stopAt = headings[idx + 1] || null;
    let chars = 0;
    let node: Node | null = heading.nextSibling;
    while (node && node !== stopAt) {
      if (node.nodeType === Node.TEXT_NODE) {
        chars += (node.textContent || '').length;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        chars += (el.innerText || el.textContent || '').length;
      }
      node = node.nextSibling;
    }
    const id = heading.id || `section-${idx}`;
    return {
      id,
      level: (heading.tagName.toLowerCase() as 'h2' | 'h3'),
      text: (heading.textContent || '').trim() || `Section ${idx + 1}`,
      chars: Math.max(1, chars),
    };
  });

  const containerEl = container as HTMLElement;
  const chapterWords = parseInt(containerEl.dataset?.wordCount || '0', 10) || 0;
  return { headings: result, chapterWords };
}

/**
 * Get section data for a chapter, fetching + parsing if necessary.
 *
 * - Cached result: returned immediately.
 * - Active chapter: read from live DOM, no fetch.
 * - Other chapter, no inflight request: kick off a fetch, cache on
 *   resolve, return the promise.
 * - Other chapter with inflight request: return the existing promise
 *   so concurrent callers de-dupe.
 *
 * On fetch failure, returns an empty result and clears the pending
 * marker so a future attempt can retry.
 */
export function loadChapterSections(chapterId: string | number): Promise<CachedChapter> {
  const id = String(chapterId);

  if (sectionsCache.has(id)) {
    return Promise.resolve(sectionsCache.get(id)!);
  }

  const currentId = String(getCurrentChapterId() || '');
  if (id === currentId) {
    const data = extractSectionsFromDoc(document);
    sectionsCache.set(id, data);
    return Promise.resolve(data);
  }

  if (sectionsPending.has(id)) {
    return sectionsPending.get(id)!;
  }

  const url = chapterContentUrl(id);
  if (!url) return Promise.resolve({ headings: [], chapterWords: 0 });

  const promise: Promise<CachedChapter> = fetch(url, { cache: 'force-cache' })
    .then(res => {
      if (!res.ok) throw new Error('fetch failed');
      return res.text();
    })
    .then(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const data = extractSectionsFromDoc(doc);
      sectionsCache.set(id, data);
      sectionsPending.delete(id);
      return data;
    })
    .catch(err => {
      console.warn(`[sections-prefetch] failed for chapter ${id}:`, err);
      sectionsPending.delete(id);
      return { headings: [], chapterWords: 0 };
    });

  sectionsPending.set(id, promise);
  return promise;
}

/** Quick check used by render code to decide whether to show a
 *  "loading…" placeholder. */
export function isCached(chapterId: string | number): boolean {
  return sectionsCache.has(String(chapterId));
}