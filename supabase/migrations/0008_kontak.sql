-- G-Perspective-Spin — nomor WhatsApp dan alamat email yang bisa disunting admin.
-- Jalankan sekali di Supabase SQL Editor setelah 0007_corridor_fade.sql.
-- Idempoten: boleh dijalankan ulang dan tidak menimpa nilai yang sudah diisi.
--
-- Kedua kolom ini hanya dipakai tombol halaman /portofolio.html. Nilai kosong berarti
-- halaman itu tetap memakai angka yang tertanam di HTML, sehingga mesin cari dan
-- pratinjau tautan selalu punya sesuatu untuk dibaca.
--
-- Cek bentuk ditulis di sini sebagai pagar terakhir: konsol sudah menormalkan nomor
-- ke digit berkode negara dan email ke huruf kecil, jadi data yang lolos ke Postgres
-- selalu aman untuk ditaruh di dalam href.

alter table public.site_info add column if not exists whatsapp text not null default ''
  check (whatsapp ~ '^$|^[0-9]{8,15}$');
alter table public.site_info add column if not exists email text not null default ''
  check (email ~ '^$|^[a-z0-9._%+-]+@[a-z0-9]+(\.[a-z0-9]+)*\.[a-z]{2,}$');

comment on column public.site_info.whatsapp is 'Nomor WhatsApp tombol portofolio, digit murni berkode negara, mis. 6281234567890. Kosong = pakai bawaan HTML.';
comment on column public.site_info.email is 'Alamat email tombol "Kirim email" di portofolio, huruf kecil. Kosong = pakai bawaan HTML.';
