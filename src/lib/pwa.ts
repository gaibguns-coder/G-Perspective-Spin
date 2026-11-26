import { useCallback, useEffect, useState } from 'react';

interface PromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface SafariNavigator extends Navigator {
  /** Hanya ada di Safari/iOS; menandai jendela yang dipasang ke layar utama. */
  standalone?: boolean;
}

export type Peranti = 'ios' | 'android' | 'chrome' | 'safari' | 'firefox' | 'lain';

/**
 * Pemasangan hanya bisa ditawarkan peramban yang mendukung PWA. Webview (termasuk
 * jendela aplikasi) tidak pernah mengirim beforeinstallprompt, jadi platform perlu
 * dikenali agar petunjuk manual yang ditampilkan tidak menyesatkan.
 */
export function kenaliPeranti(userAgent: string, maxTouchPoints: number): Peranti {
  const sentuh = maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && sentuh)) return 'ios';
  if (/Android/.test(userAgent)) return 'android';
  if (/Firefox/.test(userAgent)) return 'firefox';
  if (/Chrome|Chromium|Edg\//.test(userAgent)) return 'chrome';
  if (/Safari/.test(userAgent)) return 'safari';
  return 'lain';
}

export function dalamWebview(userAgent: string) {
  return /\bwv\b|Electron|Qoder|Instagram|FBAN|FBAV|Twitter|Snapchat/.test(userAgent);
}

/** Langkah cadangan ketika tombol pasang tidak muncul (webview, iOS, atau Chrome yang belum menawarkan). */
export function langkahPemasangan(peranti: Peranti): string[] {
  switch (peranti) {
    case 'ios':
      return [
        'Buka alamat ini lewat Safari, bukan dari aplikasi lain.',
        'Ketuk ikon Bagikan (kotak berpanah ke atas) di bilah bawah.',
        'Pilih “Add to Home Screen”, lalu “Add” — ikon G-Perspective-Spin muncul di layar utama.',
      ];
    case 'android':
      return [
        'Buka alamat ini lewat Chrome di HP Anda.',
        'Ketuk menu titik tiga di kanan atas.',
        'Pilih “Install app” (atau “Add to Home screen”), lalu konfirmasi.',
      ];
    case 'chrome':
      return [
        'Klik ikon pasang di ujung kanan bilah alamat, atau menu titik tiga → “Save and share” → “Install G-Perspective-Spin”.',
        'Setujui dialog pemasangan; ikon muncul di desktop dan di peluncur aplikasi Chrome.',
      ];
    case 'safari':
      return [
        'Pada Safari macOS: menu File → “Add to Dock” (Safari 17 ke atas).',
        'Pada iPhone/iPad: Bagikan → “Add to Home Screen”.',
      ];
    case 'firefox':
      return ['Firefox tidak memasang situs sebagai aplikasi. Buka alamat ini di Chrome atau Edge untuk mendapatkan ikon tersendiri.'];
    default:
      return ['Buka alamat ini di Chrome atau Edge, lalu gunakan menu peramban → “Install app”.'];
  }
}

export function usePwaInstall() {
  const [tertunda, setTertunda] = useState<PromptEvent | null>(null);
  const [terpasang, setTerpasang] = useState(false);
  const [tersalin, setTersalin] = useState(false);
  const [gagalSalin, setGagalSalin] = useState(false);
  const peranti = kenaliPeranti(navigator.userAgent, navigator.maxTouchPoints);
  const webview = dalamWebview(navigator.userAgent);

  useEffect(() => {
    const mode = window.matchMedia('(display-mode: standalone)');
    const browser = window.matchMedia('(display-mode: browser)');
    const peramban = window.navigator as SafariNavigator;
    const terpasangKini = () => mode.matches || peramban.standalone === true;
    setTerpasang(terpasangKini());
    const sinkron = () => setTerpasang(terpasangKini());

    const tangkap = (e: Event) => {
      e.preventDefault();
      setTertunda(e as PromptEvent);
    };
    const selesai = () => {
      setTerpasang(true);
      setTertunda(null);
    };
    mode.addEventListener('change', sinkron);
    browser.addEventListener('change', sinkron);
    window.addEventListener('beforeinstallprompt', tangkap);
    window.addEventListener('appinstalled', selesai);
    if (terpasangKini()) setTertunda(null);
    return () => {
      mode.removeEventListener('change', sinkron);
      browser.removeEventListener('change', sinkron);
      window.removeEventListener('beforeinstallprompt', tangkap);
      window.removeEventListener('appinstalled', selesai);
    };
  }, []);

  const pasang = useCallback(async () => {
    if (!tertunda) return;
    await tertunda.prompt();
    const { outcome } = await tertunda.userChoice;
    if (outcome === 'accepted') setTertunda(null);
  }, [tertunda]);

  const salinAlamat = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setTersalin(true);
      setGagalSalin(false);
      window.setTimeout(() => setTersalin(false), 2200);
    } catch {
      setTersalin(false);
      setGagalSalin(true);
    }
  }, []);

  return {
    dapatPasang: Boolean(tertunda),
    terpasang,
    pasang,
    peranti,
    webview,
    langkah: langkahPemasangan(peranti),
    alamat: window.location.host,
    alamatPenuh: window.location.href,
    salinAlamat,
    tersalin,
    gagalSalin,
  };
}

export function useFullscreen() {
  const [aktif, setAktif] = useState(() => Boolean(document.fullscreenElement));

  useEffect(() => {
    const sinkron = () => setAktif(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', sinkron);
    return () => document.removeEventListener('fullscreenchange', sinkron);
  }, []);

  async function ubah() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setAktif(Boolean(document.fullscreenElement));
    }
  }

  return { aktif, ubah };
}
