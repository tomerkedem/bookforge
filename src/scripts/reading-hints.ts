/**
 * Reading hints — teaches users about available features.
 *
 * 1. First-visit tooltip: shown once ever (localStorage flag)
 * 2. Keyboard hint bar: fades in on every chapter visit, gone on scroll
 */

const HINT_SEEN_KEY = 'yuval_hint_seen_v2';
const ONBOARD_DELAY    = 2500;
const ONBOARD_DURATION = 7000;
const KBD_DELAY        = 1200;
const KBD_DURATION     = 9000;

// ── i18n ─────────────────────────────────────────────────────────────────────

function getLang(): string {
  return new URLSearchParams(window.location.search).get('lang')
    || localStorage.getItem('yuval_language')
    || 'en';
}

const i18n = {
  he: {
    onboardTitle: 'סמן טקסט בזמן קריאה',
    onboardSub:   'בחר טקסט כלשהו כדי לשמור תובנות, שאלות וציטוטים',
    kbdChapters:  'פרקים',
    kbdFocus:     'מצב מיקוד',
    kbdHighlight: 'סמן טקסט כדי להדגיש',
    dismiss:      'סגור',
    dir:          'rtl',
  },
  es: {
    onboardTitle: 'Resalta texto mientras lees',
    onboardSub:   'Selecciona texto para guardar ideas, preguntas y citas',
    kbdChapters:  'Capítulos',
    kbdFocus:     'Modo enfoque',
    kbdHighlight: 'Selecciona texto para resaltar',
    dismiss:      'Cerrar',
    dir:          'ltr',
  },
  en: {
    onboardTitle: 'Highlight text while reading',
    onboardSub:   'Select any text to save insights, questions & quotes',
    kbdChapters:  'Chapters',
    kbdFocus:     'Focus mode',
    kbdHighlight: 'Select text to highlight',
    dismiss:      'Dismiss',
    dir:          'ltr',
  },
} as const;

type LangKey = keyof typeof i18n;
function tr() { return i18n[(getLang() as LangKey)] ?? i18n.en; }

// ── CSS ───────────────────────────────────────────────────────────────────────

