/**
 * Core Search Mode — mobile-only "tap the core" search affordance.
 *
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │ Responsibility (this module)                                   │
 *   │   • Mobile (≤1023px): wire the trigger button                  │
 *   │     (`[data-core-search-trigger]`) so a tap opens the glass    │
 *   │     input panel anchored over the core.                        │
 *   │   • Desktop (≥1024px): wire the existing header search input   │
 *   │     (`#yuval-header-search`) to the same query pipeline. The   │
 *   │     header input already lives in the global header — we add   │
 *   │     no new chrome on desktop, just behaviour.                  │
 *   │   • Build a search index over the live orbit (`.galaxy-card`): │
 *   │     title, subtitle, type label, lesson badge, series name,    │
 *   │     and slug. No separate data source — we read what SSR       │
 *   │     already rendered, so adding a station automatically adds   │
 *   │     a search target.                                           │
 *   │   • While typing, tag each card with                           │
 *   │       data-core-search-match="yes" | "no"                      │
 *   │     and (mobile only) reflect the panel state on the stage via │
 *   │       data-core-search-state="closed" | "open" | "no-matches"  │
 *   │     CSS owns every visual response (scale, glow, opacity).     │
 *   │   • Show a one-shot hint ("Tap the Core to search") on the     │
 *   │     first mobile visit; persistence via localStorage.          │
 *   │   • Honour prefers-reduced-motion (no scale changes, opacity   │
 *   │     and border emphasis only — driven from the CSS side).     │
 *   │                                                                │
 *   │ Out of scope: voice input, result lists. The orbit IS the      │
 *   │ result surface, per spec.                                      │
 *   └────────────────────────────────────────────────────────────────┘
 */
import { applyTranslations } from '../../i18n';

const MOBILE_MAX_WIDTH = 1023; // matches @media (max-width: 1023px)
const HINT_STORAGE_KEY = 'yuval_core_search_hint_seen';
const HINT_VISIBLE_MS = 3000;
/**
 * Diacritic-stripping normaliser. Lower-cases and removes Hebrew
 * niqqud + Latin combining marks so a search for "shavua" still finds
 * "שׁבוּעַ" (rare in this corpus but cheap to support). The Unicode
 * range covers Hebrew points (U+0591–U+05C7) plus the general combining
 * diacritical block (U+0300–U+036F).
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-֑ͯ-ׇ]/g, '')
    .trim();
}

type SearchEntry = {
  card: HTMLElement;
  haystack: string;
};

/**
 * Build the search index from every orbit station currently in the DOM.
 * Series members hidden by the hydrator (data-series-member) and series
 * capsules / other-knowledge cards are still included — the user might
 * legitimately search for a series by name.
 */
function buildIndex(stage: HTMLElement): SearchEntry[] {
  const cards = stage.querySelectorAll<HTMLElement>('[data-galaxy-card]');
  const out: SearchEntry[] = [];
  cards.forEach((card) => {
    const parts: string[] = [];
    const title = card.querySelector<HTMLElement>('.lc-title')?.textContent;
    const subtitle = card.querySelector<HTMLElement>('.lc-orbit-subtitle')?.textContent;
    const author = card.querySelector<HTMLElement>('.lc-orbit-author')?.textContent;
    const typeBadge = card.querySelector<HTMLElement>('.lc-orbit-typebadge')?.textContent;
    const count = card.querySelector<HTMLElement>('.lc-orbit-count')?.textContent;
    if (title)       parts.push(title);
    if (subtitle)    parts.push(subtitle);
    if (author)      parts.push(author);
    if (typeBadge)   parts.push(typeBadge);
    if (count)       parts.push(count);
    if (card.dataset.slug)       parts.push(card.dataset.slug);
    if (card.dataset.seriesName) parts.push(card.dataset.seriesName);
    if (card.dataset.kind)       parts.push(card.dataset.kind);
    out.push({ card, haystack: normalize(parts.join(' ')) });
  });
  return out;
}

/**
 * Apply the current query to the index. Empty query clears all match
 * markers (every card returns to its resting orbit state); non-empty
 * query stamps `data-core-search-match="yes"|"no"` on every station.
 * Returns the count of matched stations so the caller can switch the
 * stage into a `no-matches` state when zero.
 */
