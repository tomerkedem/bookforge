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
import {
  syncProgressOnLoad,
  syncStripCompletion,
} from './sidebar-progress';

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

  /* Smooth chapter swap: fade container + header + top strip together,
     wait for the fade-out to actually complete, then swap DOM, then
     fade-in. Previous version faded only the container at 100 ms and
     swapped the header/strip instantly — that was the visible flicker
     the user complained about. */
  const FADE_OUT_MS = 200;
  const FADE_IN_MS = 260;
  const SWAP_TARGETS = [container, header, topStrip].filter(
    (el): el is HTMLElement => !!el,
  );

  const reducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fadeOut(): void {
    if (reducedMotion) return;
    for (const el of SWAP_TARGETS) {
      el.style.willChange = 'opacity, transform';
      el.style.transition = `opacity ${FADE_OUT_MS}ms var(--ease-standard), transform ${FADE_OUT_MS}ms var(--ease-standard)`;
      el.style.opacity = '0';
      el.style.transform = 'translateY(-3px)';
    }
  }

  function fadeIn(): void {
    if (reducedMotion) {
      for (const el of SWAP_TARGETS) {
        el.style.opacity = '1';
        el.style.transform = '';
      }
      return;
    }
    /* Reset to "below + transparent" without animating, then animate
       back to default. This produces a gentle slide-up feeling for
       the new content without a visible jump from the old position. */
    for (const el of SWAP_TARGETS) {
      el.style.transition = 'none';
      el.style.transform = 'translateY(3px)';
      el.style.opacity = '0';
    }
    /* Force a reflow so the no-transition state actually flushes
       before we set the target state. */
    void container!.offsetHeight;
    requestAnimationFrame(() => {
      for (const el of SWAP_TARGETS) {
        el.style.transition = `opacity ${FADE_IN_MS}ms var(--ease-standard), transform ${FADE_IN_MS}ms var(--ease-standard)`;
        el.style.opacity = '1';
        el.style.transform = '';
      }
      /* Drop the inline styles after the animation finishes so they
         don't leak into later interactions (e.g. focus mode toggles). */
      window.setTimeout(() => {
        for (const el of SWAP_TARGETS) {
          el.style.transition = '';
          el.style.willChange = '';
        }
      }, FADE_IN_MS + 20);
    });
  }

  fadeOut();

  try {
    /* Cache-bust aggressively: unique query defeats Cache API match,
       and `cache: 'reload'` bypasses the HTTP cache. Together they
       guarantee fresh content on every swap, which matters while
       chapters are actively edited. */
    const bust = `_swbust=${Date.now()}`;
    const fetchUrl = url + (url.includes('?') ? '&' : '?') + bust;

    /* Run fetch + fade-out in parallel. The DOM swap waits for both
       so the user always sees the fade-out finish before the new
       content paints — avoids the "instant header swap" flicker. */
    const [response] = await Promise.all([
      fetch(fetchUrl, { cache: 'reload' }),
      reducedMotion
        ? Promise.resolve()
        : new Promise<void>(resolve => setTimeout(resolve, FADE_OUT_MS)),
    ]);
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

    /* Refresh progress UI for the newly-loaded chapter — the ring
       starts at 0% otherwise because no scroll has fired yet. */
    syncProgressOnLoad();
    syncStripCompletion();

    try {
      const { applyTranslations } = await import('../../i18n');
      applyTranslations(container, getCurrentLang());
    } catch (e) {
      console.warn('[chapter-swap] applyTranslations failed', e);
    }

    window.dispatchEvent(new CustomEvent('chapter-content-swapped'));
    fadeIn();
  } catch (error) {
    console.error('Error loading chapter:', error);
    /* Restore visibility on the fade-out targets before falling back
       so the user doesn't see an empty / transparent page during the
       hard navigation. */
    for (const el of SWAP_TARGETS) {
      el.style.transition = '';
      el.style.opacity = '1';
      el.style.transform = '';
      el.style.willChange = '';
    }
    window.location.href = url;
  }
}