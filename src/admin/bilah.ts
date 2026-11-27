import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';

/**
 * Lebar bilah samping yang bisa diseret dan bisa disembunyikan.
 *
 * Batas minimumnya bukan angka karangan: bilah diukur ulang dengan `width: max-content`
 * sehingga lebar baris terpanjang (ikon + teks + padding) yang menjadi lantai —
 * teks menu tidak akan pernah terpotong walau bilah diperkecil.
 */
export interface Bilah {
  lebar: number;
  sembunyi: boolean;
  toggelSembunyi: () => void;
  /** Ukur ulang lantai lebar; panggil ketika isi bilah berubah (daftar bertambah). */
  muatUkur: () => void;
  /** Pasang pada elemen bilah; isinya yang dipakai sebagai ukuran minimum. */
  isiRef: (el: HTMLElement | null) => void;
  pegangan: {
    role: 'separator';
    tabIndex: number;
    'aria-orientation': 'vertical';
    'aria-label': string;
    'aria-valuemin': number;
    'aria-valuemax': number;
    'aria-valuenow': number;
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void;
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => void;
    onPointerUp: () => void;
    onKeyDown: (e: ReactKeyboardEvent<HTMLElement>) => void;
  };
}

const LANGKAH = 16;

function kunci(nama: string) {
  return `gspin:bilah:${nama}`;
}

function simpan(nama: string, lebar: number) {
  try {
    localStorage.setItem(kunci(nama), String(Math.round(lebar)));
  } catch {
    /* penyimpanan perangkat penuh atau mode privat: lebar cukup berlaku sampai tab ditutup */
  }
}

function baca(nama: string, bawaan: number) {
  try {
    const angka = Number(localStorage.getItem(kunci(nama)));
    return Number.isFinite(angka) && angka >= 160 && angka <= 900 ? angka : bawaan;
  } catch {
    return bawaan;
  }
}

function bacaSembunyi(nama: string) {
  try {
    return localStorage.getItem(kunci(nama) + ':sembunyi') === '1';
  } catch {
    return false;
  }
}

export function useBilah(nama: string, bawaan: number): Bilah {
  const [lebar, setLebar] = useState(() => baca(nama, bawaan));
  const [sembunyi, setSembunyi] = useState(() => bacaSembunyi(nama));
  const [batas, setBatas] = useState({ min: 180, max: 620 });
  const isi = useRef<HTMLElement | null>(null);
  const seret = useRef<{ x: number; w: number } | null>(null);
  const kini = useRef({ lebar, batas });
  kini.current = { lebar, batas };

  const ukur = useCallback(() => {
    const el = isi.current;
    const jendela = window.innerWidth || 1200;
    let terpanjang = 0;
    if (el) {
      const sebelum = el.style.width;
      el.style.width = 'max-content';
      terpanjang = el.scrollWidth;
      el.style.width = sebelum;
    }
    const lantai = Math.max(180, Math.min(terpanjang + 12, Math.round(jendela * 0.55)));
    const atap = Math.max(lantai + 60, Math.min(640, Math.round(jendela * 0.6)));
    const next = { min: lantai, max: atap };
    setBatas(next);
    setLebar(w => Math.min(next.max, Math.max(next.min, w)));
    return next;
  }, []);

  useEffect(() => {
    ukur();
    const padaMuat = () => ukur();
    window.addEventListener('resize', padaMuat);
    return () => window.removeEventListener('resize', padaMuat);
  }, [ukur]);

  function geser(berapa: number) {
    const { min, max } = kini.current.batas;
    const next = Math.min(max, Math.max(min, kini.current.lebar + berapa));
    setLebar(next);
    simpan(nama, next);
  }

  function letakkan(ke: 'min' | 'max') {
    const next = kini.current.batas[ke];
    setLebar(next);
    simpan(nama, next);
  }

  return {
    lebar,
    sembunyi,
    muatUkur: ukur,
    toggelSembunyi: () => {
      const next = !sembunyi;
      setSembunyi(next);
      try {
        localStorage.setItem(kunci(nama) + ':sembunyi', next ? '1' : '0');
      } catch {
        /* sama seperti di atas */
      }
    },
    isiRef: (el: HTMLElement | null) => {
      isi.current = el;
    },
    pegangan: {
      role: 'separator',
      tabIndex: 0,
      'aria-orientation': 'vertical',
      'aria-label': `Ubah lebar ${nama}`,
      'aria-valuemin': batas.min,
      'aria-valuemax': batas.max,
      'aria-valuenow': Math.round(lebar),
      onPointerDown: e => {
        const b = ukur();
        seret.current = { x: e.clientX, w: Math.min(b.max, Math.max(b.min, lebar)) };
        e.currentTarget.setPointerCapture(e.pointerId);
      },
      onPointerMove: e => {
        const awal = seret.current;
        if (!awal) return;
        const { min, max } = kini.current.batas;
        setLebar(Math.min(max, Math.max(min, awal.w + (e.clientX - awal.x))));
      },
      onPointerUp: () => {
        if (!seret.current) return;
        seret.current = null;
        simpan(nama, kini.current.lebar);
      },
      onKeyDown: e => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          geser(-LANGKAH);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          geser(LANGKAH);
        } else if (e.key === 'Home') {
          e.preventDefault();
          letakkan('min');
        } else if (e.key === 'End') {
          e.preventDefault();
          letakkan('max');
        }
      },
    },
  };
}
