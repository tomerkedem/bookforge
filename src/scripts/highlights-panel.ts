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

// ── Highlight types ─────────────────────────────────────────────────────────

type HighlightColor = 'yellow' | 'blue' | 'green' | 'pink';

function isHighlightColor(v: string): v is HighlightColor {
  return v === 'yellow' || v === 'blue' || v === 'green' || v === 'pink';
}

// ── Types ───────────────────────────────────────────────────────────────────

interface HighlightData {
  id: string;
  text: string;
  color: string;
  timestamp: number;
  note?: string;
}

interface ChapterHighlights {
  chapterId: number;
  highlights: HighlightData[];
}

// ── Colors ──────────────────────────────────────────────────────────────────

const COLOR_EMOJI: Record<HighlightColor, string> = {
  yellow: '💡',
  blue: '❓',
  green: '✅',
  pink: '💬',
};

const COLOR_BG: Record<HighlightColor, string> = {
  yellow: '#fef9c3',
  blue: '#dbeafe',
  green: '#dcfce7',
  pink: '#fce7f3',
};

const COLOR_DARK_BG: Record<HighlightColor, string> = {
  yellow: 'rgba(234,179,8,0.18)',
  blue: 'rgba(59,130,246,0.18)',
  green: 'rgba(34,197,94,0.18)',
  pink: 'rgba(236,72,153,0.18)',
};

const COLOR_TEXT: Record<HighlightColor, string> = {
  yellow: '#713f12',
  blue: '#1e3a8a',
  green: '#14532d',
  pink: '#831843',
};

const COLOR_DARK_TEXT: Record<HighlightColor, string> = {
  yellow: '#fde68a',
  blue: '#93c5fd',
  green: '#86efac',
  pink: '#f9a8d4',
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function getCurrentBook(): string {
  return document.getElementById('chapter-container')?.dataset.book || '';
}

function getAllHighlights(): ChapterHighlights[] {
  const book = getCurrentBook();
  if (!book) return [];

  const prefix = `yuval_hl_${book}_ch`;
  const result: ChapterHighlights[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(prefix)) continue;

    const rest = key.slice(prefix.length);
    const [chStr] = rest.split('_');
    const chapterId = parseInt(chStr, 10);
    if (isNaN(chapterId)) continue;

    try {
      const list: HighlightData[] = JSON.parse(localStorage.getItem(key) || '[]');
      if (list.length) result.push({ chapterId, highlights: list });
    } catch {}
  }

  return result.sort((a, b) => a.chapterId - b.chapterId);
}

// ── Panel ───────────────────────────────────────────────────────────────────

function renderPanel(): void {
  const panel = document.getElementById('hl-panel');
  if (!panel) return;

  const isDark = document.documentElement.classList.contains('dark');
  const chapters = getAllHighlights();

  panel.setAttribute('dir', getDir());

  panel.innerHTML = `
    <div id="hl-panel-header">
      <span>${tr('highlights.title')}</span>
      <button id="hl-panel-close">✕</button>
    </div>
    <div id="hl-panel-body"></div>
  `;

  document.getElementById('hl-panel-close')?.addEventListener('click', closePanel);

  const body = document.getElementById('hl-panel-body')!;

  if (!chapters.length) {
    body.innerHTML = `
      <div class="hl-panel-empty">
        <span>${tr('highlights.empty')}</span>
        <span>${tr('highlights.emptyHint')}</span>
      </div>
    `;
    return;
  }

  chapters.forEach(({ chapterId, highlights }) => {
    const group = document.createElement('div');
    group.innerHTML = `<div>${tr('highlights.chapter', { n: chapterId })}</div>`;

    highlights.forEach(hl => {
      const color: HighlightColor = isHighlightColor(hl.color) ? hl.color : 'yellow';

      const bg = isDark ? COLOR_DARK_BG[color] : COLOR_BG[color];
      const text = isDark ? COLOR_DARK_TEXT[color] : COLOR_TEXT[color];
      const emoji = COLOR_EMOJI[color];

      const item = document.createElement('div');
      item.style.background = bg;

      item.innerHTML = `
        <span>${emoji}</span>
        <div>
          <div style="color:${text}">${hl.text}</div>
          <div>${tr(`highlight.${color}`)}</div>
        </div>
      `;

      group.appendChild(item);
    });

    body.appendChild(group);
  });
}

// ── Open / Close ────────────────────────────────────────────────────────────

function openPanel(): void {
  renderPanel();
  document.getElementById('hl-overlay')?.classList.add('open');
  document.getElementById('hl-panel')?.classList.add('open');
}

function closePanel(): void {
  document.getElementById('hl-overlay')?.classList.remove('open');
  document.getElementById('hl-panel')?.classList.remove('open');
}

// ── Init ────────────────────────────────────────────────────────────────────

function applyLabels(btn: HTMLButtonElement): void {
  btn.setAttribute('aria-label', tr('aria.highlights'));
  btn.title = tr('aria.highlights');
}

export function initHighlightsPanel(): void {
  if (document.getElementById('highlights-fab')) return;

  const btn = document.createElement('button');
  btn.id = 'highlights-fab';
  btn.type = 'button';
  btn.textContent = '💡';
  applyLabels(btn);
  btn.onclick = openPanel;
  document.body.appendChild(btn);

  const overlay = document.createElement('div');
  overlay.id = 'hl-overlay';
  overlay.addEventListener('click', closePanel);
  document.body.appendChild(overlay);

  const panel = document.createElement('div');
  panel.id = 'hl-panel';
  document.body.appendChild(panel);

  window.addEventListener('language-changed', () => {
    applyLabels(btn);
    if (panel.classList.contains('open')) renderPanel();
  });
}