/**
 * Book Completion Screen
 *
 * Shown when the reader scrolls to the end of the LAST chapter.
 * Displays a full-screen celebration overlay with:
 *  - Trophy animation
 *  - Book title
 *  - Reading stats (chapters, words, highlights, streak)
 *  - Share achievement button
 *  - Back to library CTA
 *
 * Supports: Hebrew (RTL), English, Spanish
 */

type LangKey = 'he' | 'en' | 'es';

function getLang(): LangKey {
  return (new URLSearchParams(window.location.search).get('lang')
    || localStorage.getItem('yuval_language')
    || 'en') as LangKey;
}

// ── i18n ─────────────────────────────────────────────────────────────────────

const i18n: Record<LangKey, {
  congrats: string;
  subtitle: string;
  chapters: string;
  words: string;
  highlights: string;
  streak: string;
  streakUnit: (n: number) => string;
  share: string;
  library: string;
  shareText: (title: string, chapters: number) => string;
  close: string;
  dir: 'rtl' | 'ltr';
}> = {
  he: {
    congrats: 'כל הכבוד! 🎉',
    subtitle: 'סיימת לקרוא את הספר',
    chapters: 'פרקים',
    words: 'מילים',
    highlights: 'הדגשות',
    streak: 'רצף קריאה',
    streakUnit: (n) => n === 1 ? 'יום' : 'ימים',
    share: '📤 שתף הישג',
    library: '← חזרה לספרייה',
    shareText: (title, chapters) => `סיימתי לקרוא את "${title}" — ${chapters} פרקים! 📚 #קריאה`,
    close: 'סגור',
    dir: 'rtl',
  },
  es: {
    congrats: '¡Felicidades! 🎉',
    subtitle: 'Terminaste de leer el libro',
    chapters: 'capítulos',
    words: 'palabras',
    highlights: 'resaltados',
    streak: 'racha de lectura',
    streakUnit: (n) => n === 1 ? 'día' : 'días',
    share: '📤 Compartir logro',
    library: '← Volver a la biblioteca',
    shareText: (title, chapters) => `Terminé de leer "${title}" — ¡${chapters} capítulos! 📚`,
    close: 'Cerrar',
    dir: 'ltr',
  },
  en: {
    congrats: 'Congratulations! 🎉',
    subtitle: 'You finished reading the book',
    chapters: 'chapters',
    words: 'words',
    highlights: 'highlights',
    streak: 'reading streak',
    streakUnit: (n) => n === 1 ? 'day' : 'days',
    share: '📤 Share achievement',
    library: '← Back to library',
    shareText: (title, chapters) => `I just finished reading "${title}" — ${chapters} chapters! 📚 #reading`,
    close: 'Close',
    dir: 'ltr',
  },
};

function tr() { return i18n[getLang()] ?? i18n.en; }

// ── Context helpers ───────────────────────────────────────────────────────────

function getContext() {
  const el = document.getElementById('chapter-container');
  if (!el) return null;
  const lang = getLang();
  return {
    book:        el.dataset.book || '',
    titleHe:     el.dataset.bookTitleHe || '',
    titleEn:     el.dataset.bookTitleEn || '',
    totalChapters: parseInt(el.dataset.totalChapters || '0', 10),
    wordCount:   parseInt(el.dataset.wordCount || '0', 10),
    get title() { return lang === 'he' ? this.titleHe : this.titleEn; },
  };
}

function isLastChapter(): boolean {
  return !document.querySelector('.chapter-nav-link[data-nav="next"]');
}

// ── Stats aggregation ─────────────────────────────────────────────────────────

function collectStats(book: string) {
  let chaptersRead = 0;
  let highlights   = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key.startsWith(`yuval_reading_progress_${book}_ch`)) {
      try {
        const d = JSON.parse(localStorage.getItem(key) || '{}');
        if ((d.scrollPosition || 0) > 100) chaptersRead++;
      } catch { /* skip */ }
    }
    if (key.startsWith(`yuval_hl_${book}_ch`)) {
      try {
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        highlights += list.length;
      } catch { /* skip */ }
    }
  }

  // Streak from reading-goals storage
  let streak = 0;
  try {
    const goal = JSON.parse(localStorage.getItem('yuval_reading_goal') || '{}');
    streak = goal.streak || 0;
  } catch { /* skip */ }

  return { chaptersRead, highlights, streak };
}

// ── CSS ───────────────────────────────────────────────────────────────────────

