/**
 * Search - chapter mode and book-wide mode
 *
 * / to open, Escape to close
 * Toggle: "Chapter" | "Book"
 * Enter / Shift+Enter - next / previous match (chapter mode)
 * Dynamic language support via central i18n + search-index.json
 */

import { t, getI18nDirection, resolveLanguage } from '../i18n';
import { SOURCE_LANGUAGE, SUPPORTED_LANGUAGES } from '../utils/language';

// ── Language helpers ─────────────────────────────────────────────────────────

function getLang(): string {
  return resolveLanguage(
    new URLSearchParams(window.location.search).get('lang')
      || localStorage.getItem('yuval_language')
      || SOURCE_LANGUAGE
  );
}

function tr(key: string, params?: Record<string, string | number>): string {
  return t(key, getLang(), params);
}

function getLangDir(): 'rtl' | 'ltr' {
  return getI18nDirection(getLang());
}

// ── CSS ──────────────────────────────────────────────────────────────────────

function injectStyles(): void {
  if (document.getElementById('search-styles')) return;

  const s = document.createElement('style');
  s.id = 'search-styles';
  s.textContent = `
    #chapter-search {
      position: fixed;
      top: 72px;
      left: 50%;
      transform: translateX(-50%) translateY(-8px);
      z-index: 9985;
      display: flex;
      flex-direction: column;
      width: min(560px, calc(100vw - 48px));
      background: var(--yuval-surface, #fff);
      border: 1px solid var(--yuval-border, #e5e7eb);
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
      opacity: 0;
      pointer-events: none;
      transition: opacity 200ms cubic-bezier(0.2, 0, 0, 1), transform 320ms cubic-bezier(0.3, 0, 0, 1);
      overflow: hidden;
    }
    #chapter-search.open {
      opacity: 1;
      pointer-events: auto;
      transform: translateX(-50%) translateY(0);
    }
    :is(.dark) #chapter-search {
      background: #232323;
      border-color: rgba(255,255,255,0.1);
      box-shadow: 0 8px 40px rgba(0,0,0,0.35);
    }

    #search-top-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
    }

    #search-icon {
      color: var(--yuval-text-muted, #9ca3af);
      flex-shrink: 0;
      width: 16px;
      height: 16px;
    }

    #search-input {
      flex: 1;
      background: none;
      border: none;
      outline: none;
      font-size: 14px;
      color: var(--yuval-text, #111);
      font-family: inherit;
      min-width: 0;
    }
    #search-input::placeholder { color: var(--yuval-text-muted, #9ca3af); }
    :is(.dark) #search-input { color: #eee; }

    #search-mode-toggle {
      display: flex;
      gap: 2px;
      background: var(--yuval-bg-secondary, #f3f4f6);
      border-radius: 8px;
      padding: 2px;
      flex-shrink: 0;
    }
    :is(.dark) #search-mode-toggle { background: rgba(255,255,255,0.07); }

    .search-mode-btn {
      padding: 3px 10px;
      border: none;
      border-radius: 6px;
      font-size: 11.5px;
      font-weight: 500;
      cursor: pointer;
      background: none;
      color: var(--yuval-text-muted, #9ca3af);
      transition: background 0.15s, color 0.15s;
      white-space: nowrap;
    }
    .search-mode-btn.active {
      background: var(--yuval-surface, #fff);
      color: var(--yuval-text, #111);
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }
    :is(.dark) .search-mode-btn.active {
      background: rgba(255,255,255,0.12);
      color: #eee;
    }

    #search-count {
      font-size: 12px;
      color: var(--yuval-text-muted, #9ca3af);
      white-space: nowrap;
      flex-shrink: 0;
      min-width: 52px;
      text-align: center;
    }
    #search-count.no-results { color: #ef4444; }

    .search-nav-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      background: none;
      border: 1px solid var(--yuval-border, #e5e7eb);
      border-radius: 7px;
      color: var(--yuval-text-secondary, #555);
      cursor: pointer;
      font-size: 13px;
      flex-shrink: 0;
      transition: background 0.12s, color 0.12s;
    }
    .search-nav-btn:hover { background: var(--yuval-bg-secondary, #f3f4f6); }
    .search-nav-btn:disabled { opacity: 0.3; cursor: default; }
    :is(.dark) .search-nav-btn { border-color: rgba(255,255,255,0.1); color: #bbb; }
    :is(.dark) .search-nav-btn:hover { background: rgba(255,255,255,0.08); }

    #search-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      background: none;
      border: none;
      border-radius: 6px;
      color: var(--yuval-text-muted, #9ca3af);
      cursor: pointer;
      font-size: 14px;
      flex-shrink: 0;
      transition: background 0.12s;
    }
    #search-close:hover { background: var(--yuval-bg-secondary, #f3f4f6); }
    :is(.dark) #search-close:hover { background: rgba(255,255,255,0.08); }

    #search-results {
      border-top: 1px solid var(--yuval-border, #e5e7eb);
      max-height: 320px;
      overflow-y: auto;
    }
    :is(.dark) #search-results { border-color: rgba(255,255,255,0.07); }
    #search-results:empty { display: none; }

    .search-empty {
      padding: 2rem 1.25rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
      color: var(--yuval-text-secondary, #6b7280);
    }
    .search-empty .empty-illustration { width: 76px; height: 76px; opacity: 0.85; }
    .search-empty .empty-title { font-weight: 700; font-size: 0.95rem; color: var(--yuval-text, #111); }
    .search-empty .empty-body { font-size: 0.85rem; max-width: 22rem; line-height: 1.5; }

    .search-result-item {
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: 11px 14px;
      border-bottom: 1px solid var(--yuval-border, #f3f4f6);
      cursor: pointer;
      text-decoration: none;
      transition: background 0.1s;
    }
    .search-result-item:last-child { border-bottom: none; }
    .search-result-item:hover { background: var(--yuval-bg-secondary, #f9fafb); }
    :is(.dark) .search-result-item:hover { background: rgba(255,255,255,0.04); }
    :is(.dark) .search-result-item { border-color: rgba(255,255,255,0.05); }

    .sri-meta {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--yuval-text-muted, #9ca3af);
    }
    .sri-title {
      font-size: 13.5px;
      font-weight: 600;
      color: var(--yuval-text, #111);
    }
    :is(.dark) .sri-title { color: #eee; }
    .sri-snippet {
      font-size: 12.5px;
      color: var(--yuval-text-secondary, #555);
      line-height: 1.55;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    :is(.dark) .sri-snippet { color: #999; }

    .sri-snippet mark, .sri-title mark {
      background: #fef08a;
      color: #713f12;
      border-radius: 2px;
      padding: 0 1px;
      font-style: normal;
    }
    :is(.dark) .sri-snippet mark,
    :is(.dark) .sri-title mark {
      background: rgba(234,179,8,0.3);
      color: #fef08a;
    }

    .search-match {
      background: #fef08a;
      color: #713f12;
      border-radius: 2px;
      padding: 0 1px;
    }
    .search-match.search-match-active {
      background: #f59e0b;
      color: #fff;
      box-shadow: 0 0 0 2px rgba(245,158,11,0.4);
    }
    :is(.dark) .search-match {
      background: rgba(234,179,8,0.3);
      color: #fef08a;
    }
    :is(.dark) .search-match.search-match-active {
      background: #b45309;
      color: #fff;
    }
  `;
  document.head.appendChild(s);
}

