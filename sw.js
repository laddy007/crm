const CACHE = 'kotlocrm-v2';
const STATIC = ['./', './index.html', './manifest.json',
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;700&family=DM+Sans:wght@400;500;600&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// manual update: clear index.html from cache so next reload fetches fresh
self.addEventListener('message', e => {
  if (e.data === 'CLEAR_APP_CACHE') {
    caches.open(CACHE).then(c => {
      c.delete('./'); c.delete('./index.html');
      e.source?.postMessage('CACHE_CLEARED');
    });
  }
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => new Response('Offline', { status: 503 }));
    })
  );
});
