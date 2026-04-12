/**
 * Reading Stats Panel — shows chapters read, words read, highlights, streak.
 * Triggered by a small "📊" button injected near the FAB cluster.
 */

type LangKey = 'he' | 'en' | 'es';

function getLang(): LangKey {
  return (new URLSearchParams(window.location.search).get('lang')
    || localStorage.getItem('yuval_language')
    || 'en') as LangKey;
}

// ── i18n ─────────────────────────────────────────────────────────────────────

const i18n: Record<LangKey, {
  title: string;
  chaptersRead: string;
  wordsRead: string;
  highlights: string;
  streak: string;
  streakDays: (n: number) => string;
  of: string;
  close: string;
  dir: 'rtl' | 'ltr';
}> = {
  he: {
    title: 'סטטיסטיקות קריאה',
    chaptersRead: 'פרקים שהושלמו',
    wordsRead: 'מילים נקראו',
    highlights: 'הדגשות שמורות',
    streak: 'רצף קריאה',
    streakDays: (n) => n === 1 ? 'יום אחד' : `${n} ימים`,
    of: 'מתוך',
    close: 'סגור',
    dir: 'rtl',
  },
  es: {
    title: 'Estadísticas',
    chaptersRead: 'Capítulos leídos',
    wordsRead: 'Palabras leídas',
    highlights: 'Resaltados guardados',
    streak: 'Racha de lectura',
    streakDays: (n) => n === 1 ? '1 día' : `${n} días`,
    of: 'de',
    close: 'Cerrar',
    dir: 'ltr',
  },
  en: {
    title: 'Reading Stats',
    chaptersRead: 'Chapters completed',
    wordsRead: 'Words read',
    highlights: 'Saved highlights',
    streak: 'Reading streak',
    streakDays: (n) => n === 1 ? '1 day' : `${n} days`,
    of: 'of',
    close: 'Close',
    dir: 'ltr',
  },
};

function tr() { return i18n[getLang()]; }

// ── Data helpers ──────────────────────────────────────────────────────────────

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

function STREAK_KEY(book: string) { return `yuval_streak_${book}`; }

function computeStats(): StatsResult {
  const book = getCurrentBook();

  // Count completed chapters from the completion storage
  let chaptersRead = 0;
  let wordsRead = 0;
  let totalChapters = 0;

  // Get chapter count from sidebar TOC links
  document.querySelectorAll<HTMLElement>('[data-chapter-id]').forEach(el => {
    if (el.tagName === 'LI') totalChapters++;
  });
  // Fallback: count from sidebar TOC
  if (!totalChapters) {
    totalChapters = document.querySelectorAll('.toc-item').length;
  }

  // Get completed chapters from the proper completion storage
  try {
    const completedChapters = JSON.parse(
      localStorage.getItem(`yuval_ch_complete_${book}`) || '[]'
    );
    chaptersRead = completedChapters.length;
  } catch { /* skip */ }

  // Estimate words read: chapters read × avg word count of current chapter
  const currentWordCount = parseInt(
    document.getElementById('chapter-container')?.dataset.wordCount || '0', 10
  );
  const avgWordsPerChapter = currentWordCount > 0 ? currentWordCount : 2500;
  wordsRead = chaptersRead * avgWordsPerChapter;

  // Count highlights across all chapters
  let highlights = 0;
  const hlPrefix = `yuval_hl_${book}_ch`;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(hlPrefix)) continue;
    try {
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      highlights += list.length;
    } catch { /* skip */ }
  }

  // Streak calculation
  const streak = computeStreak(book);

  return { chaptersRead, totalChapters, wordsRead, highlights, streak };
}

