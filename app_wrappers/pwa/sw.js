const CACHE_NAME = 'proofbundle-v1.0.0-alpha.1';
const urlsToCache = [
  '/proofbundle/',
  '/proofbundle/web/proofbundle_v1_0_app.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
