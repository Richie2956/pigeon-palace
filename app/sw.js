// Pigeon Palace service worker. Cache first, so the whole app works offline after the first load.
// The build stamps the cache name and the asset list.
const CACHE = 'pigeon-care-607666d5a3';
const FONT_CACHE = 'pigeon-care-fonts-v1';
const ASSETS = ["./","./index.html","./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png","./icons/apple-touch-icon.png"];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith('pigeon-care-') && key !== CACHE && key !== FONT_CACHE)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  const font = FONT_HOSTS.includes(url.hostname);
  if (!sameOrigin && !font) return;

  event.respondWith((async () => {
    const cached = await caches.match(request, { ignoreSearch: sameOrigin && request.mode === 'navigate' });
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response && (response.ok || response.type === 'opaque')) {
        const cache = await caches.open(font ? FONT_CACHE : CACHE);
        cache.put(request, response.clone());
      }
      return response;
    } catch (err) {
      if (request.mode === 'navigate') {
        const shell = await caches.match('./index.html');
        if (shell) return shell;
      }
      return Response.error();
    }
  })());
});
