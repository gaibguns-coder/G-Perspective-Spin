# G-Perspective-Spin

Galeri gambar 3D Carousel yang berputar kanan/kiri dengan kecepatan yang bisa diatur, koridor perspektif berbasis canvas, panel samping pengaturan (terang/gelap, palet, pasang aplikasi Chrome, layar penuh), pemutar musik latar yang bisa digeser, dan konsol pengelolaan di alamat terpisah **`/ceopusat/`**: CRUD gambar, CRUD musik, serta sunting seluruh teks, menu, tampilan, dan gerak dari database.

Dibangun sebagai SPA **Vite + React 19 + TypeScript + Tailwind v4** dengan **Supabase** sebagai penyimpanan data dan berkas, sehingga hasil sunting admin terlihat oleh semua pengunjung.

## Menjalankan

```sh
npm install
cp .env.example .env      # lalu isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY
npm run dev               # galeri di http://localhost:5175/ dan konsol di http://localhost:5175/ceopusat/
```

`npm run build` menghasilkan folder `dist/` berupa situs statis yang bisa diunggah ke hosting mana pun (Qoder Sites, Netlify, Cloudflare Pages, GitHub Pages). Versi yang tayang saat ini: https://g-perspective-spin-c6vh82w25x7.qoder.website (konsol: tambahkan `/ceopusat/`) — dibangun dari branch `main`, dengan `public/logo.png` (512px), `public/favicon.png` (64px), dan `public/icons/` (192px, 512px, 180px untuk apple-touch-icon) sebagai ikon instalasi.

## Menyiapkan Supabase

1. Buat project Supabase, lalu buka **SQL Editor**.
2. Jalankan isi `supabase/migrations/0001_init.sql` sekali. Skrip ini membuat tabel `gallery_items`, `songs`, `user_roles`, fungsi `has_role`, policy RLS, dua bucket penyimpanan (`gallery-images`, `songs`), dan 15 slot gambar kosong.
3. Jalankan isi `supabase/migrations/0003_site_content.sql` untuk tabel konten tampilan: `site_texts` (satu baris per teks), `site_menus` (satu baris per menu), `site_appearance`, `site_motion`, dan `site_info`. Skrip ini juga mengisi benih dan menghapus `site_settings` bila masih kosong.
4. Jalankan isi `supabase/migrations/0004_carousel_layout.sql` untuk tabel `site_blocks` (geseran `x`/`y`, `scale`, `z`, dan urutan tiap bagian) sekaligus kolom geometri baru pada `site_motion`: `orientation` (horizontal/vertical), `perspective`, `stage_pct`, `radius_pct`, `hover_pct`, `ease_rate`, `fade_pct`, `deg_per_sec`, dan `view_angle` yang kini boleh negatif (melihat dari bawah). Tanpa migrasi ini panel **Carousel** dan **Tata letak** tetap terbuka, tetapi nilainya hanya tersimpan di peramban.
5. Buat akun admin lewat **Authentication → Users → Add user → Create new user** (jangan lupa matikan "Confirm email" atau gunakan jalur ini supaya akun langsung terkonfirmasi).
6. Ambil UUID akun tersebut, lalu jalankan:

   ```sql
   insert into public.user_roles (user_id, role)
   values ('UUID_AKUN_ANDA', 'admin')
   on conflict (user_id, role) do nothing;
   ```

7. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di `.env`. Kunci hanya boleh berada di berkas `.env` (sudah di-`gitignore`) — jangan ditempel ke obrolan, dokumentasi, atau commit.

Tanpa `.env`, aplikasi tetap tampil dan menampilkan pesan bahwa backend belum disambungkan.

## Struktur

