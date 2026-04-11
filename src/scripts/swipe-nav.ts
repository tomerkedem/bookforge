/**
 * Swipe navigation for mobile reading.
 * Swipe left → next chapter, swipe right → prev chapter.
 * Respects RTL: swipe left = prev in Hebrew.
 * Min distance 60px, max vertical drift 80px, ignores scrollable elements.
 */

const MIN_X = 60;   // minimum horizontal swipe distance
const MAX_Y = 80;   // maximum vertical drift allowed
const EDGE  = 40;   // ignore swipes starting near screen edge (scrollbars)

interface Point { x: number; y: number; }

function getNavUrl(dir: 'prev' | 'next'): string | null {
  return document.querySelector<HTMLAnchorElement>(
    `.chapter-nav-link[data-nav="${dir}"]`
  )?.href || null;
}

async function navigate(dir: 'prev' | 'next'): Promise<void> {
  const url = getNavUrl(dir);
  if (!url) return;
  const loadFn = (window as any).yuvalLoadChapter as ((u: string) => Promise<void>) | undefined;
  if (loadFn) await loadFn(url);
  else window.location.href = url;
}

function showSwipeHint(dir: 'prev' | 'next'): void {
  const isRtl = document.documentElement.dir === 'rtl';
  const arrow = dir === 'next'
    ? (isRtl ? '→' : '→')
    : (isRtl ? '←' : '←');

  const hint = document.createElement('div');
  hint.style.cssText = `
    position: fixed;
    top: 50%;
    ${dir === 'next' ? 'right: 16px' : 'left: 16px'};
    transform: translateY(-50%);
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(6px);
    color: #fff;
    font-size: 24px;
    width: 44px; height: 44px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    z-index: 9999;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s;
  `;
  hint.textContent = arrow;
  document.body.appendChild(hint);
  requestAnimationFrame(() => { hint.style.opacity = '1'; });
  setTimeout(() => {
    hint.style.opacity = '0';
    setTimeout(() => hint.remove(), 200);
  }, 400);
}

export function initSwipeNav(signal: AbortSignal): void {
  // Only on touch devices
  if (!('ontouchstart' in window)) return;

  let start: Point | null = null;
  let startTarget: EventTarget | null = null;

  document.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    // Ignore swipes starting near screen edges
    if (touch.clientX < EDGE || touch.clientX > window.innerWidth - EDGE) return;
    start = { x: touch.clientX, y: touch.clientY };
    startTarget = e.target;
  }, { signal, passive: true });

  document.addEventListener('touchend', async (e) => {
    if (!start) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    start = null;

    // Must be horizontal enough
    if (Math.abs(dx) < MIN_X || Math.abs(dy) > MAX_Y) return;

    // Ignore if inside a horizontally-scrollable element
    const el = startTarget as HTMLElement | null;
    if (el?.closest('.toc-list, pre, table, [data-no-swipe]')) return;

    // Don't trigger if text is selected
    if (window.getSelection()?.toString()) return;

    const isRtl = document.documentElement.dir === 'rtl';
    const swipedLeft  = dx < 0;   // finger moved left
    const swipedRight = dx > 0;   // finger moved right

    // LTR: left=next, right=prev | RTL: left=prev, right=next
    let dir: 'prev' | 'next';
    if (isRtl) {
      dir = swipedLeft ? 'prev' : 'next';
    } else {
      dir = swipedLeft ? 'next' : 'prev';
    }

    if (!getNavUrl(dir)) return; // chapter doesn't exist

    showSwipeHint(dir);
    await navigate(dir);
  }, { signal, passive: true });
}
