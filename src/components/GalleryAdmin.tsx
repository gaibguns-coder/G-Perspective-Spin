import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ImageIcon,
  Loader2,
  LogOut,
  Music,
  Pause,
  Pencil,
  Play,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Button } from './ui/Button';
import {
  checkAdminAccess,
  deleteGalleryItem,
  deleteSong,
  listSongs,
  nextPosition,
  renameSong,
  saveGalleryItem,
  signIn,
  signOut,
  uploadSongs,
  type GalleryItem,
  type SongItem,
} from '@/lib/gallery';
import { BRAND, canEditGallery } from '@/lib/motion';
import { NOT_CONFIGURED_MESSAGE, supabase } from '@/lib/supabase';

interface AdminProps {
  items: GalleryItem[];
  onClose: () => void;
  onChanged: () => void;
  onAccessChange: (allowed: boolean) => void;
}

export function GalleryAdmin({ items, onClose, onChanged, onAccessChange }: AdminProps) {
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'gallery' | 'music'>('gallery');

  const [editing, setEditing] = useState<GalleryItem | 'new' | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleting, setDeleting] = useState<GalleryItem | null>(null);

  const [songs, setSongs] = useState<SongItem[]>([]);
  const [uploadingSongs, setUploadingSongs] = useState(false);
  const [deletingSong, setDeletingSong] = useState<SongItem | null>(null);
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [editingSongTitle, setEditingSongTitle] = useState('');

  const previewRef = useRef<{ id: string; audio: HTMLAudioElement } | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  function stopPreview() {
    previewRef.current?.audio.pause();
    previewRef.current = null;
    setPreviewId(null);
  }

  async function loadSongs() {
    setSongs(await listSongs());
  }

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        if (NOT_CONFIGURED_MESSAGE) throw new Error('unconfigured');
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!active) return;
        setSignedIn(Boolean(user));
        if (user) setAdmin(await checkAdminAccess());
      } catch {
        if (active && !NOT_CONFIGURED_MESSAGE) setError('Tidak dapat memeriksa akses admin.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
      stopPreview();
    };
  }, []);

  useEffect(() => {
    onAccessChange(admin);
    if (admin) void loadSongs();
    else stopPreview();
  }, [admin, onAccessChange]);

  function edit(item: GalleryItem | 'new') {
    setEditing(item);
    setTitle(item === 'new' ? '' : item.title);
    setDescription(item === 'new' ? '' : item.description);
    setFile(null);
    setRemoveImage(false);
    setError('');
    setSuccess('');
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signIn(email.trim(), password);
      setPassword('');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setSignedIn(Boolean(user));
      const allowed = await checkAdminAccess();
      setAdmin(canEditGallery(allowed ? ['admin'] : []));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal.');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    stopPreview();
    await signOut();
    setSignedIn(false);
    setAdmin(false);
    onClose();
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing || !admin) return;
    setBusy(true);
    setError('');
    try {
      await saveGalleryItem(
        editing === 'new' ? null : editing,
        { title, description, file, removeImage },
        nextPosition(items),
      );
      onChanged();
      setEditing(null);
      setSuccess('Perubahan tersimpan.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan perubahan.');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!deleting || !admin) return;
    setBusy(true);
    setError('');
    try {
      await deleteGalleryItem(deleting);
      onChanged();
      setDeleting(null);
      setSuccess('Gambar dihapus.');
    } catch {
      setError('Gambar tidak dapat dihapus.');
    } finally {
      setBusy(false);
    }
  }

  async function saveSongTitle(id: string) {
    if (!editingSongTitle.trim()) return;
    setBusy(true);
    setError('');
    try {
      const clean = await renameSong(id, editingSongTitle);
      setSongs(prev => prev.map(s => (s.id === id ? { ...s, title: clean } : s)));
      setEditingSongId(null);
      setSuccess('Judul musik berhasil diperbarui.');
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah judul musik.');
    } finally {
      setBusy(false);
    }
  }

  async function handleMusicUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length || !admin) return;
    setUploadingSongs(true);
    setError('');
    setSuccess('');
    try {
      await uploadSongs(files, nextPosition(songs));
      await loadSongs();
      setSuccess(`${files.length} musik berhasil diunggah.`);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah musik.');
    } finally {
      setUploadingSongs(false);
      e.target.value = '';
    }
  }

  async function removeSong() {
    if (!deletingSong || !admin) return;
    setBusy(true);
    setError('');
    try {
      if (previewId === deletingSong.id) stopPreview();
      await deleteSong(deletingSong);
      await loadSongs();
      setDeletingSong(null);
      setSuccess('Lagu berhasil dihapus.');
      onChanged();
    } catch {
      setError('Gagal menghapus lagu.');
    } finally {
      setBusy(false);
    }
  }

  function togglePreview(song: SongItem) {
    if (previewRef.current?.id === song.id) {
      stopPreview();
      return;
    }
    stopPreview();
    const audio = new Audio(song.file_url);
    audio.onended = () => stopPreview();
    audio.play().catch(error => console.error(error));
    previewRef.current = { id: song.id, audio };
    setPreviewId(song.id);
  }

  return (
    <div className="admin-overlay" onClick={onClose}>
      <section className="admin-panel" role="dialog" aria-modal="true" aria-label="Kelola galeri" onClick={e => e.stopPropagation()}>
        <div className="admin-heading">
          <h2>{editing ? 'Edit gambar' : 'Panel Pengelolaan'}</h2>
          <Button variant="ghost" size="icon" aria-label="Tutup pengelolaan" onClick={onClose}>
            <X />
          </Button>
        </div>

        {loading ? (
          <p>Memeriksa akses…</p>
        ) : !admin ? (
          <div className="admin-login">
            <ShieldCheck className="size-10 text-primary" />
            <h3>{signedIn ? 'Akses admin diperlukan' : `Masuk sebagai admin ${BRAND}`}</h3>
            {signedIn ? (
              <>
                <p>Akun ini belum memiliki izin untuk mengelola.</p>
                <Button variant="outline" onClick={logout}>
                  <LogOut />
                  Keluar akun
                </Button>
              </>
            ) : NOT_CONFIGURED_MESSAGE ? (
              <p>{NOT_CONFIGURED_MESSAGE}</p>
            ) : (
              <form className="admin-form w-full text-left" onSubmit={login}>
                <label>
                  Email
                  <input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} />
                </label>
                <label>
                  Password
                  <input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} />
                </label>
                <Button disabled={busy} type="submit">
                  {busy ? 'Memproses…' : 'Masuk'}
                </Button>
              </form>
            )}
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between border-b border-border pb-3">
              <div className="flex gap-2">
                <Button variant={activeTab === 'gallery' ? 'default' : 'ghost'} size="sm" onClick={() => { setActiveTab('gallery'); setError(''); setSuccess(''); }}>
                  <ImageIcon className="mr-1.5 size-4" />
                  Galeri ({items.length})
                </Button>
                <Button variant={activeTab === 'music' ? 'default' : 'ghost'} size="sm" onClick={() => { setActiveTab('music'); setError(''); setSuccess(''); }}>
                  <Music className="mr-1.5 size-4" />
                  Musik ({songs.length})
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut />
                Keluar
              </Button>
            </div>

            {activeTab === 'gallery' &&
              (editing ? (
                <form className="admin-form" onSubmit={save}>
                  <Button type="button" variant="ghost" className="self-start" onClick={() => setEditing(null)}>
                    <ArrowLeft />
                    Kembali
                  </Button>
                  <label>
                    Judul
                    <input required maxLength={160} value={title} onChange={e => setTitle(e.target.value)} />
                  </label>
                  <label>
                    Deskripsi
                    <textarea maxLength={5000} value={description} onChange={e => setDescription(e.target.value)} />
                  </label>
                  <label>
                    <span className="flex items-center gap-2">
                      <Upload className="size-4" />
                      Gambar
                    </span>
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={e => setFile(e.target.files?.[0] ?? null)} />
                  </label>
                  {editing !== 'new' && editing.image_path && (
                    <label className="flex-row items-center">
                      <input className="w-auto!" type="checkbox" checked={removeImage} onChange={e => setRemoveImage(e.target.checked)} />
                      Kosongkan gambar
                    </label>
                  )}
                  <Button disabled={busy} type="submit">
                    <Save />
                    {busy ? 'Menyimpan…' : 'Simpan perubahan'}
                  </Button>
                </form>
              ) : (
                <>
                  <Button className="mb-4" onClick={() => edit('new')}>
                    <Plus />
                    Tambah gambar
                  </Button>
                  <div className="max-h-[50vh] space-y-2 overflow-y-auto">
                    {items.map(item => (
                      <div key={item.id} className="admin-row">
                        <div className="admin-thumbnail">
                          {item.image_url ? <img src={item.image_url} alt="" /> : <ImageIcon className="size-5 text-muted-foreground" />}
                        </div>
                        <span className="admin-row-title truncate">{item.title}</span>
                        <Button size="icon" variant="ghost" aria-label={`Edit ${item.title}`} onClick={() => edit(item)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button size="icon" variant="ghost" aria-label={`Hapus ${item.title}`} onClick={() => setDeleting(item)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              ))}

            {activeTab === 'gallery' && deleting && (
              <div className="mt-5 rounded-lg border border-destructive p-4">
                <p className="mb-4 text-sm">Hapus “{deleting.title}” beserta gambarnya?</p>
                <div className="flex gap-2">
                  <Button disabled={busy} variant="destructive" onClick={remove}>
                    Hapus
                  </Button>
                  <Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>
                    Batal
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'music' && (
              <div>
                <div className="mb-4 rounded-xl border border-dashed border-border p-4 text-center">
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2">
                    <Music className="size-8 text-primary" />
                    <span className="text-sm font-medium">Unggah Musik (Bisa pilih beberapa file)</span>
                    <span className="text-xs text-muted-foreground">Mendukung MP3, WAV, OGG, M4A, FLAC, AAC</span>
                    <input type="file" multiple accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac" disabled={uploadingSongs} className="hidden" onChange={handleMusicUpload} />
                    <Button disabled={uploadingSongs} variant="secondary" size="sm" type="button" className="pointer-events-none mt-2">
                      {uploadingSongs ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Mengunggah...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 size-4" />
                          Pilih File Musik
                        </>
                      )}
                    </Button>
                  </label>
                </div>

                <div className="max-h-[45vh] space-y-2 overflow-y-auto">
                  {songs.map(song => (
                    <div key={song.id} className="admin-row">
                      <Button size="icon" variant="ghost" aria-label={previewId === song.id ? 'Jeda' : 'Putar'} onClick={() => togglePreview(song)}>
                        {previewId === song.id ? <Pause className="size-4" /> : <Play className="size-4" />}
                      </Button>
                      {editingSongId === song.id ? (
                        <div className="mx-2 flex flex-1 items-center gap-1.5">
                          <input
                            type="text"
                            className="flex-1 rounded border border-input bg-background px-2 py-1 text-xs"
                            value={editingSongTitle}
                            maxLength={160}
                            autoFocus
                            onChange={e => setEditingSongTitle(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') void saveSongTitle(song.id);
                              if (e.key === 'Escape') setEditingSongId(null);
                            }}
                          />
                          <Button size="icon" variant="ghost" className="size-7" onClick={() => saveSongTitle(song.id)} disabled={busy}>
                            <Check className="size-3.5 text-primary" />
                          </Button>
                          <Button size="icon" variant="ghost" className="size-7" onClick={() => setEditingSongId(null)} disabled={busy}>
                            <X className="size-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="admin-row-title flex-1 truncate text-xs">{song.title}</span>
                          <Button size="icon" variant="ghost" title="Ubah judul musik" onClick={() => { setEditingSongId(song.id); setEditingSongTitle(song.title); }}>
                            <Pencil className="size-3.5 text-muted-foreground" />
                          </Button>
                        </>
                      )}
                      <Button size="icon" variant="ghost" aria-label={`Hapus ${song.title}`} onClick={() => setDeletingSong(song)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {deletingSong && (
                  <div className="mt-4 rounded-lg border border-destructive p-3.5">
                    <p className="mb-3 text-xs">Hapus musik “{deletingSong.title}” secara permanen?</p>
                    <div className="flex gap-2">
                      <Button disabled={busy} variant="destructive" size="sm" onClick={removeSong}>
                        Hapus
                      </Button>
                      <Button variant="outline" size="sm" disabled={busy} onClick={() => setDeletingSong(null)}>
                        Batal
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {error && <p role="alert" className="error-message mt-3">{error}</p>}
        {success && <p role="status" className="success-message mt-3">{success}</p>}
      </section>
    </div>
  );
}
