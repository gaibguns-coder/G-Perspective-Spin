import { NOT_CONFIGURED_MESSAGE, supabase } from './supabase';
import type { ColorThemeKey } from './theme';
import { BRAND, INITIAL_SLOT_COUNT, VIEW_ANGLE, type SpinDirection } from './motion';

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

export interface Motion {
  direction: SpinDirection;
  speed: number;
  autoplay: boolean;
  pauseOnHover: boolean;
  viewAngle: number;
  slotCount: number;
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
  texts: Record<TextKey, TextSetting>;
  menus: Record<MenuKey, MenuSetting>;
  appearance: Appearance;
  motion: Motion;
  info: SiteInfo;
}

/** Pasangan nama keluarga → tumpukan CSS. Muatannya mengikuti <link> di index.html. */
export const FONT_OPTIONS: { name: string; stack: string }[] = [
  { name: 'Manrope', stack: "'Manrope', sans-serif" },
  { name: 'Space Grotesk', stack: "'Space Grotesk', sans-serif" },
  { name: 'Poppins', stack: "'Poppins', sans-serif" },
  { name: 'Inter', stack: "'Inter', sans-serif" },
  { name: 'Montserrat', stack: "'Montserrat', sans-serif" },
  { name: 'Outfit', stack: "'Outfit', sans-serif" },
  { name: 'Sora', stack: "'Sora', sans-serif" },
  { name: 'Playfair Display', stack: "'Playfair Display', serif" },
  { name: 'Lora', stack: "'Lora', serif" },
  { name: 'Cormorant Garamond', stack: "'Cormorant Garamond', serif" },
  { name: 'Bebas Neue', stack: "'Bebas Neue', sans-serif" },
  { name: 'Oswald', stack: "'Oswald', sans-serif" },
  { name: 'Righteous', stack: "'Righteous', cursive" },
  { name: 'Pacifico', stack: "'Pacifico', cursive" },
  { name: 'Caveat', stack: "'Caveat', cursive" },
  { name: 'JetBrains Mono', stack: "'JetBrains Mono', monospace" },
];

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
};

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
  };
}

export function textOf(content: SiteContent, key: TextKey): TextSetting {
  return content.texts[key] ?? DEFAULT_SETTINGS.texts[key];
}

export function menuOn(content: SiteContent, key: MenuKey): boolean {
  return content.menus[key]?.on ?? DEFAULT_SETTINGS.menus[key].on;
}

/**
 * Rangkai konten dari baris mentah. Baris yang tidak ada tetap memakai bawaan,
 * sehingga menambah kunci baru tidak memerlukan migrasi isian.
 */
export function gabung(
  textRows: unknown,
  menuRows: unknown,
  appearance?: Record<string, unknown> | null,
  motion?: Record<string, unknown> | null,
  info?: Record<string, unknown> | null,
): SiteContent {
  const hasil = kontenBawaan();
  const str = (v: unknown, fallback: string) => (typeof v === 'string' && v ? v : fallback);
  const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);

  for (const row of Array.isArray(textRows) ? (textRows as Record<string, unknown>[]) : []) {
    const key = row.key as TextKey;
    if (!(key in hasil.texts)) continue;
    hasil.texts[key] = {
      label: str(row.label, hasil.texts[key].label),
      text: typeof row.body === 'string' ? row.body : hasil.texts[key].text,
      color: typeof row.color === 'string' ? row.color : '',
      font: typeof row.font === 'string' ? row.font : '',
      visible: bool(row.visible, true),
    };
  }
  for (const row of Array.isArray(menuRows) ? (menuRows as Record<string, unknown>[]) : []) {
    const key = row.key as MenuKey;
    if (!(key in hasil.menus)) continue;
    hasil.menus[key] = {
      label: str(row.label, hasil.menus[key].label),
      hint: str(row.hint, hasil.menus[key].hint),
      on: bool(row.enabled, true),
    };
  }

  const tema = appearance?.theme;
  if (tema === 'dark' || tema === 'light') hasil.appearance.theme = tema;
  const palet = appearance?.color_theme;
  if (typeof palet === 'string' && palet !== '') {
    hasil.appearance.colorTheme = palet as ColorThemeKey;
  }

  const arah = motion?.direction;
  if (arah === 'left' || arah === 'right') hasil.motion.direction = arah;
  const laju = Number(motion?.speed);
  if (Number.isFinite(laju)) hasil.motion.speed = Math.min(3, Math.max(0.2, Math.round(laju * 10) / 10));
  hasil.motion.autoplay = bool(motion?.autoplay, DEFAULT_MOTION.autoplay);
  hasil.motion.pauseOnHover = bool(motion?.pause_on_hover, DEFAULT_MOTION.pauseOnHover);
  const sudut = Number(motion?.view_angle);
  if (Number.isFinite(sudut)) hasil.motion.viewAngle = Math.min(45, Math.max(0, Math.round(sudut)));
  const slot = Number(motion?.slot_count);
  if (Number.isFinite(slot)) hasil.motion.slotCount = Math.min(40, Math.max(3, Math.round(slot)));

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
  const [textRows, menuRows, appearance, motion, info] = await Promise.all([
    coba(supabase.from('site_texts').select('key,label,body,color,font,visible,position').order('position'), null),
    coba(supabase.from('site_menus').select('key,label,hint,enabled,position').order('position'), null),
    coba(supabase.from('site_appearance').select('*').eq('id', 1).maybeSingle(), null),
    coba(supabase.from('site_motion').select('*').eq('id', 1).maybeSingle(), null),
    coba(supabase.from('site_info').select('*').eq('id', 1).maybeSingle(), null),
  ]);
  return gabung(textRows, menuRows, appearance, motion, info);
}

/** Simpan setiap kelompok ke tabelnya sendiri; kegagalan dikumpulkan, bukan dihentikan di baris pertama. */
export async function saveContent(next: SiteContent): Promise<void> {
  if (NOT_CONFIGURED_MESSAGE) throw new Error('Backend belum disambungkan, pengaturan tidak dapat disimpan.');
  const waktu = new Date().toISOString();
  const gagal: string[] = [];

  const textRows = (Object.keys(next.texts) as TextKey[]).map((key, index) => ({
    key,
    label: next.texts[key].label,
    body: next.texts[key].text,
    color: next.texts[key].color,
    font: next.texts[key].font,
    visible: next.texts[key].visible,
    position: index + 1,
    updated_at: waktu,
  }));
  const menuRows = (Object.keys(next.menus) as MenuKey[]).map((key, index) => ({
    key,
    label: next.menus[key].label,
    hint: next.menus[key].hint,
    enabled: next.menus[key].on,
    position: index + 1,
    updated_at: waktu,
  }));

  const tugas: [string, PromiseLike<{ error: unknown }>][] = [
    ['teks', supabase.from('site_texts').upsert(textRows, { onConflict: 'key' })],
    ['menu', supabase.from('site_menus').upsert(menuRows, { onConflict: 'key' })],
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
    if (error) gagal.push(nama);
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
