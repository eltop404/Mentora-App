// Anti-Cache Service Worker - Unregisters itself and clears ALL caches immediately
// This file exists ONLY to unregister old/legacy service workers and purge their caches.

self.addEventListener('install', (event) => {
  // Skip waiting to become active immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Delete all old caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[SW] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Unregister self after cleanup
      return self.registration.unregister();
    }).then(() => {
      console.log('[SW] All caches cleared and SW unregistered.');
      // Reload all controlled clients to get fresh content
      return self.clients.matchAll({ type: 'window' });
    }).then((clients) => {
      clients.forEach((client) => {
        client.navigate(client.url);
      });
    })
  );
  return self.clients.claim();
});

// Pass ALL fetch requests directly to network - NO caching whatsoever
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
