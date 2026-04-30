/**
 * Reading Goals - daily reading target with streak tracking.
 * Shows a small goal indicator that fills as you read.
 * Stored in localStorage per book.
 */

import { t, type TranslationKey, getI18nDirection, resolveLanguage } from '../i18n';

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

function getCurrentBook(): string {
  return document.getElementById('chapter-container')?.dataset.book || '';
}

function getGoalOptions(lang: string): { label: string; minutes: number }[] {
  const byLang: Record<string, { label: string; minutes: number }[]> = {
    he: [
      { label: '10 דקות', minutes: 10 },
      { label: '20 דקות', minutes: 20 },
      { label: '30 דקות', minutes: 30 },
      { label: 'שעה', minutes: 60 },
    ],
    es: [
      { label: '10 min', minutes: 10 },
      { label: '20 min', minutes: 20 },
      { label: '30 min', minutes: 30 },
      { label: '1 hora', minutes: 60 },
    ],
    en: [
      { label: '10 min', minutes: 10 },
      { label: '20 min', minutes: 20 },
      { label: '30 min', minutes: 30 },
      { label: '1 hour', minutes: 60 },
    ],
  };

  return byLang[lang] ?? byLang.en;
}

// ── Storage ───────────────────────────────────────────────────────────────────

interface GoalData {
  goalMinutes: number;
  todayMinutes: number;
  todayDate: string;
  streak: number;
  lastStreakDate: string;
}

const GOAL_KEY = 'yuval_reading_goal';
const DEFAULT_GOAL = 20;

function loadGoal(): GoalData {
  try {
    return JSON.parse(localStorage.getItem(GOAL_KEY) || 'null') || {
      goalMinutes: DEFAULT_GOAL,
      todayMinutes: 0,
      todayDate: today(),
      streak: 0,
      lastStreakDate: '',
    };
  } catch {
    return {
      goalMinutes: DEFAULT_GOAL,
      todayMinutes: 0,
      todayDate: today(),
      streak: 0,
      lastStreakDate: '',
    };
  }
}

function saveGoal(data: GoalData): void {
  localStorage.setItem(GOAL_KEY, JSON.stringify(data));
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Session timer ─────────────────────────────────────────────────────────────

let sessionStart = Date.now();
let accumulatedMs = 0;
let hidden = false;

function getReadMinutes(): number {
  const elapsed = hidden ? accumulatedMs : accumulatedMs + (Date.now() - sessionStart);
  return elapsed / 60000;
}

function onVisibilityChange() {
  if (document.hidden) {
    accumulatedMs += Date.now() - sessionStart;
    hidden = true;
  } else {
    sessionStart = Date.now();
    hidden = false;
  }
}

// ── Goal check & streak ───────────────────────────────────────────────────────

function tickGoal(): void {
  const data = loadGoal();
  const tdy = today();

  if (data.todayDate !== tdy) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);

    if (data.todayDate === yStr && data.todayMinutes >= data.goalMinutes) {
      data.streak += 1;
    } else if (data.todayDate !== yStr) {
      data.streak = 0;
    }

    data.todayMinutes = 0;
    data.todayDate = tdy;
  }

  data.todayMinutes = Math.min(data.goalMinutes * 2, getReadMinutes());
  saveGoal(data);
  updateIndicator(data);
}

// ── CSS ───────────────────────────────────────────────────────────────────────

