/**
 * TTS control panel + mini-player.
 * Subscribes to the store in text-to-speech.ts. All rendering is imperative
 * string + DOM updates - no framework.
 */

import { t } from '../i18n';
import { icon } from './tts-icons';
import type { TtsState, TtsRate } from './text-to-speech';

// Lazy imports to avoid circular issue at module load time
type TtsAPI = typeof import('./text-to-speech');
let api: TtsAPI | null = null;
async function getApi(): Promise<TtsAPI> {
  if (!api) api = await import('./text-to-speech');
  return api;
}

function getLang(): string {
  return new URLSearchParams(window.location.search).get('lang')
    || localStorage.getItem('yuval_language')
    || document.documentElement.lang
    || 'he';
}

function tr(key: string): string {
  return t(key, getLang()) || key;
}

// ═══════════════════════════════════════════════════════════════════════════
// Panel
// ═══════════════════════════════════════════════════════════════════════════

let panelEl: HTMLElement | null = null;
let backdropEl: HTMLElement | null = null;
let unsubscribePanel: (() => void) | null = null;
let outsideClickHandler: ((e: MouseEvent) => void) | null = null;
let keydownHandler: ((e: KeyboardEvent) => void) | null = null;

export function mountTtsPanel(): void {
  if (panelEl) return;

  backdropEl = document.createElement('div');
  backdropEl.id = 'tts-backdrop';
  backdropEl.setAttribute('aria-hidden', 'true');
  document.body.appendChild(backdropEl);

  panelEl = document.createElement('div');
  panelEl.id = 'tts-panel';
  panelEl.setAttribute('role', 'dialog');
  panelEl.setAttribute('aria-modal', 'false');
  panelEl.setAttribute('aria-labelledby', 'tts-panel-title');
  panelEl.hidden = true;
  document.body.appendChild(panelEl);

  renderPanel();
}

function renderPanel(): void {
  if (!panelEl) return;
  void getApi().then(ttsApi => {
    const s = ttsApi.getState();
    const voices = ttsApi.getVoicesForLang();

    panelEl!.innerHTML = `
      <div class="tts-panel-handle" aria-hidden="true"></div>
      <div class="tts-panel-header">
        <h3 id="tts-panel-title" class="tts-panel-title">${tr('tts.panelTitle')}</h3>
        <button class="tts-panel-close" type="button" aria-label="${tr('tts.close')}">${icon('close', 18)}</button>
      </div>

      <div class="tts-progress" role="progressbar" aria-label="${tr('tts.progress')}"
           aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(s.progressPct * 100)}">
        <div class="tts-progress-fill" style="transform: scaleX(${s.progressPct})"></div>
      </div>

      <div class="tts-transport" role="group" aria-label="${tr('tts.panelTitle')}">
        <button class="tts-btn tts-btn-primary" data-act="play-toggle" type="button"
                aria-label="${s.status === 'playing' ? tr('tts.pause') : tr('tts.play')}">
          ${icon(s.status === 'playing' ? 'pause' : 'play', 20)}
        </button>
        <button class="tts-btn" data-act="stop" type="button" aria-label="${tr('tts.stop')}"
                ${s.status === 'idle' ? 'disabled' : ''}>
          ${icon('stop', 20)}
        </button>
        <button class="tts-btn" data-act="resume" type="button" aria-label="${tr('tts.resume')}"
                ${s.hasResumePoint && s.status === 'idle' ? '' : 'hidden'}>
          ${icon('resume', 20)}
        </button>
      </div>

      ${s.hasSelection ? `
        <button class="tts-selection-hint" data-act="from-selection" type="button">
          ${icon('selectionStart', 18)}
          <span>${tr('tts.fromSelection')}</span>
        </button>
      ` : ''}

      <div class="tts-section">
        <div class="tts-section-label">${icon('speed', 16)}<span>${tr('tts.speed')}</span></div>
        <div class="tts-speed" role="radiogroup" aria-label="${tr('tts.speed')}">
          ${renderSpeedPill('slow', 0.8, s.rate)}
          ${renderSpeedPill('normal', 1, s.rate)}
          ${renderSpeedPill('fast', 1.3, s.rate)}
        </div>
      </div>

      <div class="tts-section">
        <div class="tts-section-label">${icon('voice', 16)}<span>${tr('tts.voice')}</span></div>
        <div class="tts-voices" role="listbox" aria-label="${tr('tts.voice')}">
          ${voices.length ? voices.map(v => renderVoiceRow(v, s.voiceName)).join('') : `<div class="tts-voices-empty">${tr('tts.noVoices')}</div>`}
        </div>
      </div>
    `;

    wirePanelEvents();
  });
}

