import { NOT_CONFIGURED_MESSAGE, supabase } from './supabase';
import type { CSSProperties } from 'react';
import type { ColorThemeKey } from './theme';
import { BRAND, DEG_PER_DETIK, FAKTOR_KURSI, INITIAL_SLOT_COUNT, LAJU_EASE, PERSPECTIVE_DASAR, VIEW_ANGLE, type SpinDirection } from './motion';

/**
 * Setiap data yang tampil di halaman user dan admin punya tabel sendiri di Supabase:
 *   site_texts      satu baris per teks (isi, warna, font, tampil/tidak)
 *   site_menus      satu baris per bagian yang bisa dinyalakan/dimatikan
 *   site_appearance tema + palet bawaan
 *   site_motion     arah, kecepatan, autoplay, sudut, jumlah slot
 *   site_info       judul dan metadata halaman
 * Pilihan yang bersifat per pengunjung (mis. jeda sementara) tetap di perangkat,
 * supaya keputusan satu orang tidak mengubah tampilan semua orang.
 */

export type TextKey =
  | 'brand'
  | 'photoLabel'
  | 'introTitle'
  | 'introSubtitle'
  | 'directionLabel'
  | 'speedLabel'
  | 'statusRunning'
  | 'statusPaused'
  | 'tileEmpty'
  | 'tileNoDesc'
  | 'emptyGallery'
  | 'viewerEmpty'
  | 'playlistHeading';

export type MenuKey =
  | 'header'
  | 'intro'
  | 'corridor'
  | 'status'
  | 'playback'
  | 'direction'
  | 'speed'
  | 'music'
  | 'sidePanel'
  | 'footer'
  | 'adminButton';

/** Bagian yang boleh digeser. Hanya `scene` yang tidak punya tuas di site_menus. */
export type BlockKey =
  | 'header'
  | 'intro'
  | 'scene'
  | 'status'
  | 'playback'
  | 'music'
  | 'sidePanel'
  | 'footer';

/**
 * Halaman buatan admin sendiri. Satu halaman memakai tiga baris yang sama-sama
 * berawalan `hal:`, sehingga tabel dan policy yang ada sudah cukup tanpa migrasi:
 *   site_menus      hal:<slug>          → teks menu, urutan, dan tuas tampil
 *   site_texts      hal:<slug>:judul    → judul besar halaman
 *   site_texts      hal:<slug>:isi      → paragraf isi
 */
export const HAL_AWAL = 'hal:';

export function slugBersih(nama: string): string {
  const tanpaAksen = nama
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return tanpaAksen.slice(0, 40) || 'halaman';
}

export const kunciJudul = (slug: string) => `${HAL_AWAL}${slug}:judul`;
export const kunciIsi = (slug: string) => `${HAL_AWAL}${slug}:isi`;
export const kunciHal = (slug: string) => `${HAL_AWAL}${slug}`;
export const adalahHal = (key: string) => key.startsWith(HAL_AWAL);
/** Alamat di dalam dokumen yang sama: host hanya mem-fallback jalur berakhiran garis miring. */
export const ruteHal = (slug: string) => `#/hal/${slug}`;

/**
 * Alamat halaman dilihat dari dokumen lain, misalnya tombol "Buka" di konsol.
 * `ruteHal()` saja akan membuka konsol itu sendiri karena hash tidak pernah
 * berpindah dokumen, jadi path galeri harus ditulis lebih dulu.
 */
export const tautanHal = (slug: string) => `/${ruteHal(slug)}`;

