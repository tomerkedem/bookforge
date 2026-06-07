/**
 * Editorial metadata in-memory store — the /admin page's WORKING STATE.
 *
 * There is no localStorage and no persistence in this module. It backs a
 * per-page in-memory map seeded once from the committed catalog at
 * `src/data/library/catalog.json`.
 *
 *   Single editorial source of truth → src/data/library/catalog.json
 *   Per-page working state           → the maps below (in this module)
 *   Persistence                      → /admin flushes the FULL catalog to
 *                                       the file on every save via
 *                                       persistCatalog() → POST
 *                                       /api/save-catalog. This module
 *                                       itself never writes.
 *
 * The public API (`getMetadata`, `setMetadata`, `getAllMetadata`,
 * `replaceAllMetadata`, and the series equivalents) is unchanged so
 * every caller — /admin forms, `universe-series-actions.ts`,
 * `universe-series-hydrator.ts` — continues to compile without
 * modification. Behaviour:
 *
 *   - Reads return whatever is currently in memory (seeded from
 *     catalog.json on first access, then mutated by `set*` calls or
 *     `replaceAll*` from the Admin Import flow).
 *   - Writes mutate the in-memory map only. /admin immediately follows a
 *     mutation with persistCatalog(), which serializes the whole store
 *     to catalog.json — so a saved edit survives reload. An edit that was
 *     typed but never saved is intentionally discarded on reload.
 */

import {
  CONTENT_METADATA_VERSION,
  SERIES_METADATA_VERSION,
  type ContentMetadata,
  type ContentMetadataStore,
  type SeriesMetadata,
  type SeriesMetadataStore,
} from '../types/content-metadata';
import {
  splitImportedCatalogIntoDrafts,
  validateImportedCatalog,
} from './library/catalog-export-import';
import baseCatalog from '../data/library/catalog.json';

/**
 * Build a safe defaults record from the current book id and (optional)
 * title. Defaults preserve the pre-metadata behaviour of every existing
 * book: visible in the Knowledge Universe, rendered as a card, typed
 * as a book, with no editorial overrides.
 */
export function defaultMetadataFor(
  slug: string,
  fallbackTitle?: string,
): ContentMetadata {
  const trimmed = fallbackTitle?.trim();
  return {
    slug,
    displayTitle: trimmed && trimmed.length > 0 ? trimmed : slug,
    contentType: 'book',
    category: '',
    seriesName: '',
    isVisibleInUniverse: true,
    visualMode: 'card',
  };
}

export function defaultSeriesMetadataFor(name: string): SeriesMetadata {
  return {
    name,
    displayTitle: name,
    visualMode: 'capsule',
    isVisibleInUniverse: true,
    status: 'active',
  };
}

// ════════════════════════════════════════════════════════════════════
// In-memory store
// ════════════════════════════════════════════════════════════════════
//
// One Map per record type. Seeded lazily on first access — we cannot
// run the seed at module init because that would force every importer
// (including SSR-only code paths) to evaluate the catalog split before
// it is actually needed. The lazy guard keeps that cost on demand and
// idempotent.

const contentStore: Map<string, ContentMetadata> = new Map();
const seriesStore: Map<string, SeriesMetadata> = new Map();
let seeded = false;

function seedStoresFromCatalog(): void {
  if (seeded) return;
  seeded = true;
  const validation = validateImportedCatalog(baseCatalog);
  if (!validation.ok || !validation.items) return;
  const split = splitImportedCatalogIntoDrafts(validation.items);
  for (const [slug, meta] of Object.entries(split.contentItems)) {
    contentStore.set(slug, meta);
  }
  for (const [name, meta] of Object.entries(split.seriesItems)) {
    seriesStore.set(name, meta);
  }
}

function ensureSeeded(): void {
  if (!seeded) seedStoresFromCatalog();
}

// ════════════════════════════════════════════════════════════════════
// Content-metadata API
// ════════════════════════════════════════════════════════════════════

/**
 * Returns the raw stored map. Items not yet edited by the user (and
 * not in the catalog seed) are absent. Callers that need a
 * defaults-merged view per slug should use `getMetadata(slug,
 * fallbackTitle)` instead.
 */
export function getAllMetadata(): Record<string, ContentMetadata> {
  ensureSeeded();
  const out: Record<string, ContentMetadata> = {};
  for (const [k, v] of contentStore.entries()) out[k] = v;
  return out;
}

/**
 * Returns a complete `ContentMetadata` for `slug`, defaulting any
 * missing fields. Stored fields take priority. Never mutates storage.
 */
