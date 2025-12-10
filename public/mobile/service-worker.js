// Service Worker para PWA - v2.2.0-placa
const CACHE_NAME = 'bobinas-app-v2.2.0-placa';
const urlsToCache = [
    '/mobile/',
    '/mobile/index.html',
    '/mobile/styles.css',
    '/mobile/app.js?v=20251210placa',
    '/mobile/manifest.json',
    '/mobile/impressao.html',
    '/mobile/impressao.js?v=20251210placa',
    '/mobile/configurar-impressora.html',
    '/js/bluetooth-printer.js?v=20251210placa'
];

// Instalação
self.addEventListener('install', event => {
    console.log('[SW] Instalando v2.2.0-placa...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Cache criado');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting()) // Ativa imediatamente
    );
});

// Ativação - Limpa caches antigos
self.addEventListener('activate', event => {
    console.log('[SW] Ativando v2.2.0-placa...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Removendo cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Assume controle imediatamente
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
