# Petunjuk agen — G-Perspective-Spin

## Arsitektur galeri
- G-Perspective-Spin adalah SPA murni: tidak ada server function. Semua akses data lewat `@supabase/supabase-js` dari browser, dan batas baca/tulis ditegakkan oleh RLS di database, bukan oleh tampilan UI saja.
- Publik hanya boleh membaca `gallery_items`, `songs`, `site_texts`, `site_menus`, `site_blocks`, `site_appearance`, `site_motion`, `site_info`, dan objek pada bucket `gallery-images` / `songs`. Seluruh INSERT, UPDATE, DELETE dan operasi berkas require peran `admin` lewat `public.has_role(auth.uid(), 'admin')`.
- Setiap data yang tampil di halaman user punya barisnya sendiri: teks di `site_texts` (kolom `body`, `color`, `font`, `visible`), bagian yang bisa dinyalakan di `site_menus` (`enabled`), geometri tiap bagian di `site_blocks` (`x`, `y`, `scale`, `z`, `position`), bawaan putaran di `site_motion`, dan metadata dokumen di `site_info` (diterapkan `terapkanMeta()`). Nilai yang bersifat pilihan pengunjung per perangkat — tema, palet, arah, kecepatan — disimpan di `localStorage` kunci `gspin.preferensi` dan hanya menjadi bawaan bila pengunjung belum memilih.
- Geometri scene (radius ring, `VIEW_ANGLE`, kanvas koridor) dipisah dari token tema. Mengganti palet warna hanya menulis ulang variabel CSS di `:root` — jangan hardcode warna di komponen.
- Rotasi carousel harus tetap berbasis delta waktu (`advanceRotation`) supaya kecepatannya tidak berubah pada layar 60 Hz maupun 120 Hz. Kelajuan tidak pernah langsung diputus: nilai `faktor` didekati lewat `easeFaktor` (konstanta waktu `LAJU_EASE`) ke 0 saat viewer atau panel pengelolaan terbuka, dan ke `FAKTOR_KURSI` (18%) saat kursor berada di atas kartu — perilaku bawaan yang bisa dimatikan dari `site_motion.pause_on_hover`. Saat kursor pindah, faktor naik kembali ke 1 dengan kurva yang sama.
- Perluasan kartu saat hover memakai transisi CSS, bukan lompatan `transform`; `prefers-reduced-motion: reduce` mematikan transisi itu sekaligus mencegah `autoplay` berjalan sendiri (lihat `KURANGI_GERAK` di `src/components/Gallery.tsx`).
- Instalasi aplikasi memakai `beforeinstallprompt` (Chrome/Edge/Android). Webview, iOS, dan Firefox tidak pernah mengirim event tersebut, jadi `src/lib/pwa.ts` wajib tetap memberi petunjuk manual per peranti dan salin alamat sebagai jalan pintas — jangan menghilangkan fallback itu meski tombol instal sudah aktif.
- Setiap teks antarmuka, judul meta, dan nama brand memakai **G-Perspective-Spin**. Jangan memperkenalkan kembali nama atau dependensi pembangun pihak ketiga lama.

## Konsol pengelolaan

