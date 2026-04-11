/**
 * Reading Goals — daily reading target with streak tracking.
 * Shows a small goal indicator that fills as you read.
 * Stored in localStorage per book.
 */

type LangKey = 'he' | 'en' | 'es';

function getLang(): LangKey {
  return (new URLSearchParams(window.location.search).get('lang')
    || localStorage.getItem('yuval_language')
    || 'en') as LangKey;
}

function getCurrentBook(): string {
  return document.getElementById('chapter-container')?.dataset.book || '';
}

// ── i18n ─────────────────────────────────────────────────────────────────────

const i18n: Record<LangKey, {
  title: string;
  goal: string;
  setGoal: string;
  streak: (n: number) => string;
  todayDone: string;
  minutesLeft: (n: number) => string;
  save: string;
  cancel: string;
  goalOptions: { label: string; minutes: number }[];
  dir: 'rtl' | 'ltr';
}> = {
  he: {
    title: 'יעד קריאה יומי',
    goal: 'יעד',
    setGoal: 'הגדר יעד',
    streak: (n) => n === 1 ? '🔥 יום אחד' : `🔥 ${n} ימים`,
    todayDone: '✅ השגת את היעד היום!',
    minutesLeft: (n) => `${n} דקות נותרו`,
    save: 'שמור',
    cancel: 'ביטול',
    goalOptions: [
      { label: '10 דקות', minutes: 10 },
      { label: '20 דקות', minutes: 20 },
      { label: '30 דקות', minutes: 30 },
      { label: 'שעה', minutes: 60 },
    ],
    dir: 'rtl',
  },
  es: {
    title: 'Meta de lectura diaria',
    goal: 'Meta',
    setGoal: 'Establecer meta',
    streak: (n) => n === 1 ? '🔥 1 día' : `🔥 ${n} días`,
    todayDone: '✅ ¡Meta alcanzada hoy!',
    minutesLeft: (n) => `${n} min restantes`,
    save: 'Guardar',
    cancel: 'Cancelar',
    goalOptions: [
      { label: '10 min', minutes: 10 },
      { label: '20 min', minutes: 20 },
      { label: '30 min', minutes: 30 },
      { label: '1 hora', minutes: 60 },
    ],
    dir: 'ltr',
  },
  en: {
    title: 'Daily Reading Goal',
    goal: 'Goal',
    setGoal: 'Set goal',
    streak: (n) => n === 1 ? '🔥 1 day' : `🔥 ${n} days`,
    todayDone: '✅ Goal reached today!',
    minutesLeft: (n) => `${n} min left`,
    save: 'Save',
    cancel: 'Cancel',
    goalOptions: [
      { label: '10 min', minutes: 10 },
      { label: '20 min', minutes: 20 },
      { label: '30 min', minutes: 30 },
      { label: '1 hour', minutes: 60 },
    ],
    dir: 'ltr',
  },
};

function tr() { return i18n[getLang()]; }

// ── Storage ───────────────────────────────────────────────────────────────────

interface GoalData {
  goalMinutes: number;          // user target
  todayMinutes: number;         // minutes read today
  todayDate: string;            // YYYY-MM-DD
  streak: number;               // consecutive days goal was met
  lastStreakDate: string;       // last date streak was updated
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
    return { goalMinutes: DEFAULT_GOAL, todayMinutes: 0, todayDate: today(), streak: 0, lastStreakDate: '' };
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
  const t = today();

  // Reset daily counter if new day
  if (data.todayDate !== t) {
    // Check streak: was goal met yesterday?
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);

    if (data.todayDate === yStr && data.todayMinutes >= data.goalMinutes) {
      data.streak += 1;
    } else if (data.todayDate !== yStr) {
      data.streak = 0; // missed a day
    }

    data.todayMinutes = 0;
    data.todayDate = t;
  }

  // Add session minutes
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
      bottom: 316px;
      right: 20px;
      z-index: 9980;
      width: 44px; height: 44px;
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
    [dir="rtl"] #goal-indicator { right: auto; left: 20px; }

    /* Circular SVG progress ring */
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

    /* Goal modal */
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
  el.setAttribute('aria-label', 'Reading goal');
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
  if (!fill || !emoji) return;

  const pct = Math.min(1, data.todayMinutes / data.goalMinutes);
  const circumference = 2 * Math.PI * 19; // r=19
  const offset = circumference * (1 - pct);

  fill.style.strokeDasharray = String(circumference);
  fill.style.strokeDashoffset = String(offset);

  if (pct >= 1) {
    fill.classList.add('done');
    emoji.textContent = '✅';
  } else if (pct > 0) {
    emoji.textContent = '📖';
  } else {
    emoji.textContent = '🎯';
  }
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function openGoalModal(): void {
  if (document.getElementById('goal-modal-overlay')) return;

  const labels = tr();
  const data = loadGoal();
  let selectedMinutes = data.goalMinutes;

  const pct = Math.min(100, Math.round((data.todayMinutes / data.goalMinutes) * 100));
  const remaining = Math.max(0, Math.ceil(data.goalMinutes - data.todayMinutes));
  const progressText = pct >= 100
    ? labels.todayDone
    : labels.minutesLeft(remaining);

  const overlay = document.createElement('div');
  overlay.id = 'goal-modal-overlay';
  overlay.setAttribute('dir', labels.dir);
  overlay.innerHTML = `
    <div id="goal-modal">
      <h2>🎯 ${labels.title}</h2>
      <div class="goal-streak-row">${labels.streak(data.streak)}</div>
      <div class="goal-progress-row">
        <div class="goal-progress-label">${labels.goal}: ${data.goalMinutes} min</div>
        <div class="goal-progress-bar">
          <div class="goal-progress-fill" style="width:0%" data-target="${pct}"></div>
        </div>
        <div class="goal-progress-text">${progressText}</div>
      </div>
      <div class="goal-options">
        ${labels.goalOptions.map(opt => `
          <button class="goal-option${opt.minutes === selectedMinutes ? ' active' : ''}"
            data-minutes="${opt.minutes}" type="button">${opt.label}</button>
        `).join('')}
      </div>
      <div class="goal-modal-actions">
        <button class="goal-btn" id="goal-cancel">${labels.cancel}</button>
        <button class="goal-btn primary" id="goal-save">${labels.save}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Animate bar
  requestAnimationFrame(() => {
    const f = overlay.querySelector<HTMLElement>('.goal-progress-fill');
    if (f) f.style.width = `${pct}%`;
  });

  // Option selection
  overlay.querySelectorAll<HTMLButtonElement>('.goal-option').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedMinutes = parseInt(btn.dataset.minutes || '20', 10);
      overlay.querySelectorAll('.goal-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  const close = () => overlay.remove();

  document.getElementById('goal-cancel')!.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  document.getElementById('goal-save')!.addEventListener('click', () => {
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

  // Track visibility changes
  document.addEventListener('visibilitychange', onVisibilityChange);

  // Tick every 30s to update progress
  const interval = setInterval(tickGoal, 30_000);
  // Initial tick after 5s
  setTimeout(tickGoal, 5_000);

  signal.addEventListener('abort', () => {
    clearInterval(interval);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  });
}
