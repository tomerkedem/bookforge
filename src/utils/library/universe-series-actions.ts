/**
 * Knowledge Universe — focused-series action panel + details drawer.
 *
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │ Responsibility (this module)                                   │
 *   │   • Recognise when a `[data-kind="series"]` orbit card has     │
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
import { slugFromSeries } from './admin-series';
import { getKnowledgeCardAssetsOrPlaceholder } from './knowledge-cards';
import type { SeriesMetadata } from '../../types/content-metadata';
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

  function getFocusedSeriesCard(): HTMLElement | null {
    return stage.querySelector<HTMLElement>(
      '.galaxy-card[data-pos="center"][data-kind="series"]',
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

  function toggleChildren(card: HTMLElement): void {
    const slug = card.dataset.slug;
    if (!slug) return;

    // If the orbit is already in series-mode for this same series, treat
    // the click as "hide" and exit. Use seriesMode.active() so we don't
    // need a parallel state variable for whether the orbit is filtered.
    const series = findSeriesBySlug(slug);
    const seriesName = series?.name;
    if (seriesName && seriesMode.active() === seriesName) {
      seriesMode.exit();
      setToggleButtonState(card, false);
      return;
    }

    // Cleanup any stale fan from a prior interaction (the fan is no
    // longer the primary UI for this button — kept as a safety net for
    // series with no orbit station — but we still want it out of the
    // way before entering orbit series-mode).
    if (activeChildrenSlug) hideChildrenFan();

    if (!seriesName) {
      // No metadata = no orbit members to surface. Fall back to the
      // empty-state fan so the user sees an explicit "no items" hint
      // instead of nothing happening.
      // eslint-disable-next-line no-console
      console.log(
        `[series-actions] no SeriesMetadata for focused slug="${slug}"; `
        + 'showing empty fan so the user gets a clear "no items" hint',
      );
      fan.innerHTML = '';
      fan.dataset.seriesSlug = slug;
      const empty = document.createElement('p');
      empty.className = 'series-children-empty';
      empty.textContent = labels.childrenEmpty;
      fan.appendChild(empty);
      fan.hidden = false;
      stage.dataset.seriesChildrenOpen = 'true';
      activeChildrenSlug = slug;
      setToggleButtonState(card, true);
      return;
    }

    // Filter the orbit itself: clear the focused state so the layout's
    // CTA panel disappears (otherwise the now-hidden capsule would still
    // be the focus target and the action buttons would float over an
    // invisible card), then enter series mode so the orbit transforms
    // into a horizontal carousel of just this series's members + the
    // synthesized "Other Knowledge" exit pill.
    if (card.dataset.pos === 'center') {
      delete card.dataset.pos;
      delete stage.dataset.galaxyFocused;
    }
    seriesMode.enter(seriesName);
    setToggleButtonState(card, true);
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
      // Defensive: the buttons are only rendered for kind="series" cards,
      // but this check guards against a stray dispatch.
      if (card.dataset.kind !== 'series') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (action === 'toggle-items') {
        toggleChildren(card);
        return;
      }
      if (action === 'details') {
        openDetails(card);
        return;
      }
    },
    true, // capture so we beat the layout module's card-click handler
  );

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
