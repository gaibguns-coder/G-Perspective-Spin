import './portofolio.css';

const tahun = document.getElementById('tahun');
if (tahun) tahun.textContent = String(new Date().getFullYear());

/**
 * Daftar teknologi (React, Vite, Supabase, dan sejenisnya) hanya untuk pemilik situs.
 * Sesi dibaca dari penyimpanan lokal lebih dulu: tanpa tanda sesi, modul Supabase
 * tidak ikut diunduh sehingga pengunjung biasa tidak pernah menerima datanya.
 */
const kunciSesi = Object.keys(localStorage).some(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
if (kunciSesi) {
  void import('@/lib/gallery')
    .then(({ checkAdminAccess }) => checkAdminAccess())
    .then(admin => {
      if (admin) document.documentElement.dataset.admin = '1';
    })
    .catch(() => undefined);
}
