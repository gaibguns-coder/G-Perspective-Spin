import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { ExternalLink, Eye, EyeOff, Lock, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Save, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BRAND } from '@/lib/motion';
import { colorThemes, terapkanPalet } from '@/lib/theme';
import { NOT_CONFIGURED_MESSAGE } from '@/lib/supabase';
import { useAdmin, useSesi } from './store';
import { GRUP, PANEL, type PanelDef } from './registry';
import { useBilah } from './bilah';
import './shell.css';

function idDariAlamat(): string {
  const mentah = window.location.hash.replace(/^#\/?/, '');
  return PANEL.some(p => p.id === mentah) ? mentah : PANEL[0].id;
}

/** Pesan Supabase diterjemahkan ke tindakan yang bisa dilakukan pengelola. */
function petunjukGalat(galat: string) {
  if (/too many|rate limit/i.test(galat)) return 'Terlalu banyak percobaan dari alamat ini. Tunggu sekitar satu menit, lalu coba sekali lagi.';
  if (/not confirmed/i.test(galat)) return 'Akunnya ada tapi email belum dikonfirmasi. Di Supabase → Authentication → Users, tekan "Confirm email".';
  if (/invalid_credentials|Invalid login/i.test(galat))
    return 'Email itu tidak terdaftar di project Supabase yang dipakai situs ini, atau sandinya berbeda. Cek Supabase → Authentication → Users dan pastikan alamatnya sama persis.';
  if (/Failed to fetch|NetworkError|fetch/i.test(galat))
    return 'Permintaan tidak sampai ke Supabase — biasanya diblokir perluasan pemblokir iklan atau jaringan.';
  if (/42P01|42703|Could not find the table|does not exist/i.test(galat))
    return 'Kolom atau tabelnya belum ada di project ini: jalankan isi supabase/migrations/0004_carousel_layout.sql di Supabase → SQL Editor, lalu tekan Simpan lagi. Skripnya boleh diulang dan tidak menimpa suntingan.';
  if (/42501|row-level security|permission denied/i.test(galat))
    return 'Policy menolak tulisan: akun ini belum punya peran admin. Jalankan insert public.admins pada project ini, lalu masuk ulang.';
  return '';
}

/** Pintu masuk: tanpa peran admin, konsol tidak menampilkan apa-apa selain formulir. */
function Pintu() {
  const { gerbang, masuk, keluar, email } = useSesi();
  const [alamat, setAlamat] = useState('');
  const [sandi, setSandi] = useState('');
  const [lihatSandi, setLihatSandi] = useState(false);
  const [sedang, setSedang] = useState(false);
  const [galat, setGalat] = useState('');

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setSedang(true);
    setGalat(await masuk(alamat, sandi));
    setSandi('');
    setSedang(false);
  }

  return (
    <main className="ad-pintu">
      <div className="ad-pintu-kartu">
        <span className="ad-pintu-lencana" aria-hidden="true">
          <span />
          <span />
          <ShieldCheck className="size-7 text-primary" />
        </span>
        <h1>Konsol {BRAND}</h1>
        {gerbang === 'tanpa-backend' ? (
          <p>{NOT_CONFIGURED_MESSAGE}</p>
        ) : gerbang === 'memeriksa' ? (
          <p>Memeriksa akses…</p>
        ) : (
          <>
            {gerbang === 'bukan-admin' && (
              <p>
                Akun <b>{email || 'yang sedang masuk'}</b> belum punya peran <code>admin</code>. Keluar dulu, lalu masuk
                dengan akun admin.
              </p>
            )}
            {gerbang === 'belum-masuk' && (
              <p>Masuk dengan akun yang memiliki peran admin. Batas tulis ditegakkan oleh policy database, bukan oleh halaman ini.</p>
            )}
            {gerbang === 'bukan-admin' && (
              <Button type="button" variant="outline" onClick={() => void keluar()}>
                <LogOut className="size-4" />
                Keluar akun
              </Button>
            )}
            <form className="ad-pintu-form" onSubmit={kirim}>
              <label>
                Email
                <input type="email" autoComplete="username" required value={alamat} onChange={e => setAlamat(e.target.value)} />
              </label>
              <label>
                Kata sandi
                <span className="ad-pintu-sandi">
                  <input
                    type={lihatSandi ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={sandi}
                    onChange={e => setSandi(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setLihatSandi(v => !v)}
                    aria-label={lihatSandi ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    aria-pressed={lihatSandi}
                    title={lihatSandi ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {lihatSandi ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </span>
              </label>
              {galat && (
                <p role="alert" className="ad-pintu-galat">
                  {galat}
                  {petunjukGalat(galat) && <small>{petunjukGalat(galat)}</small>}
                </p>
              )}
              <Button disabled={sedang} type="submit">
                {sedang ? 'Memproses…' : 'Masuk'}
              </Button>
            </form>
            <p className="ad-pintu-kaki">
              <Lock className="size-3" />
              <span>
                Sesi tersimpan di <b>peramban ini</b> sampai Anda keluar
              </span>
            </p>
            <a className="ad-pintu-balik" href="/">
              Kembali ke galeri
            </a>
          </>
        )}
      </div>
    </main>
  );
}

export function Konsol() {
  const { gerbang, keluar, email } = useSesi();
  const { simpan, simpanSedang, kotor, keBawaan, muat, galat, sukses, draft } = useAdmin();
  const [aktif, setAktif] = useState(idDariAlamat);
  const [bilah, setBilah] = useState(false);
  const [luar, setLuar] = useState(0);
  const bilahKiri = useBilah('panel', 212);
  const [luas, setLuas] = useState(() => window.matchMedia('(min-width: 900px)').matches);

  useEffect(() => {
    const medan = window.matchMedia('(min-width: 900px)');
    const on = () => setLuas(medan.matches);
    medan.addEventListener('change', on);
    return () => medan.removeEventListener('change', on);
  }, []);

  useEffect(() => {
    const onHash = () => setAktif(idDariAlamat());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    document.title = `Konsol — ${BRAND}`;
  }, []);

  const panel = useMemo<PanelDef>(
    () => PANEL.find(p => p.id === aktif) ?? PANEL[0],
    [aktif],
  );
  const pakaiDraf = panel.jenis === 'draf';

  // Konsol memakai palet dan tema yang sedang disunting, jadi hasilnya terlihat sebelum disimpan.
  useEffect(() => {
    const gelap = draft.appearance.theme !== 'light';
    const palet = !gelap && colorThemes[draft.appearance.colorTheme]?.gelapSaja ? 'cyan' : draft.appearance.colorTheme;
    document.documentElement.classList.toggle('dark', gelap);
    terapkanPalet(palet, gelap);
  }, [draft.appearance.theme, draft.appearance.colorTheme]);

  if (gerbang !== 'siap') return <Pintu />;

  function pilih(id: string) {
    window.location.hash = `/${id}`;
    setAktif(id);
    setBilah(false);
  }

  return (
    <div className="ad-ruang">
      <header className="ad-atas">
        <button
          type="button"
          className="ad-bilah-tombol"
          aria-label={luas ? (bilahKiri.sembunyi ? 'Tampilkan daftar panel' : 'Sembunyikan daftar panel') : 'Buka daftar panel'}
          aria-expanded={luas ? !bilahKiri.sembunyi : bilah}
          title={luas ? (bilahKiri.sembunyi ? 'Tampilkan daftar panel' : 'Sembunyikan daftar panel') : 'Daftar panel'}
          onClick={() => (luas ? bilahKiri.toggelSembunyi() : setBilah(v => !v))}
        >
          {luas ? (
            bilahKiri.sembunyi ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )
          ) : bilah ? (
            <X className="size-4" />
          ) : (
            <Menu className="size-4" />
          )}
        </button>
        <a className="ad-merek" href="/">
          <img src="/logo.png" alt="" className="size-5 rounded-md object-contain" />
          <span>
            Konsol <b>{BRAND}</b>
          </span>
        </a>
        <span className="ad-alur">
          {panel.grup} <i>/</i> <b>{panel.label}</b>
        </span>
        <span className={`ad-status${kotor && pakaiDraf ? ' is-kotor' : ''}`}>
          <i className="ad-status-jarum" aria-hidden="true" />
          {pakaiDraf ? (muat ? 'memuat…' : kotor ? 'belum disimpan' : 'sesuai database') : 'tersimpan langsung'}
        </span>
        <a className="ad-href" href="/" target="_blank" rel="noopener">
          <ExternalLink className="size-3.5" />
          <span>Lihat situs</span>
        </a>
      </header>

      <div className="ad-badan">
        <nav
          ref={bilahKiri.isiRef}
          className={`ad-bilah${bilah ? ' is-buka' : ''}${bilahKiri.sembunyi ? ' is-sembunyi' : ''}`}
          style={{ '--ad-bilah-w': `${Math.round(bilahKiri.lebar)}px` } as CSSProperties}
          aria-label="Panel konsol"
        >
          {GRUP.map(grup => {
            const isi = PANEL.filter(p => p.grup === grup);
            if (!isi.length) return null;
            return (
              <div key={grup} className="ad-bilah-grup">
                <h2>
                  {grup}
                  <em>{isi.length}</em>
                </h2>
                {isi.map(p => {
                  const Ikon = p.ikon;
                  return (
                    <button key={p.id} type="button" data-active={p.id === aktif} title={p.petunjuk} onClick={() => pilih(p.id)}>
                      <Ikon className="size-4" />
                      <span data-ukur>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
          <div className="ad-bilah-kaki">
            <div className="ad-akun">
              <span className="ad-akun-lencana" aria-hidden="true">
                <ShieldCheck className="size-3.5" />
              </span>
              <div>
                <b>{email ? email.split('@')[0] : 'Akun admin'}</b>
                <small>{email ? `@${email.split('@')[1]}` : 'peran admin dijaga policy'}</small>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => void keluar()}>
              <LogOut className="size-4" />
              Keluar
            </Button>
          </div>
        </nav>

        {!bilahKiri.sembunyi && <div className="ad-pegang" {...bilahKiri.pegangan} />}

        {bilah && <div className="ad-bilah-layar" onClick={() => setBilah(false)} aria-hidden="true" />}

        <main className="ad-utama">
          {panel.render({
            padaBerubah: () => setLuar(n => n + 1),
            padaDisimpan: luar,
          })}

          {galat && (
            <p role="alert" className="ad-papan is-galat">
              {galat}
              {petunjukGalat(galat) && <small>{petunjukGalat(galat)}</small>}
            </p>
          )}
          {sukses && (
            <p role="status" className="ad-papan is-sukses">
              {sukses}
            </p>
          )}

        </main>
      </div>

      {/* Bar Simpan adalah kaki cangkang, bukan bagian yang ikut menggulir: di dalam
          area gulir ia menutupi baris terakhir panel. */}
      {pakaiDraf && (
        <div className="ad-simpan">
          <span className="ad-simpan-ket">
            {kotor
              ? panel.id === 'ringkas'
                ? 'Ada suntingan pada draf konten. Simpan agar terlihat semua pengunjung.'
                : `${panel.label} diubah. Simpan agar terlihat semua pengunjung.`
              : 'Tidak ada perubahan pada draf konten.'}
          </span>
          <Button variant="outline" size="sm" disabled={simpanSedang || !kotor} onClick={keBawaan} title="Kembalikan seluruh panel ke bawaan aplikasi">
            Bawaan
          </Button>
          <Button size="sm" disabled={simpanSedang || !kotor} onClick={() => void simpan()}>
            {simpanSedang ? <Save className="size-4 animate-pulse" /> : <Save className="size-4" />}
            {simpanSedang ? 'Menyimpan…' : 'Simpan semua'}
          </Button>
        </div>
      )}
    </div>
  );
}
