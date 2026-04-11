/**
 * Highlight system for Yuval reading platform.
 *
 * Features:
 *  - Select text → floating toolbar with 4 color categories
 *  - Highlights saved to localStorage per book/chapter/language
 *  - Auto-restored on page load and chapter navigation
 *  - Click existing highlight → remove it
 */

// ── Types ────────────────────────────────────────────────────────────────────

const COLORS = {
  yellow: { label: 'Insight',  emoji: '💡' },
  blue:   { label: 'Question', emoji: '❓' },
  green:  { label: 'Action',   emoji: '✅' },
  pink:   { label: 'Quote',    emoji: '💬' },
} as const;

type ColorKey = keyof typeof COLORS;

interface HighlightData {
  id: string;
  text: string;
  color: ColorKey;
  timestamp: number;
}

// ── Storage ──────────────────────────────────────────────────────────────────

function storageKey(book: string, chapter: string, lang: string): string {
  return `yuval_hl_${book}_ch${chapter}_${lang}`;
}

function loadHighlights(book: string, chapter: string, lang: string): HighlightData[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey(book, chapter, lang)) || '[]');
  } catch {
    return [];
  }
}

function saveHighlights(book: string, chapter: string, lang: string, list: HighlightData[]): void {
  localStorage.setItem(storageKey(book, chapter, lang), JSON.stringify(list));
}

// ── Context helpers ───────────────────────────────────────────────────────────

function getPageContext(): { book: string; chapter: string; lang: string } | null {
  const container = document.getElementById('chapter-container');
  if (!container) return null;
  const book = container.dataset.book || '';
  const chapter = container.dataset.chapterId || '';
  const lang = new URLSearchParams(window.location.search).get('lang')
    || localStorage.getItem('yuval_language') || 'en';
  return { book, chapter, lang };
}

function getContentEl(): Element | null {
  const ctx = getPageContext();
  if (!ctx) return null;
  const container = document.getElementById('chapter-container');
  return container?.querySelector(`[data-lang="${ctx.lang}"]`) ?? container;
}

// ── DOM: apply a single highlight ─────────────────────────────────────────────

function applyHighlight(hl: HighlightData, contentEl: Element): boolean {
  if (!hl.text.trim()) return false;

  const walker = document.createTreeWalker(contentEl, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      // Skip already-highlighted nodes and code blocks
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest('.yuval-hl, pre, code')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    const text = node.textContent || '';
    const idx = text.indexOf(hl.text);
    if (idx === -1) continue;

    const mark = document.createElement('mark');
    mark.className = `yuval-hl yuval-hl-${hl.color}`;
    mark.dataset.hlId = hl.id;
    mark.dataset.hlColor = hl.color;
    mark.title = COLORS[hl.color].label;
    mark.textContent = hl.text;

    const parent = node.parentNode!;
    if (idx > 0) parent.insertBefore(document.createTextNode(text.slice(0, idx)), node);
    parent.insertBefore(mark, node);
    if (idx + hl.text.length < text.length) {
      parent.insertBefore(document.createTextNode(text.slice(idx + hl.text.length)), node);
    }
    parent.removeChild(node);
    return true;
  }
  return false;
}

// ── DOM: restore all highlights ───────────────────────────────────────────────

function restoreHighlights(): void {
  const ctx = getPageContext();
  if (!ctx) return;
  const contentEl = getContentEl();
  if (!contentEl) return;

  // Clear existing mark elements first (avoid duplication on re-init)
  contentEl.querySelectorAll('.yuval-hl').forEach(el => {
    const parent = el.parentNode!;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
  });

  const highlights = loadHighlights(ctx.book, ctx.chapter, ctx.lang);
  highlights.forEach(hl => applyHighlight(hl, contentEl));
}

// ── Toolbar ───────────────────────────────────────────────────────────────────

let toolbar: HTMLElement | null = null;

function createToolbar(): HTMLElement {
  const el = document.createElement('div');
  el.id = 'hl-toolbar';
  el.setAttribute('role', 'toolbar');
  el.setAttribute('aria-label', 'Highlight options');
  el.innerHTML = `
    <span class="hl-toolbar-label">Highlight</span>
    <div class="hl-colors">
      ${(Object.entries(COLORS) as [ColorKey, typeof COLORS[ColorKey]][]).map(([color, meta]) => `
        <button class="hl-dot hl-dot-${color}" data-color="${color}" title="${meta.label}" type="button" aria-label="${meta.label}">
          <span class="hl-dot-ring"></span>
        </button>
      `).join('')}
    </div>
  `;
  document.body.appendChild(el);
  return el;
}

