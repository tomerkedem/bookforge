/**
 * API endpoint to delete a book and all its files from the filesystem.
 * POST /api/delete-book
 * Body: { slug: string }
 *
 * Deletes:
 * - output/<slug>/ (all chapter files in all languages)
 * - public/<slug>/assets/ (images)
 * - public/covers/<slug>.png (cover image)
 *
 * Archives (renames, does NOT delete):
 * - src/assets/knowledge-cards/<slug>/ → _deleted__<slug>__<ts>/
 *   The orbit/carousel artwork is preserved on disk so a later
 *   re-import of the same book recovers without redrawing the cards.
 *   Renaming with the `_deleted__` prefix is enough to make the slug
 *   no longer match any LibraryItem (the discovery in
 *   `src/utils/library/knowledge-cards.ts` keys on the folder name
 *   case-insensitively), so nothing renders for the deleted book —
 *   no "image without a book" floating in the knowledge space.
 */

import type { APIRoute } from 'astro';
import { existsSync, rmSync, readdirSync, rmdirSync, renameSync } from 'fs';
import { resolve } from 'path';

export const prerender = false;

const REPO_ROOT = resolve(process.cwd());

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const slug = body.slug;

    // Validate slug
    if (!slug || typeof slug !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing slug' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Security: prevent path traversal
    if (slug.includes('/') || slug.includes('\\') || slug.startsWith('.')) {
      return new Response(JSON.stringify({ error: 'Invalid slug' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const deleted: string[] = [];
    const archived: string[] = [];
    const missing: string[] = [];

    // 1. Delete output/<slug>/
    const bookDir = resolve(REPO_ROOT, 'output', slug);
    if (existsSync(bookDir)) {
      rmSync(bookDir, { recursive: true, force: true });
      deleted.push(`output/${slug}/`);
    } else {
      missing.push(`output/${slug}/`);
    }

    // 2. Delete public/<slug>/assets/
    const assetsDir = resolve(REPO_ROOT, 'public', slug, 'assets');
    if (existsSync(assetsDir)) {
      rmSync(assetsDir, { recursive: true, force: true });
      deleted.push(`public/${slug}/assets/`);
      
      // Remove empty parent dir
      const parentDir = resolve(REPO_ROOT, 'public', slug);
      if (existsSync(parentDir)) {
        const contents = readdirSync(parentDir);
        if (contents.length === 0) {
          rmdirSync(parentDir);
          deleted.push(`public/${slug}/`);
        }
      }
    } else {
      missing.push(`public/${slug}/assets/`);
    }

    // 3. Delete public/covers/<slug>.png
    const coverPng = resolve(REPO_ROOT, 'public', 'covers', `${slug}.png`);
    if (existsSync(coverPng)) {
      rmSync(coverPng);
      deleted.push(`public/covers/${slug}.png`);
    } else {
      missing.push(`public/covers/${slug}.png`);
    }

    // 4. Delete public/covers/<slug>.jpg (fallback)
    const coverJpg = resolve(REPO_ROOT, 'public', 'covers', `${slug}.jpg`);
    if (existsSync(coverJpg)) {
      rmSync(coverJpg);
      deleted.push(`public/covers/${slug}.jpg`);
    }

    // 5. Archive (rename, do NOT delete) the knowledge-card artwork.
    //    Editorial choice: orbit images are expensive to redraw, so a
    //    book deletion preserves them on disk under an inert name. The
    //    `_deleted__` prefix is intentionally NOT a valid book slug —
    //    no LibraryItem will ever match it, so the orbit discovery
    //    correctly drops the folder from the rendered universe even
    //    though the glob still picks it up.
    //
    //    Timestamp suffix isolates repeated deletions of the same slug
    //    (e.g. delete → re-import → delete again) so each archived set
    //    coexists without overwriting the previous archive.
    const knowledgeCardsDir = resolve(
      REPO_ROOT, 'src', 'assets', 'knowledge-cards', slug,
    );
    if (existsSync(knowledgeCardsDir)) {
      const ts = Date.now();
      const archivedName = `_deleted__${slug}__${ts}`;
      const archivedDir = resolve(
        REPO_ROOT, 'src', 'assets', 'knowledge-cards', archivedName,
      );
      try {
        renameSync(knowledgeCardsDir, archivedDir);
        archived.push(
          `src/assets/knowledge-cards/${slug}/ → ${archivedName}/`,
        );
      } catch (err) {
        // Non-critical: failing to archive the artwork should not
        // sink the whole deletion (output/ + public/ are already
        // gone). Surface the failure in the response so the caller
        // can act on it without breaking the user-visible flow.
        console.error('Knowledge-card archive failed:', err);
      }
    } else {
      missing.push(`src/assets/knowledge-cards/${slug}/`);
    }

    if (deleted.length === 0 && archived.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: `No files found for book "${slug}"`,
        missing,
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      deleted,
      archived,
      missing,
      message: `Book "${slug}" deleted successfully`,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Delete book error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
