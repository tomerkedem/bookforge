/**
 * /library — admin-series client hydrator.
 *
 * SSR seeds the orbit with `MANUAL_SERIES_ITEMS` (see
 * `src/utils/library-catalog.ts`). On the client we additionally
 * reconcile the rendered orbit against the admin's edits stored in
 * `localStorage` under `yuval_series_metadata`:
 *
 *   1. For every admin series record, compute the public slug
 *      (asset-folder when set, otherwise a kebab-cased `name`).
 *   2. Find the matching SSR-rendered orbit station via
 *      `[data-galaxy-card][data-slug="<slug>"]`.
 *   3. If found AND the admin record is eligible for the orbit
 *      (visible + active + has-artifact): mirror the admin's display
 *      title onto the visible `.lc-title` so an edit in the drawer
 *      shows up immediately on the public page after a reload.
 *   4. If found AND the admin record is NOT eligible (toggled off,
 *      status=draft/hidden, asset folder removed): hide the station
 *      so the public universe respects the editorial state without
 *      requiring a server round-trip.
 *
 * The hydrator does NOT create new orbit stations on the fly. New
 * series authored in /admin first need a build-time seed (the
 * `MANUAL_SERIES_ITEMS` overlay or, eventually, a real adapter) so
 * the SSR catalog knows about them — otherwise the hydrator would
 * have to clone the full station contract (data attributes, angle,
 * artifact, accent) from scratch, which would diverge from the SSR
 * pipeline. This is intentional: SSR remains the source of truth
 * for orbit composition; admin edits adjust label and visibility.
 *
 * Dev diagnostics print under `[admin-series]` so they can be
 * grepped alongside the existing `[knowledge-cards]` reports in
 * `library.astro`.
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
        // No SSR seed for this admin series. Surface as a dev hint —
        // the user (or a follow-up step) will need to add a build-time
        // entry so the orbit can include it.
        unmatched += 1;
        // eslint-disable-next-line no-console
        console.log(
          `[admin-series]   [no-station] slug="${slug}" — `
          + `admin record exists but no SSR orbit card found; `
          + `add it to MANUAL_SERIES_ITEMS to surface.`,
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