| Lokasi | Isi |
| --- | --- |
| `src/components/Gallery.tsx` | Ring 3D, header, kontrol putaran, viewer penuh |
| `src/components/SidePanel.tsx` | Panel samping: terang/gelap, palet, pasang aplikasi, layar penuh |
| `src/components/PerspectiveCorridor.tsx` | Latar koridor canvas 30 FPS |
| `src/components/MusicPlayer.tsx` | Pemutar musik melayang + playlist |
| `src/admin/App.tsx` | Kerangka konsol: gerbang login, bilah kiri, bar Simpan |
| `src/admin/registry.tsx` | Daftar `PANEL` — satu entri untuk setiap menu baru |
| `src/admin/store.tsx` | Muat semua tabel konten, draf bersama, simpan, dan cek peran |
| `src/admin/fields.tsx` | `Grup`, `Baris`, `Sakelar`, `Geser`, `Pilihan`, `Isian` |
| `src/admin/panels/` | Isi tiap menu: teks, menu, carousel, tata letak, tampilan, metadata, basis data, gambar, lagu |
| `src/admin/MiniKarousel.tsx` | Pratinjau ring 3D kecil yang ikut angka yang sedang disunting |
| `ceopusat/index.html` + `main.tsx` | Entri build kedua untuk alamat `/ceopusat/` (tanpa `.html`) |
| `src/components/ui/Switch.tsx` | Toggle bar untuk mengaktifkan menu |
| `src/lib/gallery.ts` | Lapisan data Supabase (baca, simpan, hapus, unggah) |
| `src/lib/settings.ts` | Baca/tulis enam tabel konten + preferensi perangkat |
| `src/lib/theme.ts` | Lima palet warna, varian terang/gelapnya, dan `terapkanPalet()` untuk galeri sekaligus konsol |
| `src/lib/pwa.ts` | Kenali peranti, petunjuk pasang, salin alamat, layar penuh |
| `src/lib/motion.ts` | Aturan putaran bawaan, perlambatan hover, gerbang peran admin |
| `public/sw.js` | Cache inti agar situs bisa dipasang dan dibuka luring |
| `src/styles.css` | Token tema light/dark + palet + seluruh gaya galeri |
| `portofolio.html` | Halaman portofolio: empat karya tayang + dua proyek internal, FAQ, JSON-LD |
| `src/portofolio.css` | Gaya halaman portofolio, menyalin token warna galeri |
| `src/portofolio.ts` | Pengisi tahun di kaki halaman portofolio (satu-satunya skrip di sana) |
| `public/karya/*.png` | Tangkapan layar asli tiap karya (800×500, 6-bit) untuk kartu portofolio |
| `tools/png.cjs` | Pustaka dekode/resample/encode PNG murni Node tanpa dependensi luar |
| `tools/gambar.cjs` | Pembuat thumbnail tangkapan layar, ilustrasi koridor, dan kartu berbagi 1200×630 |

Tabel konten: `site_texts`, `site_menus`, `site_blocks`, `site_appearance`, `site_motion`, `site_info` — setiap data pada halaman punya barisnya sendiri, dibaca saat boot dan ditulis dari konsol. `site_blocks` hanya menyimpan geometri; menyala/matinya bagian tetap milik `site_menus.enabled` supaya tidak ada dua kebenaran untuk hal yang sama.

## Konsol `/ceopusat/`

Halaman pengelolaan berdiri sendiri di alamat `/ceopusat/` (entri build ketiga di `vite.config.ts`, berkasnya `ceopusat/index.html` → `dist/ceopusat/index.html`, jadi tanpa `.html` dan tidak bisa dirayapi mesin cari: `noindex, nofollow`).

- **Satu daftar, semua menu.** `src/admin/registry.tsx` memegang `PANEL`; bilah kiri, judul, isi, dan apakah bar Simpan muncul diambil dari daftar itu. Menambah menu = menambah satu entri, bukan menyalin tombol tab.
- **Empat kelompok:** Konten (Teks, Menu & bagian), Carousel (Carousel, Tata letak), Situs (Tampilan, Metadata, Basis data), Perpustakaan (Gambar galeri, Musik latar).
- **Dua jenis panel.** Panel `draf` menyunting salinan bersama dan baru tayang setelah tombol **Simpan**; panel `langsung` (gambar, lagu, basis data) menulis sendiri per tindakan.
- **Pratinjau hidup.** Palet dan tema yang sedang disunting langsung terlihat di konsol, dan panel Carousel menampilkan ring mini yang ikut angka yang diketik.
- **Gerbang tunggal.** `store.tsx` memeriksa sesi lewat `supabase.auth.getSession()` lalu peran lewat RPC `has_role`; tanpa sesi ditampilkan formulir masuk, bukan pesan "bukan admin". Writing tetap dijaga RLS, bukan disembunyikan UI.
- Saat **Tata letak**, bagian digeser di kanvas perkiraan 16∶10; yang disimpan hanyalah pergeseran (`x`/`y` dalam persen, `scale`, `z`) dari tempat semula, jadi layar dengan tinggi berbeda tetap rapi.