function renderSpeedPill(labelKey: 'slow' | 'normal' | 'fast', rate: TtsRate, active: TtsRate): string {
  const isActive = rate === active;
  return `
    <button type="button" class="tts-pill ${isActive ? 'is-active' : ''}"
            role="radio" aria-checked="${isActive}"
            data-act="rate" data-rate="${rate}">
      ${tr(`tts.${labelKey}`)}
    </button>
  `;
}

function renderVoiceRow(v: SpeechSynthesisVoice, activeName: string | null): string {
  const isActive = v.name === activeName;
  return `
    <div class="tts-voice-row ${isActive ? 'is-active' : ''}" role="option"
         aria-selected="${isActive}" data-voice="${escapeAttr(v.name)}">
      <button type="button" class="tts-voice-pick" data-act="pick-voice" data-voice="${escapeAttr(v.name)}">
        <span class="tts-voice-check">${isActive ? icon('check', 16) : ''}</span>
        <span class="tts-voice-name">${escapeHTML(cleanVoiceName(v.name))}</span>
      </button>
      <button type="button" class="tts-voice-preview" data-act="preview-voice"
              data-voice="${escapeAttr(v.name)}" aria-label="${tr('tts.preview')}">
        ${icon('preview', 16)}
      </button>
    </div>
  `;
}

function escapeHTML(s: string): string {
  return s.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c] as string);
}

/**
 * Strip language tags from a voice display name.
 * OS voices often embed language in the name itself (e.g. "Microsoft Asaf - Hebrew (Israel)",
 * "Google US English", "English (United Kingdom)+f3"). Keep only the voice identity.
 */
function cleanVoiceName(name: string): string {
  let out = name;
  // Drop leading vendor prefix (Microsoft, Google, Apple)
  out = out.replace(/^\s*(Microsoft|Google|Apple)\s+/iu, '');
  // Drop anything after " - " or " – " (em-dash variants) - typically the language tail
  out = out.replace(/\s*[-–—]\s*.*$/u, '');
  // Drop trailing parenthesized language/region tag, e.g. "Samantha (English US)"
  out = out.replace(/\s*\([^)]*\)\s*$/u, '');
  // Drop common language words if they're what's left
  out = out.replace(/\b(Hebrew|English|Spanish|Arabic|French|German|Italian|Portuguese|Russian|Chinese|Japanese|Korean)\b.*$/iu, '');
  return out.trim() || name;
}
function escapeAttr(s: string): string {
  return escapeHTML(s);
}

function wirePanelEvents(): void {
  if (!panelEl) return;
  panelEl.querySelectorAll<HTMLElement>('[data-act]').forEach(el => {
    el.addEventListener('click', async ev => {
      ev.stopPropagation();
      const act = el.dataset.act;
      const ttsApi = await getApi();
      switch (act) {
        case 'play-toggle': {
          const s = ttsApi.getState();
          if (s.status === 'playing') ttsApi.pause();
          else ttsApi.play();
          break;
        }
        case 'stop': ttsApi.stop(); break;
        case 'resume': ttsApi.resume(); break;
        case 'from-selection': ttsApi.play(); break;
        case 'rate': {
          const r = parseFloat(el.dataset.rate || '1') as TtsRate;
          ttsApi.setRate(r);
          break;
        }
        case 'pick-voice': {
          const name = el.dataset.voice;
          if (name) ttsApi.setVoice(name);
          break;
        }
        case 'preview-voice': {
          const name = el.dataset.voice;
          if (name) ttsApi.previewVoice(name);
          break;
        }
      }
    });
  });

  const closeBtn = panelEl.querySelector<HTMLElement>('.tts-panel-close');
  closeBtn?.addEventListener('click', async () => (await getApi()).closePanel());
}

