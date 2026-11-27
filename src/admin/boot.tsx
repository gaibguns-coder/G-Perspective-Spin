import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Konsol } from './App';
import { AdminProvider } from './store';
import { bacaPreferensi } from '@/lib/settings';
import { colorThemes, terapkanPalet, type ColorThemeKey } from '@/lib/theme';

/**
 * Konsol dimuat dari dokumen root, bukan dari berkas HTML sendiri, karena host hanya
 * mem-fallback alamat berakhiran garis miring ke `index.html`. Judul dan `robots`
 * karenanya baru bisa dipasang di sini, sebelum kerangka konsol diambil.
 */
export function bootKonsol() {
  document.title = 'Konsol — G-Perspective-Spin';
  if (!document.querySelector('meta[name="robots"]')) {
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    document.head.appendChild(robots);
  }

  // Konsol mengikuti pilihan tampilan admin di perangkat ini, tetapi tetap gelap bila
  // pengunjung hanya memakai bawaan situs, dan palet gelap murni tidak dipakai di tema terang.
  const pref = bacaPreferensi();
  const gelap = pref.theme !== 'light';
  const pilihan = (pref.colorTheme ?? 'cyan') as ColorThemeKey;
  const palet = !gelap && colorThemes[pilihan]?.gelapSaja ? 'cyan' : pilihan;

  document.documentElement.classList.toggle('dark', gelap);
  terapkanPalet(palet, gelap);

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AdminProvider>
        <Konsol />
      </AdminProvider>
    </StrictMode>,
  );
}
