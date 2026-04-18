import { t, getI18nDirection, resolveLanguage } from '../i18n';

const TOAST_DURATION = 1800;

function getLang(): string {
  return resolveLanguage(
    new URLSearchParams(window.location.search).get('lang')
      || localStorage.getItem('yuval_language')
      || 'en'
  );
}

function tr(key: string, params?: Record<string, string | number>) {
  return t(key, getLang(), params);
}

// ── Toast ───────────────────────────────────────────────────────────────────

let toastEl: HTMLElement | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function getToast(): HTMLElement {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'kbd-nav-toast';
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

// ── Navigation ──────────────────────────────────────────────────────────────

function getNavUrl(dir: 'prev' | 'next'): string | null {
  return document.querySelector<HTMLAnchorElement>(
    `.chapter-nav-link[data-nav="${dir}"]`
  )?.href || null;
}

async function navigate(dir: 'prev' | 'next') {
  const url = getNavUrl(dir);
  if (!url) return;

  const loadFn = (window as any).yuvalLoadChapter as ((url: string) => Promise<void>) | undefined;
  const chapterNum = url.match(/\/(\d+)(?:\?|$)/)?.[1] ?? '';

  showToast(tr('keyboard.chapterNav', { n: chapterNum }));

  if (loadFn) {
    await loadFn(url);
  } else {
    window.location.href = url;
  }
}

// ── Init ────────────────────────────────────────────────────────────────────

export function initKeyboardNav(signal: AbortSignal) {
  const handler = async (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const isRtl = getI18nDirection(getLang()) === 'rtl';

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
        const state = document.body.classList.toggle('reading-immersive');
        showToast(state ? tr('keyboard.focusOn') : tr('keyboard.focusOff'));
        break;
      }

      case 'z':
      case 'Z': {
        const state = document.body.classList.toggle('reading-zen');
        document.body.classList.toggle('reading-immersive', state);
        showToast(state ? tr('keyboard.zenOn') : tr('keyboard.zenOff'));
        break;
      }

      case 'h':
      case 'H': {
        document.getElementById('hl-panel-fab-btn')?.click();
        showToast(tr('keyboard.highlights'));
        break;
      }

      case 's':
      case 'S': {
        document.getElementById('stats-fab-btn')?.click();
        showToast(tr('keyboard.stats'));
        break;
      }

      case 'b':
      case 'B': {
        document.getElementById('bm-fab-btn')?.click();
        showToast(tr('keyboard.bookmarks'));
        break;
      }

      case 'Escape':
        document.body.classList.remove('reading-zen', 'reading-immersive');
        showToast(tr('keyboard.normalMode'));
        break;

      case '?':
        showShortcutsPanel();
        break;
    }
  };

  document.addEventListener('keydown', handler, { signal });
}

// ── Shortcuts panel ─────────────────────────────────────────────────────────

function showShortcutsPanel() {
  if (document.getElementById('kbd-shortcuts-overlay')) return;

  const dir = getI18nDirection(getLang());

  const shortcuts = [
    { key: '← →', label: 'keyboard.shortcut.nav' },
    { key: 'F', label: 'keyboard.shortcut.focus' },
    { key: 'Z', label: 'keyboard.shortcut.zen' },
    { key: '/', label: 'keyboard.shortcut.search' },
    { key: 'H', label: 'keyboard.shortcut.highlights' },
    { key: 'B', label: 'keyboard.shortcut.bookmarks' },
    { key: 'S', label: 'keyboard.shortcut.stats' },
    { key: 'R', label: 'keyboard.shortcut.replay' },
    { key: '?', label: 'keyboard.shortcut.help' },
    { key: 'Esc', label: 'keyboard.shortcut.escape' },
  ];

  const overlay = document.createElement('div');
  overlay.id = 'kbd-shortcuts-overlay';
  overlay.setAttribute('dir', dir);

  overlay.innerHTML = `
    <div id="kbd-shortcuts-modal">
      <h2>
        ${tr('keyboard.shortcutsTitle')}
        <button id="kbd-shortcuts-close">✕</button>
      </h2>

      ${shortcuts.map(s => `
        <div class="kbd-row">
          <kbd>${s.key}</kbd>
          <span>${tr(s.label)}</span>
        </div>
      `).join('')}
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();

  document.getElementById('kbd-shortcuts-close')?.addEventListener('click', close);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) close();
  });
}