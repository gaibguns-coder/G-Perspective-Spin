import { describe, expect, it } from 'vitest';
import { advanceRotation, canEditGallery, INITIAL_SLOT_COUNT, tileOpacity, VIEW_ANGLE } from '@/lib/motion';
import { ALLOWED_AUDIO_EXT, ALLOWED_IMAGE_TYPES, nextPosition } from '@/lib/gallery';
import {
  DEFAULT_SETTINGS,
  fontStackOf,
  gabung,
  kontenBawaan,
  menuOn,
  textOf,
  type MenuKey,
  type TextKey,
} from '@/lib/settings';

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

describe('pengaturan teks dan menu', () => {
  it('bawaan memiliki teks, label, dan petunjuk untuk setiap kunci', () => {
    for (const key of Object.keys(DEFAULT_SETTINGS.texts) as TextKey[]) {
      const item = DEFAULT_SETTINGS.texts[key];
      expect(item.text.length, key).toBeGreaterThan(0);
      expect(item.label.length, key).toBeGreaterThan(0);
      expect(item.visible, key).toBe(true);
    }
    for (const key of Object.keys(DEFAULT_SETTINGS.menus) as MenuKey[]) {
      expect(DEFAULT_SETTINGS.menus[key].hint.length, key).toBeGreaterThan(0);
      expect(DEFAULT_SETTINGS.menus[key].on, key).toBe(true);
    }
  });

  it('tabel kosong menghasilkan bawaan dan tidak berbagi rujukan', () => {
    const hasil = gabung([], []);
    expect(hasil).toEqual(kontenBawaan());
    hasil.texts.introTitle.text = 'Diubah';
    expect(DEFAULT_SETTINGS.texts.introTitle.text).toBe('Galeri keluarga');
  });

  it('baris database menimpa bawaan per kolom', () => {
    const hasil = gabung(
      [{ key: 'introTitle', label: 'Judul utama', body: 'Keluarga', color: '#ff0000', font: '', visible: false, position: 3 }],
      [{ key: 'music', label: 'Pemutar musik', hint: 'Kotak hijau.', enabled: false, position: 8 }],
      { theme: 'light', color_theme: 'synthwave' },
      { direction: 'right', speed: '2.5', autoplay: false, pause_on_hover: false, view_angle: 24, slot_count: 9 },
      { page_title: 'Galeri Keluarga', lang: 'id' },
    );
    expect(hasil.texts.introTitle).toEqual({ label: 'Judul utama', text: 'Keluarga', color: '#ff0000', font: '', visible: false });
    expect(hasil.texts.brand.text).toBe('G-Perspective-Spin');
    expect(hasil.menus.music.on).toBe(false);
    expect(hasil.menus.footer.on).toBe(true);
    expect(hasil.appearance).toEqual({ theme: 'light', colorTheme: 'synthwave' });
    expect(hasil.motion).toEqual({ direction: 'right', speed: 2.5, autoplay: false, pauseOnHover: false, viewAngle: 24, slotCount: 9 });
    expect(hasil.info.pageTitle).toBe('Galeri Keluarga');
    expect(hasil.info.ogImage).toBe('/logo.png');
  });

  it('nilai di luar rentang atau bertipe salah dikembalikan ke bawaan', () => {
    const hasil = gabung(
      [{ key: 'brand', body: 123 }, { key: 'tidakDikenal', body: 'x' }],
      [{ key: 'footer', enabled: 'ya' }],
      { theme: 'neon' },
      { speed: 99, view_angle: -5, slot_count: 500 },
      null,
    );
    expect(hasil.texts.brand.text).toBe('G-Perspective-Spin');
    expect(Object.keys(hasil.texts)).toHaveLength(Object.keys(DEFAULT_SETTINGS.texts).length);
    expect(hasil.menus.footer.on).toBe(true);
    expect(hasil.appearance.theme).toBe('dark');
    expect(hasil.motion.speed).toBe(3);
    expect(hasil.motion.viewAngle).toBe(0);
    expect(hasil.motion.slotCount).toBe(40);
  });

  it('penonton memakai nilai tersimpan lalu jatuh ke bawaan', () => {
    const hasil = gabung([{ key: 'emptyGallery', body: 'Belum ada foto' }], []);
    expect(textOf(hasil, 'emptyGallery').text).toBe('Belum ada foto');
    expect(textOf(hasil, 'viewerEmpty').text).toBe('Belum ada gambar');
    expect(menuOn(hasil, 'corridor')).toBe(true);
  });

  it('font asing tidak menghasilkan tumpukan CSS', () => {
    expect(fontStackOf('Pacifico')).toBe("'Pacifico', cursive");
    expect(fontStackOf('Comic Sans')).toBeUndefined();
    expect(fontStackOf('')).toBeUndefined();
  });
});