function getToolbar(): HTMLElement {
  if (!toolbar || !document.body.contains(toolbar)) {
    toolbar = createToolbar();
  }
  return toolbar;
}

function showToolbar(rect: DOMRect): void {
  const tb = getToolbar();
  tb.classList.add('visible');

  // Position above selection, centered
  const scrollY = window.scrollY;
  const scrollX = window.scrollX;
  const tbWidth = 200; // approx, toolbar uses max-content
  const top = rect.top + scrollY - 48;
  const left = rect.left + scrollX + rect.width / 2 - tbWidth / 2;

  tb.style.top = `${Math.max(scrollY + 8, top)}px`;
  tb.style.left = `${Math.max(8, left)}px`;
}

function hideToolbar(): void {
  toolbar?.classList.remove('visible');
}

// ── Hover popup (shown on mouseenter over highlight) ─────────────────────────

let hoverPopup: HTMLElement | null = null;
let popupHideTimer: ReturnType<typeof setTimeout> | null = null;

function getHoverPopup(): HTMLElement {
  if (!hoverPopup || !document.body.contains(hoverPopup)) {
    hoverPopup = document.createElement('div');
    hoverPopup.id = 'hl-hover-popup';
    hoverPopup.innerHTML = `
      <button type="button" class="hl-popup-btn" id="hl-card-btn">🖼 Card</button>
      <button type="button" class="hl-popup-btn" id="hl-remove-btn">✕ Remove</button>
    `;
    document.body.appendChild(hoverPopup);
  }
  return hoverPopup;
}

function showHoverPopup(markEl: HTMLElement): void {
  if (popupHideTimer) { clearTimeout(popupHideTimer); popupHideTimer = null; }

  const popup = getHoverPopup();
  const rect = markEl.getBoundingClientRect();
  popup.style.top  = `${rect.top + window.scrollY - 46}px`;
  popup.style.left = `${rect.left + window.scrollX + rect.width / 2}px`;
  popup.classList.add('visible');

  popup.querySelector('#hl-remove-btn')!.onclick = () => {
    popup.classList.remove('visible');
    removeHighlight(markEl.dataset.hlId || '');
  };
  popup.querySelector('#hl-card-btn')!.onclick = () => {
    popup.classList.remove('visible');
    openQuoteCard(markEl);
  };
}

function scheduleHidePopup(): void {
  popupHideTimer = setTimeout(() => {
    hoverPopup?.classList.remove('visible');
  }, 200);
}

function cancelHidePopup(): void {
  if (popupHideTimer) { clearTimeout(popupHideTimer); popupHideTimer = null; }
}

function hideRemoveTooltip(): void {
  hoverPopup?.classList.remove('visible');
}

function removeHighlight(hlId: string): void {
  const ctx = getPageContext();
  if (!ctx) return;

  // Remove from DOM
  const mark = document.querySelector<HTMLElement>(`[data-hl-id="${hlId}"]`);
  if (mark) {
    const parent = mark.parentNode!;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
  }

  // Remove from storage
  const list = loadHighlights(ctx.book, ctx.chapter, ctx.lang);
  saveHighlights(ctx.book, ctx.chapter, ctx.lang, list.filter(h => h.id !== hlId));
}

// ── CSS injection ─────────────────────────────────────────────────────────────