function injectStyles(): void {
  if (document.getElementById('reading-goals-styles')) return;
  const s = document.createElement('style');
  s.id = 'reading-goals-styles';
  s.textContent = `
    #goal-indicator {
      position: fixed;
      bottom: 15.9rem;
      inset-inline-end: 1rem;
      z-index: 9980;
      width: 2.5rem; height: 2.5rem;
      border-radius: 50%;
      background: var(--yuval-surface, #fff);
      border: 1px solid var(--yuval-border, #e5e7eb);
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    #goal-indicator:hover {
      transform: scale(1.08);
      box-shadow: 0 4px 16px rgba(0,0,0,0.14);
    }
    :is(.dark) #goal-indicator { background: #2a2a2a; border-color: rgba(255,255,255,0.1); }
    @media (max-width: 1023px) {
      #goal-indicator { display: none !important; }
    }
    /* On desktop the LeftSidebar's daily-goal button replaces this
       legacy FAB. The DOM stays in place so left-sidebar.ts can still
       delegate clicks to it (#goal-indicator?.click()), but it's
       visually hidden. */
    @media (min-width: 1024px) {
      #goal-indicator { display: none !important; }
    }

    #goal-ring { position: absolute; inset: 0; }
    #goal-ring-track { fill: none; stroke: var(--yuval-border, #e5e7eb); stroke-width: 3; }
    #goal-ring-fill {
      fill: none; stroke: #22c55e; stroke-width: 3;
      stroke-linecap: round;
      stroke-dasharray: 120;
      stroke-dashoffset: 120;
      transform: rotate(-90deg);
      transform-origin: center;
      transition: stroke-dashoffset 1s ease;
    }
    #goal-ring-fill.done { stroke: #16a34a; }
    #goal-emoji { font-size: 18px; position: relative; z-index: 1; }

    #goal-modal-overlay {
      position: fixed; inset: 0; z-index: 10001;
      background: rgba(0,0,0,0.5); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
    }
    #goal-modal {
      background: var(--yuval-surface, #fff);
      border: 1px solid var(--yuval-border, #e5e7eb);
      border-radius: 20px;
      box-shadow: 0 24px 60px rgba(0,0,0,0.2);
      padding: 28px 24px 24px;
      width: min(360px, 90vw);
    }
    :is(.dark) #goal-modal { background: #1e1e1e; border-color: rgba(255,255,255,0.08); }

    #goal-modal h2 {
      font-size: 16px; font-weight: 800;
      color: var(--yuval-text, #1a1a1a);
      margin-bottom: 8px;
    }
    .goal-streak-row {
      font-size: 14px; font-weight: 600; color: #f97316;
      margin-bottom: 20px;
    }
    .goal-progress-row {
      background: var(--yuval-bg-secondary, #f9f9f9);
      border-radius: 12px; padding: 14px 16px;
      margin-bottom: 20px;
      border: 1px solid var(--yuval-border, #e5e7eb);
    }
    :is(.dark) .goal-progress-row { background: #252525; border-color: rgba(255,255,255,0.07); }
    .goal-progress-label {
      font-size: 12px; color: var(--yuval-text-muted, #999);
      margin-bottom: 8px; font-weight: 500;
    }
    .goal-progress-bar {
      height: 8px; border-radius: 99px;
      background: var(--yuval-border, #e5e7eb); overflow: hidden;
    }
    .goal-progress-fill {
      height: 100%; border-radius: 99px; background: #22c55e;
      transition: width 0.8s cubic-bezier(0.34,1.56,0.64,1);
    }
    .goal-progress-text {
      font-size: 13px; font-weight: 700;
      color: var(--yuval-text, #1a1a1a);
      margin-top: 6px;
    }

    .goal-options {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 8px; margin-bottom: 16px;
    }
    .goal-option {
      padding: 10px; border-radius: 10px;
      border: 2px solid var(--yuval-border, #e5e7eb);
      background: var(--yuval-bg-secondary, #f9f9f9);
      font-size: 13px; font-weight: 600;
      color: var(--yuval-text-secondary, #555);
      cursor: pointer; text-align: center;
      transition: border-color 0.15s, background 0.15s, color 0.15s;
    }
    .goal-option:hover { border-color: #22c55e; color: #16a34a; }
    .goal-option.active {
      border-color: #22c55e; background: #f0fdf4; color: #16a34a;
    }
    :is(.dark) .goal-option.active { background: rgba(34,197,94,0.1); }

    .goal-modal-actions {
      display: flex; gap: 8px; justify-content: flex-end;
    }
    .goal-btn {
      padding: 8px 18px; border-radius: 8px;
      font-size: 13px; font-weight: 600; cursor: pointer;
      border: 1px solid var(--yuval-border, #e5e7eb);
      background: var(--yuval-bg-secondary, #f3f4f6);
      color: var(--yuval-text-secondary, #555);
      transition: background 0.15s;
    }
    .goal-btn.primary {
      background: #22c55e; color: #fff; border-color: #22c55e;
    }
    .goal-btn.primary:hover { background: #16a34a; }
  `;
  document.head.appendChild(s);
}

// ── Indicator ─────────────────────────────────────────────────────────────────