- Pengelolaan berada di halaman sendiri, `ceopusat/index.html` (entri build ketiga), sehingga alamatnya `/ceopusat/` tanpa `.html`. Komponennya hidup di `src/admin/`; `src/components/GalleryAdmin.tsx` dan `ContentAdmin.tsx` sudah dihapus dan tidak boleh dihidupkan kembali.
- `src/admin/registry.tsx` adalah satu-satunya daftar menu. Menambah bagian berarti menambah satu entri `PANEL` (id, label, grup, ikon, petunjuk, `jenis`, render) — jangan menulis tombol tab atau percabangan `switch` baru di `App.tsx`, dan jangan mengulang judul/sisi kiri di tempat lain.
- `jenis: 'draf'` berarti panel ikut draf bersama dan bar Simpan muncul; `jenis: 'langsung'` berarti panel menulis sendiri (perpustakaan, basis data). Simpan seluruh tabel konten dalam satu `saveContent()` supaya keadaan tidak separuh.
- Gerbang autentikasi hanya satu: `src/admin/store.tsx` memakai `supabase.auth.getSession()` untuk membedakan pengunjung tanpa akun (formulir masuk) dari akun tanpa peran (`bukan-admin`), lalu `checkAdminAccess()`. UI bukan pagar — tulis tetap ditolak RLS.
- Tipografi konsol sengaja kecil (dasar 13px, label 10–12px, judul 15px) dan seluruh gaya tinggal di `src/admin/shell.css`/`fields.css`/`panels/*.css`. `src/styles.css` hanya untuk halaman galeri.
- Warna konsol mengikuti palet yang sedang disunting lewat `terapkanPalet()` di `src/lib/theme.ts` — fungsi yang sama dipakai galeri, jadi jangan menyalin ulang daftar variabel CSS ke komponen.
- Kanvas pada panel **Tata letak** hanya perkiraan: yang disimpan per bagian hanyalah selisih `x`/`y` (persen lebar/tinggi layar), `scale`, dan `z` terhadap `DEFAULT_BLOCKS`. Geometri 3D (`KANVAS`, `VIEW_ANGLE`, radius ring) tetap di `src/lib/motion.ts` dan `src/styles.css`; `site_blocks` tidak boleh menjadi sumber kebenaran bentuk carousel.

## Halaman portofolio

- `portofolio.html` adalah entri build kedua (`utama` + `portofolio` di `vite.config.ts`) dan sengaja **bukan** React: seluruh isinya harus tetap terbaca di HTML awal supaya mesin cari dan pratinjau tautan bekerja. Memindahkan teks karya atau FAQ ke komponen yang di-render saat runtime adalah kesalahan yang harus dicegah, bukan fitur.
- Isinya tidak diambil dari tabel konten mana pun. Nama karya, tautan, dan status akses harus sesuai kenyataan: tautan hanya dipasang ke situs yang menjawab 200, situs privat diberi label "perlu akun", dan proyek yang belum tayang ditulis tanpa tautan. Jangan mengarang harga, jumlah klien, atau rating.
- Jangan menghapus `628xxxxxxxxxx` tanpa menggantinya dengan nomor WhatsApp nyata — tautan `wa.me` yang salah membuat tombol kontak mati, dan nomor itu adalah klaim pemilik yang hanya boleh diisi oleh pemiliknya.
- Gambar pada kartu adalah tangkapan layar asli hasil `tools/gambar.cjs` (sumber 1440×900 → 800×500, kuantisasi 6-bit). Jangan mengganti isinya dengan mockup; kalau sebuah karya belum punya screenshot, tandai sebagai ilustrasi seperti pada kartu galeri 3D.
- `public/sw.js` menyimpan setiap halaman secara terpisah (`url.pathname` sebagai kunci cache): `/`, `/portofolio.html`, dan `/ceopusat/` semuanya ada di `INTI`. Menambah halaman berarti menaikkan `INTI` sekaligus `NAMA_CACHE`.

## Berkas yang tidak boleh sembarangan diubah
- `supabase/migrations/0001_init.sql` — idempoten dan boleh dijalankan ulang. Jika menambah kolom atau policy, tambahkan migrasi bernomor baru daripada mengubah yang sudah dijalankan.
- `src/lib/motion.ts` — `VIEW_ANGLE` 17 derajat dan `INITIAL_SLOT_COUNT` 15 adalah aturan yang sudah divalidasi; ubah hanya bila diminta.
- `public/logo.png` (512px), `public/favicon.png` (64px), dan `public/icons/icon-192.png` / `icon-512.png` / `icon-180.png` (apple-touch-icon) dipakai bersama oleh `index.html`, `manifest.webmanifest`, dan `og_image` di `site_info`. Bila mengganti logo, perbarui seluruh berkas itu agar ukurannya tetap sesuai `sizes` pada manifest, dan sinkronkan daftar `INTI` di `public/sw.js` — menambah atau menghapus aset precache wajib menaikkan nama cache (`gspin-v*`) supaya pengguna lama tidak menahan versi usang.

## Verifikasi
- `npm run build` harus bersih (TypeScript `strict` + `noUnusedLocals` aktif).
- `npm test` menjalankan aturan gerak dan gerbang peran.
- Perubahan tampilan diuji di dev server pada lebar desktop dan 360px sebelum dinyatakan selesai.
