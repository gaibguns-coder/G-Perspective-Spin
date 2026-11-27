/**
 * Pembersih nilai kontak. Sengaja berdiri sendiri tanpa impor apa pun: modul ini
 * dipakai bersama oleh konsol (src/lib/settings.ts) dan halaman portofolio
 * (src/portofolio.ts), dan nilai hasilnya masuk ke `href` — jadi hanya karakter yang
 * memang aman untuk sebuah tautan yang boleh lolos.
 */

/**
 * Nomor WhatsApp dalam bentuk yang diterima `wa.me`: digit murni dengan kode negara.
 * `+62 812-3456-7890` dan `0812-3456-7890` sama-sama menjadi `6281234567890`, karena
 * admin mengetik seperti biasa, bukan seperti URL. Angka yang terlalu pendek atau
 * terlalu panjang dianggap kosong supaya tidak ada tombol yang mengarah ke nomor salah.
 */
export function nomorWa(asal: unknown): string {
  const digit = String(asal ?? '').replace(/\D/g, '');
  if (!digit) return '';
  const bermasa = digit.startsWith('62') ? digit : digit.startsWith('0') ? `62${digit.slice(1)}` : digit;
  return bermasa.length >= 8 && bermasa.length <= 15 ? bermasa : '';
}

/**
 * Alamat surel yang aman untuk `mailto:`. Awalan `mailto:` yang terlanjur ditempel
 * dibuang, huruf besar dikecilkan, dan sisanya harus benar-benar berbentuk alamat —
 * kalau tidak, hasilnya kosong.
 */
export function surel(asal: unknown): string {
  const bersih = String(asal ?? '')
    .trim()
    .replace(/^mailto:/i, '')
    .toLowerCase();
  return /^[a-z0-9._%+-]+@[a-z0-9]+(?:\.[a-z0-9]+)*\.[a-z]{2,}$/.test(bersih) ? bersih : '';
}

/** Bagian `?…` dari tautan lama, dipertahankan agar pesan bawaan tombol tidak hilang. */
export function sisaKueri(href: string): string {
  const batas = href.indexOf('?');
  return batas < 0 ? '' : href.slice(batas);
}
