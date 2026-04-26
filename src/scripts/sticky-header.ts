/**
 * Sticky chapter top-strip behavior.
 *
 * Owns ONLY the visual chrome of the sticky strip:
 *   - Toggles .scrolled class once page scroll passes a threshold
 *   - Updates --reading-sticky-top and --top-strip-h CSS custom
 *     properties so other components can lay out around the strip
 *   - Re-runs the offset calculation on resize / language change /
 *     strip resize via a ResizeObserver
 *
 * Does NOT own:
 *   - Progress percentage text (.progress-label) — owned by
 *     sidebar-progress.ts (`updateProgressBadges`)
 *   - Horizontal progress bar (.strip-progress-bar-fill) — same
 *   - Reading-time meta text (.reading-time-value) — owned by the
 *     ChapterMeta render path; live updates are no longer needed
 *     because the strip-completion pill conveys completion state
 *   - Document title — kept here as a side-effect of the scroll
 *     listener so the browser tab still reflects scroll progress
 *
 * Earlier revisions of this file wrote directly to
 * .progress-badge.textContent on every scroll tick, which destroyed
 * the badge's child nodes (SVG ring + percentage span) and left the
 * badge as a bare text node. We now leave that DOM alone.
 */

import { resolveLanguage } from '../i18n';

const SCROLL_THRESHOLD = 80;

// ── Language ────────────────────────────────────────────────────────────────

function getLang(): string {
  return resolveLanguage(
    new URLSearchParams(window.location.search).get('lang')
      || localStorage.getItem('yuval_language')
      || 'en'
  );
}

// Reference kept so the warning about unused imports doesn't fire
// during incremental cleanups; getLang() is still used downstream
// if other handlers in this file need it again.
void getLang;

// ── Init ────────────────────────────────────────────────────────────────────

export function initStickyHeader(controller: AbortController) {
  const topStrip = document.getElementById('chapter-top-strip');
  if (!topStrip) return;

  /* topStrip is non-null past the early return above; capture it in
     a typed local so the closures below get the narrowed type
     without re-asserting. */
  const strip: HTMLElement = topStrip;

  const siteHeader = document.getElementById('site-header');

  function updateStickyOffset(): void {
    const top = siteHeader?.offsetHeight ?? 64;
    document.documentElement.style.setProperty('--reading-sticky-top', `${top}px`);
    const stripH = strip.offsetHeight;
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

  // ── Document title ─────────────────────────────────────────────────────────

  const originalTitle = document.title;

  function updateDocumentTitle(pct: number): void {
    if (pct <= 0) {
      document.title = originalTitle;
      return;
    }

    document.title = `(${pct}%) ${originalTitle}`;
  }

  // ── Scroll handler ────────────────────────────────────────────────────────
  // Updates only:
  //   - .scrolled class on the sticky strip
  //   - document.title (browser tab text)
  // Progress percentage text + horizontal bar are updated by
  // sidebar-progress.ts on the same scroll event.

  function onScroll(): void {
    if (window.scrollY > SCROLL_THRESHOLD) {
      strip.classList.add('scrolled');
    } else {
      strip.classList.remove('scrolled');
    }

    updateDocumentTitle(calcPct());
  }

  // ── Completion ─────────────────────────────────────────────────────────────
  // The chapter-completed event is now consumed by
  // sidebar-progress.ts (it reveals the .strip-completion pill and
  // pins the position bar to 100%). All this listener still does is
  // update the document title, which is purely cosmetic.

  function onChapterComplete(): void {
    updateDocumentTitle(100);
  }

  window.addEventListener('chapter-completed', onChapterComplete, {
    signal: controller.signal,
  });

  // ── Listeners ─────────────────────────────────────────────────────────────

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
  stripObserver.observe(strip);
  controller.signal.addEventListener('abort', () => stripObserver.disconnect());

  updateStickyOffset();
  onScroll();
}