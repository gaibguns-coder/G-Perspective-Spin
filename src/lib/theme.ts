export type ColorThemeKey = 'cyan' | 'matrix' | 'synthwave' | 'blueprint' | 'monochrome';

export interface ColorTheme {
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

/**
 * Menulis palet terpilih ke variabel CSS dokumen supaya garis, glow, tombol, dan
 * slider ikut berubah. Dipakai galeri dan konsol /ceopusat/ agar keduanya tampak sama.
 */
export function terapkanPalet(key: ColorThemeKey, dark: boolean) {
  const active = colorThemes[key] ?? colorThemes.cyan;
  const { line, glow } = paletteColors(key, dark);
  const root = document.documentElement;
  root.style.setProperty('--primary', line);
  root.style.setProperty('--primary-foreground', key === 'monochrome' ? '#09090b' : '#ffffff');
  root.style.setProperty('--card-glow', dark ? glow : `color-mix(in srgb, ${glow} 45%, transparent)`);
  if (dark) root.style.setProperty('--background', active.bg);
  else root.style.removeProperty('--background');
}
