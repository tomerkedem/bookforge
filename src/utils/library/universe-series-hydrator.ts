/**
 * Knowledge Universe — metadata hydrator.
 *
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │ SSR responsibility (library.astro frontmatter)                 │
 *   │   • Render every readable item as its own .galaxy-card station │
 *   │     with [data-galaxy-card], [data-kind], [data-slug] and an   │
 *   │     initial --orbit-angle distributed evenly per kind.         │
 *   │   • Has NO knowledge of editorial metadata (visibility / series).│
 *   └────────────────────────────────────────────────────────────────┘
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │ Hydrator responsibility (this module)                          │
 *   │   • Read editorial metadata from localStorage.                 │
 *   │   • Phase 1 — collect every slug currently on the page (orbit  │
 *   │     + mobile carousel) BEFORE any removal, so series totals    │
 *   │     count hidden members too.                                  │
 *   │   • Phase 2 — visibility filter. `isHidden(slug)` honors BOTH  │
 *   │     ContentMetadata (item-level) AND SeriesMetadata            │
 *   │     (series-level): a series with isVisibleInUniverse=false    │
 *   │     cascades the hide to every member, BEFORE grouping and     │
 *   │     BEFORE angle redistribution.                               │
 *   │   • Phase 3 — series grouping (desktop only): tag every        │
 *   │     surviving member with [data-series-member="<name>"] (CSS   │
 *   │     hides them in universe mode) and inject one capsule node   │
 *   │     per visible series next to the first member, inheriting    │
 *   │     that member's --orbit-angle. Single-item "series" stay as  │
 *   │     normal book cards. Capsule rendering dispatches on         │
 *   │     SeriesMetadata.visualMode (currently only 'capsule').      │
 *   │     The capsule's visible label uses                           │
 *   │     `seriesMeta.displayTitle || seriesName`.                   │
 *   │   • Phase 4 — sort stations per kind by editorial order, then  │
 *   │     recompute --orbit-angle so survivors stay evenly           │
 *   │     distributed on their arcs. Sort rules (see sortStations):  │
 *   │       1. ordered series first (lower order → earlier on arc)   │
 *   │       2. unordered series next, alphabetical by displayTitle   │
 *   │       3. non-series cards last, in natural SSR order           │
 *   │     DOM order is NOT changed — angle alone drives layout.      │
 *   │   • Returns the universe state (slugSet, seriesAvailable,      │
 *   │     stage labels, isHidden) for the series-mode module to use. │
 *   │   • DOES NOT register any event handlers — interaction lives   │
 *   │     in `universe-series-mode.ts` and `universe-layout.ts`.     │
 *   └────────────────────────────────────────────────────────────────┘
 */

import {
  getMetadata,
  getSeriesMetadata,
} from '../content-metadata';
import type { SeriesMetadata } from '../../types/content-metadata';
import { getEvenOrbitAngle } from './universe-angle-utils';

export interface UniverseLabels {
  badgeLabel: string;
  itemsLabel: string;
  availableLabel: string;
  otherKnowledgeLabel: string;
  itemsShortLabel: string;
  closeLabel: string;
}

export interface UniverseState {
  /** Every slug rendered on the page (orbit + mobile carousel union),
   *  including ones removed by the visibility filter. Used to compute
   *  Other Knowledge counts in series mode. */
  slugSet: Set<string>;
  /** seriesName → number of currently-VISIBLE members of that series.
   *  Used by series mode to compute "Other Knowledge" = visible total
   *  minus the active series. */
  seriesAvailable: Map<string, number>;
  /** i18n labels read from the stage's data-* attributes. */
  labels: UniverseLabels;
  /** Re-usable visibility check by slug. */
  isHidden(slug: string): boolean;
}

/**
 * Run the full SSR → universe-state hydration on a single stage.
 * Mutates the DOM (removes hidden cards, inserts series capsules,
 * rewrites --orbit-angle) and returns the immutable state needed by
 * the series-mode module.
 *
 * Returns null when the stage has no `data-galaxy-stage` host element
 * (defensive: keeps callers from having to null-check).
 */
