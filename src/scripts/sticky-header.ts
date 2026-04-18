import { t, resolveLanguage } from '../i18n';

const SCROLL_THRESHOLD = 80;

// ── Language ────────────────────────────────────────────────────────────────

function getLang(): string {
  return resolveLanguage(
    new URLSearchParams(window.location.search).get('lang')
      || localStorage.getItem('yuval_language')
      || 'en'
  );
}

// ── Init ────────────────────────────────────────────────────────────────────

export function initStickyHeader(controller: AbortController) {
  const topStrip = document.getElementById('chapter-top-strip');
  if (!topStrip) return;

  const siteHeader = document.getElementById('site-header');
  const progressFill = document.getElementById('header-progress-fill');
  const progressBadges = Array.from(document.querySelectorAll<HTMLElement>('.progress-badge'));

  function updateStickyOffset(): void {
    const top = siteHeader?.offsetHeight ?? 64;
    document.documentElement.style.setProperty('--reading-sticky-top', `${top}px`);
    const stripH = topStrip.offsetHeight;
    document.documentElement.style.setProperty('--top-strip-h', `${stripH}px`);
  }

  function calcPct(): number {
    const container = document.getElementById('chapter-container');
    if (container) {
      const containerTop = container.offsetTop;
      const containerHeight = container.offsetHeight;
      const scrollable = containerHeight - window.innerHeight;

      if (scrollable <= 0) return 100;

      const scrolledInto = window.scrollY - containerTop;
      if (scrolledInto <= 0) return 0;

      return Math.min(100, Math.round((scrolledInto / scrollable) * 100));
    }

    const pageH = document.documentElement.scrollHeight - window.innerHeight;
    return pageH > 0
      ? Math.min(100, Math.round((window.scrollY / pageH) * 100))
      : 0;
  }

  function updateReadingTime(pct: number): void {
    const lang = getLang();

    document.querySelectorAll<HTMLElement>('.reading-time-value').forEach(el => {
      const total = parseInt(el.dataset.totalMinutes || '0', 10);
      if (!total) return;

      const remaining = Math.max(0, Math.round(total * (1 - pct / 100)));

      if (remaining <= 0) {
        el.textContent = t('reading.completed', lang);
      } else if (pct > 0) {
        el.textContent = t('reading.remaining', lang, { n: remaining });
      } else {
        el.textContent = t('reading.total', lang, { n: total });
      }
    });
  }

  let chapterCompleted = false;

  function onScroll() {
    if (window.scrollY > SCROLL_THRESHOLD) {
      topStrip.classList.add('scrolled');
    } else {
      topStrip.classList.remove('scrolled');
    }

    if (chapterCompleted) return;

    const pct = calcPct();
    const text = `${pct}%`;

    progressBadges.forEach((badge) => {
      badge.textContent = text;
    });

    if (progressFill) {
      progressFill.style.width = `${pct}%`;
    }

    updateReadingTime(pct);
    updateDocumentTitle(pct);
  }

  // ── Document title ─────────────────────────────────────────────────────────

  const originalTitle = document.title;

  function updateDocumentTitle(pct: number): void {
    if (pct <= 0) {
      document.title = originalTitle;
      return;
    }

    document.title = `(${pct}%) ${originalTitle}`;
  }

  // ── Completion ─────────────────────────────────────────────────────────────

  function forceComplete(): void {
    chapterCompleted = true;

    const text = '100%';

    progressBadges.forEach((badge) => {
      badge.textContent = text;
    });

    if (progressFill) progressFill.style.width = '100%';

    updateReadingTime(100);
    updateDocumentTitle(100);
  }

  window.addEventListener('chapter-completed', forceComplete, {
    signal: controller.signal,
  });

  window.addEventListener('language-changed', () => {
    if (chapterCompleted) {
      updateReadingTime(100);
      return;
    }

    updateReadingTime(calcPct());
  }, {
    signal: controller.signal,
  });

  const parts = window.location.pathname.split('/').filter(Boolean);
  const bookId = parts[1];
  const chapterId = parts[2];

  if (chapterId && bookId) {
    try {
      const completed: string[] = JSON.parse(
        localStorage.getItem(`yuval_ch_complete_${bookId}`) || '[]'
      );

      if (completed.includes(chapterId)) {
        forceComplete();
      }
    } catch {}
  }

  window.addEventListener('scroll', onScroll, {
    passive: true,
    signal: controller.signal,
  });

  window.addEventListener('resize', updateStickyOffset, {
    passive: true,
    signal: controller.signal,
  });

  window.addEventListener('language-changed', updateStickyOffset, {
    signal: controller.signal,
  });

  const stripObserver = new ResizeObserver(updateStickyOffset);
  stripObserver.observe(topStrip);
  controller.signal.addEventListener('abort', () => stripObserver.disconnect());

  updateStickyOffset();
  onScroll();
}