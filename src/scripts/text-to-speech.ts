/**
 * Text-to-Speech
 *
 * Reads the current chapter aloud using the Web Speech API.
 * - Floating player bar (play/pause, stop, speed, voice)
 * - Highlights the paragraph currently being read
 * - Auto-detects voices per language
 * - RTL-aware
 * - Reads paragraph by paragraph for precise control
 */

import { t, isRtlLang } from '../i18n';

function getLang(): string {
  return new URLSearchParams(window.location.search).get('lang')
    || localStorage.getItem('yuval_language')
    || 'en';
}

function tr(key: string) { return t(key, getLang()); }

// ── State ─────────────────────────────────────────────────────────────────────

let playing = false;
let paused  = false;
let currentParagraphIdx = 0;
let paragraphs: HTMLElement[] = [];
let currentUtterance: SpeechSynthesisUtterance | null = null;
let selectedVoice: SpeechSynthesisVoice | null = null;
let playbackRate = 1;

const HIGHLIGHT_CLASS = 'tts-reading-highlight';
const VOICE_STORAGE_KEY = 'yuval_tts_voice';
const SPEED_STORAGE_KEY = 'yuval_tts_speed';

function getSavedVoiceName(): string | null {
  const lang = getLang();
  return localStorage.getItem(`${VOICE_STORAGE_KEY}_${lang}`);
}

function saveVoiceName(voice: SpeechSynthesisVoice): void {
  const lang = getLang();
  localStorage.setItem(`${VOICE_STORAGE_KEY}_${lang}`, voice.name);
}

function getSavedSpeed(): number {
  return parseFloat(localStorage.getItem(SPEED_STORAGE_KEY) || '1');
}

function saveSpeed(rate: number): void {
  localStorage.setItem(SPEED_STORAGE_KEY, String(rate));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getLangCode(): string {
  const l = getLang();
  return l === 'he' ? 'he-IL' : l === 'es' ? 'es-ES' : 'en-US';
}

function getVoicesForLang(): SpeechSynthesisVoice[] {
  const langCode = getLangCode();
  const all = window.speechSynthesis.getVoices();
  const exact = all.filter(v => v.lang === langCode);
  if (exact.length) return exact;
  const prefix = langCode.slice(0, 2);
  return all.filter(v => v.lang.startsWith(prefix));
}

function getParagraphs(): HTMLElement[] {
  const lang = getLang();
  const container = document.querySelector<HTMLElement>(
    `[data-lang="${lang}"].visible .chapter-content, [data-lang="en"].visible .chapter-content`
  ) || document.querySelector<HTMLElement>('.chapter-content');

  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>('p, h2, h3, li'))
    .filter(el => el.textContent?.trim().length > 0);
}

function clearHighlight(): void {
  document.querySelectorAll<HTMLElement>(`.${HIGHLIGHT_CLASS}`).forEach(el => {
    el.classList.remove(HIGHLIGHT_CLASS);
    el.style.removeProperty('background');
    el.style.removeProperty('border-radius');
    el.style.removeProperty('transition');
  });
}

