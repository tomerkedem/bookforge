/**
 * Reading hints — dynamic i18n version
 */

import { t, getI18nDirection, resolveLanguage } from '../i18n';

const HINT_SEEN_KEY = 'yuval_hint_seen_v2';
const ONBOARD_DELAY = 2500;
const ONBOARD_DURATION = 7000;
const KBD_DELAY = 1200;
const KBD_DURATION = 9000;

// ── Language ────────────────────────────────────────────────────────────────

function getLang(): string {
  return resolveLanguage(
    new URLSearchParams(window.location.search).get('lang')
      || localStorage.getItem('yuval_language')
      || 'en'
  );
}

function tr(key: string): string {
  return t(key, getLang());
}

function getDir(): 'rtl' | 'ltr' {
  return getI18nDirection(getLang());
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function removeEl(id: string) {
  document.getElementById(id)?.remove();
}

// ── Onboarding ──────────────────────────────────────────────────────────────

function showOnboard(): void {
  if (localStorage.getItem(HINT_SEEN_KEY)) return;

  removeEl('reading-onboard');

  const el = document.createElement('div');
  el.id = 'reading-onboard';
  el.setAttribute('dir', getDir());
  el.style.setProperty('--dur', `${ONBOARD_DURATION / 1000}s`);

  el.innerHTML = `
    <span>✍️</span>
    <div>
      <strong>${tr('hints.onboardTitle')}</strong>
      <div>${tr('hints.onboardSub')}</div>
    </div>
    <button id="onboard-dismiss">✕</button>
    <div class="onboard-progress"></div>
  `;

  document.body.appendChild(el);

  function hide() {
    el.remove();
    localStorage.setItem(HINT_SEEN_KEY, '1');
  }

  el.querySelector('#onboard-dismiss')?.addEventListener('click', hide);
  setTimeout(hide, ONBOARD_DURATION);
}

// ── Keyboard hint ───────────────────────────────────────────────────────────

function showKbdHint(): void {
  removeEl('kbd-hint-bar');

  const bar = document.createElement('div');
  bar.id = 'kbd-hint-bar';
  bar.setAttribute('dir', getDir());

  bar.innerHTML = `
    <span><kbd>←</kbd><kbd>→</kbd> ${tr('hints.chapters')}</span>
    <span><kbd>F</kbd> ${tr('hints.focus')}</span>
    <span>✍️ ${tr('hints.highlight')}</span>
  `;

  document.body.appendChild(bar);

  function hide() {
    bar.remove();
  }

  setTimeout(hide, KBD_DURATION);
  window.addEventListener('scroll', hide, { once: true });
}

// ── Init ────────────────────────────────────────────────────────────────────

let registered = false;

export function initReadingHints(): void {
  setTimeout(showKbdHint, KBD_DELAY);
  setTimeout(showOnboard, ONBOARD_DELAY);

  if (!registered) {
    registered = true;

    window.addEventListener('chapter-content-swapped', () => {
      setTimeout(showKbdHint, KBD_DELAY);
    });
  }
}