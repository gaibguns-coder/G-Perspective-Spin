-- G-Perspective-Spin — satu kartu galeri boleh memakai gambar dari alamat, bukan hanya unggahan Storage.
-- Jalankan sekali setelah 0004_carousel_layout.sql. Idempoten: boleh dijalankan ulang.
-- Kolom ini meniru songs.file_url supaya dua-duanya punya pola yang sama:
-- image_path untuk berkas di bucket, image_url untuk alamat lain (mis. /karya/galeri-3d.png).

alter table public.gallery_items add column if not exists image_url text;

comment on column public.gallery_items.image_url is
  'Alamat gambar lain: relatif (mis. /karya/galeri-3d.png) atau https. Dipakai bila image_path kosong.';
