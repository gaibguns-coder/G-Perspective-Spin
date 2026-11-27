import { ArrowLeft, FileQuestion } from 'lucide-react';
import type { CSSProperties } from 'react';
import { fontStackOf, type HalamanKustom as Halaman } from '@/lib/settings';

/** Gaya warna + huruf satu baris site_texts; nilai kosong berarti ikut tema. */
function gayaTeks(setting?: { color: string; font: string }): CSSProperties {
  if (!setting) return {};
  const stack = fontStackOf(setting.font);
  return {
    ...(setting.color ? { color: setting.color } : {}),
    ...(stack ? { fontFamily: stack } : {}),
  };
}

/**
 * Halaman buatan admin. Isinya dibaca apa adanya (bukan HTML), jadi tanda kurung sudut
 * pun hanya menjadi teks — tidak ada skrip yang bisa ikut berjalan.
 */
export function TampilanHalaman({ halaman }: { halaman: Halaman | null }) {
  if (!halaman) {
    return (
      <section className="hal-kustom">
        <a className="hal-balik" href="#/">
          <ArrowLeft className="size-3.5" />
          Kembali ke galeri
        </a>
        <div className="hal-kosong">
          <FileQuestion className="size-8" />
          <h1>Halaman belum dibuat</h1>
          <p>Alamat ini belum punya baris di database. Buat lewat Konsol → Halaman, atau kembali ke galeri.</p>
        </div>
      </section>
    );
  }

  const paras = halaman.isi.text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  return (
    <section className="hal-kustom" aria-label={halaman.judul.text || halaman.menu.label}>
      <a className="hal-balik" href="#/">
        <ArrowLeft className="size-3.5" />
        Kembali ke galeri
      </a>
      {halaman.judul.visible && halaman.judul.text && (
        <h1 className="hal-judul" style={gayaTeks(halaman.judul)}>
          {halaman.judul.text}
        </h1>
      )}
      {halaman.isi.visible && paras.length > 0 && (
        <div className="hal-isi" style={gayaTeks(halaman.isi)}>
          {paras.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}
      {halaman.isi.visible && !paras.length && <p className="hal-kosong-isi">Halaman ini masih kosong.</p>}
    </section>
  );
}
