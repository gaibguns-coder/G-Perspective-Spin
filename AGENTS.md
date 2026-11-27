# Petunjuk agen — G-Perspective-Spin

## Arsitektur galeri
- G-Perspective-Spin adalah SPA murni: tidak ada server function. Semua akses data lewat `@supabase/supabase-js` dari browser, dan batas baca/tulis ditegakkan oleh RLS di database, bukan oleh tampilan UI saja.
- Publik hanya boleh membaca `gallery_items`, `songs`, `site_texts`, `site_menus`, `site_appearance`, `site_motion`, `site_info`, dan objek pada bucket `gallery-images` / `songs`. Seluruh INSERT, UPDATE, DELETE dan operasi berkas require peran `admin` lewat `public.has_role(auth.uid(), 'admin')`.
- Setiap data yang tampil di halaman user punya barisnya sendiri: teks di `site_texts` (kolom `body`, `color`, `font`, `visible`), bagian yang bisa dinyalakan di `site_menus` (`enabled`), bawaan tampilan di `site_appearance`, bawaan putaran di `site_motion`, dan metadata dokumen di `site_info` (diterapkan `terapkanMeta()`). Nilai yang bersifat pilihan pengunjung per perangkat — tema, palet, arah, kecepatan — disimpan di `localStorage` kunci `gspin.preferensi` dan hanya menjadi bawaan bila pengunjung belum memilih.
- Geometri scene (radius ring, `VIEW_ANGLE`, kanvas koridor) dipisah dari token tema. Mengganti palet warna hanya menulis ulang variabel CSS di `:root` — jangan hardcode warna di komponen.
- Rotasi carousel harus tetap berbasis delta waktu (`advanceRotation`) supaya kecepatannya tidak berubah pada layar 60 Hz maupun 120 Hz. Kelajuan tidak pernah langsung diputus: nilai `faktor` didekati lewat `easeFaktor` (konstanta waktu `LAJU_EASE`) ke 0 saat viewer atau panel pengelolaan terbuka, dan ke `FAKTOR_KURSI` (18%) saat kursor berada di atas kartu — perilaku bawaan yang bisa dimatikan dari `site_motion.pause_on_hover`. Saat kursor pindah, faktor naik kembali ke 1 dengan kurva yang sama.
- Perluasan kartu saat hover memakai transisi CSS, bukan lompatan `transform`; `prefers-reduced-motion: reduce` mematikan transisi itu sekaligus mencegah `autoplay` berjalan sendiri (lihat `KURANGI_GERAK` di `src/components/Gallery.tsx`).
- Instalasi aplikasi memakai `beforeinstallprompt` (Chrome/Edge/Android). Webview, iOS, dan Firefox tidak pernah mengirim event tersebut, jadi `src/lib/pwa.ts` wajib tetap memberi petunjuk manual per peranti dan salin alamat sebagai jalan pintas — jangan menghilangkan fallback itu meski tombol instal sudah aktif.
- Setiap teks antarmuka, judul meta, dan nama brand memakai **G-Perspective-Spin**. Jangan memperkenalkan kembali nama atau dependensi pembangun pihak ketiga lama.

## Halaman produk

- `produk.html` adalah entri build kedua (`utama` + `produk` di `vite.config.ts`) dan sengaja **bukan** React: seluruh isinya harus tetap terbaca di HTML awal supaya mesin cari dan pratinjau tautan bekerja. Memindahkan teks harga atau FAQ ke komponen yang di-render saat runtime adalah kesalahan yang harus dicegah, bukan fitur.
- Isinya tidak diambil dari lima tabel konten. Angka harga, batas foto, lama pengerjaan, dan nomor WhatsApp adalah klaim pemilik: jangan mengarang nilai baru, dan jangan menghapus `628xxxxxxxxxx` tanpa menggantinya dengan nomor nyata — tautan `wa.me` yang salah membuat tombol pesan mati.
- `public/sw.js` menyimpan kedua halaman secara terpisah (`url.pathname` sebagai kunci cache), jadi menambah halaman baru berarti menaikkan `INTI` sekaligus `NAMA_CACHE`.

## Berkas yang tidak boleh sembarangan diubah
- `supabase/migrations/0001_init.sql` — idempoten dan boleh dijalankan ulang. Jika menambah kolom atau policy, tambahkan migrasi bernomor baru daripada mengubah yang sudah dijalankan.
- `src/lib/motion.ts` — `VIEW_ANGLE` 17 derajat dan `INITIAL_SLOT_COUNT` 15 adalah aturan yang sudah divalidasi; ubah hanya bila diminta.
- `public/logo.png` (512px), `public/favicon.png` (64px), dan `public/icons/icon-192.png` / `icon-512.png` / `icon-180.png` (apple-touch-icon) dipakai bersama oleh `index.html`, `manifest.webmanifest`, dan `og_image` di `site_info`. Bila mengganti logo, perbarui seluruh berkas itu agar ukurannya tetap sesuai `sizes` pada manifest, dan sinkronkan daftar `INTI` di `public/sw.js` — menambah atau menghapus aset precache wajib menaikkan nama cache (`gspin-v*`) supaya pengguna lama tidak menahan versi usang.

## Verifikasi
- `npm run build` harus bersih (TypeScript `strict` + `noUnusedLocals` aktif).
- `npm test` menjalankan aturan gerak dan gerbang peran.
- Perubahan tampilan diuji di dev server pada lebar desktop dan 360px sebelum dinyatakan selesai.
