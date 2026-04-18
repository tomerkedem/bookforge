/**
 * Chapter Completion — dynamic i18n version
 */

import { t, getI18nDirection, resolveLanguage } from '../i18n';
import { SOURCE_LANGUAGE } from '../utils/language';

// ── Language ────────────────────────────────────────────────────────────────

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

function getDir(): 'rtl' | 'ltr' {
  return getI18nDirection(getLang());
}

// ── Highlight visuals ───────────────────────────────────────────────────────

type HighlightColor = 'yellow' | 'blue' | 'green' | 'pink';

const COLOR_BG: Record<HighlightColor, string> = {
  yellow: '#fef9c3',
  blue: '#dbeafe',
  green: '#dcfce7',
  pink: '#fce7f3',
};

const COLOR_DARK_BG: Record<HighlightColor, string> = {
  yellow: 'rgba(234,179,8,0.15)',
  blue: 'rgba(59,130,246,0.15)',
  green: 'rgba(34,197,94,0.15)',
  pink: 'rgba(236,72,153,0.15)',
};

const COLOR_TEXT: Record<HighlightColor, string> = {
  yellow: '#713f12',
  blue: '#1e3a8a',
  green: '#14532d',
  pink: '#831843',
};

const COLOR_EMOJI: Record<HighlightColor, string> = {
  yellow: '💡',
  blue: '❓',
  green: '✅',
  pink: '💬',
};

function isHighlightColor(value: string): value is HighlightColor {
  return value === 'yellow' || value === 'blue' || value === 'green' || value === 'pink';
}

// ── Storage ─────────────────────────────────────────────────────────────────

interface HighlightData {
  id: string;
  text: string;
  color: string;
  timestamp: number;
}

function loadHighlights(book: string, chapter: string): HighlightData[] {
  try {
    return JSON.parse(
      localStorage.getItem(`yuval_hl_${book}_ch${chapter}`) || '[]'
    );
  } catch {
    return [];
  }
}

// ── Context ─────────────────────────────────────────────────────────────────

function getContext() {
  const el = document.getElementById('chapter-container');
  if (!el) return null;

  let titles: Record<string, string> = {};
  try {
    titles = JSON.parse(el.dataset.bookTitles || '{}');
  } catch {}

  return {
    book: el.dataset.book || '',
    chapter: el.dataset.chapterId || '',
    titles,
  };
}

function getLocalizedText(map: Record<string, string>, lang: string): string {
  return map[lang] ?? map[SOURCE_LANGUAGE] ?? Object.values(map)[0] ?? '';
}

function getChapterNumber(): number {
  const match = window.location.pathname.match(/\/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function getNextChapterInfo(): { url: string; title: string } | null {
  const link = document.querySelector<HTMLAnchorElement>('.chapter-nav-link[data-nav="next"]');
  if (!link) return null;

  const lang = getLang();
  const titlesRaw = link.dataset.chapterTitles;

  if (titlesRaw) {
    try {
      const titles = JSON.parse(titlesRaw);
      return {
        url: link.href,
        title: getLocalizedText(titles, lang),
      };
    } catch {}
  }

  return { url: link.href, title: '' };
}

// ── CSS ─────────────────────────────────────────────────────────────────────

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
      text-align: start;
    }
    #chapter-completion[dir="ltr"] { direction: ltr; text-align: left; }
    #chapter-completion[dir="rtl"] { direction: rtl; text-align: right; }
    #chapter-completion[dir="ltr"] .cc-highlight-text,
    #chapter-completion[dir="ltr"] .cc-next-title,
    #chapter-completion[dir="ltr"] .cc-next-label,
    #chapter-completion[dir="ltr"] .cc-highlights-title,
    #chapter-completion[dir="ltr"] .cc-no-highlights { text-align: left; }

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

    .cc-badge-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 0 3px rgba(34,197,94,0.2);
    }

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

    .cc-highlight-emoji {
      flex-shrink: 0;
      font-size: 15px;
      margin-top: 1px;
    }

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

    .cc-next:hover .cc-next-arrow {
      transform: translateX(4px);
    }

    [dir="rtl"] .cc-next:hover .cc-next-arrow {
      transform: translateX(-4px);
    }
  `;

  document.head.appendChild(s);
}

// ── Render ──────────────────────────────────────────────────────────────────

function buildCompletionPanel(): HTMLElement | null {
  const ctx = getContext();
  if (!ctx) return null;

  const lang = getLang();
  const isDark = document.documentElement.classList.contains('dark');

  const highlights = loadHighlights(ctx.book, ctx.chapter);
  const next = getNextChapterInfo();
  const chNum = getChapterNumber();

  const panel = document.createElement('div');
  panel.id = 'chapter-completion';
  panel.setAttribute('dir', getDir());

  const badge = `
    <div class="cc-badge">
      <span class="cc-badge-dot"></span>
      ${tr('completion.chapterComplete', { n: chNum })}
    </div>
  `;

  let highlightsHtml = '';

  if (highlights.length) {
    const items = highlights.slice(-5).map(h => {
      const color: HighlightColor = isHighlightColor(h.color) ? h.color : 'yellow';
      const bg = isDark ? COLOR_DARK_BG[color] : COLOR_BG[color];
      const textColor = COLOR_TEXT[color];
      const emoji = COLOR_EMOJI[color];
      const txt = h.text.length > 120 ? h.text.slice(0, 120) + '…' : h.text;

      return `
        <div class="cc-highlight-item" style="background:${bg}">
          <span class="cc-highlight-emoji">${emoji}</span>
          <span class="cc-highlight-text" style="color:${textColor}">${txt}</span>
        </div>
      `;
    }).join('');

    highlightsHtml = `
      <div class="cc-highlights-title">${tr('completion.highlightsTitle')}</div>
      <div class="cc-highlights-list">${items}</div>
    `;
  } else {
    highlightsHtml = `<p class="cc-no-highlights">${tr('completion.noHighlights')}</p>`;
  }

  let nextHtml = '';
  if (next) {
    const arrow = getDir() === 'rtl' ? '←' : '→';

    nextHtml = `
      <a class="cc-next" href="${next.url}">
        <div>
          <div class="cc-next-label">${tr('completion.next')}</div>
          <div class="cc-next-title">${next.title}</div>
        </div>
        <span class="cc-next-arrow">${arrow}</span>
      </a>
    `;
  }

  panel.innerHTML = badge + highlightsHtml + nextHtml;
  return panel;
}

// ── Inject ──────────────────────────────────────────────────────────────────

function injectPanel(): void {
  document.getElementById('chapter-completion')?.remove();

  const nav = document.getElementById('chapter-nav');
  if (!nav) return;

  const panel = buildCompletionPanel();
  if (!panel) return;

  nav.parentNode?.insertBefore(panel, nav);
}

// ── Observer ────────────────────────────────────────────────────────────────

let observer: IntersectionObserver | null = null;

function watchEnd(): void {
  observer?.disconnect();

  const sentinel = document.getElementById('chapter-nav');
  if (!sentinel) return;

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        observer?.disconnect();
        setTimeout(injectPanel, 300);
      }
    },
    { threshold: 0.3 }
  );

  observer.observe(sentinel);
}

// ── Init ────────────────────────────────────────────────────────────────────

export function initChapterCompletion(): void {
  injectStyles();
  watchEnd();

  window.addEventListener('chapter-content-swapped', () => {
    setTimeout(watchEnd, 200);
  });

  window.addEventListener('language-changed', () => {
    if (document.getElementById('chapter-completion')) {
      setTimeout(injectPanel, 0);
    }
  });
}