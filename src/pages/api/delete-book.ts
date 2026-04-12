/**
 * API endpoint to delete a book and all its files from the filesystem.
 * POST /api/delete-book
 * Body: { slug: string }
 * 
 * Deletes:
 * - output/<slug>/ (all chapter files in all languages)
 * - public/<slug>/assets/ (images)
 * - public/covers/<slug>.png (cover image)
 */

import type { APIRoute } from 'astro';
import { existsSync, rmSync, readdirSync, rmdirSync } from 'fs';
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

    if (deleted.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `No files found for book "${slug}"`,
        missing 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      deleted,
      missing,
      message: `Book "${slug}" deleted successfully`
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
