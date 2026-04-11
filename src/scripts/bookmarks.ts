/**
 * Bookmarks — save any paragraph/heading in the chapter.
 * Right-click or long-press → "Bookmark this" → saves element + scroll position.
 * FAB button "🔖" shows all bookmarks for current book, click to jump.
 */

type LangKey = 'he' | 'en' | 'es';

function getLang(): LangKey {
  return (new URLSearchParams(window.location.search).get('lang')
    || localStorage.getItem('yuval_language')
    || 'en') as LangKey;
}

function getCurrentBook(): string {
  return document.getElementById('chapter-container')?.dataset.book || '';
}

function getCurrentChapter(): number {
  return parseInt(
    document.getElementById('chapter-container')?.dataset.chapterId || '0', 10
  );
}

// ── i18n ─────────────────────────────────────────────────────────────────────

const i18n: Record<LangKey, {
  title: string;
  empty: string;
  emptyHint: string;
  close: string;
  addBookmark: string;
  removeBookmark: string;
  bookmarkAdded: string;
  chapterLabel: (n: number) => string;
  dir: 'rtl' | 'ltr';
}> = {
  he: {
    title: 'סימניות',
    empty: 'אין סימניות עדיין',
    emptyHint: 'לחץ לחיצה ימנית על כל פסקה כדי להוסיף סימנייה',
    close: 'סגור',
    addBookmark: '🔖 הוסף סימנייה',
    removeBookmark: 'הסר סימנייה',
    bookmarkAdded: 'סימנייה נשמרה',
    chapterLabel: (n) => `פרק ${n}`,
    dir: 'rtl',
  },
  es: {
    title: 'Marcadores',
    empty: 'Aún no hay marcadores',
    emptyHint: 'Clic derecho en cualquier párrafo para marcar',
    close: 'Cerrar',
    addBookmark: '🔖 Añadir marcador',
    removeBookmark: 'Quitar marcador',
    bookmarkAdded: 'Marcador guardado',
    chapterLabel: (n) => `Capítulo ${n}`,
    dir: 'ltr',
  },
  en: {
    title: 'Bookmarks',
    empty: 'No bookmarks yet',
    emptyHint: 'Right-click any paragraph to bookmark it',
    close: 'Close',
    addBookmark: '🔖 Add bookmark',
    removeBookmark: 'Remove bookmark',
    bookmarkAdded: 'Bookmark saved',
    chapterLabel: (n) => `Chapter ${n}`,
    dir: 'ltr',
  },
};

function tr() { return i18n[getLang()]; }

// ── Types ─────────────────────────────────────────────────────────────────────

interface Bookmark {
  id: string;
  chapterId: number;
  text: string;       // first ~80 chars of element text
  scrollY: number;    // scroll position at time of bookmarking
  timestamp: number;
}

// ── Storage ───────────────────────────────────────────────────────────────────

function storageKey(book: string): string {
  return `yuval_bookmarks_${book}`;
}

function loadBookmarks(book: string): Bookmark[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey(book)) || '[]');
  } catch { return []; }
}

function saveBookmarks(book: string, list: Bookmark[]): void {
  localStorage.setItem(storageKey(book), JSON.stringify(list));
}

