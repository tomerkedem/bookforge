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
  el.style.background = 'rgba(71,85,105,0.12)';
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
    playBtn.innerHTML = playing 
      ? `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" class="tts-play-icon"><path d="M8 5.14v14l11-7-11-7z"/></svg>`;
    playBtn.title = playing ? tr('tts.pause') : tr('tts.play');
  }
  if (stopBtn) stopBtn.disabled = !playing && !paused;

  bar.classList.toggle('tts-active', playing || paused);
  document.body.classList.toggle('tts-active', playing || paused);

  // FAB icon: 🔊 idle → ⏸ playing → ▶ paused
  if (fab) {
    if (playing) {
      fab.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>`;
    } else if (paused) {
      fab.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M8 5.14v14l11-7-11-7z"/></svg>`;
    } else {
      fab.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="20" height="20">
          <rect x="4" y="10" width="2" height="4" rx="1" fill="currentColor" class="tts-bar tts-bar-1"/>
          <rect x="8" y="7" width="2" height="10" rx="1" fill="currentColor" class="tts-bar tts-bar-2"/>
          <rect x="12" y="4" width="2" height="16" rx="1" fill="currentColor" class="tts-bar tts-bar-3"/>
          <rect x="16" y="7" width="2" height="10" rx="1" fill="currentColor" class="tts-bar tts-bar-4"/>
          <rect x="20" y="10" width="2" height="4" rx="1" fill="currentColor" class="tts-bar tts-bar-5"/>
        </svg>`;
    }
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
      width: 48px; height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.5);
      box-shadow: 
        0 4px 16px rgba(0,0,0,0.1),
        0 2px 4px rgba(71,85,105,0.08),
        inset 0 1px 0 rgba(255,255,255,0.8);
      color: #475569;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
    }
    :is(.dark) #tts-fab {
      background: linear-gradient(135deg, rgba(40,40,40,0.95) 0%, rgba(30,30,30,0.9) 100%);
      border-color: rgba(255,255,255,0.08);
      color: #94a3b8;
      box-shadow: 
        0 4px 16px rgba(0,0,0,0.3),
        inset 0 1px 0 rgba(255,255,255,0.05);
    }
    #tts-fab svg { display: block; filter: drop-shadow(0 1px 2px rgba(71,85,105,0.2)); }
    #tts-fab:hover {
      transform: scale(1.1);
      box-shadow: 
        0 6px 24px rgba(71,85,105,0.25),
        0 2px 8px rgba(71,85,105,0.15),
        inset 0 1px 0 rgba(255,255,255,0.9);
    }
    #tts-fab:hover .tts-bar {
      animation: ttsWave 0.6s ease-in-out infinite;
    }
    #tts-fab:hover .tts-bar-1 { animation-delay: 0s; }
    #tts-fab:hover .tts-bar-2 { animation-delay: 0.1s; }
    #tts-fab:hover .tts-bar-3 { animation-delay: 0.2s; }
    #tts-fab:hover .tts-bar-4 { animation-delay: 0.3s; }
    #tts-fab:hover .tts-bar-5 { animation-delay: 0.4s; }
    @keyframes ttsWave {
      0%, 100% { transform: scaleY(1); }
      50% { transform: scaleY(0.5); }
    }
    #tts-fab.tts-playing {
      background: linear-gradient(135deg, #64748b 0%, #475569 50%, #334155 100%);
      color: #fff;
      border-color: transparent;
      box-shadow: 
        0 4px 20px rgba(71,85,105,0.45),
        0 2px 8px rgba(71,85,105,0.25),
        inset 0 1px 0 rgba(255,255,255,0.2);
      animation: fabPulse 2s ease-in-out infinite;
    }
    @keyframes fabPulse {
      0%, 100% { box-shadow: 0 4px 20px rgba(71,85,105,0.45), 0 0 0 0 rgba(71,85,105,0.3); }
      50% { box-shadow: 0 4px 20px rgba(71,85,105,0.45), 0 0 0 8px rgba(71,85,105,0); }
    }
    #tts-fab.tts-paused {
      background: linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ea580c 100%);
      color: #fff;
      border-color: transparent;
      box-shadow: 
        0 4px 20px rgba(249,115,22,0.45),
        0 2px 8px rgba(249,115,22,0.25),
        inset 0 1px 0 rgba(255,255,255,0.2);
    }
    [dir="rtl"] #tts-fab { right: auto; left: 20px; }

    /* Paragraph hover when TTS active */
    body.tts-active .chapter-content p:hover,
    body.tts-active .chapter-content h2:hover,
    body.tts-active .chapter-content h3:hover,
    body.tts-active .chapter-content li:hover {
      background: rgba(71,85,105,0.07);
      border-radius: 4px;
      outline: 1px dashed rgba(71,85,105,0.3);
    }

    /* ── Player bar ── */
    #tts-player {
      position: fixed;
      bottom: -80px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9990;
      background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.5);
      border-radius: 99px;
      box-shadow: 
        0 8px 32px rgba(0,0,0,0.12),
        0 2px 8px rgba(71,85,105,0.08),
        inset 0 1px 0 rgba(255,255,255,0.8);
      padding: 10px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: bottom 0.35s cubic-bezier(0.34,1.56,0.64,1);
      min-width: 300px;
    }
    :is(.dark) #tts-player {
      background: linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(20,20,20,0.9) 100%);
      border-color: rgba(255,255,255,0.08);
      box-shadow: 
        0 8px 32px rgba(0,0,0,0.4),
        0 2px 8px rgba(71,85,105,0.15),
        inset 0 1px 0 rgba(255,255,255,0.05);
    }
    #tts-player.tts-active {
      bottom: 16px;
    }

    .tts-btn {
      width: 36px; height: 36px;
      border-radius: 50%;
      border: 1px solid transparent;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      color: #475569;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
      flex-shrink: 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8);
    }
    :is(.dark) .tts-btn {
      background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
      color: #cbd5e1;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05);
    }
    .tts-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #64748b 0%, #475569 100%);
      color: #fff;
      transform: scale(1.08);
      box-shadow: 0 4px 12px rgba(71,85,105,0.35);
    }
    .tts-btn:disabled { opacity: 0.35; cursor: default; }
    .tts-btn svg { display: block; pointer-events: none; }
    
    /* Main play button - premium style */
    #tts-play {
      width: 48px; height: 48px;
      background: linear-gradient(135deg, #64748b 0%, #475569 50%, #334155 100%);
      color: #fff;
      border: none;
      box-shadow: 
        0 4px 16px rgba(71,85,105,0.4),
        0 2px 4px rgba(71,85,105,0.2),
        inset 0 1px 0 rgba(255,255,255,0.2);
      position: relative;
    }
    #tts-play::before {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 50%;
      background: conic-gradient(from 0deg, #475569, #94a3b8, #475569);
      opacity: 0;
      z-index: -1;
      transition: opacity 0.3s;
      animation: playRing 2s linear infinite;
    }
    #tts-play:hover::before,
    #tts-player.tts-active #tts-play::before {
      opacity: 0.6;
    }
    @keyframes playRing {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    #tts-play svg { width: 20px; height: 20px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2)); }
    #tts-play:hover { 
      transform: scale(1.1);
      box-shadow: 
        0 6px 24px rgba(71,85,105,0.5),
        0 2px 8px rgba(71,85,105,0.3),
        inset 0 1px 0 rgba(255,255,255,0.3);
    }

    .tts-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--yuval-text-secondary, #555);
      white-space: nowrap;
      flex: 1;
      text-align: center;
    }
    :is(.dark) .tts-label { color: #94a3b8; }

    /* Speed control */
    #tts-speed {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: #475569;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      border: 1px solid rgba(148,163,184,0.3);
      border-radius: 8px;
      padding: 6px 10px;
      cursor: pointer;
      min-width: 44px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8);
      transition: all 0.2s;
    }
    #tts-speed:hover {
      background: linear-gradient(135deg, #64748b 0%, #475569 100%);
      color: #fff;
      border-color: transparent;
      box-shadow: 0 2px 8px rgba(71,85,105,0.3);
    }
    :is(.dark) #tts-speed {
      background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
      color: #cbd5e1;
      border-color: rgba(255,255,255,0.08);
      box-shadow: 0 1px 3px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05);
    }

    /* Close */
    #tts-close {
      color: #94a3b8;
      width: 32px;
      height: 32px;
    }
    #tts-close:hover {
      background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
      color: #dc2626;
      box-shadow: 0 2px 8px rgba(220,38,38,0.25);
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
  fab.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="20" height="20">
      <rect x="4" y="10" width="2" height="4" rx="1" fill="currentColor" class="tts-bar tts-bar-1"/>
      <rect x="8" y="7" width="2" height="10" rx="1" fill="currentColor" class="tts-bar tts-bar-2"/>
      <rect x="12" y="4" width="2" height="16" rx="1" fill="currentColor" class="tts-bar tts-bar-3"/>
      <rect x="16" y="7" width="2" height="10" rx="1" fill="currentColor" class="tts-bar tts-bar-4"/>
      <rect x="20" y="10" width="2" height="4" rx="1" fill="currentColor" class="tts-bar tts-bar-5"/>
    </svg>`;
  document.body.appendChild(fab);

  // Player bar
  const player = document.createElement('div');
  player.id = 'tts-player';
  player.setAttribute('dir', isRtlLang(getLang()) ? 'rtl' : 'ltr');
  player.innerHTML = `
    <button class="tts-btn" id="tts-stop" title="${tr('tts.stop')}" disabled>
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
    </button>
    <button class="tts-btn" id="tts-play" title="${tr('tts.play')}">
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" class="tts-play-icon"><path d="M8 5.14v14l11-7-11-7z"/></svg>
    </button>
    <span class="tts-label">
      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style="vertical-align:-2px;margin-inline-end:4px;">
        <rect x="4" y="10" width="2" height="4" rx="1"/>
        <rect x="8" y="7" width="2" height="10" rx="1"/>
        <rect x="12" y="4" width="2" height="16" rx="1"/>
        <rect x="16" y="7" width="2" height="10" rx="1"/>
        <rect x="20" y="10" width="2" height="4" rx="1"/>
      </svg>
      ${tr('tts.label')}
    </span>
    <select id="tts-voice-select" title="${tr('tts.voice')}" style="
      font-size:11px; max-width:90px; border-radius:6px;
      border:1px solid var(--yuval-border,#e5e7eb);
      background:var(--yuval-bg-secondary,#f3f4f6);
      color:var(--yuval-text,#1a1a1a);
      padding:3px 4px; cursor:pointer;
    "></select>
    <button class="tts-btn" id="tts-speed" title="${tr('tts.speed')}">1×</button>
    <button class="tts-btn" id="tts-close" title="${tr('tts.close')}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="14" height="14"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>
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
