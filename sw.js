// Service Worker do site público da Itapevi FM.
// Sobe a versão do cache (CACHE_VERSION) sempre que mudar a lista de arquivos
// ou quiser forçar todo mundo a buscar a versão nova.
const CACHE_VERSION = 'itapevi-fm-v2';
const STATIC_CACHE = `static-${CACHE_VERSION}`;

// Arquivos baixados assim que o Service Worker é instalado, para o site
// abrir instantaneamente (e funcionar offline) nas próximas vezes.
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/logo.jpg',
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Só GET — não interceptar POST/PUT/DELETE (ex: chamadas ao Supabase/API)
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Nunca cachear: o stream de áudio (é ao vivo), dados do Supabase (mudam o
  // tempo todo) ou as Vercel Functions — tudo isso vai direto pra rede.
  if (req.destination === 'audio' || req.destination === 'video') return;
  if (url.hostname.endsWith('.supabase.co')) return;
  if (url.pathname.startsWith('/api/')) return;

  // Navegação (abrir uma página): tenta a rede primeiro (conteúdo sempre
  // atualizado); se não tiver internet, cai pro cache e depois pro offline.html.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match(req).then((cached) => cached || caches.match('/offline.html'))
      )
    );
    return;
  }

  // Demais arquivos (CSS/JS/imagens/fontes): cache primeiro, rede como
  // reforço — e guarda a versão nova no cache para a próxima visita.
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((res) => {
        if (res.ok && url.origin === self.location.origin) {
          const resClone = res.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(req, resClone));
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
