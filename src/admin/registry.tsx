import type { LucideIcon } from 'lucide-react';
import { Database, Globe, ImageIcon, Info, LayoutDashboard, LayoutGrid, Move3d, Music, Palette, ToggleRight, Type } from 'lucide-react';
import { PanelGerak } from './panels/gerak';
import { PanelLetak } from './panels/tata-letak';
import { PanelLagu, PanelGambar } from './panels/pustaka';
import { PanelHalaman, PanelMenu, PanelTeks } from './panels/konten';
import { PanelRingkas } from './panels/ringkas';
import { PanelBasisData, PanelMeta, PanelTampilan } from './panels/situs';
import type { ReactNode } from 'react';

/**
 * Satu daftar untuk seluruh konsol. Menambah menu baru — atau tabel baru yang
 * harus disunting — cukup menambah satu entri di sini: bilah kiri, judul, dan
 * isinya mengambil dari daftar ini, tidak ada lagi tombol tab yang ditulis tangan.
 */
export interface PanelDef {
  id: string;
  label: string;
  grup: 'Konsol' | 'Konten' | 'Carousel' | 'Situs' | 'Perpustakaan';
  ikon: LucideIcon;
  petunjuk: string;
  /** draf = ikut tombol Simpan bersama; langsung = menulis sendiri per tindakan. */
  jenis: 'draf' | 'langsung';
  render: (ctx: { padaBerubah: () => void; padaDisimpan: number }) => ReactNode;
}

export const PANEL: PanelDef[] = [
  {
    id: 'ringkas',
    label: 'Ikhtisar',
    grup: 'Konsol',
    ikon: LayoutDashboard,
    petunjuk: 'Angka nyata: teks, menu, foto, dan yang belum selesai',
    jenis: 'draf',
    render: () => <PanelRingkas />,
  },
  {
    id: 'teks',
    label: 'Teks',
    grup: 'Konten',
    ikon: Type,
    petunjuk: 'Setiap tulisan di halaman depan',
    jenis: 'draf',
    render: () => <PanelTeks />,
  },
  {
    id: 'menu',
    label: 'Menu & bagian',
    grup: 'Konten',
    ikon: ToggleRight,
    petunjuk: 'Tuas menyala/matinya tiap bagian',
    jenis: 'draf',
    render: () => <PanelMenu />,
  },
  {
    id: 'halaman',
    label: 'Halaman',
    grup: 'Konten',
    ikon: Globe,
    petunjuk: 'Buat menu dan halaman baru',
    jenis: 'draf',
    render: () => <PanelHalaman />,
  },
  {
    id: 'gerak',
    label: 'Carousel',
    grup: 'Carousel',
    ikon: Move3d,
    petunjuk: 'Bentuk, arah, dan rasa putaran',
    jenis: 'draf',
    render: () => <PanelGerak />,
  },
  {
    id: 'letak',
    label: 'Tata letak',
    grup: 'Carousel',
    ikon: LayoutGrid,
    petunjuk: 'Geser dan ubah besar tiap bagian',
    jenis: 'draf',
    render: () => <PanelLetak />,
  },
  {
    id: 'tampilan',
    label: 'Tampilan',
    grup: 'Situs',
    ikon: Palette,
    petunjuk: 'Tema dan palet bawaan pengunjung',
    jenis: 'draf',
    render: () => <PanelTampilan />,
  },
  {
    id: 'meta',
    label: 'Metadata',
    grup: 'Situs',
    ikon: Info,
    petunjuk: 'Judul tab, kartu berbagi, nomor kontak',
    jenis: 'draf',
    render: () => <PanelMeta />,
  },
  {
    id: 'basis',
    label: 'Basis data',
    grup: 'Situs',
    ikon: Database,
    petunjuk: 'Jumlah baris dan simpan terakhir',
    jenis: 'langsung',
    render: ({ padaDisimpan }) => <PanelBasisData padaDisimpan={padaDisimpan} />,
  },
  {
    id: 'gambar',
    label: 'Gambar galeri',
    grup: 'Perpustakaan',
    ikon: ImageIcon,
    petunjuk: 'Unggah, sunting, dan hapus foto',
    jenis: 'langsung',
    render: ({ padaBerubah }) => <PanelGambar padaBerubah={padaBerubah} />,
  },
  {
    id: 'lagu',
    label: 'Musik latar',
    grup: 'Perpustakaan',
    ikon: Music,
    petunjuk: 'Unggah, ganti judul, dan hapus lagu',
    jenis: 'langsung',
    render: ({ padaBerubah }) => <PanelLagu padaBerubah={padaBerubah} />,
  },
];

export const GRUP: PanelDef['grup'][] = ['Konsol', 'Konten', 'Carousel', 'Situs', 'Perpustakaan'];
