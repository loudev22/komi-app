// Komi Service Worker v1.0
const CACHE_NAME = 'komi-v1';

// Archivos a cachear para funcionamiento offline básico
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap'
];

// ── Instalación: pre-cachear assets estáticos ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// ── Activación: limpiar caches viejos ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// ── Fetch: estrategia Network First con fallback a cache ──
// Las llamadas a Supabase y Claude API siempre van a la red (requieren datos frescos).
// Los assets estáticos (HTML, fuentes) se sirven del cache si la red falla.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Supabase y Claude API → siempre red, sin cache
  const isApiCall =
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('anthropic.com');

  if (isApiCall) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Assets estáticos → Network First con fallback a cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, guardarla en cache y devolverla
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Sin red → servir desde cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // Fallback final: devolver el index.html para navegación SPA
          return caches.match('/index.html');
        });
      })
  );
});
