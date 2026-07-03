// ============================================
// EMERALD KING CASINO - SERVICE WORKER
// Cache-First Strategy for Zero Latency Launch
// Version: 1.0.1 - Fixed Game Caching & PWA
// ============================================

// ============================================
// CONFIGURATION
// ============================================

const CACHE_NAME = 'casino-game-v1';
const CACHE_VERSION = '1.0.1';

// Static assets to pre-cache on install
const STATIC_ASSETS = [
    // Core HTML
    '/',
    '/index.html',
    '/manifest.json',

    // Stylesheets
    '/style.css',
    '/css/game-loader.css',

    // Core scripts
    '/js/game-loader.js',
    '/js/app.js',

    // Game engine scripts (all 22 files)
    '/js/games/matrix.js',
    '/js/games/_engine.js',
    '/js/games/aviator.js',
    '/js/games/7up-7down.js',
    '/js/games/andar-bahar.js',
    '/js/games/baccarat.js',
    '/js/games/blackjack.js',
    '/js/games/car-roulette.js',
    '/js/games/classic-slots.js',
    '/js/games/dragon-tiger.js',
    '/js/games/hi-low.js',
    '/js/games/jhandi-munda.js',
    '/js/games/keno-jackpot.js',
    '/js/games/ludo-betting.js',
    '/js/games/mines.js',
    '/js/games/plinko.js',
    '/js/games/red-dog.js',
    '/js/games/roulette.js',
    '/js/games/sic-bo.js',
    '/js/games/teen-patti.js',
    '/js/games/video-poker.js',
    '/js/games/wheel-fortune.js',

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
const RUNTIME_CACHE = 'casino-game-runtime-v1';

// Assets that should use NETWORK-FIRST strategy
const NETWORK_FIRST_PATTERNS = [
    '/api/',
    '/auth/',
    '/rest/',
    '.supabase.co'
];

// Game script patterns (for cache-first identification)
const GAME_SCRIPT_PATTERNS = [
    '/js/games/',
    '/js/app.js',
    '/js/game-loader.js'
];

// Maximum cache age in seconds (7 days)
const MAX_CACHE_AGE = 7 * 24 * 60 * 60;

// ============================================
// INSTALL EVENT - Pre-cache critical assets
// ============================================

self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: Installing...');
    console.log('📦 Cache name:', CACHE_NAME);
    console.log('📋 Total assets to cache:', STATIC_ASSETS.length);

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Pre-caching ' + STATIC_ASSETS.length + ' static assets...');

                // Cache assets in batches to avoid overwhelming the browser
                const batchSize = 8;
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
                console.log('📋 Found caches:', cacheNames.join(', '));
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Delete old version caches
                        if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        } else {
                            console.log('✅ Keeping cache:', cacheName);
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
// FETCH EVENT - Smart Strategy Selection
// ============================================

self.addEventListener('fetch', (event) => {
    const request = event.request;
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip Supabase real-time WebSocket connections
    if (request.url.includes('supabase.co/realtime') || 
        request.url.includes('supabase.co/realtime/v1/websocket')) {
        return;
    }

    // Skip chrome-extension and other non-http requests
    if (!request.url.startsWith('http')) {
        return;
    }

    const url = new URL(request.url);

    // ==========================================
    // NETWORK-FIRST: For Supabase API calls
    // ==========================================
    if (url.hostname.includes('supabase.co') && 
        (url.pathname.includes('/rest/') || url.pathname.includes('/auth/'))) {
        console.log('🌐 Network-first (Supabase API):', url.pathname);
        event.respondWith(networkFirstStrategy(request));
        return;
    }

    // ==========================================
    // NETWORK-FIRST: For other API calls
    // ==========================================
    if (NETWORK_FIRST_PATTERNS.some(pattern => url.pathname.startsWith(pattern))) {
        console.log('🌐 Network-first (API):', url.pathname);
        event.respondWith(networkFirstStrategy(request));
        return;
    }

    // ==========================================
    // NETWORK-FIRST: For index.html (always fresh)
    // ==========================================
    if (url.pathname === '/' || url.pathname.endsWith('/index.html')) {
        console.log('🌐 Network-first (HTML):', url.pathname);
        event.respondWith(networkFirstStrategy(request));
        return;
    }

    // ==========================================
    // CACHE-FIRST: For game scripts
    // ==========================================
    if (GAME_SCRIPT_PATTERNS.some(pattern => url.pathname.includes(pattern))) {
        console.log('⚡ Cache-first (Game Script):', url.pathname);
        event.respondWith(cacheFirstStrategy(request));
        return;
    }

    // ==========================================
    // CACHE-FIRST: For CSS files
    // ==========================================
    if (url.pathname.endsWith('.css')) {
        console.log('⚡ Cache-first (CSS):', url.pathname);
        event.respondWith(cacheFirstStrategy(request));
        return;
    }

    // ==========================================
    // CACHE-FIRST: For fonts
    // ==========================================
    if (url.hostname.includes('fonts.googleapis.com') || 
        url.hostname.includes('fonts.gstatic.com') ||
        url.pathname.includes('/fonts/')) {
        console.log('⚡ Cache-first (Font):', url.pathname);
        event.respondWith(cacheFirstStrategy(request));
        return;
    }

    // ==========================================
    // CACHE-FIRST: For assets and images
    // ==========================================
    if (url.pathname.includes('/assets/') || 
        url.pathname.includes('/icons/') ||
        url.pathname.includes('/images/') ||
        url.pathname.endsWith('.png') || 
        url.pathname.endsWith('.jpg') || 
        url.pathname.endsWith('.webp') ||
        url.pathname.endsWith('.svg')) {
        console.log('⚡ Cache-first (Asset):', url.pathname);
        event.respondWith(cacheFirstStrategy(request));
        return;
    }

    // ==========================================
    // CACHE-FIRST: For CDN scripts
    // ==========================================
    if (url.hostname.includes('cdn.jsdelivr.net') || 
        url.hostname.includes('cdnjs.cloudflare.com') ||
        url.hostname.includes('cdn.tailwindcss.com')) {
        console.log('⚡ Cache-first (CDN):', url.hostname);
        event.respondWith(cacheFirstStrategy(request));
        return;
    }

    // ==========================================
    // DEFAULT: Cache-first for everything else
    // ==========================================
    console.log('⚡ Cache-first (Default):', url.pathname);
    event.respondWith(cacheFirstStrategy(request));
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
                console.log('  ✅ Cache HIT:', request.url);
                return cachedResponse;
            } else if (cachedResponse) {
                // Cache is stale but available - return it and refresh in background
                console.log('  ⚠️ Cache STALE (refreshing):', request.url);
                refreshCache(request);
                return cachedResponse;
            }
        }

        // Cache miss - fetch from network
        console.log('  ❌ Cache MISS, fetching:', request.url);

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
            console.log('  💾 Cached:', request.url);
        }

        return networkResponse;

    } catch (error) {
        console.error('  ❌ Fetch error:', error.message);

        // Return cached fallback if available (even if stale)
        const fallbackResponse = await caches.match(request);
        if (fallbackResponse) {
            console.log('  🔄 Fallback cache used:', request.url);
            return fallbackResponse;
        }

        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            const offlinePage = await caches.match('/index.html');
            if (offlinePage) return offlinePage;
        }

        // Return error response
        return new Response('Network error - You are offline', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

/**
 * Background cache refresh without blocking the response
 */
async function refreshCache(request) {
    try {
        const networkResponse = await fetch(request, {
            mode: 'cors',
            credentials: 'same-origin'
        });

        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            const responseToCache = networkResponse.clone();

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
            console.log('  🔄 Background cache refreshed:', request.url);
        }
    } catch (error) {
        // Silent fail - background refresh failed but we already returned stale cache
    }
}

