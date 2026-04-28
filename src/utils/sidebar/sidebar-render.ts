/**
 * DOM rendering for the unified sidebar.
 *
 * Three concerns live here:
 *   1. Vertical thread gradient — the colored rail that runs through
 *      all chapter nodes, segmented by chapter completion state.
 *   2. Chapter visual state — applying the .usb-chapter-completed
 *      class, refreshing per-chapter time text, header counters.
 *   3. Section list rendering — per-chapter, supporting both active
 *      (read from live DOM) and non-active (read from prefetch
 *      cache) chapters.
 *
 * Render functions never persist anything; they read from cache /
 * storage modules and write to the DOM.
 */

import {
  getCurrentLang,
  getCurrentChapterId,
  getBookSlug,
  chapterContentUrl,
  getVisibleContentDiv,
} from './sidebar-helpers';
import {
  getCompletedChapters,
  getChapterScrollPercent,
  getReadSections,
  setReadSections,
} from './sidebar-storage';
import {
  computeTimeRemaining,
  formatTimeRemaining,
  formatChapterTime,
  distributeChapterMinutesFromData,
} from './sidebar-time';
import { loadChapterSections, invalidateChapterCache, isCached, type SectionPreview } from './sidebar-cache';
import {
  setupOutlineScrollSpy,
  registerOutlineEntry,
  clearOutlineRegistry,
  setActiveOutlineItem,
} from './sidebar-outline';
import { navigateTo } from './sidebar-dispatcher';
import {
  ensureChapterTubes,
  setActiveTube,
  tubes as particleTubes,
} from './sidebar-particle-tube';
import { NeuronBar } from './sidebar-neuron-bar';
import { renderActiveChapterPipe, removeChapterPipe } from './sidebar-pipe';

/* Single instance per page. Lazily created the first time
   syncChapterStates runs after the canvas is in the DOM. View
   transitions persist the sidebar via transition:persist, so the
   canvas (and this instance) survive content swaps. */
let neuronBar: NeuronBar | null = null;

/** Pick the inline-end content-hint glyph for a section row.
 *
 *  - Code previews → `{}` (universal, monospace-friendly, instantly
 *    reads as "code lives here").
 *  - Non-empty prose → `¶` (paragraph mark — quietly classical).
 *  - No preview / empty prose → null (omit the hint altogether so an
 *    empty section doesn't get a misleading marker).
 *
 *  Unicode glyphs over emoji on purpose: emoji renders inconsistently
 *  across iOS / Android / Windows; these glyphs are baked into every
 *  monospace font and render identically everywhere. */
function pickHintGlyph(preview: SectionPreview | undefined): string | null {
  if (!preview) return null;
  if (preview.type === 'code') return '{}';
  if (preview.type === 'text' && preview.sentence.trim() !== '') return '¶';
  return null;
}

/** Build the preview pane DOM for a section. The pane's outer
 *  `data-preview-type` attribute lets CSS pick a direction
 *  (LTR for code, RTL for prose) and apply different chrome.
 *
 *  For `code` previews, the inner HTML is already escaped + hljs-
 *  highlighted at build time (see preview-extractor + [chapter].astro);
 *  setting it via `innerHTML` is safe because every `<` / `>` / `&` /
 *  `"` in the original source is entity-encoded and the only `<` /
 *  `>` characters left are the ones wrapping `<span class="hljs-…">`.
 *
 *  For `text` previews, we use `textContent` so any leftover entities
 *  render as plain characters (no XSS surface). */
function buildPreviewPane(preview: SectionPreview): HTMLElement {
  const pane = document.createElement('div');
  pane.className = 'usb-section-preview';
  pane.setAttribute('data-preview-type', preview.type);

  if (preview.type === 'code') {
    const pre = document.createElement('pre');
    pre.className = 'usb-preview-code';
    pre.setAttribute('data-language', preview.language);
    pre.dir = 'ltr';
    const code = document.createElement('code');
    code.className = `hljs language-${preview.language}`;
    code.innerHTML = preview.html;
    pre.appendChild(code);
    pane.appendChild(pre);
  } else {
    const p = document.createElement('p');
    p.className = 'usb-preview-text';
    p.textContent = preview.sentence;
    pane.appendChild(p);
  }

  return pane;
}

