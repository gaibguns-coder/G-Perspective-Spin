# G-Perspective-Spin

Galeri gambar 3D Carousel yang berputar kanan/kiri dengan kecepatan yang bisa diatur, koridor perspektif berbasis canvas, panel samping pengaturan (terang/gelap, palet, pasang aplikasi Chrome, layar penuh), pemutar musik latar yang bisa digeser, dan konsol pengelolaan di alamat terpisah **`/ceopusat`**: CRUD gambar, CRUD musik, serta sunting seluruh teks, menu, tampilan, dan gerak dari database.

Dibangun sebagai SPA **Vite + React 19 + TypeScript + Tailwind v4** dengan **Supabase** sebagai penyimpanan data dan berkas, sehingga hasil sunting admin terlihat oleh semua pengunjung.

## Menjalankan

```sh
npm install
cp .env.example .env      # lalu isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY
npm run dev               # galeri di http://localhost:5175/ dan konsol di http://localhost:5175/ceopusat
```

`npm run build` menghasilkan folder `dist/` berupa situs statis yang bisa diunggah ke hosting mana pun (Qoder Sites, Netlify, Cloudflare Pages, GitHub Pages). Versi yang tayang saat ini: https://g-perspective-spin-c6vh82w25x7.qoder.website (konsol: tambahkan `/ceopusat`) — dibangun dari branch `main`, dengan `public/logo.png` (512px), `public/favicon.png` (64px), dan `public/icons/` (192px, 512px, 180px untuk apple-touch-icon) sebagai ikon instalasi.

## Menyiapkan Supabase

1. Buat project Supabase, lalu buka **SQL Editor**.
2. Jalankan isi `supabase/migrations/0001_init.sql` sekali. Skrip ini membuat tabel `gallery_items`, `songs`, `user_roles`, fungsi `has_role`, policy RLS, dua bucket penyimpanan (`gallery-images`, `songs`), dan 15 slot gambar kosong.
3. Jalankan isi `supabase/migrations/0003_site_content.sql` untuk tabel konten tampilan: `site_texts` (satu baris per teks), `site_menus` (satu baris per menu), `site_appearance`, `site_motion`, dan `site_info`. Skrip ini juga mengisi benih dan menghapus `site_settings` bila masih kosong.
4. Jalankan isi `supabase/migrations/0004_carousel_layout.sql` untuk tabel `site_blocks` (geseran `x`/`y`, `scale`, `z`, dan urutan tiap bagian) sekaligus kolom geometri baru pada `site_motion`: `orientation` (horizontal/vertical), `perspective`, `stage_pct`, `radius_pct`, `hover_pct`, `ease_rate`, `fade_pct`, `deg_per_sec`, dan `view_angle` yang kini boleh negatif (melihat dari bawah). Tanpa migrasi ini panel **Carousel** dan **Tata letak** tetap terbuka, tetapi nilainya hanya tersimpan di peramban. Lanjutkan dengan `supabase/migrations/0005_gallery_image_url.sql` (kolom `image_url` pada `gallery_items`), `0006_hover_ms.sql` (lama sorot kartu), dan `0007_corridor_fade.sql` — tiga kolom `corridor_core_pct`, `corridor_fade_pct`, `corridor_edge_pct` pada `site_motion` yang menjadi sumber slider **Carousel → Gradasi latar koridor**. Selama 0007 belum dijalankan, koridor tetap tampil dengan bawaan (95 / 55 / 14) dan hanya label "koridor" yang muncul di pesan gagal menyimpan. Terakhir `0008_kontak.sql` — kolom `whatsapp` dan `email` pada `site_info` untuk panel **Metadata → Kontak portofolio**; sama seperti di atas, selama 0008 belum jalan hanya label "kontak" yang gagal dan seluruh metadata halaman tetap tersimpan.
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
| `src/admin/boot.tsx` | Titik masuk konsol: judul, `noindex`, palet awal, lalu render |
| `src/lib/routes.ts` | Kenali `/ceopusat` dari dokumen root sehingga alamatnya tanpa `.html` |
| `src/components/ui/Switch.tsx` | Toggle bar untuk mengaktifkan menu |
| `src/lib/gallery.ts` | Lapisan data Supabase (baca, simpan, hapus, unggah) |
| `src/lib/settings.ts` | Baca/tulis enam tabel konten + preferensi perangkat |
| `src/lib/theme.ts` | Lima palet warna, varian terang/gelapnya, dan `terapkanPalet()` untuk galeri sekaligus konsol |
| `src/lib/pwa.ts` | Kenali peranti, petunjuk pasang, salin alamat, layar penuh |
| `src/lib/motion.ts` | Aturan putaran bawaan, perlambatan hover, gerbang peran admin |
| `public/sw.js` | Cache inti agar situs bisa dipasang dan dibuka luring |
| `src/styles.css` | Token tema light/dark + palet + seluruh gaya galeri |
| `portofolio.html` | Halaman portofolio: empat karya tayang + dua proyek internal, FAQ, JSON-LD |
| `src/portofolio.css` | Gaya halaman portofolio: latar hitam polos, tanpa garis pembatas bercahaya |
| `src/portofolio.ts` | Pengisi tahun di kaki halaman portofolio (satu-satunya skrip di sana) |
| `public/karya/*.png` | Tangkapan layar asli tiap karya (800×500, 6-bit) untuk kartu portofolio |
| `tools/png.cjs` | Pustaka dekode/resample/encode PNG murni Node tanpa dependensi luar |
| `tools/gambar.cjs` | Pembuat thumbnail tangkapan layar, ilustrasi koridor, dan kartu berbagi 1200×630 |