function injectStyles(): void {
  if (document.getElementById('hl-styles')) return;
  const style = document.createElement('style');
  style.id = 'hl-styles';
  style.textContent = `
    /* ── Highlight marks ── */
    .yuval-hl {
      border-radius: 3px;
      padding: 1px 0;
      cursor: default;
      transition: filter 0.15s;
      text-decoration: none;
      position: relative;
    }
    .yuval-hl:hover { filter: brightness(0.9); }

    .yuval-hl-yellow { background: #fef08a; color: #713f12; }
    .yuval-hl-blue   { background: #bfdbfe; color: #1e3a8a; }
    .yuval-hl-green  { background: #bbf7d0; color: #14532d; }
    .yuval-hl-pink   { background: #fecdd3; color: #881337; }

    :is(.dark) .yuval-hl-yellow { background: #854d0e55; color: #fef08a; }
    :is(.dark) .yuval-hl-blue   { background: #1e40af55; color: #bfdbfe; }
    :is(.dark) .yuval-hl-green  { background: #14532d55; color: #bbf7d0; }
    :is(.dark) .yuval-hl-pink   { background: #9f123955; color: #fecdd3; }

    /* ── Floating toolbar ── */
    #hl-toolbar {
      position: absolute;
      z-index: 9998;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      background: var(--yuval-surface, #fff);
      border: 1px solid var(--yuval-border, #e5e7eb);
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.08);
      opacity: 0;
      pointer-events: none;
      transform: translateY(4px);
      transition: opacity 0.15s ease, transform 0.15s ease;
      white-space: nowrap;
    }
    #hl-toolbar.visible {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }

    .hl-toolbar-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--yuval-text-muted, #9ca3af);
      padding-right: 4px;
      border-right: 1px solid var(--yuval-border, #e5e7eb);
    }

    .hl-colors {
      display: flex;
      gap: 4px;
    }

    .hl-dot {
      position: relative;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      padding: 0;
      transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1);
    }
    .hl-dot:hover { transform: scale(1.2); }
    .hl-dot:active { transform: scale(0.9); }

    .hl-dot-yellow { background: #fef08a; }
    .hl-dot-blue   { background: #bfdbfe; }
    .hl-dot-green  { background: #bbf7d0; }
    .hl-dot-pink   { background: #fecdd3; }

    .hl-dot-ring {
      position: absolute;
      inset: -2px;
      border-radius: 50%;
      border: 2px solid transparent;
      transition: border-color 0.15s;
    }
    .hl-dot:hover .hl-dot-ring { border-color: currentColor; opacity: 0.4; }

    /* ── Highlight hover popup ── */
    #hl-hover-popup {
      position: absolute;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 6px;
      background: var(--yuval-surface, #fff);
      border: 1px solid var(--yuval-border, #e5e7eb);
      border-radius: 10px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06);
      opacity: 0;
      pointer-events: none;
      transform: translateX(-50%) translateY(4px);
      transition: opacity 0.15s ease, transform 0.15s ease;
      white-space: nowrap;
    }
    #hl-hover-popup.visible {
      opacity: 1;
      pointer-events: auto;
      transform: translateX(-50%) translateY(0);
    }
    :is(.dark) #hl-hover-popup {
      background: #2a2a2a;
      border-color: rgba(255,255,255,0.1);
    }
    .hl-popup-btn {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 5px 10px;
      border: none;
      border-radius: 7px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.12s;
    }
    #hl-card-btn {
      background: var(--yuval-bg-secondary, #f3f4f6);
      color: var(--yuval-text, #111);
    }
    #hl-card-btn:hover { background: #e5e7eb; }
    #hl-remove-btn {
      background: #fef2f2;
      color: #dc2626;
    }
    #hl-remove-btn:hover { background: #fee2e2; }
    :is(.dark) #hl-card-btn { background: rgba(255,255,255,0.08); color: #eee; }
    :is(.dark) #hl-card-btn:hover { background: rgba(255,255,255,0.13); }
    :is(.dark) #hl-remove-btn { background: rgba(239,68,68,0.12); color: #f87171; }
    :is(.dark) #hl-remove-btn:hover { background: rgba(239,68,68,0.22); }

    /* ── Quote Card Modal ── */
    #qc-overlay {
      position: fixed; inset: 0; z-index: 10000;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
      opacity: 0; transition: opacity 0.25s ease;
    }
    #qc-overlay.visible { opacity: 1; }

    #qc-modal {
      background: var(--yuval-surface, #fff);
      border-radius: 20px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.3);
      width: 100%; max-width: 560px;
      overflow: hidden;
      transform: scale(0.95) translateY(8px);
      transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
    }
    #qc-overlay.visible #qc-modal { transform: scale(1) translateY(0); }

    #qc-preview-wrap {
      padding: 20px 20px 0;
    }

    /* The card itself — matches download output */
    #qc-card {
      border-radius: 14px;
      overflow: hidden;
      position: relative;
      display: flex;
      flex-direction: column;
      min-height: 220px;
    }

    .qc-bg {
      position: absolute; inset: 0;
      background: var(--qc-bg, #1a1a2e);
    }
    .qc-bg-noise {
      position: absolute; inset: 0;
      opacity: 0.04;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    }

    .qc-content {
      position: relative; z-index: 1;
      padding: 28px 28px 20px;
      flex: 1;
    }

    .qc-quote-mark {
      font-size: 52px;
      line-height: 0.6;
      color: var(--qc-accent, rgba(255,255,255,0.25));
      font-family: Georgia, serif;
      margin-bottom: 8px;
      display: block;
    }

    .qc-text {
      font-size: 17px;
      font-weight: 500;
      line-height: 1.65;
      color: #fff;
      margin: 0 0 20px;
      word-break: break-word;
    }

    .qc-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 28px;
      background: rgba(0,0,0,0.25);
      backdrop-filter: blur(8px);
      position: relative; z-index: 1;
    }

    .qc-book-info {
      display: flex; flex-direction: column; gap: 2px;
    }
    .qc-book-title {
      font-size: 12px; font-weight: 700;
      color: rgba(255,255,255,0.9);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      max-width: 280px;
    }
    .qc-brand {
      font-size: 10px; color: rgba(255,255,255,0.45);
      letter-spacing: 0.08em; text-transform: uppercase;
    }

    .qc-cover {
      width: 40px; height: 56px;
      border-radius: 4px;
      object-fit: cover;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      flex-shrink: 0;
    }
    .qc-cover-placeholder {
      width: 40px; height: 56px;
      border-radius: 4px;
      background: rgba(255,255,255,0.15);
      flex-shrink: 0;
    }

    /* Color picker row */
    #qc-actions {
      padding: 16px 20px 20px;
      display: flex; align-items: center; gap: 12px;
    }

    .qc-palette {
      display: flex; gap: 8px; flex: 1;
    }
    .qc-swatch {
      width: 26px; height: 26px; border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      transition: transform 0.15s, border-color 0.15s;
    }
    .qc-swatch:hover { transform: scale(1.15); }
    .qc-swatch.active { border-color: var(--yuval-text, #111); transform: scale(1.1); }

    #qc-download-btn {
      display: flex; align-items: center; gap-6px;
      padding: 9px 20px;
      background: var(--yuval-text, #111);
      color: var(--yuval-bg, #fff);
      border: none; border-radius: 10px;
      font-size: 13px; font-weight: 650;
      cursor: pointer;
      transition: opacity 0.15s;
      white-space: nowrap;
    }
    #qc-download-btn:hover { opacity: 0.85; }
    #qc-download-btn:disabled { opacity: 0.5; cursor: wait; }

    #qc-close-btn {
      position: absolute; top: 14px; right: 14px;
      background: rgba(0,0,0,0.08); border: none;
      border-radius: 50%; width: 30px; height: 30px;
      cursor: pointer; font-size: 14px;
      display: flex; align-items: center; justify-content: center;
      color: var(--yuval-text-muted, #888);
      transition: background 0.15s;
    }
    #qc-close-btn:hover { background: rgba(0,0,0,0.15); }
  `;
  document.head.appendChild(style);
}

