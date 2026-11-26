# G-Perspective-Spin

Galeri gambar 3D Carousel yang berputar kanan/kiri dengan kecepatan yang bisa diatur, koridor perspektif berbasis canvas, tema terang/gelap dengan lima palet warna, pemutar musik latar yang bisa digeser, dan panel pengelolaan (CRUD gambar + musik) untuk admin.

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
3. Buat akun admin lewat **Authentication → Users → Add user → Create new user** (jangan lupa matikan "Confirm email" atau gunakan jalur ini supaya akun langsung terkonfirmasi).
4. Ambil UUID akun tersebut, lalu jalankan:

   ```sql
   insert into public.user_roles (user_id, role)
   values ('UUID_AKUN_ANDA', 'admin')
   on conflict (user_id, role) do nothing;
   ```

5. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di `.env`. Kunci hanya boleh berada di berkas `.env` (sudah di-`gitignore`) — jangan ditempel ke obrolan, dokumentasi, atau commit.

Tanpa `.env`, aplikasi tetap tampil dan menampilkan pesan bahwa backend belum disambungkan.

## Struktur

| Lokasi | Isi |
| --- | --- |
| `src/components/Gallery.tsx` | Ring 3D, header, kontrol putaran, viewer penuh |
| `src/components/PerspectiveCorridor.tsx` | Latar koridor canvas 30 FPS |
| `src/components/MusicPlayer.tsx` | Pemutar musik melayang + playlist |
| `src/components/GalleryAdmin.tsx` | Login admin, CRUD gambar, unggah/urut musik |
| `src/lib/gallery.ts` | Lapisan data Supabase (baca, simpan, hapus, unggah) |
| `src/lib/motion.ts` | Sudut pandang, aturan putaran, gerbang peran admin |
| `src/styles.css` | Token tema light/dark + palet + seluruh gaya galeri |

## Aturan teknis

- Publik hanya berhak membaca: tulis, sunting, dan hapus memerlukan peran `admin` yang dibuktikan oleh `has_role` di sisi database (RLS), bukan hanya disembunyikan di UI.
- Rotasi carousel memakai CSS 3D ring dengan perhitungan berbasis delta waktu, bukan interval tetap, agar kecepatannya konsisten pada refresh rate berapa pun.
- Geometry scene (radius, sudut pandang, kanvas) dipisah dari token tema; palet warna hanya menulis ulang variabel CSS.
