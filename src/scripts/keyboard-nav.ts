/**
 * Keyboard navigation for the reading experience.
 *
 * Shortcuts:
 *   ← / →     Previous / next chapter (respects RTL)
 *   F          Toggle immersive (focus) reading mode
 *   H          Open highlights panel
 *   S          Open reading stats
 *   B          Open bookmarks panel
 *   /          Open search
 *   Escape     Exit immersive mode / close open panels
 */

const TOAST_DURATION = 1800; // ms

let toastEl: HTMLElement | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function getToast(): HTMLElement {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'kbd-nav-toast';
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastEl);
  }
  return toastEl;
}

function showToast(msg: string) {
  const el = getToast();
  el.textContent = msg;
  el.classList.add('visible');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), TOAST_DURATION);
}

function getNavUrl(dir: 'prev' | 'next'): string | null {
  const link = document.querySelector<HTMLAnchorElement>(
    `.chapter-nav-link[data-nav="${dir}"]`
  );
  return link?.href || null;
}

async function navigate(dir: 'prev' | 'next') {
  const url = getNavUrl(dir);
  if (!url) return;

  const loadFn = (window as any).yuvalLoadChapter as
    | ((url: string) => Promise<void>)
    | undefined;

  const arrow = dir === 'next' ? '→' : '←';
  const chapterNum = url.match(/\/(\d+)(?:\?|$)/)?.[1];
  showToast(`${arrow}  Chapter ${chapterNum ?? ''}`);

  if (loadFn) {
    await loadFn(url);
  } else {
    window.location.href = url;
  }
}

export function initKeyboardNav(signal: AbortSignal) {
  // Inject toast styles once
  if (!document.getElementById('kbd-nav-styles')) {
    const style = document.createElement('style');
    style.id = 'kbd-nav-styles';
    style.textContent = `
      #kbd-nav-toast {
        position: fixed;
        bottom: 88px;
        left: 50%;
        transform: translateX(-50%) translateY(8px);
        background: var(--yuval-surface, #1e1e1e);
        color: var(--yuval-text, #ededed);
        border: 1px solid var(--yuval-border, #333);
        border-radius: 8px;
        padding: 8px 18px;
        font-size: 13px;
        font-weight: 500;
        letter-spacing: 0.02em;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease, transform 0.2s ease;
        z-index: 9999;
        white-space: nowrap;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      }
      #kbd-nav-toast.visible {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    `;
    document.head.appendChild(style);
  }

  const handler = async (e: KeyboardEvent) => {
    // Skip when typing in inputs
    const target = e.target as HTMLElement;
    if (
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
      target.isContentEditable
    ) return;

    // Skip modifier combos
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const isRtl = document.documentElement.dir === 'rtl';

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        await navigate(isRtl ? 'prev' : 'next');
        break;

      case 'ArrowLeft':
        e.preventDefault();
        await navigate(isRtl ? 'next' : 'prev');
        break;

      case 'f':
      case 'F': {
        const isImmersive = document.body.classList.toggle('reading-immersive');
        showToast(isImmersive ? '⬛  Focus mode' : '⬜  Normal mode');
        break;
      }

      case 'h':
      case 'H': {
        const hlBtn = document.getElementById('hl-panel-fab-btn');
        if (hlBtn) { hlBtn.click(); showToast('💡  Highlights'); }
        break;
      }

      case 's':
      case 'S': {
        const statsBtn = document.getElementById('stats-fab-btn');
        if (statsBtn) { statsBtn.click(); showToast('📊  Stats'); }
        break;
      }

      case 'b':
      case 'B': {
        const bmBtn = document.getElementById('bm-fab-btn');
        if (bmBtn) { bmBtn.click(); showToast('🔖  Bookmarks'); }
        break;
      }

      case 'z':
      case 'Z': {
        const isZen = document.body.classList.toggle('reading-zen');
        // Zen also hides sidebars
        document.body.classList.toggle('reading-immersive', isZen);
        showToast(isZen ? '🧘  Zen mode' : '⬜  Normal mode');
        break;
      }

      case 'Escape':
        if (document.body.classList.contains('reading-zen')) {
          document.body.classList.remove('reading-zen', 'reading-immersive');
          showToast('⬜  Normal mode');
        } else if (document.body.classList.contains('reading-immersive')) {
          document.body.classList.remove('reading-immersive');
          showToast('⬜  Normal mode');
        }
        break;
    }
  };

  document.addEventListener('keydown', handler, { signal });

  // ── ? key: show shortcuts panel ──────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement;
    if (['INPUT','TEXTAREA','SELECT'].includes(target.tagName) || target.isContentEditable) return;
    if (e.key === '?') showShortcutsPanel();
  }, { signal });
}