Tabel konten: `site_texts`, `site_menus`, `site_blocks`, `site_appearance`, `site_motion`, `site_info` — setiap data pada halaman punya barisnya sendiri, dibaca saat boot dan ditulis dari konsol. `site_blocks` hanya menyimpan geometri; menyala/matinya bagian tetap milik `site_menus.enabled` supaya tidak ada dua kebenaran untuk hal yang sama.

### Membuat menu dan halaman baru

Panel **Halaman** di konsol membuat halaman sendiri tanpa menyentuh database secara manual. Karena kolom `key` pada `site_texts` dan `site_menus` berupa `text primary key` bebas (bukan enum), satu halaman baru hanya menulis tiga baris biasa — **tidak perlu migrasi SQL**:

| Baris | Tabel | `key` | Isi |
| --- | --- | --- | --- |
| Menu | `site_menus` | `hal:<slug>` | nama di bilah atas, urutan, dan tuasa tampil |
| Judul | `site_texts` | `hal:<slug>:judul` | judul + warna + jenis huruf |
| Isi | `site_texts` | `hal:<slug>:isi` | paragraf; baris kosong berpindah paragraf |

`slug` diturunkan dari nama menu (`slugBersih()`), dan bila sudah dipakai akan diberi akhiran `-2`, `-3`. Halaman dibuka lewat **rute hash** `#/hal/<slug>`, bukan path: host hanya mem-fallback path yang berakhiran garis miring, sehingga path dalam bentuk apa pun berisiko balas 404, sedangkan hash tidak pernah dikirim ke server. Galeri membaca hash di `src/components/Gallery.tsx` dan merender `src/components/HalamanKustom.tsx`; tautan **Kembali** mengembalikan pengunjung ke galeri. Menekan Simpan setelah menghapus halaman ikut membuang baris `hal:%` yang tidak ada lagi di draf (`saveContent()` menyapu baris yatim), jadi halaman tidak meninggalkan sisa.

## Konsol `/ceopusat`

Pengelolaan berada di alamat sendiri, **`/ceopusat`** — tanpa `.html`. Konsol bukan entri build ketiga: `src/main.tsx` mengenali alamat itu lewat `ruteKonsol()` dan memuat `src/admin/boot.tsx` sebagai chunk terpisah, sehingga pengunjung galeri tetap tidak menanggung kode pengelola. Konsol memasang `noindex, nofollow` sendiri sehingga tidak dirayapi.

Perilaku host yang sudah diukur pada rilis ini (`prepare_site` dengan `spa: true`):

| Alamat | Balasan host |
| --- | --- |
| `/ceopusat/` | 200 — `index.html` (fallback hanya untuk path berakhiran garis miring) |
| `/ceopusat` | **404** — `spa: true` tidak mem-fallback path tanpa garis miring |
| `/portofolio.html`, `/index.html`, `/` | 200 seperti adanya |

Karena itu `public/sw.js` menjembatani bentuk tanpa garis miring: permintaan navigasi yang dibalas bukan-200 ditukar dengan `index.html` dari cache, jadi alamat tetap terbaca `/ceopusat` dan tidak ada halaman 404 di layar. Konsekuensinya, service worker harus sudah terpasang lebih dulu — masuk dari halaman galeri (tautan **Konsol**), atau buka sekali `/ceopusat/` pada peramban yang benar-benar baru, setelah itu `/ceopusat` selalu bisa dipakai langsung dan bisa di-bookmark.

