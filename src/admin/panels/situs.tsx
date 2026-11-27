import { useCallback, useEffect, useState } from 'react';
import { Database, Info, Moon, Palette, RefreshCw, Sun } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { colorThemes, type ColorThemeKey } from '@/lib/theme';
import { NOT_CONFIGURED_MESSAGE, supabase } from '@/lib/supabase';
import { nomorWa, surel } from '@/lib/kontak';
import { BRAND } from '@/lib/motion';
import { Baris, Grup, Isian, Pilihan } from '../fields';
import { useAdmin } from '../store';
import './situs.css';

export function PanelTampilan() {
  const { draft, tampilanBaru } = useAdmin();
  const tema = draft.appearance.theme;
  const palet = Object.keys(colorThemes) as ColorThemeKey[];

  return (
    <div className="ad-isi">
      <div className="ad-kepala">
        <Palette className="size-4 text-primary" />
        <div>
          <h2>Tampilan bawaan</h2>
          <p>Kondisi awal pengunjung baru. Pengunjung yang pernah memilih sendiri tetap mengikuti pilihan perangkatnya.</p>
        </div>
      </div>

      <Grup judul="Tema">
        <Baris label="Terang atau gelap" petunjuk="Palet MONOCHROME hanya tersedia untuk tema gelap.">
          <Pilihan
            value={tema}
            onChange={next => tampilanBaru({ theme: next })}
            options={[
              { value: 'dark', label: 'Gelap' },
              { value: 'light', label: 'Terang' },
            ]}
          />
        </Baris>
      </Grup>

      <Grup judul="Palet warna" petunjuk="Garis koridor, glow, tombol, dan slider ikut palet ini.">
        <div className="ad-palet">
          {palet.map(key => {
            const p = colorThemes[key];
            const tidakCocok = tema === 'light' && p.gelapSaja;
            return (
              <button
                key={key}
                type="button"
                className="ad-palet-kartu"
                data-active={draft.appearance.colorTheme === key}
                disabled={tidakCocok}
                title={tidakCocok ? 'Palet ini hanya untuk tema gelap' : p.name}
                onClick={() => tampilanBaru({ colorTheme: key })}
              >
                <span className="ad-palet-loreng" style={{ background: `linear-gradient(90deg, ${p.bg}, ${p.line})` }} />
                <strong>{p.name}</strong>
                <small>{p.bg}</small>
              </button>
            );
          })}
        </div>
      </Grup>

      <div className="ad-catat">
        {tema === 'dark' ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
        Bawaan: {tema === 'dark' ? 'gelap' : 'terang'} · {colorThemes[draft.appearance.colorTheme]?.name ?? 'cyan'} · merek tetap
        “{BRAND}”.
      </div>
    </div>
  );
}

export function PanelMeta() {
  const { draft, infoBaru } = useAdmin();
  const i = draft.info;
  const nomor = nomorWa(i.whatsapp);
  const alamat = surel(i.email);
  const nomorDitolak = !nomor && i.whatsapp.trim().length > 0;
  const alamatDitolak = !alamat && i.email.trim().length > 0;

  return (
    <div className="ad-isi">
      <div className="ad-kepala">
        <Info className="size-4 text-primary" />
        <div>
          <h2>Metadata &amp; kontak</h2>
          <p>Judul tab, kartu berbagi, dan nomor yang dipakai tombol halaman portofolio.</p>
        </div>
      </div>

      <Grup
        judul="Kontak portofolio"
        petunjuk="Dua nilai ini menimpa tombol di /portofolio.html. Nomor boleh diketik apa adanya (+62 812-3456-7890 atau 0812-3456-7890); yang tersimpan tetap digit berkode negara."
      >
        <Isian
          label="Nomor WhatsApp"
          max={24}
          placeholder="6281234567890"
          value={i.whatsapp}
          petunjuk="Kosong berarti tombol masih memakai angka bawaan yang tertanam di berkas HTML."
          onChange={whatsapp => infoBaru({ whatsapp })}
        />
        <Isian
          label="Alamat email"
          max={160}
          placeholder="nama@domain.com"
          value={i.email}
          petunjuk="Untuk tombol “Kirim email”. Alamat fiktif membuat pesan calon klien hilang tanpa pemberitahuan."
          onChange={email => infoBaru({ email })}
        />
        <div className="ad-catat">
          {nomor ? (
            <a href={`https://wa.me/${nomor}`} target="_blank" rel="noopener noreferrer">
              wa.me/{nomor}
            </a>
          ) : nomorDitolak ? (
            <b>Nomor “{i.whatsapp.trim()}” belum terbaca — minimal 8 angka.</b>
          ) : (
            <span>WhatsApp belum diisi — tombol memakai placeholder HTML.</span>
          )}
          <br />
          {alamat ? (
            <a href={`mailto:${alamat}`}>{alamat}</a>
          ) : alamatDitolak ? (
            <b>Email “{i.email.trim()}” tidak berbentuk alamat surel.</b>
          ) : (
            <span>Email belum diisi — tombol memakai placeholder HTML.</span>
          )}
        </div>
      </Grup>

      <Grup judul="Judul &amp; deskripsi">
        <Isian label="Judul halaman" value={i.pageTitle} onChange={pageTitle => infoBaru({ pageTitle })} />
        <Isian label="Deskripsi meta" jenis="uraian" max={500} value={i.metaDescription} onChange={metaDescription => infoBaru({ metaDescription })} />
        <Isian label="Bahasa" petunjuk="Kode dua huruf, misal id atau en." value={i.lang} onChange={lang => infoBaru({ lang })} />
      </Grup>

      <Grup judul="Kartu berbagi">
        <Isian label="Judul kartu" value={i.ogTitle} onChange={ogTitle => infoBaru({ ogTitle })} />
        <Isian label="Deskripsi kartu" jenis="uraian" max={500} value={i.ogDescription} onChange={ogDescription => infoBaru({ ogDescription })} />
        <Isian label="Gambar kartu" jenis="alamat" petunjuk="Alamat relatif, misal /og-portofolio.png." value={i.ogImage} onChange={ogImage => infoBaru({ ogImage })} />
        <Isian label="Warna bilah peramban" jenis="warna" value={i.themeColor} onChange={themeColor => infoBaru({ themeColor })} />
      </Grup>
    </div>
  );
}

interface Hitungan {
  nama: string;
  isi: string;
  jumlah: number | null;
  terakhir: string | null;
  galat?: string;
}

interface TabelInfo {
  nama: string;
  isi: string;
  /** Tabel konten memakai updated_at, pustaka lama memakai created_at. */
  waktu: 'updated_at' | 'created_at';
}

const TABEL: TabelInfo[] = [
  { nama: 'site_texts', isi: 'Setiap teks pada halaman', waktu: 'updated_at' },
  { nama: 'site_menus', isi: 'Tuas menyala/matinya bagian', waktu: 'updated_at' },
  { nama: 'site_blocks', isi: 'Geseran dan skala tiap bagian', waktu: 'updated_at' },
  { nama: 'site_motion', isi: 'Seluruh angka gerak carousel', waktu: 'updated_at' },
  { nama: 'site_appearance', isi: 'Tema dan palet bawaan', waktu: 'updated_at' },
  { nama: 'site_info', isi: 'Judul dan metadata dokumen', waktu: 'updated_at' },
  { nama: 'gallery_items', isi: 'Foto beserta judul dan deskripsi', waktu: 'created_at' },
  { nama: 'songs', isi: 'Lagu latar dan urutannya', waktu: 'created_at' },
];

/**
 * Panel "satu layar untuk semua tabel": jumlah baris dan waktu simpan terakhir, supaya
 * admin tahu data yang diedit benar-benar mendarat ke database.
 */
export function PanelBasisData({ padaDisimpan }: { padaDisimpan: number }) {
  const [baris, setBaris] = useState<Hitungan[]>([]);
  const [sedang, setSedang] = useState(false);

  const baca = useCallback(async () => {
    if (NOT_CONFIGURED_MESSAGE) return;
    setSedang(true);
    const hasil = await Promise.all(
      TABEL.map(async t => {
        try {
          const { count, data, error } = await supabase
            .from(t.nama)
            .select(t.waktu, { count: 'exact' })
            .order(t.waktu, { ascending: false })
            .limit(1);
          if (error) return { ...t, jumlah: null, terakhir: null, galat: error.message };
          const baris = data?.[0] as Record<string, string> | undefined;
          return { ...t, jumlah: count ?? 0, terakhir: baris?.[t.waktu] ?? null };
        } catch {
          return { ...t, jumlah: null, terakhir: null, galat: 'Permintaan gagal.' };
        }
      }),
    );
    setBaris(hasil);
    setSedang(false);
  }, []);

  useEffect(() => {
    void baca();
  }, [baca, padaDisimpan]);

  return (
    <div className="ad-isi">
      <div className="ad-kepala">
        <Database className="size-4 text-primary" />
        <div>
          <h2>Basis data</h2>
          <p>Isi setiap tabel yang dibaca halaman depan. Semua ditulis dari panel di sebelah kiri dan dijaga policy admin.</p>
        </div>
        <Button variant="outline" size="sm" className="ad-kepala-aksi" disabled={sedang || !!NOT_CONFIGURED_MESSAGE} onClick={() => void baca()}>
          <RefreshCw className={`size-3.5${sedang ? ' animate-spin' : ''}`} />
          Perbarui
        </Button>
      </div>

      {NOT_CONFIGURED_MESSAGE ? (
        <p className="ad-kosong">{NOT_CONFIGURED_MESSAGE}</p>
      ) : (
        <div className="ad-db">
          <div className="ad-db-baris is-kepala">
            <span>Tabel</span>
            <span>Isi</span>
            <span>Baris</span>
            <span>Simpan terakhir</span>
          </div>
          {baris.map(t => (
            <div key={t.nama} className="ad-db-baris">
              <code>{t.nama}</code>
              <span>{t.isi}</span>
              <b title={t.galat ?? undefined}>{t.jumlah === null ? (t.galat ? 'gagal' : '—') : t.jumlah}</b>
              <span className="ad-db-waktu">{t.terakhir ? new Date(t.terakhir).toLocaleString('id-ID') : '—'}</span>
            </div>
          ))}
          {!baris.length && <p className="ad-kosong">Membaca tabel…</p>}
        </div>
      )}

      <p className="ad-catat">
        Struktur dibuat oleh <code>supabase/migrations/0001_init.sql</code>, <code>0003_site_content.sql</code>, dan{' '}
        <code>0004_carousel_layout.sql</code>. Menambah kolom baru berarti menambah migrasi bernomor, bukan mengubah yang sudah jalan.
      </p>
    </div>
  );
}
