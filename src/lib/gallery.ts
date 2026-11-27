import { supabase } from './supabase';
import { INITIAL_SLOT_COUNT } from './motion';

export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  image_path: string | null;
  position: number;
  image_url: string | null;
}

export interface SongItem {
  id: string;
  title: string;
  file_path: string;
  file_url: string;
  position: number;
}

const IMAGE_BUCKET = 'gallery-images';
const SONG_BUCKET = 'songs';

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];

export const ALLOWED_AUDIO_EXT = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'webm'];
export const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/aac',
  'audio/m4a',
  'audio/x-m4a',
  'audio/mp4',
  'audio/flac',
  'audio/webm',
];

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const MAX_SONG_SIZE = 25 * 1024 * 1024;

function publicUrl(bucket: string, path: string) {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function listGallery(): Promise<GalleryItem[]> {
  const { data, error } = await supabase
    .from('gallery_items')
    .select('id,title,description,image_path,position')
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw new Error('Galeri tidak dapat dimuat.');
  return (data ?? []).map(item => ({
    ...item,
    image_url: item.image_path ? publicUrl(IMAGE_BUCKET, item.image_path) : null,
  }));
}

export async function listSongs(): Promise<SongItem[]> {
  const { data, error } = await supabase
    .from('songs')
    .select('id,title,file_path,file_url,position')
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) return [];
  return (data ?? []).map(song => ({
    ...song,
    file_url: song.file_url || publicUrl(SONG_BUCKET, song.file_path),
  }));
}

export async function checkAdminAccess(): Promise<boolean> {
  const {
    data: { user },
    error: galatSesi,
  } = await supabase.auth.getUser();
  if (galatSesi) throw new Error(`Sesi tidak dapat dibaca: ${galatSesi.message}`);
  if (!user) return false;
  const { data, error } = await supabase.rpc('has_role', {
    _user_id: user.id,
    _role: 'admin',
  });
  if (error) throw new Error(`Peran admin tidak dapat diperiksa: ${error.message}`);
  return Boolean(data);
}

/**
 * Kesalahan Supabase diteruskan apa adanya. Pesan umum dipakai sebelumnya
 * ("periksa email dan password") menutupi tiga sebab berbeda: sandi memang salah,
 * email belum terdaftar di project ini, atau terlalu banyak percobaan.
 */
export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) {
    const kode = (error as { error_code?: string }).error_code;
    throw new Error(kode ? `${error.message} (${kode})` : error.message);
  }
}

export async function signOut() {
  await supabase.auth.signOut();
}

export interface GalleryDraft {
  title: string;
  description: string;
  file: File | null;
  removeImage: boolean;
}

/**
 * Hapus berkas dari bucket. Baris data dan berkas storage tidak terikat asing,
 * jadi kegagalan penghapusan berkas dikembalikan sebagai daftar path yatim agar
 * UI bisa memperingatkan pengguna alih-alih berpura-pura bersih.
 */
async function removeFiles(bucket: string, paths: string[]): Promise<string[]> {
  if (!paths.length) return [];
  const { error } = await supabase.storage.from(bucket).remove(paths);
  return error ? paths : [];
}

export async function saveGalleryItem(
  existing: GalleryItem | null,
  draft: GalleryDraft,
  nextPosition: number,
): Promise<string[]> {
  if (!draft.file && !draft.title.trim()) throw new Error('Judul wajib diisi.');

  let newPath: string | null = null;
  const oldPath = existing?.image_path ?? null;

  if (draft.file) {
    if (!ALLOWED_IMAGE_TYPES.includes(draft.file.type)) {
      throw new Error('Pilih gambar JPG, PNG, WebP, GIF, atau AVIF.');
    }
    if (draft.file.size > MAX_IMAGE_SIZE) throw new Error('Ukuran gambar maksimal 10 MB.');
    const ext = draft.file.type.split('/')[1] ?? 'png';
    newPath = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(newPath, draft.file, { contentType: draft.file.type });
    if (error) {
      newPath = null;
      throw new Error('Gambar tidak dapat diunggah.');
    }
  }

  const values = {
    title: draft.title.trim().slice(0, 160),
    description: draft.description.trim().slice(0, 5000),
    image_path: newPath ?? (draft.removeImage ? null : oldPath),
  };

  const query = existing
    ? supabase.from('gallery_items').update(values).eq('id', existing.id)
    : supabase.from('gallery_items').insert({ ...values, position: nextPosition });

  const { error } = await query;
  if (error) {
    if (newPath) {
      const yatim = await removeFiles(IMAGE_BUCKET, [newPath]);
      if (yatim.length) console.warn('Bekas unggahan gagal dibersihkan:', yatim);
    }
    throw new Error('Perubahan tidak dapat disimpan.');
  }
  if (oldPath && (newPath || draft.removeImage)) return removeFiles(IMAGE_BUCKET, [oldPath]);
  return [];
}

