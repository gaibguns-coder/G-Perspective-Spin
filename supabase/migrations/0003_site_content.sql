-- G-Perspective-Spin — setiap data yang tampil di halaman user dan admin punya tabel sendiri.
-- Jalankan sekali di Supabase SQL Editor. Idempoten: boleh dijalankan ulang.
-- Benih hanya mengisi baris yang belum ada, sehingga hasil suntingan admin tidak pernah tertimpa.

-- ─── 1. Teks: satu baris untuk setiap teks di depan ─────────────────────────
create table if not exists public.site_texts (
  key text primary key,
  label text not null default '',
  body text not null default '',
  color text not null default '',
  font text not null default '',
  visible boolean not null default true,
  position integer not null default 0,
  updated_at timestamptz not null default now()
);

comment on column public.site_texts.body is 'Teks yang ditampilkan; color dan font kosong berarti ikut tema.';
comment on column public.site_texts.visible is 'Sembunyikan teks tanpa menghapus bagian depannya.';

-- ─── 2. Menu: satu baris untuk setiap bagian yang bisa dinyalakan ────────────
create table if not exists public.site_menus (
  key text primary key,
  label text not null default '',
  hint text not null default '',
  enabled boolean not null default true,
  position integer not null default 0,
  updated_at timestamptz not null default now()
);

-- ─── 3. Tampilan bawaan untuk pengunjung baru ───────────────────────────────
create table if not exists public.site_appearance (
  id integer primary key default 1 check (id = 1),
  theme text not null default 'dark' check (theme in ('dark', 'light')),
  color_theme text not null default 'cyan'
    check (color_theme in ('cyan', 'matrix', 'synthwave', 'blueprint', 'monochrome')),
  updated_at timestamptz not null default now()
);

-- ─── 4. Gerak carousel bawaan ───────────────────────────────────────────────
create table if not exists public.site_motion (
  id integer primary key default 1 check (id = 1),
  direction text not null default 'left' check (direction in ('left', 'right')),
  speed numeric(3, 1) not null default 1.0 check (speed between 0.2 and 3),
  autoplay boolean not null default true,
  pause_on_hover boolean not null default true,
  view_angle integer not null default 17 check (view_angle between 0 and 45),
  slot_count integer not null default 15 check (slot_count between 3 and 40),
  updated_at timestamptz not null default now()
);

-- ─── 5. Metadata halaman: judul, deskripsi, kartu berbagi ───────────────────
create table if not exists public.site_info (
  id integer primary key default 1 check (id = 1),
  page_title text not null default 'G-Perspective-Spin — Galeri Gambar 3D',
  meta_description text not null default 'Galeri gambar 3D berperspektif dengan putaran dua arah, kecepatan yang dapat diatur, dan tampilan gambar penuh.',
  og_title text not null default 'G-Perspective-Spin — Galeri Gambar 3D',
  og_description text not null default 'Koleksi gambar dalam gerak, dilihat dari sudut pandang baru.',
  og_image text not null default '/logo.png',
  theme_color text not null default '#0c0f17',
  lang text not null default 'id',
  updated_at timestamptz not null default now()
);

