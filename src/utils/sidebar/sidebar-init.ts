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
} from './sidebar-events';
import {
  updateActiveChapterRow,
  ensureSectionsContainer,
  buildSectionList,
  syncChapterStates,
} from './sidebar-render';
import { loadChapterContent } from './sidebar-navigation';
import {
  initMobileToc,
  buildMobileOutline,
  resetMobileInitGuard,
} from './sidebar-mobile';
import { markChapterComplete } from './sidebar-storage';
import { setNavigator } from './sidebar-dispatcher';

/** Wire the sidebar for the current page. Safe to call multiple
 *  times — each subsystem guards itself against double-init. */
export function initializeSidebar(): void {
  const lang = getCurrentLang();
  updateSidebarText(lang);
  initSidebarNavigation();
  updateActiveChapterRow();
  ensureSectionsContainer();

  /* Chapter content needs a tick to be in the DOM before we can
     scan its h2s. 150ms matches legacy timing — tested across
     view-transition swap durations. */
  setTimeout(() => {
    buildSectionList();
    syncChapterStates();
  }, 150);
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

  window.addEventListener('chapter-completed', () => {
    const book = getBookSlug();
    const chId = getCurrentChapterId();
    if (book && chId) {
      markChapterComplete(book, chId);
      syncChapterStates();
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