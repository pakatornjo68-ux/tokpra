/* Offline shell for the web version. Pages are fetched fresh when online
   (so updates show at once) and served from the cache when offline.
   Requests to the database and the assistant are never touched. */
const CACHE = 'tokpra-3.2.3';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './favicon.svg'];
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // Always ask the server (a small "not modified" reply when nothing changed), so a new
  // version shows the next time the app opens instead of after the browser's own cache expires.
  e.respondWith(fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then(res => {
    if (res.ok && !res.redirected) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
});
