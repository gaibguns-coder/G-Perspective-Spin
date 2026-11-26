-- G-Perspective-Spin — skema awal
-- Jalankan sekali di Supabase SQL Editor. Idempoten: boleh dijalankan ulang.

-- ─── 1. Peran akun ──────────────────────────────────────────────────────────
create type public.app_role as enum ('admin', 'user');

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

drop policy if exists own_role_read on public.user_roles;
create policy own_role_read on public.user_roles
  for select to authenticated using (user_id = auth.uid());

grant select on public.user_roles to authenticated;
grant all  on public.user_roles to service_role;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

revoke all on function public.has_role(uuid, public.app_role) from public;
revoke execute on function public.has_role(uuid, public.app_role) from anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

-- ─── 2. Item galeri ─────────────────────────────────────────────────────────
create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  description text not null default '',
  image_path text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.gallery_items enable row level security;

grant select on public.gallery_items to anon, authenticated;
grant insert, update, delete on public.gallery_items to authenticated;
grant all on public.gallery_items to service_role;

drop policy if exists public_gallery_read on public.gallery_items;
create policy public_gallery_read on public.gallery_items
  for select to anon, authenticated using (true);

drop policy if exists admin_gallery_insert on public.gallery_items;
create policy admin_gallery_insert on public.gallery_items
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists admin_gallery_update on public.gallery_items;
create policy admin_gallery_update on public.gallery_items
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists admin_gallery_delete on public.gallery_items;
create policy admin_gallery_delete on public.gallery_items
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- ─── 3. Daftar lagu ─────────────────────────────────────────────────────────
create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  file_path text not null,
  file_url text not null default '',
  position integer not null default 0,
  created_at timestamptz not null default now()
);

comment on column public.songs.position is
  'Urutan putar manual, terkecil lebih dulu; dikelola admin lewat drag-and-drop.';

alter table public.songs enable row level security;

grant select on public.songs to anon, authenticated;
grant insert, update, delete on public.songs to authenticated;
grant all on public.songs to service_role;

drop policy if exists public_song_read on public.songs;
create policy public_song_read on public.songs
  for select to anon, authenticated using (true);

drop policy if exists admin_song_insert on public.songs;
create policy admin_song_insert on public.songs
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists admin_song_update on public.songs;
create policy admin_song_update on public.songs
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists admin_song_delete on public.songs;
create policy admin_song_delete on public.songs
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- ─── 4. Penyimpanan berkas ──────────────────────────────────────────────────
-- Bucket dibuat public karena G-Perspective-Spin adalah situs statis tanpa server
-- untuk menukar URL bertanda tangan. Penulisan tetap dikunci ke peran admin.
insert into storage.buckets (id, name, public)
values ('gallery-images', 'gallery-images', true)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('songs', 'songs', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists gallery_file_read on storage.objects;
create policy gallery_file_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'gallery-images');

drop policy if exists gallery_file_insert on storage.objects;
create policy gallery_file_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'gallery-images' and public.has_role(auth.uid(), 'admin'));

drop policy if exists gallery_file_update on storage.objects;
create policy gallery_file_update on storage.objects
  for update to authenticated
  using (bucket_id = 'gallery-images' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'gallery-images' and public.has_role(auth.uid(), 'admin'));

drop policy if exists gallery_file_delete on storage.objects;
create policy gallery_file_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'gallery-images' and public.has_role(auth.uid(), 'admin'));

drop policy if exists song_file_read on storage.objects;
create policy song_file_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'songs');

drop policy if exists song_file_insert on storage.objects;
create policy song_file_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'songs' and public.has_role(auth.uid(), 'admin'));

drop policy if exists song_file_delete on storage.objects;
create policy song_file_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'songs' and public.has_role(auth.uid(), 'admin'));

-- ─── 5. Isian awal 15 slot kosong ───────────────────────────────────────────
insert into public.gallery_items (title, position)
select 'Gambar ' || lpad(n::text, 2, '0'), n
from generate_series(1, 15) as n
where not exists (select 1 from public.gallery_items);
