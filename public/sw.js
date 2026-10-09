// LitroMetrik PRO - Service Worker litrometrik-v2.9
const CACHE_VERSION = 'litrometrik-v2.9';
const CACHE_NAME = 'litrometrik-cache-' + CACHE_VERSION;

const ASSETS_TO_CACHE = [
  './',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png',
  './telemetry-worker.js'
];

// Install: Cache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing new service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching essential offline assets...');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[SW] Cache addAll warning:', err);
      });
    })
  );
});

// Activate: Purge ALL previous caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new service worker...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting legacy cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch handler: Network-first for code & API, fallback to cache for offline resilience
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Always bypass cache for API routes, live tiles and routes
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('/route/') ||
    url.hostname.includes('google') ||
    url.hostname.includes('openstreetmap') ||
    url.hostname.includes('cartocdn') ||
    url.hostname.includes('mapbox')
  ) {
    return;
  }

  // Network first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          event.request.method === 'GET' &&
          !url.pathname.endsWith('.ts') &&
          !url.pathname.endsWith('.tsx')
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Listen for messages from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
