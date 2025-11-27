// Service Worker para PWA
const CACHE_NAME = 'bobinas-app-v1';
const urlsToCache = [
    '/mobile/',
    '/mobile/index.html',
    '/mobile/styles.css',
    '/mobile/app.js',
    '/mobile/manifest.json'
];

// Instalação
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

// Ativação
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
        })
    );
});

// Fetch (Network First para APIs, Cache First para assets)
self.addEventListener('fetch', event => {
    if (event.request.url.includes('/api/')) {
        // Network First para APIs
        event.respondWith(
            fetch(event.request)
                .catch(() => caches.match(event.request))
        );
    } else {
        // Cache First para assets
        event.respondWith(
            caches.match(event.request)
                .then(response => response || fetch(event.request))
        );
    }
});