export function openTtsPanel(): void {
  if (!panelEl) mountTtsPanel();
  if (!panelEl) return;

  renderPanel();
  panelEl.hidden = false;
  if (backdropEl) backdropEl.hidden = false;
  requestAnimationFrame(() => {
    panelEl?.classList.add('is-open');
    backdropEl?.classList.add('is-open');
  });

  // Focus the play button
  setTimeout(() => {
    const primary = panelEl?.querySelector<HTMLElement>('.tts-btn-primary');
    primary?.focus();
  }, 50);

  // Subscribe to store - re-render on state changes
  void getApi().then(ttsApi => {
    unsubscribePanel?.();
    unsubscribePanel = ttsApi.subscribe(state => updatePanelState(state));
  });

  // Outside click closes (desktop popover semantics)
  outsideClickHandler = (e: MouseEvent) => {
    if (!panelEl) return;
    const target = e.target as Node;
    if (panelEl.contains(target)) return;
    if ((target as HTMLElement).closest?.('#tts-fab')) return;
    void getApi().then(ttsApi => ttsApi.closePanel());
  };
  setTimeout(() => {
    if (outsideClickHandler) document.addEventListener('click', outsideClickHandler, { capture: true });
  }, 0);

  // Esc closes
  keydownHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      void getApi().then(ttsApi => ttsApi.closePanel());
    }
  };
  document.addEventListener('keydown', keydownHandler);

  // Backdrop tap (mobile)
  backdropEl?.addEventListener('click', () => {
    void getApi().then(ttsApi => ttsApi.closePanel());
  }, { once: true });
}

export function closeTtsPanel(): void {
  if (!panelEl) return;
  panelEl.classList.remove('is-open');
  backdropEl?.classList.remove('is-open');
  const onEnd = () => {
    if (panelEl) panelEl.hidden = true;
    if (backdropEl) backdropEl.hidden = true;
    panelEl?.removeEventListener('transitionend', onEnd);
  };
  panelEl.addEventListener('transitionend', onEnd);
  // Safety fallback
  setTimeout(() => {
    if (panelEl && !panelEl.classList.contains('is-open')) panelEl.hidden = true;
    if (backdropEl && !backdropEl.classList.contains('is-open')) backdropEl.hidden = true;
  }, 300);

  unsubscribePanel?.();
  unsubscribePanel = null;

  if (outsideClickHandler) {
    document.removeEventListener('click', outsideClickHandler, { capture: true });
    outsideClickHandler = null;
  }
  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler);
    keydownHandler = null;
  }
}

