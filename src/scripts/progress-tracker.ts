import { ReadingProgressManager } from '../utils/reading-progress';
import { parseChapterKey, type ChapterKey } from './reading-location';

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

function getChapterInfo(): { bookId: string; chapterId: ChapterKey } {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return {
    bookId:    parts[1] || 'unknown',
    chapterId: parseChapterKey(parts[2] || '0'),
  };
}

function getLang() {
  return new URLSearchParams(window.location.search).get('lang')
    || localStorage.getItem('yuval_language')
    || 'en';
}

/** Tags we'll accept as the resume anchor (block-level content). */
const PULSE_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'LI', 'BLOCKQUOTE', 'FIGURE']);

/**
 * After scroll restore settles, add a temporary .resume-pulse class to the
 * block-level element closest to the vertical center of the viewport so the
 * reader's eye lands on the resume point. Auto-removes after the animation.
 */
function pulseResumePoint() {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const hit = document.elementFromPoint(cx, cy) as HTMLElement | null;
  if (!hit) return;

  let target: HTMLElement | null = hit;
  while (target && !PULSE_TAGS.has(target.tagName)) {
    if (target.id === 'chapter-container') { target = null; break; }
    target = target.parentElement;
  }
  if (!target) return;

  // If a pulse is already running on this element (rapid re-restores),
  // reset the animation so it starts from frame 0.
  target.classList.remove('resume-pulse');
  // Force reflow so re-adding the class restarts the animation.
  void target.offsetWidth;
  target.classList.add('resume-pulse');

  window.setTimeout(() => target?.classList.remove('resume-pulse'), 2800);
}

/**
 * Try to restore scroll for the current chapter.
 * Returns true if a restore happened.
 */
function tryRestore(bookId: string, chapterId: ChapterKey, silent = false): boolean {
  const progress = ReadingProgressManager.getProgress(bookId, chapterId);
  if (!progress || progress.scrollPosition < MIN_RESTORE_PX) return false;

  setTimeout(() => {
    window.scrollTo({ top: progress.scrollPosition, behavior: 'instant' });
    if (!silent) showResumeToast(getLang());
    // One more frame to let layout settle after the scroll jump, then
    // spotlight the paragraph where the reader left off.
    requestAnimationFrame(() => requestAnimationFrame(pulseResumePoint));
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
