import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, Clock3, Database, Gauge, Globe2, Images, Music2, RefreshCw, Type, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BRAND } from '@/lib/motion';
import { colorThemes } from '@/lib/theme';
import { NOT_CONFIGURED_MESSAGE, supabase } from '@/lib/supabase';
import { adalahHal } from '@/lib/settings';
import { MiniKarousel } from '../MiniKarousel';
import { GRUP, PANEL } from '../registry';
import { useAdmin, useSesi } from '../store';
import './ringkas.css';

interface Pustaka {
  gambar: number | null;
  lagu: number | null;
  /** 'belum' berarti permintaannya sendiri gagal, jadi status tabelnya tidak diketahui. */
  blok: 'ada' | 'tidak' | 'belum';
  pesanBlok: string;
  simpan: string | null;
  galat: string;
}

function sapaan() {
  const jam = new Date().getHours();
  if (jam < 11) return 'Selamat pagi';
  if (jam < 15) return 'Selamat siang';
  if (jam < 19) return 'Selamat sore';
  return 'Selamat malam';
}

/** Perbandingan 0–100 yang aman untuk penyebut nol. */
function persen(bagian: number, seluruh: number) {
  return seluruh > 0 ? Math.round((bagian / seluruh) * 100) : 0;
}

/**
 * Layar pertama konsol. Semua angkanya dihitung dari draf yang sedang dimuat dan
 * dari hitungan baris di project Supabase — tidak ada angka hiasan, jadi halaman ini
 * juga berfungsi sebagai pemeriksaan cepat sebelum membuka panel mana pun.
 */
