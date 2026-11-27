import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Circle,
  Expand,
  ImageIcon,
  Move3d,
  Pause,
  Play,
  Settings,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Slider } from './ui/Slider';
import { MusicPlayer } from './MusicPlayer';
import { PerspectiveCorridor } from './PerspectiveCorridor';
import { SidePanel } from './SidePanel';
import { TampilanHalaman } from './HalamanKustom';
import { colorThemes, paletteColors, type ColorThemeKey } from '@/lib/theme';
import {
  bacaPreferensi,
  blokOf,
  daftarHalaman,
  fontStackOf,
  gayaBlok,
  kontenBawaan,
  loadContent,
  menuOn,
  ruteHal,
  simpanPreferensi,
  slugDariAlamat,
  terapkanMeta,
  textOf,
  type BlockKey,
  type MenuKey,
  type SiteContent,
  type TextKey,
} from '@/lib/settings';
import { checkAdminAccess, demoSlots, listGallery, type GalleryItem } from '@/lib/gallery';
import { contohSlot } from '@/lib/contoh';
import { NOT_CONFIGURED_MESSAGE, supabase } from '@/lib/supabase';
import { PERSPECTIVE_DASAR, advanceRotation, easeFaktor, radiusRing, tileOpacity } from '@/lib/motion';

