// KR8TIV Launchpad Service Worker
const CACHE_NAME = 'kr8tiv-v1';
const OFFLINE_URL = '/offline';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// API routes that should never be cached
const API_PATTERNS = [
  '/api/',
  'helius',
  'solana',
  'rpc',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Take control immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// Helper to check if request should bypass cache
function shouldBypassCache(request) {
  const url = request.url;

  // Never cache API requests
  if (API_PATTERNS.some(pattern => url.includes(pattern))) {
    return true;
  }

  // Never cache POST/PUT/DELETE
  if (request.method !== 'GET') {
    return true;
  }

  // Never cache websocket upgrades
  if (request.headers.get('upgrade') === 'websocket') {
    return true;
  }

  return false;
}

// Fetch event - network first, cache fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET and API requests
  if (shouldBypassCache(event.request)) {
    return;
  }

  // Navigation requests - network first with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful navigation responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          console.log('[SW] Navigation failed, serving offline page');
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // Static assets - cache first, network fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // Return cached but also update cache in background
        event.waitUntil(
          fetch(event.request).then((response) => {
            if (response.ok) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, response);
              });
            }
          }).catch(() => {
            // Network failed, but we have cache
          })
        );
        return cached;
      }

      // Not in cache, fetch from network
      return fetch(event.request).then((response) => {
        if (response.ok && event.request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }

  if (event.data === 'clearCache') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[SW] Cache cleared');
    });
  }
});

// Background sync for offline actions (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-actions') {
    console.log('[SW] Background sync triggered');
    // Handle background sync for offline actions
  }
});