## Pasang sebagai aplikasi

Panel pengaturan (ikon slider di kanan atas) punya grup **Aplikasi**.

- **Chrome, Edge, Android**: bila peramban sudah menyiapkan pemasangan, tombol "Instal sebagai aplikasi …" aktif dan menampilkan dialog pemasangan resmi — hasilnya ikon sendiri di desktop, taskbar, atau layar utama.
- **iPhone/iPad dan Safari**: peramban tidak pernah menawarkan pemasangan, jadi ikuti langkah manual yang dicetak di panel (Bagikan → "Add to Home Screen").
- **Firefox**: tidak memasang situs sebagai aplikasi; panel menyarankan Chrome/Edge.
- **Webview** (halaman yang dibuka di dalam aplikasi lain, termasuk jendela Qoder): tombol tetap nonaktif dan panel menampilkan peringatan serta kolom alamat siap salin. Buka alamat itu di Chrome/Edge untuk memasang.

Persyaratannya sudah dipenuhi: `manifest.webmanifest`, ikon 192px dan 512px, HTTPS, dan service worker `sw.js` dengan handler `fetch`. Service worker hanya didaftarkan pada hasil build (`import.meta.env.PROD`) agar dev server tetap bisa hot reload.

## Halaman portofolio

`portofolio.html` adalah halaman karya yang dibangun dari entri kedua di `vite.config.ts` (`utama` + `portofolio`). Seluruh isinya — judul, kartu karya, FAQ, dan data terstruktur JSON-LD (`ItemList` + `FAQPage`) — ditulis langsung di HTML, jadi mesin cari dan pratinjau tautan membacanya tanpa menjalankan JavaScript; `src/portofolio.ts` hanya mengisi tahun di kaki halaman dan `src/portofolio.css` menyalin token warna galeri.

Tautan pada kartu hanya dipasang ke situs yang benar-benar menjawab HTTP 200. Editor Pola Jahit diberi label "perlu akun" karena situs itu memang privat (401), dan G-Perspective AI Web Builder serta G-Tutorial ditulis sebagai proyek internal tanpa tautan karena belum tayang.

Sebelum halaman ini dipakai promosi:

- Ganti seluruh `628xxxxxxxxxx` di `portofolio.html` dengan nomor WhatsApp asli berkode negara (contoh `6281234567890`). Ada dua tempat: tombol di hero dan tombol di bagian Kontak.
- Galeri 3D masih menampilkan "Galeri belum memiliki gambar" sampai foto asli diunggah dari halaman admin. Kartu pertama sengaja memakai ilustrasi koridor (`public/karya/galeri-3d.png`) karena tangkapan layar situsnya masih kosong — begitu foto terpasang, ganti gambar itu dengan screenshot asli.
- Gambar kartu dibuat ulang dari tangkapan layar 1440×900 dengan perkakas sendiri:
  `node tools/gambar.cjs kecil sumber.png public/karya/nama.png 800 6` lalu
  `node tools/gambar.cjs kartu public/og-portofolio.png 6 public/karya/galeri-3d.png public/karya/deconstruction-store.png public/karya/harvest-days.png public/karya/pola-jahit.png`
- Jangan menambahkan angka harga, jumlah klien, atau rating yang tidak bisa dibuktikan. FAQ sengaja tidak mencantumkan harga karena belum ada daftar tarif yang disepakati.

## Aturan teknis

- Publik hanya berhak membaca: tulis, sunting, dan hapus memerlukan peran `admin` yang dibuktikan oleh `has_role` di sisi database (RLS), bukan hanya disembunyikan di UI.
- Rotasi carousel memakai CSS 3D ring dengan perhitungan berbasis delta waktu, bukan interval tetap, agar kecepatannya konsisten pada refresh rate berapa pun.
- Kursor di atas foto tidak menghentikan putaran, hanya menurunkannya ke 18% lewat kurva eksponensial, lalu naik kembali secara perlahan saat kursor pindah. Pembesaran kartu ikut transisi `cubic-bezier` 1,1 detik.
- `prefers-reduced-motion: reduce` mematikan seluruh transisi dan membuat galeri tidak berputar sendiri saat pertama dibuka; pengunjung tetap bisa menekan tombol putar.
- Geometry scene (radius, sudut pandang, kanvas) dipisah dari token tema; palet warna hanya menulis ulang variabel CSS.