function getOrCreateNeuronBar(initialPct: number): NeuronBar | null {
  if (neuronBar) return neuronBar;
  const canvas = document.getElementById('usb-progress-canvas');
  if (!(canvas instanceof HTMLCanvasElement)) return null;
  neuronBar = new NeuronBar(canvas, initialPct);
  return neuronBar;
}

/**
 * Reset the vertical thread to its single uniform color.
 *
 * Earlier this function painted a per-chapter gradient (green for
 * completed, red for active, peach for in-progress, gray otherwise).
 * Per design feedback the thread should be one solid color along its
 * entire length, varying ONLY between day and night mode — not by
 * chapter state. We leave the function as a no-op-style reset so all
 * existing call sites still work; visual color comes from the CSS
 * rule `.usb-thread { background: var(--usb-thread-inactive); }`,
 * whose variable is defined per theme in chapter-sidebar.css.
 */
export function renderThreadGradient(): void {
  const thread = document.querySelector<HTMLElement>('.usb-thread');
  if (!thread) return;
  /* Clear any previously-set inline gradient so the static CSS var
     takes over. Setting to '' (empty string) removes the property. */
  thread.style.background = '';
}

/**
 * Walk all chapter rows and apply the .usb-chapter-completed class
 * + per-chapter time text. Also refreshes the sidebar header
 * counters (X/Y completed, overall percentage, time remaining).
 *
 * Called on init, on completion-state changes, on language changes
 * (per-chapter time depends on WPM), and on manual reset.
 */
export function syncChapterStates(): void {
  const book = getBookSlug();
  const completed = new Set(getCompletedChapters(book));
  const activeId = String(getCurrentChapterId() || '');
  let doneCount = 0;

  /* Ensure each row has its particle-tube canvas + ParticleTube
     instance before we start pushing pcts into them. Idempotent —
     no-op for rows that already have a tube. */
  ensureChapterTubes(activeId || null);

  document.querySelectorAll<HTMLElement>('.usb-chapter[data-chapter-id]').forEach(li => {
    const id = li.dataset.chapterId || '';
    const isComplete = completed.has(id);

    li.classList.toggle('usb-chapter-completed', isComplete);
    if (isComplete) doneCount++;

    /* Per-chapter scroll progress is rendered by the particle tube.
       Completed chapters: full ring + green palette; in-progress:
       partial ring + orange palette. */
    const stored = getChapterScrollPercent(book, id);
    const pct = isComplete ? 100 : stored;

    /* In-progress = the chapter has scroll progress but isn't done.
       Drives a tinted badge background in the CSS so the disc reads
       as "active" against a white sidebar surface (the orange arc
       alone is too thin to carry the visual weight). */
    li.classList.toggle(
      'usb-chapter-in-progress',
      !isComplete && stored > 0.5,
    );

    const timeEl = li.querySelector<HTMLElement>('.usb-card-time');
    if (timeEl) {
      const words = parseInt(timeEl.dataset.wordCount || '0', 10) || 0;
      timeEl.textContent = formatChapterTime(words);
    }

    const tube = particleTubes.get(id);
    if (tube) {
      tube.setCompleted(isComplete);
      tube.setPct(pct);
    }
  });

  const total = document.querySelectorAll('.usb-chapter').length;
  const doneEl = document.getElementById('usb-completion-done');
  const pctEl = document.getElementById('usb-progress-percent');
  const timeEl = document.getElementById('usb-time-remaining');

  if (doneEl) doneEl.textContent = String(doneCount);
  const overallPct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const bar = getOrCreateNeuronBar(overallPct);
  if (bar) bar.setPct(overallPct);
  if (pctEl) pctEl.textContent = `${overallPct}%`;
  if (timeEl) timeEl.textContent = formatTimeRemaining(computeTimeRemaining());

  renderThreadGradient();
}

