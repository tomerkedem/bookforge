import { initLanguageSwitcher } from './language-switcher';
import { initProgressTracker } from './progress-tracker';
import { initStickyHeader } from './sticky-header';
import { initKeyboardNav } from './keyboard-nav';
import { initHighlighter } from './highlighter';
import { initReadingHints } from './reading-hints';
import { initChapterCompletion } from './chapter-completion';
import { initSearch } from './search';
import { initHighlightsPanel } from './highlights-panel';
import { initReadingStats } from './reading-stats';
import { initBookmarks } from './bookmarks';
import { initSwipeNav } from './swipe-nav';
import { initReadingGoals } from './reading-goals';
import { initBookCompletion } from './book-completion';

/**
 * Main initialization — wires up all reading-page modules.
 * Each module handles a single responsibility.
 */
function initializeReadingPage() {
  const controller = new AbortController();

  initLanguageSwitcher(controller);
  const progressCleanup = initProgressTracker(controller);
  initStickyHeader(controller);
  initKeyboardNav(controller.signal);
  initHighlighter(controller.signal);
  initReadingHints();
  initChapterCompletion();
  initSearch(controller.signal);
  initHighlightsPanel();
  initReadingStats();
  initBookmarks(controller.signal);
  initSwipeNav(controller.signal);
  initReadingGoals(controller.signal);
  initBookCompletion();

  const cleanup = () => {
    progressCleanup();
    controller.abort();
  };

  document.addEventListener('astro:before-unmount', cleanup);
  window.addEventListener('unload', cleanup);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeReadingPage);
} else {
  initializeReadingPage();
}

document.addEventListener('astro:after-swap', initializeReadingPage);
