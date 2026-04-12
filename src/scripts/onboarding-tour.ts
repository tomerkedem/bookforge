/**
 * Onboarding Tour
 *
 * Shown only on first visit to a reading page (localStorage flag).
 * 5 steps that spotlight key features with animated tooltips.
 * RTL-aware, keyboard navigable, skippable.
 */

type LangKey = 'he' | 'en' | 'es';

function getLang(): LangKey {
  // Check URL param first
  const urlLang = new URLSearchParams(window.location.search).get('lang');
  if (urlLang && ['he', 'en', 'es'].includes(urlLang)) return urlLang as LangKey;
  
  // Check localStorage
  const storedLang = localStorage.getItem('yuval_language');
  if (storedLang && ['he', 'en', 'es'].includes(storedLang)) return storedLang as LangKey;
  
  // Check document lang attribute (set by Astro)
  const docLang = document.documentElement.lang?.split('-')[0];
  if (docLang && ['he', 'en', 'es'].includes(docLang)) return docLang as LangKey;
  
  return 'he'; // Default to Hebrew
}

const STORAGE_KEY = 'yuval_onboarded_v1';

function hasOnboarded(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}
function markOnboarded(): void {
  localStorage.setItem(STORAGE_KEY, 'true');
}

// ── Steps definition ──────────────────────────────────────────────────────────

