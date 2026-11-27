import './portofolio.css';
import { nomorWa, sisaKueri, surel } from '@/lib/kontak';

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

/**
 * Nomor WhatsApp dan alamat email tombol kontak disunting dari konsol
 * (Metadata → Kontak portofolio). Nilainya dibaca lewat REST biasa, bukan supabase-js,
 * supaya halaman ini tetap tidak menarik chunk Supabase untuk pengunjung. Angka yang
 * tertanam di HTML tetap menjadi bawaan — itulah yang dibaca mesin cari dan pratinjau
 * tautan — dan href hanya ditimpa bila kolomnya terisi serta bentuknya sah. Pesan
 * bawaan tiap tombol (?text=…, ?subject=…) dipertahankan dari HTML aslinya.
 */
const urlSupabase = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const kunciAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
if (urlSupabase && kunciAnon) {
  fetch(`${urlSupabase}/rest/v1/site_info?id=eq.1&select=whatsapp,email`, {
    headers: { apikey: kunciAnon, authorization: `Bearer ${kunciAnon}` },
  })
    .then(jawab => (jawab.ok ? jawab.json() : null))
    .then(baris => {
      const wa = nomorWa(Array.isArray(baris) ? baris[0]?.whatsapp : '');
      const email = surel(Array.isArray(baris) ? baris[0]?.email : '');
      const pasang = (kunci: string, dasar: string) => {
        if (!dasar) return false;
        let kena = false;
        document.querySelectorAll<HTMLAnchorElement>(`a[data-kontak="${kunci}"]`).forEach(tautan => {
          tautan.setAttribute('href', `${dasar}${sisaKueri(tautan.getAttribute('href') ?? '')}`);
          kena = true;
        });
        return kena;
      };
      const adaNomor = pasang('wa', wa ? `https://wa.me/${wa}` : '');
      const adaSurel = pasang('email', email ? `mailto:${email}` : '');
      if (adaNomor && adaSurel) document.querySelector('[data-kontak-catat]')?.remove();
    })
    .catch(() => undefined);
}
