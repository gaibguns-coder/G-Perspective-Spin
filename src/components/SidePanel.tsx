import { Check, Copy, Download, Maximize, Minimize, Moon, Palette, SlidersHorizontal, Sun, X } from 'lucide-react';
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
  /** hanya benar bila akun yang masuk punya peran admin */
  adminAllowed?: boolean;
}

export function SidePanel({ open, onClose, theme, onTheme, colorTheme, onColorTheme, adminAllowed = false }: Props) {
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
            {install.terpasang ? (
              <Button className="panel-action" variant="outline" disabled>
                <Check className="size-4" />
                Terpasang sebagai aplikasi
              </Button>
            ) : (
              <>
                <Button
                  className="panel-action"
                  variant={install.dapatPasang ? 'default' : 'outline'}
                  disabled={!install.dapatPasang}
                  onClick={() => void install.pasang()}
                >
                  <Download className="size-4" />
                  {install.dapatPasang ? 'Instal sebagai aplikasi' : 'Instal sebagai aplikasi Chrome'}
                </Button>
                <Button className="panel-action" variant="outline" onClick={() => void install.salinAlamat()}>
                  {install.tersalin ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {install.tersalin ? 'Alamat tersalin' : `Salin alamat: ${install.alamat}`}
                </Button>
                <input
                  className="panel-address"
                  readOnly
                  value={install.alamatPenuh}
                  onFocus={e => e.currentTarget.select()}
                  aria-label="Alamat situs untuk dipasang"
                />
                {install.gagalSalin && (
                  <p className="panel-hint">
                    Peramban menolak menyalin otomatis. Klik kolom alamat di atas lalu salin sendiri (Ctrl+C).
                  </p>
                )}
                <ol className="panel-steps">
                  {install.langkah.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ol>
                {install.webview && (
                  <p className="panel-hint">
                    Situs ini sedang dibuka di dalam aplikasi, sehingga peramban tidak bisa menawarkan pemasangan.
                    Salin alamatnya lalu buka lewat Chrome atau Safari.
                  </p>
                )}
                {!install.webview && !install.dapatPasang && (
                  <p className="panel-hint">
                    Chrome belum menawarkan tombol pasang di jendela ini — ikuti langkah di atas, atau pasang lewat HP
                    dengan alamat yang sama.
                  </p>
                )}
              </>
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
          <a className="panel-link" href="/portofolio.html" target="_blank" rel="noopener">
            Portofolio karya
          </a>
          {adminAllowed && (
            <a className="panel-link" href="/ceopusat/" rel="noopener">
              Buka konsol kelola
            </a>
          )}
        </div>
      </aside>
    </>
  );
}
