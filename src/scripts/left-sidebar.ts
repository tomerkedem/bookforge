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
const GOAL_POLL_MS = 30_000;

// Bridges to the existing reading modules. Each entry resolves the
// hidden floating button (or global hook) those modules already create
// and clicks it — so panels open and toggle exactly the same way as
// the legacy FAB cluster.
const ACTION_TARGETS: Record<string, () => void> = {
  'daily-goal': () => document.getElementById('goal-indicator')?.click(),
  'tts': () => {
    const win = window as unknown as {
      __ttsOpenPanel?: () => void;
      __ttsToggle?: () => void;
    };
    if (typeof win.__ttsOpenPanel === 'function') win.__ttsOpenPanel();
    else win.__ttsToggle?.();
  },
  'statistics': () => document.getElementById('stats-fab-btn')?.click(),
  'bookmarks': () => document.getElementById('bm-fab-btn')?.click(),
  'highlights': () => document.getElementById('highlights-fab')?.click(),
};

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
  // Render hidden first so we can measure final size.
  tip.style.visibility = 'hidden';
  tip.style.left = '0px';
  tip.style.top = '0px';
  tip.classList.add('visible');
  const tipRect = tip.getBoundingClientRect();

  // The dock is always on the visual LEFT (in every language), so
  // the tooltip always extends to the RIGHT of the button — toward
  // the reading content. 18px gap.
  const gap = 18;
  const left = rect.right + gap;
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

  // Delegate to the legacy FAB / floating-button so the existing
  // panels, modals, and TTS hook open exactly like before. Each target
  // is a toggle on its own, so we always invoke regardless of wasActive
  // and let the underlying module decide open vs close.
  const trigger = ACTION_TARGETS[action];
  if (trigger) {
    try { trigger(); }
    catch (err) { console.warn(`[LeftSidebar] ${action} trigger failed`, err); }
  }

  window.dispatchEvent(new CustomEvent('left-sidebar-action', {
    detail: { action, isOpen },
  }));
}

// ── Badge + goal-ring sync ─────────────────────────────────────────────────

function getCurrentBook(): string {
  return document.getElementById('chapter-container')?.dataset.book || '';
}

function countBookmarks(book: string): number {
  if (!book) return 0;
  try {
    const raw = localStorage.getItem(`yuval_bookmarks_${book}`);
    if (!raw) return 0;
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.length : 0;
  } catch { return 0; }
}

function countHighlights(book: string): number {
  if (!book) return 0;
  const prefix = `yuval_hl_${book}_`;
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(prefix)) continue;
    try {
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      if (Array.isArray(list)) total += list.length;
    } catch { /* skip malformed entry */ }
  }
  return total;
}

interface GoalSnapshot { pct: number; done: boolean; }

function readGoal(): GoalSnapshot {
  try {
    const data = JSON.parse(localStorage.getItem('yuval_reading_goal') || 'null');
    if (!data || typeof data.goalMinutes !== 'number' || data.goalMinutes <= 0) {
      return { pct: 0, done: false };
    }
    const today = (data.todayMinutes as number) || 0;
    const pct = Math.max(0, Math.min(1, today / data.goalMinutes));
    return { pct, done: pct >= 1 };
  } catch { return { pct: 0, done: false }; }
}

function setBadge(action: string, count: number, color: 'gold' | 'green' | 'purple' = 'gold'): void {
  const btn = document.querySelector<HTMLButtonElement>(
    `.left-sidebar .lsb-btn[data-action="${action}"]`
  );
  if (!btn) return;
  if (count > 0) {
    btn.dataset.badge = count > 99 ? '99+' : String(count);
    btn.dataset.badgeColor = color;
  } else {
    delete btn.dataset.badge;
    delete btn.dataset.badgeColor;
  }
}

function syncGoalRing(snapshot: GoalSnapshot): void {
  const btn = document.querySelector<HTMLButtonElement>('.lsb-btn-goal');
  const fill = document.querySelector<SVGCircleElement>('.lsb-goal-ring-fill');
  if (!btn || !fill) return;
  const visible = Math.round(snapshot.pct * 100);
  fill.style.strokeDasharray = `${visible} ${100 - visible}`;
  btn.dataset.goalDone = snapshot.done ? 'true' : 'false';
}

/** Mirror the right-sidebar overall completion percent into the
 *  premium left dock's central progress ring. We pull the number
 *  straight from the live #usb-progress-percent text (the right
 *  sidebar is the authoritative source for book progress) so this
 *  stays in sync with no extra wiring. */
function syncReadingProgress(): void {
  const fill = document.querySelector<SVGCircleElement>(
    '.reading-left-dock__progress-fill'
  );
  const label = document.getElementById('rldock-progress-percent');
  if (!fill && !label) return;

  const src = document.getElementById('usb-progress-percent');
  const raw = (src?.textContent || '0%').trim();
  const match = raw.match(/(\d+(?:\.\d+)?)/);
  const pct = match ? Math.max(0, Math.min(100, Math.round(parseFloat(match[1])))) : 0;

  if (label) label.textContent = `${pct}%`;
  if (fill) fill.style.strokeDasharray = `${pct} ${100 - pct}`;
}

let progressObserver: MutationObserver | null = null;

function watchReadingProgress(signal?: AbortSignal): void {
  // Dispose any previous observer (re-mount across View Transitions).
  progressObserver?.disconnect();
  progressObserver = null;

  const src = document.getElementById('usb-progress-percent');
  if (!src) return;
  progressObserver = new MutationObserver(() => syncReadingProgress());
  progressObserver.observe(src, { childList: true, characterData: true, subtree: true });

  signal?.addEventListener('abort', () => {
    progressObserver?.disconnect();
    progressObserver = null;
  });
}

function refreshAll(): void {
  const book = getCurrentBook();
  setBadge('bookmarks', countBookmarks(book), 'gold');
  setBadge('highlights', countHighlights(book), 'gold');
  syncGoalRing(readGoal());
  syncReadingProgress();
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
    // Re-apply localized aria labels and refresh badge counts in case
    // language or storage changed since the last mount.
    applyAriaLabels(sidebar);
    refreshAll();
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

  // Initial badge + ring sync. The bookmarks/highlights modules may
  // not have populated their floating buttons yet, but localStorage
  // is already authoritative — no need to wait.
  refreshAll();
  watchReadingProgress(signal);

  // React immediately to user actions inside the existing modules so
  // badges feel live. Storage event covers cross-tab edits.
  window.addEventListener('yuval-bookmarks-changed', refreshAll, opts);
  window.addEventListener('yuval-highlights-changed', refreshAll, opts);
  window.addEventListener('storage', e => {
    if (!e.key) { refreshAll(); return; }
    if (e.key === 'yuval_reading_goal'
      || e.key.startsWith('yuval_bookmarks_')
      || e.key.startsWith('yuval_hl_')) refreshAll();
  }, opts);

  // Reading-goals.ts ticks every 30s and writes minutes back to
  // storage without firing a custom event. Mirror that cadence so the
  // ring stays current while the reader is on the page.
  const goalTimer = window.setInterval(() => syncGoalRing(readGoal()), GOAL_POLL_MS);

  // Clear init flag + interval on abort so the next mount re-binds
  // cleanly across View Transitions / fetch-based chapter swaps.
  if (signal) {
    signal.addEventListener('abort', () => {
      sidebar.dataset.initialized = 'false';
      window.clearInterval(goalTimer);
      hideTooltip();
      clearShowTimer();
    });
  }
}