function injectStyles(): void {
  if (document.getElementById('book-completion-styles')) return;
  const s = document.createElement('style');
  s.id = 'book-completion-styles';
  s.textContent = `
    @keyframes bcFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes bcSlideUp {
      from { opacity: 0; transform: translateY(40px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0)   scale(1);    }
    }
    @keyframes bcTrophy {
      0%   { transform: scale(0.5) rotate(-12deg); opacity: 0; }
      60%  { transform: scale(1.15) rotate(4deg);  opacity: 1; }
      80%  { transform: scale(0.95) rotate(-2deg); }
      100% { transform: scale(1)   rotate(0deg);   }
    }
    @keyframes bcParticle {
      0%   { transform: translateY(0) rotate(0deg);       opacity: 1;   }
      100% { transform: translateY(-200px) rotate(720deg); opacity: 0;  }
    }

    #book-completion-overlay {
      position: fixed; inset: 0; z-index: 10100;
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      animation: bcFadeIn 0.4s ease forwards;
      padding: 20px;
    }

    #book-completion-card {
      position: relative;
      background: var(--yuval-surface, #fff);
      border: 1px solid var(--yuval-border, #e5e7eb);
      border-radius: 24px;
      box-shadow: 0 32px 80px rgba(0,0,0,0.3);
      padding: 40px 32px 32px;
      width: min(440px, 100%);
      text-align: center;
      animation: bcSlideUp 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both;
      overflow: hidden;
    }
    :is(.dark) #book-completion-card {
      background: #1a1a1a;
      border-color: rgba(255,255,255,0.1);
    }

    /* Glow top border */
    #book-completion-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: linear-gradient(90deg, #f59e0b, #ec4899, #6366f1, #22c55e);
      border-radius: 24px 24px 0 0;
    }

    #bc-close {
      position: absolute;
      top: 14px; right: 16px;
      background: none; border: none;
      font-size: 18px; cursor: pointer;
      color: var(--yuval-text-tertiary, #888);
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 8px;
      transition: background 0.15s, color 0.15s;
    }
    #bc-close:hover {
      background: var(--yuval-bg-secondary, #f3f4f6);
      color: var(--yuval-text, #111);
    }
    [dir="rtl"] #bc-close { right: auto; left: 16px; }

    #bc-trophy {
      font-size: 64px;
      line-height: 1;
      display: block;
      margin: 0 auto 16px;
      animation: bcTrophy 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.3s both;
    }

    #bc-congrats {
      font-size: 22px;
      font-weight: 800;
      color: var(--yuval-text, #1a1a1a);
      margin-bottom: 4px;
      letter-spacing: -0.02em;
    }
    #bc-subtitle {
      font-size: 13px;
      color: var(--yuval-text-muted, #999);
      margin-bottom: 6px;
    }
    #bc-book-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--yuval-text, #1a1a1a);
      margin-bottom: 28px;
      line-height: 1.4;
    }

    /* Stats grid */
    .bc-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 28px;
    }
    .bc-stat {
      background: var(--yuval-bg-secondary, #f9f9f9);
      border: 1px solid var(--yuval-border, #e5e7eb);
      border-radius: 14px;
      padding: 14px 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    :is(.dark) .bc-stat {
      background: #252525;
      border-color: rgba(255,255,255,0.07);
    }
    .bc-stat-icon { font-size: 20px; }
    .bc-stat-value {
      font-size: 18px;
      font-weight: 800;
      color: var(--yuval-text, #1a1a1a);
      letter-spacing: -0.02em;
      line-height: 1;
    }
    .bc-stat-label {
      font-size: 10px;
      font-weight: 500;
      color: var(--yuval-text-muted, #999);
      letter-spacing: 0.02em;
    }

    /* Actions */
    .bc-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .bc-btn {
      width: 100%;
      padding: 13px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
    }
    .bc-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
    .bc-btn:active { transform: translateY(0); }

    #bc-share-btn {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
    }
    #bc-share-btn:hover { background: linear-gradient(135deg, #4f46e5, #7c3aed); }

    #bc-library-btn {
      background: var(--yuval-bg-secondary, #f3f4f6);
      color: var(--yuval-text-secondary, #555);
      border: 1px solid var(--yuval-border, #e5e7eb);
    }
    :is(.dark) #bc-library-btn {
      background: #2a2a2a;
      border-color: rgba(255,255,255,0.1);
      color: #ccc;
    }

    /* Particles */
    .bc-particle {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      animation: bcParticle linear forwards;
    }
  `;
  document.head.appendChild(s);
}

// ── Particle confetti ─────────────────────────────────────────────────────────

function spawnParticles(card: HTMLElement): void {
  const colors = ['#f59e0b', '#ec4899', '#6366f1', '#22c55e', '#f97316', '#06b6d4'];
  const count = 24;
  const rect = card.getBoundingClientRect();

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'bc-particle';
    const size = 6 + Math.random() * 8;
    const x = rect.left + Math.random() * rect.width;
    const duration = 900 + Math.random() * 700;
    const delay = Math.random() * 400;

    p.style.cssText = `
      width: ${size}px; height: ${size}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      left: ${x}px;
      bottom: ${rect.bottom - rect.top + 20}px;
      animation-duration: ${duration}ms;
      animation-delay: ${delay}ms;
    `;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), duration + delay + 100);
  }
}

