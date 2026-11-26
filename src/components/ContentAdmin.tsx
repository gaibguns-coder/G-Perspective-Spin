import { useEffect, useMemo, useState } from 'react';
import { Ban, Check, Info, Loader2, Move, Palette, RotateCcw, Save, Type, ToggleRight } from 'lucide-react';
import { Button } from './ui/Button';
import { Switch } from './ui/Switch';
import { colorThemes, type ColorThemeKey } from '@/lib/theme';
import {
  FONT_OPTIONS,
  bacaPreferensi,
  kontenBawaan,
  loadContent,
  saveContent,
  simpanPreferensi,
  type MenuKey,
  type SiteContent,
  type TextKey,
} from '@/lib/settings';

interface Props {
  onSaved: () => void;
}

export function ContentAdmin({ onSaved }: Props) {
  const [draft, setDraft] = useState<SiteContent>(() => kontenBawaan());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let aktif = true;
    void loadContent()
      .then(next => {
        if (aktif) setDraft(next);
      })
      .catch(() => {
        if (aktif) setError('Pengaturan gagal dimuat. Perubahan mungkin tidak tersimpan.');
      })
      .finally(() => {
        if (aktif) setLoading(false);
      });
    return () => {
      aktif = false;
    };
  }, []);

  const awal = useMemo(() => JSON.stringify(kontenBawaan()), []);
  const berubah = useMemo(() => JSON.stringify(draft) !== awal, [draft, awal]);

  function bersih() {
    setSuccess('');
    setError('');
  }

  function ubahTeks(key: TextKey, ubah: Partial<SiteContent['texts'][TextKey]>) {
    setDraft(prev => ({ ...prev, texts: { ...prev.texts, [key]: { ...prev.texts[key], ...ubah } } }));
    bersih();
  }

  function ubahMenu(key: MenuKey, on: boolean) {
    setDraft(prev => ({ ...prev, menus: { ...prev.menus, [key]: { ...prev.menus[key], on } } }));
    bersih();
  }

  function ubahTampilan(ubah: Partial<SiteContent['appearance']>) {
    setDraft(prev => ({ ...prev, appearance: { ...prev.appearance, ...ubah } }));
    bersih();
  }

  function ubahGerak(ubah: Partial<SiteContent['motion']>) {
    setDraft(prev => ({ ...prev, motion: { ...prev.motion, ...ubah } }));
    bersih();
  }

  function ubahInfo(ubah: Partial<SiteContent['info']>) {
    setDraft(prev => ({ ...prev, info: { ...prev.info, ...ubah } }));
    bersih();
  }

  async function simpan() {
    setBusy(true);
    setError('');
    try {
      await saveContent(draft);
      // Salin ke perangkat admin juga agar hasilnya langsung terlihat tanpa memuat ulang.
      simpanPreferensi({ theme: draft.appearance.theme, colorTheme: draft.appearance.colorTheme, direction: draft.motion.direction, speed: draft.motion.speed, autoplay: draft.motion.autoplay });
      setSuccess('Tersimpan. Semua pengunjung melihatnya pada muat berikutnya.');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pengaturan gagal disimpan.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Memuat pengaturan…
      </p>
    );
  }

  const textKeys = Object.keys(draft.texts) as TextKey[];
  const menuKeys = Object.keys(draft.menus) as MenuKey[];
  const lokal = bacaPreferensi();

  return (
    <div className="content-editor">
      <div className="content-savebar">
        <span className="text-[11px] text-muted-foreground">
          Disimpan di Supabase, satu baris untuk setiap data.
          {Object.keys(lokal).length > 0 && ' Tampilan perangkat ini masih mengikuti pilihan lokal Anda.'}
        </span>
        <Button variant="outline" size="sm" disabled={busy || !berubah} title="Kembalikan ke bawaan aplikasi" onClick={() => { setDraft(kontenBawaan()); bersih(); }}>
          <RotateCcw className="size-4" />
          Bawaan
        </Button>
        <Button size="sm" disabled={busy} onClick={() => void simpan()}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {busy ? 'Menyimpan…' : 'Simpan'}
        </Button>
      </div>

      <section>
        <h3 className="content-section">
          <Type className="size-4 text-primary" />
          Teks
          <span className="content-note">Warna atau font yang dikosongkan mengikuti tema.</span>
        </h3>
        <div className="content-list">
          {textKeys.map(key => {
            const item = draft.texts[key];
            return (
              <div key={key} className={`content-row${item.visible ? '' : ' is-off'}`}>
                <div className="content-row-head">
                  <span className="content-label">{item.label}</span>
                  <Switch checked={item.visible} onChange={visible => ubahTeks(key, { visible })} label={`Tampilkan ${item.label}`} />
                </div>
                <input
                  type="text"
                  value={item.text}
                  maxLength={240}
                  disabled={!item.visible}
                  placeholder="Teks tampil di depan"
                  onChange={e => ubahTeks(key, { text: e.target.value })}
                />
                <div className="content-tools">
                  <label className="color-field" title="Warna teks">
                    <span className="color-chip" style={{ backgroundColor: item.color || 'transparent' }}>
                      <input
                        type="color"
                        value={/^#[0-9a-f]{6}$/i.test(item.color) ? item.color : '#38bdf8'}
                        disabled={!item.visible}
                        onChange={e => ubahTeks(key, { color: e.target.value })}
                      />
                    </span>
                    <code>{item.color || 'ikut tema'}</code>
                    {item.color && (
                      <Button variant="ghost" size="icon" className="size-6" aria-label={`Hapus warna ${item.label}`} onClick={() => ubahTeks(key, { color: '' })}>
                        <Ban className="size-3.5" />
                      </Button>
                    )}
                  </label>
                  <select value={item.font} disabled={!item.visible} title="Jenis huruf" onChange={e => ubahTeks(key, { font: e.target.value })}>
                    <option value="">Font bawaan</option>
                    {FONT_OPTIONS.map(f => (
                      <option key={f.name} value={f.name}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                  <span className="font-preview" style={{ fontFamily: FONT_OPTIONS.find(f => f.name === item.font)?.stack }}>
                    {item.text.slice(0, 20) || item.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <h3 className="content-section">
          <ToggleRight className="size-4 text-primary" />
          Menu
          <span className="content-note">Tuas aktif berarti bagian itu tampil di halaman.</span>
        </h3>
        <div className="content-list">
          {menuKeys.map(key => {
            const item = draft.menus[key];
            return (
              <div key={key} className={`content-row menu-row${item.on ? '' : ' is-off'}`}>
                <div>
                  <span className="content-label">{item.label}</span>
                  <p className="menu-hint">{item.hint}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">{item.on ? 'Aktif' : 'Nonaktif'}</span>
                  <Switch checked={item.on} onChange={on => ubahMenu(key, on)} label={item.label} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <h3 className="content-section">
          <Palette className="size-4 text-primary" />
          Tampilan bawaan
          <span className="content-note">Kondisi awal saat pengunjung baru membuka situs.</span>
        </h3>
        <div className="content-list">
          <div className="content-row menu-row">
            <div>
              <span className="content-label">Terang atau gelap</span>
              <p className="menu-hint">MONOCHROME otomatis diganti bila tema diatur ke terang.</p>
            </div>
            <div className="segmented w-44">
              <button type="button" data-active={draft.appearance.theme === 'light'} onClick={() => ubahTampilan({ theme: 'light' })}>
                Terang
              </button>
              <button type="button" data-active={draft.appearance.theme === 'dark'} onClick={() => ubahTampilan({ theme: 'dark' })}>
                Gelap
              </button>
            </div>
          </div>
          <div className="content-row menu-row">
            <div>
              <span className="content-label">Palet warna</span>
              <p className="menu-hint">Garis, glow, tombol, dan slider ikut palet ini.</p>
            </div>
            <select className="w-52" value={draft.appearance.colorTheme} onChange={e => ubahTampilan({ colorTheme: e.target.value as ColorThemeKey })}>
              {(Object.keys(colorThemes) as ColorThemeKey[]).map(key => (
                <option key={key} value={key}>
                  {colorThemes[key].name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h3 className="content-section">
          <Move className="size-4 text-primary" />
          Gerak carousel
          <span className="content-note">Kecepatan 0,2×–3×, sudut 0–45°, slot 3–40.</span>
        </h3>
        <div className="content-list">
          <div className="content-row menu-row">
            <div>
              <span className="content-label">Arah putaran</span>
              <p className="menu-hint">Kiri atau kanan saat halaman pertama kali diputar.</p>
            </div>
            <div className="segmented w-40">
              <button type="button" data-active={draft.motion.direction === 'left'} onClick={() => ubahGerak({ direction: 'left' })}>
                Kiri
              </button>
              <button type="button" data-active={draft.motion.direction === 'right'} onClick={() => ubahGerak({ direction: 'right' })}>
                Kanan
              </button>
            </div>
          </div>
          <div className="content-row menu-row">
            <div>
              <span className="content-label">Kecepatan</span>
              <p className="menu-hint">Satuan kelipatan, misal 1,5 berarti setengah lebih cepat.</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0.2}
                max={3}
                step={0.1}
                value={draft.motion.speed}
                onChange={e => ubahGerak({ speed: Number(e.target.value) })}
                className="w-32 accent-[var(--primary)]"
              />
              <span className="speed-value">{draft.motion.speed.toFixed(1)}×</span>
            </div>
          </div>
          <div className="content-row menu-row">
            <div>
              <span className="content-label">Langsung berputar</span>
              <p className="menu-hint">Nonaktif bila pengunjung harus menekan tombol putar lebih dulu.</p>
            </div>
            <Switch checked={draft.motion.autoplay} onChange={autoplay => ubahGerak({ autoplay })} label="Langsung berputar" />
          </div>
          <div className="content-row menu-row">
            <div>
              <span className="content-label">Perlambat saat kursor di atas foto</span>
              <p className="menu-hint">Putaran turun ke 18% secara halus ketika kursor menyinggung kartu, lalu naik kembali perlahan saat kursor pindah.</p>
            </div>
            <Switch checked={draft.motion.pauseOnHover} onChange={pauseOnHover => ubahGerak({ pauseOnHover })} label="Perlambat saat kursor di atas foto" />
          </div>
          <div className="content-row menu-row">
            <div>
              <span className="content-label">Sudut pandang</span>
              <p className="menu-hint">Kemiringan koridor dalam derajat.</p>
            </div>
            <input
              className="w-24"
              type="number"
              min={0}
              max={45}
              value={draft.motion.viewAngle}
              onChange={e => ubahGerak({ viewAngle: Number(e.target.value) })}
            />
          </div>
          <div className="content-row menu-row">
            <div>
              <span className="content-label">Jumlah slot awal</span>
              <p className="menu-hint">Kartu kosong yang disiapkan sebelum galeri berisi foto.</p>
            </div>
            <input
              className="w-24"
              type="number"
              min={3}
              max={40}
              value={draft.motion.slotCount}
              onChange={e => ubahGerak({ slotCount: Number(e.target.value) })}
            />
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h3 className="content-section">
          <Info className="size-4 text-primary" />
          Metadata halaman
          <span className="content-note">Judul tab, deskripsi mesin cari, dan kartu berbagi.</span>
        </h3>
        <div className="content-list">
          {(
            [
              ['pageTitle', 'Judul halaman', 'text'],
              ['metaDescription', 'Deskripsi meta', 'textarea'],
              ['ogTitle', 'Judul kartu berbagi', 'text'],
              ['ogDescription', 'Deskripsi kartu berbagi', 'textarea'],
              ['ogImage', 'Gambar kartu berbagi', 'text'],
              ['themeColor', 'Warna bilah peramban', 'color'],
              ['lang', 'Bahasa', 'text'],
            ] as [keyof SiteContent['info'], string, string][]
          ).map(([key, label, jenis]) => (
            <div key={key} className="content-row">
              <span className="content-label">{label}</span>
              {jenis === 'textarea' ? (
                <textarea maxLength={500} value={draft.info[key]} onChange={e => ubahInfo({ [key]: e.target.value } as Partial<SiteContent['info']>)} />
              ) : jenis === 'color' ? (
                <div className="content-tools">
                  <span className="color-chip" style={{ backgroundColor: draft.info[key] }}>
                    <input type="color" value={/^#[0-9a-f]{6}$/i.test(draft.info[key]) ? draft.info[key] : '#0c0f17'} onChange={e => ubahInfo({ [key]: e.target.value } as Partial<SiteContent['info']>)} />
                  </span>
                  <code>{draft.info[key]}</code>
                </div>
              ) : (
                <input type="text" maxLength={240} value={draft.info[key]} onChange={e => ubahInfo({ [key]: e.target.value } as Partial<SiteContent['info']>)} />
              )}
            </div>
          ))}
        </div>
      </section>

      {error && (
        <p role="alert" className="error-message mt-4">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="success-message mt-4 flex items-center gap-2">
          <Check className="size-4" />
          {success}
        </p>
      )}
    </div>
  );
}
