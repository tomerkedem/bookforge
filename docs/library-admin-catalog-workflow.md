# Yuval library — Admin catalog workflow

Final architecture after the Phase 7 cleanup (no browser storage in
the catalog path). Read this before touching anything under
`src/data/library/`, `src/pages/admin.astro`, `src/utils/library/`, or
`src/utils/library-catalog.ts`.

## 1. Production source of truth

`src/data/library/catalog.json` — the **only** editorial source the
public `/library` page renders from. Schema and adapters live in
`src/types/library-catalog.ts`; the read API is
`src/utils/library/library-catalog-store.ts`.

Anything visible on the orbit, mobile carousel, atlas, stats panel,
or continue-learning card derives from this file (merged with the
discovered pipeline content from `output/`).

## 2. What `output/` is responsible for

Pipeline-generated content only:

- Per-book folders (`output/<book-slug>/`) — Markdown chapters,
  manifests, assets, covers.
- `output/_catalog.json` — pipeline-discovered courses.
- All `discoverAllBooks()` / `discoverCourses()` inputs.

`output/` is **generated**. Do not hand-edit it as a catalog source.

## 3. What `output/_editorial.json` is responsible for

Per-item editorial overlay for discovered pipeline content. Read at
SSR by `src/utils/editorial-metadata-file.ts` and applied inside
`mergeDiscoveredWithCatalog` via the `applyFileContentMetadataOverlay`
and `applyFileSeriesMetadataOverlay` passes.

Use it for:

- Overriding `displayTitle` / `category` / `seriesName` /
  `isVisibleInUniverse` / `visualMode` on items the pipeline emits.
- Light per-series editorial fields on existing series records.

Do **not** use `_editorial.json` to declare brand-new entities
(standalone series, manual articles). Those belong in
`src/data/library/catalog.json`.

## 4. Admin draft state — in memory only

There is **no browser storage** anywhere in the catalog path.
`localStorage` is not read, not written, not consulted as a draft
buffer, and not consulted as a preview. The keys
`yuval_series_metadata` and `yuval_content_metadata` are gone.

The /admin page operates on an in-memory store in
`src/utils/content-metadata.ts`. The store is seeded once per page
load from `src/data/library/catalog.json` (via
`splitImportedCatalogIntoDrafts`), then mutated by /admin form
saves. A page refresh — or closing the tab — discards every unsaved
edit. The Admin UI surfaces a notice card explaining this.

The public library never reads any client-side state. SSR truth is
catalog.json + the pipeline output + `output/_editorial.json`.

## 5. How to publish Admin changes

1. Edit content in `/admin`.
2. Click **Export catalog.json** (under Global Settings). A file
   named `catalog.json` downloads.
3. Replace `src/data/library/catalog.json` with the downloaded file.
4. Commit the change.
5. Build / deploy. The orbit picks up the new state at SSR.

To re-edit from the published state, click **Import catalog.json**
and select the committed file. The in-memory store is replaced and
the page repaints in place — no reload, no browser storage.

## 6. Things not to do

- **Do not reintroduce `localStorage`** anywhere in the catalog
  path. The keys `yuval_series_metadata` and `yuval_content_metadata`
  are intentionally retired. Do not bring back any other key for
  the same purpose under a new name.
- **Do not reintroduce `MANUAL_SERIES_ITEMS`** in
  `src/utils/library-catalog.ts`. Manual series live in
  `catalog.json` now.
- **Do not edit `output/` as the main catalog source.** It is
  pipeline output. Use `catalog.json` or `_editorial.json`.
- **Do not add a separate mobile or desktop catalog flow.** Both
  surfaces consume the same `getLibraryItems()` result. Visibility
  differences belong in the `visibility` flags on the catalog item,
  not in a parallel data source.
- **Do not bypass `mergeDiscoveredWithCatalog`.** New SSR overlays
  (file metadata, artifact probes, cascades) belong inside the
  store so every consumer sees them once.
- **Do not add `sessionStorage` or `IndexedDB` shims** to recover
  draft state across reloads. The accepted contract is: in-memory
  only; export before refreshing.

## 7. What this means for the public library

After Phase 7 there is no client-side hydrator that reads editorial
state. The /library SSR DOM is the truth at first paint:

- `withAdminSeriesDraftPreview` — **removed**.
- `src/scripts/library/admin-series-hydrator.ts` — **removed**
  (and its side-effect import from `index.astro`).
- `src/utils/library/admin-series.ts` — **removed**;
  `slugFromSeries` moved to `src/types/content-metadata.ts`.
- `src/utils/library/universe-series-hydrator.ts` —
  reduced to a slug snapshot + Astro-scope helper. No row-removal,
  no orbit-angle recompute, no `isHidden` predicate.
- `initLinkedGlow` in `index.astro` — no longer reads
  `localStorage`; uses `data-series-name` / `data-series-id` that
  SSR already attaches from catalog data.

There is no first-paint flash for any committed editorial state and
there is no preview layer that could disagree with what is
published.

## 8. Optional future Phase 8 — server endpoint for direct publishing

Only do this once the security and hosting constraints are decided.
A possible shape:

- `POST /api/admin/catalog` in Astro server mode, gated on
  `import.meta.env.DEV` (or an auth check in production). Accepts
  the payload produced by `buildExportedCatalog` and writes
  `src/data/library/catalog.json` directly.
- Replaces the Export → commit step with a single **Publish**
  button in `/admin`.
- Optionally enables Admin state to persist across reloads (still
  not via localStorage — via a fetch round-trip to the catalog API).

Do not start Phase 8 without a clear answer for: who is allowed to
publish, what runtime hosts the endpoint, and how the file write
interacts with deploys.
