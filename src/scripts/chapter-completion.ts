/**
 * Chapter Completion Ritual
 *
 * When the reader scrolls to the bottom of the chapter content,
 * a completion panel slides up showing:
 *  - Chapter complete badge
 *  - Their highlights from this chapter
 *  - Next chapter preview + continue button
 *
 * Supports: Hebrew (RTL), English, Spanish
 */

// ── i18n ─────────────────────────────────────────────────────────────────────

function getLang(): string {
  return new URLSearchParams(window.location.search).get('lang')
    || localStorage.getItem('yuval_language')
    || 'en';
}

type LangKey = 'he' | 'en' | 'es';

const i18n: Record<LangKey, {
  complete: (n: number) => string;
  yourHighlights: string;
  noHighlights: string;
  next: string;
  continueReading: string;
  dir: 'rtl' | 'ltr';
  colorLabels: Record<string, string>;
}> = {
  he: {
    complete: (n) => `פרק ${n} הושלם ✓`,
    yourHighlights: 'ההדגשות שלך',
    noHighlights: 'לא סימנת טקסט בפרק זה',
    next: 'הבא',
    continueReading: 'המשך לקרוא ←',
    dir: 'rtl',
    colorLabels: { yellow: 'תובנה', blue: 'שאלה', green: 'פעולה', pink: 'ציטוט' },
  },
  es: {
    complete: (n) => `Capítulo ${n} completado ✓`,
    yourHighlights: 'Tus resaltados',
    noHighlights: 'No resaltaste texto en este capítulo',
    next: 'Siguiente',
    continueReading: 'Continuar leyendo →',
    dir: 'ltr',
    colorLabels: { yellow: 'Insight', blue: 'Pregunta', green: 'Acción', pink: 'Cita' },
  },
  en: {
    complete: (n) => `Chapter ${n} complete ✓`,
    yourHighlights: 'Your highlights',
    noHighlights: 'You didn\'t highlight anything in this chapter',
    next: 'Next',
    continueReading: 'Continue reading →',
    dir: 'ltr',
    colorLabels: { yellow: 'Insight', blue: 'Question', green: 'Action', pink: 'Quote' },
  },
};

function tr() {
  const lang = getLang() as LangKey;
  return i18n[lang] ?? i18n.en;
}

// ── Highlight colors ──────────────────────────────────────────────────────────

const COLOR_BG: Record<string, string> = {
  yellow: '#fef9c3',
  blue:   '#dbeafe',
  green:  '#dcfce7',
  pink:   '#fce7f3',
};
const COLOR_DARK_BG: Record<string, string> = {
  yellow: 'rgba(234,179,8,0.15)',
  blue:   'rgba(59,130,246,0.15)',
  green:  'rgba(34,197,94,0.15)',
  pink:   'rgba(236,72,153,0.15)',
};
const COLOR_TEXT: Record<string, string> = {
  yellow: '#713f12',
  blue:   '#1e3a8a',
  green:  '#14532d',
  pink:   '#831843',
};
const COLOR_EMOJI: Record<string, string> = {
  yellow: '💡', blue: '❓', green: '✅', pink: '💬',
};

// ── Storage (mirrors highlighter.ts) ─────────────────────────────────────────

interface HighlightData {
  id: string;
  text: string;
  color: string;
  timestamp: number;
}

function loadHighlights(book: string, chapter: string, lang: string): HighlightData[] {
  try {
    return JSON.parse(
      localStorage.getItem(`yuval_hl_${book}_ch${chapter}_${lang}`) || '[]'
    );
  } catch { return []; }
}

// ── Context ───────────────────────────────────────────────────────────────────

function getContext() {
  const container = document.getElementById('chapter-container');
  if (!container) return null;
  return {
    book:    container.dataset.book || '',
    chapter: container.dataset.chapterId || '',
    lang:    getLang(),
  };
}

function getNextChapterInfo(): { url: string; title: string } | null {
  const link = document.querySelector<HTMLAnchorElement>('.chapter-nav-link[data-nav="next"]');
  if (!link) return null;
  const titleEl = link.querySelector<HTMLElement>('[data-en], span:not(.sr-only)');
  const lang = getLang();
  let title = '';
  if (titleEl) {
    title = titleEl.getAttribute(`data-${lang}`)
      || titleEl.getAttribute('data-en')
      || titleEl.textContent?.trim()
      || '';
  }
  return { url: link.href, title };
}

function getChapterNumber(): number {
  const match = window.location.pathname.match(/\/(\d+)(?:\/|$)/);
  return match ? parseInt(match[1], 10) : 0;
}

// ── CSS ───────────────────────────────────────────────────────────────────────

