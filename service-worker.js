// ============================================
// EMERALD KING CASINO - SERVICE WORKER
// Cache-First Strategy for Zero Latency Launch
// Version: 1.0.0
// ============================================

// ============================================
// CONFIGURATION
// ============================================

const CACHE_NAME = 'emerald-casino-v1.0.0';
const CACHE_VERSION = '1.0.0';

// Static assets to pre-cache on install
const STATIC_ASSETS = [
    // Core HTML
    '/',
    '/index.html',

    // Stylesheets
    '/style.css',

    // Core scripts
    '/script.js',

    // Game engine scripts (critical path)
    '/js/games/matrix.js',
    '/js/games/teen-patti.js',
    '/js/games/andar-bahar.js',
    '/js/games/aviator.js',
    '/js/games/roulette.js',
    '/js/games/blackjack.js',
    '/js/games/baccarat.js',
    '/js/games/jhandi-munda.js',
    '/js/games/dragon-tiger.js',
    '/js/games/7up-7down.js',
    '/js/games/car-roulette.js',
    '/js/games/ludo-betting.js',
    '/js/games/plinko.js',
    '/js/games/mines.js',
    '/js/games/wheel-fortune.js',
    '/js/games/classic-slots.js',
    '/js/games/video-poker.js',
    '/js/games/red-dog.js',
    '/js/games/sic-bo.js',
    '/js/games/hi-low.js',
    '/js/games/keno-jackpot.js',
    '/js/app.js',
    '/js/auth.js',
    '/js/payment.js',
    '/js/supabase-config.js',

    // Icons
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-152x152.png',
    '/icons/icon-180x180.png',
    '/icons/icon-192x192.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png',
    '/icons/maskable-icon-512x512.png',

    // External CDN (cached for offline fallback)
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Dynamic cache for runtime assets
const RUNTIME_CACHE = 'emerald-casino-runtime-v1.0.0';

// Assets that should ALWAYS be fetched from network first
const NETWORK_FIRST_ASSETS = [
    '/api/',
    '/auth/',
    '/rest/'
];

// Maximum cache age in seconds (7 days)
const MAX_CACHE_AGE = 7 * 24 * 60 * 60;

// ============================================
// INSTALL EVENT - Pre-cache critical assets
// ============================================

self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Pre-caching ' + STATIC_ASSETS.length + ' static assets...');

                // Cache assets in batches to avoid overwhelming the browser
                const batchSize = 10;
                const batches = [];

                for (let i = 0; i < STATIC_ASSETS.length; i += batchSize) {
                    const batch = STATIC_ASSETS.slice(i, i + batchSize);
                    batches.push(
                        Promise.allSettled(
                            batch.map(url =>
                                cache.add(url).catch(err => {
                                    console.warn('⚠️ Failed to cache:', url, err.message);
                                    // Don't fail the whole batch for one asset
                                    return Promise.resolve();
                                })
                            )
                        )
                    );
                }

                return Promise.all(batches);
            })
            .then(() => {
                console.log('✅ All static assets cached successfully');
                // Force activation without waiting for old tabs
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Cache installation error:', error);
            })
    );
});

// ============================================
// ACTIVATE EVENT - Clean old caches
// ============================================

self.addEventListener('activate', (event) => {
    console.log('🔧 Service Worker: Activating...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Delete old version caches
                        if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker activated');
                // Take control of all clients immediately
                return self.clients.claim();
            })
    );
});

// ============================================
// FETCH EVENT - Cache-First Strategy
// ============================================

self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip Supabase real-time WebSocket connections
    if (event.request.url.includes('supabase.co/realtime')) {
        return;
    }

    // Skip chrome-extension and other non-http requests
    if (!event.request.url.startsWith('http')) {
        return;
    }

    const url = new URL(event.request.url);

    // Network-first for API calls
    if (NETWORK_FIRST_ASSETS.some(path => url.pathname.startsWith(path))) {
        event.respondWith(networkFirstStrategy(event.request));
        return;
    }

    // Cache-first for static assets and navigation
    event.respondWith(cacheFirstStrategy(event.request));
});

// ============================================
// CACHE-FIRST STRATEGY
// ============================================

