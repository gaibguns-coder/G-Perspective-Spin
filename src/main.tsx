import { Component, StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { Gallery } from './components/Gallery';
import { ruteKonsol } from './lib/routes';
import './styles.css';

interface BoundaryState {
  failed: boolean;
}

class AppBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('G-Perspective-Spin:', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100svh', padding: 24, textAlign: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, margin: '0 0 8px' }}>G-Perspective-Spin gagal dimuat</h1>
          <p style={{ opacity: 0.7, margin: '0 0 16px' }}>Muat ulang halaman untuk mencoba lagi.</p>
          <button onClick={() => location.reload()}>Muat ulang</button>
        </div>
      </div>
    );
  }
}

// Dua tampilan berbagi satu dokumen: alamat /ceopusat/ memuat kerangka konsol sebagai
// chunk terpisah, sehingga pengunjung galeri tidak ikut menanggung kode pengelola.
if (ruteKonsol(location.pathname)) {
  void import('./admin/boot').then(m => m.bootKonsol());
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppBoundary>
        <Gallery />
      </AppBoundary>
    </StrictMode>,
  );
}

// Hanya versi hasil build: pada dev server, cache service worker akan menahan modul
// lama dan mengganggu hot reload.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  });
}
