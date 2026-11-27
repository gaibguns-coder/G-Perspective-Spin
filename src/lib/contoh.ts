/**
 * Gambar contoh sementara untuk bingkai yang belum diisi foto asli.
 * Dibangkit sebagai SVG data-URI: tidak ada berkas baru untuk diunggah, tidak ada
 * baris palsu di basis data, dan tetap tampil saat luring. Begitu admin mengunggah
 * foto, bingkai itu otomatis memakai gambar asli.
 */

const LEBAR = 420;
const TINGGI = 460;

const PALET: [string, string][] = [
  ['#22d3ee', '#0e7490'],
  ['#8b5cf6', '#5b21b6'],
  ['#f59e0b', '#b45309'],
  ['#10b981', '#046f58'],
  ['#f43f5e', '#9f1239'],
  ['#3b82f6', '#1e3a8a'],
];

/** Acak deterministik: nomor bingkai yang sama selalu menghasilkan gambar yang sama. */
function pengacak(benang: number) {
  let w = benang * 2654435761;
  return () => {
    w = (w * 1664525 + 1013904223) % 4294967296;
    return w / 4294967296;
  };
}

function motifPunggung(acaK: () => number): string {
  const puncak = [300, 355, 410].map((y, i) => {
    const titik = Array.from({ length: 7 }, (_, j) => `${Math.round((j / 6) * LEBAR)},${Math.round(y - acaK() * 90 + i * 12)}`).join(' ');
    return `<polygon points="0,${TINGGI} ${titik} ${LEBAR},${TINGGI}" fill="${i === 2 ? 'var(--b)' : 'var(--a)'}" opacity="${0.28 + i * 0.22}"/>`;
  });
  return `<circle cx="300" cy="120" r="46" fill="var(--a)" opacity="0.85"/>${puncak.join('')}`;
}

function motifTerowongan(acaK: () => number): string {
  const putar = Math.round(acaK() * 18 - 9);
  const selisih = 0.11 + acaK() * 0.06;
  const cincin = Array.from({ length: 7 }, (_, i) => {
    const s = 1 - i * selisih;
    const w = Math.round(LEBAR * 0.86 * s);
    const h = Math.round(TINGGI * 0.8 * s);
    return `<rect x="${Math.round((LEBAR - w) / 2)}" y="${Math.round((TINGGI - h) / 2)}" width="${w}" height="${h}" fill="none" stroke="var(--a)" stroke-width="${3 - i * 0.3}" opacity="${0.9 - i * 0.1}"/>`;
  });
  return `<g transform="rotate(${putar} ${LEBAR / 2} ${TINGGI / 2})">${cincin.join('')}</g>`;
}

function motifGelombang(acaK: () => number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const y = 120 + i * 52;
    const a = 16 + acaK() * 26;
    return `<path d="M0 ${y} Q ${LEBAR * 0.25} ${y - a} ${LEBAR * 0.5} ${y} T ${LEBAR} ${y}" fill="none" stroke="var(--a)" stroke-width="${4 - i * 0.4}" opacity="${0.9 - i * 0.11}"/>`;
  }).join('');
}

function motifKota(acaK: () => number): string {
  const gedung = Array.from({ length: 9 }, (_, i) => {
    const t = 90 + acaK() * 210;
    return `<rect x="${i * 48}" y="${TINGGI - t}" width="40" height="${t}" fill="var(--b)" opacity="0.85"/>`
      + `<rect x="${i * 48 + 8}" y="${TINGGI - t + 14}" width="7" height="7" fill="var(--a)" opacity="0.9"/>`
      + `<rect x="${i * 48 + 22}" y="${TINGGI - t + 30}" width="7" height="7" fill="var(--a)" opacity="0.7"/>`;
  });
  return `<circle cx="96" cy="96" r="34" fill="var(--a)" opacity="0.8"/>${gedung.join('')}`;
}

function motifOrbit(acaK: () => number): string {
  const cincin = Array.from({ length: 4 }, (_, i) => {
    const r = 52 + i * 44;
    return `<ellipse cx="${LEBAR / 2}" cy="${TINGGI / 2}" rx="${r}" ry="${Math.round(r * 0.42)}" fill="none" stroke="var(--a)" stroke-width="2" opacity="${0.85 - i * 0.13}" transform="rotate(${-18 + i * 9} ${LEBAR / 2} ${TINGGI / 2})"/>`;
  });
  const bintang = Array.from({ length: 26 }, () => `<circle cx="${Math.round(acaK() * LEBAR)}" cy="${Math.round(acaK() * TINGGI)}" r="${(acaK() * 2 + 0.6).toFixed(1)}" fill="var(--a)" opacity="${(0.3 + acaK() * 0.6).toFixed(2)}"/>`);
  return `<circle cx="${LEBAR / 2}" cy="${TINGGI / 2}" r="26" fill="var(--b)"/>${cincin.join('')}${bintang.join('')}`;
}

