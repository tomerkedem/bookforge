import { ReadingProgressManager } from '../utils/reading-progress';

/**
 * Initialize reading progress tracking.
 * Saves scroll position on scroll (debounced), restores on back/forward navigation.
 * Returns a cleanup function to clear the debounce timer.
 */
export function initProgressTracker(controller: AbortController): () => void {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const bookId = parts[1] || 'unknown';
  const chapterId = parseInt(parts[2] || '0', 10);

  let scrollTimeout: ReturnType<typeof setTimeout>;

  const scrollHandler = () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      ReadingProgressManager.saveProgress(bookId, chapterId, window.scrollY);
    }, 500);
  };

  window.addEventListener('scroll', scrollHandler, { passive: true, signal: controller.signal });

  // Restore scroll position only on back/forward navigation
  const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (navEntry?.type === 'back_forward') {
    const progress = ReadingProgressManager.getProgress(bookId, chapterId);
    if (progress && progress.scrollPosition > 0) {
      setTimeout(() => window.scrollTo(0, progress.scrollPosition), 100);
    }
  }

  return () => clearTimeout(scrollTimeout);
}
