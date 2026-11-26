# Petunjuk agen — G-Perspective-Spin

## Arsitektur galeri
- G-Perspective-Spin adalah SPA murni: tidak ada server function. Semua akses data lewat `@supabase/supabase-js` dari browser, dan batas baca/tulis ditegakkan oleh RLS di database, bukan oleh tampilan UI saja.
- Publik hanya boleh membaca `gallery_items`, `songs`, `site_texts`, `site_menus`, `site_appearance`, `site_motion`, `site_info`, dan objek pada bucket `gallery-images` / `songs`. Seluruh INSERT, UPDATE, DELETE dan operasi berkas require peran `admin` lewat `public.has_role(auth.uid(), 'admin')`.
- Setiap data yang tampil di halaman user punya barisnya sendiri: teks di `site_texts` (kolom `body`, `color`, `font`, `visible`), bagian yang bisa dinyalakan di `site_menus` (`enabled`), bawaan tampilan di `site_appearance`, bawaan putaran di `site_motion`, dan metadata dokumen di `site_info` (diterapkan `terapkanMeta()`). Nilai yang bersifat pilihan pengunjung per perangkat — tema, palet, arah, kecepatan — disimpan di `localStorage` kunci `gspin.preferensi` dan hanya menjadi bawaan bila pengunjung belum memilih.
- Geometri scene (radius ring, `VIEW_ANGLE`, kanvas koridor) dipisah dari token tema. Mengganti palet warna hanya menulis ulang variabel CSS di `:root` — jangan hardcode warna di komponen.
- Rotasi carousel harus tetap berbasis delta waktu (`advanceRotation`) supaya kecepatannya tidak berubah pada layar 60 Hz maupun 120 Hz, dan harus berhenti saat hover (bawaan, dapat dimatikan dari `site_motion.pause_on_hover`), viewer terbuka, atau panel pengelolaan terbuka.
- Setiap teks antarmuka, judul meta, dan nama brand memakai **G-Perspective-Spin**. Jangan memperkenalkan kembali nama atau dependensi pembangun pihak ketiga lama.

## Berkas yang tidak boleh sembarangan diubah
- `supabase/migrations/0001_init.sql` — idempoten dan boleh dijalankan ulang. Jika menambah kolom atau policy, tambahkan migrasi bernomor baru daripada mengubah yang sudah dijalankan.
- `src/lib/motion.ts` — `VIEW_ANGLE` 17 derajat dan `INITIAL_SLOT_COUNT` 15 adalah aturan yang sudah divalidasi; ubah hanya bila diminta.

## Verifikasi
- `npm run build` harus bersih (TypeScript `strict` + `noUnusedLocals` aktif).
- `npm test` menjalankan aturan gerak dan gerbang peran.
- Perubahan tampilan diuji di dev server pada lebar desktop dan 360px sebelum dinyatakan selesai.