function injectStyles(): void {
  if (document.getElementById('chapter-completion-styles')) return;
  const s = document.createElement('style');
  s.id = 'chapter-completion-styles';
  s.textContent = `
    @keyframes ccSlideUp {
      from { opacity: 0; transform: translateY(32px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    #chapter-completion {
      margin: 48px 0 0;
      border-top: 1px solid var(--yuval-border, #e5e7eb);
      padding-top: 40px;
      animation: ccSlideUp 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards;
    }

    /* ── Badge ── */
    .cc-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 100px;
      font-size: 13px;
      font-weight: 600;
      color: #15803d;
      margin-bottom: 28px;
    }
    :is(.dark) .cc-badge {
      background: rgba(34,197,94,0.1);
      border-color: rgba(34,197,94,0.25);
      color: #4ade80;
    }
    .cc-badge-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 0 3px rgba(34,197,94,0.2);
    }

    /* ── Highlights section ── */
    .cc-highlights-title {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--yuval-text-muted, #9ca3af);
      margin-bottom: 12px;
    }

    .cc-highlights-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 32px;
    }

    .cc-highlight-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 13.5px;
      line-height: 1.6;
    }

    .cc-highlight-emoji { flex-shrink: 0; font-size: 15px; margin-top: 1px; }

    .cc-highlight-text {
      flex: 1;
      color: var(--yuval-text-secondary, #374151);
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .cc-no-highlights {
      font-size: 13px;
      color: var(--yuval-text-muted, #9ca3af);
      font-style: italic;
      margin-bottom: 32px;
    }

    /* ── Next chapter card ── */
    .cc-next {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 18px 22px;
      background: var(--yuval-surface, #f9fafb);
      border: 1px solid var(--yuval-border, #e5e7eb);
      border-radius: 14px;
      text-decoration: none;
      transition: background 0.15s, box-shadow 0.15s, transform 0.2s;
    }
    .cc-next:hover {
      background: var(--yuval-bg-secondary, #f3f4f6);
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      transform: translateY(-2px);
    }
    :is(.dark) .cc-next {
      background: rgba(255,255,255,0.04);
      border-color: rgba(255,255,255,0.08);
    }
    :is(.dark) .cc-next:hover {
      background: rgba(255,255,255,0.07);
    }

    .cc-next-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--yuval-text-muted, #9ca3af);
      margin-bottom: 4px;
    }
    .cc-next-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--yuval-text, #111);
      line-height: 1.4;
    }
    .cc-next-arrow {
      font-size: 20px;
      color: var(--yuval-text-muted, #9ca3af);
      flex-shrink: 0;
      transition: transform 0.2s;
    }
    .cc-next:hover .cc-next-arrow { transform: translateX(4px); }
    [dir="rtl"] .cc-next:hover .cc-next-arrow { transform: translateX(-4px); }
  `;
  document.head.appendChild(s);
}

// ── Render ────────────────────────────────────────────────────────────────────

function buildCompletionPanel(): HTMLElement | null {
  const ctx = getContext();
  if (!ctx) return null;

  const labels = tr();
  const isDark = document.documentElement.classList.contains('dark');
  const highlights = loadHighlights(ctx.book, ctx.chapter, ctx.lang);
  const nextInfo = getNextChapterInfo();
  const chNum = getChapterNumber();

  const panel = document.createElement('div');
  panel.id = 'chapter-completion';
  panel.setAttribute('dir', labels.dir);

  // Badge
  const badge = `
    <div class="cc-badge">
      <span class="cc-badge-dot"></span>
      ${labels.complete(chNum)}
    </div>
  `;

  // Highlights
  let highlightsHtml = '';
  if (highlights.length > 0) {
    const items = highlights.slice(-5).map(hl => {
      const bg   = isDark ? COLOR_DARK_BG[hl.color] : COLOR_BG[hl.color];
      const text = COLOR_TEXT[hl.color];
      const emoji = COLOR_EMOJI[hl.color];
      const colorLabel = labels.colorLabels[hl.color] || '';
      const truncated = hl.text.length > 120 ? hl.text.slice(0, 120) + '…' : hl.text;
      return `
        <div class="cc-highlight-item" style="background:${bg}">
          <span class="cc-highlight-emoji">${emoji}</span>
          <span class="cc-highlight-text" style="color:${text}" title="${colorLabel}">${truncated}</span>
        </div>
      `;
    }).join('');

    highlightsHtml = `
      <div class="cc-highlights-title">${labels.yourHighlights}</div>
      <div class="cc-highlights-list">${items}</div>
    `;
  } else {
    highlightsHtml = `<p class="cc-no-highlights">${labels.noHighlights}</p>`;
  }

  // Next chapter
  let nextHtml = '';
  if (nextInfo) {
    const arrow = labels.dir === 'rtl' ? '←' : '→';
    nextHtml = `
      <a class="cc-next" href="${nextInfo.url}" data-nav-url="${nextInfo.url}">
        <div>
          <div class="cc-next-label">${labels.next}</div>
          <div class="cc-next-title">${nextInfo.title || ''}</div>
        </div>
        <span class="cc-next-arrow">${arrow}</span>
      </a>
    `;
  }

  panel.innerHTML = badge + highlightsHtml + nextHtml;
  return panel;
}

// ── Inject into page ──────────────────────────────────────────────────────────

