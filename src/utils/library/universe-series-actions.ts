/**
 * Knowledge Universe — focused-series action panel + details drawer.
 *
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │ Responsibility (this module)                                   │
 *   │   • Recognise when the `[data-kind="course"]` orbit card has   │
 *   │     been focused into the centre via the existing layout       │
 *   │     module (`data-pos="center"`). The focus mechanism itself   │
 *   │     is owned by `universe-layout.ts`; we react to its output.  │
 *   │   • Wire up two SSR-rendered buttons that ride along inside    │
 *   │     the focused card's `.galaxy-cta` panel:                    │
 *   │        1. "Show / Hide series items" — toggles a local fan of  │
 *   │           child cards around the focused capsule.              │
 *   │        2. "Series details" — opens a same-page drawer with the │
 *   │           SeriesMetadata fields filled in.                     │
 *   │   • Build the children fan on demand. Children are discovered  │
 *   │     through the existing `ContentMetadata.seriesName` ↔        │
 *   │     `SeriesMetadata.name` relationship written by /admin and   │
 *   │     stored in localStorage. Children with a known artifact     │
 *   │     reuse its asset URL; children without one fall back to a   │
 *   │     shared placeholder visual.                                 │
 *   │   • Open / close the details drawer on the same /library page  │
 *   │     — no navigation away. Drawer chrome is SSR-rendered with   │
 *   │     i18n strings; this module only fills in the per-series     │
 *   │     values and toggles `[hidden]` + open/close attributes.     │
 *   │   • On focus exit (close button / backdrop / Esc) collapse     │
 *   │     both the children fan and the details drawer so leftover   │
 *   │     state never lingers behind a stale focus.                  │
 *   └────────────────────────────────────────────────────────────────┘
 *
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │ Why it lives outside `universe-layout.ts`                      │
 *   │   The layout module's contract is "knows nothing about series" │
 *   │   (see its header comment). Keeping the series-aware behaviour │
 *   │   in its own module preserves that boundary; the only signal   │
 *   │   we read from the layout module is the public                 │
 *   │   `stage.dataset.galaxyFocused` flag and the per-card          │
 *   │   `data-pos="center"` attribute. No private internals are      │
 *   │   touched.                                                     │
 *   └────────────────────────────────────────────────────────────────┘
 */

import {
  getAllMetadata,
  getAllSeriesMetadata,
  getSeriesMetadata,
} from '../content-metadata';
import { getKnowledgeCardAssetsOrPlaceholder } from './knowledge-cards';
import { slugFromSeries, type SeriesMetadata } from '../../types/content-metadata';
import type { SeriesModeHandle } from './universe-series-mode';

interface ActionLabels {
  showItems: string;
  hideItems: string;
  details: string;
  detailsClose: string;
  noDescription: string;
  noAssignedItems: string;
  childrenEmpty: string;
  placeholderType: string;
  visibleYes: string;
  visibleNo: string;
  statusActive: string;
  statusDraft: string;
  statusHidden: string;
}

function readLabels(stage: HTMLElement): ActionLabels {
  const ds = stage.dataset;
  return {
    showItems: ds.seriesActionsShowItems || 'Show series items',
    hideItems: ds.seriesActionsHideItems || 'Hide series items',
    details: ds.seriesActionsDetails || 'Series details',
    detailsClose: ds.seriesDetailsClose || 'Close',
    noDescription: ds.seriesDetailsNoDescription || '',
    noAssignedItems: ds.seriesDetailsNoAssignedItems || '',
    childrenEmpty: ds.seriesChildrenEmpty || '',
    placeholderType: ds.seriesChildrenPlaceholderType || 'Series item',
    visibleYes: ds.seriesDetailsVisibleYes || 'Yes',
    visibleNo: ds.seriesDetailsVisibleNo || 'No',
    statusActive: ds.statusActive || 'Active',
    statusDraft: ds.statusDraft || 'Draft',
    statusHidden: ds.statusHidden || 'Hidden',
  };
}

/**
 * Find the SeriesMetadata record whose canonical slug equals `slug`.
 * Returns both the resolved record and the underlying series `name` (the
 * map key admin items reference via `ContentMetadata.seriesName`).
 *
 * The admin store keys SeriesMetadata by `name`, not by slug, so this
 * iterates the records to find the match. The list is small (a handful
 * of series at most), so a linear scan is fine.
 */