// ── Share ─────────────────────────────────────────────────────────────────────

async function shareAchievement(text: string): Promise<void> {
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return;
    } catch { /* fall through */ }
  }
  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(text);
    // Brief toast
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      background: #1a1a1a; color: #fff; border-radius: 10px;
      padding: 10px 18px; font-size: 13px; font-weight: 600;
      z-index: 10200; opacity: 0; transition: opacity 0.2s;
    `;
    toast.textContent = '✓ Copied to clipboard';
    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.style.opacity = '1'; });
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  } catch { /* nothing */ }
}

// ── Render ────────────────────────────────────────────────────────────────────

function show(): void {
  if (document.getElementById('book-completion-overlay')) return;

  const ctx = getContext();
  if (!ctx) return;

  const labels = tr();
  const stats  = collectStats(ctx.book);
  const total  = ctx.totalChapters || stats.chaptersRead;
  const lang   = getLang();

  // Words: chapters × avg word count
  const words = stats.chaptersRead * (ctx.wordCount || 2500);
  const wordsFormatted = words >= 1000 ? `${(words / 1000).toFixed(1)}k` : String(words);

  const overlay = document.createElement('div');
  overlay.id = 'book-completion-overlay';
  overlay.setAttribute('dir', labels.dir);

  overlay.innerHTML = `
    <div id="book-completion-card">
      <button id="bc-close" aria-label="${labels.close}">✕</button>

      <span id="bc-trophy">🏆</span>
      <div id="bc-congrats">${labels.congrats}</div>
      <div id="bc-subtitle">${labels.subtitle}</div>
      <div id="bc-book-title">${lang === 'he' ? ctx.titleHe : ctx.titleEn}</div>

      <div class="bc-stats">
        <div class="bc-stat">
          <span class="bc-stat-icon">📖</span>
          <span class="bc-stat-value">${total}</span>
          <span class="bc-stat-label">${labels.chapters}</span>
        </div>
        <div class="bc-stat">
          <span class="bc-stat-icon">📝</span>
          <span class="bc-stat-value">${wordsFormatted}</span>
          <span class="bc-stat-label">${labels.words}</span>
        </div>
        <div class="bc-stat">
          <span class="bc-stat-icon">💡</span>
          <span class="bc-stat-value">${stats.highlights}</span>
          <span class="bc-stat-label">${labels.highlights}</span>
        </div>
        <div class="bc-stat">
          <span class="bc-stat-icon">🔥</span>
          <span class="bc-stat-value">${stats.streak}</span>
          <span class="bc-stat-label">${labels.streakUnit(stats.streak)}</span>
        </div>
      </div>

      <div class="bc-actions">
        <button id="bc-share-btn" class="bc-btn">${labels.share}</button>
        <a id="bc-library-btn" class="bc-btn" href="/">${labels.library}</a>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const card = document.getElementById('book-completion-card')!;

  // Particles after card animates in
  setTimeout(() => spawnParticles(card), 500);

  // Close
  const close = () => {
    overlay.style.transition = 'opacity 0.3s';
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 300);
  };

  document.getElementById('bc-close')!.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function onKey(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); }
  });

  // Share
  const shareText = labels.shareText(ctx.title, total);
  document.getElementById('bc-share-btn')!.addEventListener('click', () => {
    shareAchievement(shareText);
  });

  // Mark book as completed in localStorage
  if (ctx.book) {
    localStorage.setItem(`yuval_book_completed_${ctx.book}`, new Date().toISOString());
  }
}

// ── Observer ──────────────────────────────────────────────────────────────────

let observed = false;
let observer: IntersectionObserver | null = null;

function watchLastChapter(): void {
  observed = false;
  observer?.disconnect();

  if (!isLastChapter()) return;

  const sentinel = document.getElementById('chapter-nav');
  if (!sentinel) return;

  observer = new IntersectionObserver(
    (entries) => {
      if (observed) return;
      if (entries[0].isIntersecting) {
        observed = true;
        observer?.disconnect();
        // Small delay so chapter-completion panel renders first
        setTimeout(show, 1400);
      }
    },
    { threshold: 0.3 }
  );

  observer.observe(sentinel);
}

// ── Init ──────────────────────────────────────────────────────────────────────

export function initBookCompletion(): void {
  injectStyles();
  watchLastChapter();

  window.addEventListener('chapter-content-swapped', () => {
    setTimeout(watchLastChapter, 200);
  });
}