// ── State ────────────────────────────────────────────────────────────────────

let searchBar: HTMLElement | null = null;
let searchInput: HTMLInputElement | null = null;
let searchCount: HTMLElement | null = null;
let searchResults: HTMLElement | null = null;
let prevBtn: HTMLButtonElement | null = null;
let nextBtn: HTMLButtonElement | null = null;
let modeBtns: NodeListOf<HTMLButtonElement> | null = null;

let matches: HTMLElement[] = [];
let currentIdx = 0;
let mode: 'chapter' | 'book' = 'chapter';

// ── Search index cache ───────────────────────────────────────────────────────

type IndexEntry = {
  book: string;
  bookTitles: Record<string, string>;
  chapterId: number | string;
  chapterTitles: Record<string, string>;
  url: string;
  texts: Record<string, string>;
};

let indexCache: IndexEntry[] | null = null;

async function getIndex(): Promise<IndexEntry[]> {
  if (indexCache) return indexCache;

  try {
    const res = await fetch('/search-index.json');
    indexCache = await res.json();
    return indexCache!;
  } catch {
    return [];
  }
}

// ── Context ──────────────────────────────────────────────────────────────────

function getContentEl(): Element | null {
  const lang = getLang();
  const container = document.getElementById('chapter-container');
  return container?.querySelector(`[data-lang="${lang}"]`) ?? container;
}

