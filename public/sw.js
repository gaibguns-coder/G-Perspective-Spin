/* Service worker G-Perspective-Spin — diperlukan supaya peramban menawarkan
   pemasangan aplikasi (ikon sendiri di HP/desktop) dan situs tetap terbuka tanpa jaringan.
   Hanya berkas dari alamat situs ini yang disimpan; gambar dan musik dari Supabase
   selalu diambil segar agar suntingan admin langsung terlihat. */
const NAMA_CACHE = 'gspin-v7';
const INTI = [
  '/',
  '/index.html',
  '/portofolio.html',
  '/ceopusat',
  '/ceopusat/',
  '/manifest.webmanifest',
  '/logo.png',
  '/og-portofolio.png',
  '/favicon.png',
  '/karya/galeri-3d.png',
  '/karya/deconstruction-store.png',
  '/karya/harvest-days.png',
  '/karya/pola-jahit.png',
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
    // Halaman galeri dan halaman portofolio disimpan terpisah, supaya luring membuka
    // halaman yang terakhir dilihat, bukan selalu index.
    const kunci = url.pathname;
    event.respondWith(
      fetch(permintaan)
        .then(async jawaban => {
          if (!jawaban.ok && kunci !== '/index.html') {
            // Host hanya mem-fallback alamat berakhiran garis miring, jadi /ceopusat
            // dibalas 404. Dokumen root memutuskan sendiri apakah ia menampilkan
            // galeri atau konsol, jadi 404 itu ditukar dengan index tanpa 404 di layar.
            const cadangan = (await caches.match('/index.html')) || (await fetch('/index.html').catch(() => null));
            if (cadangan && cadangan.ok) return cadangan;
          }
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
