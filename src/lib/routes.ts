/**
 * Alamat konsol tanpa ekstensi. Hosting ini hanya mengembalikan `index.html` untuk
 * path yang diakhiri garis miring (`/ceopusat` balas 404), jadi dokumen yang sama
 * harus memutuskan sendiri apakah ia menampilkan galeri atau konsol.
 */
export function ruteKonsol(pathname: string) {
  return /^\/ceopusat\/?$/.test(pathname);
}
