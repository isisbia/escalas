const CACHE_NAME = 'escala-v1.18'; // Versão atualizada para 1.18
const ASSETS = [
  './',
  './index.html',
  './style.css?v=1.18',
  './main.js?v=1.18',
  './firebase-config.js',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css',
  'https://cdn.jsdelivr.net/npm/flatpickr/dist/themes/dark.css',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/flatpickr',
  'https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/pt.js'
];

self.addEventListener('install', (e) => {
  self.skipWaiting(); // Força a ativação imediata
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    })
  );
});

self.addEventListener('fetch', (e) => {
  // Estratégia: Tenta rede primeiro, se falhar vai pro cache
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