/** Slug halaman dari alamat saat ini; `null` berarti pengunjung melihat galeri. */
export function slugDariAlamat(): string | null {
  const jalur = window.location.hash.replace(/^#\/?/, '');
  if (!jalur.startsWith('hal/')) return null;
  const slug = jalur.slice(4).split('/')[0];
  try {
    return decodeURIComponent(slug) || null;
  } catch {
    return slug || null;
  }
}

export interface TextSetting {
  label: string;
  text: string;
  /** Kosong berarti ikut warna teks tema (varibel CSS --foreground). */
  color: string;
  /** Kosong berarti ikut font bawaan situs. */
  font: string;
  visible: boolean;
}
export interface MenuSetting {
  label: string;
  hint: string;
  on: boolean;
}

export interface Appearance {
  theme: 'dark' | 'light';
  colorTheme: ColorThemeKey;
}

export type SpinAxis = 'horizontal' | 'vertical';

export interface Motion {
  direction: SpinDirection;
  speed: number;
  autoplay: boolean;
  pauseOnHover: boolean;
  viewAngle: number;
  slotCount: number;
  /** horizontal = kincin berdiri (rotateY), vertical = kincin telentang (rotateX). */
  orientation: SpinAxis;
  /** Kedalaman perspektif dalam piksel; makin kecil makin dramatis. */
  perspective: number;
  /** Besar panggung dibanding bawaan layar, dalam persen. */
  stagePct: number;
  radiusPct: number;
  /** Sisa kecepatan saat kursor di atas kartu, dalam persen. */
  hoverPct: number;
  easeRate: number;
  /** Gelap kartu yang menghadap belakang, dalam persen. 0 berarti semua terangan. */
  fadePct: number;
  degPerSec: number;
}

/** Geometri satu bagian halaman; menyala/matinya tetap berada di site_menus. */
export interface Block {
  label: string;
  hint: string;
  /** Persen lebar layar (x) dan tinggi layar (y); 0 berarti tempat semula. */
  x: number;
  y: number;
  scale: number;
  /** 0 berarti ikut urutan tumpukan bawaan. */
  z: number;
}

export interface SiteInfo {
  pageTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  themeColor: string;
  lang: string;
}

export interface SiteContent {
  /** Kunci bawaan ada pada union; halaman buatan admin memakai kunci berawalan `hal:`. */
  texts: Record<string, TextSetting>;
  menus: Record<string, MenuSetting>;
  appearance: Appearance;
  motion: Motion;
  info: SiteInfo;
  blocks: Record<BlockKey, Block>;
}

/** Pasangan nama keluarga → tumpukan CSS. Muatannya mengikuti <link> di index.html. */
/** Keluarga huruf, dikelompokkan supaya panel Teks bisa menampilkannya sebagai keping. */
export const FONT_GROUPS: { kelompok: string; opsi: { name: string; stack: string }[] }[] = [
  {
    kelompok: 'Bersih',
    opsi: [
      { name: 'Manrope', stack: "'Manrope', sans-serif" },
      { name: 'Inter', stack: "'Inter', sans-serif" },
      { name: 'Poppins', stack: "'Poppins', sans-serif" },
      { name: 'Outfit', stack: "'Outfit', sans-serif" },
      { name: 'Sora', stack: "'Sora', sans-serif" },
      { name: 'Montserrat', stack: "'Montserrat', sans-serif" },
    ],
  },
  {
    kelompok: 'Tegas',
    opsi: [
      { name: 'Space Grotesk', stack: "'Space Grotesk', sans-serif" },
      { name: 'Bebas Neue', stack: "'Bebas Neue', sans-serif" },
      { name: 'Oswald', stack: "'Oswald', sans-serif" },
    ],
  },
  {
    kelompok: 'Tekno',
    opsi: [
      // Chakra Petch: kotak miring seperti huruf "DECONSTRUCTION"; Michroma dan
      // Orbitron: lebar berpita renggang untuk judul bergaya mesin.
      { name: 'Chakra Petch', stack: "'Chakra Petch', sans-serif" },
      { name: 'Michroma', stack: "'Michroma', sans-serif" },
      { name: 'Orbitron', stack: "'Orbitron', sans-serif" },
      { name: 'Righteous', stack: "'Righteous', cursive" },
      { name: 'JetBrains Mono', stack: "'JetBrains Mono', monospace" },
    ],
  },
  {
    kelompok: 'Naskah',
    opsi: [
      { name: 'Playfair Display', stack: "'Playfair Display', serif" },
      { name: 'Lora', stack: "'Lora', serif" },
      { name: 'Cormorant Garamond', stack: "'Cormorant Garamond', serif" },
      { name: 'Pacifico', stack: "'Pacifico', cursive" },
      { name: 'Caveat', stack: "'Caveat', cursive" },
    ],
  },
];

export const FONT_OPTIONS: { name: string; stack: string }[] = FONT_GROUPS.flatMap(g => g.opsi);

export function fontStackOf(name: string): string | undefined {
  return FONT_OPTIONS.find(f => f.name === name)?.stack;
}

const teks = (label: string, text: string, extra?: Partial<TextSetting>): TextSetting => ({
  label,
  text,
  color: '',
  font: '',
  visible: true,
  ...extra,
});

const menu = (label: string, hint: string, on = true): MenuSetting => ({ label, hint, on });

export const DEFAULT_SETTINGS = {
  texts: {
    brand: teks('Merek (bilah atas)', BRAND, { font: 'Space Grotesk' }),
    photoLabel: teks('Label penghitung', 'Photo'),
    introTitle: teks('Judul utama', 'Galeri keluarga', { font: 'Space Grotesk' }),
    introSubtitle: teks('Sub judul', 'Keluarga adalah tempat terhangat dalam hidupmu.', { font: 'Caveat' }),
    directionLabel: teks('Label arah putaran', 'Arah putaran'),
    speedLabel: teks('Label kecepatan', 'Kecepatan'),
    statusRunning: teks('Status sedang berputar', 'Sedang berputar'),
    statusPaused: teks('Status dijeda', 'Dijeda'),
    tileEmpty: teks('Teks kotak tanpa gambar', 'Belum ada gambar'),
    tileNoDesc: teks('Teks tanpa deskripsi', 'Belum ada deskripsi.'),
    emptyGallery: teks('Pesan galeri kosong', 'Galeri belum memiliki gambar.'),
    viewerEmpty: teks('Pesan layar penuh kosong', 'Belum ada gambar'),
    playlistHeading: teks('Judul daftar lagu', 'Daftar Lagu'),
  } satisfies Record<TextKey, TextSetting>,
  menus: {
    header: menu('Bilah atas', 'Logo, nama merek, dan penghitung foto.'),
    intro: menu('Judul pembuka', 'Judul besar dan sub judul di atas koridor.'),
    corridor: menu('Latar koridor 3D', 'Kanvas garis perspektif di belakang foto.'),
    status: menu('Chip status', 'Tanda "Sedang berputar" dan jumlah foto.'),
    playback: menu('Panel kontrol', 'Bilah arah, kecepatan, dan jeda di bawah koridor.'),
    direction: menu('Tombol arah', 'Panah kiri dan kanan di dalam panel kontrol.'),
    speed: menu('Slider kecepatan', 'Pengatur 0,2× sampai 3×.'),
    music: menu('Pemutar musik', 'Kotak hijau di pojok kiri bawah.'),
    sidePanel: menu('Tombol pengaturan', 'Ikon slider pembuka panel samping.'),
    footer: menu('Footer', 'Baris merek dan penghitung di dasar layar.'),
    adminButton: menu('Tombol kelola', 'Hanya muncul untuk akun admin.'),
  } satisfies Record<MenuKey, MenuSetting>,
};

export const DEFAULT_APPEARANCE: Appearance = { theme: 'dark', colorTheme: 'cyan' };

export const DEFAULT_MOTION: Motion = {
  direction: 'left',
  speed: 1,
  autoplay: true,
  pauseOnHover: true,
  viewAngle: VIEW_ANGLE,
  slotCount: INITIAL_SLOT_COUNT,
  orientation: 'horizontal',
  perspective: PERSPECTIVE_DASAR,
  stagePct: 100,
  radiusPct: 100,
  hoverPct: Math.round(FAKTOR_KURSI * 100),
  easeRate: LAJU_EASE,
  fadePct: 0,
  degPerSec: DEG_PER_DETIK,
};

const blok = (label: string, hint: string): Block => ({ label, hint, x: 0, y: 0, scale: 1, z: 0 });

/** Urutan kunci ini yang dipakai panel Tata Letak sebagai daftar bagian halaman. */
export const DEFAULT_BLOCKS = {
  header: blok('Bilah atas', 'Baris logo, penghitung, tautan, dan tombol pengaturan.'),
  intro: blok('Judul pembuka', 'Judul besar dan sub judul di atas panggung.'),
  scene: blok('Panggung carousel', 'Ring 3D berikut latar koridor.'),
  status: blok('Chip status', 'Garis penanda "sedang berputar" dan jumlah foto.'),
  playback: blok('Panel kontrol', 'Bilah arah, kecepatan, dan tombol jeda.'),
  music: blok('Pemutar musik', 'Kotak hijau melayang di pojok kiri bawah.'),
  sidePanel: blok('Panel samping', 'Lemari pengaturan yang membuka dari kanan.'),
  footer: blok('Footer', 'Baris merek dan penghitung di dasar layar.'),
} satisfies Record<BlockKey, Block>;

export const DEFAULT_INFO: SiteInfo = {
  pageTitle: `${BRAND} — Galeri Gambar 3D`,
  metaDescription:
    'Galeri gambar 3D berperspektif dengan putaran dua arah, kecepatan yang dapat diatur, dan tampilan gambar penuh.',
  ogTitle: `${BRAND} — Galeri Gambar 3D`,
  ogDescription: 'Koleksi gambar dalam gerak, dilihat dari sudut pandang baru.',
  ogImage: '/logo.png',
  themeColor: '#0c0f17',
  lang: 'id',
};

export function kontenBawaan(): SiteContent {
  return {
    texts: structuredClone(DEFAULT_SETTINGS.texts),
    menus: structuredClone(DEFAULT_SETTINGS.menus),
    appearance: { ...DEFAULT_APPEARANCE },
    motion: { ...DEFAULT_MOTION },
    info: { ...DEFAULT_INFO },
    blocks: structuredClone(DEFAULT_BLOCKS),
  };
}

export function textOf(content: SiteContent, key: TextKey): TextSetting {
  return content.texts[key] ?? DEFAULT_SETTINGS.texts[key];
}

/** Baris buatan admin tidak punya bawaan, jadi kunci baru dimulai dari kosong. */
export function teksBebas(content: SiteContent, key: string, label: string): TextSetting {
  return content.texts[key] ?? teks(label, '');
}

export function menuOn(content: SiteContent, key: MenuKey): boolean {
  return content.menus[key]?.on ?? DEFAULT_SETTINGS.menus[key].on;
}

/** Tuas halaman kustom: barisnya baru ada setelah admin menyimpan, jadi bawaannya tampil. */
export function menuBebas(content: SiteContent, key: string): boolean {
  return content.menus[key]?.on ?? true;
}

/** Satu halaman buatan admin, dirangkai dari tiga baris bertanda `hal:`. */
export interface HalamanKustom {
  slug: string;
  menu: MenuSetting;
  judul: TextSetting;
  isi: TextSetting;
}

/** Daftar slug halaman buatan admin, urutan sama dengan posisi baris di site_menus. */
export function daftarHalaman(content: SiteContent): HalamanKustom[] {
  return Object.keys(content.menus)
    .filter(k => adalahHal(k) && !k.includes(':judul') && !k.includes(':isi'))
    .map(k => {
      const slug = k.slice(HAL_AWAL.length);
      return {
        slug,
        menu: content.menus[k],
        judul: teksBebas(content, kunciJudul(slug), 'Judul halaman'),
        isi: teksBebas(content, kunciIsi(slug), 'Isi halaman'),
      };
    });
}

/** Slug yang belum dipakai, supaya dua halaman tidak berbagi alamat. */
export function slugUnik(content: SiteContent, nama: string): string {
  const dasar = slugBersih(nama);
  let slug = dasar;
  let i = 2;
  while (kunciHal(slug) in content.menus) slug = `${dasar}-${i++}`;
  return slug;
}

/** Geometri satu bagian; kunci yang belum punya baris tetap berada di tempatnya. */
export function blokOf(content: SiteContent, key: BlockKey): Block {
  return content.blocks[key] ?? DEFAULT_BLOCKS[key];
}

/**
 * Gaya tempat bagian setelah digeser admin. Memakai transform agar tata letak asli
 * (tinggi baris, posisi tetap pemutar musik, skala per lebar layar) tidak berubah;
 * nilai nol tidak menulis apa pun supaya tampilan bawaan tetap dari CSS.
 */
export function gayaBlok(b: Block): CSSProperties {
  const geser = b.x !== 0 || b.y !== 0;
  if (!geser && b.scale === 1 && !b.z) return {};
  return {
    transform: `translate(${b.x}vw, ${b.y}vh)${b.scale !== 1 ? ` scale(${b.scale})` : ''}`,
    ...(b.z ? { zIndex: b.z } : {}),
  };
}

/**
 * Rangkai konten dari baris mentah. Baris yang tidak ada tetap memakai bawaan,
 * sehingga menambah kunci baru tidak memerlukan migrasi isian.
 */
/**
 * Susun ulang peta mengikuti urutan baris database. Tanpa ini, urutan hasil muat
 * selalu urutan bawaan, sehingga nomor posisi yang ditulis konsol tidak pernah
 * benar-benar dibaca kembali dan draf terlihat "belum disimpan" selamanya.
 */
function ikutUrutan<T>(dasar: Record<string, T>, urutan: string[]): Record<string, T> {
  const hasil: Record<string, T> = {};
  for (const k of urutan) if (k in dasar && !(k in hasil)) hasil[k] = dasar[k];
  for (const k of Object.keys(dasar)) if (!(k in hasil)) hasil[k] = dasar[k];
  return hasil;
}

export function gabung(
  textRows: unknown,
  menuRows: unknown,
  appearance?: Record<string, unknown> | null,
  motion?: Record<string, unknown> | null,
  info?: Record<string, unknown> | null,
  blockRows?: unknown,
): SiteContent {
  const hasil = kontenBawaan();
  const str = (v: unknown, fallback: string) => (typeof v === 'string' && v ? v : fallback);
  const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
  /** Angka terikat rentang: tipe salah atau di luar batas kembali ke bawaan. */
  const angka = (v: unknown, min: number, max: number, fallback: number, desimal = 0) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    const pangkat = 10 ** desimal;
    return Math.min(max, Math.max(min, Math.round(n * pangkat) / pangkat));
  };

  // Baris bawaan dipulihkan dari DEFAULT, sedangkan baris berawalan `hal:` diterima
  // apa adanya: inilah jalan masuk halaman buatan admin tanpa menambah tabel.
  const urutanTeks: string[] = [];
  for (const row of Array.isArray(textRows) ? (textRows as Record<string, unknown>[]) : []) {
    const key = String(row.key ?? '');
    const lama = hasil.texts[key];
    if (!lama && !adalahHal(key)) continue;
    urutanTeks.push(key);
    const dasar = lama ?? teks(key, '');
    hasil.texts[key] = {
      label: str(row.label, dasar.label),
      text: typeof row.body === 'string' ? row.body : dasar.text,
      color: typeof row.color === 'string' ? row.color : '',
      font: typeof row.font === 'string' ? row.font : '',
      visible: bool(row.visible, true),
    };
  }
  hasil.texts = ikutUrutan(hasil.texts, urutanTeks);
  const urutanMenu: string[] = [];
  for (const row of Array.isArray(menuRows) ? (menuRows as Record<string, unknown>[]) : []) {
    const key = String(row.key ?? '');
    const lama = hasil.menus[key];
    if (!lama && !adalahHal(key)) continue;
    urutanMenu.push(key);
    const dasar = lama ?? menu(key, '');
    hasil.menus[key] = {
      label: str(row.label, dasar.label),
      hint: str(row.hint, dasar.hint),
      on: bool(row.enabled, true),
    };
  }
  hasil.menus = ikutUrutan(hasil.menus, urutanMenu);

  const tema = appearance?.theme;
  if (tema === 'dark' || tema === 'light') hasil.appearance.theme = tema;
  const palet = appearance?.color_theme;
  if (typeof palet === 'string' && palet !== '') {
    hasil.appearance.colorTheme = palet as ColorThemeKey;
  }

  const arah = motion?.direction;
  if (arah === 'left' || arah === 'right') hasil.motion.direction = arah;
  hasil.motion.speed = angka(motion?.speed, 0.2, 3, DEFAULT_MOTION.speed, 1);
  hasil.motion.autoplay = bool(motion?.autoplay, DEFAULT_MOTION.autoplay);
  hasil.motion.pauseOnHover = bool(motion?.pause_on_hover, DEFAULT_MOTION.pauseOnHover);
  hasil.motion.viewAngle = angka(motion?.view_angle, -45, 45, DEFAULT_MOTION.viewAngle);
  hasil.motion.slotCount = angka(motion?.slot_count, 3, 40, DEFAULT_MOTION.slotCount);
  const sumbu = motion?.orientation;
  if (sumbu === 'horizontal' || sumbu === 'vertical') hasil.motion.orientation = sumbu;
  hasil.motion.perspective = angka(motion?.perspective, 400, 4000, DEFAULT_MOTION.perspective);
  hasil.motion.stagePct = angka(motion?.stage_pct, 50, 200, DEFAULT_MOTION.stagePct);
  hasil.motion.radiusPct = angka(motion?.radius_pct, 40, 300, DEFAULT_MOTION.radiusPct);
  hasil.motion.hoverPct = angka(motion?.hover_pct, 0, 100, DEFAULT_MOTION.hoverPct);
  hasil.motion.easeRate = angka(motion?.ease_rate, 0.5, 12, DEFAULT_MOTION.easeRate, 2);
  hasil.motion.fadePct = angka(motion?.fade_pct, 0, 90, DEFAULT_MOTION.fadePct);
  hasil.motion.degPerSec = angka(motion?.deg_per_sec, 1, 30, DEFAULT_MOTION.degPerSec, 1);

  const urutanBlok: BlockKey[] = [];
  for (const row of Array.isArray(blockRows) ? (blockRows as Record<string, unknown>[]) : []) {
    const key = row.key as BlockKey;
    if (!(key in hasil.blocks)) continue;
    urutanBlok.push(key);
    hasil.blocks[key] = {
      label: str(row.label, hasil.blocks[key].label),
      hint: str(row.hint, hasil.blocks[key].hint),
      x: angka(row.x, -50, 50, 0, 2),
      y: angka(row.y, -40, 40, 0, 2),
      scale: angka(row.scale, 0.5, 2, 1, 2),
      z: angka(row.z, 0, 30, 0),
    };
  }
  hasil.blocks = ikutUrutan(hasil.blocks, urutanBlok) as SiteContent['blocks'];

  hasil.info = {
    pageTitle: str(info?.page_title, DEFAULT_INFO.pageTitle),
    metaDescription: str(info?.meta_description, DEFAULT_INFO.metaDescription),
    ogTitle: str(info?.og_title, DEFAULT_INFO.ogTitle),
    ogDescription: str(info?.og_description, DEFAULT_INFO.ogDescription),
    ogImage: str(info?.og_image, DEFAULT_INFO.ogImage),
    themeColor: str(info?.theme_color, DEFAULT_INFO.themeColor),
    lang: str(info?.lang, DEFAULT_INFO.lang),
  };
  return hasil;
}

