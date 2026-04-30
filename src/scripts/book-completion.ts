/**
 * Book Completion - fully dynamic i18n version
 */

import { t, type TranslationKey, getI18nDirection, resolveLanguage } from '../i18n';
import { SOURCE_LANGUAGE } from '../utils/language';

// ── Language ────────────────────────────────────────────────────────────────

function getLang(): string {
  return resolveLanguage(
    new URLSearchParams(window.location.search).get('lang')
      || localStorage.getItem('yuval_language')
      || SOURCE_LANGUAGE
  );
}

function tr(key: TranslationKey, params?: Record<string, string | number>): string {
  return t(key, getLang(), params);
}

function getDir(): 'rtl' | 'ltr' {
  return getI18nDirection(getLang());
}

// ── Context ─────────────────────────────────────────────────────────────────

function getContext() {
  const el = document.getElementById('chapter-container');
  if (!el) return null;

  const titlesRaw = el.dataset.bookTitles;
  let titles: Record<string, string> = {};

  if (titlesRaw) {
    try {
      titles = JSON.parse(titlesRaw);
    } catch {}
  }

  return {
    book: el.dataset.book || '',
    titles,
    totalChapters: parseInt(el.dataset.totalChapters || '0', 10),
    wordCount: parseInt(el.dataset.wordCount || '0', 10),
  };
}

function getLocalizedText(map: Record<string, string>, lang: string): string {
  return map[lang] ?? map[SOURCE_LANGUAGE] ?? Object.values(map)[0] ?? '';
}

function isLastChapter(): boolean {
  return !document.querySelector('.chapter-nav-link[data-nav="next"]');
}

// ── Stats ───────────────────────────────────────────────────────────────────

function collectStats(book: string) {
  let chaptersRead = 0;
  let highlights = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    if (key.startsWith(`yuval_reading_progress_${book}_ch`)) {
      try {
        const d = JSON.parse(localStorage.getItem(key) || '{}');
        if ((d.scrollPosition || 0) > 100) chaptersRead++;
      } catch {}
    }

    if (key.startsWith(`yuval_hl_${book}_ch`)) {
      try {
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        highlights += list.length;
      } catch {}
    }
  }

  let streak = 0;
  try {
    const goal = JSON.parse(localStorage.getItem('yuval_reading_goal') || '{}');
    streak = goal.streak || 0;
  } catch {}

  return { chaptersRead, highlights, streak };
}

// ── Share ───────────────────────────────────────────────────────────────────

async function shareAchievement(text: string) {
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return;
    } catch {}
  }

  try {
    await navigator.clipboard.writeText(text);
  } catch {}
}

// ── Render ──────────────────────────────────────────────────────────────────

function show() {
  if (document.getElementById('book-completion-overlay')) return;

  const ctx = getContext();
  if (!ctx) return;

  const lang = getLang();
  const stats = collectStats(ctx.book);

  const total = ctx.totalChapters || stats.chaptersRead;
  const words = stats.chaptersRead * (ctx.wordCount || 2500);
  const wordsFormatted = words >= 1000 ? `${(words / 1000).toFixed(1)}k` : String(words);

  const title = getLocalizedText(ctx.titles, lang);

  const overlay = document.createElement('div');
  overlay.id = 'book-completion-overlay';
  overlay.setAttribute('dir', getDir());

  overlay.innerHTML = `
    <div id="book-completion-card">

      <button id="bc-close">✕</button>

      <span id="bc-trophy">🏆</span>

      <div id="bc-congrats">${tr('completion.title')}</div>
      <div id="bc-subtitle">${tr('completion.subtitle')}</div>
      <div id="bc-book-title">${title}</div>

      <div class="bc-stats">

        <div class="bc-stat">
          <span class="bc-stat-value">${total}</span>
          <span class="bc-stat-label">${tr('completion.chapters')}</span>
        </div>

        <div class="bc-stat">
          <span class="bc-stat-value">${wordsFormatted}</span>
          <span class="bc-stat-label">${tr('completion.words')}</span>
        </div>

        <div class="bc-stat">
          <span class="bc-stat-value">${stats.highlights}</span>
          <span class="bc-stat-label">${tr('completion.highlights')}</span>
        </div>

        <div class="bc-stat">
          <span class="bc-stat-value">${stats.streak}</span>
          <span class="bc-stat-label">${tr('completion.streak')}</span>
        </div>

      </div>

      <div class="bc-actions">
        <button id="bc-share-btn">${tr('completion.share')}</button>
        <a id="bc-library-btn" href="/">${tr('completion.library')}</a>
      </div>

    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('bc-close')?.addEventListener('click', () => {
    overlay.remove();
  });

  document.getElementById('bc-share-btn')?.addEventListener('click', () => {
    const text = `${title} · ${total} ${tr('completion.chapters')}`;
    shareAchievement(text);
  });

  if (ctx.book) {
    localStorage.setItem(`yuval_book_completed_${ctx.book}`, new Date().toISOString());
  }
}

// ── Observer ────────────────────────────────────────────────────────────────

let observer: IntersectionObserver | null = null;

function watchLastChapter() {
  observer?.disconnect();

  if (!isLastChapter()) return;

  const sentinel = document.getElementById('chapter-nav');
  if (!sentinel) return;

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        observer?.disconnect();
        setTimeout(show, 1200);
      }
    },
    { threshold: 0.3 }
  );

  observer.observe(sentinel);
}

// ── Init ────────────────────────────────────────────────────────────────────

export function initBookCompletion() {
  watchLastChapter();

  window.addEventListener('chapter-content-swapped', () => {
    setTimeout(watchLastChapter, 200);
  });

  window.addEventListener('language-changed', () => {
    const existing = document.getElementById('book-completion-overlay');
    if (existing) {
      existing.remove();
      show();
    }
  });
}