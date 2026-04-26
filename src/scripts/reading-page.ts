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
import { initFocusParagraph } from './focus-paragraph';
import { initAmbientColor } from './ambient-color';
import { initHighlightReplay } from './highlight-replay';
import { initOnboardingTour } from './onboarding-tour';
import { initTextToSpeech } from './text-to-speech';
import { initChapterTitleTap } from './chapter-title-tap';
import { initImageLightbox } from './image-lightbox';
import { initLeftSidebar } from './left-sidebar';

let currentController: AbortController | null = null;
let currentProgressCleanup: (() => void) | null = null;

/**
 * Main initialization - wires up all reading-page modules.
 * Safe to call repeatedly: aborts the previous controller and rebinds.
 */
function initializeReadingPage() {
  // Always tear down the previous init first. View Transitions keep
  // <body>-level elements around (e.g. #tts-fab) between pages, so
  // aborting the controller also lets each module remove its DOM.
  currentController?.abort();
  currentProgressCleanup?.();
  currentController = null;
  currentProgressCleanup = null;

  // Only mount reading controls on actual chapter pages. Without this
  // guard, navigating chapter → home via astro:after-swap would re-fire
  // this initializer on a page with no #chapter-container and leave a
  // stray speaker FAB / sidebars / hints on the home and landing pages.
  if (!document.getElementById('chapter-container')) return;

  const controller = new AbortController();
  currentController = controller;

  initLanguageSwitcher(controller);
  currentProgressCleanup = initProgressTracker(controller);
  initStickyHeader(controller);
  initKeyboardNav(controller.signal);
  initHighlighter(controller.signal);
  // initReadingHints(); // Disabled - distracting during reading
  initChapterCompletion();
  initSearch(controller.signal);
  initHighlightsPanel();
  initReadingStats();
  initBookmarks(controller.signal);
  initSwipeNav(controller.signal);
  initReadingGoals(controller.signal);
  initBookCompletion();
  initFocusParagraph();
  initAmbientColor();
  initHighlightReplay();
  initTextToSpeech(controller.signal);
  initOnboardingTour();
  initChapterTitleTap(controller.signal);
  initImageLightbox(controller);
  initLeftSidebar(controller.signal);

  const cleanup = () => {
    currentProgressCleanup?.();
    controller.abort();
  };

  document.addEventListener('astro:before-unmount', cleanup, { once: true, signal: controller.signal });
  window.addEventListener('unload', cleanup, { once: true, signal: controller.signal });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeReadingPage);
} else {
  initializeReadingPage();
}

document.addEventListener('astro:after-swap', initializeReadingPage);
window.addEventListener('chapter-content-swapped', initializeReadingPage);