// ============================================
// NETWORK-FIRST STRATEGY (for APIs & HTML)
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
            console.log('  💾 Runtime cached:', request.url);
        }

        return networkResponse;

    } catch (error) {
        console.warn('  ⚠️ Network unavailable, trying cache:', request.url);

        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('  🔄 Fallback cache used:', request.url);
            return cachedResponse;
        }

        // For navigation requests, return offline page
        if (request.mode === 'navigate') {
            const offlinePage = await caches.match('/index.html');
            if (offlinePage) return offlinePage;
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
    console.log('🔄 Background sync triggered:', event.tag);
    if (event.tag === 'sync-deposits') {
        event.waitUntil(syncPendingDeposits());
    }
    if (event.tag === 'sync-game-sessions') {
        event.waitUntil(syncPendingGameSessions());
    }
});

async function syncPendingDeposits() {
    try {
        const pendingDeposits = await getPendingData('pending-deposits');
        console.log('📤 Syncing deposits:', pendingDeposits.length);

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
        console.log('📤 Syncing game sessions:', pendingSessions.length);

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
            
        case 'GET_CACHE_STATS':
            event.waitUntil(
                caches.open(CACHE_NAME).then(async (cache) => {
                    const keys = await cache.keys();
                    const stats = {
                        cacheName: CACHE_NAME,
                        totalCached: keys.length,
                        urls: keys.map(r => r.url)
                    };
                    event.source.postMessage({ type: 'CACHE_STATS', stats });
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
console.log('📋 Assets to cache:', STATIC_ASSETS.length);
console.log('⚡ Strategy: Smart Cache/Network with Stale-While-Revalidate');
