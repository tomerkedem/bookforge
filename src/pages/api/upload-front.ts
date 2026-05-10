/**
 * API endpoint for uploading the knowledge-card "front" image of a book
 * or a series. The image is the same artifact rendered on /library
 * (orbit cards, focused view) — see src/utils/library/knowledge-cards.ts
 * for the discovery contract.
 *
 * POST /api/upload-front  (multipart/form-data)
 *
 * Form fields:
 *   kind  - "book" | "series"  (currently informational only; both
 *                              kinds write to the same directory tree)
 *   slug  - the asset-folder slug under
 *           src/assets/knowledge-cards/<slug>/.
 *           For a book: the book's slug as it appears in output/<slug>/.
 *           For a series: typically slugifySeriesName(name), or the
 *           value of `seriesMeta.assetFolder` when the user has wired
 *           a custom folder name.
 *           Must be safe ([A-Za-z0-9._-], non-empty, no traversal).
 *   file  - the front image. PNG only (the discovery globs `front.png`,
 *           and a JPG/WEBP saved with a .png extension would render
 *           but plant a quiet format mismatch into the bundle). Up to
 *           MAX_BYTES.
 *
 * Storage:
 *   src/assets/knowledge-cards/<slug>/front.png
 *
 * The folder is created on first upload; subsequent uploads overwrite
 * the file in place. Adjacent legacy faces (left/right/selected.png)
 * are LEFT UNTOUCHED so a four-face folder keeps its supplementary
 * artwork — the consumer code already falls back to `front` when a
 * legacy face is missing.
 *
 * Discovery is via Vite's `import.meta.glob` (eager). In `dev`, HMR
 * picks up the new file and the next SSR pass exposes the new hashed
 * URL automatically. In `build`, re-run the build after uploads.
 */

import type { APIRoute } from 'astro';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, sep } from 'path';

export const prerender = false;

const REPO_ROOT = resolve(process.cwd());
const KNOWLEDGE_CARDS_DIR = resolve(
  REPO_ROOT, 'src', 'assets', 'knowledge-cards',
);
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = new Set(['image/png']);

function isSafeSlug(slug: string): boolean {
  if (typeof slug !== 'string') return false;
  if (slug.length === 0 || slug.length > 200) return false;
  // Leading "." would let `.` / `..` slip through; leading "_" is
  // reserved by the discovery for shared folders (`_placeholders/`).
  if (slug.startsWith('.') || slug.startsWith('_')) return false;
  return /^[A-Za-z0-9._-]+$/.test(slug);
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.startsWith('multipart/form-data')) {
      return new Response(
        JSON.stringify({ error: 'Expected multipart/form-data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const form = await request.formData();
    const kindRaw = String(form.get('kind') || '').trim();
    const slug = String(form.get('slug') || '').trim();
    const file = form.get('file');

    if (kindRaw !== 'book' && kindRaw !== 'series') {
      return new Response(
        JSON.stringify({ error: 'Invalid kind (expected "book" or "series")' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }
    const kind = kindRaw as 'book' | 'series';

    if (!isSafeSlug(slug)) {
      return new Response(
        JSON.stringify({ error: 'Invalid slug' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (!(file instanceof File)) {
      return new Response(
        JSON.stringify({ error: 'Missing file' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (file.size === 0) {
      return new Response(
        JSON.stringify({ error: 'Empty file' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (file.size > MAX_BYTES) {
      return new Response(
        JSON.stringify({
          error: `File too large (max ${Math.round(MAX_BYTES / 1024 / 1024)}MB)`,
        }),
        { status: 413, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (!ACCEPTED_TYPES.has(file.type)) {
      return new Response(
        JSON.stringify({
          error: `Unsupported file type "${file.type}". Knowledge-card discovery only globs front.png — please upload a PNG.`,
        }),
        { status: 415, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const slugDir = resolve(KNOWLEDGE_CARDS_DIR, slug);

    // Defence-in-depth: ensure the resolved folder is still inside the
    // knowledge-cards root. isSafeSlug already prevents traversal, but
    // a path-prefix check is cheap.
    if (
      !slugDir.startsWith(KNOWLEDGE_CARDS_DIR + sep) &&
      slugDir !== KNOWLEDGE_CARDS_DIR
    ) {
      return new Response(
        JSON.stringify({ error: 'Invalid path' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (!existsSync(slugDir)) {
      mkdirSync(slugDir, { recursive: true });
    }

    const target = resolve(slugDir, 'front.png');
    const buffer = Buffer.from(await file.arrayBuffer());
    writeFileSync(target, buffer);

    return new Response(
      JSON.stringify({
        success: true,
        kind,
        slug,
        path: `src/assets/knowledge-cards/${slug}/front.png`,
        bytes: buffer.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    console.error('Upload front error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