export function PanelRingkas() {
  const { draft, muat, kotor, sukses } = useAdmin();
  const { email } = useSesi();
  const [pustaka, setPustaka] = useState<Pustaka>({
    gambar: null,
    lagu: null,
    blok: 'belum',
    pesanBlok: '',
    simpan: null,
    galat: '',
  });
  const [sedang, setSedang] = useState(false);

  const baca = useCallback(async () => {
    if (NOT_CONFIGURED_MESSAGE) {
      setPustaka({ gambar: null, lagu: null, blok: 'belum', pesanBlok: '', simpan: null, galat: NOT_CONFIGURED_MESSAGE });
      return;
    }
    setSedang(true);
    const hitung = async (tabel: string) => {
      const { count, error } = await supabase.from(tabel).select('*', { count: 'exact', head: true });
      return error ? null : count ?? 0;
    };
    /* Head count tidak mengembalikan pesan galat saat tabelnya tidak ada, jadi
       keberadaan site_blocks diperiksa dengan permintaan biasa seperti panel Basis data. */
    const [gambar, lagu, blok, terbaru] = await Promise.all([
      hitung('gallery_items'),
      hitung('songs'),
      supabase.from('site_blocks').select('updated_at').limit(1),
      supabase.from('site_texts').select('updated_at').order('updated_at', { ascending: false }).limit(1),
    ]);
    setPustaka({
      gambar,
      lagu,
      blok: blok.error ? 'tidak' : 'ada',
      pesanBlok: blok.error?.message ?? '',
      simpan: (terbaru.data?.[0] as { updated_at?: string } | undefined)?.updated_at ?? null,
      galat: terbaru.error ? terbaru.error.message : '',
    });
    setSedang(false);
  }, []);

  useEffect(() => {
    void baca();
  }, [baca, sukses]);

  const teks = Object.values(draft.texts);
  const menu = Object.entries(draft.menus);
  const halaman = menu.filter(([k]) => adalahHal(k));
  const bagian = Object.keys(draft.blocks);

  const teksTampil = teks.filter(t => t.visible).length;
  const teksKosong = teks.filter(t => t.text.trim() === '').length;
  const menuNyala = menu.filter(([, m]) => m.on).length;
  const hurufKhusus = teks.filter(t => t.font).length;

  const kisi = [
    {
      ikon: Type,
      label: 'Teks',
      angka: teksTampil,
      kaki: `tampil dari ${teks.length} kunci`,
      /* hanya kisi dengan penyebut nyata yang boleh punya batang isi */
      isi: persen(teksTampil, teks.length),
      ke: '#/teks',
      catat: teksKosong ? `${teksKosong} kunci masih kosong` : 'semua kunci terisi',
    },
    {
      ikon: ToggleRight,
      label: 'Menu & bagian',
      angka: menuNyala,
      kaki: `nyala dari ${menu.length} tuas`,
      isi: persen(menuNyala, menu.length),
      ke: '#/menu',
      catat: 'tuas menentukan bagian yang dimuat pengunjung',
    },
    {
      ikon: Globe2,
      label: 'Halaman kustom',
      angka: halaman.length,
      kaki: halaman.length ? 'terhubung bilah atas' : 'belum ada halaman',
      isi: null,
      ke: '#/halaman',
      catat: 'satu halaman = tiga baris berawalan hal:',
    },
    {
      ikon: Gauge,
      label: 'Gerak carousel',
      angka: draft.motion.slotCount,
      kaki: `slot · ${draft.motion.speed}× · ${draft.motion.orientation === 'vertical' ? 'tegak' : 'datar'}`,
      /* posisi pada kisaran slider yang sama dengan panel Carousel: 3–40 slot */
      isi: persen(draft.motion.slotCount - 3, 37),
      ke: '#/gerak',
      catat: draft.motion.autoplay ? 'autoplay menyala' : 'autoplay mati',
    },
    {
      ikon: Images,
      label: 'Foto galeri',
      angka: pustaka.gambar,
      kaki: pustaka.gambar === null ? 'membaca…' : 'baris gallery_items',
      isi: null,
      ke: '#/gambar',
      catat: pustaka.gambar === 0 ? 'tampilan depan masih memakai slot contoh' : 'tersimpan di storage Supabase',
    },
    {
      ikon: Music2,
      label: 'Musik latar',
      angka: pustaka.lagu,
      kaki: pustaka.lagu === null ? 'membaca…' : 'baris songs',
      isi: null,
      ke: '#/lagu',
      catat: pustaka.lagu === 0 ? 'pengunjung belum bisa memutar lagu' : 'urutan putar mengikuti posisi',
    },
  ];

  const langkah = [
    kotor && { nada: 'is-wanti', teks: 'Ada suntingan yang belum ditekan Simpan.', ke: '#/teks' },
    teksKosong > 0 && { nada: 'is-wanti', teks: `${teksKosong} kunci teks masih kosong.`, ke: '#/teks' },
    pustaka.gambar === 0 && { nada: 'is-wanti', teks: 'Belum ada foto asli di galeri.', ke: '#/gambar' },
    halaman.length === 0 && { nada: 'is-netral', teks: 'Belum ada halaman kustom — buat satu dari panel Halaman.', ke: '#/halaman' },
    hurufKhusus === 0 && { nada: 'is-netral', teks: 'Belum ada teks yang memakai huruf sendiri.', ke: '#/teks' },
    pustaka.galat && { nada: 'is-galat', teks: `Waktu simpan terakhir tidak terbaca: ${pustaka.galat}`, ke: '#/basis' },
    /* site_blocks adalah tabel yang ditambahkan migrasi 0004: kalau belum ada,
       seluruh panel Tata letak gagal menyimpan dan admin perlu tahu dari layar ini. */
    pustaka.blok === 'tidak' && {
      nada: 'is-galat',
      teks: `${pustaka.pesanBlok} — jalankan supabase/migrations/0004_carousel_layout.sql di SQL Editor, lalu Simpan lagi.`,
      ke: '#/basis',
    },
  ].filter(Boolean) as { nada: string; teks: string; ke: string }[];

  /* Baris "aman" hanya muncul kalau memang tidak ada pekerjaan lain, supaya
     ikhtisar tidak pernah menyatakan dua hal yang saling bertentangan. */
  if (!langkah.length) {
    langkah.push({ nada: 'is-rapi', teks: 'Konsol sesuai database. Tidak ada pekerjaan yang tertunda.', ke: '#/teks' });
  }

  return (
    <div className="ad-isi">
      <div className="ad-kepala">
        <LayoutRingkas />
        <div>
          <h2>Ikhtisar konsol</h2>
          <p>
            Angka di bawah dibaca langsung dari draf dan project Supabase situs ini, bukan angka contoh. {muat ? 'Draf masih dimuat.' : ''}
          </p>
        </div>
        <Button variant="outline" size="sm" className="ad-kepala-aksi" disabled={sedang} onClick={() => void baca()}>
          <RefreshCw className={`size-3.5${sedang ? ' animate-spin' : ''}`} />
          Perbarui
        </Button>
      </div>

      <section className="ad-rk-hero">
        <div className="ad-rk-hero-isi">
          <p className="ad-rk-kacamata">
            <span className="ad-rk-jarum" aria-hidden="true" />
            {sapaan()} — {email ? email.split('@')[0] : 'pengunjung konsol'}
          </p>
          <h3>
            Konsol <b>{BRAND}</b>
          </h3>
          <p>
            Seluruh tulisan, tuas bagian, angka putaran, foto, dan lagu situs hidup di project Supabase yang sama. Sunting di panel
            kiri, tekan Simpan, dan pengunjung melihatnya pada muat berikutnya.
          </p>
          <div className="ad-rk-chip">
            <span>{draft.appearance.theme === 'dark' ? 'Tema gelap' : 'Tema terang'}</span>
            <span>{colorThemes[draft.appearance.colorTheme]?.name ?? 'cyan'}</span>
            <span>{draft.motion.direction === 'right' ? 'Putar kanan' : 'Putar kiri'}</span>
            <span>{`${bagian.length} bagian digeser`}</span>
            <span data-nada={pustaka.blok}>{pustaka.blok === 'ada' ? 'tabel site_blocks siap' : pustaka.blok === 'tidak' ? 'site_blocks belum ada' : 'memeriksa tabel…'}</span>
            <span>{pustaka.simpan ? `Simpan terakhir ${new Date(pustaka.simpan).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'Simpan terakhir —'}</span>
          </div>
          <div className="ad-rk-aksi">
            <a className="ad-rk-taut" href="/" target="_blank" rel="noopener">
              Lihat situs
              <ArrowUpRight className="size-3.5" />
            </a>
            <a className="ad-rk-taut is-halus" href="#/basis">
              <Database className="size-3.5" />
              Periksa tabel
            </a>
          </div>
        </div>
        <div className="ad-rk-hero-kincin">
          <MiniKarousel motion={draft.motion} slot={Math.min(10, Math.max(4, Math.round(draft.motion.slotCount / 2)))} />
          <p>Miniatur putaran dengan angka yang sedang berlaku.</p>
        </div>
      </section>

      <div className="ad-rk-kisi">
        {kisi.map(k => {
          const Ikon = k.ikon;
          return (
            <a key={k.label} className="ad-rk-kartu" href={k.ke}>
              <span className="ad-rk-kartu-ikon">
                <Ikon className="size-4" />
              </span>
              <b>{k.angka === null ? '—' : k.angka}</b>
              <span className="ad-rk-kartu-label">{k.label}</span>
              <span className="ad-rk-kartu-kaki">{k.kaki}</span>
              <span className={`ad-rk-kartu-garis${k.isi === null ? ' is-kosong' : ''}`} aria-hidden="true">
                {k.isi !== null && <i style={{ width: `${Math.min(100, Math.max(0, k.isi))}%` }} />}
              </span>
              <small>{k.catat}</small>
            </a>
          );
        })}
      </div>

      <div className="ad-rk-bawah">
        <section className="ad-rk-kotak">
          <h4>
            <Clock3 className="size-3.5" />
            Yang perlu ditindak
          </h4>
          <ul className="ad-rk-langkah">
            {langkah.map((l, i) => (
              <li key={i} className={l.nada}>
                <a href={l.ke}>{l.teks}</a>
              </li>
            ))}
            {!langkah.length && <li className="is-netral">Memuat keadaan konsol…</li>}
          </ul>
        </section>

        <section className="ad-rk-kotak">
          <h4>Masuk cepat ke panel</h4>
          <div className="ad-rk-pintasan">
            {GRUP.filter(g => g !== 'Konsol').map(grup => (
              <div key={grup} className="ad-rk-grup">
                <p>{grup}</p>
                {PANEL.filter(p => p.grup === grup && p.id !== 'ringkas').map(p => {
                  const Ikon = p.ikon;
                  return (
                    <a key={p.id} href={`#/${p.id}`} title={p.petunjuk}>
                      <Ikon className="size-3.5" />
                      {p.label}
                    </a>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/** Ikon kepala panel: kisi dengan satu sel menyala, supaya tidak mirip ikon panel lain. */
function LayoutRingkas() {
  return (
    <span className="ad-rk-merek" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}
