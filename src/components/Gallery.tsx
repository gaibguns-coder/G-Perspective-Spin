import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Circle,
  Expand,
  ImageIcon,
  Moon,
  Palette,
  Pause,
  Play,
  Settings,
  Sun,
  X,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Slider } from './ui/Slider';
import { MusicPlayer } from './MusicPlayer';
import { GalleryAdmin } from './GalleryAdmin';
import { PerspectiveCorridor } from './PerspectiveCorridor';
import { demoSlots, listGallery, type GalleryItem } from '@/lib/gallery';
import { NOT_CONFIGURED_MESSAGE, supabase } from '@/lib/supabase';
import { advanceRotation, BRAND, tileOpacity, VIEW_ANGLE } from '@/lib/motion';

export type ColorThemeKey = 'cyan' | 'matrix' | 'synthwave' | 'blueprint' | 'monochrome';

interface ColorTheme {
  bg: string;
  wall: string;
  line: string;
  glow: string;
  name: string;
  /** Varian untuk tema terang: warna neon asli hilang di atas latar putih. */
  lineLight: string;
  glowLight: string;
  /** Palet gelap murni tidak punya padanan yang terbaca di latar terang. */
  gelapSaja?: boolean;
}

export const colorThemes: Record<ColorThemeKey, ColorTheme> = {
  cyan: { bg: '#0c0f17', wall: '#0f172a', line: '#38bdf8', glow: '#7dd3fc', name: 'CYAN ELECTRIC', lineLight: '#0e7490', glowLight: '#06b6d4' },
  matrix: { bg: '#050b07', wall: '#09150d', line: '#22c55e', glow: '#4ade80', name: 'GREEN MATRIX', lineLight: '#15803d', glowLight: '#22c55e' },
  synthwave: { bg: '#0a0514', wall: '#140a24', line: '#ec4899', glow: '#f472b6', name: 'SYNTHWAVE NEON', lineLight: '#be185d', glowLight: '#ec4899' },
  blueprint: { bg: '#0f172a', wall: '#1e293b', line: '#38bdf8', glow: '#7dd3fc', name: 'CLASSIC BLUEPRINT', lineLight: '#1d4ed8', glowLight: '#3b82f6' },
  monochrome: { bg: '#09090b', wall: '#18181b', line: '#f4f4f5', glow: '#ffffff', name: 'MONOCHROME RETRO', lineLight: '#18181b', glowLight: '#71717a', gelapSaja: true },
};

export function paletteColors(key: ColorThemeKey, dark: boolean) {
  const theme = colorThemes[key] ?? colorThemes.cyan;
  return dark ? { line: theme.line, glow: theme.glow } : { line: theme.lineLight, glow: theme.glowLight };
}

