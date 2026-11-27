export const VIEW_ANGLE = 17;
export const INITIAL_SLOT_COUNT = 15;
export const BRAND = 'G-Perspective-Spin';

export type SpinDirection = 'left' | 'right';

/** Putaran tidak berhenti mendadak saat kursor di atas gambar, hanya melambat. */
export const FAKTOR_KURSI = 0.18;
/** Konstanta waktu pendekatan ke kelajuan sasaran, per detik. */
export const LAJU_EASE = 3.2;
/** Derajat per detik ketika pengali kecepatan berada di 1×. */
export const DEG_PER_DETIK = 8;
/** Setengah sudut kincin pada slot terbanyak; dipakai sebagai pengali jarak. */
const JARAK_PAS = 105;
/** Kedalaman perspektif panggung sebelum admin mengubahnya. */
export const PERSPECTIVE_DASAR = 1600;

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
  degPerSec = DEG_PER_DETIK,
) {
  const sign = direction === 'left' ? -1 : 1;
  return (angle + Math.min(delta, 0.05) * speed * faktor * degPerSec * sign + 360) % 360;
}

/**
 * Jari-jari kincin yang membuat kartu bersentuhan rapat: makin banyak slot, makin
 * lebar lingkarnya. `radiusPct` 100 berarti mengikuti jarak otomatis itu.
 */
export function radiusRing(count: number, radiusPct = 100) {
  const pas = count > 2 ? JARAK_PAS / Math.tan(Math.PI / count) : 140;
  return (pas * radiusPct) / 100;
}

/**
 * Tanpa `fadePct` rumusnya tetap 1.0–2.0 sehingga peramban memangkasnya menjadi
 * opacity penuh — perilaku bawaan. Nilai 0–90 mengubah faktor kedalaman menjadi
 * redup nyata pada kartu yang membelakangi penonton.
 */
export function tileOpacity(tileAngle: number, fadePct = 0) {
  const factor = (Math.cos((tileAngle * Math.PI) / 180) + 1) / 2;
  if (fadePct <= 0) return 1 + factor;
  return 1 - (Math.min(fadePct, 90) / 100) * (1 - factor);
}

export function canEditGallery(roles: readonly string[]) {
  return roles.includes('admin');
}
