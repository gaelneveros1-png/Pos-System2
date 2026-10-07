/**
 * Service Worker — POS Ventas
 * Estrategia: Cache-first para assets estáticos + Network-first para navegación.
 * Permite uso completamente offline una vez instalado.
 */

const CACHE_NAME = 'pos-ventas-v1';

/** Recursos a pre-cachear en la instalación */
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/js/storage.js',
  '/js/products.js',
  '/js/sales.js',
  '/js/clients.js',
  '/js/scanner.js',
  '/js/stats.js',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-maskable.svg',
];

/** CDN externo que también cacheamos */
const CDN_URLS = [
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
];

// ─── Instalación ────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Cachear assets locales (todos obligatorios)
      await cache.addAll(PRECACHE_URLS);

      // Cachear CDN con manejo de error individual
      for (const url of CDN_URLS) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn('[SW] No se pudo cachear CDN:', url, err.message);
        }
      }
    })
  );

  // Activar inmediatamente sin esperar a que cierren las pestañas anteriores
  self.skipWaiting();
});

// ─── Activación ─────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Eliminando caché antigua:', name);
            return caches.delete(name);
          })
      )
    )
  );

  // Tomar control de todas las pestañas abiertas inmediatamente
  self.clients.claim();
});

// ─── Estrategia de fetch ─────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar peticiones que no sean GET
  if (request.method !== 'GET') return;

  // Ignorar extensiones de Chrome y similares
  if (!url.protocol.startsWith('http')) return;

  // Navegación (HTML) → Network-first con fallback a caché
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // Assets estáticos propios → Cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // CDN externos (html5-qrcode) → Cache-first con fallback a red
  event.respondWith(cacheFirst(request));
});

// ─── Helpers de estrategia ──────────────────────────────────────────────────

/**
 * Cache-first: sirve desde caché; si no está, busca en red y guarda.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Sin red y sin caché → respuesta vacía de error
    return new Response('Sin conexión y recurso no encontrado en caché.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

/**
 * Network-first: intenta red; si falla, sirve desde caché (ideal para HTML).
 */
async function networkFirstWithFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || caches.match('/index.html');
  }
}

// ─── Mensajes desde la app ───────────────────────────────────────────────────

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
