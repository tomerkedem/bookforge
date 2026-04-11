const SCROLL_THRESHOLD = 80;

/**
 * Initialize sticky header behavior.
 * Adds 'scrolled' class on scroll, updates progress percentage display.
 */
export function initStickyHeader(controller: AbortController) {
  const header = document.getElementById('chapter-header');
  if (!header) return;

  const progressFill = document.getElementById('header-progress-fill');
  const progressHe = document.getElementById('progress-badge-he');
  const progressEn = document.getElementById('progress-badge-en');

  function calcPct(): number {
    const container = document.getElementById('chapter-container');
    if (container) {
      // offsetTop is absolute — stable across scroll events
      const containerTop    = container.offsetTop;
      const containerHeight = container.offsetHeight;
      const scrollable      = containerHeight - window.innerHeight;

      // Content shorter than viewport → already fully visible
      if (scrollable <= 0) return 100;

      const scrolledInto = window.scrollY - containerTop;
      if (scrolledInto <= 0) return 0;

      return Math.min(100, Math.round((scrolledInto / scrollable) * 100));
    }

    // Fallback: full page
    const pageH = document.documentElement.scrollHeight - window.innerHeight;
    return pageH > 0 ? Math.min(100, Math.round((window.scrollY / pageH) * 100)) : 0;
  }

  function onScroll() {
    if (window.scrollY > SCROLL_THRESHOLD) {
      header!.classList.add('scrolled');
    } else {
      header!.classList.remove('scrolled');
    }

    const pct  = calcPct();
    const text = `${pct}%`;

    if (progressHe) {
      progressHe.textContent = text;
      progressHe.style.opacity = pct > 0 ? '1' : '0';
      progressHe.style.transform = pct > 0 ? 'scale(1)' : 'scale(0.8)';
    }
    if (progressEn) {
      progressEn.textContent = text;
      progressEn.style.opacity = pct > 0 ? '1' : '0';
      progressEn.style.transform = pct > 0 ? 'scale(1)' : 'scale(0.8)';
    }
    if (progressFill) progressFill.style.width = `${pct}%`;
  }

  window.addEventListener('scroll', onScroll, { passive: true, signal: controller.signal });
  onScroll();
}
