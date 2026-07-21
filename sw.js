const CACHE_NAME = 'romeo-pt-v3';
const ASSETS = [
  './',
  './index.html',
  './usuarios.html',
  './rutinas.html',
  './entrenamiento.html',
  './progreso.html',
  './recetas.html',
  './macros.html',
  './styles.css',
  './app.js',
  './shared.js',
  './persist.js',
  './1.jpeg',
  './2.jpeg',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request).catch(() => {});
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