/**
 * Render the section list inside a specific chapter's `<li>`.
 * Handles both flavors:
 *   - active chapter: data read from live DOM, scroll-spy wired up
 *   - non-active chapter: data fetched + parsed via cache module,
 *     no scroll-spy (would be confusing — those headings live in a
 *     parsed-but-detached document we don't keep around)
 *
 * Click handlers on section links also branch:
 *   - active chapter: scroll-into-view on the live page
 *   - non-active: navigate to the chapter, then scroll once landed
 */
export async function renderChapterSections(chapterId: string | number): Promise<void> {
  const id = String(chapterId);
  const li = document.querySelector<HTMLElement>(`.usb-chapter[data-chapter-id="${id}"]`);
  if (!li) return;

  /* Find or create the sections container. */
  let container = li.querySelector<HTMLElement>('.usb-sections');
  if (!container) {
    container = document.createElement('div');
    container.className = 'usb-sections';
    const ulEl = document.createElement('ul');
    container.appendChild(ulEl);
    li.appendChild(container);
  }
  /* Tag the active chapter's container with id="usb-sections" for
     backward-compat with code that grabs it by id. */
  if (id === String(getCurrentChapterId())) {
    container.id = 'usb-sections';
  } else {
    container.removeAttribute('id');
  }

  const ul = container.querySelector('ul')!;
  const isActive = li.classList.contains('usb-chapter-active');

  /* Loading placeholder for non-cached non-active chapters. The
     active chapter is always treated as instant (we read live DOM). */
  if (!isCached(id) && !isActive) {
    ul.innerHTML = '';
    container.querySelectorAll('.usb-sections-loading').forEach(el => el.remove());
    const loading = document.createElement('div');
    loading.className = 'usb-sections-loading';
    const lang = getCurrentLang();
    loading.textContent = lang === 'he' ? 'טוען...' : 'Loading...';
    container.appendChild(loading);
  }

  const data = await loadChapterSections(id);
  container.querySelectorAll('.usb-sections-loading').forEach(el => el.remove());

  ul.innerHTML = '';
  if (isActive) clearOutlineRegistry();

  const headings = data.headings;
  if (headings.length === 0) {
    const empty = document.createElement('li');
    empty.style.color = 'var(--yuval-text-muted, #6b7280)';
    empty.style.fontSize = '11px';
    empty.style.padding = '6px 10px';
    const lang = getCurrentLang();
    empty.textContent = lang === 'he' ? 'אין סעיפים' : 'No sections';
    ul.appendChild(empty);
    if (isActive) setupOutlineScrollSpy([]);
    /* Empty chapter: no rows means nothing for the pipe to feed.
       Remove any leftover overlay from a prior render. */
    removeChapterPipe(container);
    return;
  }

  /* Hierarchical numbering WITHIN the chapter: H2s sequential (1,
     2, 3 …), H3s as h2.h3 (e.g. 3rd H2's 2nd H3 → "3.2"). The
     chapter number itself is NOT prefixed — readers already know
     which chapter they're on from the chapter card above, and the
     prefix only added visual noise. */
  let h2Counter = 0;
  let h3Counter = 0;

  /* Pre-load the persisted "read sections" for this chapter so we
     can stamp .section-completed on each <li> as we create it. This
     covers both flavors: clicking the active chapter's caret expands
     a section list that should immediately show ✓s for what was
     already read (without waiting for setupOutlineScrollSpy's
     hydration), and clicking a NON-active chapter's caret expands a
     section list with no scroll-spy at all — read marks would never
     appear without this pass.

     Edge case: if the chapter is already marked complete, treat
     EVERY heading as read (even ones not in the persisted set).
     Scroll-spy never marks the trailing heading on its own — there's
     nothing after it to advance to — so a chapter completed before
     the trailing-mark fix shipped will have a partial set in
     storage. We backfill here AND write the full set back so the
     storage reflects reality going forward. */
  const bookSlug = getBookSlug();
  const chapterAlreadyComplete = bookSlug
    ? getCompletedChapters(bookSlug).includes(String(id))
    : false;
  const persistedReadSections = bookSlug
    ? new Set(getReadSections(bookSlug, id))
    : new Set<string>();
  if (chapterAlreadyComplete) {
    let added = false;
    for (const h of headings) {
      if (!persistedReadSections.has(h.id)) {
        persistedReadSections.add(h.id);
        added = true;
      }
    }
    if (added && bookSlug) {
      setReadSections(bookSlug, id, persistedReadSections);
    }
  }

  /* Section minutes — distributed proportionally so the sum equals
     the chapter card's reading time. Falls back to direct estimate
     if chapter words are missing from cache. */
  const sectionMinutes = distributeChapterMinutesFromData(
    headings.map(h => h.chars),
    data.chapterWords || (li.dataset.wordCount ? parseInt(li.dataset.wordCount, 10) : 0),
  );

  /* For active chapter, we also need to ensure live h2/h3 elements
     have the same ids we put in the section list — otherwise anchor
     links + scroll-spy won't match. */
  let liveHeadings: HTMLElement[] = [];
  if (isActive) {
    const liveContent = getVisibleContentDiv();
    if (liveContent) {
      liveHeadings = Array.from(liveContent.querySelectorAll('h2, h3')) as HTMLElement[];
    }
  }

  headings.forEach((h, index) => {
    let sectionLabel: string;
    if (h.level === 'h2') {
      h2Counter += 1;
      h3Counter = 0;
      sectionLabel = `${h2Counter}`;
    } else {
      h3Counter += 1;
      sectionLabel = `${h2Counter || 1}.${h3Counter}`;
    }

    const liEl = document.createElement('li');
    liEl.setAttribute('data-level', h.level);
    liEl.setAttribute('data-heading-id', h.id);
    if (persistedReadSections.has(h.id)) {
      liEl.classList.add('section-completed');
    }

    const link = document.createElement('a');
    /* Anchor href differs by chapter type: for active chapter, plain
       hash so click scrolls in place; for non-active, full
       /read/<book>/<id>#hash so the link is shareable + the user
       lands on the right section after navigation. */
    if (isActive) {
      link.href = `#${h.id}`;
    } else {
      const url = chapterContentUrl(id);
      link.href = url ? `${url}#${h.id}` : `#${h.id}`;
    }

    /* Title row holds the section number, the heading text, and the
       reading-time badge in a single horizontal strip. The number
       becomes a separate <span> (was a `${label} · ` prefix on the
       title text) so Step 6's circle styling has its own hook without
       reaching into the title text. Legacy `.section-title` /
       `.section-time` classes are preserved alongside the new
       `.usb-section-*` ones to keep existing CSS rules working. */
    const titleRow = document.createElement('div');
    titleRow.className = 'usb-section-title-row';

    const numSpan = document.createElement('span');
    numSpan.className = 'usb-section-number';
    numSpan.textContent = sectionLabel;

    const titleSpan = document.createElement('span');
    titleSpan.className = 'section-title usb-section-title';
    titleSpan.textContent = h.text;
    /* Active-chapter rows ellipsize on overflow (fixed 36px height,
       nowrap) — surface the full label as a native tooltip so users
       can still read truncated headings on hover. */
    titleSpan.title = `${sectionLabel} · ${h.text}`;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'section-time usb-section-time';
    const minutes = sectionMinutes[index] || 1;
    const lang = getCurrentLang();
    timeSpan.textContent = lang === 'he' ? `${minutes} דק'` : `${minutes}m`;

    titleRow.appendChild(numSpan);
    titleRow.appendChild(titleSpan);
    titleRow.appendChild(timeSpan);

    /* Content-hint glyph at the inline-end edge — `{}` for code,
       `¶` for prose, omitted for empty sections. CSS hides it on
       the active row (which already shows the full preview pane
       below, making the hint redundant). The glyph is `aria-hidden`
       because it's purely visual; the section title and time are
       what screen readers should read. */
    const hintGlyph = pickHintGlyph(h.preview);
    if (hintGlyph) {
      const hint = document.createElement('span');
      hint.className = 'usb-content-hint';
      hint.textContent = hintGlyph;
      hint.setAttribute('aria-hidden', 'true');
      titleRow.appendChild(hint);
    }

    link.appendChild(titleRow);

    /* Preview pane is appended only when the cache delivered a
       preview for this section. Missing previews (legacy fetched HTML
       from before this feature shipped, malformed JSON, sections
       beyond the previews array's length) skip the pane entirely
       rather than render an empty placeholder — fewer DOM nodes,
       cleaner layout, and downstream CSS doesn't need to special-case
       an "empty" state. */
    if (h.preview) {
      link.appendChild(buildPreviewPane(h.preview));
    }

    /* Step 4 of 4: per-section horizontal feeder pipe. Injected
       once per section row; CSS handles visibility (only shows on
       .usb-chapter-active rows) and positioning (absolute, 30×5,
       centred on the row's vertical middle, inline-start at -34.5
       so its right physical edge lands on the main chapters-pipe
       inline-end edge at <li>-relative x=34). The shared <svg
       class="usb-pipe-defs"> in .usb-timeline supplies the
       gradient/pattern referenced by url(#…). innerHTML is fine
       here — the parser auto-namespaces <svg> children correctly. */
    liEl.insertAdjacentHTML(
      'beforeend',
      `<svg class="usb-section-feeder" width="30" height="5" viewBox="0 0 30 5" preserveAspectRatio="none" aria-hidden="true">
        <rect class="usb-feeder-water" x="0" y="0" width="30" height="5" fill="url(#usbWaterBody)"/>
        <rect class="usb-feeder-stream" x="-12" y="0" width="54" height="5" fill="url(#usbWaterFlowHoriz)"/>
        <rect x="0" y="0" width="30" height="5" fill="url(#usbFeederGlass)"/>
        <line x1="0" y1="0" x2="30" y2="0" stroke="var(--pipe-glass-edge-line)" stroke-width="0.6" opacity="0.7"/>
        <line x1="0" y1="5" x2="30" y2="5" stroke="var(--pipe-glass-edge-line)" stroke-width="0.6" opacity="0.7"/>
        <line x1="0" y1="0" x2="0" y2="5" stroke="var(--pipe-glass-edge-line)" stroke-width="0.7" opacity="0.75"/>
      </svg>`,
    );

    if (isActive) {
      /* Backfill missing live ids so the next scroll-spy cycle
         observes the right elements. */
      const liveHeading = liveHeadings[index];
      if (liveHeading && !liveHeading.id) liveHeading.id = h.id;

      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById(h.id);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setActiveOutlineItem(h.id);
        }
      });
      registerOutlineEntry(h.id, liEl);
    } else {
      /* Non-active chapter: clicking a section navigates to the
         chapter, then scrolls to the heading once the new content
         is in place. stopImmediatePropagation prevents the parent
         chapter-link click from firing twice. Navigation happens
         via the dispatcher to avoid a render <-> nav import cycle. */
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        const url = chapterContentUrl(id);
        if (!url) return;
        await navigateTo(url);
        setTimeout(() => {
          const target = document.getElementById(h.id);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
      });
    }

    liEl.appendChild(link);
    ul.appendChild(liEl);
  });

  if (isActive) {
    setupOutlineScrollSpy(liveHeadings);
    renderActiveChapterPipe(container, headings.length);
  } else {
    removeChapterPipe(container);
  }
}

