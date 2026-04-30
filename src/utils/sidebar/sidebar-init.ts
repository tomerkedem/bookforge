/**
 * Sidebar bootstrap + lifecycle wiring.
 *
 * This is the entry point the .astro file imports. It calls into
 * each subsystem in the right order:
 *
 *   1. i18n pass — sets text in the user's chosen language
 *   2. Click + hover delegation
 *   3. Active-chapter row class wiring
 *   4. data-expanded flags on chapters with sections
 *   5. Section list build (deferred 150ms — chapter content needs a
 *      tick to land in the DOM before we can read its h2s)
 *   6. Chapter completion / progress sync
 *   7. Mobile drawer init (separate concern, separate init)
 *   8. Cross-cutting window listeners: scroll, language change,
 *      popstate, astro:after-swap
 */

import { getCurrentLang, getCurrentChapterId, getBookSlug } from './sidebar-helpers';
import { updateSidebarText } from './sidebar-i18n';
import {
  initSidebarNavigation,
  initScrollListener,
  initSidebarAutoHideScrollbar,
} from './sidebar-events';
import {
  getLastPosition,
  getElapsedSinceLastVisit,
  computeScrollTarget,
  computeSectionPercent,
  savePosition,
} from './sidebar-resume';
import {
  showWelcomeBackBanner,
  clearResumeBanner,
  isBannerDismissedThisSession,
} from './sidebar-resume-ui';
import { getActiveOutlineId } from './sidebar-outline';
import {
  updateActiveChapterRow,
  ensureSectionsContainer,
  buildSectionList,
  syncChapterStates,
} from './sidebar-render';
import { markAllSectionsRead } from './sidebar-outline';
import { loadChapterContent } from './sidebar-navigation';
import {
  initMobileToc,
  buildMobileOutline,
  resetMobileInitGuard,
} from './sidebar-mobile';
import { markChapterComplete } from './sidebar-storage';
import { setNavigator } from './sidebar-dispatcher';
import {
  syncProgressOnLoad,
  syncStripCompletion,
} from './sidebar-progress';

/** Wire the sidebar for the current page. Safe to call multiple
 *  times — each subsystem guards itself against double-init. */
export function initializeSidebar(): void {
  const lang = getCurrentLang();
  updateSidebarText(lang);
  initSidebarNavigation();
  initSidebarAutoHideScrollbar();
  updateActiveChapterRow();
  ensureSectionsContainer();

  /* Chapter content needs a tick to be in the DOM before we can
     scan its h2s. 150ms matches legacy timing — tested across
     view-transition swap durations. */
  setTimeout(() => {
    buildSectionList();
    syncChapterStates();
    /* Paint the ring + completion pill once on load so they reflect
       the persisted state (the scroll listener won't fire until the
       reader actually scrolls). */
    syncProgressOnLoad();
    syncStripCompletion();
    /* Resume-from-here: depends on heading ids being live in the
       DOM (auto-scroll uses getElementById) AND on the section list
       being built (banner dismissal listens on the sidebar). Has to
       run AFTER buildSectionList for both reasons. */
    runResumeOnLoad();
  }, 150);
}

const RESUME_THRESHOLD_MS = 30 * 60 * 1000;

/**
 * On (re)load, decide whether to surface the resume UI:
 *
 *   - No saved position → silent first-visit behavior.
 *   - Saved position is for a different chapter than the URL → also
 *     silent. The user explicitly navigated elsewhere; their saved
 *     position stays put for when they return.
 *   - Same chapter, < 30 min ago → silent auto-scroll (refresh case).
 *   - Same chapter, ≥ 30 min ago → banner + auto-scroll + initial
 *     progress-bar paint.
 *
 * scrollPercent is the canonical positioning signal (decision 1):
 * computeScrollTarget falls back to scrollY only when the saved
 * heading is no longer in the DOM.
 */
function runResumeOnLoad(): void {
  const book = getBookSlug();
  const chapterId = String(getCurrentChapterId() || '');
  if (!book || !chapterId) return;

  const last = getLastPosition(book);
  if (!last) return;

  /* Only act when the user is on the chapter where they left off.
     If they landed on a different chapter (deep link, manual nav),
     leave the saved position untouched and let the scroll listener
     overwrite it once they read here. */
  if (last.chapterSlug !== chapterId) return;

  const target = computeScrollTarget(last);
  if (target !== null) {
    /* Immediate, not animated — user expects to be where they were,
       not to watch the page glide there. */
    window.scrollTo({ top: target, behavior: 'auto' });
  }

  const elapsed = getElapsedSinceLastVisit(book) ?? 0;
  if (elapsed >= RESUME_THRESHOLD_MS && !isBannerDismissedThisSession(book)) {
    showWelcomeBackBanner(book, last, elapsed, {
      initialScrollY: target ?? window.scrollY,
    });
  }
}