async function coba<T>(jalan: PromiseLike<{ data: T | null; error: unknown }>, fallback: T | null) {
  try {
    const { data, error } = await jalan;
    return error ? fallback : (data ?? fallback);
  } catch {
    return fallback;
  }
}

export async function loadContent(): Promise<SiteContent> {
  if (NOT_CONFIGURED_MESSAGE) return kontenBawaan();
  const [textRows, menuRows, appearance, motion, info, blockRows] = await Promise.all([
    coba(supabase.from('site_texts').select('key,label,body,color,font,visible,position').order('position'), null),
    coba(supabase.from('site_menus').select('key,label,hint,enabled,position').order('position'), null),
    coba(supabase.from('site_appearance').select('*').eq('id', 1).maybeSingle(), null),
    coba(supabase.from('site_motion').select('*').eq('id', 1).maybeSingle(), null),
    coba(supabase.from('site_info').select('*').eq('id', 1).maybeSingle(), null),
    coba(supabase.from('site_blocks').select('key,label,hint,x,y,scale,z,position').order('position'), null),
  ]);
  return gabung(textRows, menuRows, appearance, motion, info, blockRows);
}

/**
 * Bentuk error PostgREST yang dipakai bersama. Pesan server sengaja ikut ditampilkan:
 * "gagal" tanpa sebab membuat pengelola menebak-nebak, padahal biasanya hanya satu
 * kolom atau tabel yang belum ada karena migrasi belum dijalankan.
 */
