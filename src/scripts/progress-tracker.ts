import { ReadingProgressManager } from '../utils/reading-progress';

const MIN_RESTORE_PX = 150; // Don't restore if near the top

/** Show a brief "resuming" toast */
function showResumeToast(lang: string) {
  const msgs: Record<string, string> = {
    he: 'ממשיך ממקום העצירה ↑',
    es: 'Retomando donde lo dejaste ↑',
    en: 'Resuming where you left off ↑',
  };
  const msg = msgs[lang] || msgs.en;

  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
    background:rgba(0,0,0,0.78); backdrop-filter:blur(8px);
    color:#fff; font-size:13px; font-weight:500;
    padding:8px 18px; border-radius:99px;
    z-index:9999; pointer-events:none;
    animation: resumeIn 0.3s ease forwards;
  `;
  toast.textContent = msg;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes resumeIn {
      from { opacity:0; transform:translateX(-50%) translateY(8px); }
      to   { opacity:1; transform:translateX(-50%) translateY(0); }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

function getChapterInfo() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return {
    bookId:    parts[1] || 'unknown',
    chapterId: parseInt(parts[2] || '0', 10),
  };
}

function getLang() {
  return new URLSearchParams(window.location.search).get('lang')
    || localStorage.getItem('yuval_language')
    || 'en';
}

/**
 * Try to restore scroll for the current chapter.
 * Returns true if a restore happened.
 */
function tryRestore(bookId: string, chapterId: number, silent = false): boolean {
  const progress = ReadingProgressManager.getProgress(bookId, chapterId);
  if (!progress || progress.scrollPosition < MIN_RESTORE_PX) return false;

  setTimeout(() => {
    window.scrollTo({ top: progress.scrollPosition, behavior: 'instant' });
    if (!silent) showResumeToast(getLang());
  }, 120);

  return true;
}

/**
 * Initialize reading progress tracking.
 * Saves scroll position on scroll (debounced).
 * Restores position on any chapter load (not just back/forward).
 * Returns a cleanup function.
 */
export function initProgressTracker(controller: AbortController): () => void {
  const { bookId, chapterId } = getChapterInfo();

  let scrollTimeout: ReturnType<typeof setTimeout>;

  function calcPercentage(): number {
    const container = document.getElementById('chapter-container');
    if (!container) return 0;
    const containerTop = container.offsetTop;
    const containerHeight = container.offsetHeight;
    const scrollable = containerHeight - window.innerHeight;
    if (scrollable <= 0) return 100;
    const scrolledInto = window.scrollY - containerTop;
    if (scrolledInto <= 0) return 0;
    return Math.min(100, Math.round((scrolledInto / scrollable) * 100));
  }

  const scrollHandler = () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const pct = calcPercentage();
      ReadingProgressManager.saveProgress(bookId, chapterId, window.scrollY, pct);
    }, 400);
  };

  window.addEventListener('scroll', scrollHandler, { passive: true, signal: controller.signal });

  // ── Restore on initial load ──────────────────────────────────────────────
  const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  const isBackForward = navEntry?.type === 'back_forward';

  // Always restore (back/forward silently, normal load with toast)
  tryRestore(bookId, chapterId, isBackForward);

  // ── Restore after fetch-based chapter navigation ─────────────────────────
  const onSwapped = () => {
    const info = getChapterInfo();
    // Re-register scroll saver for the new chapter
    window.removeEventListener('scroll', scrollHandler);
    const newHandler = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const pct = calcPercentage();
        ReadingProgressManager.saveProgress(info.bookId, info.chapterId, window.scrollY, pct);
      }, 400);
    };
    window.addEventListener('scroll', newHandler, { passive: true, signal: controller.signal });

    tryRestore(info.bookId, info.chapterId);
  };

  window.addEventListener('chapter-content-swapped', onSwapped, { signal: controller.signal });

  return () => clearTimeout(scrollTimeout);
}
