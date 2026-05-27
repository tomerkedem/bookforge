/**
 * /library — admin-series DRAFT preview hydrator.
 *
 * ▸ Production source of truth for series cards is
 *   `src/data/library/catalog.json` (merged at SSR by
 *   `src/utils/library/library-catalog-store.ts`). The orbit you see
 *   on `/library` for any committed series is fully resolved before
 *   the page reaches the client — first-paint truth, no flash.
 *
 * ▸ This hydrator is a DRAFT-ONLY preview layer. It exists solely
 *   so the editor can see their /admin edits before they Export
 *   `catalog.json` and commit it. It is NOT a production behavior:
 *   - it runs in the browser only,
 *   - it reads only from `localStorage` (`yuval_series_metadata`),
 *   - it never writes,
 *   - it never creates new orbit stations,
 *   - it only mirrors draft titles / hides draft-disabled stations
 *     onto orbit stations the SSR catalog already rendered.
 *
 * ▸ Once /admin gets a server-write endpoint (Phase 7), drafts can
 *   land directly in `catalog.json` and this file becomes deletable.
 *   Until then, removing it would silently drop the editor's
 *   in-progress preview the moment they tweak a series.
 *
 * Behavior, in order:
 *   1. For every admin draft series record, compute the public slug
 *      (asset-folder when set, otherwise a kebab-cased `name`).
 *   2. Find the matching SSR-rendered orbit station via
 *      `[data-galaxy-card][data-slug="<slug>"]`.
 *   3. If found AND the draft is eligible: mirror its display title
 *      and short description onto the rendered card.
 *   4. If found AND the draft is NOT eligible (toggled off,
 *      status=draft/hidden, asset folder removed): hide the station
 *      so the editor sees what publishing would look like.
 *   5. If unmatched: log a `[no-station]` hint — the editor needs to
 *      Export → commit catalog.json before that draft can appear on
 *      the orbit.
 *
 * Dev diagnostics print under `[admin-series]`.
 */

import { getAllSeriesMetadata } from '../../utils/content-metadata';
import {
  isAdminSeriesEligibleForOrbit,
  seriesMetadataToLibraryItem,
  slugFromSeries,
} from '../../utils/library/admin-series';

(function adminSeriesHydrator(): void {
  if (typeof window === 'undefined') return;

  const run = (): void => {
    const stage = document.querySelector<HTMLElement>('[data-galaxy-stage]');
    if (!stage) return;

    const records = Object.values(getAllSeriesMetadata());
    if (records.length === 0) {
      // eslint-disable-next-line no-console
      console.log('[admin-series] no admin records in localStorage; SSR seed wins');
      return;
    }

    // The artifact probe lives in the SSR-rendered orbit DOM: every
    // station with a discovered artifact carries `data-slug` plus a
    // `.lc-orbit-artifact` element. Probing the DOM (rather than
    // re-running `getKnowledgeCardAssets`) means the hydrator never
    // disagrees with what's actually on screen.
    const hasOrbitArtifact = (slug: string): boolean => {
      const card = stage.querySelector<HTMLElement>(
        `[data-galaxy-card][data-slug="${cssEscape(slug)}"]`,
      );
      return card?.querySelector('.lc-orbit-artifact') != null;
    };

    let updated = 0;
    let hidden = 0;
    let unmatched = 0;

    for (const meta of records) {
      const slug = slugFromSeries(meta);
      if (slug.length === 0) continue;

      const station = stage.querySelector<HTMLElement>(
        `[data-galaxy-card][data-slug="${cssEscape(slug)}"]`,
      );

      const eligible = isAdminSeriesEligibleForOrbit(meta, hasOrbitArtifact);

      if (!station) {
        // No SSR seed for this admin draft. Surface as a dev hint —
        // the editor needs to Export catalog.json and commit it before
        // this series can appear on the public orbit.
        unmatched += 1;
        // eslint-disable-next-line no-console
        console.log(
          `[admin-series]   [no-station] slug="${slug}" — `
          + `admin draft exists but no SSR orbit card found; `
          + `Export catalog.json from /admin and commit it to `
          + `src/data/library/catalog.json to publish this series.`,
        );
        continue;
      }

      if (!eligible) {
        // Admin opted the series out of the orbit. Hide the SSR
        // station rather than removing it (re-enabling on the next
        // load is then a single style toggle).
        station.style.display = 'none';
        station.setAttribute('aria-hidden', 'true');
        hidden += 1;
        // eslint-disable-next-line no-console
        console.log(
          `[admin-series]   [hidden] slug="${slug}" `
          + `(visible=${meta.isVisibleInUniverse} status=${meta.status ?? 'active'})`,
        );
        continue;
      }

      // Eligible — make sure the station is visible (in case a prior
      // run hid it) and mirror admin label edits onto the rendered
      // title. The `LibraryItem` projection is built but not used yet;
      // it's logged for parity with the SSR catalog so dev diagnostics
      // show what the catalog overlay would have surfaced.
      station.style.display = '';
      station.removeAttribute('aria-hidden');

      const projected = seriesMetadataToLibraryItem(meta);
      const titleEl = station.querySelector<HTMLElement>('.lc-title');
      if (titleEl) {
        const next = projected.titles.en ?? meta.name;
        if (titleEl.textContent !== next) {
          titleEl.textContent = next;
          updated += 1;
        }
      }

      // Mirror the admin short description onto the focused-state
      // subtitle when the station has one. Some cards (the legacy
      // disabled rendering branch) don't render a subtitle in the
      // resting orbit view, so this is a no-op there.
      const summary = meta.shortDescription?.trim();
      const subtitleEl = station.querySelector<HTMLElement>('.lc-orbit-subtitle');
      if (subtitleEl && summary) {
        subtitleEl.textContent = summary;
      }
    }

    // eslint-disable-next-line no-console
    console.log(
      `[admin-series] reconciled ${records.length} admin record(s); `
      + `${updated} title update(s), ${hidden} hidden, ${unmatched} without a station.`,
    );
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    // The Astro page may have already passed DOMContentLoaded by the
    // time this module evaluates (modules defer); run synchronously.
    run();
  }
})();

/**
 * `CSS.escape` with a manual fallback. Series slugs are derived from
 * user-typed names and asset-folder values — they could contain
 * characters that need escaping inside an attribute selector
 * (quotes, brackets, backslashes).
 */
function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/["\\\[\]]/g, '\\$&');
}