const awal = bacaPreferensi();
// Sistem operasi meminta gerak minimal: putaran tidak dimulai sendiri, dan aturan
// transisi di styles.css dimatikan. Disimpan di modul agar muat data dari basis
// data tidak menimpa pilihan ini.
const KURANGI_GERAK = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loadError, setLoadError] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>(awal.theme ?? 'dark');
  const [colorTheme, setColorTheme] = useState<ColorThemeKey>(awal.colorTheme ?? 'cyan');
  const [panelOpen, setPanelOpen] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>(awal.direction ?? 'left');
  const [speed, setSpeed] = useState(awal.speed ?? 1);
  const [playing, setPlaying] = useState(awal.autoplay ?? !KURANGI_GERAK);
  const [hovering, setHovering] = useState(false);
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [adminAllowed, setAdminAllowed] = useState(false);
  const [contentKey, setContentKey] = useState(0);
  const [content, setContent] = useState<SiteContent>(() => kontenBawaan());
  /** Halaman kustom dipakai lewat #/hal/<slug> supaya host tidak mengembalikan 404. */
  const [hal, setHal] = useState<string | null>(() => slugDariAlamat());

  useEffect(() => {
    const onHash = () => {
      setHal(slugDariAlamat());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const ring = useRef<HTMLDivElement>(null);
  const angle = useRef(0);
  const faktor = useRef(1);
  const slotRef = useRef(content.motion.slotCount);
  slotRef.current = content.motion.slotCount;
  const m = content.motion;
  const count = items.length;
  const radius = radiusRing(count, m.radiusPct);
  /** Putaran vertical memakai sumbu X: kincin telentang, kartu naik-turun. */
  const tegak = m.orientation === 'vertical';
  const sumbu = tegak ? 'rotateX' : 'rotateY';
  const tertutup = selected !== null;
  const mainKursor = hovering && m.pauseOnHover;

  // Angka admin masuk ke variabel CSS, bukan ke properti transform langsung, supaya
  // skala bawaan per lebar layar di styles.css tetap berlaku sebagai dasar.
  const gayaPanggung = { '--tilik': `${-m.viewAngle}deg`, '--panggung': String(m.stagePct / 100) } as CSSProperties;
  const gayaScene = {
    '--perspektif': String(m.perspective / PERSPECTIVE_DASAR),
    '--lama-sorot': `${m.hoverMs}ms`,
  } as CSSProperties;
  const letak = (key: BlockKey) => gayaBlok(blokOf(content, key));

  const reload = useCallback(async () => {
    if (NOT_CONFIGURED_MESSAGE) {
      setItems(demoSlots(slotRef.current));
      return;
    }
    try {
      setItems(await listGallery());
      setLoadError('');
    } catch {
      setLoadError('Galeri tidak dapat dimuat. Periksa koneksi Supabase Anda.');
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Setiap kelompok data dibaca dari tabelnya dan diulang setiap admin menyimpan,
  // supaya perubahan berlaku untuk semua pengunjung, bukan hanya perangkat admin.
  // Pengunjung yang pernah memilih sendiri tidak ditimpa oleh nilai server.
  useEffect(() => {
    let aktif = true;
    void loadContent()
      .then(next => {
        if (!aktif) return;
        setContent(next);
        terapkanMeta(next.info);
        const pref = bacaPreferensi();
        if (!pref.theme) setTheme(next.appearance.theme);
        if (!pref.colorTheme) setColorTheme(next.appearance.colorTheme);
        if (!pref.direction) setDirection(next.motion.direction);
        if (pref.speed === undefined) setSpeed(next.motion.speed);
        if (pref.autoplay === undefined && !KURANGI_GERAK) setPlaying(next.motion.autoplay);
        if (!pref.theme && next.appearance.theme === 'light' && colorThemes[next.appearance.colorTheme]?.gelapSaja) {
          setColorTheme('cyan');
        }
        if (NOT_CONFIGURED_MESSAGE) setItems(demoSlots(next.motion.slotCount));
      })
      .catch(() => {
        if (aktif) setContent(kontenBawaan());
      });
    return () => {
      aktif = false;
    };
  }, [contentKey]);

  useEffect(() => {
    // Gerbang "kelola" hanya soal kenyamanan: tulis-menulis tetap dijaga RLS lewat has_role.
    const periksa = () => {
      void checkAdminAccess()
        .then(setAdminAllowed)
        .catch(() => setAdminAllowed(false));
    };
    periksa();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(event => {
      if (!['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) return;
      if (event === 'SIGNED_OUT') setAdminAllowed(false);
      else periksa();
      void reload();
    });
    return () => subscription.unsubscribe();
  }, [reload]);

  // Admin menyimpan dari halaman /ceopusat, jadi saat tab ini kembali dilihat,
  // konten dan daftar lagu dibaca ulang tanpa pengunjung perlu memuat ulang halaman.
  useEffect(() => {
    const onRuangLihat = () => {
      if (!document.hidden) setContentKey(k => k + 1);
    };
    document.addEventListener('visibilitychange', onRuangLihat);
    return () => document.removeEventListener('visibilitychange', onRuangLihat);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Palet aktif ditulis ke variabel CSS agar tombol, glow, border, dan slider ikut berubah.
  // Tema terang memakai varian gelap palet supaya garis dan glow tetap terbaca di atas putih.
  useEffect(() => {
    const active = colorThemes[colorTheme] ?? colorThemes.cyan;
    const dark = theme === 'dark';
    const { line, glow } = paletteColors(colorTheme, dark);
    const root = document.documentElement;
    root.style.setProperty('--primary', line);
    root.style.setProperty('--primary-foreground', colorTheme === 'monochrome' ? '#09090b' : '#ffffff');
    root.style.setProperty('--card-glow', dark ? glow : `color-mix(in srgb, ${glow} 45%, transparent)`);
    if (dark) root.style.setProperty('--background', active.bg);
    else root.style.removeProperty('--background');
  }, [colorTheme, theme]);

  useEffect(() => {
    let id = 0;
    let last = 0;
    // Gambar penutup menghentikan putaran, kursor hanya memperlambatkannya sampai
    // persen yang dipilih admin di panel Gerak.
    const sasaran = tertutup ? 0 : mainKursor ? m.hoverPct / 100 : 1;

    function frame(time: number) {
      const dt = last ? (time - last) / 1000 : 0;
      if (dt > 0) faktor.current = easeFaktor(faktor.current, playing ? sasaran : 0, dt, m.easeRate);
      last = time;

      if (dt > 0 && faktor.current > 0.001) {
        angle.current = advanceRotation(angle.current, dt, speed, direction, faktor.current, m.degPerSec);
      }

      if (ring.current) {
        ring.current.style.transform = `${sumbu}(${angle.current}deg)`;
        const tiles = ring.current.children;
        for (let i = 0; i < tiles.length; i++) {
          const tileAngle = (i * 360) / Math.max(count, 1) + angle.current;
          (tiles[i] as HTMLElement).style.opacity = tileOpacity(tileAngle, m.fadePct).toFixed(2);
        }
      }
      id = requestAnimationFrame(frame);
    }
    id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, [playing, tertutup, mainKursor, speed, direction, count, sumbu, m.hoverPct, m.easeRate, m.degPerSec, m.fadePct]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      setSelected(null);
      setPanelOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = tertutup ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [tertutup]);

  const rotating = playing && !tertutup;
  const statusKey: TextKey = rotating ? 'statusRunning' : 'statusPaused';

  const teks = (key: TextKey) => textOf(content, key);
  /** Warna dan font hanya ditimpa bila admin mengisi nilainya; kosong berarti ikut tema. */
  const gaya = (key: TextKey): CSSProperties => {
    const { color, font } = teks(key);
    return {
      ...(color ? { color } : {}),
      ...(fontStackOf(font) ? { fontFamily: fontStackOf(font) } : {}),
    };
  };
  const tampil = (key: MenuKey) => menuOn(content, key);
  const ada = (key: TextKey) => teks(key).visible;
  const isi = (key: TextKey) => teks(key).text;

  /** Nomor bingkai untuk gambar contoh, supaya coraknya tetap sama saat kartu dibuka. */
  const nomorContoh = (item: GalleryItem) => Math.max(1, items.findIndex(s => s.id === item.id) + 1);

  /** Menu bilah atas: hanya halaman yang menyala, urutannya mengikuti posisi baris. */
  const daftarHal = daftarHalaman(content).filter(h => h.menu.on);
  const halamanAktif = hal === null ? null : daftarHalaman(content).find(h => h.slug === hal) ?? null;
  const membuka = hal !== null;

  function pilihTheme(next: 'dark' | 'light') {
    setTheme(next);
    simpanPreferensi({ theme: next });
    if (next === 'light') {
      setColorTheme(k => {
        const jatuh = colorThemes[k].gelapSaja ? 'cyan' : k;
        simpanPreferensi({ colorTheme: jatuh });
        return jatuh;
      });
    }
  }

  function pilihPalet(next: ColorThemeKey) {
    setColorTheme(next);
    simpanPreferensi({ colorTheme: next });
  }

  function pilihArah(next: 'left' | 'right') {
    setDirection(next);
    simpanPreferensi({ direction: next });
  }

  function pilihKecepatan(next: number) {
    setSpeed(next);
    simpanPreferensi({ speed: next });
  }

  function ubahPutar(aktif: boolean) {
    setPlaying(aktif);
    simpanPreferensi({ autoplay: aktif });
  }

  return (
    <main className="gallery-app" data-hud={tampil('hud') ? 'nyala' : 'mati'}>
      {/* Bingkai HUD: sudut, rel, dan cakrawala digambar CSS supaya tidak menambah
          teks yang harus disunting admin. Tuasnya ada di menu "Bingkai HUD". */}
      <div className="gallery-bingkai" aria-hidden="true">
        <span className="bingkai-debu" />
        <span className="bingkai-sapu" />
        <span className="bingkai-mistar" />
        {ada('brand') && <span className="bingkai-merek">{isi('brand')}</span>}
        <span className="gallery-sudut is-atas-kiri" />
        <span className="gallery-sudut is-atas-kanan" />
        <span className="gallery-sudut is-bawah-kiri" />
        <span className="gallery-sudut is-bawah-kanan" />
        <span className="gallery-rel is-kiri" />
        <span className="gallery-rel is-kanan" />
      </div>
      {tampil('header') && (
        <header className="gallery-header" style={letak('header')}>
          <div className="brand">
            <img src="/logo.png" alt={`Logo ${isi('brand')}`} className="brand-icon size-7 rounded-md object-contain" />
            {ada('brand') && (
              <span style={gaya('brand')}>{isi('brand')}</span>
            )}
          </div>
          <span className="header-caption">
            <i className={`header-kedip${playing ? ' is-jalan' : ''}`} aria-hidden="true" />
            {membuka
              ? halamanAktif?.menu.label ?? ''
              : ada('statusRunning') || ada('statusPaused')
                ? playing
                  ? isi('statusRunning')
                  : isi('statusPaused')
                : ''}
          </span>
          <div className="flex items-center gap-3">
            {ada('photoLabel') && (
              <span className="text-xs text-muted-foreground" style={gaya('photoLabel')}>
                <strong className="text-sm font-semibold text-foreground">{String(count).padStart(2, '0')}</strong> {isi('photoLabel')}
              </span>
            )}

            {daftarHal.length > 0 && (
              <nav className="header-nav" aria-label="Menu halaman">
                {daftarHal.map(h => (
                  <a key={h.slug} className="header-link" href={ruteHal(h.slug)} data-aktif={hal === h.slug || undefined}>
                    {h.menu.label}
                  </a>
                ))}
              </nav>
            )}

            <a className="header-portfolio" href="/portofolio.html" rel="noopener">
              Portofolio
            </a>

            {tampil('sidePanel') && (
              <Button
                variant="ghost"
                size="icon"
                className="theme-control"
                title="Pengaturan tampilan"
                aria-label="Pengaturan tampilan"
                aria-expanded={panelOpen}
                data-active={panelOpen}
                onClick={() => setPanelOpen(v => !v)}
              >
                <SlidersHorizontal className="size-4" style={{ color: paletteColors(colorTheme, theme === 'dark').line }} />
              </Button>
            )}
          </div>
        </header>
      )}

      {membuka ? (
        <TampilanHalaman halaman={halamanAktif} />
      ) : (
        <>
      {tampil('intro') && (
        <section className="gallery-intro" style={letak('intro')}>
          <div>
            {ada('introTitle') && (
              <h1 style={gaya('introTitle')}>
                {isi('introTitle')}
                <span className="judul-titik" />
              </h1>
            )}
            {ada('introSubtitle') && (
              <p className="intro-subtitle">
                <span className="wordmark-dot" style={gaya('introSubtitle')}>
                  {isi('introSubtitle')}
                </span>
              </p>
            )}
          </div>

          {/* Tiga pembaca angka — semuanya hitungan nyata dari data yang sudah dimuat. */}
          {tampil('meters') && (
            <div className="gallery-meters">
              <div className="gallery-meter">
                <b>{String(count).padStart(2, '0')}</b>
                {ada('meterWorks') && <span style={gaya('meterWorks')}>{isi('meterWorks')}</span>}
              </div>
              <span className="gallery-meter-garis" aria-hidden="true" />
              <div className="gallery-meter">
                <b>{String(daftarHal.length).padStart(2, '0')}</b>
                {ada('meterPages') && <span style={gaya('meterPages')}>{isi('meterPages')}</span>}
              </div>
              <span className="gallery-meter-garis" aria-hidden="true" />
              <div className="gallery-meter">
                <b>{playing ? `${speed.toFixed(1)}×` : '0.0×'}</b>
                {ada('meterRate') && <span style={gaya('meterRate')}>{isi('meterRate')}</span>}
              </div>
            </div>
          )}
        </section>
      )}

      {(NOT_CONFIGURED_MESSAGE || loadError) && (
        <p className="notice">{NOT_CONFIGURED_MESSAGE || loadError}</p>
      )}

      <section className="scene" aria-label="Carousel gambar 3D" style={{ ...letak('scene'), ...gayaScene }}>
        {tampil('corridor') && <PerspectiveCorridor theme={theme} colorTheme={colorTheme} />}
        {tampil('hud') && (
          <div className="stage-hud" aria-hidden="true">
            <span className="stage-kompas" />
            <span className="stage-cakrawala" />
            <span className="stage-tis is-atas-kiri" />
            <span className="stage-tis is-atas-kanan" />
            <span className="stage-tis is-bawah-kiri" />
            <span className="stage-tis is-bawah-kanan" />
            <span className="stage-tik is-a" />
            <span className="stage-tik is-b" />
            <span className="stage-tik is-c" />
          </div>
        )}
        <div className="carousel-orbit" data-sumbu={tegak ? 'vertical' : 'horizontal'} style={gayaPanggung}>
          <div ref={ring} className="carousel-ring">
            {items.map((item, index) => (
              <div
                className="carousel-position"
                key={item.id}
                style={{ transform: `${sumbu}(${(index * 360) / Math.max(count, 1)}deg) translateZ(${radius}px)` }}
              >
                <Button
                  variant="ghost"
                  className={`gallery-tile${item.image_url ? '' : ' is-contoh'}`}
                  aria-label={`Lihat ${item.title}`}
                  style={{ '--i': index } as CSSProperties}
                  onMouseEnter={() => setHovering(true)}
                  onMouseLeave={() => setHovering(false)}
                  onFocus={() => setHovering(true)}
                  onBlur={() => setHovering(false)}
                  onClick={() => setSelected(item)}
                >
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} />
                  ) : (
                    <>
                      <img src={contohSlot(index + 1)} alt="" aria-hidden="true" />
                      {ada('tileEmpty') && <span className="tile-label" style={gaya('tileEmpty')}>{isi('tileEmpty')}</span>}
                    </>
                  )}
                  {/* Kartu sengaja tanpa teks: judul dan deskripsi baru dibaca setelah kartu
                      diklik, supaya panggung tetap berisi gambar seperti album cetak. */}
                  <span className="tile-number">{String(index + 1).padStart(2, '0')}</span>
                  <Expand className="tile-corner" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {count === 0 && !NOT_CONFIGURED_MESSAGE && ada('emptyGallery') && (
          <div className="scene-kosong">
            <div className="scene-kosong-kotak" style={gaya('emptyGallery')}>
              <ImageIcon className="size-5" />
              <span>{isi('emptyGallery')}</span>
              {adminAllowed && (
                <a className="scene-kosong-tautan" href="/ceopusat" aria-label="Kelola situs" title="Kelola situs">
                  <Settings className="size-3.5" />
                </a>
              )}
            </div>
          </div>
        )}

        {tampil('hud') && count > 0 && ada('sceneHint') && (
          <p className="stage-petunjuk" style={gaya('sceneHint')}>
            <Move3d className="size-3" />
            <span>{isi('sceneHint')}</span>
          </p>
        )}

        {tampil('status') && (
          <div className="scene-bottom" style={letak('status')}>
            {ada(statusKey) && (
              <span>
                <Circle className="size-2 text-primary" />
                <span style={gaya(statusKey)}>{isi(statusKey)}</span>
              </span>
            )}
            <span style={gaya('brand')}>
              {isi('brand')} / {String(count).padStart(2, '0')}
            </span>
          </div>
        )}
      </section>

      {tampil('playback') && (
        <section className="playback" aria-label="Kontrol carousel" style={letak('playback')}>
          {tampil('direction') && (
            <div>
              <div className="control-label" style={gaya('directionLabel')}>
                {ada('directionLabel') ? isi('directionLabel') : '\u00a0'}
              </div>
              <div className="direction-buttons">
                <Button variant="ghost" size="icon" aria-label="Putar ke kiri" title="Putar ke kiri" data-active={direction === 'left'} onClick={() => pilihArah('left')}>
                  <ArrowLeft />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Putar ke kanan" title="Putar ke kanan" data-active={direction === 'right'} onClick={() => pilihArah('right')}>
                  <ArrowRight />
                </Button>
              </div>
            </div>
          )}
          {tampil('direction') && tampil('speed') && <div className="control-divider" />}
          {tampil('speed') && (
            <div className="speed-control">
              <div className="speed-heading">
                <div className="control-label" style={gaya('speedLabel')}>
                  {ada('speedLabel') ? isi('speedLabel') : '\u00a0'}
                </div>
                <span className="speed-value">{speed.toFixed(1)}×</span>
              </div>
              <Slider aria-label="Kecepatan putaran" min={0.2} max={3} step={0.1} value={[speed]} onValueChange={v => pilihKecepatan(v[0] ?? 1)} />
            </div>
          )}
          {(tampil('direction') || tampil('speed')) && <div className="control-divider" />}
          <Button
            className="pause-control"
            size="icon"
            aria-label={playing ? 'Jeda putaran' : 'Lanjutkan putaran'}
            title={playing ? 'Jeda' : 'Lanjutkan'}
            onClick={() => ubahPutar(!playing)}
          >
            {playing ? <Pause /> : <Play />}
          </Button>
        </section>
      )}
        </>
      )}

      {tampil('footer') && (
        <footer className="gallery-footer" style={letak('footer')}>
          <span className="footer-merek">
            <i className="footer-kedip" aria-hidden="true" />
            <span style={gaya('brand')}>{isi('brand')}</span>
            {ada('footerTag') && (
              <em className="footer-tag" style={gaya('footerTag')}>
                {isi('footerTag')}
              </em>
            )}
          </span>
          <span className="flex items-center gap-3">
            <span>{ada('photoLabel') ? `${count} ${isi('photoLabel')}` : count}</span>
            {daftarHal.length > 0 && (
              <>
                <i className="footer-titik" aria-hidden="true" />
                <span>{ada('meterPages') ? `${daftarHal.length} ${isi('meterPages')}` : daftarHal.length}</span>
              </>
            )}
            {tampil('adminButton') && adminAllowed && (
              <a className="settings-button" href="/ceopusat" aria-label="Kelola situs" title="Kelola situs di halaman terpisah">
                <Settings />
              </a>
            )}
          </span>
        </footer>
      )}

      {selected && (
        <section className="viewer" role="dialog" aria-modal="true" aria-label={selected.title}>
          <div className="viewer-header">
            <div className="brand">
              <img src="/logo.png" alt={`Logo ${isi('brand')}`} className="brand-icon size-5 rounded-sm object-contain" />
              {ada('brand') && <span style={gaya('brand')}>{isi('brand')}</span>}
            </div>
            <Button variant="ghost" size="icon" autoFocus aria-label="Tutup gambar" onClick={() => { setSelected(null); setHovering(false); }}>
              <X />
            </Button>
          </div>
          <div className="viewer-image">
            {selected.image_url ? (
              <img src={selected.image_url} alt={selected.title} />
            ) : (
              <div className="viewer-contoh">
                <img src={contohSlot(nomorContoh(selected))} alt="" aria-hidden="true" />
                {ada('viewerEmpty') && (
                  <span className="viewer-chip" style={gaya('viewerEmpty')}>{isi('viewerEmpty')}</span>
                )}
              </div>
            )}
          </div>
          <div className="viewer-details">
            <h2>{selected.title}</h2>
            {(selected.description || ada('tileNoDesc')) && (
              <p style={selected.description ? undefined : gaya('tileNoDesc')}>{selected.description || isi('tileNoDesc')}</p>
            )}
          </div>
        </section>
      )}

      {tampil('music') && (
        <MusicPlayer
          adminAllowed={adminAllowed}
          refreshKey={contentKey}
          playlistTitle={isi('playlistHeading')}
          playlistVisible={ada('playlistHeading')}
          playlistStyle={gaya('playlistHeading')}
          letak={letak('music')}
        />
      )}

      <SidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        theme={theme}
        onTheme={pilihTheme}
        colorTheme={colorTheme}
        onColorTheme={pilihPalet}
        adminAllowed={adminAllowed}
      />
    </main>
  );
}
