// ═══════════════════════════════════════════════════
// Service Worker — Buscador SKUs Sigma
// Permite que la app funcione SIN INTERNET
// ═══════════════════════════════════════════════════

const CACHE_NAME = 'buscador-skus-sigma-v1';

// Archivos que se guardan para uso offline
const ARCHIVOS = [
  './',
  './index.html'
];

// Al instalar: guardar los archivos en caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ARCHIVOS))
      .then(() => self.skipWaiting())
  );
});

// Al activar: limpiar cachés viejos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

// Al pedir un archivo: primero busca en caché (offline), si no, va a internet
self.addEventListener('fetch', (event) => {
  // Solo manejar peticiones GET del mismo origen
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cacheado) => {
      if (cacheado) return cacheado;

      return fetch(event.request)
        .then((respuesta) => {
          // Guardar en caché las nuevas peticiones exitosas del mismo origen
          if (respuesta && respuesta.status === 200 && respuesta.type === 'basic') {
            const copia = respuesta.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
          }
          return respuesta;
        })
        .catch(() => {
          // Si no hay internet y piden la página, devolver el index cacheado
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