export async function deleteGalleryItem(item: GalleryItem): Promise<string[]> {
  const { error } = await supabase.from('gallery_items').delete().eq('id', item.id);
  if (error) throw new Error('Gambar tidak dapat dihapus.');
  return item.image_path ? removeFiles(IMAGE_BUCKET, [item.image_path]) : [];
}

/**
 * Validasi header biner supaya file yang menyamar sebagai audio (mis. .exe
 * diberi nama .mp3) tidak ikut terunggah.
 */
export async function verifyAudioHeader(file: File): Promise<boolean> {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const b = (i: number) => bytes[i] ?? -1;

  const isMp3 = (b(0) === 0x49 && b(1) === 0x44 && b(2) === 0x33) || (b(0) === 0xff && (b(1) & 0xe0) === 0xe0);
  const isWav = b(0) === 0x52 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x46;
  const isOgg = b(0) === 0x4f && b(1) === 0x67 && b(2) === 0x67 && b(3) === 0x53;
  const isFlac = b(0) === 0x66 && b(1) === 0x4c && b(2) === 0x61 && b(3) === 0x43;
  const isM4a = b(4) === 0x66 && b(5) === 0x74 && b(6) === 0x79 && b(7) === 0x70;
  const isWebm = b(0) === 0x1a && b(1) === 0x45 && b(2) === 0xdf && b(3) === 0xa3;

  return isMp3 || isWav || isOgg || isFlac || isM4a || isWebm;
}

export async function uploadSongs(files: FileList | File[], startPos: number): Promise<number> {
  let position = startPos;
  for (const musicFile of Array.from(files)) {
    if (musicFile.size > MAX_SONG_SIZE) {
      throw new Error(`Ukuran file "${musicFile.name}" melebihi batas 25 MB.`);
    }
    if (musicFile.type && !ALLOWED_AUDIO_TYPES.includes(musicFile.type.toLowerCase())) {
      throw new Error(`File "${musicFile.name}" bukan format audio yang didukung.`);
    }
    if (!(await verifyAudioHeader(musicFile))) {
      throw new Error(`File "${musicFile.name}" bukan file audio yang valid.`);
    }

    const rawExt = musicFile.name.split('.').pop()?.toLowerCase() ?? 'mp3';
    const safeExt = ALLOWED_AUDIO_EXT.includes(rawExt) ? rawExt : 'mp3';
    const safeName = `${crypto.randomUUID()}.${safeExt}`;
    const cleanTitle = musicFile.name.replace(/\.[^/.]+$/, '').trim().slice(0, 160) || 'Lagu Tanpa Judul';

    const { error: uploadErr } = await supabase.storage
      .from(SONG_BUCKET)
      .upload(safeName, musicFile, {
        contentType: `audio/${safeExt === 'mp3' ? 'mpeg' : safeExt}`,
        upsert: false,
      });
    if (uploadErr) throw new Error(`Gagal mengunggah "${musicFile.name}".`);

    const { error: insertErr } = await supabase.from('songs').insert({
      title: cleanTitle,
      file_path: safeName,
      file_url: publicUrl(SONG_BUCKET, safeName),
      position,
    });
    if (insertErr) {
      const yatim = await removeFiles(SONG_BUCKET, [safeName]);
      if (yatim.length) console.warn('Bekas unggahan musik gagal dibersihkan:', yatim);
      throw new Error(`Rekaman "${musicFile.name}" gagal disimpan.`);
    }
    position += 1;
  }
  return position;
}

export async function deleteSong(song: SongItem): Promise<string[]> {
  const { error } = await supabase.from('songs').delete().eq('id', song.id);
  if (error) throw new Error('Gagal menghapus lagu.');
  return removeFiles(SONG_BUCKET, [song.file_path]);
}

export async function renameSong(id: string, title: string) {
  const clean = title.trim().slice(0, 160);
  if (!clean) throw new Error('Judul musik tidak boleh kosong.');
  const { error } = await supabase.from('songs').update({ title: clean }).eq('id', id);
  if (error) throw new Error('Gagal mengubah judul musik.');
  return clean;
}

export async function persistSongOrder(songs: SongItem[]) {
  await Promise.all(
    songs
      .map((song, index) => ({ song, order: index + 1 }))
      .filter(({ song, order }) => song.position !== order)
      .map(({ song, order }) => supabase.from('songs').update({ position: order }).eq('id', song.id)),
  );
}

export function nextPosition(items: readonly { position: number }[]) {
  return Math.max(0, ...items.map(item => item.position)) + 1;
}

/**
 * Slot kosong bawaan untuk tampilan tanpa backend, supaya kerangka 3D tetap
 * bisa dinilai sebelum Supabase disambungkan. Jumlahnya ikut tabel site_motion.
 */
export function demoSlots(jumlah: number = INITIAL_SLOT_COUNT): GalleryItem[] {
  const pas = Math.min(40, Math.max(3, Math.round(jumlah)));
  return Array.from({ length: pas }, (_, i) => ({
    id: `demo-${i + 1}`,
    title: `Gambar ${String(i + 1).padStart(2, '0')}`,
    description: '',
    image_path: null,
    position: i + 1,
    image_url: null,
  }));
}
