import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ImageIcon,
  Loader2,
  Music,
  Pause,
  Pencil,
  Play,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  deleteGalleryItem,
  deleteSong,
  listGallery,
  listSongs,
  nextPosition,
  renameSong,
  saveGalleryItem,
  uploadSongs,
  type GalleryItem,
  type SongItem,
} from '@/lib/gallery';
import { Grup } from '../fields';
import './pustaka.css';

/** Dipakai panel Gambar dan Lagu: tulisannya langsung ke database, bukan lewat draf. */
function usePapan(): [(pesan: string, jenis?: 'galat' | 'sukses') => void, string, string] {
  const [galat, setGalat] = useState('');
  const [sukses, setSukses] = useState('');
  const set = useCallback((pesan: string, jenis: 'galat' | 'sukses' = 'galat') => {
    if (jenis === 'galat') {
      setGalat(pesan);
      setSukses('');
    } else {
      setSukses(pesan);
      setGalat('');
    }
  }, []);
  return [set, galat, sukses];
}

export function PanelGambar({ padaBerubah }: { padaBerubah: () => void }) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [muat, setMuat] = useState(true);
  const [editing, setEditing] = useState<GalleryItem | 'new' | null>(null);
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [berkas, setBerkas] = useState<File | null>(null);
  const [hapusGambar, setHapusGambar] = useState(false);
  const [sedang, setSedang] = useState(false);
  const [menghapus, setMenghapus] = useState<GalleryItem | null>(null);
  const [setPapan, galat, sukses] = usePapan();

  const baca = useCallback(async () => {
    try {
      setItems(await listGallery());
    } catch {
      setPapan('Daftar gambar gagal dimuat.');
    } finally {
      setMuat(false);
    }
  }, [setPapan]);

  useEffect(() => {
    void baca();
  }, [baca]);

  function sunting(item: GalleryItem | 'new') {
    setEditing(item);
    setJudul(item === 'new' ? '' : item.title);
    setDeskripsi(item === 'new' ? '' : item.description);
    setBerkas(null);
    setHapusGambar(false);
    setPapan('');
  }

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (editing === null) return;
    setSedang(true);
    try {
      const yatim = await saveGalleryItem(
        editing === 'new' ? null : editing,
        { title: judul, description: deskripsi, file: berkas, removeImage: hapusGambar },
        nextPosition(items),
      );
      await baca();
      setEditing(null);
      padaBerubah();
      setPapan(yatim.length ? 'Perubahan tersimpan, tapi gambar lama gagal dibersihkan dari penyimpanan.' : 'Perubahan tersimpan.', yatim.length ? 'galat' : 'sukses');
    } catch (err) {
      setPapan(err instanceof Error ? err.message : 'Gagal menyimpan perubahan.');
    } finally {
      setSedang(false);
    }
  }

  async function hapus() {
    if (!menghapus) return;
    setSedang(true);
    try {
      const yatim = await deleteGalleryItem(menghapus);
      await baca();
      setMenghapus(null);
      padaBerubah();
      setPapan(yatim.length ? 'Baris terhapus, tapi berkasnya gagal dibersihkan.' : 'Gambar dihapus.', yatim.length ? 'galat' : 'sukses');
    } catch {
      setPapan('Gambar tidak dapat dihapus.');
    } finally {
      setSedang(false);
    }
  }

  if (editing !== null) {
    return (
      <div className="ad-isi">
        <div className="ad-kepala">
          <ImageIcon className="size-4 text-primary" />
          <div>
            <h2>{editing === 'new' ? 'Gambar baru' : 'Sunting gambar'}</h2>
            <p>Berkas masuk ke bucket gallery-images, barisnya ke tabel gallery_items.</p>
          </div>
        </div>
        <form className="ad-form" onSubmit={simpan}>
          <Button type="button" variant="ghost" size="sm" className="ad-form-kembali" onClick={() => setEditing(null)}>
            <ArrowLeft className="size-3.5" />
            Kembali ke daftar
          </Button>
          <label>
            Judul
            <input required maxLength={160} value={judul} onChange={e => setJudul(e.target.value)} />
          </label>
          <label>
            Deskripsi
            <textarea maxLength={5000} value={deskripsi} onChange={e => setDeskripsi(e.target.value)} />
          </label>
          <label>
            <span className="ad-form-berkas">
              <Upload className="size-3.5" />
              Gambar
            </span>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={e => setBerkas(e.target.files?.[0] ?? null)} />
          </label>
          {editing !== 'new' && editing.image_path && (
            <label className="ad-form-centang">
              <input type="checkbox" checked={hapusGambar} onChange={e => setHapusGambar(e.target.checked)} />
              Kosongkan gambar, pertahankan judul dan deskripsi
            </label>
          )}
          <Button disabled={sedang} type="submit">
            <Save className="size-4" />
            {sedang ? 'Menyimpan…' : 'Simpan perubahan'}
          </Button>
          {galat && (
            <p role="alert" className="ad-form-galat">
              {galat}
            </p>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className="ad-isi">
      <div className="ad-kepala">
        <ImageIcon className="size-4 text-primary" />
        <div>
          <h2>Gambar galeri</h2>
          <p>Urutan kartu mengikuti posisi baris; foto pertama yang tampil adalah posisi teratas.</p>
        </div>
        <Button size="sm" className="ad-kepala-aksi" onClick={() => sunting('new')}>
          <Plus className="size-3.5" />
          Tambah gambar
        </Button>
      </div>

      {sukses && <p role="status" className="ad-papan is-sukses">{sukses}</p>}
      {galat && <p role="alert" className="ad-papan is-galat">{galat}</p>}

      {muat ? (
        <p className="ad-kosong">
          <Loader2 className="size-4 animate-spin" /> Memuat daftar…
        </p>
      ) : (
        <div className="ad-kisi">
          {items.map(item => (
            <figure key={item.id} className="ad-kartu">
              <div className="ad-kartu-gambar">
                {item.image_url ? <img src={item.image_url} alt="" loading="lazy" /> : <ImageIcon className="size-6 opacity-40" />}
              </div>
              <figcaption>
                <strong title={item.title}>{item.title || 'Tanpa judul'}</strong>
                <small>{item.description || 'Belum ada deskripsi.'}</small>
              </figcaption>
              <div className="ad-kartu-aksi">
                <Button size="icon" variant="ghost" aria-label={`Sunting ${item.title}`} onClick={() => sunting(item)}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button size="icon" variant="ghost" aria-label={`Hapus ${item.title}`} onClick={() => setMenghapus(item)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </figure>
          ))}
          {!items.length && <p className="ad-kosong">Belum ada gambar di galeri.</p>}
        </div>
      )}

      {menghapus && (
        <div className="ad-konfirmasi">
          <p>
            Hapus “{menghapus.title}” beserta berkas gambarnya? Tindakan ini tidak bisa dibatalkan dari halaman ini.
          </p>
          <div className="flex gap-2">
            <Button disabled={sedang} variant="destructive" size="sm" onClick={hapus}>
              Hapus
            </Button>
            <Button variant="outline" size="sm" disabled={sedang} onClick={() => setMenghapus(null)}>
              Batal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PanelLagu({ padaBerubah }: { padaBerubah: () => void }) {
  const [songs, setSongs] = useState<SongItem[]>([]);
  const [muat, setMuat] = useState(true);
  const [unggah, setUnggah] = useState(false);
  const [sedang, setSedang] = useState(false);
  const [hapus, setHapus] = useState<SongItem | null>(null);
  const [suntingId, setSuntingId] = useState<string | null>(null);
  const [suntingJudul, setSuntingJudul] = useState('');
  const [setPapan, galat, sukses] = usePapan();
  const audio = useRef<{ id: string; el: HTMLAudioElement } | null>(null);
  const [dengar, setDengar] = useState<string | null>(null);

  const baca = useCallback(async () => {
    try {
      setSongs(await listSongs());
    } catch {
      setPapan('Daftar lagu gagal dimuat.');
    } finally {
      setMuat(false);
    }
  }, [setPapan]);

  useEffect(() => {
    void baca();
    return () => {
      audio.current?.el.pause();
      audio.current = null;
    };
  }, [baca]);

  function diam() {
    audio.current?.el.pause();
    audio.current = null;
    setDengar(null);
  }

  function cobaLagi(song: SongItem) {
    if (audio.current?.id === song.id) {
      diam();
      return;
    }
    diam();
    const el = new Audio(song.file_url);
    el.onended = diam;
    void el.play().catch(error => console.error(error));
    audio.current = { id: song.id, el };
    setDengar(song.id);
  }

  async function pilihBerkas(e: React.ChangeEvent<HTMLInputElement>) {
    const berkas = e.target.files;
    if (!berkas?.length) return;
    setUnggah(true);
    try {
      await uploadSongs(berkas, nextPosition(songs));
      await baca();
      padaBerubah();
      setPapan(`${berkas.length} lagu masuk ke tabel songs.`, 'sukses');
    } catch (err) {
      setPapan(err instanceof Error ? err.message : 'Gagal mengunggah lagu.');
    } finally {
      setUnggah(false);
      e.target.value = '';
    }
  }

  async function ubahJudul(id: string) {
    if (!suntingJudul.trim()) return;
    setSedang(true);
    try {
      const bersih = await renameSong(id, suntingJudul);
      setSongs(prev => prev.map(s => (s.id === id ? { ...s, title: bersih } : s)));
      setSuntingId(null);
      padaBerubah();
      setPapan('Judul lagu diperbarui.', 'sukses');
    } catch (err) {
      setPapan(err instanceof Error ? err.message : 'Gagal mengubah judul.');
    } finally {
      setSedang(false);
    }
  }

  async function buang() {
    if (!hapus) return;
    setSedang(true);
    try {
      if (dengar === hapus.id) diam();
      const yatim = await deleteSong(hapus);
      await baca();
      setHapus(null);
      padaBerubah();
      setPapan(yatim.length ? 'Baris lagu terhapus, berkasnya gagal dibersihkan.' : 'Lagu dihapus.', yatim.length ? 'galat' : 'sukses');
    } catch {
      setPapan('Gagal menghapus lagu.');
    } finally {
      setSedang(false);
    }
  }

  return (
    <div className="ad-isi">
      <div className="ad-kepala">
        <Music className="size-4 text-primary" />
        <div>
          <h2>Musik latar</h2>
          <p>File masuk ke bucket songs; pengunjung mendengar sesuai urutan baris di tabel ini.</p>
        </div>
      </div>

      {sukses && <p role="status" className="ad-papan is-sukses">{sukses}</p>}
      {galat && <p role="alert" className="ad-papan is-galat">{galat}</p>}

      <Grup judul="Unggah" petunjuk="Bisa beberapa file sekaligus. MP3, WAV, OGG, M4A, AAC, FLAC.">
        <label className="ad-unggah">
          <Music className="size-5 text-primary" />
          <span>{unggah ? 'Mengunggah…' : 'Pilih file musik'}</span>
          <input type="file" multiple accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac" disabled={unggah} onChange={pilihBerkas} />
        </label>
      </Grup>

      <Grup judul={`Daftar lagu (${songs.length})`}>
        {muat ? (
          <p className="ad-kosong">
            <Loader2 className="size-4 animate-spin" /> Memuat…
          </p>
        ) : !songs.length ? (
          <p className="ad-kosong">Belum ada lagu.</p>
        ) : (
          <ol className="ad-lagu">
            {songs.map(song => (
              <li key={song.id} className="ad-lagu-baris">
                <Button size="icon" variant="ghost" aria-label={dengar === song.id ? 'Jeda' : 'Putar'} onClick={() => cobaLagi(song)}>
                  {dengar === song.id ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                </Button>
                {suntingId === song.id ? (
                  <span className="ad-lagu-sunting">
                    <input
                      type="text"
                      value={suntingJudul}
                      maxLength={160}
                      autoFocus
                      onChange={e => setSuntingJudul(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') void ubahJudul(song.id);
                        if (e.key === 'Escape') setSuntingId(null);
                      }}
                    />
                    <button type="button" title="Simpan judul" disabled={sedang} onClick={() => void ubahJudul(song.id)}>
                      <Check className="size-3.5" />
                    </button>
                    <button type="button" title="Batal" onClick={() => setSuntingId(null)}>
                      <X className="size-3.5" />
                    </button>
                  </span>
                ) : (
                  <span className="ad-lagu-judul" title={song.title}>
                    {song.title}
                  </span>
                )}
                <span className="ad-lagu-aksi">
                  <button
                    type="button"
                    title="Ubah judul"
                    onClick={() => {
                      setSuntingId(song.id);
                      setSuntingJudul(song.title);
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button type="button" title="Hapus lagu" onClick={() => setHapus(song)}>
                    <Trash2 className="size-3.5" />
                  </button>
                </span>
              </li>
            ))}
          </ol>
        )}
      </Grup>

      {hapus && (
        <div className="ad-konfirmasi">
          <p>Hapus “{hapus.title}” beserta berkasnya secara permanen?</p>
          <div className="flex gap-2">
            <Button disabled={sedang} variant="destructive" size="sm" onClick={buang}>
              Hapus
            </Button>
            <Button variant="outline" size="sm" disabled={sedang} onClick={() => setHapus(null)}>
              Batal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