- **Satu daftar, semua menu.** `src/admin/registry.tsx` memegang `PANEL`; bilah kiri, judul, isi, dan apakah bar Simpan muncul diambil dari daftar itu. Menambah menu = menambah satu entri, bukan menyalin tombol tab.
- **Empat kelompok + satu layar ikhtisar.** `Ikhtisar` (kelompok Konsol) adalah panel pertama yang dilihat: miniatur putaran, kisi angka nyata (teks tampil, tuas nyala, halaman kustom, posisi slot, jumlah foto, jumlah lagu), daftar "yang perlu ditindak", dan pintasan ke sembilan panel lainnya. Sisanya: Konten (Teks, Menu & bagian, Halaman), Carousel (Carousel, Tata letak), Situs (Tampilan, Metadata, Basis data), Perpustakaan (Gambar galeri, Musik latar).
- **Dua jenis panel.** Panel `draf` menyunting salinan bersama dan baru tayang setelah tombol **Simpan**; panel `langsung` (gambar, lagu, basis data) menulis sendiri per tindakan.
- **Pratinjau hidup.** Palet dan tema yang sedang disunting langsung terlihat di konsol, dan panel Carousel menampilkan ring mini yang ikut angka yang diketik.
- **Gerbang tunggal.** `store.tsx` memeriksa sesi lewat `supabase.auth.getSession()` lalu peran lewat RPC `has_role`; tanpa sesi ditampilkan formulir masuk, bukan pesan "bukan admin". Menulis tetap dijaga RLS, bukan disembunyikan UI.
- **Mengisi layar, tidak dipotong.** Cangkang setinggi jendela pada semua lebar (`height: 100svh`, `overflow: hidden`): kepala dan bilah diam, hanya `.ad-utama` yang menggulir, dan bar Simpan adalah kaki cangkang di luar area gulir — bukan `position: sticky`, yang dulu mengambang di atas baris terakhir panel. Di bawah 900px bilah menjadi laci. Kanvas 16∶10 pada panel **Tata letak** dibatasi dari tinggi layar (`max-width: calc(min(52svh, 560px) * 1.6)`) supaya tidak terpotong di jendela pendek.
- Saat **Tata letak**, bagian digeser di kanvas perkiraan 16∶10; yang disimpan hanyalah pergeseran (`x`/`y` dalam persen, `scale`, `z`) dari tempat semula, jadi layar dengan tinggi berbeda tetap rapi.

## Pasang sebagai aplikasi

Panel pengaturan (ikon slider di kanan atas) punya grup **Aplikasi**.

- **Chrome, Edge, Android**: bila peramban sudah menyiapkan pemasangan, tombol "Instal sebagai aplikasi …" aktif dan menampilkan dialog pemasangan resmi — hasilnya ikon sendiri di desktop, taskbar, atau layar utama.
- **iPhone/iPad dan Safari**: peramban tidak pernah menawarkan pemasangan, jadi ikuti langkah manual yang dicetak di panel (Bagikan → "Add to Home Screen").
- **Firefox**: tidak memasang situs sebagai aplikasi; panel menyarankan Chrome/Edge.
- **Webview** (halaman yang dibuka di dalam aplikasi lain, termasuk jendela Qoder): tombol tetap nonaktif dan panel menampilkan peringatan serta kolom alamat siap salin. Buka alamat itu di Chrome/Edge untuk memasang.

Persyaratannya sudah dipenuhi: `manifest.webmanifest`, ikon 192px dan 512px, HTTPS, dan service worker `sw.js` dengan handler `fetch`. Service worker hanya didaftarkan pada hasil build (`import.meta.env.PROD`) agar dev server tetap bisa hot reload.

## Halaman portofolio

`portofolio.html` adalah halaman karya yang dibangun dari entri kedua di `vite.config.ts` (`utama` + `portofolio`). Seluruh isinya — judul, kartu karya, FAQ, dan data terstruktur JSON-LD (`ItemList` + `FAQPage`) — ditulis langsung di HTML, jadi mesin cari dan pratinjau tautan membacanya tanpa menjalankan JavaScript; `src/portofolio.ts` hanya mengisi tahun di kaki halaman dan `src/portofolio.css` memakai token warnanya sendiri di atas latar `#000000`; antarbagian dipisahkan oleh jarak, bukan garis, sama seperti halaman galeri yang sekarang polos.

