import { ReadingProgressManager } from '../utils/reading-progress';
import { LANGUAGES, getLanguageFromStorage, setLanguageToStorage, isValidLanguage } from '../utils/language';
import type { Language } from '../types/index';

/**
 * Initialize language switching from URL and localStorage
 * Handles client-side content switching with data-he/data-en attributes
 */
function initLanguageSwitcher(controller: AbortController) {
  const urlParams = new URLSearchParams(window.location.search);
  let currentLanguage = urlParams.get('lang');

  if (!currentLanguage || !isValidLanguage(currentLanguage)) {
    currentLanguage = getLanguageFromStorage() || LANGUAGES.EN;
  }

  setLanguageToStorage(currentLanguage as Language);
  switchLanguage(currentLanguage);

  const switchHandler = (event: Event) => {
    const customEvent = event as CustomEvent<{ language: string }>;
    const newLang = customEvent.detail?.language;
    if (newLang) {
      setLanguageToStorage(newLang as Language);
      switchLanguage(newLang);
    }
  };

  window.addEventListener('language-changed', switchHandler as EventListener, { signal: controller.signal });
}

/**
 * Switch content between Hebrew and English using data attributes
 * Searches specifically in chapter-container to avoid other data-he/data-en elements
 */
function switchLanguage(lang: string) {
  // Switch in chapter-container
  const container = document.getElementById('chapter-container');
  if (container) {
    const heContent = container.querySelector(':scope > [data-lang="he"]');
    const enContent = container.querySelector(':scope > [data-lang="en"]');

    if (heContent && enContent) {
      if (lang === 'he') {
        heContent.classList.remove('hidden');
        heContent.classList.add('visible');
        enContent.classList.add('hidden');
        enContent.classList.remove('visible');
        document.documentElement.lang = 'he';
        document.documentElement.dir = 'rtl';
      } else {
        enContent.classList.remove('hidden');
        enContent.classList.add('visible');
        heContent.classList.add('hidden');
        heContent.classList.remove('visible');
        document.documentElement.lang = 'en';
        document.documentElement.dir = 'ltr';
      }
    }
  }

  // Also switch in chapter-header
  const header = document.getElementById('chapter-header');
  if (header) {
    const heLang = header.querySelector(':scope > [data-lang="he"]');
    const enLang = header.querySelector(':scope > [data-lang="en"]');
    if (heLang && enLang) {
      if (lang === 'he') {
        heLang.classList.remove('hidden');
        heLang.classList.add('visible');
        enLang.classList.add('hidden');
        enLang.classList.remove('visible');
      } else {
        enLang.classList.remove('hidden');
        enLang.classList.add('visible');
        heLang.classList.add('hidden');
        heLang.classList.remove('visible');
      }
    }
  }
}

/**
 * Initialize reading progress tracking with proper cleanup
 */
function initReadingProgress(controller: AbortController) {
  const pathname = window.location.pathname;
  const parts = pathname.split('/').filter(Boolean);
  const bookId = parts[1] || 'unknown';
  const chapterId = parseInt(parts[2] || '0', 10);

  // Save progress on scroll with debounce
  let scrollTimeout: NodeJS.Timeout;
  const scrollHandler = () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      ReadingProgressManager.saveProgress(bookId, chapterId, window.scrollY);
    }, 500);
  };

  window.addEventListener('scroll', scrollHandler, { passive: true, signal: controller.signal });

  // Restore scroll position only if user got here via browser back/forward,
  // not via a fresh navigation (e.g. TOC click)
  const navType = (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming)?.type;
  const isBackForward = navType === 'back_forward';
  const progress = ReadingProgressManager.getProgress(bookId, chapterId);
  if (isBackForward && progress && progress.scrollPosition > 0) {
    setTimeout(() => {
      window.scrollTo(0, progress.scrollPosition);
    }, 100);
  }

  // Return cleanup function
  return () => clearTimeout(scrollTimeout);
}

/**
 * Sticky header scroll handler — shrinks title, shows progress %
 */
function initStickyHeader(controller: AbortController) {
  const header = document.getElementById('chapter-header');
  if (!header) return;

  const progressFill = document.getElementById('header-progress-fill');
  const progressHe = document.getElementById('progress-badge-he');
  const progressEn = document.getElementById('progress-badge-en');

  const SCROLL_THRESHOLD = 80;

  function onScroll() {
    const scrollY = window.scrollY;

    if (scrollY > SCROLL_THRESHOLD) {
      header!.classList.add('scrolled');
    } else {
      header!.classList.remove('scrolled');
    }

    const contentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = contentHeight > 0 ? Math.round((scrollY / contentHeight) * 100) : 0;
    const clamped = Math.min(100, Math.max(0, pct));
    const text = `${clamped}%`;

    if (progressHe) progressHe.textContent = text;
    if (progressEn) progressEn.textContent = text;
    if (progressFill) progressFill.style.width = `${clamped}%`;
  }

  window.addEventListener('scroll', onScroll, { passive: true, signal: controller.signal });
  onScroll();
}

/**
 * Main initialization with proper AbortController cleanup
 */
function initializeReadingPage() {
  // Create AbortController for cleanup on page transition
  const controller = new AbortController();

  // Setup language switching (will cleanup on abort)
  initLanguageSwitcher(controller);

  // Setup reading progress (will cleanup on abort)
  const progressCleanup = initReadingProgress(controller);

  // Setup sticky header scroll behavior
  initStickyHeader(controller);

  // Listen for page transition to cleanup
  const beforeUnmountHandler = () => {
    progressCleanup();
    controller.abort();
  };

  document.addEventListener('astro:before-unmount', beforeUnmountHandler);

  // Also cleanup on page unload
  window.addEventListener('unload', beforeUnmountHandler);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeReadingPage);
} else {
  initializeReadingPage();
}

// Re-initialize on Astro navigation
document.addEventListener('astro:after-swap', initializeReadingPage);
