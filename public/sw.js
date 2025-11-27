// KAIZEN Service Worker v1.0.0
// Implements advanced caching strategies for optimal performance

const CACHE_VERSION = 'kaizen-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Assets to cache immediately on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/robots.txt',
];

// CDN domains to cache
const CDN_DOMAINS = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'cdn.jsdelivr.net',
    'unpkg.com',
    'cdnjs.cloudflare.com',
];

// API domains to cache with network-first strategy
const API_DOMAINS = [
    'supabase.co',
];

// Maximum items in dynamic cache
const MAX_DYNAMIC_CACHE = 50;
const MAX_IMAGE_CACHE = 100;
const MAX_API_CACHE = 30;

// Cache expiration (in milliseconds)
const CACHE_EXPIRATION = {
    static: 7 * 24 * 60 * 60 * 1000, // 7 days
    dynamic: 24 * 60 * 60 * 1000, // 1 day
    images: 30 * 24 * 60 * 60 * 1000, // 30 days
    api: 5 * 60 * 1000, // 5 minutes
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys()
            .then((keys) => {
                return Promise.all(
                    keys
                        .filter((key) => key.startsWith('kaizen-') && !key.includes(CACHE_VERSION))
                        .map((key) => {
                            console.log('[SW] Removing old cache:', key);
                            return caches.delete(key);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Utility: Check if URL is from CDN
const isCDNRequest = (url) => {
    return CDN_DOMAINS.some((domain) => url.hostname.includes(domain));
};

// Utility: Check if URL is an API request
const isAPIRequest = (url) => {
    return API_DOMAINS.some((domain) => url.hostname.includes(domain));
};

// Utility: Check if URL is an image
const isImageRequest = (request) => {
    return request.destination === 'image' ||
        /\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$/i.test(request.url);
};

// Utility: Check if URL is a static asset
const isStaticAsset = (request) => {
    return /\.(js|css|woff2?|ttf|eot)$/i.test(request.url);
};

// Utility: Limit cache size
const limitCacheSize = async (cacheName, maxItems) => {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
        await cache.delete(keys[0]);
        await limitCacheSize(cacheName, maxItems);
    }
};

// Strategy: Cache First (for static assets and CDN)
const cacheFirst = async (request, cacheName, maxAge) => {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
        // Check if cache is expired
        const cachedDate = cachedResponse.headers.get('sw-cache-date');
        if (cachedDate) {
            const age = Date.now() - parseInt(cachedDate, 10);
            if (age > maxAge) {
                // Cache expired, fetch new
                return networkFirst(request, cacheName, maxAge);
            }
        }
        return cachedResponse;
    }

    // Not in cache, fetch and cache
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            const responseToCache = networkResponse.clone();

            // Add cache timestamp
            const headers = new Headers(responseToCache.headers);
            headers.append('sw-cache-date', Date.now().toString());

            const modifiedResponse = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers,
            });

            await cache.put(request, modifiedResponse);
        }
        return networkResponse;
    } catch (error) {
        // Network failed, return cached if available
        const cached = await caches.match(request);
        if (cached) return cached;
        throw error;
    }
};

// Strategy: Network First (for API requests)
const networkFirst = async (request, cacheName, maxAge) => {
    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            const responseToCache = networkResponse.clone();

            // Add cache timestamp
            const headers = new Headers(responseToCache.headers);
            headers.append('sw-cache-date', Date.now().toString());

            const modifiedResponse = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers,
            });

            await cache.put(request, modifiedResponse);
            await limitCacheSize(cacheName, MAX_API_CACHE);
        }

        return networkResponse;
    } catch (error) {
        // Network failed, try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
};

// Strategy: Stale While Revalidate (for dynamic content)
const staleWhileRevalidate = async (request, cacheName) => {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    const fetchPromise = fetch(request)
        .then((networkResponse) => {
            if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
                limitCacheSize(cacheName, MAX_DYNAMIC_CACHE);
            }
            return networkResponse;
        })
        .catch(() => cachedResponse);

    return cachedResponse || fetchPromise;
};

// Fetch event - intercept requests
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip chrome-extension and other non-http(s) requests
    if (!url.protocol.startsWith('http')) return;

    // Handle different request types
    if (isAPIRequest(url)) {
        // Network first for API
        event.respondWith(networkFirst(request, API_CACHE, CACHE_EXPIRATION.api));
    } else if (isImageRequest(request)) {
        // Cache first for images
        event.respondWith(cacheFirst(request, IMAGE_CACHE, CACHE_EXPIRATION.images));
    } else if (isCDNRequest(url) || isStaticAsset(request)) {
        // Cache first for CDN and static assets
        event.respondWith(cacheFirst(request, STATIC_CACHE, CACHE_EXPIRATION.static));
    } else if (request.mode === 'navigate') {
        // Network first for navigation (HTML pages)
        event.respondWith(
            networkFirst(request, DYNAMIC_CACHE, CACHE_EXPIRATION.dynamic)
                .catch(() => caches.match('/index.html'))
        );
    } else {
        // Stale while revalidate for everything else
        event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
    }
});

// Background sync for failed requests (future enhancement)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-registrations') {
        event.waitUntil(syncRegistrations());
    }
});

// Push notification support (future enhancement)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'New update from KAIZEN!',
        icon: '/kaizen-logo.png',
        badge: '/kaizen-badge.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
        },
        actions: [
            { action: 'explore', title: 'View Details' },
            { action: 'close', title: 'Close' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification('KAIZEN Tech Fest', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handler for cache management
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((keys) => {
                return Promise.all(keys.map((key) => caches.delete(key)));
            })
        );
    }
});

console.log('[SW] Service Worker loaded');