-- ─── 6. Izin dan keamanan baris ────────────────────────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array['site_texts', 'site_menus', 'site_appearance', 'site_motion', 'site_info'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    -- Hak bawaan Supabase melewati RLS, jadi dicabut dari publik.
    execute format('revoke truncate, trigger, references on public.%I from anon, authenticated', t);
    execute format('revoke truncate, trigger, references on public.%I from public', t);

    execute format('drop policy if exists %I_read on public.%I', t, t);
    execute format('create policy %I_read on public.%I for select to anon, authenticated using (true)', t, t);
    execute format('drop policy if exists %I_admin_write on public.%I', t, t);
    execute format(
      'create policy %I_admin_write on public.%I for all to authenticated
         using (public.has_role(auth.uid(), %L)) with check (public.has_role(auth.uid(), %L))',
      t, t, 'admin', 'admin'
    );
  end loop;
end $$;

-- ─── 7. Benih teks ─────────────────────────────────────────────────────────
insert into public.site_texts (key, label, body, color, font, visible, position) values
  ('brand',           'Merek (bilah atas)',            'G-Perspective-Spin', '', '', true, 1),
  ('photoLabel',      'Label penghitung',               'Photo', '', '', true, 2),
  ('introTitle',      'Judul utama',                    'Galeri keluarga', '', 'Space Grotesk', true, 3),
  ('introSubtitle',   'Sub judul',                      'Keluarga adalah tempat terhangat dalam hidupmu.', '', 'Caveat', true, 4),
  ('directionLabel',  'Label arah putaran',             'Arah putaran', '', '', true, 5),
  ('speedLabel',      'Label kecepatan',                'Kecepatan', '', '', true, 6),
  ('statusRunning',   'Status sedang berputar',         'Sedang berputar', '', '', true, 7),
  ('statusPaused',    'Status dijeda',                  'Dijeda', '', '', true, 8),
  ('tileEmpty',       'Teks kotak tanpa gambar',        'Belum ada gambar', '', '', true, 9),
  ('tileNoDesc',      'Teks tanpa deskripsi',           'Belum ada deskripsi.', '', '', true, 10),
  ('emptyGallery',    'Pesan galeri kosong',            'Galeri belum memiliki gambar.', '', '', true, 11),
  ('viewerEmpty',     'Pesan layar penuh kosong',       'Belum ada gambar', '', '', true, 12),
  ('playlistHeading', 'Judul daftar lagu',              'Daftar Lagu', '', '', true, 13)
on conflict (key) do update
  set label = excluded.label, position = excluded.position, updated_at = now();

-- ─── 8. Benih menu ─────────────────────────────────────────────────────────
insert into public.site_menus (key, label, hint, enabled, position) values
  ('header',      'Bilah atas',         'Logo, nama merek, dan penghitung foto.', true, 1),
  ('intro',       'Judul pembuka',      'Judul besar dan sub judul di atas koridor.', true, 2),
  ('corridor',    'Latar koridor 3D',   'Kanvas garis perspektif di belakang foto.', true, 3),
  ('status',      'Chip status',        'Tanda "Sedang berputar" dan jumlah foto.', true, 4),
  ('playback',    'Panel kontrol',      'Bilah arah, kecepatan, dan jeda di bawah koridor.', true, 5),
  ('direction',   'Tombol arah',        'Panah kiri dan kanan di dalam panel kontrol.', true, 6),
  ('speed',       'Slider kecepatan',   'Pengatur 0,2x sampai 3x.', true, 7),
  ('music',       'Pemutar musik',      'Kotak hijau di pojok kiri bawah.', true, 8),
  ('sidePanel',   'Tombol pengaturan',  'Ikon slider pembuka panel samping.', true, 9),
  ('footer',      'Footer',             'Baris merek dan penghitung di dasar layar.', true, 10),
  ('adminButton', 'Tombol kelola',      'Hanya muncul untuk akun admin.', true, 11)
on conflict (key) do update
  set label = excluded.label, hint = excluded.hint, position = excluded.position, updated_at = now();

-- ─── 9. Benih baris tunggal ────────────────────────────────────────────────
insert into public.site_appearance (id, theme, color_theme) values (1, 'dark', 'cyan')
on conflict (id) do nothing;

insert into public.site_motion (id, direction, speed, autoplay, pause_on_hover, view_angle, slot_count)
values (1, 'left', 1.0, true, true, 17, 15)
on conflict (id) do nothing;

insert into public.site_info (id, page_title, meta_description, og_title, og_description, og_image, theme_color, lang)
values (
  1,
  'G-Perspective-Spin — Galeri Gambar 3D',
  'Galeri gambar 3D berperspektif dengan putaran dua arah, kecepatan yang dapat diatur, dan tampilan gambar penuh.',
  'G-Perspective-Spin — Galeri Gambar 3D',
  'Koleksi gambar dalam gerak, dilihat dari sudut pandang baru.',
  '/logo.png',
  '#0c0f17',
  'id'
)
on conflict (id) do nothing;

-- ─── 10. Rapihkan: blob JSON lama dibersihkan bila memang tidak terisi ──────
-- site_settings dipakai sementara sebelum setiap data punya tabel sendiri.
do $$
begin
  if exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
             where n.nspname = 'public' and c.relname = 'site_settings') then
    if not exists (select 1 from public.site_settings) then
      drop table public.site_settings;
    end if;
  end if;
end $$;