// ── Quote Card ────────────────────────────────────────────────────────────────

const PALETTES = [
  { bg: '#0f172a', accent: 'rgba(148,163,184,0.3)', label: 'Night'    },
  { bg: '#1e1b4b', accent: 'rgba(167,139,250,0.35)', label: 'Purple'  },
  { bg: '#0c4a6e', accent: 'rgba(125,211,252,0.35)', label: 'Ocean'   },
  { bg: '#14532d', accent: 'rgba(134,239,172,0.35)', label: 'Forest'  },
  { bg: '#431407', accent: 'rgba(253,186,116,0.35)', label: 'Ember'   },
  { bg: '#1c1917', accent: 'rgba(231,229,228,0.25)', label: 'Stone'   },
];

function getBookMeta(): { title: string; coverUrl: string } {
  const lang = new URLSearchParams(window.location.search).get('lang')
    || localStorage.getItem('yuval_language') || 'en';

  // Title: from chapter header
  const headerEl = document.querySelector<HTMLElement>(
    `#chapter-header [data-lang="${lang}"] .chapter-title,
     #chapter-header [data-lang="en"] .chapter-title`
  );

  // Book title: from breadcrumb or page title
  const breadcrumbs = document.querySelectorAll<HTMLElement>('nav [aria-label] a, .breadcrumb-item');
  let bookTitle = '';
  if (breadcrumbs.length >= 2) {
    bookTitle = breadcrumbs[breadcrumbs.length - 2]?.textContent?.trim() || '';
  }
  if (!bookTitle) {
    bookTitle = document.title.replace(/\s*\|.*/, '').trim();
  }

  // Cover image
  const container = document.getElementById('chapter-container');
  const book = container?.dataset.book || '';
  const coverUrl = book ? `/books/${book}/cover.jpg` : '';

  return { title: bookTitle, coverUrl };
}

