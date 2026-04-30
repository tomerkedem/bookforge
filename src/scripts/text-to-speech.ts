import { t, type TranslationKey } from '../i18n';
import { mountTtsPanel, openTtsPanel, closeTtsPanel, mountMiniPlayer, unmountMiniPlayer } from './tts-panel';
import { icon } from './tts-icons';

// ═══════════════════════════════════════════════════════════════════════════
// Public types
// ═══════════════════════════════════════════════════════════════════════════

export type TtsStatus = 'idle' | 'playing' | 'paused';
export type TtsRate = 0.8 | 1 | 1.3;

export interface Sentence {
  paragraphIdx: number;  // index into paragraphs[]
  charStart: number;     // within paragraph text
  charEnd: number;
  text: string;
}

export interface TtsState {
  status: TtsStatus;
  paragraphIdx: number;
  sentenceIdx: number;    // global index into sentences[]
  wordCharOffset: number; // char offset within current paragraph
  totalSentences: number;
  rate: TtsRate;
  voiceName: string | null;
  progressPct: number;
  panelOpen: boolean;
  hasResumePoint: boolean;
  hasSelection: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// Store
// ═══════════════════════════════════════════════════════════════════════════

type Listener = (s: TtsState) => void;

const state: TtsState = {
  status: 'idle',
  paragraphIdx: 0,
  sentenceIdx: 0,
  wordCharOffset: 0,
  totalSentences: 0,
  rate: 1,
  voiceName: null,
  progressPct: 0,
  panelOpen: false,
  hasResumePoint: false,
  hasSelection: false,
};

const listeners = new Set<Listener>();

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  fn(state);
  return () => { listeners.delete(fn); };
}

export function getState(): Readonly<TtsState> {
  return state;
}