function motifPrisma(acaK: () => number): string {
  const tinggi = 40 + acaK() * 45;
  return Array.from({ length: 5 }, (_, i) => {
    const x = 40 + i * 78 + (acaK() * 12 - 6);
    const pucuk = tinggi + acaK() * 60;
    return `<polygon points="${Math.round(x)},${TINGGI - 60} ${Math.round(x + 40)},${Math.round(pucuk)} ${Math.round(x + 80)},${TINGGI - 60}" fill="var(--a)" opacity="${(0.16 + i * 0.13).toFixed(2)}"/>`;
  }).join('');
}

const MOTIF: ((acak: () => number) => string)[] = [
  motifPunggung,
  motifTerowongan,
  motifGelombang,
  motifKota,
  motifOrbit,
  motifPrisma,
];

export function contohSlot(nomor: number): string {
  const n = Math.max(1, Math.round(nomor));
  const [a, b] = PALET[(n - 1) % PALET.length];
  const acak = pengacak(n);
  const gambar = MOTIF[(n - 1) % MOTIF.length](acak);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LEBAR} ${TINGGI}" width="${LEBAR}" height="${TINGGI}">
<defs>
<style>:root{--a:${a};--b:${b}}</style>
<radialGradient id="lat" cx="50%" cy="42%" r="78%"><stop offset="0" stop-color="#132033"/><stop offset="1" stop-color="#070b14"/></radialGradient>
<linearGradient id="bayang" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/></linearGradient>
</defs>
<rect width="${LEBAR}" height="${TINGGI}" fill="url(#lat)"/>
<g opacity="0.5">${kisi(n)}</g>
<g>${gambar}</g>
<rect width="${LEBAR}" height="${TINGGI}" fill="url(#bayang)"/>
<rect x="10" y="10" width="${LEBAR - 20}" height="${TINGGI - 20}" fill="none" stroke="${a}" stroke-width="1" opacity="0.35"/>
<text x="${LEBAR / 2}" y="${TINGGI - 66}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="20" letter-spacing="6" fill="${a}" opacity="0.9">CONTOH</text>
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Garis perspektif menuju titik lenyap, sedikit berputar tiap bingkai. */
function kisi(nomor: number): string {
  const cx = LEBAR / 2;
  const cy = TINGGI * 0.42;
  const langkah = 15 + (nomor % 4) * 3;
  const garis = Array.from({ length: 12 }, (_, i) => {
    const sudut = (i * 30 + langkah) * (Math.PI / 180);
    return `<line x1="${cx}" y1="${cy}" x2="${Math.round(cx + Math.cos(sudut) * 760)}" y2="${Math.round(cy + Math.sin(sudut) * 760)}" stroke="${PALET[(nomor - 1) % PALET.length][0]}" stroke-width="1" opacity="0.22"/>`;
  });
  return garis.join('');
}

/** Satu pasangan judul + cerita per motif, urutannya sama dengan MOTIF. */
const TEKS: [string, string][] = [
  ['Senja di Punggung Bukit', 'Tiga punggungan menerima cahaya terakhir dari satu titik rendah. Susunan seperti ini cocok untuk foto perjalanan atau hasil cetak ukuran besar.'],
  ['Terowongan Cahaya', 'Bingkai bersarang yang menyempit ke tengah, persis cara karya Anda disusun di panggung ini. Cocok untuk pameran tunggal atau arsip studio.'],
  ['Riap yang Berulang', 'Enam garis gelombang yang melemah ke bawah, dibaca tenang dari jarak jauh. Cocok untuk karya dengan warna lembut atau pemindaian arsip.'],
  ['Cakrawala Kota', 'Sembilan blok gedung dengan dua lampu menyala, dibaca jelas meski kartunya kecil. Cocok untuk dokumentasi acara dan lanskap perkotaan.'],
  ['Lintasan Orbit', 'Cincin melonjong dengan taburan titik cahaya, komposisi paling ramai di antara yang lain. Cocok untuk karya digital dan ilustrasi.'],
  ['Bidang Prisma', 'Lima bidang tajam dengan tingkat cahaya berbeda, disusun bergeser supaya tidak kaku. Cocok untuk fotografi arsitektur dan produk.'],
];

const CATATAN = ' — contoh teks, ganti lewat halaman admin.';

/** Judul dan deskripsi untuk bingkai yang belum punya foto, supaya layar penuh
 *  tidak menampilkan "Gambar 06 / Belum ada deskripsi." saat masih menunggu kiriman. */
export function contohTeks(nomor: number): { judul: string; deskripsi: string } {
  const n = Math.max(1, Math.round(nomor));
  const [judul, cerita] = TEKS[(n - 1) % TEKS.length];
  return { judul, deskripsi: `${cerita}${CATATAN}` };
}