async function cacheFirstStrategy(request) {
    try {
        // Check cache first
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            // Validate cache freshness
            const cacheTime = getCacheTime(cachedResponse);
            const now = Date.now();

            if (cacheTime && (now - cacheTime) < MAX_CACHE_AGE * 1000) {
                // Cache is fresh, return it
                console.log('⚡ Cache hit:', request.url);
                return cachedResponse;
            }
        }

        // Cache miss or expired - fetch from network
        console.log('🌐 Network fetch:', request.url);

        const networkResponse = await fetch(request, {
            mode: 'cors',
            credentials: 'same-origin'
        });

        // Cache the new response (only if valid)
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            const responseToCache = networkResponse.clone();

            // Add timestamp header for cache validation
            const headers = new Headers(responseToCache.headers);
            headers.append('sw-cached-at', Date.now().toString());

            const cachedResponse = new Response(
                await responseToCache.blob(),
                {
                    status: responseToCache.status,
                    statusText: responseToCache.statusText,
                    headers: headers
                }
            );

            await cache.put(request, cachedResponse);
            console.log('💾 Cached:', request.url);
        }

        return networkResponse;

    } catch (error) {
        console.error('❌ Fetch error:', error.message);

        // Return cached fallback if available
        const fallbackResponse = await caches.match(request);
        if (fallbackResponse) {
            console.log('🔄 Fallback cache used:', request.url);
            return fallbackResponse;
        }

        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            return caches.match('/index.html');
        }

        // Return error response
        return new Response('Network error', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// ============================================
// NETWORK-FIRST STRATEGY (for APIs)
// ============================================

async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request, {
            mode: 'cors',
            credentials: 'same-origin'
        });

        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;

    } catch (error) {
        console.warn('⚠️ Network unavailable, trying cache:', request.url);

        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        return new Response(JSON.stringify({ error: 'Network unavailable' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getCacheTime(response) {
    try {
        const cachedAt = response.headers.get('sw-cached-at');
        return cachedAt ? parseInt(cachedAt) : null;
    } catch (error) {
        return null;
    }
}

// ============================================
// BACKGROUND SYNC (for offline deposits)
// ============================================

self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-deposits') {
        event.waitUntil(syncPendingDeposits());
    }
    if (event.tag === 'sync-game-sessions') {
        event.waitUntil(syncPendingGameSessions());
    }
});

async function syncPendingDeposits() {
    try {
        // Get pending deposits from IndexedDB
        const pendingDeposits = await getPendingData('pending-deposits');

        for (const deposit of pendingDeposits) {
            try {
                await fetch('/api/deposits', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(deposit)
                });
                await removePendingData('pending-deposits', deposit.id);
                console.log('✅ Synced deposit:', deposit.id);
            } catch (err) {
                console.error('❌ Sync failed for deposit:', deposit.id);
            }
        }
    } catch (error) {
        console.error('❌ Background sync error:', error);
    }
}

async function syncPendingGameSessions() {
    try {
        const pendingSessions = await getPendingData('pending-sessions');

        for (const session of pendingSessions) {
            try {
                await fetch('/api/game-sessions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(session)
                });
                await removePendingData('pending-sessions', session.id);
                console.log('✅ Synced game session:', session.id);
            } catch (err) {
                console.error('❌ Sync failed for session:', session.id);
            }
        }
    } catch (error) {
        console.error('❌ Background sync error:', error);
    }
}

// Simple IndexedDB helpers (avoid external dependencies)
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('emerald-casino-db', 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('pending-data')) {
                db.createObjectStore('pending-data', { keyPath: 'id' });
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

async function getPendingData(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('pending-data', 'readonly');
        const store = transaction.objectStore('pending-data');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result.filter(d => d.type === storeName));
        request.onerror = (e) => reject(e.target.error);
    });
}

async function removePendingData(storeName, id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('pending-data', 'readwrite');
        const store = transaction.objectStore('pending-data');
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = (e) => reject(e.target.error);
    });
}

// ============================================
// PUSH NOTIFICATIONS
// ============================================

self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();

        const options = {
            body: data.body || 'New notification from Emerald King Casino',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            vibrate: [200, 100, 200],
            data: {
                url: data.url || '/index.html',
                timestamp: Date.now()
            },
            actions: data.actions || [],
            tag: data.tag || 'default'
        };

        event.waitUntil(
            self.registration.showNotification(
                data.title || 'Emerald King Casino',
                options
            )
        );
    } catch (error) {
        console.error('❌ Push notification error:', error);
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/index.html';

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((windowClients) => {
            // Check if there's already a tab open
            for (const client of windowClients) {
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Open new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// ============================================
// MESSAGE HANDLING (from main thread)
// ============================================

self.addEventListener('message', (event) => {
    console.log('📨 SW Message received:', event.data);

    switch (event.data.type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;

        case 'CLEAR_CACHE':
            event.waitUntil(
                caches.delete(CACHE_NAME).then(() => {
                    console.log('🗑️ Cache cleared by request');
                })
            );
            break;

        case 'UPDATE_CACHE':
            event.waitUntil(
                caches.open(CACHE_NAME).then((cache) => {
                    return cache.add(event.data.url);
                })
            );
            break;

        default:
            console.log('ℹ️ Unknown message type:', event.data.type);
    }
});

// ============================================
// SERVICE WORKER READY
// ============================================

console.log('🛡️ Emerald King Casino - Service Worker Ready');
console.log('📦 Cache:', CACHE_NAME);
console.log('⚡ Strategy: Cache-First with Network Fallback');