function findSeriesBySlug(
  slug: string,
): { name: string; meta: SeriesMetadata } | null {
  const all = getAllSeriesMetadata();
  for (const [name, meta] of Object.entries(all)) {
    if (slugFromSeries(meta) === slug) {
      return { name, meta };
    }
  }
  return null;
}

interface ChildItem {
  slug: string;
  title: string;
  /** Resolved artifact URL — real per-slug `front.png` when present,
   *  otherwise the shared `_placeholders/book-front.png`. Undefined
   *  only when both are missing on disk. */
  artifact?: string;
}

/**
 * Discover children of `seriesName` by scanning every ContentMetadata
 * record whose `seriesName` matches. The title for each child is taken
 * from its ContentMetadata.displayTitle when set, then from the matching
 * orbit card's existing rendered title when the slug already has a
 * station (so admin-renamed titles flow through), then from the slug as
 * a last-resort label. The artifact resolves through the global
 * placeholder helper so children without a per-slug `front.png` still
 * get the shared visual instead of an empty card; the title and identity
 * always come from the actual content item, never from the placeholder.
 */
function findChildrenForSeries(
  seriesName: string,
  stage: HTMLElement,
): ChildItem[] {
  const all = getAllMetadata();
  const out: ChildItem[] = [];
  for (const [slug, meta] of Object.entries(all)) {
    if (meta.seriesName.trim() !== seriesName) continue;
    const station = stage.querySelector<HTMLElement>(
      `[data-galaxy-card][data-slug="${cssEscape(slug)}"]`,
    );
    const stationTitle =
      station?.querySelector<HTMLElement>('.lc-title')?.textContent?.trim();
    const title =
      meta.displayTitle?.trim()
      || stationTitle
      || slug;
    const artifact = getKnowledgeCardAssetsOrPlaceholder(slug)?.front;
    out.push({ slug, title, artifact });
  }
  return out;
}

function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/["\\\[\]]/g, '\\$&');
}

interface DrawerEls {
  overlay: HTMLElement;
  drawer: HTMLElement;
  close: HTMLElement;
  name: HTMLElement;
  summary: HTMLElement;
  full: HTMLElement;
  assignedCount: HTMLElement;
  plannedRow: HTMLElement;
  plannedCount: HTMLElement;
  statusValue: HTMLElement;
  assetFolder: HTMLElement;
  visible: HTMLElement;
  list: HTMLElement;
}

function getDrawerEls(): DrawerEls | null {
  const overlay = document.querySelector<HTMLElement>('[data-series-details-overlay]');
  const drawer = document.querySelector<HTMLElement>('[data-series-details-drawer]');
  if (!overlay || !drawer) return null;
  const close = drawer.querySelector<HTMLElement>('[data-series-details-close]');
  const name = drawer.querySelector<HTMLElement>('[data-series-details-name]');
  const summary = drawer.querySelector<HTMLElement>('[data-series-details-summary]');
  const full = drawer.querySelector<HTMLElement>('[data-series-details-full]');
  const assignedCount = drawer.querySelector<HTMLElement>('[data-series-details-assigned-count]');
  const plannedRow = drawer.querySelector<HTMLElement>('[data-series-details-planned-row]');
  const plannedCount = drawer.querySelector<HTMLElement>('[data-series-details-planned-count]');
  const statusValue = drawer.querySelector<HTMLElement>('[data-series-details-status-value]');
  const assetFolder = drawer.querySelector<HTMLElement>('[data-series-details-asset-folder]');
  const visible = drawer.querySelector<HTMLElement>('[data-series-details-visible]');
  const list = drawer.querySelector<HTMLElement>('[data-series-details-list]');
  if (!close || !name || !summary || !full || !assignedCount || !plannedRow || !plannedCount
      || !statusValue || !assetFolder || !visible || !list) return null;
  return {
    overlay, drawer, close, name, summary, full, assignedCount,
    plannedRow, plannedCount, statusValue, assetFolder, visible, list,
  };
}

