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
import { getCompletedChapters, getChapterScrollPercent } from './sidebar-storage';
import {
  computeTimeRemaining,
  formatTimeRemaining,
  formatChapterTime,
  distributeChapterMinutesFromData,
} from './sidebar-time';
import { loadChapterSections, invalidateChapterCache, isCached } from './sidebar-cache';
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

/* Single instance per page. Lazily created the first time
   syncChapterStates runs after the canvas is in the DOM. View
   transitions persist the sidebar via transition:persist, so the
   canvas (and this instance) survive content swaps. */
let neuronBar: NeuronBar | null = null;

function getOrCreateNeuronBar(initialPct: number): NeuronBar | null {
  if (neuronBar) return neuronBar;
  const canvas = document.getElementById('usb-progress-canvas');
  if (!(canvas instanceof HTMLCanvasElement)) return null;
  neuronBar = new NeuronBar(canvas, initialPct);
  return neuronBar;
}

/**
 * Repaint the vertical thread gradient based on current chapter
 * states. Each chapter occupies an equal vertical band; the band is
 * painted green for completed, purple for active, gray otherwise.
 *
 * We build a sharp-stop gradient (each band has a hard edge) so the
 * thread reads as a series of states rather than a smooth fade.
 */
export function renderThreadGradient(): void {
  const thread = document.querySelector<HTMLElement>('.usb-thread');
  if (!thread) return;

  const list = document.querySelectorAll<HTMLElement>('.usb-chapter');
  if (list.length === 0) return;

  const book = getBookSlug();
  const completed = new Set(getCompletedChapters(book));
  const total = list.length;

  const stops: string[] = [];
  list.forEach((li, idx) => {
    const id = li.dataset.chapterId || '';
    const isActive = li.classList.contains('usb-chapter-active');
    const isComplete = completed.has(id);

    let color: string;
    if (isComplete) color = '#1f8a4d';
    else if (isActive) color = '#7c5cf0';
    else color = 'rgba(127, 127, 127, 0.18)';

    const top = (idx / total) * 100;
    const bottom = ((idx + 1) / total) * 100;
    stops.push(`${color} ${top}%`, `${color} ${bottom}%`);
  });

  thread.style.background = `linear-gradient(180deg, ${stops.join(', ')})`;
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

    const timeEl = li.querySelector<HTMLElement>('.usb-card-time');
    if (timeEl) {
      const words = parseInt(timeEl.dataset.wordCount || '0', 10) || 0;
      timeEl.textContent = formatChapterTime(words);
    }

    /* Per-chapter scroll progress is rendered by the particle tube.
       Completed chapters: full ring + green palette; in-progress:
       partial ring + purple palette. */
    const stored = getChapterScrollPercent(book, id);
    const pct = isComplete ? 100 : stored;
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
    return;
  }

  /* Hierarchical numbering: H2s sequential under chapter id, H3s as
     parent.child (e.g. chapter 3 → 3.1, 3.2; H3 under 3.2 → 3.2.1). */
  const chapterPrefix = id.replace(/^chapter-/, '').replace(/^0+/, '') || id;
  let h2Counter = 0;
  let h3Counter = 0;

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
      sectionLabel = `${chapterPrefix}.${h2Counter}`;
    } else {
      h3Counter += 1;
      sectionLabel = `${chapterPrefix}.${h2Counter || 1}.${h3Counter}`;
    }

    const liEl = document.createElement('li');
    liEl.setAttribute('data-level', h.level);
    liEl.setAttribute('data-heading-id', h.id);

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

    const titleSpan = document.createElement('span');
    titleSpan.className = 'section-title';
    titleSpan.textContent = `${sectionLabel} · ${h.text}`;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'section-time';
    const minutes = sectionMinutes[index] || 1;
    const lang = getCurrentLang();
    timeSpan.textContent = lang === 'he' ? `${minutes} דק'` : `${minutes}m`;

    link.appendChild(titleSpan);
    link.appendChild(timeSpan);

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