function applyQuery(index: SearchEntry[], query: string): number {
  const needle = normalize(query);
  if (!needle) {
    index.forEach(({ card }) => {
      delete card.dataset.coreSearchMatch;
    });
    return index.length;
  }
  let matched = 0;
  index.forEach(({ card, haystack }) => {
    const isMatch = haystack.includes(needle);
    card.dataset.coreSearchMatch = isMatch ? 'yes' : 'no';
    if (isMatch) matched += 1;
  });
  return matched;
}

/**
 * Initialise the mobile Core Search Mode against a single stage.
 * Safe to call on desktop — every interactive listener is gated on the
 * mobile media query at runtime via `matchMedia`, so resizing into and
 * out of the mobile range works without re-binding. The DOM nodes the
 * module relies on (trigger button, panel, input, hint) are rendered
 * unconditionally by index.astro and remain `display: none` on desktop
 * via CSS, so a stray desktop tap can't reach them either.
 */
export function initCoreSearch(stage: HTMLElement): void {
  // Avoid double-binding when astro:page-load re-runs the orchestrator
  // on a fresh stage element that already passed through here once.
  if (stage.dataset.coreSearchInit === 'true') return;

  const trigger = document.querySelector<HTMLButtonElement>('[data-core-search-trigger]');
  const panel = document.querySelector<HTMLElement>('[data-core-search-panel]');
  const input = document.querySelector<HTMLInputElement>('[data-core-search-input]');
  const clearBtn = document.querySelector<HTMLButtonElement>('[data-core-search-clear]');
  const closeBtn = document.querySelector<HTMLButtonElement>('[data-core-search-close]');
  const hint = document.querySelector<HTMLElement>('[data-core-search-hint]');
  // The desktop header search input — already rendered by Header.astro
  // when LibraryLayout sets `showSearch={true}`. We bind to it without
  // adding any new chrome, so the existing header search box becomes
  // the desktop equivalent of the mobile Core Search.
  const headerInput = document.getElementById('yuval-header-search') as HTMLInputElement | null;

  if (!trigger || !panel || !input || !clearBtn || !closeBtn) {
    // SSR didn't ship the markup (e.g. the file rendered without the
    // search chrome — older branch). Silently bail; the orbit stays
    // fully usable without search.
    return;
  }

  let index: SearchEntry[] = buildIndex(stage);
  stage.dataset.coreSearchState = 'closed';

  const isMobile = () => window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches;

  function refreshIndexIfStale(): void {
    // Cards can be re-rendered by the series hydrator between page
    // load and the user's first tap. A live count check is O(1) and
    // catches the common case (count changed) without a full rescan
    // on every keystroke.
    const liveCount = stage.querySelectorAll('[data-galaxy-card]').length;
    if (liveCount !== index.length) {
      index = buildIndex(stage);
    }
  }

  function open(): void {
    if (!isMobile()) return;
    if (stage.dataset.coreSearchState === 'open') return;
    refreshIndexIfStale();
    stage.dataset.coreSearchState = 'open';
    trigger!.setAttribute('aria-expanded', 'true');
    // Focus moves to the input after the next paint so the on-screen
    // keyboard appears in sync with the panel expansion animation.
    requestAnimationFrame(() => input!.focus());
    hideHint();
  }

  function close(): void {
    if (stage.dataset.coreSearchState === 'closed') return;
    stage.dataset.coreSearchState = 'closed';
    trigger!.setAttribute('aria-expanded', 'false');
    input!.value = '';
    applyQuery(index, '');
    updateClearButton();
    // Return focus to the trigger so keyboard users land on a known
    // anchor after dismissal.
    trigger!.focus();
  }

  function updateClearButton(): void {
    const hasText = input!.value.length > 0;
    clearBtn!.hidden = !hasText;
  }

  function onInput(): void {
    refreshIndexIfStale();
    const matched = applyQuery(index, input!.value);
    if (input!.value.trim().length > 0 && matched === 0) {
      stage.dataset.coreSearchState = 'no-matches';
    } else if (stage.dataset.coreSearchState === 'no-matches') {
      stage.dataset.coreSearchState = 'open';
    }
    updateClearButton();
  }

  function hideHint(): void {
    if (!hint) return;
    hint.dataset.coreSearchHintState = 'hidden';
    try {
      localStorage.setItem(HINT_STORAGE_KEY, '1');
    } catch {
      /* private mode / disabled storage — first-visit hint will just
         re-appear next load, no functional impact. */
    }
  }

  function showHintIfFirstVisit(): void {
    if (!hint) return;
    if (!isMobile()) return;
    let seen = '0';
    try { seen = localStorage.getItem(HINT_STORAGE_KEY) ?? '0'; } catch { /* noop */ }
    if (seen === '1') return;
    hint.dataset.coreSearchHintState = 'visible';
    window.setTimeout(hideHint, HINT_VISIBLE_MS);
  }

  // ── Bindings ──────────────────────────────────────────────────────
  trigger.addEventListener('click', () => {
    if (stage.dataset.coreSearchState === 'closed') open();
    else close();
  });

  input.addEventListener('input', onInput);

  clearBtn.addEventListener('click', () => {
    input.value = '';
    applyQuery(index, '');
    if (stage.dataset.coreSearchState === 'no-matches') {
      stage.dataset.coreSearchState = 'open';
    }
    updateClearButton();
    input.focus();
  });

  closeBtn.addEventListener('click', () => close());

  // Esc closes from anywhere when search mode is open. Keep the
  // listener document-scoped so it works regardless of whether the
  // input has focus (e.g. after a screen-reader navigates focus
  // somewhere else without closing the panel).
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (stage.dataset.coreSearchState === 'closed') return;
    e.preventDefault();
    close();
  });

  // Swipe-down to close — pointer-based so it works with touch + pen.
  // Only the panel itself listens, so dragging on a card never closes
  // search. A short downward swipe (>40px, vertical-dominant) commits.
  let swipe: { id: number; startY: number; startX: number } | null = null;
  panel.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return; // touch / pen only
    swipe = { id: e.pointerId, startY: e.clientY, startX: e.clientX };
  });
  panel.addEventListener('pointermove', (e) => {
    if (!swipe || e.pointerId !== swipe.id) return;
    const dy = e.clientY - swipe.startY;
    const dx = Math.abs(e.clientX - swipe.startX);
    if (dy > 40 && dy > dx * 1.5) {
      const id = swipe.id;
      swipe = null;
      try { panel.releasePointerCapture(id); } catch { /* noop */ }
      close();
    }
  });
  panel.addEventListener('pointerup',     () => { swipe = null; });
  panel.addEventListener('pointercancel', () => { swipe = null; });

  // ── Desktop header input ─────────────────────────────────────────
  // Same pipeline as the mobile panel: every keystroke runs applyQuery
  // against the live orbit and stamps `data-core-search-match` on each
  // station. We deliberately do NOT touch `data-core-search-state` —
  // that attribute drives the mobile panel/trigger visibility and has
  // no role on desktop. Esc empties the input (matching macOS/iOS
  // search-field convention) and restores the orbit.
  if (headerInput) {
    const onHeaderInput = (): void => {
      refreshIndexIfStale();
      applyQuery(index, headerInput.value);
    };
    headerInput.addEventListener('input', onHeaderInput);
    headerInput.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!headerInput.value) return;
      e.preventDefault();
      headerInput.value = '';
      applyQuery(index, '');
    });
    // Native <input type="search"> "X" clear button fires `search` (no
    // `input` event in some browsers when value is reset by the
    // built-in chrome). Cover both to be safe.
    headerInput.addEventListener('search', onHeaderInput);
  }

  // i18n is applied once on init (the labels also carry data-i18n* so
  // future language switches will retranslate them via applyTranslations
  // from layout-level page-load handlers).
  const lang = document.documentElement.lang || 'en';
  applyTranslations(document, lang);

  // One-shot hint after the orbit has settled. We defer past the
  // mobile auto-focus rAF in universe-layout so the hint floats above
  // a stable layout, not mid-animation.
  requestAnimationFrame(() => {
    requestAnimationFrame(showHintIfFirstVisit);
  });

  stage.dataset.coreSearchInit = 'true';
}
