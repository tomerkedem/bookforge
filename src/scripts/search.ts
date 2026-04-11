/**
 * Search — chapter mode and book-wide mode
 *
 * / to open, Escape to close
 * Toggle: "Chapter" | "Book"
 * Enter / Shift+Enter — next / previous match (chapter mode)
 * Supports HE / EN / ES
 */

// ── i18n ─────────────────────────────────────────────────────────────────────

type LangKey = 'he' | 'en' | 'es';

function getLang(): LangKey {
  return (new URLSearchParams(window.location.search).get('lang')
    || localStorage.getItem('yuval_language')
    || 'en') as LangKey;
}

const i18n: Record<LangKey, {
  placeholderChapter: string;
  placeholderBook: string;
  modeChapter: string;
  modeBook: string;
  results: (n: number, total: number) => string;
  noResults: string;
  chapterLabel: (n: number) => string;
  dir: 'rtl' | 'ltr';
}> = {
  he: {
    placeholderChapter: 'חיפוש בפרק הנוכחי...',
    placeholderBook:    'חיפוש בכל הספר...',
    modeChapter:        'פרק',
    modeBook:           'ספר',
    results:            (n, t) => `${n} מתוך ${t}`,
    noResults:          'לא נמצאו תוצאות',
    chapterLabel:       (n) => `פרק ${n}`,
    dir: 'rtl',
  },
  es: {
    placeholderChapter: 'Buscar en este capítulo...',
    placeholderBook:    'Buscar en todo el libro...',
    modeChapter:        'Capítulo',
    modeBook:           'Libro',
    results:            (n, t) => `${n} de ${t}`,
    noResults:          'Sin resultados',
    chapterLabel:       (n) => `Capítulo ${n}`,
    dir: 'ltr',
  },
  en: {
    placeholderChapter: 'Search in this chapter...',
    placeholderBook:    'Search across the book...',
    modeChapter:        'Chapter',
    modeBook:           'Book',
    results:            (n, t) => `${n} of ${t}`,
    noResults:          'No results',
    chapterLabel:       (n) => `Chapter ${n}`,
    dir: 'ltr',
  },
};

function tr() { return i18n[getLang()]; }

