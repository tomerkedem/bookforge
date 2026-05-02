/**
 * Yuval Service Worker - Cache-first for pages, network-first for API.
 * Version bump triggers cache refresh.
 */

const VERSION = 'yuval-v4';
const STATIC_CACHE = `${VERSION}-static`;
const PAGES_CACHE  = `${VERSION}-pages`;
const PYODIDE_CACHE = `${VERSION}-pyodide`;

// Pyodide CDN URL pattern
const PYODIDE_CDN = 'cdn.jsdelivr.net/pyodide';

// Always cache on install
const PRECACHE = [
  '/',
  '/favicon.svg',
];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', (e) => {
  /* `cache.addAll` is atomic — if any single resource 404s, the whole
     batch rejects and the SW install fails ("Failed to execute 'addAll'
     on 'Cache': Request failed"). Adding entries one by one with their
     own try/catch lets the install succeed even when an asset is
     temporarily missing (e.g. favicon during a redesign). */
  e.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      await Promise.all(
        PRECACHE.map(async (url) => {
          try {
            const res = await fetch(url, { cache: 'reload' });
            if (res.ok) await cache.put(url, res);
          } catch {
            /* ignore — single-asset failure must not abort install */
          }
        }),
      );
    }),
  );
  self.skipWaiting();
});

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== STATIC_CACHE && k !== PAGES_CACHE && k !== PYODIDE_CACHE)
            .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Handle Pyodide CDN requests - cache-first for faster subsequent loads
  if (url.hostname.includes(PYODIDE_CDN) || url.href.includes('pyodide')) {
    e.respondWith(cacheFirst(request, PYODIDE_CACHE));
    return;
  }

  // Only handle same-origin for other requests
  if (url.origin !== self.location.origin) return;

  // Skip search-index and API calls - network only
  if (url.pathname.includes('search-index') || url.pathname.startsWith('/api/')) return;

  // Reading pages - network-first: chapter HTML is actively updated
  // during authoring, so prefer fresh. Fall back to cache only offline.
  // Fixes the symptom where soft-navigating to another chapter showed
  // a stale HTML missing newly-added code blocks until a hard refresh.
  if (url.pathname.startsWith('/read/')) {
    e.respondWith(networkFirst(request, PAGES_CACHE));
    return;
  }

  // Book index pages - cache-first is still fine; they change rarely.
  if (url.pathname.startsWith('/books/')) {
    e.respondWith(cacheFirst(request, PAGES_CACHE));
    return;
  }

  // Static assets (JS, CSS, images, fonts) - cache-first
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff2?|ttf)$/)
  ) {
    e.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Everything else - network-first
  e.respondWith(networkFirst(request, PAGES_CACHE));
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline - page not cached yet.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

