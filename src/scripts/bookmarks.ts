/**
 * Bookmarks — dynamic i18n version
 */

import { t, getI18nDirection, resolveLanguage } from '../i18n';

// ── Language ────────────────────────────────────────────────────────────────

function getLang(): string {
  return resolveLanguage(
    new URLSearchParams(window.location.search).get('lang')
      || localStorage.getItem('yuval_language')
      || 'en'
  );
}

function tr(key: string, params?: Record<string, string | number>): string {
  return t(key, getLang(), params);
}

function getDir(): 'rtl' | 'ltr' {
  return getI18nDirection(getLang());
}

// ── Context ─────────────────────────────────────────────────────────────────

function getCurrentBook(): string {
  return document.getElementById('chapter-container')?.dataset.book || '';
}

function getCurrentChapter(): number {
  return parseInt(
    document.getElementById('chapter-container')?.dataset.chapterId || '0', 10
  );
}

// ── Types ───────────────────────────────────────────────────────────────────

interface Bookmark {
  id: string;
  chapterId: number;
  text: string;
  paragraphIndex: number;
  textHash: string;
  scrollY?: number;
  timestamp: number;
}

function getContentRoot(): HTMLElement | null {
  const lang = getLang();
  const container = document.getElementById('chapter-container');
  if (!container) return null;
  return (container.querySelector<HTMLElement>(`[data-lang="${lang}"]`) || container) as HTMLElement;
}

function getParagraphs(): HTMLElement[] {
  const root = getContentRoot();
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>('p'));
}

function paragraphIndexOf(el: Element): number {
  return getParagraphs().indexOf(el as HTMLElement);
}

function hashText(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h.toString(36);
}

function canonicalText(s: string): string {
  return s.trim().replace(/\s+/g, ' ').slice(0, 200);
}

function findParagraphFor(bm: Bookmark): HTMLElement | null {
  const paras = getParagraphs();
  if (!paras.length) return null;

  const byIndex = paras[bm.paragraphIndex];
  if (byIndex) {
    const canon = canonicalText(byIndex.textContent || '');
    if (hashText(canon) === bm.textHash) return byIndex;
  }

  const byHash = paras.find(p => hashText(canonicalText(p.textContent || '')) === bm.textHash);
  if (byHash) return byHash;

  const needle = bm.text.slice(0, 40).toLowerCase();
  return paras.find(p => canonicalText(p.textContent || '').toLowerCase().includes(needle)) || null;
}

// ── Storage ─────────────────────────────────────────────────────────────────

function storageKey(book: string): string {
  return `yuval_bookmarks_${book}`;
}

function loadBookmarks(book: string): Bookmark[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey(book)) || '[]');
  } catch {
    return [];
  }
}

function saveBookmarks(book: string, list: Bookmark[]): void {
  localStorage.setItem(storageKey(book), JSON.stringify(list));
}

// ── Core logic ──────────────────────────────────────────────────────────────

function addBookmark(el: Element): void {
  const book = getCurrentBook();
  const chapterId = getCurrentChapter();
  const canon = canonicalText(el.textContent || '');
  if (!canon) return;

  const textHash = hashText(canon);
  const list = loadBookmarks(book);

  if (list.some(b => b.chapterId === chapterId && b.textHash === textHash)) {
    removeBookmarkByHash(textHash, chapterId);
    markBookmarked(el as HTMLElement, false);
    return;
  }

  const bm: Bookmark = {
    id: `bm_${Date.now()}`,
    chapterId,
    text: canon.slice(0, 100),
    paragraphIndex: paragraphIndexOf(el),
    textHash,
    scrollY: window.scrollY,
    timestamp: Date.now(),
  };

  list.push(bm);
  saveBookmarks(book, list);

  markBookmarked(el as HTMLElement, true);
  showToast(tr('bookmarks.saved'));
  updateBadge();
}

function markBookmarked(el: HTMLElement, on: boolean): void {
  if (on) {
    el.classList.add('bm-marked');
  } else {
    el.classList.remove('bm-marked');
  }
}

