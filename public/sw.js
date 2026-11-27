/* Service worker G-Perspective-Spin — diperlukan supaya peramban menawarkan
   pemasangan aplikasi (ikon sendiri di HP/desktop) dan situs tetap terbuka tanpa jaringan.
   Hanya berkas dari alamat situs ini yang disimpan; gambar dan musik dari Supabase
   selalu diambil segar agar suntingan admin langsung terlihat. */
const NAMA_CACHE = 'gspin-v2';
const INTI = [
  '/',
  '/index.html',
  '/produk.html',
  '/manifest.webmanifest',
  '/logo.png',
  '/og-produk.png',
  '/favicon.png',
  '/icons/icon-180.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(NAMA_CACHE)
      .then(cache => cache.addAll(INTI))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(nama => Promise.all(nama.filter(n => n !== NAMA_CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  const permintaan = event.request;
  if (permintaan.method !== 'GET') return;

  const url = new URL(permintaan.url);
  if (url.origin !== self.location.origin) return;

  if (permintaan.mode === 'navigate') {
    // Halaman galeri dan halaman produk disimpan terpisah, supaya luring membuka
    // halaman yang terakhir dilihat, bukan selalu index.
    const kunci = url.pathname;
    event.respondWith(
      fetch(permintaan)
        .then(jawaban => {
          const salinan = jawaban.clone();
          void caches.open(NAMA_CACHE).then(cache => cache.put(kunci, salinan));
          return jawaban;
        })
        .catch(async () => (await caches.match(kunci)) || (await caches.match('/index.html'))),
    );
    return;
  }

  if (permintaan.destination === 'document') return;

  event.respondWith(
    caches.match(permintaan).then(simpanan => {
      if (simpanan) return simpanan;
      return fetch(permintaan).then(jawaban => {
        if (jawaban.ok) {
          const salinan = jawaban.clone();
          void caches.open(NAMA_CACHE).then(cache => cache.put(permintaan, salinan));
        }
        return jawaban;
      });
    }),
  );
});
