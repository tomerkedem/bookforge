/**
 * Bookmarks - dynamic i18n version
 */

import { t, type TranslationKey, getI18nDirection } from '../i18n';
import {
  SOURCE_LANG,
  getLang,
  getCurrentBook,
  getCurrentChapter,
  getContentRoot,
  getChapterTitlesForId,
  resolveChapterTitleByTitles,
  nearestSectionHeading,
  waitForContentReady,
  type ChapterKey,
} from './reading-location';

// ── Language ────────────────────────────────────────────────────────────────

function tr(key: TranslationKey, params?: Record<string, string | number>): string {
  return t(key, getLang(), params);
}

function getDir(): 'rtl' | 'ltr' {
  return getI18nDirection(getLang());
}

// ── Types ───────────────────────────────────────────────────────────────────

interface Bookmark {
  id: string;
  book: string;
  chapterId: ChapterKey;
  chapterTitles: Record<string, string>;
  lang: string;
  anchor: string;
  sectionHeading?: string;
  text: string;
  paragraphIndex: number;
  textHash: string;
  scrollY?: number;
  timestamp: number;
}

declare global {
  interface Window {
    yuvalLoadChapter?: (url: string) => Promise<void> | void;
  }
}

const PENDING_KEY = 'yuval_pending_bookmark';

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

function ensureAnchor(el: HTMLElement): string {
  const existing = el.dataset.bmAnchor;
  if (existing) return existing;
  const synthetic = `p-x-${paragraphIndexOf(el) + 1}`;
  el.dataset.bmAnchor = synthetic;
  return synthetic;
}

function resolveChapterTitle(bm: Bookmark): string {
  return resolveChapterTitleByTitles(
    bm.chapterTitles,
    bm.chapterId,
    !!bm.book && bm.book === getCurrentBook(),
  );
}

function formatChapterLine(bm: Bookmark): string {
  if (!bm.book || !bm.chapterId) {
    return tr('bookmarks.chapterUnknown');
  }
  const title = resolveChapterTitle(bm);
  const chapterLabel = tr('bookmarks.chapter', { n: bm.chapterId });
  const base = title ? `${chapterLabel} · ${title}` : chapterLabel;
  if (bm.sectionHeading) return `${base} › ${bm.sectionHeading}`;
  return base;
}

function findTargetForBookmark(bm: Bookmark): { el: HTMLElement; exact: boolean } | null {
  const root = getContentRoot();
  if (!root) return null;

  if (bm.anchor) {
    const byAnchor = root.querySelector<HTMLElement>(`[data-bm-anchor="${CSS.escape(bm.anchor)}"]`);
    if (byAnchor) return { el: byAnchor, exact: true };
  }

  const byTextMatch = findParagraphFor(bm);
  if (byTextMatch) return { el: byTextMatch, exact: true };

  if (bm.sectionHeading) {
    const heads = Array.from(root.querySelectorAll<HTMLElement>('h2, h3'));
    const byHeading = heads.find(h =>
      canonicalText(h.textContent || '') === canonicalText(bm.sectionHeading || '')
    );
    if (byHeading) return { el: byHeading, exact: false };
  }

  const firstHeading = root.querySelector<HTMLElement>('h2, h3');
  if (firstHeading) return { el: firstHeading, exact: false };

  return null;
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
  window.dispatchEvent(new CustomEvent('yuval-bookmarks-changed'));
}

// ── Core logic ──────────────────────────────────────────────────────────────

