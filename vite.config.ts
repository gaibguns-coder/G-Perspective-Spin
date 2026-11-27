import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  // Akar ditulis eksplisit agar build tetap jalan lewat jalur symlink/junction.
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5175, strictPort: false },
  build: {
    rollupOptions: {
      // Dua halaman: galeri (SPA React) dan halaman portofolio yang kontennya sudah ada
      // di HTML awal sehingga terbaca mesin cari dan pratinjau tautan.
      // ceopusat dibangun ke dist/ceopusat/index.html sehingga alamatnya /ceopusat/ tanpa .html.
      input: {
        utama: fileURLToPath(new URL('./index.html', import.meta.url)),
        portofolio: fileURLToPath(new URL('./portofolio.html', import.meta.url)),
        ceopusat: fileURLToPath(new URL('./ceopusat/index.html', import.meta.url)),
      },
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('supabase')) return 'vendor-supabase';
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'vendor-react';
          return 'vendor';
        },
      },
    },
  },
});
