# Yuval library — Admin catalog workflow

Architecture after the single-source-of-truth change: `catalog.json` is
the only editorial source, `/admin` reads it and writes it back directly
via `/api/save-catalog`, and there is no browser storage and no
`output/_editorial.json` overlay in the catalog path. Read this before
touching anything under `src/data/library/`, `src/pages/admin.astro`,
`src/pages/api/save-catalog.ts`, `src/utils/library/`, or
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

## 3. `output/_editorial.json` is NOT an editorial source (removed)

`output/_editorial.json` is **no longer read at runtime**. The library
renderer takes ALL editorial decisions (displayTitle, category,
seriesName, visibility flags, visualMode, series fields, status) from
`src/data/library/catalog.json` and nothing else.

- `mergeDiscoveredWithCatalog` no longer runs the
  `applyFileContentMetadataOverlay` / `applyFileSeriesMetadataOverlay`
  passes — they were deleted.
- `src/utils/editorial-metadata-file.ts` has no importers and is slated
  for removal in a cleanup pass.

Do not reintroduce a second editorial file source. Edit catalog.json via
`/admin` (which persists it directly — see §5).

## 4. Admin draft state — in memory only

There is **no browser storage** anywhere in the catalog path.
`localStorage` is not read, not written, not consulted as a draft
buffer, and not consulted as a preview. The keys
`yuval_series_metadata` and `yuval_content_metadata` are gone.

The /admin page operates on an in-memory store in
`src/utils/content-metadata.ts`. The store is seeded once per page
load from `src/data/library/catalog.json` (via
`splitImportedCatalogIntoDrafts`), then mutated by /admin form saves.
It is **working state, not storage** — but every save flushes it to
disk (see §5), so a saved edit survives reload. Only an edit that was
typed and never saved is discarded on refresh.

The public library never reads any client-side state. SSR truth is
catalog.json + the pipeline output (physical facts only).

## 5. How Admin changes persist

Saving in `/admin` writes the file directly — there is no manual
export/commit dance in the normal workflow:

1. Edit content in `/admin` (book metadata, series create/edit/delete).
2. On each save, /admin rebuilds the FULL catalog via
   `buildExportedCatalog` and `POST`s it to **`/api/save-catalog`**
   (`src/pages/api/save-catalog.ts`), which validates it and writes
   `src/data/library/catalog.json` atomically (temp file + rename,
   2-space JSON + trailing newline).
3. In dev, Vite's JSON-import HMR reloads the file and the next
   `/library` SSR pass renders the new state.
4. **Commit `src/data/library/catalog.json`** to persist the change in
   the repository, then build / deploy to publish.

The **Export / Import catalog.json** buttons under Global Settings
remain as a manual backup/restore path (export downloads the current
catalog; import loads a file and persists it through the same endpoint),
but they are no longer the normal way to save.

> Note: the endpoint writes the working tree, not git. A git commit of
> catalog.json is still required to ship the change from the repo.

## 6. Things not to do

- **Do not reintroduce `localStorage`** anywhere in the catalog
  path. The keys `yuval_series_metadata` and `yuval_content_metadata`
  are intentionally retired. Do not bring back any other key for
  the same purpose under a new name.
- **Do not reintroduce `MANUAL_SERIES_ITEMS`** in
  `src/utils/library-catalog.ts`. Manual series live in
  `catalog.json` now.
- **Do not edit `output/` as the main catalog source.** It is
  pipeline output (physical facts only). Editorial decisions live in
  `catalog.json`.
- **Do not add a separate mobile or desktop catalog flow.** Both
  surfaces consume the same `getLibraryItems()` result. Visibility
  differences belong in the `visibility` flags on the catalog item,
  not in a parallel data source.
- **Do not bypass `mergeDiscoveredWithCatalog`.** New SSR overlays
  (file metadata, artifact probes, cascades) belong inside the
  store so every consumer sees them once.
- **Do not add `sessionStorage` or `IndexedDB` shims** to recover
  draft state across reloads. Saved edits already persist to
  catalog.json via `/api/save-catalog`; only unsaved typing is
  intentionally transient.

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

## 8. Server endpoint for direct publishing — IMPLEMENTED

The direct-write endpoint exists: **`POST /api/save-catalog`**
(`src/pages/api/save-catalog.ts`, `prerender = false`). It accepts the
payload produced by `buildExportedCatalog`, validates it with
`validateImportedCatalog`, and writes `src/data/library/catalog.json`
atomically (temp file + rename). /admin calls it on every editorial save
via `persistCatalog()`, so the Export → commit step is no longer the
normal flow and Admin saves persist across reloads through a fetch
round-trip (no localStorage).

Operational notes / constraints still to keep in mind:

- **Where it runs:** the endpoint touches the repo filesystem, so it
  only does real work behind the dev/SSR server — same constraint as
  `/api/upload-front` and `/api/delete-book`. A static build reflects
  the file as committed at build time; re-run the build to ship a
  change.
- **Auth:** there is currently no auth gate. Only the project owner runs
  /admin locally. Add an auth check before exposing /admin or this
  endpoint on a public host.
- **Git:** the write lands in the working tree only. Committing
  catalog.json is still required to publish from the repo.
