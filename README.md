# G-Perspective-Spin

Galeri gambar 3D Carousel yang berputar kanan/kiri dengan kecepatan yang bisa diatur, koridor perspektif berbasis canvas, panel samping pengaturan (terang/gelap, palet, pasang aplikasi Chrome, layar penuh), pemutar musik latar yang bisa digeser, dan panel pengelolaan untuk admin: CRUD gambar, CRUD musik, serta sunting seluruh teks dan menu dari database.

Dibangun sebagai SPA **Vite + React 19 + TypeScript + Tailwind v4** dengan **Supabase** sebagai penyimpanan data dan berkas, sehingga hasil sunting admin terlihat oleh semua pengunjung.

## Menjalankan

```sh
npm install
cp .env.example .env      # lalu isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY
npm run dev               # http://localhost:5175
```

`npm run build` menghasilkan folder `dist/` berupa situs statis yang bisa diunggah ke hosting mana pun (Qoder Sites, Netlify, Cloudflare Pages, GitHub Pages).

## Menyiapkan Supabase

1. Buat project Supabase, lalu buka **SQL Editor**.
2. Jalankan isi `supabase/migrations/0001_init.sql` sekali. Skrip ini membuat tabel `gallery_items`, `songs`, `user_roles`, fungsi `has_role`, policy RLS, dua bucket penyimpanan (`gallery-images`, `songs`), dan 15 slot gambar kosong.
3. Jalankan isi `supabase/migrations/0003_site_content.sql` untuk tabel konten tampilan: `site_texts` (satu baris per teks), `site_menus` (satu baris per menu), `site_appearance`, `site_motion`, dan `site_info`. Skrip ini juga mengisi benih dan menghapus `site_settings` bila masih kosong.
4. Buat akun admin lewat **Authentication → Users → Add user → Create new user** (jangan lupa matikan "Confirm email" atau gunakan jalur ini supaya akun langsung terkonfirmasi).
5. Ambil UUID akun tersebut, lalu jalankan:

   ```sql
   insert into public.user_roles (user_id, role)
   values ('UUID_AKUN_ANDA', 'admin')
   on conflict (user_id, role) do nothing;
   ```

6. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di `.env`. Kunci hanya boleh berada di berkas `.env` (sudah di-`gitignore`) — jangan ditempel ke obrolan, dokumentasi, atau commit.

Tanpa `.env`, aplikasi tetap tampil dan menampilkan pesan bahwa backend belum disambungkan.

## Struktur

| Lokasi | Isi |
| --- | --- |
| `src/components/Gallery.tsx` | Ring 3D, header, kontrol putaran, viewer penuh |
| `src/components/SidePanel.tsx` | Panel samping: terang/gelap, palet, pasang aplikasi, layar penuh |
| `src/components/PerspectiveCorridor.tsx` | Latar koridor canvas 30 FPS |
| `src/components/MusicPlayer.tsx` | Pemutar musik melayang + playlist |
| `src/components/GalleryAdmin.tsx` | Login admin, CRUD gambar, unggah/urut musik, pemilih tab |
| `src/components/ContentAdmin.tsx` | Sunting teks, menu, tampilan, gerak, metadata |
| `src/components/ui/Switch.tsx` | Toggle bar untuk mengaktifkan menu |
| `src/lib/gallery.ts` | Lapisan data Supabase (baca, simpan, hapus, unggah) |
| `src/lib/settings.ts` | Baca/tulis lima tabel konten + preferensi perangkat |
| `src/lib/theme.ts` | Lima palet warna dan varian terang/gelapnya |
| `src/lib/pwa.ts` | Pemasangan aplikasi Chrome dan layar penuh |
| `src/lib/motion.ts` | Aturan putaran bawaan dan gerbang peran admin |
| `src/styles.css` | Token tema light/dark + palet + seluruh gaya galeri |

Tabel konten: `site_texts`, `site_menus`, `site_appearance`, `site_motion`, `site_info` — setiap data pada halaman punya barisnya sendiri, dibaca saat boot dan ditulis ulang dari tab **Teks & Menu**.

## Aturan teknis

- Publik hanya berhak membaca: tulis, sunting, dan hapus memerlukan peran `admin` yang dibuktikan oleh `has_role` di sisi database (RLS), bukan hanya disembunyikan di UI.
- Rotasi carousel memakai CSS 3D ring dengan perhitungan berbasis delta waktu, bukan interval tetap, agar kecepatannya konsisten pada refresh rate berapa pun.
- Geometry scene (radius, sudut pandang, kanvas) dipisah dari token tema; palet warna hanya menulis ulang variabel CSS.
