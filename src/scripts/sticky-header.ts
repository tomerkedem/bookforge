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

  function onScroll() {
    if (window.scrollY > SCROLL_THRESHOLD) {
      header!.classList.add('scrolled');
    } else {
      header!.classList.remove('scrolled');
    }

    const contentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = contentHeight > 0 ? Math.min(100, Math.max(0, Math.round((window.scrollY / contentHeight) * 100))) : 0;
    const text = `${pct}%`;

    if (progressHe) progressHe.textContent = text;
    if (progressEn) progressEn.textContent = text;
    if (progressFill) progressFill.style.width = `${pct}%`;
  }

  window.addEventListener('scroll', onScroll, { passive: true, signal: controller.signal });
  onScroll();
}
