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

import { getCurrentChapterId, getBookSlug, getVisibleContentDiv } from './sidebar-helpers';
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
import {
  updateProgressBadges,
  syncStripCompletion,
} from './sidebar-progress';
import { loadChapterContent } from './sidebar-navigation';
import { clearActiveSectionMarks, getActiveOutlineId } from './sidebar-outline';
import { AUTO_COMPLETE_THRESHOLD } from './sidebar-constants';
import { setActiveTubePct } from './sidebar-particle-tube';
import {
  savePosition,
  computeSectionPercent,
} from './sidebar-resume';

/** Collapse every expanded chapter except the one whose id is
 *  given. Used to enforce a single-open invariant: only one chapter
 *  card has its section list expanded at a time. */
function collapseOtherChapters(keepChId: string): void {
  document
    .querySelectorAll<HTMLElement>('.usb-chapter[data-expanded="true"]')
    .forEach(other => {
      if ((other.dataset.chapterId || '') === keepChId) return;
      other.dataset.expanded = 'false';
      other
        .querySelector<HTMLElement>('.usb-toggle-btn')
        ?.setAttribute('aria-expanded', 'false');
    });
}

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
        /* Single-open invariant: collapse any other expanded
           chapter before opening this one. */
        collapseOtherChapters(chId);
        li.dataset.expanded = 'true';
        toggleBtn.setAttribute('aria-expanded', 'true');
        void renderChapterSections(chId);
      }
      return;
    }

    /* Reset button: clear completion AND scroll progress for this
       chapter. The visual goal is for the badge to flip back to the
       gold "untouched" state, so we have to undo three things:
         1. Completion list entry (handled by unmarkChapterComplete).
         2. reading_progress_* localStorage entries (also handled by
            unmarkChapterComplete).
         3. The scroll listener's per-chapter `lastWrittenPct` cache
            — without this, the very next scroll tick would see the
            cached pct and rewrite the freshly-cleared storage.
       If the chapter being reset is the currently active one, we
       also scroll the window to the top of the chapter so the live
       scroll position matches pct=0. Otherwise the next scroll tick
       would record whatever mid-chapter position the reader is on. */
    const resetBtn = target.closest<HTMLElement>('[data-action="reset-completion"]');
    if (resetBtn) {
      e.preventDefault();
      e.stopImmediatePropagation();
      const chId = resetBtn.dataset.chapterId || '';
      const book = getBookSlug();
      if (chId && book) {
        unmarkChapterComplete(book, chId);
        invalidateScrollCache(chId);

        if (String(chId) === String(getCurrentChapterId() || '')) {
          /* Reset is on the chapter the reader is currently viewing.
             unmarkChapterComplete already wiped the read-sections
             storage; clear the in-memory Set + the .section-completed
             DOM marks too so the outline visually resets immediately
             (otherwise the ✓ glyphs persist until the user navigates
             away and back). */
          clearActiveSectionMarks();

          const container = document.getElementById('chapter-container');
          const top = container ? container.offsetTop : 0;
          window.scrollTo({ top, behavior: 'instant' as ScrollBehavior });
        }

        syncChapterStates();
        /* Refresh the in-page chapter strip ("הקריאה הושלמה" pill +
           progress fill) so the completion pill disappears immediately.
           syncChapterStates only refreshes the sidebar — the page's
           top strip is owned by sidebar-progress and needs its own
           sync call. */
        syncStripCompletion();
      }
      return;
    }

    /* Chapter card click. Two behaviors depending on current state:

         (a) Card is already OPEN (data-expanded="true") — typically
             because the user is on this chapter or just peeked at
             it via the chevron. A repeat click collapses it. No
             navigation. Mental model: the click "toggles closed"
             a card the user can already see is open.

         (b) Card is CLOSED — click navigates to the chapter AND
             scrolls to its first section heading. The active-
             chapter pipe appears post-navigation (the .usb-chapter-
             active class flips to this chapter), other expanded
             chapters collapse via ensureSectionsContainer, and the
             reader lands on the first H2 instead of any intro
             paragraph that might precede it. */
    const link = target.closest<HTMLAnchorElement>('a.usb-chapter-link');
    if (!link) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    const chId = link.dataset.chapterId || '';
    const li = chId
      ? document.querySelector<HTMLElement>(`.usb-chapter[data-chapter-id="${chId}"]`)
      : null;

    if (li && li.dataset.expanded === 'true') {
      li.dataset.expanded = 'false';
      li.querySelector<HTMLElement>('.usb-toggle-btn')
        ?.setAttribute('aria-expanded', 'false');
      return;
    }

    const url = link.getAttribute('href')?.split('?')[0] || '';
    await loadChapterContent(url);

    /* After view-transition swap, the new chapter's content lands
       in .chapter-content.visible. Wait a tick for the swap, then
       scroll to the first H2 — same delay (200ms) and same
       scrollIntoView behavior used by section-link clicks below. */
    setTimeout(() => {
      const content = getVisibleContentDiv();
      const firstHeading = content?.querySelector<HTMLElement>('h2');
      if (firstHeading) firstHeading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  }, true);

  /* Lazy prefetch on hover. pointerover bubbles, so a single
     listener handles all toggle buttons via delegation. By the time
     the user actually clicks, the section data is usually already
     in the cache and expansion is instant. */
  sidebar.addEventListener('pointerover', (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    /* Hovering the toggle caret OR the chapter card itself warms the
       cache — the card is now also a toggle, so both should prefetch. */
    const toggleBtn = target.closest<HTMLElement>('[data-action="toggle-sections"]');
    const link = target.closest<HTMLElement>('a.usb-chapter-link');
    const chId =
      toggleBtn?.dataset.chapterId ||
      link?.dataset.chapterId ||
      '';
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
/* Per-chapter "last persisted pct" cache. Lifted out of the scroll
   listener so the reset handler can invalidate the entry for the
   chapter being cleared — otherwise the next scroll tick would see
   the cached value and re-write the old pct over the freshly-cleared
   storage. */
const lastWrittenByChapter = new Map<string, number>();

/** Force the next scroll tick to re-record progress for `chapterId`,
 *  even if the underlying pct hasn't moved. Called from the reset
 *  handler after wiping that chapter's stored progress. */
function invalidateScrollCache(chapterId: string): void {
  lastWrittenByChapter.delete(chapterId);
}

export function initScrollListener(): void {
  let scrollTimeout: number | undefined;

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
         working. The per-chapter cache (instead of a single closure)
         means a reset on chapter X invalidates X's entry without
         affecting other chapters. */
      const lastWrittenPct = lastWrittenByChapter.get(String(chapterId)) ?? -1;
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
          lastWrittenByChapter.set(String(chapterId), pct);
        } catch {}
      }

      /* Auto-completion. */
      if (pct >= AUTO_COMPLETE_THRESHOLD) {
        const before = getCompletedChapters(book);
        if (!before.includes(String(chapterId))) {
          markChapterComplete(book, chapterId);
          syncChapterStates();
          /* Reveal the inline "הקריאה הושלמה" pill now that the
             current chapter has just been marked complete. */
          syncStripCompletion();
        }
      }

      /* Update the chapter top-strip progress ring on every scroll
         tick. Cheap (one DOM write to one SVG attribute) and matters
         visually — the ring is the user's live position indicator. */
      updateProgressBadges(pct);

      /* Feed live progress to the active chapter's particle tube so
         the visible particle population grows/shrinks in real time
         as the reader scrolls. Inactive tubes don't get scroll
         updates — they only refresh on syncChapterStates(). */
      setActiveTubePct(String(chapterId), pct);

      /* Time-remaining header — cheap (one DOM write), worth
         refreshing on every tick because it's sensitive to active
         chapter pct, not just whole-chapter completion. */
      const timeEl = document.getElementById('usb-time-remaining');
      if (timeEl) timeEl.textContent = formatTimeRemaining(computeTimeRemaining());

      /* Last-read position — distinct from the per-chapter ring
         data above. Captures section + section-relative percent so
         a return visit can resume exactly. savePosition has its own
         3 s throttle internally; calling it here every 120 ms is
         cheap (most calls return early). */
      const activeId = getActiveOutlineId();
      if (activeId) {
        const sectionPct = computeSectionPercent(activeId) ?? 0;
        savePosition(book, {
          chapterSlug: String(chapterId),
          sectionSlug: activeId,
          scrollPercent: sectionPct,
          scrollY: window.scrollY,
        });
      }
    }, 120);
  }, { passive: true });
}

