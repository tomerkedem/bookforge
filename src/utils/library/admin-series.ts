/**
 * Admin series → LibraryItem conversion.
 *
 * Single direction: read records authored in the /admin "ניהול סדרות"
 * section (stored in `localStorage` under `yuval_series_metadata`) and
 * project them onto the public `LibraryItem` shape consumed by
 * `/library` (the knowledge orbit, recommendations, stats, etc).
 *
 * Storage layer notes:
 *   - The admin store is browser-only. At SSR / build time
 *     `getAllSeriesMetadata()` returns `{}` (no `window`,
 *     `localStorage` undefined), so `getAdminSeriesLibraryItems()`
 *     returns `[]` at SSR. The catalog therefore continues to seed
 *     the SSR orbit from `MANUAL_SERIES_ITEMS` in `library-catalog.ts`
 *     — there is no flash of missing content for the baseline series
 *     (e.g. `ai-engineering-series`), and the admin overlay simply
 *     adds / amends entries on top once the page hydrates.
 *   - Slug resolution: a `SeriesMetadata` record is keyed by the raw
 *     `seriesName` typed by the user. The canonical slug for orbit
 *     matching is the asset-folder name (the directory under
 *     `src/assets/knowledge-cards/<slug>/` whose `front.png` drives the
 *     orbit visual). When the admin has filled `assetFolder` we use
 *     that verbatim; otherwise we slugify `name` as a best-effort
 *     fallback.
 *
 * Why a separate file (vs. inlining in `library-catalog.ts`):
 *   The mapping has its own concerns — slug resolution, status mapping,
 *   eligibility filtering — and is exercised from both the SSR catalog
 *   and the client-side orbit hydrator. Keeping it standalone means
 *   neither caller imports the other's transitive surface.
 */

import type {
  LibraryItem,
  LibraryItemStatus,
} from '../../types/library';
import type { SeriesMetadata, SeriesStatus } from '../../types/content-metadata';
import { getAllSeriesMetadata } from '../content-metadata';

// ── Slug & status mapping ────────────────────────────────────────────

/**
 * Canonical slug for an admin series record. Used for:
 *   - looking up the artifact folder (`knowledge-cards.ts`)
 *   - matching SSR-rendered `.galaxy-card[data-slug="…"]` stations
 *   - building the placeholder `/series/{slug}` href
 *
 * Resolution order:
 *   1. Trimmed `meta.assetFolder` when set — this is the explicit
 *      mapping the admin provides via the "תיקיית נכסים" field.
 *   2. Slugified `meta.name` as a last resort, kebab-cased, ASCII only.
 *      Returns `''` when `name` itself is empty / non-ASCII; callers
 *      treat empty as "ineligible".
 */
