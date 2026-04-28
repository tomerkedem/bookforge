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
import type { SectionPreview } from './preview-extractor';

export type { SectionPreview };

export interface CachedSection {
  id: string;
  level: 'h2' | 'h3';
  text: string;
  chars: number;
  /** Pre-extracted preview rendered in the sidebar (code snippet or
   *  first-sentence text). Populated from a `<script
   *  type="application/json" class="chapter-previews-data">` injected
   *  by [chapter].astro at the top of `.chapter-content`. Optional —
   *  if the script is missing, malformed, or this section's index has
   *  no entry, sidebar render falls back to no preview pane (legacy
   *  behavior). */
  preview?: SectionPreview;
}

/** Read previews JSON from inside a chapter container. Works on both
 *  the live `document` and a `DOMParser`-parsed doc — `<script
 *  type="application/json">` is preserved as a regular element by
 *  both, with its body in `.textContent`.
 *
 *  Defensive: any failure (missing tag, malformed JSON, wrong shape)
 *  returns `[]` so the sidebar continues to render without previews
 *  rather than blanking out. Logged once per failure for visibility. */
function extractPreviewsFromContainer(container: Element): SectionPreview[] {
  const scriptEl = container.querySelector('script.chapter-previews-data');
  const text = scriptEl?.textContent;
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? (parsed as SectionPreview[]) : [];
  } catch (err) {
    console.warn('[sidebar-cache] failed to parse chapter previews JSON:', err);
    return [];
  }
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

  /* Previews are emitted in source order alongside headings (one per
     h2/h3, in the same iteration order querySelectorAll uses), so the
     i-th preview matches the i-th heading. If the array is shorter
     than headings (legacy cached HTML pre-feature, missing tag, etc.)
     trailing headings simply get `preview: undefined` and the renderer
     falls back to no preview pane. */
  const previews = extractPreviewsFromContainer(container as Element);

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
      preview: previews[idx],
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