/**
 * Render the active chapter's section list. Convenience wrapper used
 * by init / language-change / chapter-swap paths.
 *
 * Always invalidates the active chapter's cache before rendering —
 * the live DOM is the canonical source for the active chapter, and
 * stale cached data would lose any DOM mutations made between fetch
 * and display.
 */
export function buildSectionList(): void {
  const id = getCurrentChapterId();
  if (!id) {
    setupOutlineScrollSpy([]);
    return;
  }
  invalidateChapterCache(id);
  void renderChapterSections(id);
}

/**
 * After navigation, ensure the data-expanded flags reflect the new
 * active chapter. Previously-active chapters collapse; the new
 * active chapter expands automatically if it has sections.
 *
 * We don't remove non-active section containers from the DOM — they
 * stay collapsed (max-height: 0) so a future re-expansion is instant.
 */
export function ensureSectionsContainer(): void {
  const currentId = String(getCurrentChapterId() || '');

  document.querySelectorAll<HTMLElement>('.usb-chapter').forEach(li => {
    const chId = li.dataset.chapterId || '';
    const sectionCount = parseInt(li.dataset.sectionCount || '0', 10) || 0;

    if (chId === currentId) {
      if (sectionCount > 0) {
        li.dataset.expanded = 'true';
        const btn = li.querySelector('.usb-toggle-btn');
        btn?.setAttribute('aria-expanded', 'true');
      }
    } else {
      li.dataset.expanded = 'false';
      const btn = li.querySelector('.usb-toggle-btn');
      btn?.setAttribute('aria-expanded', 'false');
      /* If this chapter just lost active status, tear down its pipe
         overlay. The live `.usb-chapter-active` styles (36px rows,
         hidden dots) are CSS-only and detach automatically when the
         class is removed by updateActiveChapterRow, but the SVG node
         we injected is real DOM and has to be removed explicitly. */
      const sc = li.querySelector<HTMLElement>('.usb-sections');
      if (sc) removeChapterPipe(sc);
    }
  });
}

