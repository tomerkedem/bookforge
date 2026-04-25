/**
 * Chapter navigation logic.
 *
 * The sidebar implements its own soft-swap navigation instead of
 * relying on Astro's view transitions. Reasons:
 *   - We need exact control over when section list re-renders happen
 *     relative to chapter content swaps.
 *   - We need to bypass any service-worker cache for chapters under
 *     active editing (the cache-bust query string handles this).
 *   - Astro's ClientRouter can race our handlers; capture-phase +
 *     stopImmediatePropagation in the click delegate prevents that.
 *
 * This module imports from sidebar-render directly. The reverse
 * direction (render → nav) goes through sidebar-dispatcher to avoid
 * an import cycle.
 */

import { getCurrentLang } from './sidebar-helpers';
import { KNOWN_UI_LANGS } from './sidebar-constants';
import {
  updateActiveChapterRow,
  ensureSectionsContainer,
  buildSectionList,
  syncChapterStates,
} from './sidebar-render';

/**
 * Toggle visibility of language-tagged elements. Only acts on
 * elements whose data-lang value is a known UI language; skips
 * code-block dialect tags ("bash", "python", etc.) so they don't
 * get hidden every time the user switches reading language.
 */
export function applyLanguageVisibility(lang: string): void {
  document.querySelectorAll<HTMLElement>('[data-lang]').forEach(el => {
    const elLang = el.dataset.lang;
    if (!elLang || !KNOWN_UI_LANGS.has(elLang)) return;
    if (elLang === lang) {
      el.classList.remove('hidden');
      el.classList.add('visible');
    } else {
      el.classList.add('hidden');
      el.classList.remove('visible');
    }
  });
}

/**
 * Fetch a chapter and swap #chapter-container in place. Avoids full
 * page reloads while preserving sidebar scroll position and avoiding
 * a flash of empty content.
 *
 * Falls back to a hard navigation if the fetched HTML is missing
 * #chapter-container — better a full reload than a half-swapped UI.
 */
export async function loadChapterContent(url: string): Promise<void> {
  const container = document.getElementById('chapter-container');
  const header = document.getElementById('chapter-header');
  const topStrip = document.getElementById('chapter-top-strip');

  if (!container) {
    window.location.href = url;
    return;
  }

  container.style.transition = 'opacity 100ms var(--ease-standard)';
  container.style.opacity = '0';

  try {
    /* Cache-bust aggressively: unique query defeats Cache API match,
       and `cache: 'reload'` bypasses the HTTP cache. Together they
       guarantee fresh content on every swap, which matters while
       chapters are actively edited. */
    const bust = `_swbust=${Date.now()}`;
    const fetchUrl = url + (url.includes('?') ? '&' : '?') + bust;
    const response = await fetch(fetchUrl, { cache: 'reload' });
    if (!response.ok) throw new Error('Failed to fetch chapter');

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const newContainer = doc.getElementById('chapter-container');
    const newHeader = doc.getElementById('chapter-header');
    const newTopStrip = doc.getElementById('chapter-top-strip');

    if (!newContainer) {
      console.warn('[chapter-swap] fetched page missing #chapter-container; falling back to full navigation');
      window.location.href = url;
      return;
    }

    window.scrollTo({ top: 0, behavior: 'instant' });

    container.innerHTML = newContainer.innerHTML;
    container.dataset.chapterId = newContainer.dataset.chapterId || '';
    container.dataset.book = newContainer.dataset.book || '';

    if (newHeader && header) header.innerHTML = newHeader.innerHTML;
    if (newTopStrip && topStrip) topStrip.innerHTML = newTopStrip.innerHTML;

    applyLanguageVisibility(getCurrentLang());
    history.pushState({}, '', url);

    /* Re-render sidebar state for the new active chapter. */
    updateActiveChapterRow();
    ensureSectionsContainer();
    buildSectionList();
    syncChapterStates();

    try {
      const { applyTranslations } = await import('../../i18n');
      applyTranslations(container, getCurrentLang());
    } catch (e) {
      console.warn('[chapter-swap] applyTranslations failed', e);
    }

    window.dispatchEvent(new CustomEvent('chapter-content-swapped'));
    container.style.opacity = '1';
  } catch (error) {
    console.error('Error loading chapter:', error);
    container.style.opacity = '1';
    window.location.href = url;
  }
}