Tautan pada kartu hanya dipasang ke situs yang benar-benar menjawab HTTP 200. Editor Pola Jahit tidak dipasang sebagai kartu karena pekerjaannya belum selesai; tangkapan layarnya disimpan di `tools/arsip/` supaya bisa dipasang lagi nanti. G-Perspective AI Web Builder serta G-Tutorial ditulis sebagai proyek internal tanpa tautan karena belum tayang — situs G-Tutorial sudah dihapus (`lifecycle: deleted`, menjawab HTTP 404), jadi tidak boleh ditautkan sampai tayang lagi dan benar-benar bisa dibuka.

Sebelum halaman ini dipakai promosi:

- Nomor WhatsApp dan alamat email cukup diisi dari **konsol → Metadata → Kontak portofolio** (kolom `whatsapp` dan `email` pada `site_info`, dari `supabase/migrations/0008_kontak.sql`); `src/portofolio.ts` membaca keduanya lewat REST biasa lalu menimpa `href` tombolnya, jadi berkas ini tidak perlu disentuh lagi. Nomor boleh diketik apa adanya (`0812-3456-7890` atau `+62 812 3456 7890`) karena yang tersimpan adalah digit berkode negara. Selama kolom itu masih kosong, `portofolio.html` menampilkan `628xxxxxxxxxx` dan `email-anda@domainanda.com` — dan angka itulah yang dibaca mesin cari serta pratinjau tautan, jadi sebelum halaman ini dipakai promosi isilah kolomnya (atau tanam angka aslinya di HTML). `wa.me` dan `mailto:` yang fiktif membuat pesan calon klien hilang tanpa pemberitahuan.
- Sebelas dari empat belas bingkai galeri belum punya foto asli. Untuk sementara bingkai itu diisi gambar **dan** teks contoh yang dibangkitkan kode — `contohSlot()` untuk SVG bertuliskan CONTOH, `contohTeks()` untuk judul serta ceritanya (`src/lib/contoh.ts`) — supaya terowongan tidak bolong dan viewer tidak membaca "Gambar 06". Ini bukan baris basis data: unggah foto asli dari halaman admin, lalu gambar dan teks contoh hilang sendiri. Sebelum dipakai promosi, ganti juga judul/isi tiap baris `gallery_items` dengan cerita karya yang sebenarnya. Kartu pertama di halaman portofolio masih memakai ilustrasi koridor (`public/karya/galeri-3d.png`) karena tangkapan layar situsnya belum ada — begitu foto terpasang, ganti gambar itu dengan screenshot asli.
- Gambar kartu dibuat ulang dari tangkapan layar 1440×900 dengan perkakas sendiri:
  `node tools/gambar.cjs kecil sumber.png public/karya/nama.png 800 6` lalu
  `node tools/gambar.cjs kartu public/og-portofolio.png 6 public/karya/galeri-3d.png public/karya/deconstruction-store.png public/karya/harvest-days.png`
  Tiga sumber ditata dua kartu di atas dan satu kartu melebar di bawah; empat sumber memakai kisi 2×2.
- Jangan menambahkan angka harga, jumlah klien, atau rating yang tidak bisa dibuktikan. FAQ sengaja tidak mencantumkan harga karena belum ada daftar tarif yang disepakati.

## Aturan teknis

- Publik hanya berhak membaca: tulis, sunting, dan hapus memerlukan peran `admin` yang dibuktikan oleh `has_role` di sisi database (RLS), bukan hanya disembunyikan di UI.
- Rotasi carousel memakai CSS 3D ring dengan perhitungan berbasis delta waktu, bukan interval tetap, agar kecepatannya konsisten pada refresh rate berapa pun.
- Kursor di atas foto tidak menghentikan putaran, hanya menurunkannya ke 18% lewat kurva eksponensial, lalu naik kembali secara perlahan saat kursor pindah. Pembesaran kartu ikut transisi `cubic-bezier` 1,1 detik.
- `prefers-reduced-motion: reduce` mematikan seluruh transisi dan membuat galeri tidak berputar sendiri saat pertama dibuka; pengunjung tetap bisa menekan tombol putar.
- Geometry scene (radius, sudut pandang, kanvas) dipisah dari token tema; palet warna hanya menulis ulang variabel CSS.