function highlightParagraph(el: HTMLElement): void {
  clearHighlight();
  el.classList.add(HIGHLIGHT_CLASS);
  el.style.background = 'rgba(99,102,241,0.12)';
  el.style.borderRadius = '6px';
  el.style.transition = 'background 0.3s ease';
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ── Playback ──────────────────────────────────────────────────────────────────

function speakParagraph(idx: number): void {
  if (idx >= paragraphs.length) {
    stopAll();
    return;
  }

  const el = paragraphs[idx];
  const text = el.textContent?.trim() || '';
  if (!text) { speakParagraph(idx + 1); return; }

  highlightParagraph(el);
  updatePlayerState();

  const utt = new SpeechSynthesisUtterance(text);
  const langCode = getLangCode();
  utt.lang = langCode;
  utt.rate = playbackRate;
  // Use manually selected voice if set, otherwise best match for current lang
  if (selectedVoice && selectedVoice.lang.startsWith(langCode.slice(0, 2))) {
    utt.voice = selectedVoice;
  } else {
    const voices = getVoicesForLang();
    // Prefer local/native voices over remote/network voices
    const local = voices.find(v => v.localService);
    utt.voice = local || voices[0] || null;
    selectedVoice = utt.voice;
  }

  utt.onend = () => {
    if (!playing) return;
    currentParagraphIdx = idx + 1;
    speakParagraph(currentParagraphIdx);
  };

  utt.onerror = (e) => {
    if (e.error === 'interrupted' || e.error === 'canceled') return;
    currentParagraphIdx = idx + 1;
    speakParagraph(currentParagraphIdx);
  };

  currentUtterance = utt;
  window.speechSynthesis.speak(utt);
}

function playFromParagraph(el: HTMLElement): void {
  paragraphs = getParagraphs();
  const idx = paragraphs.indexOf(el);
  if (idx < 0) return;
  window.speechSynthesis.cancel();
  currentParagraphIdx = idx;
  playing = true;
  paused = false;
  speakParagraph(currentParagraphIdx);
  document.getElementById('tts-fab')?.classList.add('tts-playing');
}

function play(): void {
  if (paused) {
    window.speechSynthesis.resume();
    paused = false;
    playing = true;
    updatePlayerState();
    return;
  }

  paragraphs = getParagraphs();
  if (!paragraphs.length) return;

  window.speechSynthesis.cancel();
  playing = true;
  paused = false;
  speakParagraph(currentParagraphIdx);
}

function pause(): void {
  window.speechSynthesis.pause();
  paused = true;
  playing = false;
  updatePlayerState();
}

function stopAll(): void {
  window.speechSynthesis.cancel();
  playing = false;
  paused = false;
  currentParagraphIdx = 0;
  currentUtterance = null;
  clearHighlight();
  updatePlayerState();
}

// ── Player UI ─────────────────────────────────────────────────────────────────

function updatePlayerState(): void {
  const playBtn  = document.getElementById('tts-play') as HTMLButtonElement | null;
  const stopBtn  = document.getElementById('tts-stop') as HTMLButtonElement | null;
  const bar      = document.getElementById('tts-player');
  const fab      = document.getElementById('tts-fab');

  if (!bar) return;

  if (playBtn) {
    playBtn.textContent = playing ? '⏸' : '▶';
    playBtn.title = playing ? tr('tts.pause') : tr('tts.play');
  }
  if (stopBtn) stopBtn.disabled = !playing && !paused;

  bar.classList.toggle('tts-active', playing || paused);
  document.body.classList.toggle('tts-active', playing || paused);

  // FAB icon: 🔊 idle → ⏸ playing → ▶ paused
  if (fab) {
    fab.textContent = playing ? '⏸' : paused ? '▶' : '🔊';
    fab.classList.toggle('tts-playing', playing);
    fab.classList.toggle('tts-paused', paused);
  }

  // Clickable paragraphs when TTS active
  document.querySelectorAll<HTMLElement>('.chapter-content p, .chapter-content h2, .chapter-content h3, .chapter-content li').forEach(el => {
    if (playing || paused) {
      el.style.cursor = 'pointer';
      el.title = tr('tts.clickToRead');
    } else {
      el.style.cursor = '';
      el.title = '';
    }
  });
}

function buildVoiceOptions(): string {
  const voices = getVoicesForLang();
  if (!voices.length) return '<option>Default</option>';
  return voices.map((v, i) =>
    `<option value="${i}">${v.name.replace(/\(.*?\)/g, '').trim()}</option>`
  ).join('');
}

function injectStyles(): void {
  if (document.getElementById('tts-styles')) return;
  const s = document.createElement('style');
  s.id = 'tts-styles';
  s.textContent = `
    /* ── TTS FAB button ── */
    #tts-fab {
      position: fixed;
      bottom: 370px;
      right: 20px;
      z-index: 9980;
      width: 44px; height: 44px;
      border-radius: 50%;
      background: var(--yuval-surface, #fff);
      border: 1px solid var(--yuval-border, #e5e7eb);
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      color: var(--yuval-text-secondary, #555);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
      transition: transform 0.2s, box-shadow 0.2s, background 0.15s;
    }
    #tts-fab:hover {
      transform: scale(1.08);
      box-shadow: 0 4px 16px rgba(0,0,0,0.14);
    }
    #tts-fab.tts-playing {
      background: #6366f1;
      color: #fff;
      border-color: #6366f1;
      animation: ttsPulse 1.5s ease infinite;
    }
    #tts-fab.tts-paused {
      background: #f97316;
      color: #fff;
      border-color: #f97316;
    }
    :is(.dark) #tts-fab { background: #2a2a2a; border-color: rgba(255,255,255,0.1); }
    [dir="rtl"] #tts-fab { right: auto; left: 20px; }

    /* Paragraph hover when TTS active */
    body.tts-active .chapter-content p:hover,
    body.tts-active .chapter-content h2:hover,
    body.tts-active .chapter-content h3:hover,
    body.tts-active .chapter-content li:hover {
      background: rgba(99,102,241,0.07);
      border-radius: 4px;
      outline: 1px dashed rgba(99,102,241,0.3);
    }

    @keyframes ttsPulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
      50%      { box-shadow: 0 0 0 8px rgba(99,102,241,0); }
    }

    /* ── Player bar ── */
    #tts-player {
      position: fixed;
      bottom: -80px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9990;
      background: var(--yuval-surface, #fff);
      border: 1px solid var(--yuval-border, #e5e7eb);
      border-radius: 99px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      padding: 10px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: bottom 0.35s cubic-bezier(0.34,1.56,0.64,1);
      min-width: 300px;
    }
    :is(.dark) #tts-player {
      background: #1e1e1e;
      border-color: rgba(255,255,255,0.1);
    }
    #tts-player.tts-active {
      bottom: 16px;
    }

    .tts-btn {
      width: 36px; height: 36px;
      border-radius: 50%;
      border: none;
      background: var(--yuval-bg-secondary, #f3f4f6);
      color: var(--yuval-text, #1a1a1a);
      font-size: 16px;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, transform 0.15s;
      flex-shrink: 0;
    }
    .tts-btn:hover:not(:disabled) {
      background: #6366f1;
      color: #fff;
      transform: scale(1.05);
    }
    .tts-btn:disabled { opacity: 0.35; cursor: default; }
    #tts-play {
      width: 42px; height: 42px;
      background: #6366f1;
      color: #fff;
      font-size: 18px;
    }
    #tts-play:hover { background: #4f46e5; }

    .tts-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--yuval-text-secondary, #555);
      white-space: nowrap;
      flex: 1;
      text-align: center;
    }

    /* Speed control */
    #tts-speed {
      font-size: 12px;
      font-weight: 700;
      color: var(--yuval-text, #1a1a1a);
      background: var(--yuval-bg-secondary, #f3f4f6);
      border: 1px solid var(--yuval-border, #e5e7eb);
      border-radius: 6px;
      padding: 4px 8px;
      cursor: pointer;
      min-width: 44px;
      text-align: center;
    }

    /* Close */
    #tts-close {
      font-size: 14px;
      color: var(--yuval-text-muted, #999);
    }
  `;
  document.head.appendChild(s);
}

function buildPlayer(): void {
  if (document.getElementById('tts-fab')) return;

  // FAB
  const fab = document.createElement('button');
  fab.id = 'tts-fab';
  fab.type = 'button';
  fab.setAttribute('aria-label', tr('tts.label'));
  fab.textContent = '🔊';
  document.body.appendChild(fab);

  // Player bar
  const player = document.createElement('div');
  player.id = 'tts-player';
  player.setAttribute('dir', isRtlLang(getLang()) ? 'rtl' : 'ltr');
  player.innerHTML = `
    <button class="tts-btn" id="tts-stop" title="${tr('tts.stop')}" disabled>⏹</button>
    <button class="tts-btn" id="tts-play" title="${tr('tts.play')}">▶</button>
    <span class="tts-label">🔊 ${tr('tts.label')}</span>
    <select id="tts-voice-select" title="${tr('tts.voice')}" style="
      font-size:11px; max-width:90px; border-radius:6px;
      border:1px solid var(--yuval-border,#e5e7eb);
      background:var(--yuval-bg-secondary,#f3f4f6);
      color:var(--yuval-text,#1a1a1a);
      padding:3px 4px; cursor:pointer;
    "></select>
    <button class="tts-btn" id="tts-speed" title="${tr('tts.speed')}">1×</button>
    <button class="tts-btn" id="tts-close" title="${tr('tts.stop')}">✕</button>
  `;
  document.body.appendChild(player);

  // FAB click — toggle play/pause or show player
  fab.addEventListener('click', () => {
    if (!window.speechSynthesis) {
      alert(tr('tts.notSupported'));
      return;
    }
    if (playing) { pause(); fab.classList.remove('tts-playing'); }
    else { play(); fab.classList.add('tts-playing'); }
  });

  // Play/Pause button
  document.getElementById('tts-play')?.addEventListener('click', () => {
    if (playing) { pause(); fab.classList.remove('tts-playing'); }
    else { play(); fab.classList.add('tts-playing'); }
  });

  // Stop
  document.getElementById('tts-stop')?.addEventListener('click', () => {
    stopAll();
    fab.classList.remove('tts-playing');
  });

  // Close player
  document.getElementById('tts-close')?.addEventListener('click', () => {
    stopAll();
    fab.classList.remove('tts-playing');
  });

  // Voice selector — populate for current lang
  function populateVoiceSelect() {
    const sel = document.getElementById('tts-voice-select') as HTMLSelectElement | null;
    if (!sel) return;
    const voices = getVoicesForLang();
    if (!voices.length) {
      sel.innerHTML = '<option>Default</option>';
      sel.style.display = 'none';
      return;
    }
    sel.style.display = '';
    sel.innerHTML = voices.map((v, i) =>
      `<option value="${i}">${v.name.replace(/Microsoft |Google /, '').split(' (')[0]}</option>`
    ).join('');
    // Restore saved voice, then fall back to current selectedVoice, then local voice
    const savedName = getSavedVoiceName();
    const savedIdx = savedName ? voices.findIndex(v => v.name === savedName) : -1;
    if (savedIdx >= 0) {
      sel.selectedIndex = savedIdx;
      selectedVoice = voices[savedIdx];
    } else if (selectedVoice) {
      const idx = voices.indexOf(selectedVoice);
      if (idx >= 0) sel.selectedIndex = idx;
    } else {
      const localIdx = voices.findIndex(v => v.localService);
      sel.selectedIndex = localIdx >= 0 ? localIdx : 0;
      selectedVoice = voices[sel.selectedIndex];
    }
    sel.addEventListener('change', () => {
      selectedVoice = voices[parseInt(sel.value, 10)];
      if (selectedVoice) saveVoiceName(selectedVoice);
      if (playing) {
        window.speechSynthesis.cancel();
        setTimeout(() => speakParagraph(currentParagraphIdx), 50);
      }
    });
  }

  populateVoiceSelect();
  // Re-populate when lang changes
  window.addEventListener('language-changed', () => {
    selectedVoice = null;
    setTimeout(populateVoiceSelect, 100);
  });

  // Speed cycle: 0.75 → 1 → 1.25 → 1.5 → 2 → 0.75
  const speeds = [0.75, 1, 1.25, 1.5, 2];
  const savedRate = getSavedSpeed();
  let speedIdx = speeds.indexOf(savedRate) >= 0 ? speeds.indexOf(savedRate) : 1;
  playbackRate = speeds[speedIdx];
  const speedBtn = document.getElementById('tts-speed');
  if (speedBtn) speedBtn.textContent = `${playbackRate}×`;

  document.getElementById('tts-speed')?.addEventListener('click', () => {
    speedIdx = (speedIdx + 1) % speeds.length;
    playbackRate = speeds[speedIdx];
    saveSpeed(playbackRate);
    const btn = document.getElementById('tts-speed');
    if (btn) btn.textContent = `${playbackRate}×`;
    // Restart current paragraph at new speed
    if (playing) {
      window.speechSynthesis.cancel();
      setTimeout(() => speakParagraph(currentParagraphIdx), 50);
    }
  });

  updatePlayerState();
}

// ── Init ──────────────────────────────────────────────────────────────────────

export function initTextToSpeech(signal: AbortSignal): void {
  if (!('speechSynthesis' in window)) return;

  injectStyles();

  // Voices load async in some browsers
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      const voices = getVoicesForLang();
      if (voices.length) selectedVoice = voices[0];
      buildPlayer();
    }, { once: true });
  } else {
    const voices = getVoicesForLang();
    if (voices.length) selectedVoice = voices[0];
    buildPlayer();
  }

  // Paragraph click — start reading from that paragraph
  function registerParagraphClicks() {
    const selector = '.chapter-content p, .chapter-content h2, .chapter-content h3, .chapter-content li';
    document.querySelectorAll<HTMLElement>(selector).forEach(el => {
      el.addEventListener('click', (e) => {
        if (!playing && !paused) return; // only active when TTS is running/paused
        e.stopPropagation();
        playFromParagraph(el);
      });
    });
  }

  registerParagraphClicks();

  // Stop on chapter navigation
  window.addEventListener('chapter-content-swapped', () => {
    stopAll();
    currentParagraphIdx = 0;
    paragraphs = [];
    setTimeout(registerParagraphClicks, 300);
  });

  // Stop and reset on language change — re-read in new language
  window.addEventListener('language-changed', () => {
    const wasPlaying = playing || paused;
    stopAll();
    currentParagraphIdx = 0;
    paragraphs = [];
    // Update player bar direction
    const player = document.getElementById('tts-player');
    if (player) player.setAttribute('dir', isRtlLang(getLang()) ? 'rtl' : 'ltr');
    // Auto-resume in new language if was playing
    if (wasPlaying) {
      setTimeout(() => {
        play();
        document.getElementById('tts-fab')?.classList.add('tts-playing');
      }, 300);
    }
  });

  signal.addEventListener('abort', () => {
    stopAll();
    document.getElementById('tts-fab')?.remove();
    document.getElementById('tts-player')?.remove();
  });
}
