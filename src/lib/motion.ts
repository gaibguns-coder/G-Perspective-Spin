export const VIEW_ANGLE = 17;
export const INITIAL_SLOT_COUNT = 15;
export const BRAND = 'G-Perspective-Spin';

export type SpinDirection = 'left' | 'right';

/** Putaran tidak berhenti mendadak saat kursor di atas gambar, hanya melambat. */
export const FAKTOR_KURSI = 0.18;
/** Konstanta waktu pendekatan ke kelajuan sasaran, per detik. */
export const LAJU_EASE = 3.2;

/**
 * Menggerakkan satu nilai menuju sasaran secara eksponensial sehingga perubahan
 * kelajuan terasa halus pada refresh rate berapa pun.
 */
export function easeFaktor(sekarang: number, sasaran: number, delta: number, laju = LAJU_EASE) {
  const dt = Math.min(Math.max(delta, 0), 0.05);
  const langkah = 1 - Math.exp(-laju * dt);
  const berikut = sekarang + (sasaran - sekarang) * langkah;
  return Math.abs(berikut - sasaran) < 0.002 ? sasaran : berikut;
}

export function advanceRotation(
  angle: number,
  delta: number,
  speed: number,
  direction: SpinDirection,
  faktor = 1,
) {
  const sign = direction === 'left' ? -1 : 1;
  return (angle + Math.min(delta, 0.05) * speed * faktor * 8 * sign + 360) % 360;
}

/**
 * Salinan persis rumus aslinya: nilainya 1.0–2.0 sehingga peramban selalu
 * memangkasnya menjadi opacity penuh. Faktor kedalaman tetap dikalikan supaya
 * mudah diubah menjadi fade nyata tanpa menyentuh geometri ring.
 */
export function tileOpacity(tileAngle: number) {
  const factor = (Math.cos((tileAngle * Math.PI) / 180) + 1) / 2;
  return 1 + factor;
}

export function canEditGallery(roles: readonly string[]) {
  return roles.includes('admin');
}
