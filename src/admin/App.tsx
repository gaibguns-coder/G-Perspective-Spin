import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, LogOut, Menu, Save, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BRAND } from '@/lib/motion';
import { colorThemes, terapkanPalet } from '@/lib/theme';
import { NOT_CONFIGURED_MESSAGE } from '@/lib/supabase';
import { useAdmin, useSesi } from './store';
import { GRUP, PANEL, type PanelDef } from './registry';
import './shell.css';

function idDariAlamat(): string {
  const mentah = window.location.hash.replace(/^#\/?/, '');
  return PANEL.some(p => p.id === mentah) ? mentah : PANEL[0].id;
}

/** Pintu masuk: tanpa peran admin, konsol tidak menampilkan apa-apa selain formulir. */
function Pintu() {
  const { gerbang, masuk, keluar, email } = useSesi();
  const [alamat, setAlamat] = useState('');
  const [sandi, setSandi] = useState('');
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
      <form className="ad-pintu-kartu" onSubmit={kirim}>
        <ShieldCheck className="size-8 text-primary" />
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
                <input type="password" autoComplete="current-password" required value={sandi} onChange={e => setSandi(e.target.value)} />
              </label>
              {galat && (
                <p role="alert" className="ad-pintu-galat">
                  {galat}
                </p>
              )}
              <Button disabled={sedang} type="submit">
                {sedang ? 'Memproses…' : 'Masuk'}
              </Button>
            </form>
            <a className="ad-pintu-balik" href="/">
              Kembali ke galeri
            </a>
          </>
        )}
      </form>
    </main>
  );
}

export function Konsol() {
  const { gerbang, keluar } = useSesi();
  const { simpan, simpanSedang, kotor, keBawaan, muat, galat, sukses, draft } = useAdmin();
  const [aktif, setAktif] = useState(idDariAlamat);
  const [bilah, setBilah] = useState(false);
  const [luar, setLuar] = useState(0);

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
        <button type="button" className="ad-bilah-tombol" aria-label="Buka daftar panel" aria-expanded={bilah} onClick={() => setBilah(v => !v)}>
          {bilah ? <X className="size-4" /> : <Menu className="size-4" />}
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
          {pakaiDraf ? (muat ? 'memuat…' : kotor ? 'belum disimpan' : 'sesuai database') : 'tersimpan langsung'}
        </span>
        <a className="ad-href" href="/" target="_blank" rel="noopener">
          <ExternalLink className="size-3.5" />
          <span>Lihat situs</span>
        </a>
      </header>

      <div className="ad-badan">
        <nav className={`ad-bilah${bilah ? ' is-buka' : ''}`} aria-label="Panel konsol">
          {GRUP.map(grup => {
            const isi = PANEL.filter(p => p.grup === grup);
            if (!isi.length) return null;
            return (
              <div key={grup} className="ad-bilah-grup">
                <h2>{grup}</h2>
                {isi.map(p => {
                  const Ikon = p.ikon;
                  return (
                    <button key={p.id} type="button" data-active={p.id === aktif} title={p.petunjuk} onClick={() => pilih(p.id)}>
                      <Ikon className="size-4" />
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
          <div className="ad-bilah-kaki">
            <Button variant="ghost" size="sm" onClick={() => void keluar()}>
              <LogOut className="size-4" />
              Keluar
            </Button>
          </div>
        </nav>

        {bilah && <div className="ad-bilah-layar" onClick={() => setBilah(false)} aria-hidden="true" />}

        <main className="ad-utama">
          {panel.render({
            padaBerubah: () => setLuar(n => n + 1),
            padaDisimpan: luar,
          })}

          {galat && (
            <p role="alert" className="ad-papan is-galat">
              {galat}
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
              ? `${panel.label} diubah. Simpan agar terlihat semua pengunjung.`
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
