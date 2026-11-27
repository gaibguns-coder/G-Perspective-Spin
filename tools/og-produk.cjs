// Perkakas sekali jalan: pangkas gambar hasil generate menjadi kartu berbagi 1200x630
// lalu tempel logo. Tidak memakai dependensi gambar karena `convert` di mesin ini
// adalah utilitas disk Windows, bukan ImageMagick.
const fs = require('node:fs');
const zlib = require('node:zlib');

const SUMBER = process.argv[2];
const LOGO = process.argv[3];
const TUJUAN = process.argv[4];
const bits = process.argv[5] ? Number(process.argv[5]) : 8;

const T_W = 1200;
const T_H = 630;

/* ---------- dekode PNG ---------- */
function bacaPng(jalur) {
  const b = fs.readFileSync(jalur);
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error('bukan png: ' + jalur);
  const w = b.readUInt32BE(16);
  const h = b.readUInt32BE(20);
  const bitDepth = b[24];
  const colorType = b[25];
  const interlace = b[28];
  if (bitDepth !== 8 || interlace !== 0) throw new Error('butuh 8-bit non-interlaced: ' + jalur);
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (!channels) throw new Error('colorType tidak didukung: ' + colorType);
  const idat = [];
  let o = 8;
  while (o < b.length) {
    const len = b.readUInt32BE(o);
    const tipe = b.slice(o + 4, o + 8).toString('ascii');
    if (tipe === 'IDAT') idat.push(b.slice(o + 8, o + 8 + len));
    o += 12 + len;
  }
  const mentah = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * channels;
  const px = Buffer.alloc(w * h * channels);
  let pos = 0;
  for (let y = 0; y < h; y++) {
    const filter = mentah[pos++];
    const baris = mentah.slice(pos, pos + stride);
    pos += stride;
    const kini = y * stride;
    const dulu = y > 0 ? kini - stride : -1;
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? px[kini + x - channels] : 0;
      const bb = dulu >= 0 ? px[dulu + x] : 0;
      const c = dulu >= 0 && x >= channels ? px[dulu + x - channels] : 0;
      let v = baris[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += bb;
      else if (filter === 3) v += (a + bb) >> 1;
      else if (filter === 4) {
        const p = a + bb - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - bb);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? bb : c;
      }
      px[kini + x] = v & 255;
    }
  }
  return { w, h, channels, data: px };
}

/* ---------- resample kotak rata-rata (box filter) ---------- */
function kubus(gambar, tw, th, premultiplied) {
  const { w, h, channels, data } = gambar;
  const out = Buffer.alloc(tw * th * channels);
  const fx = w / tw;
  const fy = h / th;
  for (let ty = 0; ty < th; ty++) {
    const y0 = ty * fy;
    const y1 = Math.min(y0 + fy, h);
    for (let tx = 0; tx < tw; tx++) {
      const x0 = tx * fx;
      const x1 = Math.min(x0 + fx, w);
      const jumlah = [0, 0, 0, 0];
      let wTotal = 0;
      let iy = Math.floor(y0);
      while (iy < y1) {
        const wy = Math.min(iy + 1, y1) - iy;
        let ix = Math.floor(x0);
        while (ix < x1) {
          const wx = Math.min(ix + 1, x1) - ix;
          const bobot = wx * wy;
          const i = (iy * w + ix) * channels;
          const a = channels === 4 ? data[i + 3] / 255 : 1;
          for (let ch = 0; ch < channels; ch++) {
            const nilai = premultiplied && channels === 4 && ch < 3 ? data[i + ch] * a : data[i + ch];
            jumlah[ch] += nilai * bobot;
          }
          wTotal += bobot;
          ix++;
        }
        iy++;
      }
      const o = (ty * tw + tx) * channels;
      if (channels === 4 && premultiplied) {
        const alpa = jumlah[3] / wTotal;
        out[o + 3] = Math.round(alpa * 255);
        const k = alpa > 0.0001 ? 1 / alpa : 0;
        for (let ch = 0; ch < 3; ch++) out[o + ch] = Math.min(255, Math.round((jumlah[ch] / wTotal) * k));
      } else {
        for (let ch = 0; ch < channels; ch++) out[o + ch] = jumlah[ch] / wTotal;
      }
    }
  }
  return { w: tw, h: th, channels, data: out };
}