function openQuoteCard(markEl: HTMLElement): void {
  const text = markEl.textContent || '';
  if (!text.trim()) return;

  // Remove existing overlay
  document.getElementById('qc-overlay')?.remove();

  let currentPalette = 0;

  const { title, coverUrl } = getBookMeta();

  function buildCardHTML(p: typeof PALETTES[0]): string {
    const coverPart = coverUrl
      ? `<img class="qc-cover" src="${coverUrl}" alt="" onerror="this.style.display='none'">`
      : `<div class="qc-cover-placeholder"></div>`;
    return `
      <div class="qc-bg" style="background:${p.bg}"></div>
      <div class="qc-bg-noise"></div>
      <div class="qc-content">
        <span class="qc-quote-mark" style="color:${p.accent}">"</span>
        <p class="qc-text">${text}</p>
      </div>
      <div class="qc-footer">
        <div class="qc-book-info">
          <span class="qc-book-title">${title}</span>
          <span class="qc-brand">Yuval · yuval.app</span>
        </div>
        ${coverPart}
      </div>
    `;
  }

  const overlay = document.createElement('div');
  overlay.id = 'qc-overlay';
  overlay.innerHTML = `
    <div id="qc-modal">
      <button id="qc-close-btn" aria-label="Close">✕</button>
      <div id="qc-preview-wrap">
        <div id="qc-card">${buildCardHTML(PALETTES[0])}</div>
      </div>
      <div id="qc-actions">
        <div class="qc-palette">
          ${PALETTES.map((p, i) => `
            <button class="qc-swatch${i === 0 ? ' active' : ''}"
              style="background:${p.bg}; box-shadow: 0 0 0 1px rgba(255,255,255,0.15) inset"
              data-idx="${i}" title="${p.label}" type="button"></button>
          `).join('')}
        </div>
        <button id="qc-download-btn" type="button">⬇ Download PNG</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Animate in
  requestAnimationFrame(() => overlay.classList.add('visible'));

  // Close
  const close = () => {
    overlay.classList.remove('visible');
    setTimeout(() => overlay.remove(), 250);
  };
  overlay.querySelector('#qc-close-btn')!.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); }, { once: true });

  // Palette swap
  overlay.querySelector('.qc-palette')!.addEventListener('click', e => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('.qc-swatch');
    if (!btn) return;
    const idx = parseInt(btn.dataset.idx || '0', 10);
    currentPalette = idx;
    overlay.querySelectorAll('.qc-swatch').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    const card = overlay.querySelector<HTMLElement>('#qc-card')!;
    card.innerHTML = buildCardHTML(PALETTES[idx]);
  });

  // Download via Canvas
  overlay.querySelector('#qc-download-btn')!.addEventListener('click', async () => {
    const dlBtn = overlay.querySelector<HTMLButtonElement>('#qc-download-btn')!;
    dlBtn.disabled = true;
    dlBtn.textContent = 'Generating…';

    try {
      const p = PALETTES[currentPalette];
      const W = 1080, H = 580;
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      // Background
      ctx.fillStyle = p.bg;
      ctx.beginPath();
      ctx.roundRect(0, 0, W, H, 24);
      ctx.fill();

      // Quote mark
      ctx.font = 'bold 110px Georgia, serif';
      ctx.fillStyle = p.accent;
      ctx.fillText('"', 52, 110);

      // Quote text — word-wrap
      ctx.font = '500 36px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#ffffff';
      const maxW = W - 112;
      const words = text.split(' ');
      let line = '', lines: string[] = [];
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxW && line) {
          lines.push(line); line = word;
        } else { line = test; }
      }
      if (line) lines.push(line);
      const lineH = 52;
      const totalTextH = lines.length * lineH;
      const textStartY = 140;
      lines.forEach((l, i) => ctx.fillText(l, 56, textStartY + i * lineH));

      // Footer bg
      const footerY = H - 100;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.roundRect(0, footerY, W, 100, [0, 0, 24, 24]);
      ctx.fill();

      // Book title
      ctx.font = 'bold 22px -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText(title, 56, footerY + 40);

      // Brand
      ctx.font = '500 16px -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText('Yuval · yuval.app', 56, footerY + 68);

      // Cover image (best-effort)
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((res, rej) => {
          img.onload = () => res();
          img.onerror = () => rej();
          img.src = coverUrl;
        });
        const cw = 60, ch = 86;
        const cx = W - cw - 48;
        const cy = footerY + (100 - ch) / 2;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(cx, cy, cw, ch, 6);
        ctx.clip();
        ctx.drawImage(img, cx, cy, cw, ch);
        ctx.restore();
      } catch { /* no cover — skip */ }

      // Download
      const link = document.createElement('a');
      link.download = `yuval-quote-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      dlBtn.disabled = false;
      dlBtn.textContent = '⬇ Download PNG';
    }
  });
}