/**
 * Force-save the current reading position. Wired to beforeunload so
 * the final scroll position lands even if the 3 s save throttle
 * hasn't elapsed since the last write. Defensive: returns silently
 * when there's nothing meaningful to capture.
 */
function flushPositionOnUnload(): void {
  const book = getBookSlug();
  const chapterId = getCurrentChapterId();
  if (!book || !chapterId) return;
  const sectionSlug = getActiveOutlineId();
  if (!sectionSlug) return;
  const sectionPct = computeSectionPercent(sectionSlug) ?? 0;
  savePosition(
    book,
    {
      chapterSlug: String(chapterId),
      sectionSlug,
      scrollPercent: sectionPct,
      scrollY: window.scrollY,
    },
    { force: true },
  );
}

/**
 * Install all window/document-level listeners. Called once at
 * module load. These are NOT guarded against re-registration
 * because they should only ever be installed once per page load.
 *
 * If the sidebar is re-mounted via Astro view transitions, the
 * astro:after-swap handler below re-runs initializeSidebar but
 * does NOT re-install these listeners.
 */
export function installLifecycleHandlers(): void {
  initScrollListener();

  /* Force-save the last position before the page tears down so the
     final scroll spot survives. The 3 s throttle inside savePosition
     would otherwise let very-recent scrolls slip through. */
  window.addEventListener('beforeunload', flushPositionOnUnload);

  window.addEventListener('chapter-completed', () => {
    const book = getBookSlug();
    const chId = getCurrentChapterId();
    if (book && chId) {
      markChapterComplete(book, chId);
      /* Backfill the LAST section's ✓: scroll-spy only marks
         headings before the active one, so the trailing heading
         never gets its mark on its own. Finishing the chapter
         implicitly means every section is done. */
      markAllSectionsRead();
      syncChapterStates();
      /* Reveal the inline completion pill in the chapter top strip
         now that the active chapter has just been marked complete. */
      syncStripCompletion();
    }
  });

  window.addEventListener('language-changed', (e) => {
    const detail = (e as CustomEvent).detail;
    const lang = detail?.language || 'he';
    updateSidebarText(lang);
    setTimeout(() => {
      buildSectionList();
      syncChapterStates();
    }, 150);

    /* Mobile drawer needs its outline rebuilt too — same source
       data, different DOM tree. */
    const drawer = document.getElementById('mobile-drawer');
    if (drawer && drawer.classList.contains('open')) {
      buildMobileOutline();
    }
  });

  window.addEventListener('popstate', async () => {
    await loadChapterContent(window.location.href);
  });

  /* Astro view-transition lifecycle: after the new page has been
     swapped in, the sidebar's persisted instance is still in the
     DOM but its handlers may need re-pointing at the new content
     ids. We re-init the sidebar and re-arm mobile drawer. */
  document.addEventListener('astro:after-swap', () => {
    /* Wipe any stale resume banner from the previous page. The
       sidebar persists across view transitions (transition:persist),
       so without explicit removal the banner from the original
       page-load would linger after the user navigates elsewhere.
       runResumeOnLoad will repaint a fresh one if appropriate. */
    clearResumeBanner();
    initializeSidebar();
    resetMobileInitGuard();
    initMobileToc();
  });

  /* Immersive mode is manual-only (keyboard / FAB). Auto-toggling
     it on scroll caused the reading column to jump width when the
     320px sidebar margins were removed — visible as a horizontal
     shift mid-scroll. Keep immersive as an explicit user action. */
  window.addEventListener('popstate', () => {
    document.body.classList.remove('reading-immersive');
  });
}

/** Convenience: run the full bootstrap. Use this from a top-level
 *  script in the .astro file. */
export function bootstrap(): void {
  /* Register the navigator dispatcher first — render code may need
     to navigate when section links in non-active chapters are
     clicked, and it reaches navigation through this indirection
     instead of importing it directly (avoids a render <-> nav
     import cycle). */
  setNavigator(loadChapterContent);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeSidebar();
      initMobileToc();
    });
  } else {
    initializeSidebar();
    initMobileToc();
  }
  installLifecycleHandlers();
}