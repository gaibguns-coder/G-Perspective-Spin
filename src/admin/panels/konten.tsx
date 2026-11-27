import { useMemo, useState } from 'react';
import { Ban, Search, Type, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FONT_OPTIONS, menuOn, type MenuKey, type TextKey } from '@/lib/settings';
import { Baris, Grup, Penanda, Sakelar } from '../fields';
import { useAdmin } from '../store';
import './konten.css';

export function PanelTeks() {
  const { draft, teksBaru } = useAdmin();
  const [cari, setCari] = useState('');

  const kunci = useMemo(() => {
    const s = cari.trim().toLowerCase();
    const semua = Object.keys(draft.texts) as TextKey[];
    if (!s) return semua;
    return semua.filter(k => {
      const t = draft.texts[k];
      return t.label.toLowerCase().includes(s) || t.text.toLowerCase().includes(s);
    });
  }, [draft.texts, cari]);

  function aturLabel(key: TextKey, label: string) {
    teksBaru(key, { label });
  }

  return (
    <div className="ad-isi">
      <div className="ad-kepala">
        <Type className="size-4 text-primary" />
        <div>
          <h2>Teks</h2>
          <p>Satu baris database untuk setiap tulisan di halaman. Warna dan font yang dikosongkan mengikuti tema.</p>
        </div>
        <label className="ad-cari">
          <Search className="size-3.5" />
          <input type="text" value={cari} placeholder="Cari teks…" onChange={e => setCari(e.target.value)} aria-label="Cari teks" />
          {cari && (
            <button type="button" onClick={() => setCari('')} aria-label="Hapus pencarian">
              <Ban className="size-3" />
            </button>
          )}
        </label>
      </div>

      {!kunci.length && <p className="ad-kosong">Tidak ada teks yang cocok dengan “{cari}”.</p>}

      {kunci.map(key => {
        const t = draft.texts[key];
        const tumpukan = FONT_OPTIONS.find(f => f.name === t.font)?.stack;
        return (
          <details key={key} className="ad-teks" open={!!cari}>
            <summary>
              <span className="ad-teks-nama">{t.label}</span>
              <span className="ad-teks-isi">{t.text || '— kosong —'}</span>
              <Penanda on={t.visible} />
            </summary>
            <div className="ad-teks-badan">
              <Baris label="Teks" petunjuk="Isi yang dilihat pengunjung.">
                <input
                  type="text"
                  maxLength={240}
                  value={t.text}
                  disabled={!t.visible}
                  placeholder="Teks tampil di depan"
                  onChange={e => teksBaru(key, { text: e.target.value })}
                />
              </Baris>
              <Baris label="Nama di konsol" petunjuk="Hanya untuk memudahkan mencari baris ini.">
                <input type="text" maxLength={60} value={t.label} onChange={e => aturLabel(key, e.target.value)} />
              </Baris>
              <Baris label="Warna" petunjuk="Kosong berarti ikut warna teks tema.">
                <span className="ad-teks-warna">
                  <input
                    type="color"
                    value={/^#[0-9a-f]{6}$/i.test(t.color) ? t.color : '#38bdf8'}
                    disabled={!t.visible}
                    onChange={e => teksBaru(key, { color: e.target.value })}
                    aria-label={`Warna ${t.label}`}
                  />
                  <code>{t.color || 'ikut tema'}</code>
                  {t.color && (
                    <Button variant="ghost" size="icon" className="size-6" aria-label={`Hapus warna ${t.label}`} onClick={() => teksBaru(key, { color: '' })}>
                      <Ban className="size-3.5" />
                    </Button>
                  )}
                </span>
              </Baris>
              <Baris label="Jenis huruf" petunjuk="Muatan font sudah disiapkan di halaman.">
                <span className="ad-teks-font">
                  <select value={t.font} disabled={!t.visible} onChange={e => teksBaru(key, { font: e.target.value })}>
                    <option value="">Font bawaan</option>
                    {FONT_OPTIONS.map(f => (
                      <option key={f.name} value={f.name}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                  <b className="ad-teks-contoh" style={tumpukan ? { fontFamily: tumpukan } : undefined}>
                    {t.text.slice(0, 18) || t.label}
                  </b>
                </span>
              </Baris>
              <Baris label="Tampilkan" petunjuk="Sembunyikan tanpa menghapus bagian depannya.">
                <Sakelar checked={t.visible} onChange={visible => teksBaru(key, { visible })} label={`Tampilkan ${t.label}`} />
              </Baris>
            </div>
          </details>
        );
      })}
    </div>
  );
}

export function PanelMenu() {
  const { draft, menuBaru, urutkan } = useAdmin();
  const kunci = Object.keys(draft.menus) as MenuKey[];

  return (
    <div className="ad-isi">
      <div className="ad-kepala">
        <ToggleRight className="size-4 text-primary" />
        <div>
          <h2>Menu &amp; bagian</h2>
          <p>Tuas menyalakan bagian halaman; panah menyusun urutan barisnya di database dan di daftar ini.</p>
        </div>
      </div>

      <Grup judul="Bagian yang bisa dinyalakan" petunjuk={`${kunci.filter(k => menuOn(draft, k)).length} dari ${kunci.length} bagian aktif.`}>
        {kunci.map((key, i) => {
          const m = draft.menus[key];
          return (
            <div key={key} className="ad-menu">
              <div className="ad-menu-nama">
                <span className="ad-letak-urut">{i + 1}</span>
                <div>
                  <strong>{m.label}</strong>
                  <small>{m.hint}</small>
                </div>
              </div>
              <div className="ad-menu-aksi">
                <button type="button" title="Naikkan urutan" disabled={i === 0} onClick={() => urutkan('menus', i, -1)}>
                  ↑
                </button>
                <button type="button" title="Turunkan urutan" disabled={i === kunci.length - 1} onClick={() => urutkan('menus', i, 1)}>
                  ↓
                </button>
                <Sakelar checked={m.on} onChange={on => menuBaru(key, { on })} label={m.label} />
              </div>
            </div>
          );
        })}
      </Grup>
    </div>
  );
}
