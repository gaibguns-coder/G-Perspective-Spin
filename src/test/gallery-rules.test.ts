import { describe, expect, it } from 'vitest';
import {
  advanceRotation,
  canEditGallery,
  DEG_PER_DETIK,
  FAKTOR_KURSI,
  easeFaktor,
  INITIAL_SLOT_COUNT,
  radiusRing,
  tileOpacity,
  VIEW_ANGLE,
} from '@/lib/motion';
import { dalamWebview, kenaliPeranti, langkahPemasangan } from '@/lib/pwa';
import { ALLOWED_AUDIO_EXT, ALLOWED_IMAGE_TYPES, nextPosition } from '@/lib/gallery';
import { ruteKonsol } from '@/lib/routes';
import { contohSlot, contohTeks } from '@/lib/contoh';
import { nomorWa, sisaKueri, surel } from '@/lib/kontak';
import {
  adalahHal,
  DEFAULT_MOTION,
  DEFAULT_BLOCKS,
  DEFAULT_SETTINGS,
  daftarHalaman,
  blokOf,
  fontStackOf,
  gabung,
  kontenBawaan,
  kunciHal,
  kunciIsi,
  kunciJudul,
  menuOn,
  ruteHal,
  slugBersih,
  slugUnik,
  tautanHal,
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

  it('jari-jari mengikuti jumlah slot dan pengali persen', () => {
    expect(radiusRing(15)).toBeCloseTo(radiusRing(15, 100), 6);
    expect(radiusRing(15, 200)).toBeCloseTo(radiusRing(15) * 2, 6);
    expect(radiusRing(1)).toBeGreaterThan(0);
    expect(radiusRing(15) > radiusRing(6)).toBe(true);
  });

  it('kelajuan dasar derajat per detik dapat diubah', () => {
    // Delta selalu dipangkas ke 0,05 detik, jadi satu langkah = kelajuan × 0,05.
    expect(advanceRotation(0, 0.05, 1, 'right')).toBeCloseTo(DEG_PER_DETIK * 0.05, 4);
    expect(advanceRotation(0, 0.05, 1, 'right', 1, 20)).toBeCloseTo(20 * 0.05, 4);
  });

  it('redup kedalaman nol berarti tetap seperti bawaan', () => {
    expect(tileOpacity(0, 0)).toBeCloseTo(2, 4);
    expect(tileOpacity(0, 40)).toBeCloseTo(1, 4);
    expect(tileOpacity(180, 40)).toBeCloseTo(0.6, 4);
    expect(tileOpacity(180, 500)).toBeCloseTo(0.1, 4);
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
    expect(hasil.motion).toEqual({ ...DEFAULT_MOTION, direction: 'right', speed: 2.5, autoplay: false, pauseOnHover: false, viewAngle: 24, slotCount: 9 });
    expect(hasil.info.pageTitle).toBe('Galeri Keluarga');
    expect(hasil.info.ogImage).toBe('/logo.png');
  });

  it('baris gerak yang baru dipangkas ke rentang aman', () => {
    const hasil = gabung([], [], null, {
      orientation: 'vertical',
      perspective: 90,
      stage_pct: 150,
      radius_pct: 120,
      hover_pct: 40,
      ease_rate: '9.5',
      fade_pct: 200,
      deg_per_sec: 0,
    });
    expect(hasil.motion.orientation).toBe('vertical');
    expect(hasil.motion.perspective).toBe(400);
    expect(hasil.motion.stagePct).toBe(150);
    expect(hasil.motion.radiusPct).toBe(120);
    expect(hasil.motion.hoverPct).toBe(40);
    expect(hasil.motion.easeRate).toBe(9.5);
    expect(hasil.motion.fadePct).toBe(90);
    expect(hasil.motion.degPerSec).toBe(1);
  });

  it('sudut pandang negatif berarti melihat dari bawah', () => {
    expect(gabung([], [], null, { view_angle: -30 }).motion.viewAngle).toBe(-30);
    expect(gabung([], [], null, { view_angle: -80 }).motion.viewAngle).toBe(-45);
    expect(gabung([], [], null, { orientation: 'miring' }).motion.orientation).toBe('horizontal');
  });

  it('blok tak dikenal diabaikan dan nilai di luar rentang dipangkas', () => {
    const hasil = gabung([], [], null, null, null, [
      { key: 'scene', label: 'Panggung', hint: 'Ring 3D.', x: '12.5', y: -8, scale: 1.25, z: 4 },
      { key: 'tidakDikenal', x: 99 },
      { key: 'footer', x: 900, y: 'bukan angka', scale: 9 },
    ]);
    expect(Object.keys(hasil.blocks)).toHaveLength(Object.keys(DEFAULT_BLOCKS).length);
    expect(hasil.blocks.scene).toEqual({ label: 'Panggung', hint: 'Ring 3D.', x: 12.5, y: -8, scale: 1.25, z: 4 });
    expect(hasil.blocks.footer).toEqual({ ...DEFAULT_BLOCKS.footer, x: 50, y: 0, scale: 2 });
    expect(blokOf(hasil, 'header')).toEqual(DEFAULT_BLOCKS.header);
  });

  it('nilai di luar rentang atau bertipe salah dikembalikan ke bawaan', () => {
    const hasil = gabung(
      [{ key: 'brand', body: 123 }, { key: 'tidakDikenal', body: 'x' }],
      [{ key: 'footer', enabled: 'ya' }],
      { theme: 'neon' },
      { speed: 99, view_angle: -90, slot_count: 500 },
      null,
    );
    expect(hasil.texts.brand.text).toBe('G-Perspective-Spin');
    expect(Object.keys(hasil.texts)).toHaveLength(Object.keys(DEFAULT_SETTINGS.texts).length);
    expect(hasil.menus.footer.on).toBe(true);
    expect(hasil.appearance.theme).toBe('dark');
    expect(hasil.motion.speed).toBe(3);
    expect(hasil.motion.viewAngle).toBe(-45);
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

describe('perlambatan hover dan pemasangan aplikasi', () => {
  it('faktor tidak berubah tanpa delta dan bergerak bertahap ke sasaran', () => {
    expect(easeFaktor(1, FAKTOR_KURSI, 0)).toBe(1);
    const sekali = easeFaktor(1, FAKTOR_KURSI, 1 / 60);
    expect(sekali).toBeLessThan(1);
    expect(sekali).toBeGreaterThan(FAKTOR_KURSI + 0.5);
  });

  it('faktor mencapai sasaran setelah cukup waktu, tanpa melompat', () => {
    let f = 1;
    for (let i = 0; i < 200; i++) f = easeFaktor(f, FAKTOR_KURSI, 1 / 60);
    expect(f).toBe(FAKTOR_KURSI);
    expect(easeFaktor(FAKTOR_KURSI, 1, 1 / 60)).toBeLessThan(0.3);
  });

  it('delta waktu negatif tidak memundurkan faktor', () => {
    expect(easeFaktor(0.5, 1, -2)).toBe(0.5);
  });

  it('faktor menurunkan langkah putaran sebanding', () => {
    expect(advanceRotation(90, 0.05, 2, 'right', 0)).toBe(90);
    expect(advanceRotation(0, 0.05, 1, 'right', 0.5)).toBeCloseTo(advanceRotation(0, 0.05, 1, 'right') * 0.5, 4);
    expect(advanceRotation(0, 0.05, 1, 'right')).toBeCloseTo(advanceRotation(0, 0.05, 1, 'right', 1), 4);
  });

  it('peranti dikenali dari user agent', () => {
    expect(kenaliPeranti('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1', 5)).toBe('ios');
    expect(kenaliPeranti('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Safari/605.1.15', 5)).toBe('ios');
    expect(kenaliPeranti('Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/120 Mobile Safari/537.36', 5)).toBe('android');
    expect(kenaliPeranti('Mozilla/5.0 (Windows NT 10.0; Win64) Chrome/120 Safari/537.36', 0)).toBe('chrome');
    expect(kenaliPeranti('Mozilla/5.0 (Windows NT 10.0; rv:128.0) Gecko/20100101 Firefox/128.0', 0)).toBe('firefox');
    expect(kenaliPeranti('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Version/17.4 Safari/605.1.15', 0)).toBe('safari');
    expect(dalamWebview('Mozilla/5.0 (Linux; Android 14; wv) Chrome/120')).toBe(true);
    expect(dalamWebview('Mozilla/5.0 (Windows NT 10.0; Win64) Chrome/120 Safari/537.36')).toBe(false);
  });

  it('setiap peranti punya petunjuk pemasangan', () => {
    for (const peranti of ['ios', 'android', 'chrome', 'safari', 'firefox', 'lain'] as const) {
      expect(langkahPemasangan(peranti).length, peranti).toBeGreaterThan(0);
    }
  });
});

describe('alamat konsol', () => {
  it('hanya /ceopusat dan /ceopusat/ yang dialihkan dari galeri', () => {
    expect(ruteKonsol('/ceopusat/')).toBe(true);
    expect(ruteKonsol('/ceopusat')).toBe(true);
    expect(ruteKonsol('/')).toBe(false);
    expect(ruteKonsol('/portofolio.html')).toBe(false);
    expect(ruteKonsol('/ceopusat/gerak')).toBe(false);
    expect(ruteKonsol('/situs/ceopusat/')).toBe(false);
  });
});

describe('halaman buatan pengelola', () => {
  it('menurunkan slug dari nama menu', () => {
    expect(slugBersih('Tentang Kami')).toBe('tentang-kami');
    expect(slugBersih('  Kontak  ')).toBe('kontak');
    expect(slugBersih('Layanan & Harga')).toBe('layanan-harga');
    expect(slugBersih('Áksèn Terkùnci')).toBe('aksen-terkunci');
    expect(slugBersih('!!!')).toBe('halaman');
    expect(slugBersih('x'.repeat(60))).toHaveLength(40);
  });

  it('tiga baris per halaman dan tidak bentrok dengan bagian bawaan', () => {
    expect(kunciHal('tentang')).toBe('hal:tentang');
    expect(kunciJudul('tentang')).toBe('hal:tentang:judul');
    expect(kunciIsi('tentang')).toBe('hal:tentang:isi');
    expect(adalahHal('hal:tentang')).toBe(true);
    expect(adalahHal('introTitle')).toBe(false);
    expect(ruteHal('tentang')).toBe('#/hal/tentang');
    // Tombol "Buka" di konsol harus keluar dari dokumen konsol, bukan membuka konsol itu sendiri.
    expect(tautanHal('tentang')).toBe('/#/hal/tentang');
  });

  it('slug unik menambah akhiran, bukan menimpa halaman lama', () => {
    const content = kontenBawaan();
    expect(slugUnik(content, 'Tentang')).toBe('tentang');
    content.menus[kunciHal('tentang')] = { label: 'Tentang', hint: '', on: true };
    expect(slugUnik(content, 'Tentang')).toBe('tentang-2');
    content.menus[kunciHal('tentang-2')] = { label: 'Tentang', hint: '', on: true };
    expect(slugUnik(content, 'Tentang')).toBe('tentang-3');
  });

  it('daftar halaman hanya melihat halaman, bukan baris judul dan isinya', () => {
    const content = kontenBawaan();
    expect(daftarHalaman(content)).toEqual([]);
    content.menus[kunciHal('tentang')] = { label: 'Tentang', hint: '', on: true };
    content.texts[kunciJudul('tentang')] = { label: 'Judul', text: 'Tentang Kami', color: '', font: '', visible: true };
    content.texts[kunciIsi('tentang')] = { label: 'Isi', text: 'Halo', color: '', font: '', visible: true };
    const daftar = daftarHalaman(content);
    expect(daftar).toHaveLength(1);
    expect(daftar[0].slug).toBe('tentang');
    expect(daftar[0].judul.text).toBe('Tentang Kami');
    expect(daftar[0].isi.text).toBe('Halo');
  });

  it('urutan baris database yang dibaca ulang mengikuti position, bukan bawaan', () => {
    const bawaan = Object.keys(kontenBawaan().menus);
    const terbalik = [...bawaan].reverse();
    const hasil = gabung([], terbalik.map(k => ({ key: k, label: k, hint: '', enabled: true, position: 1 })));
    expect(Object.keys(hasil.menus).slice(0, terbalik.length)).toEqual(terbalik);
    // Halaman baru menempel di belakang baris bawaan, tidak menyisip di tengah.
    const dua = gabung([], [
      { key: 'hal:satu', label: 'Satu', hint: '', enabled: true, position: 1 },
      { key: bawaan[0], label: bawaan[0], hint: '', enabled: true, position: 2 },
    ]);
    expect(Object.keys(dua.menus)[0]).toBe('hal:satu');
    expect(Object.keys(dua.menus)[1]).toBe(bawaan[0]);
  });

  it('baris asing hanya diterima bila bermula hal:', () => {
    const hasil = gabung(
      [
        { key: 'hal:baru:judul', label: 'Judul', body: 'Baru', color: '', font: '', visible: true, position: 1 },
        { key: 'entriLama', label: 'Asing', body: 'buang', color: '', font: '', visible: true, position: 2 },
      ],
      [
        { key: 'hal:baru', label: 'Baru', hint: '', enabled: true, position: 1 },
        { key: 'menuLama', label: 'Asing', hint: '', enabled: false, position: 2 },
      ],
    );
    expect(hasil.texts['hal:baru:judul'].text).toBe('Baru');
    expect(hasil.texts.entriLama).toBeUndefined();
    expect(hasil.menus['hal:baru'].label).toBe('Baru');
    expect(hasil.menus.menuLama).toBeUndefined();
  });
});

describe('gambar contoh untuk bingkai yang belum diisi foto', () => {
  it('data-URI SVG, corak tetap untuk nomor yang sama', () => {
    expect(contohSlot(4)).toBe(contohSlot(4));
    expect(contohSlot(4).startsWith('data:image/svg+xml,')).toBe(true);
    expect(decodeURIComponent(contohSlot(4))).toContain('CONTOH');
  });

  it('dua belas bingkai berturut-turut tidak ada yang kembar', () => {
    expect(new Set(Array.from({ length: 12 }, (_, i) => contohSlot(i + 1))).size).toBe(12);
  });

  it('nomor di luar rentang tidak menghasilkan SVG rusak', () => {
    for (const svg of [contohSlot(0), contohSlot(-3), contohSlot(24)]) {
      const isi = decodeURIComponent(svg);
      expect(isi).toContain('<svg xmlns=');
      expect(isi).toContain('</svg>');
      expect(isi).not.toContain('NaN');
      expect(isi).not.toContain('undefined');
    }
  });

  it('contoh teks selalu berpasangan dan menandai dirinya sebagai contoh', () => {
    for (const n of [1, 4, 7, 11, 0, -2]) {
      const t = contohTeks(n);
      expect(t.judul.length).toBeGreaterThan(4);
      expect(t.deskripsi).toContain('contoh teks');
    }
    expect(contohTeks(1).judul).toBe(contohTeks(7).judul);
    expect(contohTeks(1).judul).not.toBe(contohTeks(2).judul);
  });
});

describe('gradasi koridor yang dapat disetel dari konsol', () => {
  it('pakai bawaan bila kolom migrasi 0007 belum ada', () => {
    const tanpa = gabung([], [], null, { id: 1, speed: 1 }, null, []);
    expect(tanpa.motion.corridorCorePct).toBe(DEFAULT_MOTION.corridorCorePct);
    expect(tanpa.motion.corridorFadePct).toBe(DEFAULT_MOTION.corridorFadePct);
    expect(tanpa.motion.corridorEdgePct).toBe(DEFAULT_MOTION.corridorEdgePct);
  });

  it('membaca angka dari baris site_motion dan mengikatnya ke rentang', () => {
    const tersimpan = gabung([], [], null, {
      corridor_core_pct: 80,
      corridor_fade_pct: 40,
      corridor_edge_pct: 5,
    }, null, []);
    expect(tersimpan.motion.corridorCorePct).toBe(80);
    expect(tersimpan.motion.corridorFadePct).toBe(40);
    expect(tersimpan.motion.corridorEdgePct).toBe(5);

    const liar = gabung([], [], null, {
      corridor_core_pct: 400,
      corridor_fade_pct: -12,
      corridor_edge_pct: 'tujuh',
    }, null, []);
    expect(liar.motion.corridorCorePct).toBe(100);
    expect(liar.motion.corridorFadePct).toBe(0);
    expect(liar.motion.corridorEdgePct).toBe(DEFAULT_MOTION.corridorEdgePct);
  });
});

describe('kontak yang disunting dari panel Metadata', () => {
  it('nomor WhatsApp dinormalkan ke digit berkode negara', () => {
    expect(nomorWa('+62 812-3456-7890')).toBe('6281234567890');
    expect(nomorWa('0812 3456 7890')).toBe('6281234567890');
    expect(nomorWa('6281234567890')).toBe('6281234567890');
    expect(nomorWa(6281234567890)).toBe('6281234567890');
    expect(nomorWa('kosong').length).toBe(0);
    expect(nomorWa('12345')).toBe('');
    expect(nomorWa('6281234567890123456')).toBe('');
    expect(nomorWa(null)).toBe('');
    // Yang bukan angka tidak pernah ikut ke href.
    expect(nomorWa('0812 3456 7890"><script>')).toBe('6281234567890');
  });

  it('hanya alamat yang benar-benar sah yang lolos ke mailto', () => {
    expect(surel('  Nama@Domain.COM ')).toBe('nama@domain.com');
    expect(surel('mailto:nama@domain.com')).toBe('nama@domain.com');
    expect(surel('nama@sub.domain.co.id')).toBe('nama@sub.domain.co.id');
    expect(surel('nama@domain')).toBe('');
    expect(surel('bukan email')).toBe('');
    expect(surel('a@b.co?id=1')).toBe('');
    expect(surel(undefined)).toBe('');
  });

  it('pesan bawaan tombol dipertahankan saat href ditimpa', () => {
    expect(sisaKueri('https://wa.me/628xxxxxxxxxx?text=Halo%2C%20saya')).toBe('?text=Halo%2C%20saya');
    expect(sisaKueri('https://wa.me/628xxxxxxxxxx')).toBe('');
    expect(sisaKueri('mailto:a@b.com?subject=X')).toBe('?subject=X');
  });

  it('baris site_info dinormalkan, dan nilai asing berarti kosong', () => {
    const diisi = gabung([], [], null, null, { whatsapp: '0812-3456-7890', email: 'MAIL@Contoh.COM' });
    expect(diisi.info.whatsapp).toBe('6281234567890');
    expect(diisi.info.email).toBe('mail@contoh.com');
    const asing = gabung([], [], null, null, { whatsapp: 'xxx', email: 'aaa' });
    expect(asing.info.whatsapp).toBe('');
    expect(asing.info.email).toBe('');
    const tanpa = gabung([], [], null, null, null);
    expect(tanpa.info.whatsapp).toBe('');
    expect(tanpa.info.email).toBe('');
  });
});