export function slugFromSeries(meta: SeriesMetadata): string {
  const explicit = meta.assetFolder?.trim();
  if (explicit && explicit.length > 0) return explicit;
  return (meta.name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Bridge `SeriesStatus` (admin lifecycle) onto `LibraryItemStatus`
 * (public catalog status). The two enums are intentionally distinct
 * — see `src/types/content-metadata.ts` and `src/types/library.ts`
 * — because the admin owns publication state and the catalog owns
 * the rendering badge. Mapping is one-way; the public catalog never
 * round-trips back into admin state.
 */
function statusToLibraryItemStatus(
  status: SeriesStatus | undefined,
): LibraryItemStatus {
  switch (status) {
    case 'draft':  return 'new';
    case 'hidden': return 'archived';
    case 'active':
    default:       return 'ready';
  }
}

// ── Eligibility ──────────────────────────────────────────────────────

/**
 * Whether an admin series record may surface on the public orbit.
 * All four conditions must hold:
 *   1. `isVisibleInUniverse` is `true` — the admin toggle decides
 *      whether the series ever shows up in the universe.
 *   2. `status` resolves to `'active'` — drafts and hidden records
 *      never reach the orbit, regardless of the visibility toggle.
 *   3. The resolved slug is non-empty (asset folder set, OR a
 *      sluggable `name`).
 *   4. The orbit-artifact probe returns `true` — the slug must
 *      resolve to a `front.png`-bearing folder under
 *      `src/assets/knowledge-cards/`. The probe is injected so
 *      callers can reuse the page's own `getKnowledgeCardAssets`
 *      lookup without us hard-importing it here.
 */
export function isAdminSeriesEligibleForOrbit(
  meta: SeriesMetadata,
  hasOrbitArtifact: (slug: string) => boolean,
): boolean {
  if (meta.isVisibleInUniverse !== true) return false;
  if ((meta.status ?? 'active') !== 'active') return false;
  const slug = slugFromSeries(meta);
  if (slug.length === 0) return false;
  return hasOrbitArtifact(slug);
}

// ── Conversion ───────────────────────────────────────────────────────

/**
 * Pure mapping: admin record → public catalog item. No I/O, no
 * filtering — callers gate eligibility separately so the function is
 * easy to test against a fixture.
 *
 * Field rationale (matching the product spec for this step):
 *   - `id === slug` so series share the same identity convention as
 *     pipeline-discovered items.
 *   - `type: 'series'` is the existing public catalog type added in
 *     step 5; the orbit grouping logic in `library.astro` already
 *     buckets it correctly.
 *   - `sourceKind: 'manual'` — matches the existing `MANUAL_SERIES_ITEMS`
 *     overlay so the admin-overridden version reads as the same
 *     provenance to recommendations / stats. (`'admin-series'` is
 *     not a member of the `LibrarySourceKind` union and would force
 *     a wider type change.)
 *   - `href: '/series/<slug>'` is intentionally NOT in the
 *     `isSafeLibraryHref` allow-list, so `LibraryCard` will render the
 *     series capsule as a non-navigable `<article>` until a real route
 *     ships. This is the same disabled-mode contract used for the
 *     baseline `MANUAL_SERIES_ITEMS` entry.
 *   - `categoryKey` defaults to `'ai-engineering'` because Yuval is
 *     AI-only at this stage; admin records will gain their own
 *     `categoryKey` field later when the admin schema grows.
 */
export function seriesMetadataToLibraryItem(
  meta: SeriesMetadata,
): LibraryItem {
  const slug = slugFromSeries(meta);
  const title = (meta.displayTitle ?? '').trim() || meta.name;
  const summary = (meta.shortDescription ?? '').trim();

  const item: LibraryItem = {
    id: slug,
    slug,
    type: 'series',
    status: statusToLibraryItemStatus(meta.status),
    sourceKind: 'manual',
    titles: { en: title },
    author: { en: 'Tomer Kedem' },
    categoryKey: 'ai-engineering',
    languages: ['en'],
    href: `/series/${slug}`,
  };

  if (summary.length > 0) {
    item.summaries = { en: summary };
  }
  return item;
}

// ── Browser-only loader ──────────────────────────────────────────────

/**
 * Reads every admin series record from `localStorage`, filters by
 * `isAdminSeriesEligibleForOrbit`, converts the survivors, and returns
 * them as `LibraryItem[]`. Returns `[]` at SSR or whenever the storage
 * read produces no records — both branches are no-ops on the catalog
 * pipeline.
 */
export function getAdminSeriesLibraryItems(
  hasOrbitArtifact: (slug: string) => boolean,
): LibraryItem[] {
  // Browser guard mirrors the helper inside `content-metadata.ts`. We
  // don't reach into `localStorage` directly here so SSR stays safe
  // even if a future refactor changes that helper.
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return [];
  }

  const all = getAllSeriesMetadata();
  const out: LibraryItem[] = [];
  for (const meta of Object.values(all)) {
    if (isAdminSeriesEligibleForOrbit(meta, hasOrbitArtifact)) {
      out.push(seriesMetadataToLibraryItem(meta));
    }
  }
  return out;
}