function addBookmark(el: Element): void {
  const book = getCurrentBook();
  const chapterId = getCurrentChapter();
  const canon = canonicalText(el.textContent || '');
  if (!canon) return;

  if (!book || !chapterId) {
    showToast(tr('bookmarks.chapterUnknown'));
    return;
  }

  const textHash = hashText(canon);
  const list = loadBookmarks(book);

  if (list.some(b => b.chapterId === chapterId && b.textHash === textHash)) {
    removeBookmarkByHash(textHash, chapterId);
    markBookmarked(el as HTMLElement, false);
    return;
  }

  const anchor = ensureAnchor(el as HTMLElement);
  const chapterTitles = getChapterTitlesForId(chapterId);
  const sectionHeading = nearestSectionHeading(el);

  const bm: Bookmark = {
    id: `bm_${Date.now()}`,
    book,
    chapterId,
    chapterTitles,
    lang: getLang(),
    anchor,
    sectionHeading,
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
  const book = getCurrentBook();
  const chapterId = getCurrentChapter();
  if (!book || !chapterId) return;

  const marks = loadBookmarks(book)
    .filter(b => b.chapterId === chapterId);

  document.querySelectorAll<HTMLElement>('#chapter-container [data-bm-anchor], #chapter-container p')
    .forEach(p => p.classList.remove('bm-marked'));

  marks.forEach(m => {
    const resolved = findTargetForBookmark(m);
    if (resolved?.exact) resolved.el.classList.add('bm-marked');
  });
}

function scrollToTarget(el: HTMLElement): void {
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('bm-pulse');
  setTimeout(() => el.classList.remove('bm-pulse'), 1600);
}

async function navigateToBookmark(bm: Bookmark): Promise<void> {
  const currentBook = getCurrentBook();
  const sameBook = !!bm.book && bm.book === currentBook;
  const sameChapter = sameBook && bm.chapterId === getCurrentChapter();

  if (!sameChapter) {
    const url = `/read/${bm.book}/${bm.chapterId}`;
    if (sameBook && typeof window.yuvalLoadChapter === 'function') {
      await window.yuvalLoadChapter(url);
    } else {
      try {
        sessionStorage.setItem(PENDING_KEY, JSON.stringify(bm));
      } catch {}
      window.location.href = url;
      return;
    }
  }

  await waitForContentReady();

  const resolved = findTargetForBookmark(bm);
  if (resolved) {
    scrollToTarget(resolved.el);
    if (!resolved.exact) showToast(tr('bookmarks.approximate'));
  } else if (sameChapter && typeof bm.scrollY === 'number') {
    window.scrollTo({ top: bm.scrollY, behavior: 'smooth' });
    showToast(tr('bookmarks.approximate'));
  } else {
    showToast(tr('bookmarks.approximate'));
  }

  closePanel();
}

function consumePendingBookmark(): void {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(PENDING_KEY);
    if (raw) sessionStorage.removeItem(PENDING_KEY);
  } catch {
    return;
  }
  if (!raw) return;

  let bm: Bookmark;
  try {
    bm = JSON.parse(raw);
  } catch {
    return;
  }
  if (!bm || bm.book !== getCurrentBook() || bm.chapterId !== getCurrentChapter()) return;

  waitForContentReady().then(() => {
    const resolved = findTargetForBookmark(bm);
    if (resolved) {
      scrollToTarget(resolved.el);
      if (!resolved.exact) showToast(tr('bookmarks.approximate'));
    }
  });
}

function removeBookmarkByHash(textHash: string, chapterId: ChapterKey): void {
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
        <svg class="empty-illustration" viewBox="0 0 120 120" aria-hidden="true">
          <defs>
            <linearGradient id="bm-empty-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#fde68a"/>
              <stop offset="100%" stop-color="#f59e0b"/>
            </linearGradient>
          </defs>
          <rect x="28" y="18" width="64" height="86" rx="6" fill="#fff" stroke="#e5e7eb" stroke-width="2"/>
          <path d="M38 32 H82 M38 44 H78 M38 56 H82 M38 68 H74" stroke="#e5e7eb" stroke-width="2" stroke-linecap="round"/>
          <path d="M70 18 L70 60 L78 54 L86 60 L86 18 Z" fill="url(#bm-empty-grad)" stroke="#d97706" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>
        <div class="empty-title">${tr('empty.bookmarks.title')}</div>
        <div class="empty-body">${tr('empty.bookmarks.body')}</div>
        <div class="empty-cta">${tr('empty.bookmarks.cta')}</div>
      </div>
    `;
    return;
  }

  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  bookmarks.forEach(bm => {
    const item = document.createElement('div');
    item.className = 'bm-item';

    item.innerHTML = `
      <div class="bm-item-text">${escape(bm.text)}</div>
      <div class="bm-item-meta">${escape(formatChapterLine(bm))}</div>
    `;

    item.onclick = () => { navigateToBookmark(bm); };

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

  const badge = document.createElement('span');
  badge.id = 'bm-fab-badge';
  badge.className = 'yuval-fab-badge';
  badge.style.display = 'none';
  fab.appendChild(badge);

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
    updateBadge();
    if (document.getElementById('bm-panel')?.classList.contains('open')) {
      renderPanel();
    }
  }, { signal });

  const onChange = () => {
    updateBadge();
    if (document.getElementById('bm-panel')?.classList.contains('open')) {
      renderPanel();
    }
  };

  window.addEventListener('yuval-bookmarks-changed', onChange, { signal });
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('yuval_bookmarks_')) onChange();
  }, { signal });

  window.addEventListener('chapter-content-swapped', () => {
    restoreMarks();
    updateBadge();
  }, { signal });

  restoreMarks();
  updateBadge();
  consumePendingBookmark();
}