function injectStyles(): void {
  if (document.getElementById('reading-hints-styles')) return;
  const s = document.createElement('style');
  s.id = 'reading-hints-styles';
  s.textContent = `
    /* ── shared entrance animation ── */
    @keyframes hintSlideUp {
      from { opacity: 0; transform: translateX(-50%) translateY(10px); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes hintSlideDown {
      from { opacity: 1; transform: translateX(-50%) translateY(0); }
      to   { opacity: 0; transform: translateX(-50%) translateY(8px); }
    }
    @keyframes hintProgress {
      from { transform: scaleX(1); }
      to   { transform: scaleX(0); }
    }

    /* ── Onboarding tooltip ── */
    #reading-onboard {
      position: fixed;
      bottom: 104px;
      left: 50%;
      transform: translateX(-50%) translateY(10px);
      z-index: 9990;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px 12px 16px;
      max-width: 420px;
      width: max-content;

      background: var(--yuval-surface, #ffffff);
      border: 1px solid var(--yuval-border, rgba(0,0,0,0.09));
      border-radius: 18px;
      box-shadow:
        0 2px 4px rgba(0,0,0,0.04),
        0 8px 24px rgba(0,0,0,0.10),
        0 20px 40px rgba(0,0,0,0.06);

      font-family: inherit;
      animation: hintSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards;
      overflow: hidden;
    }
    #reading-onboard.hiding {
      animation: hintSlideDown 0.3s ease forwards;
    }

    :is(.dark) #reading-onboard {
      background: var(--yuval-surface, #1e1e1e);
      border-color: rgba(255,255,255,0.08);
      box-shadow:
        0 2px 4px rgba(0,0,0,0.2),
        0 8px 24px rgba(0,0,0,0.35),
        0 20px 40px rgba(0,0,0,0.2);
    }

    .onboard-icon {
      font-size: 20px;
      flex-shrink: 0;
      line-height: 1;
    }
    .onboard-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      min-width: 0;
    }
    .onboard-title {
      font-size: 13px;
      font-weight: 650;
      color: var(--yuval-text, #111);
      white-space: nowrap;
    }
    .onboard-sub {
      font-size: 11.5px;
      color: var(--yuval-text-muted, #888);
      line-height: 1.4;
    }
    .onboard-dots {
      display: flex;
      gap: 5px;
      flex-shrink: 0;
      align-items: center;
    }
    .onboard-dot {
      width: 11px;
      height: 11px;
      border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    }
    .onboard-dot-y { background: #fbbf24; }
    .onboard-dot-b { background: #60a5fa; }
    .onboard-dot-g { background: #34d399; }
    .onboard-dot-p { background: #f472b6; }

    #onboard-dismiss {
      flex-shrink: 0;
      background: none;
      border: none;
      font-size: 15px;
      color: var(--yuval-text-muted, #aaa);
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 6px;
      line-height: 1;
      transition: color 0.15s, background 0.15s;
    }
    #onboard-dismiss:hover {
      color: var(--yuval-text, #111);
      background: var(--yuval-bg-secondary, rgba(0,0,0,0.05));
    }

    /* thin progress bar along the bottom */
    .onboard-progress {
      position: absolute;
      bottom: 0; left: 0;
      height: 2.5px;
      width: 100%;
      background: linear-gradient(90deg, #6366f1, #a78bfa);
      transform-origin: left;
      border-radius: 0 0 18px 18px;
      animation: hintProgress var(--dur, 7s) linear forwards;
    }

    /* ── Keyboard hint bar ── */
    #kbd-hint-bar {
      position: fixed;
      bottom: 28px;
      left: 50%;
      transform: translateX(-50%) translateY(8px);
      z-index: 9989;
      display: flex;
      align-items: center;
      gap: 0;
      padding: 0;
      width: max-content;

      background: var(--yuval-surface, #fff);
      border: 1px solid var(--yuval-border, rgba(0,0,0,0.1));
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);

      font-size: 13px;
      color: var(--yuval-text-secondary, #555);
      white-space: nowrap;
      overflow: hidden;
      animation: hintSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards;
    }
    #kbd-hint-bar.hiding {
      animation: hintSlideDown 0.3s ease forwards;
    }

    :is(.dark) #kbd-hint-bar {
      background: #232323;
      border-color: rgba(255,255,255,0.1);
      color: #bbb;
    }

    .kbd-item {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 10px 16px;
      border-right: 1px solid var(--yuval-border, rgba(0,0,0,0.08));
    }
    .kbd-item:last-child { border-right: none; }
    :is(.dark) .kbd-item { border-color: rgba(255,255,255,0.07); }

    .kbd-item-label {
      font-size: 13px;
      font-weight: 400;
    }

    kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 2px 7px;
      background: var(--yuval-bg-secondary, #f3f4f6);
      border: 1px solid rgba(0,0,0,0.15);
      border-bottom-width: 2px;
      border-radius: 6px;
      font-size: 11px;
      font-family: ui-monospace, monospace;
      font-weight: 700;
      color: var(--yuval-text, #333);
      line-height: 1.5;
    }
    :is(.dark) kbd {
      background: rgba(255,255,255,0.08);
      border-color: rgba(255,255,255,0.12);
      color: #ddd;
    }
  `;
  document.head.appendChild(s);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function removeEl(id: string) {
  document.getElementById(id)?.remove();
}

// ── Onboarding tooltip ────────────────────────────────────────────────────────

function showOnboard(): void {
  if (localStorage.getItem(HINT_SEEN_KEY)) return;
  removeEl('reading-onboard');

  const el = document.createElement('div');
  el.id = 'reading-onboard';
  const { onboardTitle, onboardSub, dismiss, dir } = tr();
  el.setAttribute('dir', dir);
  el.style.setProperty('--dur', `${ONBOARD_DURATION / 1000}s`);
  el.innerHTML = `
    <span class="onboard-icon">✍️</span>
    <div class="onboard-text">
      <span class="onboard-title">${onboardTitle}</span>
      <span class="onboard-sub">${onboardSub}</span>
    </div>
    <div class="onboard-dots">
      <span class="onboard-dot onboard-dot-y"></span>
      <span class="onboard-dot onboard-dot-b"></span>
      <span class="onboard-dot onboard-dot-g"></span>
      <span class="onboard-dot onboard-dot-p"></span>
    </div>
    <button id="onboard-dismiss" aria-label="${dismiss}">✕</button>
    <div class="onboard-progress"></div>
  `;
  document.body.appendChild(el);

  function hide() {
    el.classList.add('hiding');
    localStorage.setItem(HINT_SEEN_KEY, '1');
    setTimeout(() => el.remove(), 350);
  }

  el.querySelector('#onboard-dismiss')?.addEventListener('click', hide);
  setTimeout(hide, ONBOARD_DURATION);
}

// ── Keyboard hint bar ─────────────────────────────────────────────────────────

function showKbdHint(): void {
  removeEl('kbd-hint-bar');

  const bar = document.createElement('div');
  bar.id = 'kbd-hint-bar';
  bar.setAttribute('aria-hidden', 'true');
  const { kbdChapters, kbdFocus, kbdHighlight, dir } = tr();
  bar.setAttribute('dir', dir);
  bar.innerHTML = `
    <span class="kbd-item">
      <kbd>←</kbd><kbd>→</kbd>
      <span class="kbd-item-label">${kbdChapters}</span>
    </span>
    <span class="kbd-item">
      <kbd>F</kbd>
      <span class="kbd-item-label">${kbdFocus}</span>
    </span>
    <span class="kbd-item">
      <span>✍️</span>
      <span class="kbd-item-label">${kbdHighlight}</span>
    </span>
  `;
  document.body.appendChild(bar);

  function hide() {
    if (!document.body.contains(bar)) return;
    bar.classList.add('hiding');
    setTimeout(() => bar.remove(), 350);
  }

  setTimeout(hide, KBD_DURATION);
  window.addEventListener('scroll', hide, { passive: true, once: true });
}

// ── Export ────────────────────────────────────────────────────────────────────

let listenersRegistered = false;

export function initReadingHints(): void {
  injectStyles();

  // Show on initial load / Astro View Transitions swap
  setTimeout(showKbdHint,   KBD_DELAY);
  setTimeout(showOnboard, ONBOARD_DELAY);

  // Re-show kbd hint on fetch-based chapter navigation (TOC clicks)
  // Register once — the handler itself re-shows on every swap
  if (!listenersRegistered) {
    listenersRegistered = true;

    window.addEventListener('chapter-content-swapped', () => {
      setTimeout(showKbdHint, KBD_DELAY);
    });
  }
}