function notify(): void {
  listeners.forEach(fn => fn(state));
  // Back-compat event for ReadingControls / other subscribers
  document.dispatchEvent(new CustomEvent('tts:state', {
    detail: {
      playing: state.status === 'playing',
      paused: state.status === 'paused',
      status: state.status,
      progressPct: state.progressPct,
    },
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// Environment
// ═══════════════════════════════════════════════════════════════════════════

function getLang(): string {
  return new URLSearchParams(window.location.search).get('lang')
    || localStorage.getItem('yuval_language')
    || document.documentElement.lang
    || 'he';
}

function tr(key: TranslationKey): string {
  return t(key, getLang()) || key;
}

function chapterKey(): string {
  const slug = document.body.dataset.bookSlug || '';
  const ch = document.body.dataset.chapter || document.body.dataset.chapterNumber || '';
  return `yuval_tts_pos_${slug}_${ch}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Storage
// ═══════════════════════════════════════════════════════════════════════════

const VOICE_KEY = 'yuval_tts_voice';
const SPEED_KEY = 'yuval_tts_speed';

function loadVoiceName(): string | null {
  return localStorage.getItem(`${VOICE_KEY}_${getLang()}`);
}

function saveVoiceName(name: string): void {
  localStorage.setItem(`${VOICE_KEY}_${getLang()}`, name);
}

function loadRate(): TtsRate {
  const v = parseFloat(localStorage.getItem(SPEED_KEY) || '1');
  if (v === 0.8 || v === 1.3) return v;
  return 1;
}

function saveRate(r: TtsRate): void {
  localStorage.setItem(SPEED_KEY, String(r));
}

function loadLastPosition(): number {
  const v = parseInt(localStorage.getItem(chapterKey()) || '0', 10);
  return Number.isFinite(v) && v > 0 ? v : 0;
}

function saveLastPosition(sentenceIdx: number): void {
  if (sentenceIdx <= 0) {
    localStorage.removeItem(chapterKey());
  } else {
    localStorage.setItem(chapterKey(), String(sentenceIdx));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Content traversal
// ═══════════════════════════════════════════════════════════════════════════

let paragraphs: HTMLElement[] = [];
let paragraphTexts: string[] = [];           // normalized text per paragraph (what the engine actually speaks)
let sentences: Sentence[] = [];
let sentenceStartByParagraph: number[] = []; // sentences[sentenceStartByParagraph[p]] is the first sentence of paragraph p

/**
 * Normalize text before sending to the speech engine.
 * - Collapse all whitespace runs (incl. \n, \r, \t, NBSP) into single spaces.
 * - Remove zero-width characters that some voices stutter on.
 * - Trim.
 * Web Speech treats \n as a hard stop on most English engines → robotic gaps.
 */
function normalizeForSpeech(raw: string): string {
  return raw
    .replace(/[\u200B-\u200D\uFEFF]/g, '')  // zero-width
    .replace(/\u00A0/g, ' ')                 // NBSP → space
    .replace(/\s+/g, ' ')                    // collapse any whitespace run
    .trim();
}

function getContentContainer(): HTMLElement | null {
  // The page renders one .chapter-content per language; the wrapper
  // <div data-lang="..."> carries .visible on the active language only.
  // Older .chapter-content.visible selector never matched (the class is on
  // the wrapper, not the content itself) and fell back to the first
  // .chapter-content - which on LTR books was the English copy regardless
  // of the UI language.
  const lang = getLang();
  const active = document.querySelector<HTMLElement>(`[data-lang="${lang}"].visible .chapter-content`);
  if (active) return active;
  const visibleWrapper = document.querySelector<HTMLElement>('[data-lang].visible .chapter-content');
  if (visibleWrapper) return visibleWrapper;
  return document.querySelector<HTMLElement>('.chapter-content');
}

function collectParagraphs(): HTMLElement[] {
  const container = getContentContainer();
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>('p, h2, h3, li'))
    .filter(el => (el.textContent || '').trim().length > 0);
}

// Unicode-aware sentence splitter. Returns array of {start, end, text}.
// Handles . ! ? … and respects quotes/brackets following terminators.
function splitSentences(paragraphText: string): Array<{ start: number; end: number; text: string }> {
  const out: Array<{ start: number; end: number; text: string }> = [];
  const re = /[^.!?…]+[.!?…]+["')\]]*|[^.!?…]+$/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(paragraphText)) !== null) {
    const raw = m[0];
    const trimStart = raw.length - raw.trimStart().length;
    const trimEnd = raw.length - raw.trimEnd().length;
    const start = m.index + trimStart;
    const end = m.index + raw.length - trimEnd;
    const text = paragraphText.slice(start, end);
    if (text) out.push({ start, end, text });
  }
  if (!out.length && paragraphText.trim()) {
    out.push({ start: 0, end: paragraphText.length, text: paragraphText });
  }
  return out;
}

function buildIndex(): void {
  paragraphs = collectParagraphs();
  paragraphTexts = [];
  sentences = [];
  sentenceStartByParagraph = [];
  paragraphs.forEach((el, pIdx) => {
    sentenceStartByParagraph[pIdx] = sentences.length;
    const normalized = normalizeForSpeech(el.textContent || '');
    paragraphTexts[pIdx] = normalized;
    const parts = splitSentences(normalized);
    parts.forEach(p => {
      sentences.push({ paragraphIdx: pIdx, charStart: p.start, charEnd: p.end, text: p.text });
    });
  });
  state.totalSentences = sentences.length;
  state.hasResumePoint = loadLastPosition() > 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// Voice
// ═══════════════════════════════════════════════════════════════════════════

let selectedVoice: SpeechSynthesisVoice | null = null;

function langMatches(voiceLang: string): boolean {
  return voiceLang.toLowerCase().startsWith(getLang().toLowerCase());
}

export function getVoicesForLang(): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) return [];
  return window.speechSynthesis.getVoices().filter(v => langMatches(v.lang));
}

/**
 * Score a voice for quality. Higher is better.
 * Preference order:
 *   1. Cloud/network voices from major vendors (Google, Microsoft, Apple) - natural prosody.
 *   2. Voices explicitly marked "Natural", "Neural", "Online", "Enhanced", "Premium".
 *   3. Named flagship voices (Samantha, Karen, Daniel, Serena, Alex on Apple; Aria, Jenny, Guy on MS).
 *   4. Remote (non-localService) voices.
 *   5. Local SAPI / eSpeak fallbacks - last resort.
 * Localized (en-US / en-GB) preferred over generic "en".
 */
function scoreVoice(v: SpeechSynthesisVoice): number {
  const name = v.name.toLowerCase();
  const lang = v.lang.toLowerCase();
  let score = 0;

  // Vendor / quality keywords
  if (/\bgoogle\b/.test(name)) score += 100;
  if (/\bmicrosoft\b/.test(name)) score += 90;
  if (/\b(natural|neural|online|enhanced|premium|wavenet)\b/.test(name)) score += 80;
  if (/\b(siri|apple)\b/.test(name)) score += 60;

  // Flagship named voices
  if (/\b(samantha|karen|daniel|serena|alex|aria|jenny|guy|emma|ryan|libby|sonia|davis)\b/.test(name)) score += 40;

  // Prefer network (cloud) over local for English specifically - local SAPI is robotic
  if (!v.localService) score += 30;

  // Localized lang tag beats bare "en"
  if (lang.length > 2) score += 10;

  // eSpeak and known low-quality engines heavily penalized
  if (/\b(espeak|festival|pico)\b/.test(name)) score -= 200;

  return score;
}

function resolveVoice(): SpeechSynthesisVoice | null {
  const voices = getVoicesForLang();
  if (!voices.length) return null;
  const savedName = loadVoiceName();
  if (savedName) {
    const found = voices.find(v => v.name === savedName);
    if (found) return found;
  }
  const lang = getLang().toLowerCase();
  // For Hebrew and other languages where the OS voice IS the quality baseline,
  // prefer localService. For English, prefer high-quality cloud/neural voices.
  if (lang === 'en') {
    const ranked = [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a));
    return ranked[0] || null;
  }
  return voices.find(v => v.localService) || voices[0];
}

export function setVoice(name: string): void {
  const voices = getVoicesForLang();
  const v = voices.find(x => x.name === name);
  if (!v) return;
  selectedVoice = v;
  saveVoiceName(name);
  state.voiceName = name;
  notify();
}

export function previewVoice(name: string): void {
  if (!('speechSynthesis' in window)) return;
  const voices = getVoicesForLang();
  const v = voices.find(x => x.name === name);
  if (!v) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(tr('tts.preview'));
  u.voice = v;
  u.lang = v.lang;
  u.rate = state.rate;
  window.speechSynthesis.speak(u);
}

// ═══════════════════════════════════════════════════════════════════════════
// Highlighter (sentence ring + optional word underline)
// ═══════════════════════════════════════════════════════════════════════════

const SENTENCE_CLASS = 'tts-sentence-active';
const WORD_CLASS = 'tts-word';
const WORD_ACTIVE_CLASS = 'tts-word-active';

let highlightedParagraph: HTMLElement | null = null;
let originalParagraphHTML: string | null = null;
// Per-rendered-sentence word map: each entry = [absCharStart, absCharEnd) within paragraph text
let wordSpans: HTMLElement[] = [];
let wordRanges: Array<{ start: number; end: number }> = [];
let lastActiveWordIdx = -1;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function clearHighlight(): void {
  if (highlightedParagraph && originalParagraphHTML !== null) {
    highlightedParagraph.innerHTML = originalParagraphHTML;
  }
  highlightedParagraph = null;
  originalParagraphHTML = null;
  wordSpans = [];
  wordRanges = [];
  lastActiveWordIdx = -1;
}

function escapeHTML(s: string): string {
  return s.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c] as string);
}

/**
 * Build the inner HTML for a sentence, splitting it into word spans with
 * absolute char offsets (relative to the paragraph text) stored on each span.
 * Whitespace between words is kept outside the word spans so underline
 * styling only covers actual word glyphs.
 */
function buildSentenceHTML(sentence: string, sentenceStart: number): string {
  let html = '';
  const re = /\S+/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sentence)) !== null) {
    const wordStart = m.index;
    const wordEnd = m.index + m[0].length;
    if (wordStart > lastIdx) html += escapeHTML(sentence.slice(lastIdx, wordStart));
    const absStart = sentenceStart + wordStart;
    const absEnd = sentenceStart + wordEnd;
    html += `<span class="${WORD_CLASS}" data-ws="${absStart}" data-we="${absEnd}">${escapeHTML(m[0])}</span>`;
    lastIdx = wordEnd;
  }
  if (lastIdx < sentence.length) html += escapeHTML(sentence.slice(lastIdx));
  return html;
}

function renderParagraphHighlight(pIdx: number, sentenceInParagraph: Sentence, _wordCharOffset: number): void {
  const el = paragraphs[pIdx];
  if (!el) return;

  if (highlightedParagraph !== el) {
    clearHighlight();
    highlightedParagraph = el;
    originalParagraphHTML = el.innerHTML;
  }

  // Re-read the element's current (pre-highlight) text via the normalized cache.
  // The sentence offsets were computed against paragraphTexts[pIdx], so splicing
  // must happen against the same string - NOT against el.textContent, which may
  // already contain a sibling highlight's spans or the original raw whitespace.
  const fullText = paragraphTexts[pIdx] || '';
  const { charStart, charEnd } = sentenceInParagraph;
  const before = fullText.slice(0, charStart);
  const sentence = fullText.slice(charStart, charEnd);
  const after = fullText.slice(charEnd);

  const sentenceInner = buildSentenceHTML(sentence, charStart);
  const sentenceHTML = `<span class="${SENTENCE_CLASS}">${sentenceInner}</span>`;
  el.innerHTML = escapeHTML(before) + sentenceHTML + escapeHTML(after);

  // Cache word spans + their paragraph-absolute char ranges for onboundary lookup
  wordSpans = Array.from(el.querySelectorAll<HTMLElement>(`.${WORD_CLASS}`));
  wordRanges = wordSpans.map(sp => ({
    start: parseInt(sp.dataset.ws || '0', 10),
    end: parseInt(sp.dataset.we || '0', 10),
  }));
  lastActiveWordIdx = -1;

  // Auto-scroll the active sentence into view
  const active = el.querySelector<HTMLElement>(`.${SENTENCE_CLASS}`);
  if (active) {
    active.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'center',
    });
  }
}

/**
 * Highlight the word at absChar (paragraph-absolute char index). No-op if
 * absChar falls outside any rendered word span (e.g. on punctuation or
 * whitespace between words).
 */
function highlightWordAt(absChar: number): void {
  if (!wordSpans.length) return;
  // Binary search for the word whose range contains absChar
  let lo = 0, hi = wordRanges.length - 1, found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const r = wordRanges[mid];
    if (absChar < r.start) hi = mid - 1;
    else if (absChar >= r.end) lo = mid + 1;
    else { found = mid; break; }
  }
  if (found < 0) {
    // absChar hit a gap (space/punct). Snap forward to the next word ≥ absChar.
    for (let i = 0; i < wordRanges.length; i++) {
      if (wordRanges[i].start >= absChar) { found = i; break; }
    }
  }
  if (found < 0 || found === lastActiveWordIdx) return;
  if (lastActiveWordIdx >= 0 && wordSpans[lastActiveWordIdx]) {
    wordSpans[lastActiveWordIdx].classList.remove(WORD_ACTIVE_CLASS);
  }
  wordSpans[found].classList.add(WORD_ACTIVE_CLASS);
  lastActiveWordIdx = found;
}

// ═══════════════════════════════════════════════════════════════════════════
// Speech engine
// ═══════════════════════════════════════════════════════════════════════════

let currentUtterance: SpeechSynthesisUtterance | null = null;

function sentenceForParagraphBoundary(pIdx: number, charIdx: number): { sentenceIdxGlobal: number; sentence: Sentence } | null {
  const startSIdx = sentenceStartByParagraph[pIdx];
  if (startSIdx === undefined) return null;
  const endSIdx = pIdx + 1 < sentenceStartByParagraph.length
    ? sentenceStartByParagraph[pIdx + 1]
    : sentences.length;
  for (let i = startSIdx; i < endSIdx; i++) {
    const s = sentences[i];
    if (charIdx >= s.charStart && charIdx < s.charEnd) {
      return { sentenceIdxGlobal: i, sentence: s };
    }
  }
  // Default to last sentence of paragraph
  const last = Math.max(startSIdx, endSIdx - 1);
  return { sentenceIdxGlobal: last, sentence: sentences[last] };
}

function speakParagraph(pIdx: number, startCharOffset = 0): void {
  if (pIdx >= paragraphs.length) {
    stop();
    return;
  }
  const fullText = paragraphTexts[pIdx] || '';
  const text = fullText.slice(startCharOffset);
  if (!text.trim()) {
    speakParagraph(pIdx + 1, 0);
    return;
  }

  const u = new SpeechSynthesisUtterance(text);
  u.rate = state.rate;
  u.pitch = 1;
  u.volume = 1;
  if (selectedVoice) {
    u.voice = selectedVoice;
    u.lang = selectedVoice.lang;
  } else {
    u.lang = getLang();
  }

  // Sentence-boundary-only DOM updates. Word-level innerHTML rewrites caused
  // engine stutter on English cloud voices. We still receive 'word' events
  // (used for progress math + optional underline) but only rewrite the
  // paragraph DOM when the active sentence actually changes, and we do it
  // inside rAF to never block the audio thread.
  let lastSentenceIdxInParagraph = -1;
  let sentenceRafPending = false;
  let wordRafPending = false;
  let pendingWordAbsChar = -1;

  u.onboundary = (ev: SpeechSynthesisEvent) => {
    if (state.status !== 'playing') return;
    // Fire a lightweight event on every word boundary so UI surfaces (like
    // the mini-player's equalizer) can react to real speech rhythm rather
    // than looping a decorative animation.
    if (ev.name === 'word') {
      const len = (ev as SpeechSynthesisEvent & { charLength?: number }).charLength ?? 0;
      document.dispatchEvent(new CustomEvent('tts:word', { detail: { length: len } }));
    }
    const absChar = startCharOffset + ev.charIndex;
    const hit = sentenceForParagraphBoundary(pIdx, absChar);
    if (!hit) return;

    const prevSentence = state.sentenceIdx;
    state.sentenceIdx = hit.sentenceIdxGlobal;
    state.paragraphIdx = pIdx;
    state.wordCharOffset = absChar - hit.sentence.charStart;
    state.progressPct = state.totalSentences ? state.sentenceIdx / state.totalSentences : 0;

    const sentenceChanged = hit.sentenceIdxGlobal !== lastSentenceIdxInParagraph;
    if (sentenceChanged) {
      lastSentenceIdxInParagraph = hit.sentenceIdxGlobal;
      if (!sentenceRafPending) {
        sentenceRafPending = true;
        requestAnimationFrame(() => {
          sentenceRafPending = false;
          if (state.status === 'playing') {
            renderParagraphHighlight(pIdx, hit.sentence, 0);
            // After re-render, apply current word highlight immediately so the
            // underline never lags a beat behind the sentence.
            if (pendingWordAbsChar >= 0) highlightWordAt(pendingWordAbsChar);
          }
        });
      }
      if (prevSentence !== state.sentenceIdx) {
        saveLastPosition(state.sentenceIdx);
      }
    }

    // Word-level running underline. Class-only toggle (no innerHTML rewrite),
    // rAF-throttled so rapid word events don't thrash layout.
    pendingWordAbsChar = absChar;
    if (!wordRafPending) {
      wordRafPending = true;
      requestAnimationFrame(() => {
        wordRafPending = false;
        if (state.status === 'playing' && !sentenceRafPending) {
          highlightWordAt(pendingWordAbsChar);
        }
      });
    }
    notify();
  };

  u.onend = () => {
    if (state.status !== 'playing') return;
    speakParagraph(pIdx + 1, 0);
  };

  u.onerror = () => {
    if (state.status !== 'playing') return;
    speakParagraph(pIdx + 1, 0);
  };

  currentUtterance = u;

  // Paint the first sentence of this paragraph immediately (before onboundary fires)
  const firstHit = sentenceForParagraphBoundary(pIdx, startCharOffset);
  if (firstHit) {
    state.sentenceIdx = firstHit.sentenceIdxGlobal;
    state.paragraphIdx = pIdx;
    state.wordCharOffset = 0;
    state.progressPct = state.totalSentences ? state.sentenceIdx / state.totalSentences : 0;
    lastSentenceIdxInParagraph = firstHit.sentenceIdxGlobal;
    renderParagraphHighlight(pIdx, firstHit.sentence, 0);
    notify();
  }

  window.speechSynthesis.speak(u);
}

// ═══════════════════════════════════════════════════════════════════════════
// Public controls
// ═══════════════════════════════════════════════════════════════════════════

let pendingStartRange: Range | null = null;

function captureSelection(): void {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0 && sel.toString().trim().length > 0) {
    pendingStartRange = sel.getRangeAt(0).cloneRange();
    state.hasSelection = true;
  } else {
    state.hasSelection = false;
  }
}

function findSentenceForRange(range: Range): number {
  let node: Node | null = range.startContainer;
  while (node && node.nodeType !== 1) node = node.parentNode;
  let el = node as HTMLElement | null;
  while (el && !paragraphs.includes(el)) el = el.parentElement;
  if (!el) return 0;
  const pIdx = paragraphs.indexOf(el);
  if (pIdx < 0) return 0;
  // Compute char offset from start of paragraph to range.startContainer/startOffset
  const textOffset = computeCharOffset(el, range.startContainer, range.startOffset);
  const hit = sentenceForParagraphBoundary(pIdx, textOffset);
  return hit ? hit.sentenceIdxGlobal : sentenceStartByParagraph[pIdx] || 0;
}

function computeCharOffset(root: HTMLElement, target: Node, targetOffset: number): number {
  let offset = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = walker.nextNode())) {
    if (n === target) return offset + targetOffset;
    offset += (n.textContent || '').length;
  }
  return 0;
}

export function play(opts?: { fromSentence?: number }): void {
  if (!('speechSynthesis' in window)) return;
  buildIndex();
  if (!sentences.length) return;

  // Resume after pause: speechSynthesis.resume() is unreliable on Chrome
  // desktop — the audio often stays silent after pause/resume. Instead
  // we cancel and restart from the sentence we were on. The cost is a
  // single repeated sentence; the gain is that pause → play actually
  // continues reading on every browser we support.
  if (state.status === 'paused' && opts?.fromSentence === undefined) {
    const sIdx = state.sentenceIdx;
    window.speechSynthesis.cancel();
    state.status = 'idle';
    play({ fromSentence: sIdx });
    return;
  }

  let startSentence = 0;
  if (opts?.fromSentence !== undefined) {
    startSentence = opts.fromSentence;
  } else if (pendingStartRange) {
    startSentence = findSentenceForRange(pendingStartRange);
    pendingStartRange = null;
    state.hasSelection = false;
  }

  state.sentenceIdx = Math.max(0, Math.min(startSentence, sentences.length - 1));
  const s = sentences[state.sentenceIdx];
  state.paragraphIdx = s.paragraphIdx;
  state.status = 'playing';
  window.speechSynthesis.cancel();

  const pStart = sentenceStartByParagraph[s.paragraphIdx];
  const startCharOffset = state.sentenceIdx === pStart ? 0 : s.charStart;
  speakParagraph(s.paragraphIdx, startCharOffset);
}

export function pause(): void {
  if (state.status !== 'playing') return;
  window.speechSynthesis.pause();
  state.status = 'paused';
  notify();
}

export function stop(): void {
  window.speechSynthesis.cancel();
  state.status = 'idle';
  state.paragraphIdx = 0;
  state.sentenceIdx = 0;
  state.wordCharOffset = 0;
  state.progressPct = 0;
  currentUtterance = null;
  clearHighlight();
  saveLastPosition(0);
  state.hasResumePoint = false;
  notify();
}

export function resume(): void {
  const pos = loadLastPosition();
  if (pos > 0) play({ fromSentence: pos });
  else play();
}

export function setRate(r: TtsRate): void {
  state.rate = r;
  saveRate(r);
  notify();
  if (state.status === 'playing' && currentUtterance) {
    // Applying rate mid-utterance requires restart for most engines
    const sIdx = state.sentenceIdx;
    window.speechSynthesis.cancel();
    state.status = 'idle';
    play({ fromSentence: sIdx });
  }
}

export function openPanel(): void {
  captureSelection();
  state.panelOpen = true;
  notify();
  openTtsPanel();
}

export function closePanel(): void {
  state.panelOpen = false;
  notify();
  closeTtsPanel();
}

export function togglePanel(): void {
  if (state.panelOpen) closePanel();
  else openPanel();
}

// ═══════════════════════════════════════════════════════════════════════════
// Back-compat public API
// ═══════════════════════════════════════════════════════════════════════════

export function toggleTextToSpeech(): void {
  if (!('speechSynthesis' in window)) return;
  if (state.status === 'playing') pause();
  else if (state.status === 'paused') play();
  else togglePanel();
}

export function getTextToSpeechState(): { playing: boolean; paused: boolean } {
  return {
    playing: state.status === 'playing',
    paused: state.status === 'paused',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// FAB widget (#tts-fab)
// ═══════════════════════════════════════════════════════════════════════════

function buildFab(): HTMLButtonElement {
  const existing = document.getElementById('tts-fab');
  if (existing) existing.remove();
  const btn = document.createElement('button');
  btn.id = 'tts-fab';
  btn.type = 'button';
  btn.setAttribute('aria-label', tr('tts.panelTitle'));
  btn.setAttribute('aria-pressed', 'false');
  btn.setAttribute('aria-haspopup', 'dialog');
  btn.title = tr('tts.panelTitle');
  btn.innerHTML = icon('speaker', 22);
  document.body.appendChild(btn);
  return btn;
}

function syncFabState(btn: HTMLButtonElement): void {
  let iconName: 'speaker' | 'play' | 'pause';
  let label: string;
  if (state.status === 'playing') {
    iconName = 'pause';
    label = tr('tts.pause');
    btn.classList.add('is-active');
  } else if (state.status === 'paused') {
    iconName = 'play';
    label = tr('tts.play');
    btn.classList.add('is-active');
  } else {
    iconName = 'speaker';
    label = tr('tts.panelTitle');
    btn.classList.remove('is-active');
  }
  btn.innerHTML = icon(iconName, 22);
  btn.setAttribute('aria-pressed', state.status === 'playing' ? 'true' : 'false');
  btn.setAttribute('aria-label', label);
  btn.title = label;
}

// Sync the inline pill button on the book landing page. Keeps the caller's
// <span class="tts-inline-label"> intact so translated text isn't clobbered;
// only the icon slot and state classes change.
function syncInlineState(btn: HTMLElement): void {
  let iconName: 'speaker' | 'play' | 'pause';
  if (state.status === 'playing') {
    iconName = 'pause';
    btn.classList.add('is-active');
  } else if (state.status === 'paused') {
    iconName = 'play';
    btn.classList.add('is-active');
  } else {
    iconName = 'speaker';
    btn.classList.remove('is-active');
  }
  const iconSlot = btn.querySelector('.tts-inline-icon');
  if (iconSlot) iconSlot.innerHTML = icon(iconName, 18);
  btn.setAttribute('aria-pressed', state.status === 'playing' ? 'true' : 'false');
}

// ═══════════════════════════════════════════════════════════════════════════
// Init
// ═══════════════════════════════════════════════════════════════════════════

export interface TtsInitOptions {
  /** 'fab' = floating action button (reading view). 'inline' = bind to a
   *  supplied pill button (book landing page — next to the title).    */
  trigger?: 'fab' | 'inline';
  /** Required when trigger === 'inline'. The button to bind clicks to. */
  inlineEl?: HTMLElement | null;
}

export function initTextToSpeech(signal: AbortSignal, opts: TtsInitOptions = {}): void {
  if (!('speechSynthesis' in window)) return;

  const mode = opts.trigger ?? 'fab';
  const inlineEl = mode === 'inline' ? opts.inlineEl ?? null : null;
  // If inline mode was requested but no element is present in the DOM,
  // bail silently — there's nothing to wire the click to. This keeps the
  // book landing page from falling back to creating a stray FAB.
  if (mode === 'inline' && !inlineEl) return;

  state.rate = loadRate();
  state.hasResumePoint = loadLastPosition() > 0;

  const loadAndPickVoice = () => {
    selectedVoice = resolveVoice();
    state.voiceName = selectedVoice?.name || null;
    notify();
  };

  if (window.speechSynthesis.getVoices().length === 0) {
    const handler = () => loadAndPickVoice();
    window.speechSynthesis.addEventListener('voiceschanged', handler, { once: true });
    signal.addEventListener('abort', () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
    });
  } else {
    loadAndPickVoice();
  }

  // Expose globals for ReadingControls / external callers
  (window as unknown as { __ttsToggle?: () => void }).__ttsToggle = toggleTextToSpeech;
  (window as unknown as { __ttsState?: () => unknown }).__ttsState = getTextToSpeechState;
  (window as unknown as { __ttsOpenPanel?: () => void }).__ttsOpenPanel = openPanel;

  // Trigger — FAB (reading) or inline pill (landing page).
  const trigger: HTMLElement = mode === 'inline' ? inlineEl! : buildFab();
  const syncTriggerState = mode === 'inline'
    ? () => syncInlineState(trigger)
    : () => syncFabState(trigger as HTMLButtonElement);

  // Tell CSS which layout we're in. The panel defaults to a popover
  // anchored to the (absent) FAB corner on desktop — in 'inline' mode
  // we want a bottom-sheet instead so it's actually visible next to the
  // mini-player that triggered it.
  if (mode === 'inline') {
    document.documentElement.dataset.ttsMode = 'inline';
  }

  syncTriggerState();
  trigger.addEventListener('click', () => {
    // Unified bar: no separate settings panel — first click starts playback,
    // subsequent clicks toggle pause/resume. Speed + voice live inside the
    // mini-player itself.
    if (state.status === 'idle') {
      play();
      return;
    }
    if (state.status === 'playing') pause();
    else play();
  }, { signal });

  // Double-click-to-jump: while TTS is playing or paused, a dblclick on
  // any word inside the reading content restarts playback from that
  // sentence. Audiobook apps do this as a "tap-to-read-from-here"
  // affordance; skipped entirely when idle so the browser's native
  // word-selection for copy/highlight is preserved.
  const onDblClick = (e: MouseEvent) => {
    if (state.status !== 'playing' && state.status !== 'paused') return;
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const container = getContentContainer();
    if (!container || !container.contains(target)) return;

    // paragraphs[] is populated by buildIndex() in play(); if we're in
    // playing/paused we know it's already built, but rebuild defensively
    // in case the DOM was swapped (e.g. language switch mid-playback).
    if (!paragraphs.length) buildIndex();
    if (!paragraphs.length) return;

    let el: HTMLElement | null = target;
    while (el && !paragraphs.includes(el)) el = el.parentElement;
    if (!el) return;
    const pIdx = paragraphs.indexOf(el);
    if (pIdx < 0) return;

    // Prefer caretRangeFromPoint for pixel-accurate placement; fall back
    // to the auto-selection the browser made on dblclick.
    type CaretRangeFn = (x: number, y: number) => Range | null;
    const caretFn = (document as unknown as { caretRangeFromPoint?: CaretRangeFn }).caretRangeFromPoint;
    let charOffset: number | null = null;
    const caretRange = typeof caretFn === 'function' ? caretFn.call(document, e.clientX, e.clientY) : null;
    if (caretRange?.startContainer) {
      charOffset = computeCharOffset(el, caretRange.startContainer, caretRange.startOffset);
    } else {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        charOffset = computeCharOffset(el, range.startContainer, range.startOffset);
      }
    }
    if (charOffset == null) return;

    const hit = sentenceForParagraphBoundary(pIdx, charOffset);
    if (!hit) return;

    e.preventDefault();
    window.getSelection()?.removeAllRanges();
    play({ fromSentence: hit.sentenceIdxGlobal });
  };
  document.addEventListener('dblclick', onDblClick, { signal });

  // Panel + mini-player are mounted lazily on first open/play
  mountTtsPanel();

  // Subscribe trigger + mini to state
  const unsubscribeTrigger = subscribe(syncTriggerState);
  const unsubscribeMini = subscribe(s => {
    if (s.status === 'idle') unmountMiniPlayer();
    else mountMiniPlayer();
  });

  signal.addEventListener('abort', () => {
    stop();
    unsubscribeTrigger();
    unsubscribeMini();
    closePanel();
    unmountMiniPlayer();
    // Only the FAB is owned by this module — the inline button belongs
    // to the page template and must stay in the DOM.
    if (mode === 'fab') document.getElementById('tts-fab')?.remove();
    else {
      trigger.classList.remove('is-active');
      trigger.setAttribute('aria-pressed', 'false');
      delete document.documentElement.dataset.ttsMode;
    }
    delete (window as unknown as { __ttsToggle?: () => void }).__ttsToggle;
    delete (window as unknown as { __ttsState?: () => unknown }).__ttsState;
    delete (window as unknown as { __ttsOpenPanel?: () => void }).__ttsOpenPanel;
  });
}
