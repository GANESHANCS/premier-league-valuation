const CACHE_NAME = 'pl-valuedge-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-only policy for live backend API calls & external endpoints - NEVER serve stale valuation data from cache
  if (url.pathname.startsWith('/api') || url.pathname.includes('/api/') || url.origin !== self.location.origin) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Navigation requests: fetch network first, fallback to offline application shell index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('./index.html') || caches.match('/index.html');
      })
    );
    return;
  }

  // Cache-first strategy for static application assets (JS, CSS, images, fonts)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});

