/* Charts — offline service worker.
   Network-first with cache fallback: online always gets the latest page,
   database and assets; offline serves the last cached copy. Cache keys are
   normalized without the ?v= cache-buster so any cached build satisfies
   an offline load. */

const CACHE = 'charts-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

function cacheKey(req) {
  const url = new URL(req.url);
  if (url.origin === self.location.origin) return url.origin + url.pathname;
  return req.url;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const ours = url.origin === self.location.origin
    ? (url.pathname.startsWith('/charts') || url.pathname.startsWith('/assets/'))
    : /fonts\.(googleapis|gstatic)\.com$/.test(url.host);
  if (!ours) return;

  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(cacheKey(req), copy));
      }
      return res;
    }).catch(() =>
      caches.match(cacheKey(req)).then((hit) => hit || Response.error())
    )
  );
});