function computeStreak(book: string): number {
  const key = STREAK_KEY(book);
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  try {
    const stored = JSON.parse(localStorage.getItem(key) || '{}');
    const { lastDate, count = 0 } = stored as { lastDate?: string; count?: number };

    if (!lastDate) {
      // First time — start streak
      localStorage.setItem(key, JSON.stringify({ lastDate: today, count: 1 }));
      return 1;
    }

    const last = new Date(lastDate);
    const now  = new Date(today);
    const diffDays = Math.round((now.getTime() - last.getTime()) / 86400000);

    if (diffDays === 0) return count;          // same day
    if (diffDays === 1) {                       // consecutive day
      const newCount = count + 1;
      localStorage.setItem(key, JSON.stringify({ lastDate: today, count: newCount }));
      return newCount;
    }
    // Gap > 1 day — reset
    localStorage.setItem(key, JSON.stringify({ lastDate: today, count: 1 }));
    return 1;
  } catch {
    return 1;
  }
}

// ── CSS ───────────────────────────────────────────────────────────────────────

function injectStyles(): void {
  if (document.getElementById('reading-stats-styles')) return;
  const s = document.createElement('style');
  s.id = 'reading-stats-styles';
  s.textContent = `
    /* ── Stats FAB button ── */
    #stats-fab-btn {
      position: fixed;
      bottom: 208px;
      right: 20px;
      z-index: 9980;
      width: 44px; height: 44px;
      border-radius: 50%;
      background: var(--yuval-surface, #fff);
      border: 1px solid var(--yuval-border, #e5e7eb);
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      color: var(--yuval-text-secondary, #555);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 17px;
      transition: transform 0.2s, box-shadow 0.2s, background 0.15s;
    }
    #stats-fab-btn:hover {
      transform: scale(1.08);
      box-shadow: 0 4px 16px rgba(0,0,0,0.14);
      background: var(--yuval-bg-secondary, #f3f4f6);
    }
    :is(.dark) #stats-fab-btn {
      background: #2a2a2a;
      border-color: rgba(255,255,255,0.1);
    }
    [dir="rtl"] #stats-fab-btn { right: auto; left: 20px; }

    /* ── Overlay ── */
    #stats-overlay {
      position: fixed; inset: 0; z-index: 9995;
      background: rgba(0,0,0,0.45);
      backdrop-filter: blur(4px);
      opacity: 0;
      transition: opacity 0.25s ease;
      pointer-events: none;
    }
    #stats-overlay.open { opacity: 1; pointer-events: auto; }

    /* ── Modal ── */
    #stats-modal {
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) scale(0.95);
      width: min(380px, 90vw);
      z-index: 9996;
      background: var(--yuval-surface, #fff);
      border: 1px solid var(--yuval-border, #e5e7eb);
      border-radius: 20px;
      box-shadow: 0 24px 60px rgba(0,0,0,0.18);
      padding: 28px 24px 24px;
      opacity: 0;
      transition: opacity 0.25s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
      pointer-events: none;
    }
    #stats-modal.open {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
      pointer-events: auto;
    }
    :is(.dark) #stats-modal {
      background: #1e1e1e;
      border-color: rgba(255,255,255,0.08);
    }

    /* ── Header ── */
    #stats-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    #stats-modal-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--yuval-text, #1a1a1a);
      letter-spacing: -0.01em;
    }
    #stats-modal-close {
      background: none; border: none;
      color: var(--yuval-text-tertiary, #888);
      font-size: 18px; cursor: pointer;
      width: 28px; height: 28px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 6px;
      transition: background 0.15s, color 0.15s;
    }
    #stats-modal-close:hover {
      background: var(--yuval-bg-secondary, #f3f4f6);
      color: var(--yuval-text, #1a1a1a);
    }

    /* ── Stat cards grid ── */
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .stat-card {
      background: var(--yuval-bg-secondary, #f9f9f9);
      border: 1px solid var(--yuval-border, #e5e7eb);
      border-radius: 14px;
      padding: 16px 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    :is(.dark) .stat-card {
      background: #252525;
      border-color: rgba(255,255,255,0.07);
    }
    .stat-icon { font-size: 22px; line-height: 1; }
    .stat-value {
      font-size: 22px;
      font-weight: 800;
      color: var(--yuval-text, #1a1a1a);
      letter-spacing: -0.02em;
      line-height: 1.1;
    }
    .stat-label {
      font-size: 11px;
      font-weight: 500;
      color: var(--yuval-text-muted, #999);
      letter-spacing: 0.03em;
    }

    /* ── Progress bar (chapters) ── */
    .stat-progress {
      margin-top: 4px;
      height: 3px;
      border-radius: 99px;
      background: var(--yuval-border, #e5e7eb);
      overflow: hidden;
    }
    .stat-progress-fill {
      height: 100%;
      border-radius: 99px;
      background: #6366f1;
      transition: width 0.8s cubic-bezier(0.34,1.56,0.64,1);
    }

    /* ── Streak fire card ── */
    .stat-card.streak .stat-value { color: #f97316; }
    .stat-card.streak .stat-icon  { filter: drop-shadow(0 0 6px rgba(249,115,22,0.4)); }
  `;
  document.head.appendChild(s);
}

