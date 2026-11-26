-- G-Perspective-Spin — pengaturan konten (teks & menu yang bisa diedit admin)
-- Jalankan sekali di Supabase SQL Editor. Idempoten: boleh dijalankan ulang.

-- ─── 5. Pengaturan tampilan ─────────────────────────────────────────────────
-- Satu baris (key = 'ui') memuat seluruh dokumen teks dan menu, sehingga
-- front-end cukup satu kali baca saat boot dan admin menyimpan perubahan
-- secara atomik. Nilai bawaan tetap tinggal di kode (src/lib/settings.ts);
-- baris ini hanya menyimpan selisih hasil edit, lalu digabung saat dimuat.
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.site_settings is
  'Dokumen pengaturan tampilan situs. Dibaca anonim, ditulis hanya peran admin.';

alter table public.site_settings enable row level security;

grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;
grant all  on public.site_settings to service_role;

-- Hak bawaan Supabase ikut memberi TRUNCATE yang menembus RLS, jadi dicabut:
-- TRUNCATE tidak tunduk pada policy, sehingga kunci anon tidak boleh pegang.
revoke truncate, trigger, references on public.site_settings from anon, authenticated;
revoke truncate, trigger, references on public.site_settings from public;

drop policy if exists site_settings_read on public.site_settings;
create policy site_settings_read on public.site_settings
  for select to anon, authenticated using (true);

drop policy if exists admin_site_settings_insert on public.site_settings;
create policy admin_site_settings_insert on public.site_settings
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists admin_site_settings_update on public.site_settings;
create policy admin_site_settings_update on public.site_settings
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists admin_site_settings_delete on public.site_settings;
create policy admin_site_settings_delete on public.site_settings
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
