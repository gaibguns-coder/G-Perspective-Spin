import { useMemo, useState } from 'react';
import { Ban, ExternalLink, FilePlus2, Globe, Search, Trash2, Type, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { adalahHal, daftarHalaman, kunciHal, kunciIsi, kunciJudul, menuOn, ruteHal, tautanHal, type MenuKey, type MenuSetting, type TextKey } from '@/lib/settings';
import { Switch } from '@/components/ui/Switch';
import { Baris, FontKeping, Grup, Isian, Sakelar } from '../fields';
import { useAdmin } from '../store';
import './konten.css';

export function PanelTeks() {
  const { draft, teksBaru } = useAdmin();
  const [cari, setCari] = useState('');

  // Baris halaman kustom disunting di panel Halaman, bukan menumpuk di daftar ini.
  const kunci = useMemo(() => {
    const s = cari.trim().toLowerCase();
    const semua = (Object.keys(draft.texts) as TextKey[]).filter(k => !adalahHal(k));
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
        return (
          <details key={key} className="ad-teks" open={!!cari}>
            <summary>
              <span className="ad-teks-nama">{t.label}</span>
              <span className="ad-teks-isi">{t.text || '— kosong —'}</span>
              {/* Tuas di baris ringkas: klik di sini tidak membuka/menutup rinciannya. */}
              <span className="ad-teks-tuas" onClick={e => e.preventDefault()}>
                <Switch checked={t.visible} onChange={visible => teksBaru(key, { visible })} label={`Tampilkan ${t.label}`} />
              </span>
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
              <FontKeping
                value={t.font}
                contoh={t.text || t.label}
                disabled={!t.visible}
                onChange={font => teksBaru(key, { font })}
              />
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
                <button
                  type="button"
                  className="ad-menu-panah"
                  title="Naikkan urutan"
                  disabled={i === 0}
                  onClick={() => urutkan('menus', i, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="ad-menu-panah"
                  title="Turunkan urutan"
                  disabled={i === kunci.length - 1}
                  onClick={() => urutkan('menus', i, 1)}
                >
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

/** Tukar posisi dua kunci tanpa mengubah isinya; urutan inilah yang jadi nomor baris di database. */
function tukarKunci(menus: Record<string, MenuSetting>, a: string, b: string): Record<string, MenuSetting> {
  const keys = Object.keys(menus);
  const ia = keys.indexOf(a);
  const ib = keys.indexOf(b);
  if (ia < 0 || ib < 0) return menus;
  [keys[ia], keys[ib]] = [keys[ib], keys[ia]];
  return Object.fromEntries(keys.map(k => [k, menus[k]]));
}

export function PanelHalaman() {
  const { draft, teksBaru, menuBaru, setSemua, tambahHalaman, hapusHalaman } = useAdmin();
  const halaman = daftarHalaman(draft);
  const [nama, setNama] = useState('');
  const [terbuka, setTerbuka] = useState<string | null>(null);
  const [konfirmasi, setKonfirmasi] = useState<string | null>(null);

  function buat(e: React.FormEvent) {
    e.preventDefault();
    const bersih = nama.trim();
    if (!bersih) return;
    setTerbuka(tambahHalaman(bersih));
    setNama('');
  }

  return (
    <div className="ad-isi">
      <div className="ad-kepala">
        <Globe className="size-4 text-primary" />
        <div>
          <h2>Halaman &amp; menu</h2>
          <p>
            Setiap halaman baru langsung menulis tiga baris: satu di <code>site_menus</code> untuk nama menu dan urutannya, dua
            di <code>site_texts</code> untuk judul dan isinya. Tekan Simpan, halaman itu sudah bisa dibuka.
          </p>
        </div>
      </div>

      <form className="ad-hal-buat" onSubmit={buat}>
        <input
          type="text"
          maxLength={60}
          value={nama}
          placeholder="Nama menu, mis. Tentang, Layanan, Kontak"
          onChange={e => setNama(e.target.value)}
          aria-label="Nama halaman baru"
        />
        <Button size="sm" type="submit" disabled={!nama.trim()}>
          <FilePlus2 className="size-3.5" />
          Buat halaman
        </Button>
      </form>

      {!halaman.length ? (
        <p className="ad-kosong">Belum ada halaman tambahan. Galeri tetap menjadi halaman utama.</p>
      ) : (
        <Grup judul={`Daftar halaman (${halaman.length})`} petunjuk="Panah menyusun urutan menu di bilah atas. Halaman yang menyala tampil di bilah itu dan bisa dibuka tanpa memuat ulang; tombol Kembali di halaman menuju galeri.">
          {halaman.map((h, i) => (
            <details key={h.slug} className="ad-teks" open={terbuka === h.slug}>
              <summary onClick={() => setTerbuka(h.slug)}>
                <span className="ad-teks-nama">{h.menu.label}</span>
                <span className="ad-teks-isi">{h.judul.text || '— tanpa judul —'}</span>
                <span className="ad-hal-slug">#/hal/{h.slug}</span>
                <span className="ad-teks-tuas" onClick={e => e.preventDefault()}>
                  <Switch checked={h.menu.on} onChange={on => menuBaru(kunciHal(h.slug), { on })} label={h.menu.label} />
                </span>
              </summary>
              <div className="ad-teks-badan">
                <Isian
                  label="Nama pada menu"
                  petunjuk="Muncul di bilah atas galeri."
                  max={60}
                  value={h.menu.label}
                  onChange={label => menuBaru(kunciHal(h.slug), { label })}
                />
                <Baris label="Alamat" petunjuk="Dibuka dari bilah atas, tanpa memuat ulang halaman.">
                  <span className="ad-hal-alamat">
                    <code>{ruteHal(h.slug)}</code>
                    <a href={tautanHal(h.slug)} target="_blank" rel="noopener" title="Buka halaman ini">
                      <ExternalLink className="size-3.5" />
                      Buka
                    </a>
                  </span>
                </Baris>
                <Isian
                  label="Judul halaman"
                  petunjuk={`Baris teks ${kunciJudul(h.slug)} di site_texts.`}
                  max={160}
                  value={h.judul.text}
                  onChange={text => teksBaru(kunciJudul(h.slug), { text })}
                />
                <Isian
                  label="Warna judul"
                  petunjuk="Kosong berarti ikut warna teks tema."
                  jenis="warna"
                  value={h.judul.color}
                  onChange={color => teksBaru(kunciJudul(h.slug), { color })}
                />
                <FontKeping value={h.judul.font} contoh={h.judul.text || h.menu.label} onChange={font => teksBaru(kunciJudul(h.slug), { font })} />
                <Isian
                  label="Isi halaman"
                  petunjuk={`Baris kosong berpindah paragraf. Baris ${kunciIsi(h.slug)} di site_texts.`}
                  jenis="uraian"
                  max={5000}
                  value={h.isi.text}
                  onChange={text => teksBaru(kunciIsi(h.slug), { text })}
                />
                <Baris label="Urutan dan bahaya">
                  <span className="ad-hal-aksi">
                    <button
                      type="button"
                      title="Tukar dengan halaman di atasnya"
                      disabled={i === 0}
                      onClick={() => setSemua({ ...draft, menus: tukarKunci(draft.menus, kunciHal(h.slug), kunciHal(halaman[i - 1].slug)) })}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      title="Tukar dengan halaman di bawahnya"
                      disabled={i === halaman.length - 1}
                      onClick={() => setSemua({ ...draft, menus: tukarKunci(draft.menus, kunciHal(h.slug), kunciHal(halaman[i + 1].slug)) })}
                    >
                      ↓
                    </button>
                    {konfirmasi === h.slug ? (
                      <>
                        <button type="button" className="is-berbahaya" onClick={() => { hapusHalaman(h.slug); setKonfirmasi(null); setTerbuka(null); }}>
                          Yakin, hapus
                        </button>
                        <button type="button" onClick={() => setKonfirmasi(null)}>Batal</button>
                      </>
                    ) : (
                      <button type="button" className="is-berbahaya" title="Hapus halaman beserta barisnya" onClick={() => setKonfirmasi(h.slug)}>
                        <Trash2 className="size-3.5" />
                        Hapus
                      </button>
                    )}
                  </span>
                </Baris>
                {konfirmasi === h.slug && (
                  <p className="ad-hal-wanti">
                    Menghapus halaman juga membuang baris <code>site_menus</code> dan dua baris <code>site_texts</code> miliknya
                    setelah tombol Simpan ditekan.
                  </p>
                )}
              </div>
            </details>
          ))}
        </Grup>
      )}
    </div>
  );
}