/**
 * Auto-hide scrollbar wiring for the chapter sidebar.
 *
 * Native webkit-scrollbar pseudo-elements don't transition smoothly,
 * so the CSS hides the OS scrollbar entirely (scrollbar-width:none
 * + ::-webkit-scrollbar{display:none}) and we draw our own thumb as
 * a regular <div> appended to <body>. Opacity transitions on a real
 * div animate cleanly, which is what gives this its Notion/Linear/
 * Slack-style "exhale" feel.
 *
 * Position is updated on every scroll/resize via getBoundingClientRect:
 *   thumbHeight = clientHeight × (clientHeight / scrollHeight)
 *   thumbTop    = scrollRatio × (clientHeight − thumbHeight)
 * fixed-positioned, so it stays glued to the sidebar's visible edge
 * while the content slides underneath.
 *
 * Visibility lifecycle:
 *   - on scroll: show now, schedule hide after SCROLL_VISIBLE_MS
 *   - on mouseenter: show now, cancel any pending hide (sticky while
 *     the cursor is over the sidebar)
 *   - on mouseleave: schedule hide after SCROLL_VISIBLE_MS
 *
 * Runs at most once per call (guard via dataset flag) —
 * initializeSidebar is invoked on every view-transition swap, but
 * the listener only needs to bind once.
 */
