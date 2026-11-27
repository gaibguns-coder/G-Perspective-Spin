import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Konsol } from '@/admin/App';
import { AdminProvider } from '@/admin/store';
import { bacaPreferensi } from '@/lib/settings';
import { colorThemes, terapkanPalet, type ColorThemeKey } from '@/lib/theme';
import '../src/styles.css';

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
