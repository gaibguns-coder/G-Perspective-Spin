-- G-Perspective-Spin — lama transisi kartu membesar/mengecil saat disorot.
-- Jalankan sekali di Supabase SQL Editor setelah 0005_gallery_image_url.sql.
-- Idempoten: boleh dijalankan ulang dan tidak menimpa angka yang sudah disimpan.

alter table public.site_motion add column if not exists hover_ms integer not null default 1400
  check (hover_ms between 200 and 3000);

comment on column public.site_motion.hover_ms is
  'Milidetik waktu kartu membesar lalu mengecil kembali saat disorot; makin besar makin mengambang.';