function isBookmarked(el: Element): boolean {
  const textHash = hashText(canonicalText(el.textContent || ''));
  const chapterId = getCurrentChapter();
  return loadBookmarks(getCurrentBook())
    .some(b => b.chapterId === chapterId && b.textHash === textHash);
}

function confirmAddBookmark(el: Element): void {
  if (document.getElementById('bm-confirm')) return;

  const existing = isBookmarked(el);
  const rect = el.getBoundingClientRect();

  const host = document.createElement('div');
  host.id = 'bm-confirm';
  host.setAttribute('dir', getDir());

  const titleKey = existing ? 'bookmarks.removePrompt' : 'bookmarks.addPrompt';
  const confirmKey = existing ? 'bookmarks.remove' : 'bookmarks.add';

  host.innerHTML = `
    <div class="bm-confirm-arrow"></div>
    <div class="bm-confirm-title">🔖 ${tr(titleKey)}</div>
    <div class="bm-confirm-actions">
      <button class="bm-confirm-cancel">${tr('bookmarks.cancel')}</button>
      <button class="bm-confirm-ok">${tr(confirmKey)}</button>
    </div>
  `;

  document.body.appendChild(host);

  const top = window.scrollY + rect.top - host.offsetHeight - 10;
  const left = window.scrollX + rect.left + rect.width / 2 - host.offsetWidth / 2;
  host.style.top = `${Math.max(window.scrollY + 8, top)}px`;
  host.style.left = `${Math.max(8, Math.min(left, window.innerWidth - host.offsetWidth - 8))}px`;

  const close = () => host.remove();

  host.querySelector('.bm-confirm-cancel')?.addEventListener('click', close);
  host.querySelector('.bm-confirm-ok')?.addEventListener('click', () => {
    addBookmark(el);
    close();
  });

  setTimeout(() => {
    document.addEventListener('click', function onDoc(e) {
      if (!host.contains(e.target as Node)) {
        close();
        document.removeEventListener('click', onDoc);
      }
    });
  }, 0);
}

function restoreMarks(): void {
  const chapterId = getCurrentChapter();
  const marks = loadBookmarks(getCurrentBook())
    .filter(b => b.chapterId === chapterId);

  document.querySelectorAll<HTMLElement>('#chapter-container p').forEach(p => {
    p.classList.remove('bm-marked');
  });

  marks.forEach(m => {
    const el = findParagraphFor(m);
    if (el) el.classList.add('bm-marked');
  });
}

function removeBookmarkByHash(textHash: string, chapterId: number): void {
  const book = getCurrentBook();
  const list = loadBookmarks(book).filter(
    b => !(b.chapterId === chapterId && b.textHash === textHash)
  );
  saveBookmarks(book, list);
  updateBadge();
}

function removeBookmark(id: string): void {
  const book = getCurrentBook();
  const list = loadBookmarks(book).filter(b => b.id !== id);
  saveBookmarks(book, list);
  updateBadge();
}

// ── Toast ───────────────────────────────────────────────────────────────────

function showToast(msg: string): void {
  const tEl = document.createElement('div');
  tEl.className = 'bm-toast';
  tEl.textContent = msg;
  document.body.appendChild(tEl);

  requestAnimationFrame(() => tEl.classList.add('visible'));

  setTimeout(() => {
    tEl.classList.remove('visible');
    setTimeout(() => tEl.remove(), 300);
  }, 1800);
}

// ── Badge ───────────────────────────────────────────────────────────────────

function updateBadge(): void {
  const badge = document.getElementById('bm-fab-badge');
  if (!badge) return;

  const total = loadBookmarks(getCurrentBook()).length;
  badge.textContent = String(total);
  badge.style.display = total > 0 ? '' : 'none';
}

// ── Panel ───────────────────────────────────────────────────────────────────