function addBookmark(el: Element): void {
  const book = getCurrentBook();
  const chapterId = getCurrentChapter();
  const text = (el.textContent || '').trim().slice(0, 100);
  if (!text) return;

  const list = loadBookmarks(book);

  // Avoid exact duplicate text in same chapter
  if (list.some(b => b.chapterId === chapterId && b.text === text)) {
    removeBookmarkByText(text, chapterId);
    return;
  }

  const bm: Bookmark = {
    id: `bm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    chapterId,
    text,
    scrollY: window.scrollY,
    timestamp: Date.now(),
  };

  list.push(bm);
  saveBookmarks(book, list);
  markElement(el, bm.id);
  showToast(tr().bookmarkAdded);
  updateBadge();
}

function removeBookmarkByText(text: string, chapterId: number): void {
  const book = getCurrentBook();
  const list = loadBookmarks(book).filter(
    b => !(b.chapterId === chapterId && b.text === text)
  );
  saveBookmarks(book, list);
  updateBadge();
}

function removeBookmark(id: string): void {
  const book = getCurrentBook();
  const list = loadBookmarks(book).filter(b => b.id !== id);
  saveBookmarks(book, list);
  // Remove DOM marker if present
  document.querySelectorAll<HTMLElement>(`[data-bm-id="${id}"]`).forEach(el => {
    el.removeAttribute('data-bm-id');
    el.style.borderLeft = '';
    el.style.paddingLeft = '';
  });
  updateBadge();
}

// ── DOM markers ───────────────────────────────────────────────────────────────

function markElement(el: Element, bmId: string): void {
  (el as HTMLElement).dataset.bmId = bmId;
  applyMarkerStyle(el as HTMLElement);
}

function applyMarkerStyle(el: HTMLElement): void {
  const isDark = document.documentElement.classList.contains('dark');
  el.style.borderLeft = `3px solid ${isDark ? '#818cf8' : '#6366f1'}`;
  el.style.paddingLeft = '10px';
  el.style.transition = 'border-color 0.2s, padding 0.2s';
}

function restoreMarkers(): void {
  const book = getCurrentBook();
  const chapterId = getCurrentChapter();
  const bookmarks = loadBookmarks(book).filter(b => b.chapterId === chapterId);
  if (!bookmarks.length) return;

  const contentEl = document.getElementById('chapter-container');
  if (!contentEl) return;

  const paras = contentEl.querySelectorAll('p, h1, h2, h3, h4, li, blockquote');
  paras.forEach(el => {
    const text = (el.textContent || '').trim().slice(0, 100);
    const bm = bookmarks.find(b => b.text === text);
    if (bm) markElement(el, bm.id);
  });
}

// ── Context menu ──────────────────────────────────────────────────────────────

let contextMenu: HTMLElement | null = null;
let longPressTimer: ReturnType<typeof setTimeout> | null = null;

function getContextMenu(): HTMLElement {
  if (!contextMenu) {
    contextMenu = document.createElement('div');
    contextMenu.id = 'bm-context-menu';
    document.body.appendChild(contextMenu);
  }
  return contextMenu;
}

function showContextMenu(x: number, y: number, targetEl: Element): void {
  const menu = getContextMenu();
  const labels = tr();
  const book = getCurrentBook();
  const chapterId = getCurrentChapter();
  const text = (targetEl.textContent || '').trim().slice(0, 100);
  const existing = loadBookmarks(book).find(b => b.chapterId === chapterId && b.text === text);

  menu.setAttribute('dir', labels.dir);
  menu.innerHTML = `
    <button class="bm-ctx-btn" id="bm-ctx-action">
      ${existing ? labels.removeBookmark : labels.addBookmark}
    </button>
  `;

  // Position
  const vw = window.innerWidth;
  const menuW = 180;
  menu.style.left = `${Math.min(x, vw - menuW - 12)}px`;
  menu.style.top  = `${y + window.scrollY}px`;
  menu.classList.add('open');

  document.getElementById('bm-ctx-action')!.onclick = () => {
    if (existing) {
      removeBookmark(existing.id);
      (targetEl as HTMLElement).style.borderLeft = '';
      (targetEl as HTMLElement).style.paddingLeft = '';
    } else {
      addBookmark(targetEl);
    }
    hideContextMenu();
  };
}

function hideContextMenu(): void {
  contextMenu?.classList.remove('open');
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function showToast(msg: string): void {
  const t = document.createElement('div');
  t.className = 'bm-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('visible'));
  setTimeout(() => { t.classList.remove('visible'); setTimeout(() => t.remove(), 300); }, 1800);
}

// ── Badge ─────────────────────────────────────────────────────────────────────

function updateBadge(): void {
  const badge = document.getElementById('bm-fab-badge');
  if (!badge) return;
  const total = loadBookmarks(getCurrentBook()).length;
  badge.textContent = String(total);
  badge.style.display = total > 0 ? '' : 'none';
}

// ── Panel ─────────────────────────────────────────────────────────────────────

function openPanel(): void {
  renderPanel();
  document.getElementById('bm-overlay')?.classList.add('open');
  document.getElementById('bm-panel')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePanel(): void {
  document.getElementById('bm-overlay')?.classList.remove('open');
  document.getElementById('bm-panel')?.classList.remove('open');
  document.body.style.overflow = '';
}

function renderPanel(): void {
  const panel = document.getElementById('bm-panel');
  if (!panel) return;

  const labels = tr();
  const book = getCurrentBook();
  const bookmarks = loadBookmarks(book).sort((a, b) => a.chapterId - b.chapterId || a.timestamp - b.timestamp);

  panel.setAttribute('dir', labels.dir);
  panel.innerHTML = `
    <div id="bm-panel-header">
      <span id="bm-panel-title">🔖 ${labels.title}</span>
      <button id="bm-panel-close" type="button" aria-label="${labels.close}">✕</button>
    </div>
    <div id="bm-panel-body"></div>
  `;

  document.getElementById('bm-panel-close')?.addEventListener('click', closePanel);

  const body = document.getElementById('bm-panel-body')!;

  if (!bookmarks.length) {
    const isRtl = labels.dir === 'rtl';
    const steps = isRtl
      ? ['לחץ לחיצה ימנית על פסקה', 'בחר "הוסף סימנייה"', 'לחץ על הסימנייה לקפיצה אליה']
      : ['Right-click any paragraph', 'Choose "Add bookmark"', 'Click bookmark to jump there'];
    body.innerHTML = `
      <div class="bm-empty">
        <span class="bm-empty-icon">🔖</span>
        <span class="bm-empty-text">${labels.empty}</span>
        <span class="bm-empty-hint">${labels.emptyHint}</span>
        <div style="margin-top:16px;width:100%;display:flex;flex-direction:column;gap:8px">
          ${steps.map((s, i) => `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--yuval-bg-secondary,#f9f9f9);border-radius:8px;font-size:12px;color:var(--yuval-text-secondary,#555);text-align:${isRtl ? 'right' : 'left'}">
              <span style="width:20px;height:20px;border-radius:50%;background:#6366f1;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">${i + 1}</span>
              ${s}
            </div>
          `).join('')}
        </div>
      </div>
    `;
    return;
  }

  // Group by chapter
  const byChapter = new Map<number, Bookmark[]>();
  bookmarks.forEach(bm => {
    if (!byChapter.has(bm.chapterId)) byChapter.set(bm.chapterId, []);
    byChapter.get(bm.chapterId)!.push(bm);
  });

  byChapter.forEach((bms, chapterId) => {
    const group = document.createElement('div');
    group.className = 'bm-chapter-group';

    const chLabel = document.createElement('div');
    chLabel.className = 'bm-chapter-label';
    chLabel.textContent = labels.chapterLabel(chapterId);
    group.appendChild(chLabel);

    bms.forEach(bm => {
      const item = document.createElement('div');
      item.className = 'bm-item';
      item.innerHTML = `
        <span class="bm-item-icon">🔖</span>
        <div class="bm-item-body">
          <div class="bm-item-text">${bm.text}</div>
          <div class="bm-item-meta">${new Date(bm.timestamp).toLocaleDateString()}</div>
        </div>
        <button class="bm-remove-btn" data-bm-id="${bm.id}" aria-label="${labels.removeBookmark}">✕</button>
      `;

      // Jump to bookmark
      item.querySelector('.bm-item-body')!.addEventListener('click', () => {
        jumpToBookmark(bm);
      });

      // Remove
      item.querySelector('.bm-remove-btn')!.addEventListener('click', (e) => {
        e.stopPropagation();
        removeBookmark(bm.id);
        item.remove();
        if (!body.querySelector('.bm-item')) {
          body.innerHTML = `
            <div class="bm-empty">
              <span class="bm-empty-icon">🔖</span>
              <span class="bm-empty-text">${labels.empty}</span>
            </div>
          `;
        }
      });

      group.appendChild(item);
    });

    body.appendChild(group);
  });
}

function jumpToBookmark(bm: Bookmark): void {
  closePanel();
  const book = getCurrentBook();
  const lang = getLang();
  const currentChapter = getCurrentChapter();

  if (bm.chapterId === currentChapter) {
    // Same chapter — scroll to saved position
    window.scrollTo({ top: bm.scrollY, behavior: 'smooth' });
    // Flash the element if still visible
    const marker = document.querySelector<HTMLElement>(`[data-bm-id="${bm.id}"]`);
    if (marker) {
      marker.style.outline = '2px solid #6366f1';
      setTimeout(() => { marker.style.outline = ''; }, 1500);
    }
  } else {
    // Different chapter — navigate
    const url = lang === 'he'
      ? `/read/${book}/${bm.chapterId}?lang=he`
      : `/read/${book}/${bm.chapterId}`;

    if (typeof (window as any).yuvalLoadChapter === 'function') {
      (window as any).yuvalLoadChapter(url);
      setTimeout(() => window.scrollTo({ top: bm.scrollY, behavior: 'smooth' }), 500);
    } else {
      window.location.href = url;
    }
  }
}

// ── CSS ───────────────────────────────────────────────────────────────────────

function injectStyles(): void {
  if (document.getElementById('bm-styles')) return;
  const s = document.createElement('style');
  s.id = 'bm-styles';
  s.textContent = `
    /* ── FAB ── */
    #bm-fab-btn {
      position: fixed;
      bottom: 262px;
      right: 20px;
      z-index: 9980;
      width: 44px; height: 44px;
      border-radius: 50%;
      background: var(--yuval-surface, #fff);
      border: 1px solid var(--yuval-border, #e5e7eb);
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      color: var(--yuval-text-secondary, #555);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 17px;
      transition: transform 0.2s, box-shadow 0.2s, background 0.15s;
      position: fixed;
    }
    #bm-fab-btn:hover {
      transform: scale(1.08);
      box-shadow: 0 4px 16px rgba(0,0,0,0.14);
      background: var(--yuval-bg-secondary, #f3f4f6);
    }
    :is(.dark) #bm-fab-btn { background: #2a2a2a; border-color: rgba(255,255,255,0.1); }
    [dir="rtl"] #bm-fab-btn { right: auto; left: 20px; }

    #bm-fab-btn .bm-fab-badge {
      position: absolute;
      top: -4px; right: -4px;
      background: #6366f1;
      color: #fff;
      font-size: 10px; font-weight: 700;
      border-radius: 100px;
      padding: 1px 5px;
      min-width: 18px;
      text-align: center;
      line-height: 16px;
    }

    /* ── Context menu ── */
    #bm-context-menu {
      position: absolute;
      z-index: 9999;
      background: var(--yuval-surface, #fff);
      border: 1px solid var(--yuval-border, #e5e7eb);
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.14);
      padding: 4px;
      min-width: 170px;
      opacity: 0;
      pointer-events: none;
      transform: scale(0.95);
      transition: opacity 0.15s, transform 0.15s;
    }
    #bm-context-menu.open { opacity: 1; pointer-events: auto; transform: scale(1); }
    :is(.dark) #bm-context-menu { background: #2a2a2a; border-color: rgba(255,255,255,0.1); }

    .bm-ctx-btn {
      width: 100%;
      padding: 9px 14px;
      text-align: left;
      background: none; border: none;
      font-size: 13px; font-weight: 500;
      color: var(--yuval-text, #1a1a1a);
      cursor: pointer;
      border-radius: 7px;
      transition: background 0.12s;
    }
    .bm-ctx-btn:hover { background: var(--yuval-bg-secondary, #f3f4f6); }
    [dir="rtl"] .bm-ctx-btn { text-align: right; }

    /* ── Overlay ── */
    #bm-overlay {
      position: fixed; inset: 0; z-index: 9990;
      background: rgba(0,0,0,0.45);
      backdrop-filter: blur(4px);
      opacity: 0; pointer-events: none;
      transition: opacity 0.25s;
    }
    #bm-overlay.open { opacity: 1; pointer-events: auto; }

    /* ── Panel ── */
    #bm-panel {
      position: fixed;
      top: 0; bottom: 0; right: 0;
      width: min(380px, 90vw);
      z-index: 9991;
      background: var(--yuval-surface, #fff);
      border-left: 1px solid var(--yuval-border, #e5e7eb);
      box-shadow: -8px 0 40px rgba(0,0,0,0.12);
      display: flex; flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
    }
    #bm-panel.open { transform: translateX(0); }
    :is(.dark) #bm-panel { background: #1e1e1e; border-color: rgba(255,255,255,0.08); }
    [dir="rtl"] #bm-panel { right: auto; left: 0; border-left: none; border-right: 1px solid var(--yuval-border,#e5e7eb); transform: translateX(-100%); }
    [dir="rtl"] #bm-panel.open { transform: translateX(0); }

    #bm-panel-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 20px 14px;
      border-bottom: 1px solid var(--yuval-border, #e5e7eb);
      flex-shrink: 0;
    }
    #bm-panel-title { font-size: 15px; font-weight: 700; color: var(--yuval-text,#1a1a1a); }
    #bm-panel-close {
      background: none; border: none;
      color: var(--yuval-text-tertiary,#888); font-size: 16px;
      cursor: pointer; width: 28px; height: 28px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 6px; transition: background 0.15s;
    }
    #bm-panel-close:hover { background: var(--yuval-bg-secondary,#f3f4f6); }

    #bm-panel-body { flex: 1; overflow-y: auto; padding: 16px 16px 24px; }

    .bm-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 48px 16px; text-align: center; }
    .bm-empty-icon { font-size: 36px; opacity: 0.3; }
    .bm-empty-text { font-size: 14px; font-weight: 600; color: var(--yuval-text-secondary,#555); }
    .bm-empty-hint { font-size: 12px; color: var(--yuval-text-muted,#999); line-height: 1.5; }

    .bm-chapter-group { margin-bottom: 20px; }
    .bm-chapter-label {
      font-size: 11px; font-weight: 700;
      letter-spacing: 0.08em; text-transform: uppercase;
      color: var(--yuval-text-muted,#999);
      margin-bottom: 8px; padding: 0 2px;
    }

    .bm-item {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 10px 12px;
      border-radius: 10px;
      background: var(--yuval-bg-secondary,#f9f9f9);
      border: 1px solid var(--yuval-border,#e5e7eb);
      margin-bottom: 6px;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }
    .bm-item:hover { background: var(--yuval-surface,#fff); border-color: #6366f1; }
    :is(.dark) .bm-item { background: #252525; border-color: rgba(255,255,255,0.07); }
    :is(.dark) .bm-item:hover { border-color: #818cf8; }

    .bm-item-icon { font-size: 14px; flex-shrink: 0; margin-top: 2px; }
    .bm-item-body { flex: 1; min-width: 0; }
    .bm-item-text {
      font-size: 13px; line-height: 1.5; color: var(--yuval-text,#1a1a1a);
      overflow: hidden; display: -webkit-box;
      -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    }
    .bm-item-meta { font-size: 11px; color: var(--yuval-text-muted,#999); margin-top: 3px; }
    .bm-remove-btn {
      background: none; border: none;
      color: var(--yuval-text-muted,#999); font-size: 13px;
      cursor: pointer; flex-shrink: 0;
      width: 22px; height: 22px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 4px; transition: background 0.12s, color 0.12s;
    }
    .bm-remove-btn:hover { background: #fee2e2; color: #dc2626; }

    /* ── Toast ── */
    .bm-toast {
      position: fixed; bottom: 24px; left: 50%;
      transform: translateX(-50%) translateY(8px);
      background: rgba(0,0,0,0.78); backdrop-filter: blur(8px);
      color: #fff; font-size: 13px; font-weight: 500;
      padding: 8px 18px; border-radius: 99px;
      z-index: 9999; pointer-events: none;
      opacity: 0; transition: opacity 0.2s, transform 0.2s;
    }
    .bm-toast.visible { opacity: 1; transform: translateX(-50%) translateY(0); }
  `;
  document.head.appendChild(s);
}

// ── Build DOM ─────────────────────────────────────────────────────────────────

function buildWidget(signal: AbortSignal): void {
  if (document.getElementById('bm-panel')) return;

  // FAB
  const fab = document.createElement('button');
  fab.id = 'bm-fab-btn';
  fab.type = 'button';
  fab.setAttribute('aria-label', 'Bookmarks');
  fab.innerHTML = `🔖<span class="bm-fab-badge" id="bm-fab-badge" style="display:none"></span>`;
  document.body.appendChild(fab);

  // Overlay + panel
  const overlay = document.createElement('div');
  overlay.id = 'bm-overlay';
  document.body.appendChild(overlay);

  const panel = document.createElement('div');
  panel.id = 'bm-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  document.body.appendChild(panel);

  fab.addEventListener('click', openPanel);
  overlay.addEventListener('click', closePanel);

  // Right-click on content
  document.addEventListener('contextmenu', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>(
      '#chapter-container p, #chapter-container h1, #chapter-container h2, #chapter-container h3, #chapter-container h4, #chapter-container li, #chapter-container blockquote'
    );
    if (!target) return;
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY, target);
  }, { signal });

  // Hide context menu on outside click
  document.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('#bm-context-menu')) hideContextMenu();
  }, { signal });

  // Keyboard ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideContextMenu();
      if (document.getElementById('bm-panel')?.classList.contains('open')) closePanel();
    }
  }, { signal });

  // Long-press for mobile
  document.addEventListener('touchstart', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>(
      '#chapter-container p, #chapter-container h1, #chapter-container h2, #chapter-container h3, #chapter-container li, #chapter-container blockquote'
    );
    if (!target) return;
    longPressTimer = setTimeout(() => {
      const touch = e.touches[0];
      showContextMenu(touch.clientX, touch.clientY, target);
    }, 600);
  }, { signal, passive: true });

  document.addEventListener('touchend', () => {
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
  }, { signal, passive: true });
}

// ── Init ──────────────────────────────────────────────────────────────────────

export function initBookmarks(signal: AbortSignal): void {
  injectStyles();
  buildWidget(signal);
  restoreMarkers();
  updateBadge();

  // Re-apply after chapter navigation
  window.addEventListener('chapter-content-swapped', () => {
    restoreMarkers();
    updateBadge();
  }, { signal });
}
