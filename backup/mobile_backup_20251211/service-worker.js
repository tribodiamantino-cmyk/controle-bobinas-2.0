// Service Worker DESABILITADO TEMPORARIAMENTE - v2.2.0-placa-nocache
// Cache desabilitado para forçar atualização dos arquivos JS

const CACHE_NAME = 'bobinas-app-DISABLED';

// Instalação - NÃO faz cache
self.addEventListener('install', event => {
    console.log('[SW] Service Worker DESABILITADO - sem cache');
    self.skipWaiting();
});

// Ativação - Limpa TODOS os caches
self.addEventListener('activate', event => {
    console.log('[SW] Limpando TODOS os caches...');
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

// Fetch - SEMPRE DA REDE (sem cache)
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .catch(error => {
                console.error('[SW] Fetch offline:', error);
                return new Response('Offline');
            })
    );
});