/** Save chapter completion to localStorage and update sidebar */
function markChapterComplete(book: string, chapter: string): void {
  const key = `yuval_ch_complete_${book}`;
  let completed: string[] = [];
  try {
    completed = JSON.parse(localStorage.getItem(key) || '[]');
  } catch { /* ignore */ }
  
  if (!completed.includes(chapter)) {
    completed.push(chapter);
    localStorage.setItem(key, JSON.stringify(completed));
  }
  
  // Update sidebar checkmarks in real-time
  updateSidebarCheckmarks(book);
  
  // Dispatch event for other components
  window.dispatchEvent(new CustomEvent('chapter-completed', { 
    detail: { book, chapter } 
  }));
}

/** Update all sidebar chapter items with completion checkmarks */
function updateSidebarCheckmarks(book: string): void {
  const key = `yuval_ch_complete_${book}`;
  let completed: string[] = [];
  try {
    completed = JSON.parse(localStorage.getItem(key) || '[]');
  } catch { /* ignore */ }
  
  // Find all chapter links in sidebar and mobile drawer
  const chapterItems = document.querySelectorAll<HTMLElement>('[data-chapter-id]');
  
  chapterItems.forEach(item => {
    const chapterId = item.dataset.chapterId;
    if (!chapterId) return;
    
    const isComplete = completed.includes(chapterId);
    const link = item.tagName === 'A' ? item : item.querySelector('a');
    if (!link) return;
    
    // Remove existing checkmark if any
    link.querySelector('.chapter-complete-check')?.remove();
    
    if (isComplete) {
      // Add checkmark
      const check = document.createElement('span');
      check.className = 'chapter-complete-check';
      check.innerHTML = '✓';
      check.style.cssText = `
        color: #22c55e;
        font-weight: 600;
        font-size: 12px;
        margin-inline-start: auto;
        flex-shrink: 0;
      `;
      link.style.display = 'flex';
      link.style.alignItems = 'center';
      link.appendChild(check);
      
      // Add completed class for styling
      item.classList.add('toc-item-completed');
    } else {
      item.classList.remove('toc-item-completed');
    }
  });
}

function injectPanel(): void {
  document.getElementById('chapter-completion')?.remove();

  const nav = document.getElementById('chapter-nav');
  if (!nav) return;

  const panel = buildCompletionPanel();
  if (!panel) return;

  // Mark chapter as complete
  const ctx = getContext();
  if (ctx) {
    markChapterComplete(ctx.book, ctx.chapter);
  }

  // Insert before ChapterNavigation
  nav.parentNode?.insertBefore(panel, nav);

  // Fetch-based navigation: intercept "Next" link
  panel.querySelector<HTMLAnchorElement>('.cc-next')?.addEventListener('click', async (e) => {
    const url = (e.currentTarget as HTMLAnchorElement).href;
    const loadFn = (window as any).yuvalLoadChapter as ((url: string) => Promise<void>) | undefined;
    if (loadFn) {
      e.preventDefault();
      await loadFn(url);
    }
  });
}

// ── Reading quality check ─────────────────────────────────────────────────────

const MIN_READ_SECONDS = 20;   // at least 20s on the chapter
const MIN_SCROLL_PCT   = 0.7;  // scrolled at least 70% of content height

let chapterEnteredAt = 0;

function hasReadEnough(): boolean {
  // Time check
  const elapsed = (Date.now() - chapterEnteredAt) / 1000;
  if (elapsed < MIN_READ_SECONDS) return false;

  // Scroll check — how far through the article content?
  const container = document.getElementById('chapter-container');
  if (!container) return true;
  const rect = container.getBoundingClientRect();
  const totalH = container.offsetHeight;
  if (totalH === 0) return true;
  const scrolled = window.scrollY + window.innerHeight - (window.scrollY + rect.top);
  return scrolled / totalH >= MIN_SCROLL_PCT;
}

// ── Intersection Observer — trigger when nav reaches viewport ─────────────────

let triggered = false;
let observer: IntersectionObserver | null = null;

function watchChapterEnd(): void {
  triggered = false;
  chapterEnteredAt = Date.now();
  observer?.disconnect();

  const sentinel = document.getElementById('chapter-nav');
  if (!sentinel) return;

  observer = new IntersectionObserver(
    (entries) => {
      if (triggered) return;
      if (entries[0].isIntersecting && hasReadEnough()) {
        triggered = true;
        observer?.disconnect();
        setTimeout(injectPanel, 300);
      }
    },
    { threshold: 0.3 }
  );

  observer.observe(sentinel);
}

// ── Export ────────────────────────────────────────────────────────────────────

export function initChapterCompletion(): void {
  injectStyles();
  
  // Load existing checkmarks on page load
  const ctx = getContext();
  if (ctx) {
    updateSidebarCheckmarks(ctx.book);
  }
  
  watchChapterEnd();

  // Re-init on fetch-based chapter navigation
  window.addEventListener('chapter-content-swapped', () => {
    triggered = false;
    // Update checkmarks for new context
    const newCtx = getContext();
    if (newCtx) {
      updateSidebarCheckmarks(newCtx.book);
    }
    // Wait for new DOM to settle
    setTimeout(watchChapterEnd, 200);
  });
}

// Export for external use
export { updateSidebarCheckmarks };
