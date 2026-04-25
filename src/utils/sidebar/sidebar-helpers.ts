/**
 * Generic helper functions used by other sidebar modules.
 *
 * No persistence, no rendering — just lookups and lightweight
 * transformations. Most are pure or near-pure (only depend on
 * window.location and a few well-known DOM ids).
 */

import { WPM_BY_LANG, DEFAULT_WPM } from './sidebar-constants';

/** The language the user has selected, or 'he' as default. */
export function getCurrentLang(): string {
  return localStorage.getItem('yuval_language') || 'he';
}

/** Words-per-minute reading speed for the current UI language. */
export function getWPM(): number {
  return WPM_BY_LANG[getCurrentLang()] ?? DEFAULT_WPM;
}

/**
 * Pull the chapter id out of the current URL path. Returns null on
 * routes that don't follow the /read/<book>/<chapter> pattern.
 */
export function getCurrentChapterId(): string | null {
  const match = window.location.pathname.match(/\/read\/[^/]+\/([^/?#]+)/);
  return match ? match[1] : null;
}

/**
 * Source language used as a fallback when a chapter title isn't
 * available in the user's currently-selected UI language. Hebrew is
 * the source language for this codebase (books are authored in he,
 * translated to en/es).
 */
export function getSourceLanguage(): string {
  return 'he';
}

/**
 * Read a chapter title from a [data-titles] attribute that holds a
 * JSON map of language codes to title strings. Falls back to source
 * language, then to empty string.
 */
export function getTitleFromDataset(el: HTMLElement, lang: string): string {
  const raw = el.dataset.titles || '{}';
  try {
    const titles = JSON.parse(raw);
    return titles?.[lang] || titles?.[getSourceLanguage()] || '';
  } catch {
    return '';
  }
}

/**
 * Book slug for the currently-rendered sidebar. The Astro template
 * stamps it onto the sidebar container so we can read it from any
 * runtime code without re-deriving it from the URL.
 */
export function getBookSlug(): string {
  const sidebar = document.getElementById('unified-sidebar');
  return sidebar?.dataset.bookSlug || '';
}

/** Alias of getBookSlug. Kept because some call sites read more
 *  naturally with this name. */
export function buildBookSlug(): string {
  return getBookSlug();
}

/**
 * The visible chapter content div. Multilingual layouts may have
 * several .chapter-content elements (one per language) with only one
 * marked .visible at a time; we prefer the visible one but fall back
 * to the first match so we don't crash mid-language-switch.
 */
export function getVisibleContentDiv(): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>('.chapter-content.visible') ||
    document.querySelector<HTMLElement>('.chapter-content')
  );
}

/**
 * URL of a chapter's reading page. Used both for direct navigation
 * and as the cache key for prefetched section data.
 */
export function chapterContentUrl(chapterId: string | number): string | null {
  const slug = getBookSlug();
  if (!slug || !chapterId) return null;
  return `/read/${slug}/${chapterId}`;
}