function openPanel(): void {
  renderPanel();
  document.getElementById('bm-overlay')?.classList.add('open');
  document.getElementById('bm-panel')?.classList.add('open');
}

function closePanel(): void {
  document.getElementById('bm-overlay')?.classList.remove('open');
  document.getElementById('bm-panel')?.classList.remove('open');
}

function renderPanel(): void {
  const panel = document.getElementById('bm-panel');
  if (!panel) return;

  const book = getCurrentBook();
  const bookmarks = loadBookmarks(book);

  panel.setAttribute('dir', getDir());

  panel.innerHTML = `
    <div id="bm-panel-header">
      <span>🔖 ${tr('bookmarks.title')}</span>
      <button id="bm-close">✕</button>
    </div>
    <div id="bm-body"></div>
  `;

  document.getElementById('bm-close')?.addEventListener('click', closePanel);

  const body = document.getElementById('bm-body')!;

  if (!bookmarks.length) {
    body.innerHTML = `
      <div class="bm-empty">
        <div>${tr('bookmarks.empty')}</div>
        <div>${tr('bookmarks.emptyHint')}</div>
      </div>
    `;
    return;
  }

  bookmarks.forEach(bm => {
    const item = document.createElement('div');
    item.className = 'bm-item';

    item.innerHTML = `
      <div>${bm.text}</div>
      <div>${tr('bookmarks.chapter', { n: bm.chapterId })}</div>
    `;

    item.onclick = () => {
      const target = findParagraphFor(bm);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.add('bm-pulse');
        setTimeout(() => target.classList.remove('bm-pulse'), 1600);
      } else if (typeof bm.scrollY === 'number') {
        window.scrollTo({ top: bm.scrollY, behavior: 'smooth' });
      }
      closePanel();
    };

    body.appendChild(item);
  });
}

// ── Init ────────────────────────────────────────────────────────────────────

export function initBookmarks(signal: AbortSignal): void {
  const fab = document.createElement('button');
  fab.id = 'bm-fab-btn';
  fab.type = 'button';
  fab.setAttribute('aria-label', tr('aria.bookmarks'));
  fab.title = tr('aria.bookmarks');
  fab.textContent = '🔖';
  document.body.appendChild(fab);

  const overlay = document.createElement('div');
  overlay.id = 'bm-overlay';
  document.body.appendChild(overlay);

  const panel = document.createElement('div');
  panel.id = 'bm-panel';
  document.body.appendChild(panel);

  fab.addEventListener('click', openPanel);
  overlay.addEventListener('click', closePanel);

  document.addEventListener('contextmenu', (e) => {
    const target = (e.target as HTMLElement).closest('#chapter-container p');
    if (!target) return;
    e.preventDefault();
    confirmAddBookmark(target);
  }, { signal });

  document.addEventListener('dblclick', (e) => {
    const target = (e.target as HTMLElement).closest('#chapter-container p');
    if (!target) return;
    confirmAddBookmark(target);
  }, { signal });

  let pressTimer: number | null = null;
  let pressTarget: Element | null = null;

  document.addEventListener('touchstart', (e) => {
    const target = (e.target as HTMLElement).closest('#chapter-container p');
    if (!target) return;
    pressTarget = target;
    pressTimer = window.setTimeout(() => {
      if (pressTarget) confirmAddBookmark(pressTarget);
      pressTimer = null;
    }, 600);
  }, { signal, passive: true });

  const clearPress = () => {
    if (pressTimer !== null) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
    pressTarget = null;
  };

  document.addEventListener('touchend', clearPress, { signal });
  document.addEventListener('touchmove', clearPress, { signal });
  document.addEventListener('touchcancel', clearPress, { signal });

  window.addEventListener('language-changed', () => {
    fab.setAttribute('aria-label', tr('aria.bookmarks'));
    fab.title = tr('aria.bookmarks');
    restoreMarks();
    if (document.getElementById('bm-panel')?.classList.contains('open')) {
      renderPanel();
    }
  }, { signal });

  restoreMarks();
  updateBadge();
}