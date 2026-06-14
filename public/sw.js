const CACHE_NAME = 'pulse-history-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/images/napd-altareekh-logo.png'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache).catch(err => console.log('Cache error: ', err)))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request).catch(() => {
                    // Optionally return offline page
                });
            })
    );
});

// Listener for Web Push API Notifications
self.addEventListener('push', function(event) {
    if (!event.data) return;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            const isFocused = windowClients.some(client => client.focused);
            if (isFocused) {
                console.log('[SW] App is focused. Suppressing push notification to avoid UI conflict.');
                return null;
            }

            try {
                const data = event.data.json();
                const options = {
                    body: data.body || 'لديك إشعار جديد في منصة نبض التاريخ',
                    icon: data.icon || '/images/napd-altareekh-logo.png',
                    badge: '/images/napd-altareekh-logo.png',
                    vibrate: [200, 100, 200, 100, 200, 100, 200],
                    data: { url: data.url || '/' },
                    requireInteraction: true
                };
                return self.registration.showNotification(data.title || 'نبض التاريخ', options);
            } catch (err) {
                const options = {
                    body: event.data.text(),
                    icon: '/images/napd-altareekh-logo.png',
                    vibrate: [200, 100, 200],
                    data: { url: '/' }
                };
                return self.registration.showNotification('نبض التاريخ', options);
            }
        })
    );
});

// Listener for interacting with the notification (click)
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            const targetUrl = event.notification.data?.url || '/';
            for (let client of windowClients) {
                if (client.url === targetUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