export function hydrateUniverse(stage: HTMLElement): UniverseState {
  const labels = readLabels(stage);

  /**
   * A slug is considered hidden when EITHER:
   *   • its own item metadata says so (isVisibleInUniverse=false or
   *     visualMode='hidden'), OR
   *   • it belongs to a series whose SeriesMetadata.isVisibleInUniverse
   *     is false. Hiding a series cascades to every member, both for
   *     visibility filtering (Phase 2) and for the Other-Knowledge
   *     count in series mode (which calls this same predicate).
   */
  function isHidden(slug: string): boolean {
    const meta = getMetadata(slug);
    if (!meta.isVisibleInUniverse || meta.visualMode === 'hidden') return true;
    const sn = meta.seriesName.trim();
    if (sn && !getSeriesMetadata(sn).isVisibleInUniverse) return true;
    return false;
  }

  // ── Phase 1 — slug snapshot BEFORE any removal ─────────────────────
  // Series totals must include hidden members or we undercount: a
  // member that is hidden by metadata still belongs to its series for
  // capsule-count purposes.
  const slugSet = new Set<string>();
  document
    .querySelectorAll<HTMLElement>('.galaxy-card[data-slug], .mgc-row[data-slug]')
    .forEach(el => {
      const s = el.dataset.slug;
      if (s) slugSet.add(s);
    });

  // seriesTotal — every member, including hidden-by-item.
  // seriesAvailable — only members visible at BOTH item level AND
  // series level. A series whose SeriesMetadata.isVisibleInUniverse is
  // false has 0 available even if its items are individually visible,
  // because the whole series is suppressed before grouping.
  const seriesTotal = new Map<string, number>();
  const seriesAvailable = new Map<string, number>();
  slugSet.forEach(slug => {
    const m = getMetadata(slug);
    const sn = m.seriesName.trim();
    if (!sn) return;
    seriesTotal.set(sn, (seriesTotal.get(sn) || 0) + 1);
    if (!isHidden(slug)) {
      seriesAvailable.set(sn, (seriesAvailable.get(sn) || 0) + 1);
    }
  });

  // ── Phase 2 — visibility filter ───────────────────────────────────
  // Drop hidden rows from both the desktop orbit and the mobile
  // carousel. The expanded `isHidden` above also drops every member of
  // a series whose SeriesMetadata says invisible — that happens BEFORE
  // grouping (Phase 3) so a hidden series produces zero stations and
  // zero capsule, and BEFORE angle redistribution (Phase 4) so survivors
  // fill the freed-up arc evenly.
  document
    .querySelectorAll<HTMLElement>('.galaxy-card[data-slug], .mgc-row[data-slug]')
    .forEach(row => {
      const slug = row.dataset.slug;
      if (slug && isHidden(slug)) row.remove();
    });

  // ── Phase 3 — series grouping ─────────────────────────────────────
  // INTENTIONALLY DISABLED. The SeriesCapsule orbit station was
  // removed at editorial request: a capsule that sums up "N items in
  // series, M available" doesn't represent a readable artifact, only
  // a grouping abstraction, and it cluttered the universe view by
  // adding a station that competed with real book cards.
  //
  // Consequence of disabling capsule injection:
  //   • Books that share a `seriesName` now render as their own
  //     individual orbit stations — exactly like books with no
  //     series. The grouping still exists in the editorial layer
  //     (admin Series Management, ContentMetadata.seriesName), but
  //     it has no visual on the orbit.
  //   • `data-series-member` is NOT applied, so the existing CSS
  //     rule that hides members in universe mode no longer matches
  //     anything. The rule itself is left in place defensively.
  //   • The Phase-1 `seriesAvailable` map is still computed and
  //     surfaced through `UniverseState`. It currently has no
  //     consumer (the series-mode "Other Knowledge" count was its
  //     only reader, and that flow is unreachable without a
  //     capsule), but it costs nothing and keeps the public state
  //     shape stable for any future reintroduction of capsules.
  //
  // To re-enable capsules in the future, restore the loop that ran
  // here (see git history) and the corresponding member-hiding CSS
  // / click-handler wiring in universe-series-mode.
  void seriesTotal;
  void buildSeriesNode;
  void inheritAstroScope;

  // ── Phase 4 — recompute --orbit-angle per kind ────────────────────
  // Members are NOT stations (they're hidden in universe mode); capsules
  // and non-series cards ARE stations. The two arcs are recomputed
  // independently so each kind stays evenly distributed.
  //
  // Stations are sorted by editorial order before angle assignment.
  // See `compareStations` for the exact rule set; in summary:
  //   1. capsules with a numeric SeriesMetadata.order come first,
  //      lower → earlier on the arc;
  //   2. capsules without a numeric order come next, alphabetical by
  //      displayTitle (case-insensitive);
  //   3. non-series cards keep their natural SSR order at the tail.
  // DOM order is intentionally NOT changed — angle alone drives layout
  // in CSS — so tab order, accessibility tree and progress hydration
  // remain identical to before.
  // Unified distribution. Every visible station — book, lesson, series
  // capsule, future kinds — shares one global index space and is laid
  // out evenly around the full 360° circle. Item TYPE drives CSS only,
  // not orbit position. The same `getEvenOrbitAngle` runs at SSR time
  // (library.astro frontmatter) so the post-metadata recompute below
  // always matches the initial paint.
  const stations = Array.from(
    stage.querySelectorAll<HTMLElement>(
      '.galaxy-card:not([data-series-member])',
    ),
  );

  const orderedStations = sortStations(stations);
  orderedStations.forEach((card, i) => {
    const angle = getEvenOrbitAngle(i, orderedStations.length);
    card.style.setProperty('--orbit-angle', `${angle}deg`);
  });

  return { slugSet, seriesAvailable, labels, isHidden };
}

