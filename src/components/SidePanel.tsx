import { Check, Download, Maximize, Minimize, Moon, Palette, SlidersHorizontal, Sun, X } from 'lucide-react';
import { Button } from './ui/Button';
import { colorThemes, paletteColors, type ColorThemeKey } from '@/lib/theme';
import { useFullscreen, usePwaInstall } from '@/lib/pwa';

interface Props {
  open: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  onTheme: (next: 'dark' | 'light') => void;
  colorTheme: ColorThemeKey;
  onColorTheme: (next: ColorThemeKey) => void;
}

export function SidePanel({ open, onClose, theme, onTheme, colorTheme, onColorTheme }: Props) {
  const install = usePwaInstall();
  const fullscreen = useFullscreen();
  const palet = colorThemes[colorTheme] ?? colorThemes.cyan;
  const { line, glow } = paletteColors(colorTheme, theme === 'dark');

  return (
    <>
      <div
        className={`panel-backdrop${open ? ' is-open' : ''}`}
        onClick={open ? onClose : undefined}
        aria-hidden="true"
      />
      <aside
        className={`side-panel${open ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="false"
        aria-label="Pengaturan tampilan"
        aria-hidden={!open}
        inert={!open}
      >
        <div className="panel-heading">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-primary" />
            <h2>Pengaturan</h2>
          </div>
          <Button variant="ghost" size="icon" aria-label="Tutup pengaturan" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="panel-body">
          <section className="panel-group">
            <div className="panel-label">
              <Sun className="size-3.5" />
              Tampilan
            </div>
            <div className="segmented">
              <button type="button" data-active={theme === 'light'} onClick={() => onTheme('light')}>
                <Sun className="size-4" />
                Terang
              </button>
              <button type="button" data-active={theme === 'dark'} onClick={() => onTheme('dark')}>
                <Moon className="size-4" />
                Gelap
              </button>
            </div>
          </section>

          <section className="panel-group">
            <div className="panel-label">
              <Palette className="size-3.5" />
              Warna tema
            </div>
            <div className="palette-grid">
              {(Object.keys(colorThemes) as ColorThemeKey[]).map(key => {
                const item = colorThemes[key];
                const terkunci = Boolean(item.gelapSaja) && theme === 'light';
                const swatch = paletteColors(key, theme === 'dark');
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={terkunci}
                    title={terkunci ? 'Tidak terlihat pada tema terang' : item.name}
                    aria-pressed={colorTheme === key}
                    onClick={() => onColorTheme(key)}
                    className={`palette-card${colorTheme === key ? ' is-active' : ''}`}
                  >
                    <span
                      className="palette-dot"
                      style={{ backgroundColor: swatch.line, boxShadow: `0 0 10px ${swatch.glow}` }}
                    />
                    <span className="palette-name">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="panel-group">
            <div className="panel-label">
              <Download className="size-3.5" />
              Aplikasi
            </div>
            <Button
              className="panel-action"
              variant={install.dapatPasang ? 'default' : 'outline'}
              disabled={install.terpasang || !install.dapatPasang}
              onClick={() => void install.pasang()}
            >
              {install.terpasang ? <Check className="size-4" /> : <Download className="size-4" />}
              {install.terpasang ? 'Terpasang sebagai aplikasi' : 'Instal sebagai aplikasi Chrome'}
            </Button>
            {!install.terpasang && !install.dapatPasang && (
              <p className="panel-hint">
                Chrome belum menawarkan pemasangan. Buka situs ini lewat Chrome di alamat aman, lalu gunakan menu
                titik tiga &rarr; <em>Install app</em>.
              </p>
            )}
            <Button className="panel-action" variant="outline" onClick={() => void fullscreen.ubah()}>
              {fullscreen.aktif ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
              {fullscreen.aktif ? 'Keluar layar penuh' : 'Layar penuh'}
            </Button>
          </section>
        </div>

        <div className="panel-foot" style={{ borderColor: `${glow}33` }}>
          <span className="size-2 rounded-full" style={{ backgroundColor: line, boxShadow: `0 0 8px ${glow}` }} />
          Palet aktif: {palet.name}
        </div>
      </aside>
    </>
  );
}