export function initSeriesActions(
  stage: HTMLElement,
  seriesMode: SeriesModeHandle,
): void {
  const labels = readLabels(stage);
  const fanEl = stage.querySelector<HTMLElement>('[data-series-children-fan]');
  if (!fanEl) return;
  // Local non-nullable alias so the closures below don't have to repeat
  // the null narrowing — TypeScript doesn't preserve narrowed types
  // across nested function boundaries.
  const fan: HTMLElement = fanEl;
  const drawerEls = getDrawerEls();

  /** Active series slug while a children fan is open; `null` otherwise. */
  let activeChildrenSlug: string | null = null;

  // ── Series glow pulse ────────────────────────────────────────────────
  // One-shot 3-second multi-colour halo applied to every card that
  // belongs to a series. Triggered when the user clicks "Show series
  // items" on the focused capsule, or hovers any series capsule in the
  // resting orbit. CSS keyframes live in index.astro under
  // `@keyframes yuval-series-glow`; this module only toggles the class.
  const SERIES_GLOW_MS = 3000;
  const seriesGlowTimers = new Map<string, number>();

  function triggerSeriesGlow(seriesName: string): void {
    const targets = Array.from(stage.querySelectorAll<HTMLElement>(
      `.galaxy-card[data-series-member="${cssEscape(seriesName)}"], `
      + `.galaxy-card[data-series-capsule="${cssEscape(seriesName)}"]`,
    ));
    if (targets.length === 0) return;

    // Cancel any in-flight timer for this series so the re-trigger
    // restarts the animation cleanly.
    const prev = seriesGlowTimers.get(seriesName);
    if (prev !== undefined) window.clearTimeout(prev);

    targets.forEach((el) => el.classList.remove('is-series-glow'));
    // Force reflow so re-adding the class restarts the animation.
    void targets[0].offsetWidth;
    targets.forEach((el) => el.classList.add('is-series-glow'));

    const timeout = window.setTimeout(() => {
      targets.forEach((el) => el.classList.remove('is-series-glow'));
      seriesGlowTimers.delete(seriesName);
    }, SERIES_GLOW_MS);
    seriesGlowTimers.set(seriesName, timeout);
  }

  // Hover / touch trigger. `mouseenter` doesn't bubble so wire per
  // node. We register on three populations so the glow fires whenever
  // the user passes over anything that belongs to a series:
  //   1. The series capsule in the resting orbit (data-series-capsule)
  //   2. Each individual series member (data-series-member) — these
  //      are hidden in universe mode but revealed as the horizontal
  //      carousel after a "Show series items" click.
  //   3. `touchstart` mirrors `mouseenter` on phones / tablets where
  //      there is no real hover state, so Tomer gets the same 3-second
  //      multi-colour halo on mobile that desktop users get on hover.
  const hoverTargets = Array.from(
    stage.querySelectorAll<HTMLElement>(
      '.galaxy-card[data-series-capsule], '
      + '.galaxy-card[data-series-member]',
    ),
  );
  hoverTargets.forEach((card) => {
    const seriesName =
      card.dataset.seriesCapsule || card.dataset.seriesMember;
    if (!seriesName) return;
    const fire = () => triggerSeriesGlow(seriesName);
    card.addEventListener('mouseenter', fire);
    card.addEventListener('touchstart', fire, { passive: true });
  });

  function getFocusedSeriesCard(): HTMLElement | null {
    // The action panel rides on the course station card — orbitKindOf
    // in index.astro surfaces the `ai-engineering-series` overlay item
    // as `data-kind="course"`.
    return stage.querySelector<HTMLElement>(
      '.galaxy-card[data-pos="center"][data-kind="course"]',
    );
  }

  function buildChildrenFan(seriesSlug: string, seriesName: string): void {
    const children = findChildrenForSeries(seriesName, stage);
    // eslint-disable-next-line no-console
    console.log(
      `[series-actions] showing ${children.length} child item(s) for `
      + `series slug="${seriesSlug}" name="${seriesName}"`,
    );
    fan.innerHTML = '';
    fan.dataset.seriesSlug = seriesSlug;

    if (children.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'series-children-empty';
      empty.textContent = labels.childrenEmpty;
      fan.appendChild(empty);
    } else {
      const list = document.createElement('ul');
      list.className = 'series-children-list';
      children.forEach((child) => {
        list.appendChild(buildChildCard(child));
      });
      fan.appendChild(list);
    }
    fan.hidden = false;
    stage.dataset.seriesChildrenOpen = 'true';
    activeChildrenSlug = seriesSlug;
  }

  function buildChildCard(child: ChildItem): HTMLElement {
    const li = document.createElement('li');
    li.className = 'series-child-card';
    li.dataset.slug = child.slug;

    const visual = document.createElement('div');
    visual.className = 'series-child-visual';
    if (child.artifact) {
      const img = document.createElement('img');
      img.src = child.artifact;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.draggable = false;
      visual.appendChild(img);
    } else {
      visual.classList.add('series-child-visual-placeholder');
      const glyph = document.createElement('span');
      glyph.className = 'series-child-placeholder-glyph';
      glyph.setAttribute('aria-hidden', 'true');
      // Inline SVG: a stylised book mark — generic, no per-title flavour.
      glyph.innerHTML =
        '<svg viewBox="0 0 24 24" width="32" height="32" fill="none"'
        + ' stroke="currentColor" stroke-width="1.4" stroke-linecap="round"'
        + ' stroke-linejoin="round" aria-hidden="true">'
        + '<path d="M5 4h11a3 3 0 0 1 3 3v13l-4-2-4 2-4-2-4 2V6a2 2 0 0 1 2-2z"></path>'
        + '<path d="M9 8h6M9 11h6M9 14h4"></path>'
        + '</svg>';
      visual.appendChild(glyph);
      const placeholderLabel = document.createElement('span');
      placeholderLabel.className = 'series-child-placeholder-type';
      placeholderLabel.textContent = labels.placeholderType;
      visual.appendChild(placeholderLabel);
    }
    li.appendChild(visual);

    const title = document.createElement('p');
    title.className = 'series-child-title';
    title.textContent = child.title;
    li.appendChild(title);

    return li;
  }

  function hideChildrenFan(): void {
    fan.hidden = true;
    fan.innerHTML = '';
    delete fan.dataset.seriesSlug;
    delete stage.dataset.seriesChildrenOpen;
    activeChildrenSlug = null;
    // Reset every series card's button to "show items".
    stage
      .querySelectorAll<HTMLElement>('[data-series-action="toggle-items"]')
      .forEach((btn) => {
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute('aria-label', labels.showItems);
        const lbl = btn.querySelector<HTMLElement>('[data-series-action-label="toggle-items"]');
        if (lbl) lbl.textContent = labels.showItems;
      });
  }

  function setToggleButtonState(card: HTMLElement, open: boolean): void {
    const btn = card.querySelector<HTMLElement>('[data-series-action="toggle-items"]');
    if (!btn) return;
    btn.setAttribute('aria-pressed', open ? 'true' : 'false');
    const labelText = open ? labels.hideItems : labels.showItems;
    btn.setAttribute('aria-label', labelText);
    const lbl = btn.querySelector<HTMLElement>('[data-series-action-label="toggle-items"]');
    if (lbl) lbl.textContent = labelText;
  }

  // ── Course filter ────────────────────────────────────────────────────
  // "Show series books" collapses the orbit down to just the focused
  // course's content. Membership is read straight off the
  // `data-series-id` already rendered on every station — the course
  // capsule and each of its lessons share one id — so it works with
  // zero admin metadata, unlike the legacy name-keyed series mode.
  //
  // It reuses the existing series-mode CSS contract, so there is no new
  // visual system: the lessons become `.is-active-series-member` (the
  // horizontal carousel), the course capsule `.is-active-series-capsule`
  // (hidden — it is replaced by its books), every other station
  // `.is-muted` (faded out), and `data-stage-mode="series"` on the stage
  // drives it all. The filter is dismissed by clicking anywhere else
  // (see the document listeners below) — no "Other Knowledge" exit pill.

  function applyCourseFilter(card: HTMLElement): void {
    if (stage.dataset.stageMode === 'series') return;
    const seriesId = card.dataset.seriesId;
    if (!seriesId) return;

    // Lessons of this course = every OTHER station sharing its series id.
    const lessons = Array.from(
      stage.querySelectorAll<HTMLElement>(
        `.galaxy-card[data-galaxy-card][data-series-id="${cssEscape(seriesId)}"]`,
      ),
    ).filter((el) => el !== card);
    if (lessons.length === 0) return; // no course content to surface

    // Drop the centre spotlight so the filtered carousel reads cleanly
    // (the layout module's card-click handler may already have done so;
    // the guard keeps this idempotent).
    if (card.dataset.pos === 'center') {
      delete card.dataset.pos;
      delete stage.dataset.galaxyFocused;
    }

    lessons.forEach((el, i) => {
      el.classList.add('is-active-series-member');
      el.style.setProperty('--series-active-index', String(i));
      el.style.setProperty('--series-active-total', String(lessons.length));
    });
    card.classList.add('is-active-series-capsule');
    stage
      .querySelectorAll<HTMLElement>('.galaxy-card[data-galaxy-card]')
      .forEach((c) => {
        if (c === card || c.classList.contains('is-active-series-member')) return;
        c.classList.add('is-muted');
      });
    stage.dataset.stageMode = 'series';
    setToggleButtonState(card, true);
  }

  function clearCourseFilter(): void {
    if (stage.dataset.stageMode !== 'series') return;
    stage.querySelectorAll<HTMLElement>('.galaxy-card').forEach((c) => {
      c.classList.remove(
        'is-active-series-member',
        'is-active-series-capsule',
        'is-muted',
      );
      c.style.removeProperty('--series-active-index');
      c.style.removeProperty('--series-active-total');
    });
    delete stage.dataset.stageMode;
    delete stage.dataset.activeSeries;
    // Reset every toggle button back to its "show" state.
    stage
      .querySelectorAll<HTMLElement>('[data-series-action="toggle-items"]')
      .forEach((btn) => {
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute('aria-label', labels.showItems);
        const lbl = btn.querySelector<HTMLElement>(
          '[data-series-action-label="toggle-items"]',
        );
        if (lbl) lbl.textContent = labels.showItems;
      });
  }

  function openDetails(card: HTMLElement): void {
    if (!drawerEls) return;
    const slug = card.dataset.slug;
    if (!slug) return;
    const series = findSeriesBySlug(slug);
    // The card may exist on the orbit before the admin has typed any
    // SeriesMetadata. In that case fall back to defaults so the drawer
    // still shows accurate empty states; the slug itself is always
    // available from the focused station.
    const meta: SeriesMetadata = series?.meta ?? getSeriesMetadata(slug);
    const seriesName = series?.name ?? slug;

    const titleEl = card.querySelector<HTMLElement>('.lc-title');
    const display =
      meta.displayTitle?.trim()
      || titleEl?.textContent?.trim()
      || seriesName;
    drawerEls.name.textContent = display;

    const short = meta.shortDescription?.trim() ?? '';
    const long = meta.fullDescription?.trim() ?? '';
    if (short.length > 0) {
      drawerEls.summary.textContent = short;
      drawerEls.summary.hidden = false;
    } else if (long.length === 0) {
      drawerEls.summary.textContent = labels.noDescription;
      drawerEls.summary.hidden = false;
    } else {
      drawerEls.summary.textContent = '';
      drawerEls.summary.hidden = true;
    }
    drawerEls.full.textContent = long;
    drawerEls.full.hidden = long.length === 0;

    const children = findChildrenForSeries(seriesName, stage);
    drawerEls.assignedCount.textContent = String(children.length);

    if (typeof meta.plannedBooksCount === 'number' && Number.isFinite(meta.plannedBooksCount)) {
      drawerEls.plannedRow.hidden = false;
      drawerEls.plannedCount.textContent = String(meta.plannedBooksCount);
    } else {
      drawerEls.plannedRow.hidden = true;
      drawerEls.plannedCount.textContent = '';
    }

    drawerEls.statusValue.textContent = mapStatusLabel(meta.status, labels);
    drawerEls.assetFolder.textContent = meta.assetFolder?.trim() || slug;
    drawerEls.visible.textContent = meta.isVisibleInUniverse
      ? labels.visibleYes
      : labels.visibleNo;

    drawerEls.list.innerHTML = '';
    if (children.length === 0) {
      const li = document.createElement('li');
      li.className = 'series-details-list-empty';
      li.textContent = labels.noAssignedItems;
      drawerEls.list.appendChild(li);
    } else {
      children.forEach((child) => {
        const li = document.createElement('li');
        li.className = 'series-details-list-item';
        li.textContent = child.title;
        drawerEls.list.appendChild(li);
      });
    }

    drawerEls.drawer.hidden = false;
    drawerEls.overlay.hidden = false;
    drawerEls.overlay.setAttribute('aria-hidden', 'false');
    stage.dataset.seriesDetailsOpen = 'true';
    document.body.dataset.seriesDetailsOpen = 'true';
    // eslint-disable-next-line no-console
    console.log(
      `[series-actions] opened details drawer for slug="${slug}" `
      + `name="${seriesName}" assigned=${children.length}`,
    );
    // Focus the close button for keyboard users.
    requestAnimationFrame(() => drawerEls.close.focus());
  }

  function closeDetails(): void {
    if (!drawerEls) return;
    if (drawerEls.drawer.hidden) return;
    drawerEls.drawer.hidden = true;
    drawerEls.overlay.hidden = true;
    drawerEls.overlay.setAttribute('aria-hidden', 'true');
    delete stage.dataset.seriesDetailsOpen;
    delete document.body.dataset.seriesDetailsOpen;
  }

  // ── Click handler ────────────────────────────────────────────────────
  stage.addEventListener(
    'click',
    (e) => {
      const target = e.target as Element | null;
      if (!target) return;
      const btn = target.closest<HTMLElement>('[data-series-action]');
      if (!btn) return;
      const action = btn.dataset.seriesAction;
      const card = btn.closest<HTMLElement>('.galaxy-card[data-galaxy-card]');
      if (!card) return;
      // Defensive: the buttons are only rendered for the kind="course"
      // station, but this check guards against a stray dispatch.
      if (card.dataset.kind !== 'course') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (action === 'toggle-items') {
        applyCourseFilter(card);
        return;
      }
      if (action === 'details') {
        openDetails(card);
        return;
      }
    },
    true, // capture so we beat the layout module's card-click handler
  );

  // ── Course-filter dismissal ──────────────────────────────────────────
  // A click anywhere on the page collapses the course filter back to the
  // full orbit. The activating "Show series books" click never reaches
  // here — the stage click handler above calls stopImmediatePropagation()
  // on series-action buttons — so this only fires for genuine "elsewhere"
  // clicks. clearCourseFilter() is a cheap no-op when no filter is active.
  // Clicking a visible lesson card collapses the filter too AND lets the
  // layout module focus that lesson, so the user lands on it in the
  // restored orbit. Esc mirrors the dismissal for keyboard users.
  document.addEventListener('click', () => clearCourseFilter());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') clearCourseFilter();
  });

  // ── Drawer dismissal ─────────────────────────────────────────────────
  if (drawerEls) {
    drawerEls.close.addEventListener('click', (e) => {
      e.preventDefault();
      closeDetails();
    });
    drawerEls.overlay.addEventListener('click', () => closeDetails());
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (drawerEls.drawer.hidden) return;
      e.preventDefault();
      closeDetails();
    });
  }

  // ── Focus-exit watcher ───────────────────────────────────────────────
  // The layout module flips `data-galaxy-focused` on the stage when a
  // card is opened / closed in the centre. We mirror that signal: when
  // the focused card is gone OR the focused card stops being a series,
  // fan + drawer should disappear so leftover state never lingers.
  const observer = new MutationObserver(() => {
    const focusedSeries = getFocusedSeriesCard();
    if (!focusedSeries) {
      if (activeChildrenSlug) hideChildrenFan();
      closeDetails();
      return;
    }
    if (activeChildrenSlug && activeChildrenSlug !== focusedSeries.dataset.slug) {
      hideChildrenFan();
    }
  });
  observer.observe(stage, {
    attributes: true,
    attributeFilter: ['data-galaxy-focused'],
    subtree: false,
  });
  // Watch for data-pos changes on individual cards too (the layout
  // module sets / removes it directly on the card, not on the stage).
  observer.observe(stage, {
    attributes: true,
    attributeFilter: ['data-pos'],
    subtree: true,
  });
}

function mapStatusLabel(
  status: SeriesMetadata['status'],
  labels: ActionLabels,
): string {
  switch (status) {
    case 'draft':  return labels.statusDraft;
    case 'hidden': return labels.statusHidden;
    case 'active':
    default:       return labels.statusActive;
  }
}