// ── Shortcuts panel ───────────────────────────────────────────────────────────

function showShortcutsPanel(): void {
  if (document.getElementById('kbd-shortcuts-overlay')) return;

  const isRtl = document.documentElement.dir === 'rtl';

  const shortcuts = [
    { key: '← →',    desc_he: 'פרק קודם / הבא',           desc_en: 'Prev / next chapter' },
    { key: 'F',       desc_he: 'מצב מיקוד',                desc_en: 'Focus / immersive mode' },
    { key: 'Z',       desc_he: 'מצב Zen',                  desc_en: 'Zen reading mode' },
    { key: '/',       desc_he: 'חיפוש',                     desc_en: 'Search' },
    { key: 'H',       desc_he: 'פאנל הדגשות',              desc_en: 'Highlights panel' },
    { key: 'B',       desc_he: 'סימניות',                  desc_en: 'Bookmarks' },
    { key: 'S',       desc_he: 'סטטיסטיקות קריאה',         desc_en: 'Reading stats' },
    { key: '?',       desc_he: 'קיצורי מקלדת',             desc_en: 'Keyboard shortcuts' },
    { key: 'Esc',     desc_he: 'סגור / יציאה ממצב',        desc_en: 'Close / exit mode' },
  ];

  const style = document.createElement('style');
  style.id = 'kbd-shortcuts-styles';
  style.textContent = `
    #kbd-shortcuts-overlay {
      position: fixed; inset: 0; z-index: 10000;
      background: rgba(0,0,0,0.5); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      animation: kbdFadeIn 0.2s ease;
    }
    @keyframes kbdFadeIn { from { opacity:0 } to { opacity:1 } }
    #kbd-shortcuts-modal {
      background: var(--yuval-surface, #fff);
      border: 1px solid var(--yuval-border, #e5e7eb);
      border-radius: 18px;
      box-shadow: 0 24px 60px rgba(0,0,0,0.2);
      padding: 28px 28px 24px;
      width: min(420px, 90vw);
      max-height: 85vh;
      overflow-y: auto;
    }
    :is(.dark) #kbd-shortcuts-modal {
      background: #1e1e1e;
      border-color: rgba(255,255,255,0.08);
    }
    #kbd-shortcuts-modal h2 {
      font-size: 16px; font-weight: 800;
      color: var(--yuval-text, #1a1a1a);
      margin-bottom: 20px;
      display: flex; justify-content: space-between; align-items: center;
    }
    #kbd-shortcuts-close {
      background: none; border: none;
      color: var(--yuval-text-muted, #999);
      font-size: 18px; cursor: pointer;
      width: 28px; height: 28px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 6px;
    }
    #kbd-shortcuts-close:hover { background: var(--yuval-bg-secondary, #f3f4f6); }
    .kbd-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 9px 0;
      border-bottom: 1px solid var(--yuval-border, #e5e7eb);
      gap: 12px;
    }
    .kbd-row:last-child { border-bottom: none; }
    .kbd-key {
      background: var(--yuval-bg-secondary, #f3f4f6);
      border: 1px solid var(--yuval-border-secondary, #e0e0e0);
      border-radius: 6px;
      padding: 3px 10px;
      font-size: 12px; font-weight: 700;
      font-family: ui-monospace, monospace;
      color: var(--yuval-text, #1a1a1a);
      white-space: nowrap;
      flex-shrink: 0;
    }
    :is(.dark) .kbd-key { background: #2a2a2a; border-color: rgba(255,255,255,0.1); }
    .kbd-desc {
      font-size: 13px; color: var(--yuval-text-secondary, #555);
      text-align: ${isRtl ? 'right' : 'left'};
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = 'kbd-shortcuts-overlay';
  overlay.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
  overlay.innerHTML = `
    <div id="kbd-shortcuts-modal">
      <h2>
        <span>${isRtl ? '⌨️ קיצורי מקלדת' : '⌨️ Keyboard Shortcuts'}</span>
        <button id="kbd-shortcuts-close">✕</button>
      </h2>
      ${shortcuts.map(s => `
        <div class="kbd-row">
          ${isRtl ? `<span class="kbd-desc">${s.desc_he}</span>` : ''}
          <kbd class="kbd-key">${s.key}</kbd>
          ${!isRtl ? `<span class="kbd-desc">${s.desc_en}</span>` : ''}
        </div>
      `).join('')}
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => { overlay.remove(); style.remove(); };
  document.getElementById('kbd-shortcuts-close')!.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' || e.key === '?') close();
  }, { once: true });
}