/**
 * Update the .toc-item-active class on chapter rows AND on the
 * mobile drawer's chapter list. Two different DOM trees but they
 * need to stay in sync after navigation.
 */
export function updateActiveChapterRow(): void {
  const currentId = getCurrentChapterId();
  if (currentId === null) return;

  /* Hand the RAF baton to the new active chapter's tube. Prior
     active tube stops its loop and freezes on a static frame. */
  setActiveTube(String(currentId));

  document.querySelectorAll<HTMLElement>('.usb-chapter').forEach(li => {
    const chapterId = li.dataset.chapterId || '';
    const link = li.querySelector('.usb-chapter-link');

    if (chapterId === String(currentId)) {
      li.classList.add('usb-chapter-active');
      link?.classList.add('usb-chapter-link-active');
      link?.setAttribute('aria-current', 'page');
    } else {
      li.classList.remove('usb-chapter-active');
      link?.classList.remove('usb-chapter-link-active');
      link?.removeAttribute('aria-current');
    }
  });

  /* Mirror to mobile drawer (different class names, same idea). */
  document.querySelectorAll<HTMLAnchorElement>('.mobile-toc-link').forEach(link => {
    const href = link.getAttribute('href') || '';
    const match = href.match(/\/read\/[^/]+\/([^/?#]+)/);
    const chapterId = match ? match[1] : '';
    const item = link.closest('.toc-item');
    if (chapterId === String(currentId)) {
      item?.classList.add('toc-item-active');
      link.classList.add('toc-link-active');
    } else {
      item?.classList.remove('toc-item-active');
      link.classList.remove('toc-link-active');
    }
  });
}