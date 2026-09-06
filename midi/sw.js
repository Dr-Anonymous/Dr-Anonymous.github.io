const CACHE_NAME = 'midi-patch-changer-cache-v2';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './favicon/favicon.ico',
  './favicon/android-chrome-192x192.png',
  './favicon/android-chrome-512x512.png'
];

// Install event: cache application shell with relative paths
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Fetch event: cache-first with network fallback
self.addEventListener('fetch', event => {
  // Only handle GET requests for same origin or relative assets
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(networkResponse => {
          // If valid response and same origin, we can optionally cache
          return networkResponse;
        });
      })
  );
});

// Activate event: clean up outdated caches and claim clients immediately
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