function buildIndicator(): void {
  if (document.getElementById('goal-indicator')) return;

  const el = document.createElement('button');
  el.id = 'goal-indicator';
  el.type = 'button';
  el.setAttribute('aria-label', tr('goal.title'));
  el.title = tr('goal.title');
  el.innerHTML = `
    <svg id="goal-ring" viewBox="0 0 44 44">
      <circle id="goal-ring-track" cx="22" cy="22" r="19"/>
      <circle id="goal-ring-fill" cx="22" cy="22" r="19"/>
    </svg>
    <span id="goal-emoji">🎯</span>
  `;
  document.body.appendChild(el);
  el.addEventListener('click', openGoalModal);
}

function updateIndicator(data: GoalData): void {
  const fill = document.getElementById('goal-ring-fill');
  const emoji = document.getElementById('goal-emoji');
  const indicator = document.getElementById('goal-indicator');

  if (!fill || !emoji) return;

  if (indicator) {
    indicator.setAttribute('aria-label', tr('goal.title'));
  }

  const pct = Math.min(1, data.todayMinutes / data.goalMinutes);
  const circumference = 2 * Math.PI * 19;
  const offset = circumference * (1 - pct);

  fill.style.strokeDasharray = String(circumference);
  fill.style.strokeDashoffset = String(offset);

  if (pct >= 1) {
    fill.classList.add('done');
    emoji.textContent = '✅';
  } else if (pct > 0) {
    fill.classList.remove('done');
    emoji.textContent = '📖';
  } else {
    fill.classList.remove('done');
    emoji.textContent = '🎯';
  }
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function openGoalModal(): void {
  if (document.getElementById('goal-modal-overlay')) return;

  const lang = getLang();
  const data = loadGoal();
  let selectedMinutes = data.goalMinutes;

  const pct = Math.min(100, Math.round((data.todayMinutes / data.goalMinutes) * 100));
  const remaining = Math.max(0, Math.ceil(data.goalMinutes - data.todayMinutes));
  const progressText = pct >= 100
    ? tr('goal.reached')
    : tr('goal.minutesLeft', { n: remaining });

  const overlay = document.createElement('div');
  overlay.id = 'goal-modal-overlay';
  overlay.setAttribute('dir', getDir());

  overlay.innerHTML = `
    <div id="goal-modal">
      <h2>🎯 ${tr('goal.title')}</h2>
      <div class="goal-streak-row">${tr('goal.streak', { n: data.streak })}</div>
      <div class="goal-progress-row">
        <div class="goal-progress-label">${tr('goal.title')}: ${data.goalMinutes} min</div>
        <div class="goal-progress-bar">
          <div class="goal-progress-fill" style="width:0%" data-target="${pct}"></div>
        </div>
        <div class="goal-progress-text">${progressText}</div>
      </div>
      <div class="goal-options">
        ${getGoalOptions(lang).map(opt => `
          <button class="goal-option${opt.minutes === selectedMinutes ? ' active' : ''}"
            data-minutes="${opt.minutes}" type="button">${opt.label}</button>
        `).join('')}
      </div>
      <div class="goal-modal-actions">
        <button class="goal-btn" id="goal-cancel">${tr('goal.cancel')}</button>
        <button class="goal-btn primary" id="goal-save">${tr('goal.save')}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    const f = overlay.querySelector<HTMLElement>('.goal-progress-fill');
    if (f) f.style.width = `${pct}%`;
  });

  overlay.querySelectorAll<HTMLButtonElement>('.goal-option').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedMinutes = parseInt(btn.dataset.minutes || '20', 10);
      overlay.querySelectorAll('.goal-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  const close = () => overlay.remove();

  document.getElementById('goal-cancel')?.addEventListener('click', close);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) close();
  });

  document.getElementById('goal-save')?.addEventListener('click', () => {
    data.goalMinutes = selectedMinutes;
    saveGoal(data);
    updateIndicator(data);
    close();
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────

export function initReadingGoals(signal: AbortSignal): void {
  injectStyles();
  buildIndicator();

  document.addEventListener('visibilitychange', onVisibilityChange);

  const interval = setInterval(tickGoal, 30_000);
  setTimeout(tickGoal, 5_000);

  const onLangChange = () => {
    const indicator = document.getElementById('goal-indicator');
    if (indicator) {
      indicator.setAttribute('aria-label', tr('goal.title'));
    }
  };

  window.addEventListener('language-changed', onLangChange, { signal });

  signal.addEventListener('abort', () => {
    clearInterval(interval);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  });
}