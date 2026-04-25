/**
 * Event wiring for the sidebar.
 *
 * Single delegated listener on the sidebar root handles three
 * actions, distinguished by data-action attributes on inner
 * elements:
 *   - toggle-sections    → expand/collapse a chapter's section list
 *   - reset-completion   → clear a chapter's completion state
 *   - (chapter row click) → soft-navigate to that chapter
 *
 * A separate pointerover listener kicks off lazy prefetch of section
 * data when the user hovers a toggle button, so by the time they
 * click the data is already cached.
 *
 * Window-level scroll listener tracks reading progress in the
 * active chapter and triggers auto-completion at 95%.
 */

import { getCurrentChapterId, getBookSlug } from './sidebar-helpers';
import {
  unmarkChapterComplete,
  markChapterComplete,
  getCompletedChapters,
} from './sidebar-storage';
import { computeTimeRemaining, formatTimeRemaining } from './sidebar-time';
import { loadChapterSections } from './sidebar-cache';
import {
  syncChapterStates,
  renderChapterSections,
} from './sidebar-render';
import { loadChapterContent } from './sidebar-navigation';
import { AUTO_COMPLETE_THRESHOLD } from './sidebar-constants';

/** Wire all sidebar click + hover handlers. Idempotent — guards
 *  against double-init via a data-nav-init flag on the sidebar. */
export function initSidebarNavigation(): void {
  const sidebar = document.getElementById('unified-sidebar');
  if (!sidebar || sidebar.dataset.navInit === 'true') return;
  sidebar.dataset.navInit = 'true';

  /* Capture phase + stopImmediatePropagation prevents Astro's
     ClientRouter (BaseLayout) from racing us. Both handlers would
     otherwise fetch + swap the same URL, leaving the DOM in a
     mixed state where code-block chrome only renders after a hard
     refresh. */
  sidebar.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    /* Toggle sections button. */
    const toggleBtn = target.closest<HTMLElement>('[data-action="toggle-sections"]');
    if (toggleBtn) {
      e.preventDefault();
      e.stopImmediatePropagation();
      const chId = toggleBtn.dataset.chapterId || '';
      const li = document.querySelector<HTMLElement>(`.usb-chapter[data-chapter-id="${chId}"]`);
      if (!li) return;

      const isExpanded = li.dataset.expanded === 'true';
      if (isExpanded) {
        li.dataset.expanded = 'false';
        toggleBtn.setAttribute('aria-expanded', 'false');
      } else {
        li.dataset.expanded = 'true';
        toggleBtn.setAttribute('aria-expanded', 'true');
        void renderChapterSections(chId);
      }
      return;
    }

    /* Reset button: clear completion for this chapter only. */
    const resetBtn = target.closest<HTMLElement>('[data-action="reset-completion"]');
    if (resetBtn) {
      e.preventDefault();
      e.stopImmediatePropagation();
      const chId = resetBtn.dataset.chapterId || '';
      const book = getBookSlug();
      if (chId && book) {
        unmarkChapterComplete(book, chId);
        syncChapterStates();
      }
      return;
    }

    /* Chapter row navigation. */
    const link = target.closest<HTMLAnchorElement>('a.usb-chapter-link');
    if (!link) return;

    e.preventDefault();
    e.stopImmediatePropagation();
    const url = link.getAttribute('href')?.split('?')[0] || '';
    await loadChapterContent(url);
  }, true);

  /* Lazy prefetch on hover. pointerover bubbles, so a single
     listener handles all toggle buttons via delegation. By the time
     the user actually clicks, the section data is usually already
     in the cache and expansion is instant. */
  sidebar.addEventListener('pointerover', (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const toggleBtn = target.closest<HTMLElement>('[data-action="toggle-sections"]');
    if (!toggleBtn) return;
    const chId = toggleBtn.dataset.chapterId || '';
    if (!chId) return;
    /* Fire and forget. Errors are swallowed inside loadChapterSections. */
    void loadChapterSections(chId);
  }, { passive: true });
}

/**
 * Window-level scroll listener for the active chapter.
 *
 * On every scroll tick (debounced ~120ms):
 *   1. Compute the active chapter's read percentage from
 *      window.scrollY relative to #chapter-container.
 *   2. Persist it in localStorage in the format expected by
 *      ReadingProgressManager (other widgets read from this).
 *   3. Auto-complete the chapter if pct ≥ AUTO_COMPLETE_THRESHOLD.
 *   4. Refresh the "X minutes remaining" header text — sensitive to
 *      per-chapter pct, so updates on every tick.
 */
export function initScrollListener(): void {
  let scrollTimeout: number | undefined;
  let lastWrittenPct = -1;

  window.addEventListener('scroll', () => {
    if (scrollTimeout !== undefined) clearTimeout(scrollTimeout);
    scrollTimeout = window.setTimeout(() => {
      const container = document.getElementById('chapter-container');
      if (!container) return;
      const book = container.dataset.book || getBookSlug();
      const chapterId = container.dataset.chapterId || getCurrentChapterId() || '';
      if (!book || !chapterId) return;

      const containerTop = container.offsetTop;
      const containerHeight = container.offsetHeight;
      const scrollable = containerHeight - window.innerHeight;
      let pct: number;
      if (scrollable <= 0) {
        pct = 100;
      } else {
        const scrolledInto = window.scrollY - containerTop;
        pct = scrolledInto <= 0
          ? 0
          : Math.min(100, Math.round((scrolledInto / scrollable) * 100));
      }

      /* Persist scroll progress in ReadingProgressManager-compatible
         shape so any consumer reading reading_progress_* keys stays
         working. */
      if (Math.abs(pct - lastWrittenPct) >= 1) {
        const key = `reading_progress_${book}_ch${chapterId}`;
        try {
          const payload = {
            bookId: book,
            chapterId,
            scrollPosition: window.scrollY,
            lastUpdated: Date.now(),
            percentage: pct,
          };
          localStorage.setItem(key, JSON.stringify(payload));
          lastWrittenPct = pct;
        } catch {}
      }

      /* Auto-completion. */
      if (pct >= AUTO_COMPLETE_THRESHOLD) {
        const before = getCompletedChapters(book);
        if (!before.includes(String(chapterId))) {
          markChapterComplete(book, chapterId);
          syncChapterStates();
        }
      }

      /* Time-remaining header — cheap (one DOM write), worth
         refreshing on every tick because it's sensitive to active
         chapter pct, not just whole-chapter completion. */
      const timeEl = document.getElementById('usb-time-remaining');
      if (timeEl) timeEl.textContent = formatTimeRemaining(computeTimeRemaining());
    }, 120);
  }, { passive: true });
}