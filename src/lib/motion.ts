export const VIEW_ANGLE = 17;
export const INITIAL_SLOT_COUNT = 15;
export const BRAND = 'G-Perspective-Spin';

export type SpinDirection = 'left' | 'right';

export function advanceRotation(
  angle: number,
  delta: number,
  speed: number,
  direction: SpinDirection,
) {
  const sign = direction === 'left' ? -1 : 1;
  return (angle + Math.min(delta, 0.05) * speed * 8 * sign + 360) % 360;
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
