/**
 * Alamat konsol tanpa ekstensi dan tanpa garis miring penutup. Hosting ini hanya
 * mengembalikan `index.html` untuk alamat yang tidak dikenali bila mode SPA aktif,
 * jadi dokumen yang sama memutuskan sendiri apakah ia menampilkan galeri atau konsol.
 */
export function ruteKonsol(pathname: string) {
  return /^\/ceopusat\/?$/.test(pathname);
}
