/**
 * Knowledge Universe — minimal client-side state surface.
 *
 * Phase 7 — every editorial decision (visibility, series cascade,
 * orbit-artifact eligibility, station composition, station order) is
 * resolved at SSR by `library-catalog-store.ts`. The DOM that arrives
 * in the browser is the final truth.
 *
 * This module used to filter rows, group items into series capsules,
 * recompute orbit angles, and mirror localStorage draft state onto
 * the SSR markup. All of that is gone now — none of it has work to
 * do once the only source of truth is `src/data/library/catalog.json`.
 *
 * What survives:
 *   • `hydrateUniverse(stage)` — still called by index.astro on every
 *     page-load (including back-navigation). It snapshots the visible
 *     slugs and reads the i18n labels off the stage. The returned
 *     `UniverseState` carries the shape `universe-series-mode.ts`
 *     destructures; `seriesAvailable` is empty and `isHidden` is a
 *     constant false because there is no per-slug visibility state
 *     left to apply on the client.
 *   • `inheritAstroScope(source, target)` — used by other modules
 *     that JS-create nodes which still need Astro's CSS scope
 *     attributes propagated.
 *
 * No more reads of localStorage. No more writes to the DOM.
 */

export interface UniverseLabels {
  badgeLabel: string;
  itemsLabel: string;
  availableLabel: string;
  otherKnowledgeLabel: string;
  itemsShortLabel: string;
  closeLabel: string;
}

export interface UniverseState {
  /** Every slug rendered on the page (orbit + mobile carousel union). */
  slugSet: Set<string>;
  /**
   * seriesName → number of currently-visible members. Empty by
   * design now that visibility is decided at SSR; the field is kept
   * so `universe-series-mode.ts` can still destructure it without a
   * shape change.
   */
  seriesAvailable: Map<string, number>;
  /** i18n labels read from the stage's data-* attributes. */
  labels: UniverseLabels;
  /**
   * Re-usable visibility check by slug. Always false in Phase 7 —
   * anything visible on the page is, by definition, visible. Kept
   * on the interface so callers don't have to branch.
   */
  isHidden(slug: string): boolean;
}

/**
 * Snapshot the rendered stage and return the minimal state callers
 * still rely on. Does NOT mutate the DOM, does NOT read editorial
 * metadata.
 */
export function hydrateUniverse(stage: HTMLElement): UniverseState {
  const labels = readLabels(stage);

  const slugSet = new Set<string>();
  document
    .querySelectorAll<HTMLElement>('.galaxy-card[data-slug], .mgc-row[data-slug]')
    .forEach((el) => {
      const s = el.dataset.slug;
      if (s) slugSet.add(s);
    });

  return {
    slugSet,
    seriesAvailable: new Map(),
    labels,
    isHidden: () => false,
  };
}

/**
 * Copy any Astro CSS-scope attributes (`data-astro-cid-*`) from a SSR
 * source element onto a freshly-created subtree. Astro's default `<style>`
 * scoping rewrites every selector to require the cid attribute on the
 * matched element; JS-created nodes never receive the attribute through
 * SSR, so without this propagation a dynamically-injected subtree is
 * completely unstyled.
 *
 * Exported so other JS-DOM-creating modules (e.g. the Other Knowledge
 * pill in `universe-series-mode.ts`) can reuse the same fix.
 */
export function inheritAstroScope(source: Element, target: Element): void {
  const attrs: string[] = [];
  for (const attr of Array.from(source.attributes)) {
    if (attr.name.startsWith('data-astro-cid-')) attrs.push(attr.name);
  }
  if (attrs.length === 0) return;
  const apply = (el: Element) => attrs.forEach((name) => el.setAttribute(name, ''));
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
