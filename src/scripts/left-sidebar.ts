/**
 * Left-side activity bar — click handlers, tooltip, active state.
 *
 * Idempotent: safe to call repeatedly across View Transitions and
 * fetch-based chapter swaps. The init flag lives on the sidebar
 * element itself, so re-mounting the component re-binds cleanly.
 *
 * Behavior:
 *  - Hover shows a tooltip after 500ms. Moving between buttons within
 *    600ms of the last hide skips the delay (chained hover feels
 *    instant once the user has "seen" one tooltip).
 *  - Click toggles `.active` on the button. Only one button can be
 *    active at a time.
 *  - Each click logs to console and dispatches a `left-sidebar-action`
 *    custom event with `{ action, isOpen }`.
 */

import { t } from '../i18n';

const TOOLTIP_DELAY_MS = 500;
const FAST_FOLLOW_MS = 600;

let tooltipEl: HTMLDivElement | null = null;
let showTimer: number | null = null;
let lastHiddenAt = 0;
let currentHoverButton: HTMLButtonElement | null = null;

function getLang(): string {
  return document.documentElement.lang || 'he';
}

function ensureTooltip(): HTMLDivElement {
  if (tooltipEl && document.body.contains(tooltipEl)) return tooltipEl;
  const el = document.createElement('div');
  el.className = 'lsb-tooltip';
  el.setAttribute('role', 'tooltip');
  document.body.appendChild(el);
  tooltipEl = el;
  return el;
}

function positionTooltip(button: HTMLButtonElement, tip: HTMLDivElement): void {
  const rect = button.getBoundingClientRect();
  const isRtl = document.documentElement.dir === 'rtl';
  // Render hidden first so we can measure final size.
  tip.style.visibility = 'hidden';
  tip.style.left = '0px';
  tip.style.top = '0px';
  tip.classList.add('visible');
  const tipRect = tip.getBoundingClientRect();

  // Tooltip sits on the inline-START side of the button (toward the
  // reading content, opposite the bar's edge). 18px gap.
  const gap = 18;
  let left: number;
  if (isRtl) {
    // Bar on visual left → tooltip extends to the right of the button.
    left = rect.right + gap;
  } else {
    // Bar on visual right → tooltip extends to the left of the button.
    left = rect.left - gap - tipRect.width;
  }
  const top = rect.top + rect.height / 2 - tipRect.height / 2;

  tip.style.left = `${Math.round(left)}px`;
  tip.style.top = `${Math.round(top)}px`;
  tip.style.visibility = '';
}

function showTooltipFor(button: HTMLButtonElement): void {
  const key = button.dataset.i18nTooltip;
  if (!key) return;
  const tip = ensureTooltip();
  tip.textContent = t(key, getLang());
  positionTooltip(button, tip);
  tip.classList.add('visible');
}

function hideTooltip(): void {
  if (!tooltipEl) return;
  tooltipEl.classList.remove('visible');
  lastHiddenAt = Date.now();
}

function clearShowTimer(): void {
  if (showTimer !== null) {
    window.clearTimeout(showTimer);
    showTimer = null;
  }
}

function handleEnter(button: HTMLButtonElement): void {
  currentHoverButton = button;
  clearShowTimer();
  const sinceHidden = Date.now() - lastHiddenAt;
  const delay = sinceHidden < FAST_FOLLOW_MS ? 0 : TOOLTIP_DELAY_MS;
  if (delay === 0) {
    showTooltipFor(button);
    return;
  }
  showTimer = window.setTimeout(() => {
    if (currentHoverButton === button) showTooltipFor(button);
  }, delay);
}

function handleLeave(button: HTMLButtonElement): void {
  if (currentHoverButton === button) currentHoverButton = null;
  clearShowTimer();
  hideTooltip();
}

function handleClick(button: HTMLButtonElement, sidebar: HTMLElement): void {
  const wasActive = button.classList.contains('active');
  sidebar.querySelectorAll<HTMLButtonElement>('.lsb-btn.active').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-pressed', 'false');
  });
  if (!wasActive) {
    button.classList.add('active');
    button.setAttribute('aria-pressed', 'true');
  }
  const isOpen = button.classList.contains('active');
  const action = button.dataset.action || '';
  // eslint-disable-next-line no-console
  console.log(`[LeftSidebar] Action: ${action}, isOpen: ${isOpen}`);
  window.dispatchEvent(new CustomEvent('left-sidebar-action', {
    detail: { action, isOpen },
  }));
}

function applyAriaLabels(sidebar: HTMLElement): void {
  const lang = getLang();
  sidebar.querySelectorAll<HTMLButtonElement>('.lsb-btn').forEach(btn => {
    const key = btn.dataset.i18nAriaLabel;
    if (key) btn.setAttribute('aria-label', t(key, lang));
    btn.setAttribute('aria-pressed', btn.classList.contains('active') ? 'true' : 'false');
  });
}

export function initLeftSidebar(signal?: AbortSignal): void {
  const sidebar = document.getElementById('left-sidebar');
  if (!sidebar) return;
  if (sidebar.dataset.initialized === 'true') {
    // Re-apply localized aria labels in case language changed.
    applyAriaLabels(sidebar);
    return;
  }
  sidebar.dataset.initialized = 'true';

  applyAriaLabels(sidebar);

  const opts: AddEventListenerOptions = signal ? { signal } : {};

  sidebar.querySelectorAll<HTMLButtonElement>('.lsb-btn').forEach(button => {
    button.addEventListener('mouseenter', () => handleEnter(button), opts);
    button.addEventListener('mouseleave', () => handleLeave(button), opts);
    button.addEventListener('focus', () => handleEnter(button), opts);
    button.addEventListener('blur', () => handleLeave(button), opts);
    button.addEventListener('click', () => handleClick(button, sidebar), opts);
  });

  // Re-localize tooltip aria labels when language changes mid-session.
  window.addEventListener('language-changed', () => applyAriaLabels(sidebar), opts);

  // Clear init flag if the sidebar element is detached so the next
  // mount can re-bind. This matters for fetch-based chapter swaps
  // that may replace DOM under us.
  if (signal) {
    signal.addEventListener('abort', () => {
      sidebar.dataset.initialized = 'false';
      hideTooltip();
      clearShowTimer();
    });
  }
}