/**
 * Sort orbit stations within a single kind for angle assignment.
 *
 * Tier 0 — series capsule with a numeric SeriesMetadata.order. Sorted
 *          ascending by order; ties broken by displayTitle.
 * Tier 1 — series capsule without a numeric order. Sorted alphabetically
 *          by displayTitle (case-insensitive).
 * Tier 2 — non-series cards. Preserved in natural SSR order.
 *
 * This is a pure array sort. The caller assigns angles based on the
 * returned order; DOM is not reordered.
 */
function sortStations(stations: HTMLElement[]): HTMLElement[] {
  type Sortable = {
    card: HTMLElement;
    naturalIndex: number;
    tier: 0 | 1 | 2;
    order: number;
    label: string;
  };

  const annotated: Sortable[] = stations.map((card, naturalIndex) => {
    if (card.dataset.role !== 'series') {
      return { card, naturalIndex, tier: 2, order: 0, label: '' };
    }
    const sn = card.dataset.seriesCapsule || '';
    const sm = getSeriesMetadata(sn);
    const hasOrder = typeof sm.order === 'number' && Number.isFinite(sm.order);
    const label = (sm.displayTitle || sn).toLowerCase();
    return {
      card,
      naturalIndex,
      tier: hasOrder ? 0 : 1,
      order: hasOrder ? sm.order! : 0,
      label,
    };
  });

  annotated.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    if (a.tier === 0 && a.order !== b.order) return a.order - b.order;
    if (a.tier !== 2 && a.label !== b.label) return a.label < b.label ? -1 : 1;
    return a.naturalIndex - b.naturalIndex;
  });

  return annotated.map(x => x.card);
}

/**
 * Copy any Astro CSS-scope attributes (`data-astro-cid-*`) from a SSR
 * source element onto a freshly-created subtree. Astro's default `<style>`
 * scoping rewrites every selector to require the cid attribute on the
 * matched element; JS-created nodes never receive the attribute through
 * SSR, so without this propagation a dynamically-injected subtree is
 * completely unstyled (no orbit positioning, no glass surface, etc.).
 *
 * Exported so other JS-DOM-creating modules (e.g. the Other Knowledge
 * pill in universe-series-mode.ts) can reuse the same fix.
 */
export function inheritAstroScope(source: Element, target: Element): void {
  const attrs: string[] = [];
  for (const attr of Array.from(source.attributes)) {
    if (attr.name.startsWith('data-astro-cid-')) attrs.push(attr.name);
  }
  if (attrs.length === 0) return;
  const apply = (el: Element) => attrs.forEach(name => el.setAttribute(name, ''));
  apply(target);
  target.querySelectorAll('*').forEach(apply);
}

function readLabels(stage: HTMLElement): UniverseLabels {
  return {
    badgeLabel: stage.dataset.seriesBadge || 'Series',
    itemsLabel: stage.dataset.seriesItemsLabel || 'items',
    availableLabel: stage.dataset.seriesAvailableLabel || 'available',
    otherKnowledgeLabel: stage.dataset.otherKnowledgeLabel || 'Other Knowledge',
    itemsShortLabel: stage.dataset.itemsShortLabel || 'items',
    closeLabel: stage.dataset.closeLabel || 'Close',
  };
}

/**
 * Shared shape for any series-node renderer. The hydrator calls
 * `buildSeriesNode` and that function dispatches to a renderer based on
 * `seriesMeta.visualMode`. New visual modes (e.g. 'shelf', 'tile') can
 * be wired in by adding a case to the switch and a matching renderer
 * function — the shared options shape keeps callers stable.
 */
