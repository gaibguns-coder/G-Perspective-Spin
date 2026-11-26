import { useCallback, useEffect, useState } from 'react';

interface PromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface SafariNavigator extends Navigator {
  /** Hanya ada di Safari/iOS; menandai jendela yang dipasang ke layar utama. */
  standalone?: boolean;
}

/**
 * Tombol pemasangan Chrome: kejadian beforeinstallprompt hanya dikirim sekali dan
 * bisa hilang sebelum panel dibuka, jadi pendengarnya dipasang sejak aplikasi jalan.
 */
export function usePwaInstall() {
  const [tertunda, setTertunda] = useState<PromptEvent | null>(null);
  const [terpasang, setTerpasang] = useState(false);

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

  return { dapatPasang: Boolean(tertunda), terpasang, pasang };
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