function updatePanelState(s: TtsState): void {
  if (!panelEl || panelEl.hidden) return;
  // Progress fill
  const fill = panelEl.querySelector<HTMLElement>('.tts-progress-fill');
  if (fill) fill.style.transform = `scaleX(${s.progressPct})`;
  const bar = panelEl.querySelector<HTMLElement>('.tts-progress');
  bar?.setAttribute('aria-valuenow', String(Math.round(s.progressPct * 100)));

  // Play/pause icon + label
  const primary = panelEl.querySelector<HTMLElement>('.tts-btn-primary');
  if (primary) {
    primary.innerHTML = icon(s.status === 'playing' ? 'pause' : 'play', 20);
    primary.setAttribute('aria-label', s.status === 'playing' ? tr('tts.pause') : tr('tts.play'));
  }

  // Stop disabled
  const stop = panelEl.querySelector<HTMLButtonElement>('[data-act="stop"]');
  if (stop) stop.disabled = s.status === 'idle';

  // Resume visibility
  const res = panelEl.querySelector<HTMLButtonElement>('[data-act="resume"]');
  if (res) res.hidden = !(s.hasResumePoint && s.status === 'idle');

  // Speed pills
  panelEl.querySelectorAll<HTMLElement>('[data-act="rate"]').forEach(p => {
    const r = parseFloat(p.dataset.rate || '1');
    const isActive = r === s.rate;
    p.classList.toggle('is-active', isActive);
    p.setAttribute('aria-checked', String(isActive));
  });

  // Voices - update active markers only (avoid re-render)
  panelEl.querySelectorAll<HTMLElement>('.tts-voice-row').forEach(row => {
    const name = row.dataset.voice;
    const isActive = name === s.voiceName;
    row.classList.toggle('is-active', isActive);
    row.setAttribute('aria-selected', String(isActive));
    const check = row.querySelector<HTMLElement>('.tts-voice-check');
    if (check) check.innerHTML = isActive ? icon('check', 16) : '';
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Mini-player
// ═══════════════════════════════════════════════════════════════════════════

let miniEl: HTMLElement | null = null;
let unsubscribeMini: (() => void) | null = null;

const RATE_CYCLE: TtsRate[] = [0.8, 1, 1.3];

export function mountMiniPlayer(): void {
  if (miniEl) return;
  miniEl = document.createElement('div');
  miniEl.id = 'tts-mini';
  miniEl.setAttribute('role', 'region');
  miniEl.setAttribute('aria-label', tr('tts.miniPlayer'));
  miniEl.innerHTML = `
    <div class="tts-mini-meta">
      <span class="tts-mini-pulse" aria-hidden="true"></span>
      <span class="tts-mini-label">${tr('tts.panelTitle')}</span>
      <span class="tts-mini-counter" aria-live="polite">0 / 0</span>
    </div>
    <div class="tts-mini-transport">
      <button type="button" class="tts-mini-btn tts-mini-btn-sm" data-act="prev" aria-label="${tr('tts.previous')}">
        ${icon('prev', 18)}
      </button>
      <button type="button" class="tts-mini-btn tts-mini-btn-primary" data-act="play-toggle" aria-label="${tr('tts.pause')}">
        ${icon('pause', 22)}
      </button>
      <button type="button" class="tts-mini-btn tts-mini-btn-sm" data-act="next" aria-label="${tr('tts.next')}">
        ${icon('next', 18)}
      </button>
    </div>
    <div class="tts-mini-progress" role="progressbar"
         aria-label="${tr('tts.progress')}"
         aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"
         tabindex="0"
         data-act="seek">
      <div class="tts-mini-progress-track"></div>
      <div class="tts-mini-progress-fill"></div>
      <div class="tts-mini-progress-thumb" aria-hidden="true"></div>
    </div>
    <div class="tts-mini-actions">
      <button type="button" class="tts-mini-rate" data-act="rate-cycle" aria-label="${tr('tts.rateCycle')}">
        <span class="tts-mini-rate-value">1.0×</span>
      </button>
      <button type="button" class="tts-mini-btn tts-mini-btn-sm" data-act="expand" aria-label="${tr('tts.expand')}">
        ${icon('expand', 18)}
      </button>
      <button type="button" class="tts-mini-btn tts-mini-btn-sm" data-act="stop" aria-label="${tr('tts.stop')}">
        ${icon('close', 18)}
      </button>
    </div>
  `;
  document.body.appendChild(miniEl);

  miniEl.querySelectorAll<HTMLElement>('[data-act]').forEach(b => {
    b.addEventListener('click', async (ev) => {
      const ttsApi = await getApi();
      const s = ttsApi.getState();
      const act = b.dataset.act;
      switch (act) {
        case 'play-toggle': {
          if (s.status === 'playing') ttsApi.pause();
          else ttsApi.play();
          break;
        }
        case 'stop': ttsApi.stop(); break;
        case 'prev': {
          const target = Math.max(0, s.sentenceIdx - 1);
          ttsApi.play({ fromSentence: target });
          break;
        }
        case 'next': {
          const total = s.totalSentences || 1;
          const target = Math.min(total - 1, s.sentenceIdx + 1);
          ttsApi.play({ fromSentence: target });
          break;
        }
        case 'rate-cycle': {
          const i = RATE_CYCLE.indexOf(s.rate);
          const next = RATE_CYCLE[(i + 1) % RATE_CYCLE.length];
          ttsApi.setRate(next);
          break;
        }
        case 'expand': ttsApi.openPanel(); break;
        case 'seek': {
          if (!(ev instanceof MouseEvent)) break;
          const bar = b.getBoundingClientRect();
          const isRtl = document.documentElement.dir === 'rtl';
          let ratio = (ev.clientX - bar.left) / bar.width;
          if (isRtl) ratio = 1 - ratio;
          ratio = Math.max(0, Math.min(1, ratio));
          const total = s.totalSentences || 1;
          const target = Math.max(0, Math.min(total - 1, Math.round(ratio * total)));
          ttsApi.play({ fromSentence: target });
          break;
        }
      }
    });
  });

  // Keyboard seek on progress bar
  const progressBar = miniEl.querySelector<HTMLElement>('.tts-mini-progress');
  progressBar?.addEventListener('keydown', async (e: KeyboardEvent) => {
    const ttsApi = await getApi();
    const s = ttsApi.getState();
    const total = s.totalSentences || 1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const target = Math.max(0, Math.min(total - 1, s.sentenceIdx + dir));
      ttsApi.play({ fromSentence: target });
    } else if (e.key === 'Home') {
      e.preventDefault(); ttsApi.play({ fromSentence: 0 });
    } else if (e.key === 'End') {
      e.preventDefault(); ttsApi.play({ fromSentence: total - 1 });
    }
  });

  requestAnimationFrame(() => miniEl?.classList.add('is-mounted'));

  void getApi().then(ttsApi => {
    unsubscribeMini = ttsApi.subscribe(s => {
      if (!miniEl) return;

      // Progress fill + thumb
      const fill = miniEl.querySelector<HTMLElement>('.tts-mini-progress-fill');
      if (fill) fill.style.transform = `scaleX(${s.progressPct})`;
      const thumb = miniEl.querySelector<HTMLElement>('.tts-mini-progress-thumb');
      if (thumb) thumb.style.insetInlineStart = `${s.progressPct * 100}%`;
      miniEl.querySelector<HTMLElement>('.tts-mini-progress')
        ?.setAttribute('aria-valuenow', String(Math.round(s.progressPct * 100)));

      // Play/pause
      const toggle = miniEl.querySelector<HTMLElement>('[data-act="play-toggle"]');
      if (toggle) {
        toggle.innerHTML = icon(s.status === 'playing' ? 'pause' : 'play', 22);
        toggle.setAttribute('aria-label', s.status === 'playing' ? tr('tts.pause') : tr('tts.play'));
      }

      // Rate
      const rateVal = miniEl.querySelector<HTMLElement>('.tts-mini-rate-value');
      if (rateVal) rateVal.textContent = `${s.rate.toFixed(1)}×`;

      // Counter (sentence position)
      const counter = miniEl.querySelector<HTMLElement>('.tts-mini-counter');
      if (counter) {
        const cur = s.totalSentences ? Math.min(s.sentenceIdx + 1, s.totalSentences) : 0;
        counter.textContent = `${cur} / ${s.totalSentences}`;
      }

      // Playing state (drives pulse animation + accent color)
      miniEl.dataset.status = s.status;

      // Prev/Next disabled at bounds
      const prev = miniEl.querySelector<HTMLButtonElement>('[data-act="prev"]');
      const next = miniEl.querySelector<HTMLButtonElement>('[data-act="next"]');
      if (prev) prev.disabled = s.sentenceIdx <= 0;
      if (next) next.disabled = s.totalSentences === 0 || s.sentenceIdx >= s.totalSentences - 1;
    });
  });
}

export function unmountMiniPlayer(): void {
  if (!miniEl) return;
  miniEl.classList.remove('is-mounted');
  unsubscribeMini?.();
  unsubscribeMini = null;
  setTimeout(() => {
    miniEl?.remove();
    miniEl = null;
  }, 200);
}