function getCurrentBook(): string {
  return document.getElementById('chapter-container')?.dataset.book || '';
}

// ── Chapter match highlight ──────────────────────────────────────────────────

function clearMatches(): void {
  matches.forEach(mark => {
    const parent = mark.parentNode;
    if (!parent) return;
    parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
    parent.normalize();
  });

  matches = [];
  currentIdx = 0;

  if (searchCount) {
    searchCount.textContent = '';
    searchCount.classList.remove('no-results');
  }
}

function highlightMatches(query: string): void {
  clearMatches();
  if (!query.trim()) return;

  const contentEl = getContentEl();
  if (!contentEl) return;

  const q = query.toLowerCase();
  const walker = document.createTreeWalker(contentEl, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const p = node.parentElement;
      if (!p) return NodeFilter.FILTER_REJECT;
      if (p.closest('pre, code, .search-match, script, style')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const toReplace: { node: Text; indices: number[] }[] = [];
  let node: Text | null;

  while ((node = walker.nextNode() as Text | null)) {
    const text = node.textContent || '';
    const lower = text.toLowerCase();
    const indices: number[] = [];
    let pos = 0;

    while ((pos = lower.indexOf(q, pos)) !== -1) {
      indices.push(pos);
      pos += q.length;
    }

    if (indices.length) {
      toReplace.push({ node, indices });
    }
  }

  toReplace.reverse().forEach(({ node, indices }) => {
    const text = node.textContent || '';
    const parent = node.parentNode!;
    const frag = document.createDocumentFragment();
    let last = 0;

    indices.forEach(idx => {
      if (idx > last) {
        frag.appendChild(document.createTextNode(text.slice(last, idx)));
      }

      const mark = document.createElement('mark');
      mark.className = 'search-match';
      mark.textContent = text.slice(idx, idx + query.length);
      frag.appendChild(mark);

      last = idx + query.length;
    });

    if (last < text.length) {
      frag.appendChild(document.createTextNode(text.slice(last)));
    }

    parent.replaceChild(frag, node);
  });

  matches = Array.from(document.querySelectorAll<HTMLElement>('.search-match'));
}

function activateMatch(idx: number): void {
  matches.forEach(m => m.classList.remove('search-match-active'));
  if (!matches.length) return;

  currentIdx = (idx + matches.length) % matches.length;
  const m = matches[currentIdx];
  m.classList.add('search-match-active');
  m.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ── Book-wide search ─────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function highlightSnippet(text: string, query: string): string {
  if (!query.trim()) return escapeHtml(text);

  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(safe, 'gi');
  return escapeHtml(text).replace(re, m => `<mark>${m}</mark>`);
}

function extractSnippet(text: string, query: string, maxLen = 160): string {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());

  if (idx === -1) {
    return text.slice(0, maxLen) + (text.length > maxLen ? '…' : '');
  }

  const start = Math.max(0, idx - 60);
  const end = Math.min(text.length, idx + query.length + 100);

  return (start > 0 ? '…' : '') +
    text.slice(start, end) +
    (end < text.length ? '…' : '');
}

function getLocalizedText(map: Record<string, string> | undefined, lang: string): string {
  if (!map) return '';
  return map[lang] ?? map.en ?? Object.values(map)[0] ?? '';
}

async function runBookSearch(query: string): Promise<void> {
  if (!searchResults) return;

  searchResults.innerHTML = '';
  if (!query.trim()) return;

  const lang = getLang();
  const currentBook = getCurrentBook();
  const index = await getIndex();

  const results = index
    .filter(item => item.book === currentBook)
    .map(item => {
      const title = getLocalizedText(item.chapterTitles, lang);
      const text = getLocalizedText(item.texts, lang);
      const fallbackText = Object.values(item.texts)[0] ?? '';

      const haystackTitle = title.toLowerCase();
      const haystackText = (text || fallbackText).toLowerCase();
      const q = query.toLowerCase();

      if (!haystackTitle.includes(q) && !haystackText.includes(q)) {
        return null;
      }

      const bookTitle = getLocalizedText(item.bookTitles, lang);
      const snippetSource = text || fallbackText;

      return {
        url: item.url,
        bookTitle,
        title,
        chapterId: item.chapterId,
        snippet: extractSnippet(snippetSource, query),
      };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  if (!results.length) {
    searchResults.innerHTML = `
      <div class="search-empty">
        <svg class="empty-illustration" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="52" cy="52" r="28" fill="none" stroke="#d97706" stroke-width="4" opacity="0.6"/>
          <line x1="74" y1="74" x2="96" y2="96" stroke="#d97706" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
          <path d="M42 52 H62 M42 62 H58" stroke="#9a8c7c" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
        </svg>
        <div class="empty-title">${escapeHtml(tr('empty.search.title'))}</div>
        <div class="empty-body">${escapeHtml(t('empty.search.body', lang, { q: query }))}</div>
      </div>
    `;
    return;
  }

  searchResults.innerHTML = results.map(result => `
    <a class="search-result-item" href="${result.url}">
      <div class="sri-meta">${escapeHtml(result.bookTitle)} · ${escapeHtml(t('search.chapterLabel', lang, { n: result.chapterId }))}</div>
      <div class="sri-title">${highlightSnippet(result.title, query)}</div>
      <div class="sri-snippet">${highlightSnippet(result.snippet, query)}</div>
    </a>
  `).join('');
}

// ── UI building ──────────────────────────────────────────────────────────────

function updateCount(): void {
  if (!searchCount) return;

  if (mode === 'book') {
    searchCount.textContent = '';
    searchCount.classList.remove('no-results');
    return;
  }

  if (!searchInput?.value.trim()) {
    searchCount.textContent = '';
    searchCount.classList.remove('no-results');
    return;
  }

  if (!matches.length) {
    searchCount.textContent = tr('search.noResults');
    searchCount.classList.add('no-results');
    return;
  }

  searchCount.textContent = t('search.results', getLang(), {
    n: currentIdx + 1,
    total: matches.length,
  });
  searchCount.classList.remove('no-results');
}

function updateModeUI(): void {
  if (!searchInput || !modeBtns || !searchResults || !prevBtn || !nextBtn) return;

  searchInput.placeholder = mode === 'chapter'
    ? tr('search.placeholderChapter')
    : tr('search.placeholderBook');

  modeBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
    btn.textContent = btn.dataset.mode === 'chapter'
      ? tr('search.modeChapter')
      : tr('search.modeBook');
  });

  searchResults.style.display = mode === 'book' ? 'block' : 'none';
  prevBtn.style.display = mode === 'chapter' ? 'flex' : 'none';
  nextBtn.style.display = mode === 'chapter' ? 'flex' : 'none';

  clearMatches();
  searchResults.innerHTML = '';

  if (searchInput.value.trim()) {
    void handleQuery(searchInput.value);
  }
}

async function handleQuery(query: string): Promise<void> {
  if (mode === 'chapter') {
    highlightMatches(query);

    if (matches.length) {
      activateMatch(0);
    }

    updateCount();
    return;
  }

  await runBookSearch(query);
  updateCount();
}

function buildSearchBar(): void {
  if (document.getElementById('chapter-search')) return;

  const dir = getLangDir();

  const wrapper = document.createElement('div');
  wrapper.id = 'chapter-search';
  wrapper.dir = dir;

  wrapper.innerHTML = `
    <div id="search-top-row">
      <svg id="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="7"></circle>
        <path d="m20 20-3.5-3.5"></path>
      </svg>

      <input
        id="search-input"
        type="text"
        autocomplete="off"
        spellcheck="false"
        placeholder="${escapeHtml(tr('search.placeholderChapter'))}"
      />

      <div id="search-mode-toggle">
        <button class="search-mode-btn active" data-mode="chapter">${escapeHtml(tr('search.modeChapter'))}</button>
        <button class="search-mode-btn" data-mode="book">${escapeHtml(tr('search.modeBook'))}</button>
      </div>

      <span id="search-count"></span>

      <button id="search-prev" class="search-nav-btn" type="button" aria-label="${escapeHtml(tr('search.ariaPrev'))}">↑</button>
      <button id="search-next" class="search-nav-btn" type="button" aria-label="${escapeHtml(tr('search.ariaNext'))}">↓</button>

      <button id="search-close" type="button" aria-label="${escapeHtml(tr('search.ariaClose'))}">✕</button>
    </div>

    <div id="search-results" style="display:none"></div>
  `;

  document.body.appendChild(wrapper);

  searchBar = wrapper;
  searchInput = wrapper.querySelector<HTMLInputElement>('#search-input');
  searchCount = wrapper.querySelector<HTMLElement>('#search-count');
  searchResults = wrapper.querySelector<HTMLElement>('#search-results');
  prevBtn = wrapper.querySelector<HTMLButtonElement>('#search-prev');
  nextBtn = wrapper.querySelector<HTMLButtonElement>('#search-next');
  modeBtns = wrapper.querySelectorAll<HTMLButtonElement>('.search-mode-btn');

  searchInput?.addEventListener('input', () => {
    void handleQuery(searchInput?.value || '');
  });

  searchInput?.addEventListener('keydown', (e) => {
    if (mode !== 'chapter') return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (matches.length) {
        activateMatch(currentIdx + 1);
        updateCount();
      }
    }

    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      if (matches.length) {
        activateMatch(currentIdx - 1);
        updateCount();
      }
    }
  });

  prevBtn?.addEventListener('click', () => {
    if (!matches.length) return;
    activateMatch(currentIdx - 1);
    updateCount();
  });

  nextBtn?.addEventListener('click', () => {
    if (!matches.length) return;
    activateMatch(currentIdx + 1);
    updateCount();
  });

  wrapper.querySelector<HTMLButtonElement>('#search-close')?.addEventListener('click', closeSearch);

  modeBtns?.forEach(btn => {
    btn.addEventListener('click', () => {
      mode = (btn.dataset.mode === 'book' ? 'book' : 'chapter');
      updateModeUI();
    });
  });
}