const SCROLL_VISIBLE_MS = 1100;

export function initSidebarAutoHideScrollbar(): void {
  const sidebar = document.querySelector<HTMLElement>('.unified-sidebar');
  if (!sidebar) return;
  if (sidebar.dataset.autohideBound === '1') return;
  sidebar.dataset.autohideBound = '1';

  /* Reuse an existing thumb if a previous mount left one behind
     (defensive — view-transition swaps shouldn't double-create, but
     hot-module reload or duplicate calls could). */
  let thumb = document.querySelector<HTMLDivElement>('.usb-custom-thumb');
  if (!thumb) {
    thumb = document.createElement('div');
    thumb.className = 'usb-custom-thumb';
    thumb.setAttribute('aria-hidden', 'true');
    document.body.appendChild(thumb);
  }

  let hideTimer: number | undefined;
  let hovering = false;

  function updatePosition(): void {
    const scrollHeight = sidebar!.scrollHeight;
    const clientHeight = sidebar!.clientHeight;
    if (scrollHeight <= clientHeight) {
      thumb!.style.display = 'none';
      return;
    }
    thumb!.style.display = '';

    const rect = sidebar!.getBoundingClientRect();
    const ratio = clientHeight / scrollHeight;
    const thumbHeight = Math.max(40, clientHeight * ratio);
    const maxScroll = scrollHeight - clientHeight;
    const scrollRatio = maxScroll > 0 ? sidebar!.scrollTop / maxScroll : 0;
    const thumbTop = scrollRatio * (clientHeight - thumbHeight);

    thumb!.style.height = `${thumbHeight}px`;
    thumb!.style.top = `${rect.top + thumbTop}px`;
    /* Park the thumb 6 px in from the inline-end edge of the sidebar
       (which is the screen-LEFT edge in RTL Hebrew, screen-RIGHT in
       LTR). That edge is the one facing the reading content. */
    const isRtl = getComputedStyle(sidebar!).direction === 'rtl';
    if (isRtl) {
      thumb!.style.left = `${rect.left + 6}px`;
      thumb!.style.right = '';
    } else {
      thumb!.style.right = `${window.innerWidth - rect.right + 6}px`;
      thumb!.style.left = '';
    }
  }

  function show(): void {
    updatePosition();
    thumb!.classList.add('is-active');
    if (hideTimer !== undefined) clearTimeout(hideTimer);
  }

  function scheduleHide(): void {
    if (hovering) return;
    if (hideTimer !== undefined) clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      thumb!.classList.remove('is-active');
    }, SCROLL_VISIBLE_MS);
  }

  sidebar.addEventListener('scroll', () => {
    show();
    scheduleHide();
  }, { passive: true });

  sidebar.addEventListener('mouseenter', () => {
    hovering = true;
    show();
  });

  sidebar.addEventListener('mouseleave', () => {
    hovering = false;
    scheduleHide();
  });

  /* Resize / orientation change shifts the sidebar bounds; reposition
     the thumb so it doesn't desync. The thumb stays at whatever
     visibility state it was in. */
  window.addEventListener('resize', updatePosition);

  /* Initial position so the thumb is correctly placed if it briefly
     becomes visible right after mount. */
  updatePosition();
}