interface Step {
  targetSelector: string;
  title_he: string;
  title_en: string;
  title_es: string;
  body_he: string;
  body_en: string;
  body_es: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const STEPS: Step[] = [
  {
    targetSelector: '#chapter-header',
    title_he: 'ברוכים הבאים! 👋',
    title_en: 'Welcome! 👋',
    title_es: '¡Bienvenido! 👋',
    body_he: 'זוהי פלטפורמת הקריאה של Yuval. נסייר יחד בתכונות העיקריות.',
    body_en: 'This is Yuval\'s reading platform. Let\'s take a quick tour of the key features.',
    body_es: 'Esta es la plataforma de lectura Yuval. Hagamos un recorrido rápido por las funciones principales.',
    position: 'bottom',
  },
  {
    targetSelector: '#toc-toggle, .toc-sidebar, #chapter-nav',
    title_he: 'תוכן עניינים 📋',
    title_en: 'Table of Contents 📋',
    title_es: 'Tabla de Contenidos 📋',
    body_he: 'ניווט מהיר בין פרקים. לחץ על כל פרק לניווט מיידי.',
    body_en: 'Navigate between chapters instantly. Click any chapter to jump there.',
    body_es: 'Navega entre capítulos al instante. Haz clic en cualquier capítulo para ir allí.',
    position: 'right',
  },
  {
    targetSelector: '#fab-toggle',
    title_he: 'בקרי תצוגה ⚙️',
    title_en: 'Display Controls ⚙️',
    title_es: 'Controles de Pantalla ⚙️',
    body_he: 'שנה גודל טקסט, גופן, רוחב, וערכת צבע. הכל נשמר אוטומטית.',
    body_en: 'Change font size, typeface, width, and color theme. All saved automatically.',
    body_es: 'Cambia el tamaño de fuente, tipografía, ancho y tema de color. Todo se guarda automáticamente.',
    position: 'left',
  },
  {
    targetSelector: '#reading-fab, .reading-fab',
    title_he: 'סמן טקסט 💡',
    title_en: 'Highlight Text 💡',
    title_es: 'Resaltar Texto 💡',
    body_he: 'בחר כל טקסט בדף כדי להדגיש אותו. 4 צבעים לארגון: תובנות, שאלות, פעולות, ציטוטים.',
    body_en: 'Select any text on the page to highlight it. 4 colors to organize: insights, questions, actions, quotes.',
    body_es: 'Selecciona cualquier texto para resaltarlo. 4 colores para organizar: ideas, preguntas, acciones, citas.',
    position: 'left',
  },
  {
    targetSelector: '#goal-indicator',
    title_he: 'יעד קריאה יומי 🎯',
    title_en: 'Daily Reading Goal 🎯',
    title_es: 'Meta de Lectura Diaria 🎯',
    body_he: 'הגדר יעד יומי ועקב אחרי הרצף שלך. לחץ על הכפתור להגדרה.',
    body_en: 'Set a daily reading goal and track your streak. Click the button to configure.',
    body_es: 'Establece una meta diaria y sigue tu racha. Haz clic en el botón para configurar.',
    position: 'left',
  },
];

// ── i18n ─────────────────────────────────────────────────────────────────────

const i18n = {
  he: { next: 'הבא ←', skip: 'דלג', done: 'סיום! 🎉', of: 'מתוך', dir: 'rtl' as const },
  es: { next: 'Siguiente →', skip: 'Omitir', done: '¡Listo! 🎉', of: 'de', dir: 'ltr' as const },
  en: { next: 'Next →', skip: 'Skip', done: 'Done! 🎉', of: 'of', dir: 'ltr' as const },
};

function tr() { return i18n[getLang()] ?? i18n.en; }

// ── CSS ───────────────────────────────────────────────────────────────────────

function injectStyles(): void {
  if (document.getElementById('onboarding-styles')) return;
  const s = document.createElement('style');
  s.id = 'onboarding-styles';
  s.textContent = `
    @keyframes obFadeIn  { from { opacity:0 } to { opacity:1 } }
    @keyframes obSlideUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:none } }
    @keyframes obPulse   { 0%,100% { box-shadow: 0 0 0 4px rgba(99,102,241,0.3) } 50% { box-shadow: 0 0 0 8px rgba(99,102,241,0.1) } }

    #ob-overlay {
      position: fixed; inset: 0; z-index: 10200;
      pointer-events: none;
    }

    #ob-backdrop {
      position: absolute; inset: 0;
      background: rgba(0,0,0,0.55);
      backdrop-filter: blur(2px);
      animation: obFadeIn 0.3s ease;
      pointer-events: auto;
    }

    #ob-spotlight {
      position: absolute;
      border-radius: 12px;
      box-shadow: 0 0 0 9999px rgba(0,0,0,0.55);
      transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1);
      pointer-events: none;
      animation: obPulse 2s ease infinite;
      border: 2px solid rgba(99,102,241,0.6);
    }

    #ob-tooltip {
      position: absolute;
      width: min(320px, 90vw);
      background: var(--yuval-surface, #fff);
      border: 1px solid var(--yuval-border, #e5e7eb);
      border-radius: 16px;
      box-shadow: 0 16px 48px rgba(0,0,0,0.24);
      padding: 20px;
      pointer-events: auto;
      animation: obSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1);
      z-index: 10201;
    }
    :is(.dark) #ob-tooltip {
      background: #1e1e1e;
      border-color: rgba(255,255,255,0.1);
    }

    /* Arrow */
    #ob-arrow {
      position: absolute;
      width: 12px; height: 12px;
      background: var(--yuval-surface, #fff);
      border: 1px solid var(--yuval-border, #e5e7eb);
      transform: rotate(45deg);
    }
    :is(.dark) #ob-arrow { background: #1e1e1e; border-color: rgba(255,255,255,0.1); }

    #ob-step-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 700;
      color: #6366f1;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .ob-dot {
      width: 5px; height: 5px; border-radius: 50%;
      background: #e5e7eb;
      transition: background 0.2s;
    }
    .ob-dot.active { background: #6366f1; }

    #ob-title {
      font-size: 15px;
      font-weight: 800;
      color: var(--yuval-text, #1a1a1a);
      margin-bottom: 6px;
      letter-spacing: -0.01em;
    }
    #ob-body {
      font-size: 13px;
      color: var(--yuval-text-secondary, #555);
      line-height: 1.6;
      margin-bottom: 16px;
    }
    :is(.dark) #ob-body { color: #b0b0b0; }

    #ob-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }
    #ob-skip {
      background: none; border: none;
      font-size: 12px;
      color: var(--yuval-text-muted, #999);
      cursor: pointer;
      padding: 4px;
      text-decoration: underline;
      text-underline-offset: 2px;
      transition: color 0.15s;
    }
    #ob-skip:hover { color: var(--yuval-text-secondary, #555); }
    #ob-next {
      padding: 8px 18px;
      background: #6366f1;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, transform 0.15s;
    }
    #ob-next:hover { background: #4f46e5; transform: translateY(-1px); }
  `;
  document.head.appendChild(s);
}

// ── Core logic ────────────────────────────────────────────────────────────────

let currentStep = 0;
let overlayEl: HTMLElement | null = null;

function findTarget(step: Step): Element | null {
  const selectors = step.targetSelector.split(', ');
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

function getTooltipPosition(target: DOMRect, position: Step['position'], tooltipW: number, tooltipH: number) {
  const pad = 16;
  const arrowSize = 10;

  let top = 0, left = 0;
  let arrowTop = 0, arrowLeft = 0, arrowTransform = 'rotate(45deg)';

  switch (position) {
    case 'bottom':
      top = target.bottom + arrowSize + pad;
      left = target.left + target.width / 2 - tooltipW / 2;
      arrowTop = -6; arrowLeft = tooltipW / 2 - 6;
      arrowTransform = 'rotate(45deg)';
      break;
    case 'top':
      top = target.top - tooltipH - arrowSize - pad;
      left = target.left + target.width / 2 - tooltipW / 2;
      arrowTop = tooltipH - 6; arrowLeft = tooltipW / 2 - 6;
      arrowTransform = 'rotate(225deg)';
      break;
    case 'left':
      top = target.top + target.height / 2 - tooltipH / 2;
      left = target.left - tooltipW - arrowSize - pad;
      arrowTop = tooltipH / 2 - 6; arrowLeft = tooltipW - 6;
      arrowTransform = 'rotate(135deg)';
      break;
    case 'right':
      top = target.top + target.height / 2 - tooltipH / 2;
      left = target.right + arrowSize + pad;
      arrowTop = tooltipH / 2 - 6; arrowLeft = -6;
      arrowTransform = 'rotate(315deg)';
      break;
  }

  // Clamp to viewport
  const vw = window.innerWidth, vh = window.innerHeight;
  left = Math.max(pad, Math.min(left, vw - tooltipW - pad));
  top  = Math.max(pad, Math.min(top, vh - tooltipH - pad));

  return { top, left, arrowTop, arrowLeft, arrowTransform };
}

function renderStep(idx: number): void {
  if (!overlayEl) return;
  const lang = getLang();
  const labels = tr();
  const step = STEPS[idx];
  const target = findTarget(step);

  // Spotlight
  const spotlight = overlayEl.querySelector<HTMLElement>('#ob-spotlight');
  if (spotlight) {
    if (target) {
      const r = target.getBoundingClientRect();
      const pad = 8;
      spotlight.style.cssText = `
        top: ${r.top - pad + window.scrollY}px;
        left: ${r.left - pad}px;
        width: ${r.width + pad * 2}px;
        height: ${r.height + pad * 2}px;
      `;
      spotlight.style.display = '';
    } else {
      spotlight.style.display = 'none';
    }
  }

  // Tooltip
  const tooltip = overlayEl.querySelector<HTMLElement>('#ob-tooltip');
  if (!tooltip) return;

  const isLast = idx === STEPS.length - 1;
  const dots = STEPS.map((_, i) =>
    `<span class="ob-dot${i === idx ? ' active' : ''}"></span>`
  ).join('');

  tooltip.setAttribute('dir', labels.dir);
  tooltip.innerHTML = `
    <div id="ob-step-badge">
      ${dots}
      <span>${idx + 1} ${labels.of} ${STEPS.length}</span>
    </div>
    <div id="ob-title">${lang === 'he' ? step.title_he : lang === 'es' ? step.title_es : step.title_en}</div>
    <div id="ob-body">${lang === 'he' ? step.body_he : lang === 'es' ? step.body_es : step.body_en}</div>
    <div id="ob-actions">
      <button id="ob-skip">${labels.skip}</button>
      <button id="ob-next">${isLast ? labels.done : labels.next}</button>
    </div>
    <div id="ob-arrow"></div>
  `;

  // Position tooltip
  const tooltipW = 320;
  const tooltipH = 180; // estimate
  let pos = { top: window.innerHeight / 2 - 90, left: window.innerWidth / 2 - 160, arrowTop: -99, arrowLeft: -99, arrowTransform: '' };

  if (target) {
    const r = target.getBoundingClientRect();
    pos = getTooltipPosition(r, step.position, tooltipW, tooltipH);
  }

  tooltip.style.cssText = `
    top: ${pos.top + window.scrollY}px;
    left: ${pos.left}px;
    width: ${tooltipW}px;
  `;

  const arrow = tooltip.querySelector<HTMLElement>('#ob-arrow');
  if (arrow) {
    arrow.style.cssText = `top:${pos.arrowTop}px; left:${pos.arrowLeft}px; transform:${pos.arrowTransform};`;
  }

  tooltip.querySelector('#ob-next')?.addEventListener('click', () => {
    if (isLast) { finish(); } else { next(); }
  });
  tooltip.querySelector('#ob-skip')?.addEventListener('click', finish);
}

function next(): void {
  currentStep++;
  if (currentStep >= STEPS.length) { finish(); return; }
  renderStep(currentStep);
}

function finish(): void {
  markOnboarded();
  if (overlayEl) {
    overlayEl.style.transition = 'opacity 0.3s';
    overlayEl.style.opacity = '0';
    setTimeout(() => overlayEl?.remove(), 300);
    overlayEl = null;
  }
}

// ── Build overlay ─────────────────────────────────────────────────────────────

function start(): void {
  if (hasOnboarded()) return;
  if (overlayEl) return;

  injectStyles();
  currentStep = 0;

  const overlay = document.createElement('div');
  overlay.id = 'ob-overlay';

  overlay.innerHTML = `
    <div id="ob-backdrop"></div>
    <div id="ob-spotlight"></div>
    <div id="ob-tooltip"></div>
  `;

  document.body.appendChild(overlay);
  overlayEl = overlay;

  // Keyboard nav
  document.addEventListener('keydown', function onKey(e) {
    if (!overlayEl) { document.removeEventListener('keydown', onKey); return; }
    if (e.key === 'ArrowRight' || e.key === 'Enter') next();
    if (e.key === 'Escape') { finish(); document.removeEventListener('keydown', onKey); }
  });

  renderStep(0);
}

// ── Init ──────────────────────────────────────────────────────────────────────

export function initOnboardingTour(): void {
  // Small delay so the page renders first
  setTimeout(start, 1200);

  window.addEventListener('chapter-content-swapped', () => {
    // Don't re-trigger tour on navigation
  });
}
