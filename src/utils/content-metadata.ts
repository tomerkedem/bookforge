/**
 * Editorial metadata storage for Yuval content items.
 *
 * Storage key intentionally does NOT contain a slug — the existing
 * `cleanBook(slug)` sweep in /admin matches `_${slug}` substrings, and
 * editorial state must survive both "Clean data" and "Clean global
 * settings". See src/types/content-metadata.ts for the rationale.
 *
 * Read returns defaults when nothing is stored. Writes happen only via
 * `setMetadata`, so opening a page that calls `getMetadata` does not
 * mutate localStorage.
 */

import {
  CONTENT_METADATA_VERSION,
  SERIES_METADATA_VERSION,
  type ContentMetadata,
  type ContentMetadataStore,
  type SeriesMetadata,
  type SeriesMetadataStore,
} from '../types/content-metadata';

export const CONTENT_METADATA_STORAGE_KEY = 'yuval_content_metadata';

/**
 * Series metadata uses its own key so editing a series cannot touch
 * item metadata or reader progress. The key has no slug substring, so
 * the existing cleanBook(slug) sweep in /admin will not match it; it
 * is also intentionally excluded from GLOBAL_KEYS.
 */
export const SERIES_METADATA_STORAGE_KEY = 'yuval_series_metadata';

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

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function emptyStore(): ContentMetadataStore {
  return { version: CONTENT_METADATA_VERSION, items: {} };
}

function readStore(): ContentMetadataStore {
  if (!isBrowser()) return emptyStore();
  try {
    const raw = localStorage.getItem(CONTENT_METADATA_STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<ContentMetadataStore> | null;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !parsed.items ||
      typeof parsed.items !== 'object'
    ) {
      return emptyStore();
    }
    return {
      version:
        typeof parsed.version === 'number' ? parsed.version : CONTENT_METADATA_VERSION,
      items: parsed.items as Record<string, ContentMetadata>,
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: ContentMetadataStore): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(CONTENT_METADATA_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Quota exceeded / private mode — non-critical, editorial work can
    // be re-saved next session. Silent no-op is the right default here.
  }
}

/**
 * Returns the raw stored map. Items not yet edited by the user are
 * absent. Callers that need a defaults-merged view per slug should use
 * `getMetadata(slug, fallbackTitle)` instead.
 */
export function getAllMetadata(): Record<string, ContentMetadata> {
  return readStore().items;
}

/**
 * Returns a complete `ContentMetadata` for `slug`, defaulting any
 * missing fields. Stored fields take priority. Never mutates storage.
 */
export function getMetadata(
  slug: string,
  fallbackTitle?: string,
): ContentMetadata {
  const stored = readStore().items[slug];
  const defaults = defaultMetadataFor(slug, fallbackTitle);
  if (!stored) return defaults;
  // Defaults provide the floor so a future schema field gain does not
  // hand callers a partial object. Stored values overlay; slug is
  // re-pinned to the requested slug so renamed keys can never lie.
  return { ...defaults, ...stored, slug };
}

/**
 * Merges `patch` into the stored record for `slug` (creating it from
 * defaults if absent) and writes the store. Returns the resulting
 * record. The slug is always re-pinned so it cannot be patched away.
 */
export function setMetadata(
  slug: string,
  patch: Partial<ContentMetadata>,
  fallbackTitle?: string,
): ContentMetadata {
  const store = readStore();
  const current = store.items[slug] ?? defaultMetadataFor(slug, fallbackTitle);
  const next: ContentMetadata = { ...current, ...patch, slug };
  store.items[slug] = next;
  store.version = CONTENT_METADATA_VERSION;
  writeStore(store);
  return next;
}

// ─────────────────────────────────────────────────────────────────
// Series metadata
//
// Mirrors the item API. A series record is keyed by series name (the
// `seriesName` field on items). Reads return defaults when nothing is
// stored; writes happen only via setSeriesMetadata.
// ─────────────────────────────────────────────────────────────────

export function defaultSeriesMetadataFor(name: string): SeriesMetadata {
  return {
    name,
    displayTitle: name,
    visualMode: 'capsule',
    isVisibleInUniverse: true,
    status: 'active',
    // color, order, shortDescription, fullDescription, plannedBooksCount
    // and assetFolder are intentionally left undefined — they are
    // editorial overrides, not always-present values. A consumer that
    // reads `meta.color` (or any optional field) should treat falsy as
    // "use default" / "not set".
  };
}

function emptySeriesStore(): SeriesMetadataStore {
  return { version: SERIES_METADATA_VERSION, items: {} };
}

function readSeriesStore(): SeriesMetadataStore {
  if (!isBrowser()) return emptySeriesStore();
  try {
    const raw = localStorage.getItem(SERIES_METADATA_STORAGE_KEY);
    if (!raw) return emptySeriesStore();
    const parsed = JSON.parse(raw) as Partial<SeriesMetadataStore> | null;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !parsed.items ||
      typeof parsed.items !== 'object'
    ) {
      return emptySeriesStore();
    }
    return {
      version:
        typeof parsed.version === 'number' ? parsed.version : SERIES_METADATA_VERSION,
      items: parsed.items as Record<string, SeriesMetadata>,
    };
  } catch {
    return emptySeriesStore();
  }
}

function writeSeriesStore(store: SeriesMetadataStore): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(SERIES_METADATA_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Quota / private mode — silent no-op, same as item metadata.
  }
}

export function getAllSeriesMetadata(): Record<string, SeriesMetadata> {
  return readSeriesStore().items;
}

/**
 * Returns a complete `SeriesMetadata` for `name`, defaulting any
 * missing fields. Stored fields take priority. Never mutates storage.
 */
export function getSeriesMetadata(name: string): SeriesMetadata {
  const stored = readSeriesStore().items[name];
  const defaults = defaultSeriesMetadataFor(name);
  if (!stored) return defaults;
  return { ...defaults, ...stored, name };
}

/**
 * Merges `patch` into the stored series record (creating it from
 * defaults if absent) and writes the store. The name is always
 * re-pinned so it cannot be patched away.
 */
export function setSeriesMetadata(
  name: string,
  patch: Partial<SeriesMetadata>,
): SeriesMetadata {
  const store = readSeriesStore();
  const current = store.items[name] ?? defaultSeriesMetadataFor(name);
  const next: SeriesMetadata = { ...current, ...patch, name };
  store.items[name] = next;
  store.version = SERIES_METADATA_VERSION;
  writeSeriesStore(store);
  return next;
}

/**
 * Deletes the series record for `name`, if any. This is the editorial
 * inverse of `setSeriesMetadata` and ONLY removes the series's
 * presentation properties (displayTitle, color, descriptions, etc.).
 *
 * It does NOT mutate any item metadata: books that still carry
 * `seriesName: name` keep that field untouched. Callers that want a
 * full series teardown (so the auto-detection in /admin no longer
 * resurrects a row) must also walk the affected items and clear
 * their `seriesName`. The series-delete flow in /admin does both.
 *
 * Returns true when a record existed and was removed, false otherwise.
 */
export function deleteSeriesMetadata(name: string): boolean {
  const store = readSeriesStore();
  if (!(name in store.items)) return false;
  delete store.items[name];
  store.version = SERIES_METADATA_VERSION;
  writeSeriesStore(store);
  return true;
}