// ── CSS ───────────────────────────────────────────────────────────────────────

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
      transition: opacity 0.2s ease, transform 0.2s ease;
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

    /* ── Top row ── */
    #search-top-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
    }

    #search-icon {
      color: var(--yuval-text-muted, #9ca3af);
      flex-shrink: 0;
      width: 16px; height: 16px;
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

    /* ── Mode toggle ── */
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
      display: flex; align-items: center; justify-content: center;
      width: 28px; height: 28px;
      background: none;
      border: 1px solid var(--yuval-border, #e5e7eb);
      border-radius: 7px;
      color: var(--yuval-text-secondary, #555);
      cursor: pointer; font-size: 13px; flex-shrink: 0;
      transition: background 0.12s, color 0.12s;
    }
    .search-nav-btn:hover { background: var(--yuval-bg-secondary, #f3f4f6); }
    .search-nav-btn:disabled { opacity: 0.3; cursor: default; }
    :is(.dark) .search-nav-btn { border-color: rgba(255,255,255,0.1); color: #bbb; }
    :is(.dark) .search-nav-btn:hover { background: rgba(255,255,255,0.08); }

    #search-close {
      display: flex; align-items: center; justify-content: center;
      width: 26px; height: 26px;
      background: none; border: none; border-radius: 6px;
      color: var(--yuval-text-muted, #9ca3af);
      cursor: pointer; font-size: 14px; flex-shrink: 0;
      transition: background 0.12s;
    }
    #search-close:hover { background: var(--yuval-bg-secondary, #f3f4f6); }
    :is(.dark) #search-close:hover { background: rgba(255,255,255,0.08); }

    /* ── Book results list ── */
    #search-results {
      border-top: 1px solid var(--yuval-border, #e5e7eb);
      max-height: 320px;
      overflow-y: auto;
    }
    :is(.dark) #search-results { border-color: rgba(255,255,255,0.07); }
    #search-results:empty { display: none; }

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

    /* highlight query inside snippets */
    .sri-snippet mark, .sri-title mark {
      background: #fef08a; color: #713f12;
      border-radius: 2px; padding: 0 1px;
      font-style: normal;
    }
    :is(.dark) .sri-snippet mark, :is(.dark) .sri-title mark {
      background: rgba(234,179,8,0.3); color: #fef08a;
    }

    /* ── Chapter match highlights ── */
    .search-match {
      background: #fef08a; color: #713f12;
      border-radius: 2px; padding: 0 1px;
    }
    .search-match.search-match-active {
      background: #f59e0b; color: #fff;
      box-shadow: 0 0 0 2px rgba(245,158,11,0.4);
    }
    :is(.dark) .search-match { background: rgba(234,179,8,0.3); color: #fef08a; }
    :is(.dark) .search-match.search-match-active { background: #b45309; color: #fff; }
  `;
  document.head.appendChild(s);
}

// ── State ─────────────────────────────────────────────────────────────────────

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

// ── Search index cache ────────────────────────────────────────────────────────

type IndexEntry = {
  book: string; bookTitle_he: string; bookTitle_en: string;
  chapterId: number; title_he: string; title_en: string;
  url_he: string; url_en: string; text_he: string; text_en: string;
};

let indexCache: IndexEntry[] | null = null;

async function getIndex(): Promise<IndexEntry[]> {
  if (indexCache) return indexCache;
  try {
    const res = await fetch('/search-index.json');
    indexCache = await res.json();
    return indexCache!;
  } catch { return []; }
}

// ── Context ───────────────────────────────────────────────────────────────────

function getLangDir(): 'rtl' | 'ltr' { return tr().dir; }

function getContentEl(): Element | null {
  const lang = getLang();
  const container = document.getElementById('chapter-container');
  return container?.querySelector(`[data-lang="${lang}"]`) ?? container;
}

function getCurrentBook(): string {
  return document.getElementById('chapter-container')?.dataset.book || '';
}

// ── Chapter match highlight ───────────────────────────────────────────────────

function clearMatches(): void {
  document.querySelectorAll('.search-match').forEach(el => {
    const p = el.parentNode!;
    while (el.firstChild) p.insertBefore(el.firstChild, el);
    p.removeChild(el);
    p.normalize();
  });
  matches = [];
  currentIdx = 0;
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
    while ((pos = lower.indexOf(q, pos)) !== -1) { indices.push(pos); pos += q.length; }
    if (indices.length) toReplace.push({ node, indices });
  }

  toReplace.reverse().forEach(({ node, indices }) => {
    const text = node.textContent || '';
    const parent = node.parentNode!;
    const frag = document.createDocumentFragment();
    let last = 0;
    indices.forEach(idx => {
      if (idx > last) frag.appendChild(document.createTextNode(text.slice(last, idx)));
      const mark = document.createElement('mark');
      mark.className = 'search-match';
      mark.textContent = text.slice(idx, idx + query.length);
      frag.appendChild(mark);
      last = idx + query.length;
    });
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
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

// ── Book-wide search ──────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function highlightSnippet(text: string, query: string): string {
  if (!query.trim()) return escapeHtml(text);
  const re = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  return escapeHtml(text).replace(re, m => `<mark>${m}</mark>`);
}

function extractSnippet(text: string, query: string, maxLen = 160): string {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, maxLen) + (text.length > maxLen ? '…' : '');
  const start = Math.max(0, idx - 60);
  const end = Math.min(text.length, idx + query.length + 100);
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
}

async function runBookSearch(query: string): Promise<void> {
  if (!searchResults) return;
  searchResults.innerHTML = '';
  if (!query.trim()) return;

  const index = await getIndex();
  const lang = getLang();
  const book = getCurrentBook();
  const labels = tr();
  const q = query.toLowerCase();

  // Search only within current book
  const hits = index.filter(entry => {
    if (entry.book !== book) return false;
    const text = lang === 'he' ? entry.text_he : entry.text_en;
    const title = lang === 'he' ? entry.title_he : entry.title_en;
    return text.toLowerCase().includes(q) || title.toLowerCase().includes(q);
  });

  if (searchCount) {
    if (!hits.length) {
      searchCount.textContent = labels.noResults;
      searchCount.className = 'search-count no-results';
    } else {
      searchCount.textContent = `${hits.length}`;
      searchCount.className = 'search-count';
    }
  }

  hits.slice(0, 30).forEach(entry => {
    const lang_ = getLang();
    const title   = lang_ === 'he' ? entry.title_he   : entry.title_en;
    const text    = lang_ === 'he' ? entry.text_he    : entry.text_en;
    const url     = lang_ === 'he' ? entry.url_he     : entry.url_en;
    const chapter = labels.chapterLabel(entry.chapterId);

    const snippet = extractSnippet(text, query);

    const item = document.createElement('a');
    item.className = 'search-result-item';
    item.href = url;
    item.setAttribute('dir', getLangDir());
    item.innerHTML = `
      <span class="sri-meta">${escapeHtml(chapter)}</span>
      <span class="sri-title">${highlightSnippet(title, query)}</span>
      <span class="sri-snippet">${highlightSnippet(snippet, query)}</span>
    `;

    item.addEventListener('click', async (e) => {
      const loadFn = (window as any).yuvalLoadChapter as ((u: string) => Promise<void>) | undefined;
      if (loadFn) {
        e.preventDefault();
        closeSearch();
        await loadFn(url);
        // After navigation, highlight query in new chapter
        setTimeout(() => {
          highlightMatches(query);
          if (matches.length) activateMatch(0);
        }, 400);
      }
    });

    searchResults!.appendChild(item);
  });
}

// ── Build UI ──────────────────────────────────────────────────────────────────

function buildSearchBar(): HTMLElement {
  const bar = document.createElement('div');
  bar.id = 'chapter-search';
  bar.setAttribute('role', 'search');

  const labels = tr();
  bar.setAttribute('dir', labels.dir);

  bar.innerHTML = `
    <div id="search-top-row">
      <svg id="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input id="search-input" type="search" autocomplete="off" spellcheck="false"
        placeholder="${labels.placeholderChapter}" />
      <span id="search-count"></span>
      <div id="search-mode-toggle">
        <button class="search-mode-btn active" data-mode="chapter" type="button">${labels.modeChapter}</button>
        <button class="search-mode-btn" data-mode="book" type="button">${labels.modeBook}</button>
      </div>
      <button class="search-nav-btn" id="search-prev" type="button" title="Previous">↑</button>
      <button class="search-nav-btn" id="search-next" type="button" title="Next">↓</button>
      <button id="search-close" type="button" aria-label="Close">✕</button>
    </div>
    <div id="search-results"></div>
  `;

  document.body.appendChild(bar);
  return bar;
}

let debounceTimer: ReturnType<typeof setTimeout>;

function attachEvents(): void {
  if (!searchBar) return;

  searchInput = searchBar.querySelector<HTMLInputElement>('#search-input');
  searchCount = searchBar.querySelector<HTMLElement>('#search-count');
  searchResults = searchBar.querySelector<HTMLElement>('#search-results');
  prevBtn = searchBar.querySelector<HTMLButtonElement>('#search-prev');
  nextBtn = searchBar.querySelector<HTMLButtonElement>('#search-next');
  modeBtns = searchBar.querySelectorAll<HTMLButtonElement>('.search-mode-btn');

  // Mode toggle
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      mode = btn.dataset.mode as 'chapter' | 'book';
      modeBtns!.forEach(b => b.classList.toggle('active', b === btn));

      const labels = tr();
      if (searchInput) {
        searchInput.placeholder = mode === 'chapter'
          ? labels.placeholderChapter : labels.placeholderBook;
      }

      // Show/hide nav buttons (only useful in chapter mode)
      if (prevBtn) prevBtn.style.display = mode === 'chapter' ? '' : 'none';
      if (nextBtn) nextBtn.style.display = mode === 'chapter' ? '' : 'none';

      // Clear and re-run
      clearMatches();
      if (searchResults) searchResults.innerHTML = '';
      if (searchCount) searchCount.textContent = '';
      const q = searchInput?.value || '';
      if (q) runQuery(q);
    });
  });

  // Input
  searchInput?.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => runQuery(searchInput!.value), 180);
  });

  // Keyboard
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && mode === 'chapter') {
      e.preventDefault();
      if (e.shiftKey) activateMatch(currentIdx - 1);
      else            activateMatch(currentIdx + 1);
      updateChapterCount();
    }
    if (e.key === 'Escape') closeSearch();
  });

  prevBtn?.addEventListener('click', () => { activateMatch(currentIdx - 1); updateChapterCount(); });
  nextBtn?.addEventListener('click', () => { activateMatch(currentIdx + 1); updateChapterCount(); });
  searchBar.querySelector('#search-close')?.addEventListener('click', closeSearch);
}

function updateChapterCount(): void {
  if (!searchCount || !searchInput) return;
  const q = searchInput.value.trim();
  const labels = tr();
  if (!q) { searchCount.textContent = ''; searchCount.className = 'search-count'; return; }
  if (!matches.length) {
    searchCount.textContent = labels.noResults;
    searchCount.className = 'search-count no-results';
  } else {
    searchCount.textContent = labels.results(currentIdx + 1, matches.length);
    searchCount.className = 'search-count';
  }
  if (prevBtn) prevBtn.disabled = matches.length < 2;
  if (nextBtn) nextBtn.disabled = matches.length < 2;
}

function runQuery(q: string): void {
  if (mode === 'chapter') {
    highlightMatches(q);
    if (matches.length) activateMatch(0);
    updateChapterCount();
  } else {
    clearMatches();
    runBookSearch(q);
  }
}

// ── Open / Close ──────────────────────────────────────────────────────────────

function getSearchBar(): HTMLElement {
  if (!searchBar || !document.body.contains(searchBar)) {
    searchBar = buildSearchBar();
    attachEvents();
  }
  return searchBar;
}

function openSearch(): void {
  const bar = getSearchBar();
  const labels = tr();
  bar.setAttribute('dir', labels.dir);
  if (searchInput) {
    searchInput.placeholder = mode === 'chapter'
      ? labels.placeholderChapter : labels.placeholderBook;
  }
  // Update mode btn labels
  modeBtns?.forEach(btn => {
    btn.textContent = btn.dataset.mode === 'chapter' ? labels.modeChapter : labels.modeBook;
  });
  bar.classList.add('open');
  searchInput?.focus();
  searchInput?.select();
}

function closeSearch(): void {
  searchBar?.classList.remove('open');
  clearMatches();
  if (searchInput) searchInput.value = '';
  if (searchCount) { searchCount.textContent = ''; searchCount.className = 'search-count'; }
  if (searchResults) searchResults.innerHTML = '';
}

// ── Export ────────────────────────────────────────────────────────────────────

export function initSearch(signal: AbortSignal): void {
  injectStyles();

  document.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement;
    if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === '/') { e.preventDefault(); openSearch(); }
    if (e.key === 'Escape' && searchBar?.classList.contains('open')) closeSearch();
  }, { signal });

  // Prefetch index in background after 3s
  setTimeout(() => getIndex(), 3000);

  window.addEventListener('chapter-content-swapped', () => {
    clearMatches();
    if (searchResults) searchResults.innerHTML = '';
  }, { signal });
}
