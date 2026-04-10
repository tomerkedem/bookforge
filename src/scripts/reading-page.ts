import { initLanguageSwitcher } from './language-switcher';
import { initProgressTracker } from './progress-tracker';
import { initStickyHeader } from './sticky-header';

/**
 * Main initialization — wires up all reading-page modules.
 * Each module handles a single responsibility.
 */
function initializeReadingPage() {
  const controller = new AbortController();

  initLanguageSwitcher(controller);
  const progressCleanup = initProgressTracker(controller);
  initStickyHeader(controller);

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

// Before swap: reset scroll and header state so the transition snapshot
// is taken from the top position — prevents sidebar/header visual jump
document.addEventListener('astro:before-swap', () => {
  window.scrollTo(0, 0);
  const header = document.getElementById('chapter-header');
  if (header) header.classList.remove('scrolled');
});
