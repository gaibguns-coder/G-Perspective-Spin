-- G-Perspective-Spin — gradasi transparansi latar koridor 3D.
-- Jalankan sekali di Supabase SQL Editor setelah 0006_hover_ms.sql.
-- Idempoten: boleh dijalankan ulang, dan tidak menimpa hasil suntingan admin.
--
-- Tanpa kolom ini kanvas PerspectiveCorridor memakai bawaan di bawah, jadi situs
-- tetap tampil normal sebelum skrip dijalankan; hanya penyimpanan dari panel
-- Carousel yang belum bisa (label "koridor" pada pesan gagal menyimpan).

alter table public.site_motion add column if not exists corridor_core_pct integer not null default 95
  check (corridor_core_pct between 20 and 100);
alter table public.site_motion add column if not exists corridor_fade_pct integer not null default 55
  check (corridor_fade_pct between 0 and 100);
alter table public.site_motion add column if not exists corridor_edge_pct integer not null default 14
  check (corridor_edge_pct between 0 and 100);

comment on column public.site_motion.corridor_core_pct is 'Terang garis koridor di titik lenyap, persen. 100 = paling tegas di tengah.';
comment on column public.site_motion.corridor_fade_pct is 'Persen radius layar yang tetap terang penuh; setelah itu garis mulai memudar.';
comment on column public.site_motion.corridor_edge_pct is 'Terang garis yang tersisa di tepi layar, persen. 0 = tepi benar-benar transparan.';