interface GalatSisa {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

function sebabGalat(error: GalatSisa): string {
  const pesan = error.message?.trim() || 'tanpa pesan dari server';
  return `${pesan}${error.code ? ` (${error.code})` : ''}`;
}

/** Simpan setiap kelompok ke tabelnya sendiri; kegagalan dikumpulkan, bukan dihentikan di baris pertama. */
export async function saveContent(next: SiteContent): Promise<void> {
  if (NOT_CONFIGURED_MESSAGE) throw new Error('Backend belum disambungkan, pengaturan tidak dapat disimpan.');
  const waktu = new Date().toISOString();
  const gagal: string[] = [];

  const textRows = Object.keys(next.texts).map((key, index) => ({
    key,
    label: next.texts[key].label,
    body: next.texts[key].text,
    color: next.texts[key].color,
    font: next.texts[key].font,
    visible: next.texts[key].visible,
    position: index + 1,
    updated_at: waktu,
  }));
  const menuRows = Object.keys(next.menus).map((key, index) => ({
    key,
    label: next.menus[key].label,
    hint: next.menus[key].hint,
    enabled: next.menus[key].on,
    position: index + 1,
    updated_at: waktu,
  }));

  const blockRows = (Object.keys(next.blocks) as BlockKey[]).map((key, index) => ({
    key,
    label: next.blocks[key].label,
    hint: next.blocks[key].hint,
    x: next.blocks[key].x,
    y: next.blocks[key].y,
    scale: next.blocks[key].scale,
    z: next.blocks[key].z,
    position: index + 1,
    updated_at: waktu,
  }));

  // Satu entri per tabel: menambah jenis data baru cukup menambah baris di daftar ini.
  const tugas: [string, PromiseLike<{ error: GalatSisa | null }>][] = [
    ['teks', supabase.from('site_texts').upsert(textRows, { onConflict: 'key' })],
    ['menu', supabase.from('site_menus').upsert(menuRows, { onConflict: 'key' })],
    ['blok', supabase.from('site_blocks').upsert(blockRows, { onConflict: 'key' })],
    [
      'tampilan',
      supabase
        .from('site_appearance')
        .upsert({ id: 1, theme: next.appearance.theme, color_theme: next.appearance.colorTheme, updated_at: waktu }, { onConflict: 'id' }),
    ],
    [
      'gerak',
      supabase
        .from('site_motion')
        .upsert(
          {
            id: 1,
            direction: next.motion.direction,
            speed: next.motion.speed,
            autoplay: next.motion.autoplay,
            pause_on_hover: next.motion.pauseOnHover,
            view_angle: next.motion.viewAngle,
            slot_count: next.motion.slotCount,
            orientation: next.motion.orientation,
            perspective: next.motion.perspective,
            stage_pct: next.motion.stagePct,
            radius_pct: next.motion.radiusPct,
            hover_pct: next.motion.hoverPct,
            ease_rate: next.motion.easeRate,
            fade_pct: next.motion.fadePct,
            deg_per_sec: next.motion.degPerSec,
            updated_at: waktu,
          },
          { onConflict: 'id' },
        ),
    ],
    [
      'metadata',
      supabase
        .from('site_info')
        .upsert(
          {
            id: 1,
            page_title: next.info.pageTitle,
            meta_description: next.info.metaDescription,
            og_title: next.info.ogTitle,
            og_description: next.info.ogDescription,
            og_image: next.info.ogImage,
            theme_color: next.info.themeColor,
            lang: next.info.lang,
            updated_at: waktu,
          },
          { onConflict: 'id' },
        ),
    ],
  ];

  for (const [nama, jalan] of tugas) {
    const { error } = await jalan;
    if (error) gagal.push(`${nama} — ${sebabGalat(error)}`);
  }

  // Halaman yang dihapus di konsol harus ikut hilang dari database: upsert saja tidak
  // pernah menghapus baris. Hanya kunci berawalan `hal:` yang disentuh di sini.
  for (const [tabel, dipakai] of [
    ['site_menus', Object.keys(next.menus)],
    ['site_texts', Object.keys(next.texts)],
  ] as [string, string[]][]) {
    const { data, error } = await supabase.from(tabel).select('key').like('key', `${HAL_AWAL}%`);
    if (error) continue;
    const yatim = (data ?? []).map(r => String(r.key)).filter(k => !dipakai.includes(k));
    if (!yatim.length) continue;
    const { error: buang } = await supabase.from(tabel).delete().in('key', yatim);
    if (buang) gagal.push(`penghapusan yatim di ${tabel} — ${sebabGalat(buang)}`);
  }

  if (gagal.length) throw new Error(`Gagal menyimpan: ${gagal.join(', ')}.`);
}

/** Preferensi pengunjung di perangkat sendiri, dibaca sebelum konten server tiba. */
const PREF_KEY = 'gspin.preferensi';

export interface Preferensi extends Partial<Appearance>, Partial<Pick<Motion, 'direction' | 'speed' | 'autoplay'>> {}

export function bacaPreferensi(): Preferensi {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    return raw ? (JSON.parse(raw) as Preferensi) : {};
  } catch {
    return {};
  }
}

export function simpanPreferensi(ubah: Preferensi): Preferensi {
  const gabungLokal = { ...bacaPreferensi(), ...ubah };
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(gabungLokal));
  } catch {
    /* mode penyamaran menolak penyimpanan; preferensi cukup di sesi ini */
  }
  return gabungLokal;
}

/** Terapkan metadata halaman dari tabel site_info ke dokumen yang sudah dimuat. */
export function terapkanMeta(info: SiteInfo) {
  document.title = info.pageTitle;
  document.documentElement.lang = info.lang;
  const atur = (selektor: string, isi: string, atribut = 'content') => {
    const el = document.head.querySelector(selektor);
    if (el) el.setAttribute(atribut, isi);
  };
  atur('meta[name="description"]', info.metaDescription);
  atur('meta[property="og:title"]', info.ogTitle);
  atur('meta[property="og:description"]', info.ogDescription);
  atur('meta[property="og:image"]', info.ogImage);
  atur('meta[name="theme-color"]', info.themeColor);
}
