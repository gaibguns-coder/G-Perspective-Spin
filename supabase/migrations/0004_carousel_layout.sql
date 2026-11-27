-- G-Perspective-Spin — detail gerak carousel dan posisi setiap bagian halaman.
-- Jalankan sekali di Supabase SQL Editor setelah 0003_site_content.sql.
-- Idempoten: boleh dijalankan ulang, dan tidak menimpa hasil suntingan admin.

-- ─── 1. site_motion: kolom geometri dan rasa gerak ──────────────────────────
-- Semua memakai IF NOT EXISTS supaya skrip lama tetap aman dijalankan ulang.
alter table public.site_motion add column if not exists orientation text not null default 'horizontal'
  check (orientation in ('horizontal', 'vertical'));
alter table public.site_motion add column if not exists perspective integer not null default 1600
  check (perspective between 400 and 4000);
alter table public.site_motion add column if not exists stage_pct integer not null default 100
  check (stage_pct between 50 and 200);
alter table public.site_motion add column if not exists radius_pct integer not null default 100
  check (radius_pct between 40 and 300);
alter table public.site_motion add column if not exists hover_pct integer not null default 18
  check (hover_pct between 0 and 100);
alter table public.site_motion add column if not exists ease_rate numeric(4, 2) not null default 3.20
  check (ease_rate between 0.50 and 12.00);
alter table public.site_motion add column if not exists fade_pct integer not null default 0
  check (fade_pct between 0 and 90);
alter table public.site_motion add column if not exists deg_per_sec numeric(4, 1) not null default 8.0
  check (deg_per_sec between 1.0 and 30.0);

-- Sudut pandang kini boleh bernilai negatif: positif berarti melihat dari atas,
-- negatif berarti melihat dari bawah. Bawaannya tetap 17 seperti tampilan sekarang.
alter table public.site_motion drop constraint if exists site_motion_view_angle_check;
alter table public.site_motion add constraint site_motion_view_angle_check check (view_angle between -45 and 45);

comment on column public.site_motion.orientation is 'horizontal = kincin berdiri (rotateY), vertical = kincin telentang (rotateX).';
comment on column public.site_motion.view_angle is 'Derajat lihat: positif dari atas, negatif dari bawah, 0 setinggi mata.';
comment on column public.site_motion.perspective is 'Kedalaman perspektif dalam piksel; makin kecil makin dramatis.';
comment on column public.site_motion.stage_pct is 'Besar panggung carousel dibanding bawaan layar.';
comment on column public.site_motion.radius_pct is 'Keliling kincin dalam persen dari jarak otomatis yang pas.';
comment on column public.site_motion.hover_pct is 'Kecepatan tersisa ketika kursor berada di atas kartu, dalam persen.';
comment on column public.site_motion.ease_rate is 'Kelandaian kurva percepatan/perlambatan, makin besar makin cepat bereaksi.';
comment on column public.site_motion.fade_pct is 'Gelap kartu yang membelakangi penonton; 0 berarti semua kartu terangan.';
comment on column public.site_motion.deg_per_sec is 'Derajat per detik pada kecepatan 1x.';

-- ─── 2. site_blocks: satu baris untuk setiap bagian yang bisa digeser ────────
-- site_menus tetap satu-satunya sumber "menyala/matinya" bagian; tabel ini hanya
-- menyimpan geometri, supaya tidak ada dua kebenaran untuk hal yang sama.
create table if not exists public.site_blocks (
  key text primary key,
  label text not null default '',
  hint text not null default '',
  x numeric(5, 2) not null default 0 check (x between -50 and 50),
  y numeric(5, 2) not null default 0 check (y between -40 and 40),
  scale numeric(4, 2) not null default 1.00 check (scale between 0.50 and 2.00),
  z integer not null default 0 check (z between 0 and 30),
  position integer not null default 0,
  updated_at timestamptz not null default now()
);

comment on column public.site_blocks.x is 'Geser mendatar dalam persen lebar layar; 0 = tempat semula.';
comment on column public.site_blocks.y is 'Geser tegak dalam persen tinggi layar; positif ke bawah.';
comment on column public.site_blocks.scale is 'Besar bagian dibanding bawaan.';
comment on column public.site_blocks.z is '0 berarti ikut urutan tumpukan bawaan.';

-- ─── 3. Izin dan keamanan baris untuk site_blocks ────────────────────────────
-- Pola yang sama persis dengan lima tabel konten di 0003 supaya gerbang perannya
-- tidak berbeda antara teks, menu, gerak, dan tata letak.
do $$
begin
  alter table public.site_blocks enable row level security;
  grant select on public.site_blocks to anon, authenticated;
  grant insert, update, delete on public.site_blocks to authenticated;
  grant all on public.site_blocks to service_role;
  revoke truncate, trigger, references on public.site_blocks from anon, authenticated;
  revoke truncate, trigger, references on public.site_blocks from public;

  drop policy if exists site_blocks_read on public.site_blocks;
  create policy site_blocks_read on public.site_blocks for select to anon, authenticated using (true);

  drop policy if exists site_blocks_admin_write on public.site_blocks;
  create policy site_blocks_admin_write on public.site_blocks for all to authenticated
    using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
end $$;

-- ─── 4. Benih blok (hanya menambah yang belum ada) ───────────────────────────
insert into public.site_blocks (key, label, hint, x, y, scale, z, position) values
  ('header',    'Bilah atas',       'Baris logo, penghitung, tautan, dan tombol pengaturan.', 0, 0, 1.00, 0, 1),
  ('intro',     'Judul pembuka',    'Judul besar dan sub judul di atas panggung.',            0, 0, 1.00, 0, 2),
  ('scene',     'Panggung carousel','Ring 3D berikut latar koridor.',                          0, 0, 1.00, 0, 3),
  ('status',    'Chip status',      'Garis penanda "sedang berputar" dan jumlah foto.',        0, 0, 1.00, 0, 4),
  ('playback',  'Panel kontrol',    'Bilah arah, kecepatan, dan tombol jeda.',                 0, 0, 1.00, 0, 5),
  ('music',     'Pemutar musik',    'Kotak hijau melayang di pojok kiri bawah.',               0, 0, 1.00, 0, 6),
  ('sidePanel', 'Panel samping',    'Lemari pengaturan yang membuka dari kanan.',              0, 0, 1.00, 0, 7),
  ('footer',    'Footer',           'Baris merek dan penghitung di dasar layar.',              0, 0, 1.00, 0, 8)
on conflict (key) do update
  set label = excluded.label, hint = excluded.hint, position = excluded.position, updated_at = now();