interface SeriesNodeOpts {
  /** Raw seriesName — the key linking items together. Stays the dataset
   *  identity (`data-series-capsule` / `data-series-member`) so series-mode
   *  lookups continue to use the canonical name. */
  seriesName: string;
  seriesMeta: SeriesMetadata;
  total: number;
  available: number;
  kind: 'book' | 'lesson';
  angle: string;
  labels: UniverseLabels;
}

/**
 * Dispatch on `seriesMeta.visualMode`. Today only 'capsule' is wired up;
 * the switch is the single edit-point when more modes are added so the
 * grouping pass above does not need to know how each mode renders.
 */
function buildSeriesNode(opts: SeriesNodeOpts): HTMLElement {
  switch (opts.seriesMeta.visualMode) {
    case 'capsule':
    default:
      return buildSeriesCapsuleCard(opts);
  }
}

/**
 * Build the SeriesCapsule orbit station node. The wrapper carries the
 * full station contract — `data-galaxy-card`, `data-kind`, `--orbit-angle`
 * — so it counts as a station for the layout module's getStep() and so
 * the existing orbit CSS positions it without any special case.
 *
 * Click handling for capsules is owned by `universe-series-mode.ts`
 * (it intercepts `[data-role="series"]` clicks before the layout
 * module's card-click handler runs). The layout module skips cards
 * with a `data-role` so a capsule is never accidentally click-to-centered.
 *
 * The displayed label, aria-label, and capsule heading use
 * `seriesMeta.displayTitle` (falling back to the raw seriesName when
 * the editorial value is empty). The dataset attribute keeps the raw
 * seriesName so series-mode's member lookups remain stable across
 * label edits.
 */
function buildSeriesCapsuleCard(opts: SeriesNodeOpts): HTMLElement {
  const { labels, seriesMeta } = opts;
  const displayTitle =
    (seriesMeta.displayTitle || '').trim() || opts.seriesName;

  const card = document.createElement('div');
  card.className = 'galaxy-card';
  // data-galaxy-card MUST be set so getStep() in universe-layout.ts
  // counts the capsule as a real station; missing it caused the orbit
  // rotation step to undercount when series were active.
  card.setAttribute('data-galaxy-card', '');
  card.dataset.kind = opts.kind;
  card.dataset.role = 'series';
  card.dataset.seriesCapsule = opts.seriesName;
  card.style.setProperty('--orbit-angle', opts.angle);
  if (seriesMeta.color) card.style.setProperty('--series-color', seriesMeta.color);
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute(
    'aria-label',
    `${displayTitle} — ${labels.badgeLabel}`,
  );

  const capsule = document.createElement('div');
  capsule.className = 'galaxy-series-capsule';

  const badge = document.createElement('span');
  badge.className = 'galaxy-series-badge';
  badge.textContent = labels.badgeLabel;
  capsule.appendChild(badge);

  const name = document.createElement('h3');
  name.className = 'galaxy-series-name';
  name.textContent = displayTitle;
  capsule.appendChild(name);

  const counts = document.createElement('div');
  counts.className = 'galaxy-series-counts';

  const totalLine = document.createElement('span');
  totalLine.className = 'galaxy-series-count-line';
  const totalNum = document.createElement('strong');
  totalNum.textContent = String(opts.total);
  totalLine.append(totalNum, document.createTextNode(' ' + labels.itemsLabel));
  counts.appendChild(totalLine);

  const availLine = document.createElement('span');
  availLine.className =
    'galaxy-series-count-line galaxy-series-count-available';
  const availNum = document.createElement('strong');
  availNum.textContent = String(opts.available);
  availLine.append(availNum, document.createTextNode(' ' + labels.availableLabel));
  counts.appendChild(availLine);

  capsule.appendChild(counts);

  // Subtle density indicator — a row of book-spine markers capped at 5.
  // For small series (≤5) we render one spine per item; for larger
  // series we render 5 spines and scale the filled count so the row
  // reads as density, not literal counting.
  const cap = 5;
  const totalShown = Math.min(opts.total, cap);
  const filledShown =
    opts.total <= cap
      ? Math.min(opts.available, totalShown)
      : Math.round((opts.available / opts.total) * cap);
  if (totalShown > 0) {
    const stack = document.createElement('div');
    stack.className = 'galaxy-series-stack';
    stack.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < totalShown; i++) {
      const spine = document.createElement('span');
      spine.className =
        'galaxy-series-spine' + (i < filledShown ? ' is-filled' : '');
      stack.appendChild(spine);
    }
    capsule.appendChild(stack);
  }

  card.appendChild(capsule);
  return card;
}