function openSearch(): void {
  if (!searchBar || !searchInput) return;
  searchBar.classList.add('open');
  setTimeout(() => searchInput?.focus(), 20);
}

function closeSearch(): void {
  if (!searchBar || !searchInput || !searchResults) return;
  searchBar.classList.remove('open');
  searchInput.value = '';
  searchResults.innerHTML = '';
  clearMatches();
  updateCount();
}

// ── Init ─────────────────────────────────────────────────────────────────────

export function initSearch(signal: AbortSignal): void {
  injectStyles();
  buildSearchBar();
  updateModeUI();

  // Expose open/close hooks on window so other UI surfaces (the
  // left reading dock's "search" tile, future menus, etc.) can
  // open the panel without re-implementing the keyboard shortcut.
  // Mirrors the existing __ttsOpenPanel / __ttsToggle pattern.
  const win = window as unknown as {
    __openSearch?: () => void;
    __closeSearch?: () => void;
    __toggleSearch?: () => void;
  };
  win.__openSearch = openSearch;
  win.__closeSearch = closeSearch;
  win.__toggleSearch = () => {
    if (searchBar?.classList.contains('open')) closeSearch();
    else openSearch();
  };

  document.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement | null;
    const isTyping =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      !!target?.closest('[contenteditable="true"]');

    if (e.key === '/' && !isTyping) {
      e.preventDefault();
      openSearch();
    }

    if (e.key === 'Escape') {
      closeSearch();
    }
  }, { signal });

  window.addEventListener('language-changed', () => {
    if (!searchBar) return;

    const newDir = getLangDir();
    searchBar.dir = newDir;

    prevBtn?.setAttribute('aria-label', tr('search.ariaPrev'));
    nextBtn?.setAttribute('aria-label', tr('search.ariaNext'));
    searchBar.querySelector('#search-close')?.setAttribute('aria-label', tr('search.ariaClose'));

    mode = mode === 'book' ? 'book' : 'chapter';
    updateModeUI();
  }, { signal });
}