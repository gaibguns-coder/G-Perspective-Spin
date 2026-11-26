import { describe, expect, it } from 'vitest';
import { advanceRotation, canEditGallery, INITIAL_SLOT_COUNT, tileOpacity, VIEW_ANGLE } from '@/lib/motion';
import { ALLOWED_AUDIO_EXT, ALLOWED_IMAGE_TYPES, nextPosition } from '@/lib/gallery';

describe('aturan gerak galeri', () => {
  it('berputar dua arah dan simetris', () => {
    const left = advanceRotation(0, 1, 1, 'left');
    const right = advanceRotation(0, 1, 1, 'right');
    expect(left).toBeGreaterThan(180);
    expect(right).toBeLessThan(180);
    expect(360 - left).toBeCloseTo(right, 4);
  });

  it('kecepatan menggandakan langkah', () => {
    expect(advanceRotation(0, 0.05, 2, 'right')).toBeCloseTo(advanceRotation(0, 0.05, 1, 'right') * 2, 4);
  });

  it('jeda total saat delta waktu nol', () => {
    expect(advanceRotation(123, 0, 2, 'right')).toBe(123);
  });

  it('lonjakan waktu setelah tab dibekukan dipangkas', () => {
    expect(advanceRotation(0, 10, 1, 'right')).toBe(advanceRotation(0, 0.05, 1, 'right'));
  });

  it('hasil selalu berada di rentang 0–360', () => {
    expect(advanceRotation(359.8, 0.05, 1, 'right')).toBeCloseTo(0.2, 4);
    expect(advanceRotation(0.2, 0.05, 1, 'left')).toBeCloseTo(359.8, 4);
  });

  it('kedalaman kartu mengikuti kosinus sudut', () => {
    expect(tileOpacity(0)).toBeCloseTo(2, 4);
    expect(tileOpacity(180)).toBeCloseTo(1, 4);
  });
});

describe('geometri dan gerbang peran', () => {
  it('sudut pandang 17 derajat dengan 15 slot awal', () => {
    expect(VIEW_ANGLE).toBe(17);
    expect(INITIAL_SLOT_COUNT).toBe(15);
  });

  it('hanya peran admin yang boleh mengelola', () => {
    expect(canEditGallery(['admin'])).toBe(true);
    expect(canEditGallery(['user'])).toBe(false);
    expect(canEditGallery([])).toBe(false);
  });

  it('posisi berikutnya selalu di akhir daftar', () => {
    expect(nextPosition([{ position: 3 }, { position: 9 }, { position: 1 }])).toBe(10);
    expect(nextPosition([])).toBe(1);
  });

  it('hanya format berkas yang didukung yang diterima', () => {
    expect(ALLOWED_IMAGE_TYPES).toContain('image/webp');
    expect(ALLOWED_IMAGE_TYPES).not.toContain('image/svg+xml');
    expect(ALLOWED_AUDIO_EXT).toContain('flac');
    expect(ALLOWED_AUDIO_EXT).not.toContain('exe');
  });
});
