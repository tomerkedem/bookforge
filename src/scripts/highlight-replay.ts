/**
 * Highlight Replay — dynamic i18n version
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

// ── Highlight colors (typed) ────────────────────────────────────────────────

type HighlightColor = 'yellow' | 'blue' | 'green' | 'pink';

function isHighlightColor(v: string): v is HighlightColor {
  return v === 'yellow' || v === 'blue' || v === 'green' || v === 'pink';
}

const CARD_BG: Record<HighlightColor, string> = {
  yellow: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
  blue:   'linear-gradient(135deg, #eff6ff, #dbeafe)',
  green:  'linear-gradient(135deg, #f0fdf4, #dcfce7)',
  pink:   'linear-gradient(135deg, #fdf2f8, #fce7f3)',
};

const CARD_BG_DARK: Record<HighlightColor, string> = {
  yellow: 'rgba(234,179,8,0.12)',
  blue:   'rgba(59,130,246,0.12)',
  green:  'rgba(34,197,94,0.12)',
  pink:   'rgba(236,72,153,0.12)',
};

const CARD_BORDER: Record<HighlightColor, string> = {
  yellow: '#fde68a',
  blue: '#bfdbfe',
  green: '#bbf7d0',
  pink: '#fbcfe8',
};

const CARD_ACCENT: Record<HighlightColor, string> = {
  yellow: '#d97706',
  blue: '#2563eb',
  green: '#16a34a',
  pink: '#db2777',
};

const EMOJI: Record<HighlightColor, string> = {
  yellow: '💡',
  blue: '❓',
  green: '✅',
  pink: '💬',
};

// ── Data ───────────────────────────────────────────────────────────────────

interface HighlightEntry {
  id: string;
  text: string;
  color: string;
  note?: string;
  timestamp: number;
  chapter: string;
}

function getCurrentBook(): string {
  return document.getElementById('chapter-container')?.dataset.book || '';
}

function loadAllHighlights(book: string): HighlightEntry[] {
  const results: HighlightEntry[] = [];
  const prefix = `yuval_hl_${book}_ch`;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(prefix)) continue;

    const chapter = key.replace(prefix, '').replace(/_[a-z]{2}$/, '');

    try {
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      list.forEach((hl: HighlightEntry) => {
        results.push({ ...hl, chapter });
      });
    } catch {}
  }

  const seen = new Set<string>();
  return results
    .filter(h => { if (seen.has(h.id)) return false; seen.add(h.id); return true; })
    .sort((a, b) => a.chapter.localeCompare(b.chapter) || a.timestamp - b.timestamp);
}

// ── State ──────────────────────────────────────────────────────────────────

let currentIndex = 0;
let highlights: HighlightEntry[] = [];
let direction: 'next' | 'prev' = 'next';

// ── Render ──────────────────────────────────────────────────────────────────

function renderCard(idx: number): void {
  const isDark = document.documentElement.classList.contains('dark');
  const hl = highlights[idx];
  const area = document.getElementById('hr-card-area');
  if (!area) return;

  const color: HighlightColor = isHighlightColor(hl.color) ? hl.color : 'yellow';

  const bg = isDark ? CARD_BG_DARK[color] : CARD_BG[color];
  const border = CARD_BORDER[color];
  const accent = CARD_ACCENT[color];
  const emoji = EMOJI[color];

  const card = document.createElement('div');
  card.className = `hr-card enter-${direction}`;
  card.style.cssText = `background:${bg}; border-top:3px solid ${border}; color:${accent}`;

  card.innerHTML = `
    <div class="hr-card-emoji">${emoji}</div>
    <div class="hr-card-label">${tr(`highlight.${color}`)}</div>
    <div class="hr-card-text">${hl.text}</div>
    ${hl.note ? `<div class="hr-card-note">📝 ${hl.note}</div>` : ''}
    <div class="hr-card-chapter">${tr('highlight.chapter', { n: hl.chapter })}</div>
  `;

  area.innerHTML = '';
  area.appendChild(card);

  const counter = document.getElementById('hr-counter');
  if (counter) counter.textContent = `${idx + 1} / ${highlights.length}`;
}

// ── UI ─────────────────────────────────────────────────────────────────────

function open(): void {
  if (document.getElementById('hr-overlay')) return;

  const book = getCurrentBook();
  highlights = loadAllHighlights(book);
  currentIndex = 0;

  const overlay = document.createElement('div');
  overlay.id = 'hr-overlay';
  overlay.setAttribute('dir', getDir());

  if (!highlights.length) {
    overlay.innerHTML = `
      <div id="hr-modal">
        <div id="hr-header">
          <div id="hr-title">${tr('highlight.title')}</div>
          <button id="hr-close">${tr('common.close')}</button>
        </div>
        <div id="hr-empty">${tr('highlight.empty')}</div>
      </div>
    `;
  } else {
    overlay.innerHTML = `
      <div id="hr-modal">
        <div id="hr-header">
          <div>
            <div id="hr-title">${tr('highlight.title')}</div>
            <div id="hr-subtitle">${tr('highlight.count', { n: highlights.length })}</div>
          </div>
          <button id="hr-close">✕</button>
        </div>

        <div id="hr-card-area"></div>

        <div id="hr-footer">
          <button id="hr-prev">←</button>
          <div id="hr-counter"></div>
          <button id="hr-next">→</button>
        </div>
      </div>
    `;
  }

  document.body.appendChild(overlay);

  if (highlights.length) renderCard(0);

  document.getElementById('hr-close')?.addEventListener('click', () => overlay.remove());

  document.getElementById('hr-prev')?.addEventListener('click', () => {
    if (currentIndex > 0) {
      direction = 'prev';
      currentIndex--;
      renderCard(currentIndex);
    }
  });

  document.getElementById('hr-next')?.addEventListener('click', () => {
    if (currentIndex < highlights.length - 1) {
      direction = 'next';
      currentIndex++;
      renderCard(currentIndex);
    }
  });
}

// ── Init ────────────────────────────────────────────────────────────────────

export function initHighlightReplay(): void {
  (window as any).yuvalOpenHighlightReplay = open;

  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'r') {
      open();
    }
  });
}