/* ---------- tempel logo dengan alpa ---------- */
function tempel(dasar, atas, dx, dy) {
  for (let y = 0; y < atas.h; y++) {
    for (let x = 0; x < atas.w; x++) {
      const tx = dx + x;
      const ty = dy + y;
      if (tx < 0 || ty < 0 || tx >= dasar.w || ty >= dasar.h) continue;
      const i = (y * atas.w + x) * atas.channels;
      const alpa = atas.data[i + 3] / 255;
      if (alpa <= 0.002) continue;
      const j = (ty * dasar.w + tx) * dasar.channels;
      for (let ch = 0; ch < 3; ch++) dasar.data[j + ch] = dasar.data[j + ch] * (1 - alpa) + atas.data[i + ch] * alpa;
    }
  }
}

/* ---------- potong tengah ---------- */
function potong(gambar, tw, th, biasY) {
  const { w, h, channels, data } = gambar;
  const oy = Math.round((h - th) * biasY);
  const ox = Math.round((w - tw) / 2);
  const out = Buffer.alloc(tw * th * channels);
  for (let y = 0; y < th; y++) {
    for (let x = 0; x < channels * tw; x++) out[(y * channels * tw + x)] = data[((y + oy) * w + ox) * channels + x];
  }
  return { w: tw, h: th, channels, data: out };
}

/* ---------- enkripsi PNG RGB dengan filter per baris ---------- */
const crcTabel = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTabel[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function potongan(tipe, isi) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(isi.length);
  const badan = Buffer.concat([Buffer.from(tipe, 'ascii'), isi]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(badan));
  return Buffer.concat([len, badan, crc]);
}

function tulisPng(gambar, tujuannya, kedalamanBit) {
  const { w, h, channels, data } = gambar;
  const stride = w * 3;
  const baris = [];
  for (let y = 0; y < h; y++) {
    const asli = Buffer.alloc(stride);
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * channels;
      for (let ch = 0; ch < 3; ch++) {
        let v = Math.round(data[i + ch]);
        if (kedalamanBit < 8) {
          const langkah = 1 << (8 - kedalamanBit);
          v = Math.min(255, Math.round(v / langkah) * langkah + (langkah >> 1) - 1);
        }
        asli[x * 3 + ch] = v & 255;
      }
    }
    let terbaik = null;
    for (const f of [0, 1, 2, 3, 4]) {
      const keluar = Buffer.alloc(stride);
      let skor = 0;
      for (let x = 0; x < stride; x++) {
        const a = x >= 3 ? asli[x - 3] : 0;
        const b = y > 0 ? baris[y - 1][x + 1] : 0;
        const c = y > 0 && x >= 3 ? baris[y - 1][x - 2] : 0;
        let pred = 0;
        if (f === 1) pred = a;
        else if (f === 2) pred = b;
        else if (f === 3) pred = (a + b) >> 1;
        else if (f === 4) {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        }
        let d = asli[x] - pred;
        if (d < 0) d += 256;
        keluar[x] = d;
        skor += Math.min(d, 256 - d);
      }
      if (!terbaik || skor < terbaik.skor) terbaik = { f, keluar, skor };
    }
    baris.push(Buffer.concat([Buffer.from([terbaik.f]), terbaik.keluar]));
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    potongan('IHDR', ihdr),
    potongan('IDAT', zlib.deflateSync(Buffer.concat(baris), { level: 9 })),
    potongan('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(tujuannya, png);
  return png.length;
}

/* ---------- jalankan ---------- */
const sumber = bacaPng(SUMBER);
// scale-to-cover: rasio sumber 1.75, sasaran 1.905 → lebar jadi patokan
const skala = kubus(sumber, T_W, Math.round((T_W * sumber.h) / sumber.w), false);
const hasil = potong(skala, T_W, T_H, 0.5);
console.log('skala', sumber.w + 'x' + sumber.h, '->', skala.w + 'x' + skala.h, '-> potong', hasil.w + 'x' + hasil.h);
if (LOGO) {
  const logo = bacaPng(LOGO);
  const ukuran = 124;
  tempel(hasil, kubus(logo, ukuran, ukuran, true), 52, T_H - ukuran - 52);
}
const ukuran = tulisPng(hasil, TUJUAN, bits);
console.log('tertulis', TUJUAN, (ukuran / 1024).toFixed(0) + ' kB');
