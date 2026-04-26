/**
 * Progress UI synchronization.
 *
 * This module owns the visual state of three progress indicators in
 * the chapter reading screen:
 *
 *   1. Per-chapter progress fills in the right-hand TOC sidebar
 *      (the thin lines under each chapter card showing how far the
 *      reader got).
 *
 *   2. The position indicator in the chapter top strip — a percentage
 *      text (.progress-label) plus a horizontal progress bar
 *      (.strip-progress-bar-fill) at the bottom of the strip row.
 *      Together they show the reader's CURRENT POSITION in the
 *      active chapter — always a percentage, never a checkmark, so a
 *      user scrolling back through a finished chapter still sees
 *      where they are.
 *
 *   3. The "הקריאה הושלמה" inline pill in the top strip
 *      (.strip-completion) that reveals itself when the active
 *      chapter is in the completed list.
 *
 * Completion semantics live separately:
 *   - The TOC sidebar carries the green check + completed class.
 *   - The strip-completion pill mirrors that for the active chapter.
 *   - The position indicator NEVER reflects completion — it only
 *     reflects scroll position. (This is intentional; users
 *     specifically asked for the indicator to keep showing their
 *     location even after the chapter was marked complete.)
 *
 * These functions were originally inline in ChapterSidebars.astro;
 * they were lost when we split that file into modular pieces and
 * have been restored here in the dedicated progress module.
 */

import { getCurrentChapterId, getBookSlug } from './sidebar-helpers';
import { getCompletedChapters, getChapterScrollPercent } from './sidebar-storage';

/**
 * Repaint the position indicator in the chapter top strip.
 *
 * Updates two coordinated DOM elements:
 *   1. `.progress-label` — the percentage text in the meta strip.
 *   2. `.strip-progress-bar-fill` — the horizontal bar that runs along
 *      the bottom of the strip-row, growing with scroll position.
 *
 * Always shows a percentage and a partially-filled bar. Never
 * switches to a checkmark or to a "minutes left" readout — those
 * affordances confused users who wanted a permanent location
 * indicator.
 */
export function updateProgressBadges(pct: number): void {
  const safePct = Math.max(0, Math.min(100, Math.round(pct)));

  document.querySelectorAll<HTMLElement>('[id^="progress-badge-"]').forEach(el => {
    const label = el.querySelector<HTMLElement>('.progress-label');
    if (label) {
      label.textContent = `${safePct}%`;
    }

    /* Never tag the badge as complete — semantic completion is shown
       by the .strip-completion pill, not the position indicator. */
    el.classList.remove('is-complete');
    el.setAttribute('aria-valuenow', String(safePct));
  });

  /* Update the horizontal progress bar(s) at the bottom of each
     strip-row. There's one bar per language but only the visible
     row's bar is on screen at any moment. */
  document.querySelectorAll<HTMLElement>('[id^="strip-progress-bar-"]').forEach(el => {
    const fill = el.querySelector<HTMLElement>('.strip-progress-bar-fill');
    if (fill) {
      fill.style.width = `${safePct}%`;
    }
  });
}

/**
 * Reveal/hide the inline "הקריאה הושלמה" pill in the chapter top
 * strip based on whether the *current* chapter is in the completed
 * list. Toggled per-language because there's one pill per language
 * row (one always visible, others .hidden).
 *
 * Called whenever completion state can change: on page load, after
 * a chapter-completed event, and after content swap.
 */
export function syncStripCompletion(): void {
  const book = getBookSlug();
  const chapterId = getCurrentChapterId() || '';
  if (!book || !chapterId) return;

  const completed = getCompletedChapters(book);
  const isComplete =
    completed.includes(chapterId) || completed.includes(String(chapterId));

  document.querySelectorAll<HTMLElement>('[id^="strip-completion-"]').forEach(el => {
    el.classList.toggle('is-complete', isComplete);
  });
}

/**
 * Apply scroll-derived progress to the active chapter's progress
 * ring AND to the active chapter's TOC sidebar fill (delegated to
 * sidebar-render). Single entry point so the scroll listener and the
 * post-swap hooks call the same code path.
 *
 * - On scroll: pct comes from the scroll listener (window.scrollY
 *   relative to #chapter-container offsetTop / scrollable height).
 * - On load / content-swap: pct is read from localStorage by
 *   syncProgressOnLoad (see below).
 */
export function applyChapterProgress(pct: number): void {
  updateProgressBadges(pct);
}

/**
 * On page load (or after a content swap), the scroll listener has
 * not yet fired so the ring would sit at 0%. We compute the chapter's
 * persisted percentage from localStorage and apply it once so the
 * ring shows the user's last position immediately, even before they
 * scroll.
 *
 * If the chapter is in the completed list, we don't pin the ring to
 * 100% — the ring shows position, not completion. We use whatever
 * scroll-progress was last stored. Falls back to 100% only if
 * there's no stored progress at all (we know they finished, but we
 * don't know where they were).
 */
export function syncProgressOnLoad(): void {
  const book = getBookSlug();
  const chapterId = getCurrentChapterId() || '';
  if (!book || !chapterId) {
    updateProgressBadges(0);
    return;
  }

  const stored = getChapterScrollPercent(book, chapterId);
  if (stored > 0) {
    updateProgressBadges(stored);
    return;
  }

  /* No stored progress. If chapter is marked complete, show 100%;
     otherwise 0%. */
  const completed = getCompletedChapters(book);
  const isComplete =
    completed.includes(chapterId) || completed.includes(String(chapterId));
  updateProgressBadges(isComplete ? 100 : 0);
}