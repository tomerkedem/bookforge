import { t, getI18nDirection, resolveLanguage } from '../i18n';

// ── Language ────────────────────────────────────────────────────────────────

function getLang(): string {
  return resolveLanguage(
    new URLSearchParams(window.location.search).get('lang')
      || localStorage.getItem('yuval_language')
      || document.documentElement.lang
      || 'en'
  );
}

function tr(key: string, params?: Record<string, string | number>) {
  return t(key, getLang(), params);
}

function getDir(): 'rtl' | 'ltr' {
  return getI18nDirection(getLang());
}

// ── Storage ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'yuval_onboarded_v1';

function hasOnboarded(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

function markOnboarded(): void {
  localStorage.setItem(STORAGE_KEY, 'true');
}

// ── Steps ───────────────────────────────────────────────────────────────────

interface Step {
  titleKey: string;
  bodyKey: string;
  illustration: string;
}

const ICON_BOOK = `
  <svg viewBox="0 0 120 120" fill="none" aria-hidden="true">
    <defs><linearGradient id="ob-g1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fde68a"/><stop offset="100%" stop-color="#d97706"/>
    </linearGradient></defs>
    <path d="M20 30 L60 22 L100 30 L100 96 L60 88 L20 96 Z" fill="url(#ob-g1)" opacity="0.95"/>
    <path d="M60 22 L60 88" stroke="rgba(0,0,0,0.2)" stroke-width="1.5"/>
    <path d="M28 42 H52 M28 52 H50 M28 62 H52 M68 42 H92 M68 52 H90 M68 62 H92" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
`;

const ICON_TOC = `
  <svg viewBox="0 0 120 120" fill="none" aria-hidden="true">
    <rect x="22" y="26" width="76" height="72" rx="6" fill="#fff" stroke="#e5e7eb" stroke-width="2"/>
    <circle cx="34" cy="42" r="3" fill="#d97706"/>
    <path d="M44 42 H88" stroke="#9a8c7c" stroke-width="2" stroke-linecap="round"/>
    <circle cx="34" cy="58" r="3" fill="#d97706"/>
    <path d="M44 58 H80" stroke="#9a8c7c" stroke-width="2" stroke-linecap="round"/>
    <circle cx="34" cy="74" r="3" fill="#d97706"/>
    <path d="M44 74 H84" stroke="#9a8c7c" stroke-width="2" stroke-linecap="round"/>
  </svg>
`;

const ICON_DISPLAY = `
  <svg viewBox="0 0 120 120" fill="none" aria-hidden="true">
    <rect x="20" y="30" width="80" height="58" rx="6" fill="#fff" stroke="#e5e7eb" stroke-width="2"/>
    <circle cx="40" cy="59" r="10" fill="#fde68a" stroke="#d97706" stroke-width="2"/>
    <path d="M60 50 H90 M60 60 H85 M60 70 H88" stroke="#9a8c7c" stroke-width="2" stroke-linecap="round"/>
    <path d="M50 96 L70 96" stroke="#9a8c7c" stroke-width="3" stroke-linecap="round"/>
  </svg>
`;

const ICON_HIGHLIGHT = `
  <svg viewBox="0 0 120 120" fill="none" aria-hidden="true">
    <rect x="18" y="54" width="70" height="14" fill="#fef08a" opacity="0.7"/>
    <rect x="18" y="72" width="52" height="14" fill="#dbeafe" opacity="0.7"/>
    <path d="M20 60 H85 M20 78 H68" stroke="#713f12" stroke-width="1.5"/>
    <g transform="translate(72 20) rotate(35)">
      <rect x="0" y="0" width="12" height="60" rx="2" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
      <path d="M0 54 L12 54 L6 68 Z" fill="#92400e"/>
      <rect x="0" y="0" width="12" height="10" fill="#fbbf24"/>
    </g>
  </svg>
`;

const ICON_GOAL = `
  <svg viewBox="0 0 120 120" fill="none" aria-hidden="true">
    <circle cx="60" cy="60" r="36" fill="none" stroke="#f5f0e8" stroke-width="10"/>
    <circle cx="60" cy="60" r="36" fill="none" stroke="#d97706" stroke-width="10"
      stroke-dasharray="226" stroke-dashoffset="80" stroke-linecap="round"
      transform="rotate(-90 60 60)"/>
    <text x="60" y="68" text-anchor="middle" font-size="22" font-weight="700" fill="#78350f">🔥</text>
  </svg>
`;

const STEPS: Step[] = [
  { titleKey: 'onboard.welcome.title',   bodyKey: 'onboard.welcome.body',   illustration: ICON_BOOK },
  { titleKey: 'onboard.toc.title',       bodyKey: 'onboard.toc.body',       illustration: ICON_TOC },
  { titleKey: 'onboard.display.title',   bodyKey: 'onboard.display.body',   illustration: ICON_DISPLAY },
  { titleKey: 'onboard.highlight.title', bodyKey: 'onboard.highlight.body', illustration: ICON_HIGHLIGHT },
  { titleKey: 'onboard.goal.title',      bodyKey: 'onboard.goal.body',      illustration: ICON_GOAL },
];

// ── Core ────────────────────────────────────────────────────────────────────

let currentStep = 0;
let overlayEl: HTMLElement | null = null;
let keydownHandler: ((e: KeyboardEvent) => void) | null = null;

function renderStep(idx: number): void {
  if (!overlayEl) return;

  const step = STEPS[idx];
  const isFirst = idx === 0;
  const isLast = idx === STEPS.length - 1;

  const tooltip = overlayEl.querySelector('#ob-tooltip') as HTMLElement;
  tooltip.setAttribute('dir', getDir());
  tooltip.dataset.step = String(idx);

  const dots = STEPS.map((_, i) => {
    const cls = i === idx ? 'ob-dot active' : i < idx ? 'ob-dot done' : 'ob-dot';
    return `<span class="${cls}" aria-hidden="true"></span>`;
  }).join('');

  tooltip.innerHTML = `
    <div class="ob-illustration">${step.illustration}</div>
    <div class="ob-counter">${idx + 1} ${tr('onboarding.of')} ${STEPS.length}</div>
    <div id="ob-title">${tr(step.titleKey)}</div>
    <div id="ob-body">${tr(step.bodyKey)}</div>
    <div class="ob-dots" role="progressbar" aria-valuenow="${idx + 1}" aria-valuemin="1" aria-valuemax="${STEPS.length}">${dots}</div>
    <div id="ob-actions">
      <button id="ob-skip" type="button">${tr('onboard.skip')}</button>
      <div class="ob-nav">
        ${isFirst ? '' : `<button id="ob-back" type="button" class="ob-secondary">←</button>`}
        <button id="ob-next" type="button">${isLast ? tr('onboard.done') : tr('onboard.next')}</button>
      </div>
    </div>
  `;

  tooltip.querySelector('#ob-next')?.addEventListener('click', () => {
    isLast ? finish() : next();
  });
  tooltip.querySelector('#ob-back')?.addEventListener('click', prev);
  tooltip.querySelector('#ob-skip')?.addEventListener('click', finish);

  (tooltip.querySelector('#ob-next') as HTMLElement | null)?.focus();
}

function next() {
  if (currentStep >= STEPS.length - 1) return finish();
  currentStep++;
  renderStep(currentStep);
}

function prev() {
  if (currentStep <= 0) return;
  currentStep--;
  renderStep(currentStep);
}

function finish() {
  markOnboarded();
  overlayEl?.classList.remove('open');
  setTimeout(() => {
    overlayEl?.remove();
    overlayEl = null;
    if (keydownHandler) {
      document.removeEventListener('keydown', keydownHandler);
      keydownHandler = null;
    }
  }, 220);
}

// ── Init ────────────────────────────────────────────────────────────────────

function start() {
  if (hasOnboarded() || overlayEl) return;

  const overlay = document.createElement('div');
  overlay.id = 'ob-overlay';
  overlay.innerHTML = `<div id="ob-tooltip" role="dialog" aria-modal="true"></div>`;

  document.body.appendChild(overlay);
  overlayEl = overlay;
  currentStep = 0;

  requestAnimationFrame(() => overlay.classList.add('open'));

  renderStep(0);

  keydownHandler = (e: KeyboardEvent) => {
    if (!overlayEl) return;
    if (e.key === 'Escape') finish();
    else if (e.key === 'ArrowRight') getDir() === 'rtl' ? prev() : next();
    else if (e.key === 'ArrowLeft')  getDir() === 'rtl' ? next() : prev();
    else if (e.key === 'Enter')      next();
  };
  document.addEventListener('keydown', keydownHandler);
}

export function initOnboardingTour() {
  setTimeout(start, 1200);

  window.addEventListener('language-changed', () => {
    if (!overlayEl) return;
    renderStep(currentStep);
  });
}