export function getMetadata(
  slug: string,
  fallbackTitle?: string,
): ContentMetadata {
  ensureSeeded();
  const stored = contentStore.get(slug);
  const defaults = defaultMetadataFor(slug, fallbackTitle);
  if (!stored) return defaults;
  // Defaults provide the floor so a future schema field gain does not
  // hand callers a partial object. Stored values overlay; slug is
  // re-pinned to the requested slug so renamed keys can never lie.
  return { ...defaults, ...stored, slug };
}

/**
 * Merges `patch` into the stored record for `slug` (creating it from
 * defaults if absent) and writes the in-memory map. Returns the
 * resulting record. The slug is always re-pinned so it cannot be
 * patched away.
 *
 * Writes do NOT persist beyond the current page load — see file
 * header for the rationale.
 */
export function setMetadata(
  slug: string,
  patch: Partial<ContentMetadata>,
  fallbackTitle?: string,
): ContentMetadata {
  ensureSeeded();
  const current = contentStore.get(slug) ?? defaultMetadataFor(slug, fallbackTitle);
  const next: ContentMetadata = { ...current, ...patch, slug };
  contentStore.set(slug, next);
  return next;
}

/**
 * Replace the entire content-metadata store with `items`. Pre-existing
 * slugs that are not in `items` are dropped. Intended for the /admin
 * Import flow — the importer trusts the file contents.
 *
 * After this returns, `getAllMetadata()` reflects `items` exactly.
 */
export function replaceAllMetadata(
  items: Record<string, ContentMetadata>,
): void {
  ensureSeeded();
  contentStore.clear();
  for (const [slug, meta] of Object.entries(items)) {
    contentStore.set(slug, meta);
  }
}

// ════════════════════════════════════════════════════════════════════
// Series-metadata API
// ════════════════════════════════════════════════════════════════════

export function getAllSeriesMetadata(): Record<string, SeriesMetadata> {
  ensureSeeded();
  const out: Record<string, SeriesMetadata> = {};
  for (const [k, v] of seriesStore.entries()) out[k] = v;
  return out;
}

/**
 * Returns a complete `SeriesMetadata` for `name`, defaulting any
 * missing fields. Stored fields take priority. Never mutates storage.
 */
export function getSeriesMetadata(name: string): SeriesMetadata {
  ensureSeeded();
  const stored = seriesStore.get(name);
  const defaults = defaultSeriesMetadataFor(name);
  if (!stored) return defaults;
  return { ...defaults, ...stored, name };
}

/**
 * Merges `patch` into the stored series record (creating it from
 * defaults if absent) and writes the in-memory map. The name is
 * always re-pinned so it cannot be patched away.
 */
export function setSeriesMetadata(
  name: string,
  patch: Partial<SeriesMetadata>,
): SeriesMetadata {
  ensureSeeded();
  const current = seriesStore.get(name) ?? defaultSeriesMetadataFor(name);
  const next: SeriesMetadata = { ...current, ...patch, name };
  seriesStore.set(name, next);
  return next;
}

/**
 * Replace the entire series-metadata store with `items`. Bulk
 * destructive counterpart to `setSeriesMetadata`; used by the /admin
 * import flow.
 */
export function replaceAllSeriesMetadata(
  items: Record<string, SeriesMetadata>,
): void {
  ensureSeeded();
  seriesStore.clear();
  for (const [name, meta] of Object.entries(items)) {
    seriesStore.set(name, meta);
  }
}

/**
 * Deletes the series record for `name`, if any. Editorial inverse of
 * `setSeriesMetadata`. Removes only the series's presentation
 * properties; items still carrying `seriesName: name` keep that field
 * untouched. Callers wanting a full series teardown must also walk
 * the affected items and clear their `seriesName`. The series-delete
 * flow in /admin does both.
 *
 * Returns true when a record existed and was removed.
 */
export function deleteSeriesMetadata(name: string): boolean {
  ensureSeeded();
  return seriesStore.delete(name);
}

// ════════════════════════════════════════════════════════════════════
// Versioned-store snapshots
// ════════════════════════════════════════════════════════════════════
//
// Some legacy callers still build a versioned `ContentMetadataStore`
// or `SeriesMetadataStore` for export shaping. Provide thin wrappers
// so they don't have to learn the in-memory shape.

export function snapshotContentMetadataStore(): ContentMetadataStore {
  return { version: CONTENT_METADATA_VERSION, items: getAllMetadata() };
}

export function snapshotSeriesMetadataStore(): SeriesMetadataStore {
  return { version: SERIES_METADATA_VERSION, items: getAllSeriesMetadata() };
}