export function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loadError, setLoadError] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [colorTheme, setColorTheme] = useState<ColorThemeKey>('cyan');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('left');
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(true);
  const [hovering, setHovering] = useState(false);
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminAllowed, setAdminAllowed] = useState(false);
  const [musicKey, setMusicKey] = useState(0);

  const ring = useRef<HTMLDivElement>(null);
  const angle = useRef(0);
  const count = items.length;
  const radius = count > 2 ? 105 / Math.tan(Math.PI / count) : 140;

  const reload = useCallback(async () => {
    if (NOT_CONFIGURED_MESSAGE) {
      setItems(demoSlots());
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

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(event => {
      if (!['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) return;
      if (event === 'SIGNED_OUT') setAdminAllowed(false);
      void reload();
    });
    return () => subscription.unsubscribe();
  }, [reload]);

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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPlaying(false);
  }, []);

  useEffect(() => {
    let id = 0;
    let last = 0;
    const frozen = hovering || selected !== null || adminOpen;

    function frame(time: number) {
      if (last && playing && !frozen) {
        angle.current = advanceRotation(angle.current, (time - last) / 1000, speed, direction);
      }
      last = time;

      if (ring.current) {
        ring.current.style.transform = `rotateY(${angle.current}deg)`;
        const tiles = ring.current.children;
        for (let i = 0; i < tiles.length; i++) {
          const tileAngle = (i * 360) / Math.max(count, 1) + angle.current;
          (tiles[i] as HTMLElement).style.opacity = tileOpacity(tileAngle).toFixed(2);
        }
      }
      id = requestAnimationFrame(frame);
    }
    id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, [playing, hovering, selected, adminOpen, speed, direction, count]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      setSelected(null);
      setAdminOpen(false);
      setPaletteOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = selected || adminOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [selected, adminOpen]);

  const rotating = playing && !hovering && !selected && !adminOpen;

  return (
    <main className="gallery-app">
      <header className="gallery-header">
        <div className="brand">
          <img src="/logo.png" alt={`Logo ${BRAND}`} className="brand-icon size-7 rounded-md object-contain" />
          <span>{BRAND}</span>
        </div>
        <span className="header-caption" />
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            <strong className="text-sm font-semibold text-foreground">{String(count).padStart(2, '0')}</strong> Photo
          </span>

          <div className="theme-control relative" aria-label="Tema">
            <Button
              variant="ghost"
              size="icon"
              title="Tema terang"
              aria-label="Tema terang"
              data-active={theme === 'light'}
              onClick={() => {
                setTheme('light');
                setColorTheme(k => (colorThemes[k].gelapSaja ? 'cyan' : k));
              }}
            >
              <Sun className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Tema gelap" aria-label="Tema gelap" data-active={theme === 'dark'} onClick={() => setTheme('dark')}>
              <Moon className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Pilih warna tema" aria-label="Pilih warna tema" aria-expanded={paletteOpen} data-active={paletteOpen} onClick={() => setPaletteOpen(v => !v)}>
              <Palette className="size-4" style={{ color: paletteColors(colorTheme, theme === 'dark').line }} />
            </Button>

            {paletteOpen && (
              <div className="absolute right-0 top-12 z-50 flex w-48 flex-col gap-1 rounded-xl border border-border bg-card/95 p-2 shadow-2xl backdrop-blur-md">
                <span className="px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground">PILIH WARNA TEMA</span>
                {(Object.keys(colorThemes) as ColorThemeKey[]).map(key => {
                  const item = colorThemes[key];
                  const isActive = colorTheme === key;
                  const terkunci = item.gelapSaja && theme === 'light';
                  const swatch = paletteColors(key, theme === 'dark');
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={terkunci}
                      title={terkunci ? 'Tidak terlihat pada tema terang' : undefined}
                      onClick={() => {
                        setColorTheme(key);
                        setPaletteOpen(false);
                      }}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-all ${
                        isActive ? 'bg-primary/15 text-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      } ${terkunci ? 'cursor-not-allowed opacity-40 hover:bg-transparent' : ''}`}
                    >
                      <span
                        className={`size-3.5 shrink-0 rounded-full border shadow-sm ${theme === 'dark' ? 'border-white/20' : 'border-black/15'}`}
                        style={{ backgroundColor: swatch.line, boxShadow: `0 0 8px ${swatch.glow}` }}
                      />
                      <span className="truncate">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="gallery-intro">
        <div>
          <h1>Galeri keluarga<span className="wordmark-dot" /></h1>
          <p className="intro-subtitle">
            <span className="wordmark-dot">Keluarga adalah tempat terhangat dalam hidupmu.</span>
          </p>
        </div>
      </section>

      {(NOT_CONFIGURED_MESSAGE || loadError) && (
        <p className="notice">{NOT_CONFIGURED_MESSAGE || loadError}</p>
      )}

      <section className="scene" aria-label="Carousel gambar 3D">
        <PerspectiveCorridor theme={theme} colorTheme={colorTheme} />
        <div className="carousel-orbit" data-view-angle={VIEW_ANGLE}>
          <div ref={ring} className="carousel-ring">
            {items.map((item, index) => (
              <div
                className="carousel-position"
                key={item.id}
                style={{ transform: `rotateY(${(index * 360) / Math.max(count, 1)}deg) translateZ(${radius}px)` }}
              >
                <Button
                  variant="ghost"
                  className="gallery-tile"
                  aria-label={`Lihat ${item.title}`}
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
                      <ImageIcon />
                      <span className="tile-label">Belum ada gambar</span>
                    </>
                  )}
                  <span className="tile-number">{String(index + 1).padStart(2, '0')}</span>
                  <Expand className="tile-corner" />
                  <div className="tile-info">
                    <strong>{item.title}</strong>
                    <p>{item.description || 'Belum ada deskripsi.'}</p>
                  </div>
                </Button>
              </div>
            ))}
          </div>
        </div>

        {count === 0 && !NOT_CONFIGURED_MESSAGE && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            Galeri belum memiliki gambar.
          </div>
        )}

        <div className="scene-bottom">
          <span>
            <Circle className="size-2 text-primary" />
            {rotating ? 'Sedang berputar' : 'Dijeda'}
          </span>
          <span>
            {BRAND} / {String(count).padStart(2, '0')}
          </span>
        </div>
      </section>

      <section className="playback" aria-label="Kontrol carousel">
        <div>
          <div className="control-label">Arah putaran</div>
          <div className="direction-buttons">
            <Button variant="ghost" size="icon" aria-label="Putar ke kiri" title="Putar ke kiri" data-active={direction === 'left'} onClick={() => setDirection('left')}>
              <ArrowLeft />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Putar ke kanan" title="Putar ke kanan" data-active={direction === 'right'} onClick={() => setDirection('right')}>
              <ArrowRight />
            </Button>
          </div>
        </div>
        <div className="control-divider" />
        <div className="speed-control">
          <div className="speed-heading">
            <div className="control-label">Kecepatan</div>
            <span className="speed-value">{speed.toFixed(1)}×</span>
          </div>
          <Slider aria-label="Kecepatan putaran" min={0.2} max={3} step={0.1} value={[speed]} onValueChange={v => setSpeed(v[0] ?? 1)} />
        </div>
        <div className="control-divider" />
        <Button
          className="pause-control"
          size="icon"
          aria-label={playing ? 'Jeda putaran' : 'Lanjutkan putaran'}
          title={playing ? 'Jeda' : 'Lanjutkan'}
          onClick={() => setPlaying(v => !v)}
        >
          {playing ? <Pause /> : <Play />}
        </Button>
      </section>

      <footer className="gallery-footer">
        <span>{BRAND}</span>
        <span className="flex items-center gap-3">
          <span>{count} Photo</span>
          <Button className="settings-button" variant="ghost" size="icon" aria-label="Kelola galeri" title="Kelola galeri" onClick={() => setAdminOpen(true)}>
            <Settings />
          </Button>
        </span>
      </footer>

      {selected && (
        <section className="viewer" role="dialog" aria-modal="true" aria-label={selected.title}>
          <div className="viewer-header">
            <div className="brand">
              <img src="/logo.png" alt={`Logo ${BRAND}`} className="brand-icon size-5 rounded-sm object-contain" />
              {BRAND}
            </div>
            <Button variant="ghost" size="icon" autoFocus aria-label="Tutup gambar" onClick={() => { setSelected(null); setHovering(false); }}>
              <X />
            </Button>
          </div>
          <div className="viewer-image">
            {selected.image_url ? (
              <img src={selected.image_url} alt={selected.title} />
            ) : (
              <div className="viewer-empty">
                <ImageIcon />
                <span>Belum ada gambar</span>
              </div>
            )}
          </div>
          <div className="viewer-details">
            <h2>{selected.title}</h2>
            <p>{selected.description || 'Belum ada deskripsi.'}</p>
          </div>
        </section>
      )}

      <MusicPlayer adminAllowed={adminAllowed} refreshKey={musicKey} />

      {adminOpen && (
        <GalleryAdmin
          items={items}
          onClose={() => {
            setAdminOpen(false);
            setHovering(false);
          }}
          onAccessChange={setAdminAllowed}
          onChanged={() => {
            void reload();
            setMusicKey(k => k + 1);
          }}
        />
      )}
    </main>
  );
}