// ── Main init ─────────────────────────────────────────────────────────────────

export function initHighlighter(signal: AbortSignal): void {
  injectStyles();
  restoreHighlights();

  // Re-restore when chapter content is swapped via fetch
  window.addEventListener('chapter-content-swapped', restoreHighlights, { signal });

  // ── Selection handler: show toolbar ──
  // Track whether mouse is held down — only show toolbar AFTER full release
  let isMouseDown = false;
  document.addEventListener('mousedown', () => { isMouseDown = true; }, { signal });

  document.addEventListener('mouseup', (e) => {
    isMouseDown = false;

    // Small delay so browser can finalize the selection after mouseup
    setTimeout(() => {
      if (isMouseDown) return; // another mousedown started — abort

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        hideToolbar();
        return;
      }

      const text = selection.toString().trim();
      if (text.length < 2) { hideToolbar(); return; }

      // Only trigger inside the reading content
      const contentEl = getContentEl();
      if (!contentEl) return;
      const range = selection.getRangeAt(0);
      if (!contentEl.contains(range.commonAncestorContainer)) {
        hideToolbar();
        return;
      }

      // Don't highlight inside code blocks
      if (range.commonAncestorContainer.parentElement?.closest('pre, code')) {
        hideToolbar();
        return;
      }

      const rect = range.getBoundingClientRect();
      showToolbar(rect);
    }, 50);
  }, { signal });

  // ── Toolbar color click: save & apply highlight ──
  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('.hl-dot[data-color]');
    if (!btn) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const text = selection.toString().trim();
    if (!text) return;

    const ctx = getPageContext();
    if (!ctx) return;

    const color = btn.dataset.color as ColorKey;
    const hl: HighlightData = {
      id: `hl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      text,
      color,
      timestamp: Date.now(),
    };

    const contentEl = getContentEl();
    if (!contentEl) return;

    selection.removeAllRanges();
    hideToolbar();

    const applied = applyHighlight(hl, contentEl);
    if (applied) {
      const list = loadHighlights(ctx.book, ctx.chapter, ctx.lang);
      list.push(hl);
      saveHighlights(ctx.book, ctx.chapter, ctx.lang, list);
    }
  }, { signal });

  // ── Hover over highlight: show popup ──
  document.addEventListener('mouseover', (e) => {
    const mark = (e.target as HTMLElement).closest<HTMLElement>('.yuval-hl');
    if (mark) {
      cancelHidePopup();
      showHoverPopup(mark);
    }
  }, { signal });

  document.addEventListener('mouseout', (e) => {
    const from = e.target as HTMLElement;
    const to   = e.relatedTarget as HTMLElement | null;
    if (from.closest('.yuval-hl') && !to?.closest('.yuval-hl, #hl-hover-popup')) {
      scheduleHidePopup();
    }
  }, { signal });

  // Keep popup open while hovering over it
  document.addEventListener('mouseover', (e) => {
    if ((e.target as HTMLElement).closest('#hl-hover-popup')) cancelHidePopup();
  }, { signal });

  document.addEventListener('mouseout', (e) => {
    const to = e.relatedTarget as HTMLElement | null;
    if ((e.target as HTMLElement).closest('#hl-hover-popup') && !to?.closest('#hl-hover-popup, .yuval-hl')) {
      scheduleHidePopup();
    }
  }, { signal });

  // Hide toolbar on outside click
  document.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('#hl-toolbar, .hl-dot')) {
      hideToolbar();
    }
  }, { signal });

  // ── Hide toolbar on scroll ──
  window.addEventListener('scroll', hideToolbar, { signal, passive: true });
}
