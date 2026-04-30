/**
 * Reading Stats Panel - dynamic i18n version
 */

import { t, type TranslationKey, getI18nDirection, resolveLanguage } from '../i18n';

// ── Language ────────────────────────────────────────────────────────────────

function getLang(): string {
  return resolveLanguage(
    new URLSearchParams(window.location.search).get('lang')
      || localStorage.getItem('yuval_language')
      || 'en'
  );
}

function tr(key: TranslationKey, params?: Record<string, string | number>): string {
  return t(key, getLang(), params);
}

function getDir(): 'rtl' | 'ltr' {
  return getI18nDirection(getLang());
}

// ── Data helpers ─────────────────────────────────────────────────────────────

function getCurrentBook(): string {
  return document.getElementById('chapter-container')?.dataset.book || '';
}

interface StatsResult {
  chaptersRead: number;
  totalChapters: number;
  wordsRead: number;
  highlights: number;
  streak: number;
}

function STREAK_KEY(book: string) {
  return `yuval_streak_${book}`;
}

function computeStats(): StatsResult {
  const book = getCurrentBook();

  let chaptersRead = 0;
  let wordsRead = 0;
  let totalChapters = 0;

  document.querySelectorAll<HTMLElement>('[data-chapter-id]').forEach(el => {
    if (el.tagName === 'LI') totalChapters++;
  });

  if (!totalChapters) {
    totalChapters = document.querySelectorAll('.toc-item').length;
  }

  try {
    const completed = JSON.parse(
      localStorage.getItem(`yuval_ch_complete_${book}`) || '[]'
    );
    chaptersRead = completed.length;
  } catch {}

  const currentWordCount = parseInt(
    document.getElementById('chapter-container')?.dataset.wordCount || '0',
    10
  );

  const avg = currentWordCount > 0 ? currentWordCount : 2500;
  wordsRead = chaptersRead * avg;

  let highlights = 0;
  const prefix = `yuval_hl_${book}_ch`;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(prefix)) continue;

    try {
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      highlights += list.length;
    } catch {}
  }

  const streak = computeStreak(book);

  return { chaptersRead, totalChapters, wordsRead, highlights, streak };
}

function computeStreak(book: string): number {
  const key = STREAK_KEY(book);
  const today = new Date().toISOString().slice(0, 10);

  try {
    const stored = JSON.parse(localStorage.getItem(key) || '{}');
    const { lastDate, count = 0 } = stored;

    if (!lastDate) {
      localStorage.setItem(key, JSON.stringify({ lastDate: today, count: 1 }));
      return 1;
    }

    const last = new Date(lastDate);
    const now = new Date(today);
    const diff = Math.round((now.getTime() - last.getTime()) / 86400000);

    if (diff === 0) return count;

    if (diff === 1) {
      const newCount = count + 1;
      localStorage.setItem(key, JSON.stringify({ lastDate: today, count: newCount }));
      return newCount;
    }

    localStorage.setItem(key, JSON.stringify({ lastDate: today, count: 1 }));
    return 1;
  } catch {
    return 1;
  }
}

// ── UI ───────────────────────────────────────────────────────────────────────

function buildWidget(): void {
  if (document.getElementById('stats-modal')) return;

  const btn = document.createElement('button');
  btn.id = 'stats-fab-btn';
  btn.type = 'button';
  btn.setAttribute('aria-label', tr('stats.title'));
  btn.title = tr('stats.title');
  btn.innerHTML = '📊';
  document.body.appendChild(btn);

  const overlay = document.createElement('div');
  overlay.id = 'stats-overlay';
  document.body.appendChild(overlay);

  const modal = document.createElement('div');
  modal.id = 'stats-modal';
  document.body.appendChild(modal);

  btn.addEventListener('click', openStats);
  overlay.addEventListener('click', closeStats);
}

function formatWords(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function renderStats(): void {
  const modal = document.getElementById('stats-modal');
  if (!modal) return;

  const stats = computeStats();
  const lang = getLang();

  const pct = stats.totalChapters > 0
    ? Math.round((stats.chaptersRead / stats.totalChapters) * 100)
    : 0;

  modal.setAttribute('dir', getDir());

  modal.innerHTML = `
    <div id="stats-modal-header">
      <span>${tr('stats.title')}</span>
      <button id="stats-close">${tr('stats.close')}</button>
    </div>

    <div class="stats-grid">

      <div class="stat-card">
        <div>${stats.chaptersRead} ${tr('stats.of')} ${stats.totalChapters}</div>
        <div>${tr('stats.chapters')}</div>
      </div>

      <div class="stat-card">
        <div>${formatWords(stats.wordsRead)}</div>
        <div>${tr('stats.words')}</div>
      </div>

      <div class="stat-card">
        <div>${stats.highlights}</div>
        <div>${tr('stats.highlights')}</div>
      </div>

      <div class="stat-card">
        <div>${t('stats.streakDays', lang, { n: stats.streak })}</div>
        <div>${tr('stats.streak')}</div>
      </div>

    </div>
  `;

  document.getElementById('stats-close')?.addEventListener('click', closeStats);
}

function openStats(): void {
  renderStats();
  document.getElementById('stats-overlay')?.classList.add('open');
  document.getElementById('stats-modal')?.classList.add('open');
}

function closeStats(): void {
  document.getElementById('stats-overlay')?.classList.remove('open');
  document.getElementById('stats-modal')?.classList.remove('open');
}

// ── Init ─────────────────────────────────────────────────────────────────────

export function initReadingStats(): void {
  buildWidget();

  const book = getCurrentBook();
  if (book) computeStreak(book);

  window.addEventListener('language-changed', () => {
    const button = document.getElementById('stats-fab-btn');
    if (button) {
      button.setAttribute('aria-label', tr('stats.title'));
    }

    if (document.getElementById('stats-modal')?.classList.contains('open')) {
      renderStats();
    }
  });
}