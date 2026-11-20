/* History Packs app helper (Harley 2026-11-19). Lets browsers install the game as an app and keeps a
   copy of what was loaded so the app still opens without internet. Always asks the network first, so
   updates show straight away; the saved copy is only used when offline. */
const CACHE = 'history-packs-3.1.1';
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './manifest.webmanifest', './icons/icon-192.png'])).catch(() => undefined));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
      await self.clients.claim();
    })(),
  );
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    (async () => {
      try {
        const res = await fetch(req);
        if (res.ok && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => undefined);
        }
        return res;
      } catch (err) {
        const hit = await caches.match(req, { ignoreSearch: true });
        if (hit) return hit;
        if (req.mode === 'navigate') {
          const page = (await caches.match('./', { ignoreSearch: true })) || (await caches.match('./index.html', { ignoreSearch: true }));
          if (page) return page;
        }
        throw err;
      }
    })(),
  );
});
