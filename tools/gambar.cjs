// Pembuat aset gambar halaman portofolio.
//
//   node tools/gambar.cjs kecil <sumber.png> <tujuan.png> [lebar=800] [bit=8]
//   node tools/gambar.cjs koridor <tujuan.png> <lebar> <tinggi> [bit=6]
//   node tools/gambar.cjs kartu <tujuan.png> <bit> <k1.png> [k2..k4]
//
// koridor menggambar terowongan perspektif dengan garis — dipakai untuk kartu
// G-Perspective-Spin karena tangkapan layar situsnya masih menampilkan galeri kosong.
const { bacaPng, kubus, penuhi, salin, kanvas, tulisPng } = require('./png.cjs');

const perintah = process.argv[2];

/* garis lurus dengan inti terang + halo redup */
function garis(dasar, x0, y0, x1, y1, warna, tebal, kekuatan) {
  const langkah = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 3 + 1;
  for (let i = 0; i <= langkah; i++) {
    const u = i / langkah;
    const x = x0 + (x1 - x0) * u;
    const y = y0 + (y1 - y0) * u;
    for (let dy = -tebal; dy <= tebal; dy++) {
      for (let dx = -tebal; dx <= tebal; dx++) {
        const px = Math.round(x + dx);
        const py = Math.round(y + dy);
        if (px < 0 || py < 0 || px >= dasar.w || py >= dasar.h) continue;
        const jarak = Math.hypot(dx, dy);
        const a = jarak <= 0.5 ? kekuatan : Math.max(0, kekuatan * 0.28 * (1 - jarak / (tebal + 1)));
        if (a <= 0.002) continue;
        const j = (py * dasar.w + px) * 3;
        for (let c = 0; c < 3; c++) dasar.data[j + c] = dasar.data[j + c] * (1 - a) + warna[c] * a;
      }
    }
  }
}

if (perintah === 'kecil') {
  const [, , , sumber, tujuan, lebarArg, bitArg] = process.argv;
  const lebar = Number(lebarArg) || 800;
  const bit = Number(bitArg) || 8;
  const asal = bacaPng(sumber);
  const tinggi = Math.round((lebar * asal.h) / asal.w);
  const ukuran = tulisPng(kubus(asal, lebar, tinggi, false), tujuan, bit);
  console.log(`kecil ${asal.w}x${asal.h} -> ${lebar}x${tinggi}  ${tujuan} ${(ukuran / 1024).toFixed(0)} kB`);
} else if (perintah === 'koridor') {
  const [, , , tujuan, lebarArg, tinggiArg, bitArg] = process.argv;
  const w = Number(lebarArg) || 800;
  const h = Number(tinggiArg) || 500;
  const bit = Number(bitArg) || 6;
  const hlem = kanvas(w, h, [9, 12, 19]);
  const vpx = w / 2;
  const vpy = h * 0.47;
  const sudut = [
    [2, 2],
    [w - 3, 2],
    [w - 3, h - 3],
    [2, h - 3],
  ];
  const terang = [126, 224, 250];
  const redup = [58, 132, 168];
  // bingkai bersarang: tiap langkah diperkecil menuju titik lenyap
  for (let i = 0; i < 22; i++) {
    const s = Math.pow(0.83, i);
    const pts = sudut.map(([x, y]) => [vpx + (x - vpx) * s, vpy + (y - vpy) * s]);
    for (let k = 0; k < 4; k++) {
      const [ax, ay] = pts[k];
      const [bx, by] = pts[(k + 1) % 4];
      garis(hlem, ax, ay, bx, by, i < 3 ? terang : redup, 3, i < 3 ? 0.95 : 0.55);
    }
  }
  // garis lenyap dari titik-titik di tepi luar
  const keliling = 2 * (w + h);
  for (let n = 0; n < 34; n++) {
    let u = (n / 34) * keliling;
    let x = 0;
    let y = 0;
    if (u < w) [x, y] = [u, 0];
    else if (u < w + h) [x, y] = [w - 1, u - w];
    else if (u < 2 * w + h) [x, y] = [2 * w - 1 - u, h - 1];
    else [x, y] = [0, keliling - u];
    garis(hlem, x, y, vpx, vpy, redup, 2, 0.4);
  }
  const ukuran = tulisPng(hlem, tujuan, bit);
  console.log(`koridor ${w}x${h} -> ${tujuan} ${(ukuran / 1024).toFixed(0)} kB`);
} else if (perintah === 'kartu') {
  const [, , , tujuan, bitArg, ...sumber] = process.argv;
  const bit = Number(bitArg) || 6;
  const W = 1200;
  const H = 630;
  const tepi = 40;
  const jarak = 20;
  const lembar = kanvas(W, H, [9, 12, 19]);
  const kolom = Math.round((W - 2 * tepi - jarak) / 2);
  const baris = Math.round((H - 2 * tepi - jarak) / 2);
  const daftar = sumber.slice(0, 4);
  // Tiga karya: dua kartu di atas dan satu kartu melebar di bawah, supaya tidak
  // ada sel kosong yang terlihat seperti gambar yang gagal dimuat.
  const tata =
    daftar.length === 3
      ? [
          { x: tepi, y: tepi, w: kolom, h: baris },
          { x: tepi + kolom + jarak, y: tepi, w: kolom, h: baris },
          { x: tepi, y: tepi + baris + jarak, w: W - 2 * tepi, h: baris },
        ]
      : daftar.map((_, i) => ({
          x: tepi + (i % 2) * (kolom + jarak),
          y: tepi + Math.floor(i / 2) * (baris + jarak),
          w: kolom,
          h: baris,
        }));
  daftar.forEach((jalur, i) => {
    const kotak = tata[i];
    salin(lembar, penuhi(bacaPng(jalur), kotak.w, kotak.h, 0.5), kotak.x, kotak.y);
  });
  const ukuran = tulisPng(lembar, tujuan, bit);
  console.log(`kartu ${W}x${H} (${kolom}x${baris} per sel) -> ${tujuan} ${(ukuran / 1024).toFixed(0)} kB`);
} else {
  console.error('perintah: kecil | koridor | kartu');
  process.exit(1);
}
