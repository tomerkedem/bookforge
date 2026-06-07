/**
 * API endpoint that persists the editorial library catalog to disk.
 * POST /api/save-catalog
 * Body: the FULL catalog payload — { version, description?, items: [...] }
 *       (exactly the shape produced by buildExportedCatalog() in
 *       src/utils/library/catalog-export-import.ts).
 *
 * This is the single write path for the editorial source of truth at
 * src/data/library/catalog.json. /admin builds the full catalog from its
 * in-page working state on every save and POSTs it here; this endpoint
 * validates the shape and writes the file. There is no per-item PATCH —
 * the admin always sends the whole catalog so the file is internally
 * consistent after every write.
 *
 * Storage:
 *   src/data/library/catalog.json   (2-space JSON + trailing newline)
 *
 * Write is atomic: the payload is written to a sibling temp file and then
 * renamed over the target, so a crash mid-write can never leave a
 * half-written catalog.json that would break SSR on the next read.
 *
 * Why this lives behind the dev/SSR server (prerender = false): the same
 * reason as /api/upload-front and /api/delete-book — it touches the repo
 * filesystem. In `dev` Vite's JSON import HMR picks up the new file and
 * the next /library SSR pass renders the persisted state. In a static
 * `build` the write still runs (SSR adapter), but the published bundle
 * reflects the file as it was at build time — re-run the build to ship a
 * change, exactly like the cover-upload flow. Persisting the change in
 * the repository still requires a git commit of catalog.json.
 */

import type { APIRoute } from 'astro';
import { existsSync, mkdirSync, writeFileSync, renameSync, rmSync } from 'fs';
import { resolve, dirname } from 'path';
import { validateImportedCatalog } from '../../utils/library/catalog-export-import';

export const prerender = false;

const REPO_ROOT = resolve(process.cwd());
const CATALOG_PATH = resolve(REPO_ROOT, 'src', 'data', 'library', 'catalog.json');

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return json({ error: 'Expected application/json' }, 400);
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    // Validate with the SAME helper the /admin import flow uses, so the
    // file written here can never be something the reader
    // (library-catalog-store.ts) would later choke on. The helper is
    // strict on the wrapper ({ version, items }) and normalizes items;
    // it returns the cleaned item array on success.
    const result = validateImportedCatalog(payload);
    if (!result.ok || !result.items) {
      return json({ error: `Invalid catalog: ${result.reason ?? 'unknown'}` }, 422);
    }

    // Re-serialize from the validated payload rather than echoing the raw
    // body, so the persisted file is normalized and free of any extra
    // top-level keys. Preserve the human-readable `description` when the
    // caller supplied one.
    const p = payload as { version?: unknown; description?: unknown };
    const fileObject = {
      version: typeof p.version === 'number' ? p.version : 1,
      ...(typeof p.description === 'string' && p.description.trim().length > 0
        ? { description: p.description }
        : {}),
      items: result.items,
    };

    const text = JSON.stringify(fileObject, null, 2) + '\n';

    // Atomic write: temp file in the same directory + rename. Same-dir is
    // required so the rename stays on one filesystem (rename across
    // volumes is a copy, not atomic). The target directory is part of the
    // repo, but guard anyway for a fresh checkout.
    const dir = dirname(CATALOG_PATH);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const tmpPath = `${CATALOG_PATH}.tmp`;
    // [TEMP DEBUG] save-catalog write flow — remove after verifying.
    console.log('[save-catalog] write path', CATALOG_PATH, '— items:', result.items.length);
    writeFileSync(tmpPath, text, 'utf-8');
    try {
      renameSync(tmpPath, CATALOG_PATH);
    } catch (renameErr) {
      // Best-effort cleanup of the temp file so a failed rename doesn't
      // litter the data dir, then surface the failure.
      try { rmSync(tmpPath, { force: true }); } catch { /* ignore */ }
      throw renameErr;
    }
    // [TEMP DEBUG]
    console.log('[save-catalog] write success —', CATALOG_PATH);

    return json({ success: true, count: result.items.length }, 200);
  } catch (error: any) {
    console.error('Save catalog error:', error);
    return json({ error: error?.message || 'Internal server error' }, 500);
  }
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