// ── DOM ───────────────────────────────────────────────────────────────────────

function buildWidget(): void {
  if (document.getElementById('stats-modal')) return;

  const btn = document.createElement('button');
  btn.id = 'stats-fab-btn';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Reading stats');
  btn.textContent = '📊';
  document.body.appendChild(btn);

  const overlay = document.createElement('div');
  overlay.id = 'stats-overlay';
  document.body.appendChild(overlay);

  const modal = document.createElement('div');
  modal.id = 'stats-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  document.body.appendChild(modal);

  btn.addEventListener('click', openStats);
  overlay.addEventListener('click', closeStats);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeStats();
  });
}

function renderStats(): void {
  const modal = document.getElementById('stats-modal');
  if (!modal) return;

  const labels = tr();
  const stats  = computeStats();

  modal.setAttribute('dir', labels.dir);

  const pct = stats.totalChapters > 0
    ? Math.round((stats.chaptersRead / stats.totalChapters) * 100)
    : 0;

  const wordsFormatted = stats.wordsRead >= 1000
    ? `${(stats.wordsRead / 1000).toFixed(1)}k`
    : String(stats.wordsRead);

  modal.innerHTML = `
    <div id="stats-modal-header">
      <span id="stats-modal-title">📚 ${labels.title}</span>
      <button id="stats-modal-close" aria-label="${labels.close}">✕</button>
    </div>
    <div class="stats-grid">

      <div class="stat-card" style="grid-column: span 2">
        <span class="stat-icon">📖</span>
        <span class="stat-value">${stats.chaptersRead}
          <span style="font-size:13px;font-weight:500;color:var(--yuval-text-muted,#999)">
            ${labels.of} ${stats.totalChapters || '?'}
          </span>
        </span>
        <span class="stat-label">${labels.chaptersRead}</span>
        <div class="stat-progress">
          <div class="stat-progress-fill" style="width:0%" data-target="${pct}"></div>
        </div>
      </div>

      <div class="stat-card">
        <span class="stat-icon">📝</span>
        <span class="stat-value">${wordsFormatted}</span>
        <span class="stat-label">${labels.wordsRead}</span>
      </div>

      <div class="stat-card">
        <span class="stat-icon">💡</span>
        <span class="stat-value">${stats.highlights}</span>
        <span class="stat-label">${labels.highlights}</span>
      </div>

      <div class="stat-card streak" style="grid-column: span 2">
        <span class="stat-icon">🔥</span>
        <span class="stat-value">${labels.streakDays(stats.streak)}</span>
        <span class="stat-label">${labels.streak}</span>
      </div>

    </div>
  `;

  document.getElementById('stats-modal-close')?.addEventListener('click', closeStats);

  // Animate progress bar after paint
  requestAnimationFrame(() => {
    const fill = modal.querySelector<HTMLElement>('.stat-progress-fill');
    if (fill) fill.style.width = `${pct}%`;
  });
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

// ── Init ──────────────────────────────────────────────────────────────────────

export function initReadingStats(): void {
  injectStyles();
  buildWidget();

  // Record today's visit for streak (on every page load)
  const book = getCurrentBook();
  if (book) computeStreak(book);
}
