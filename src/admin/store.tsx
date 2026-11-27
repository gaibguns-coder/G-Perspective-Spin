import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { checkAdminAccess, signIn as masukSupabase, signOut } from '@/lib/gallery';
import { NOT_CONFIGURED_MESSAGE, supabase } from '@/lib/supabase';
import { kontenBawaan, loadContent, saveContent, type BlockKey, type MenuKey, type SiteContent, type TextKey } from '@/lib/settings';

/**
 * Satu draf untuk seluruh panel konten: setiap panel mengubah bagian yang sama,
 * jadi satu tombol Simpan menulis ke semua tabel sekaligus dan mengumpulkan
 * kegagalannya alih-alih berhenti di baris pertama.
 */
export interface AdminDraft {
  draft: SiteContent;
  muat: boolean;
  simpanSedang: boolean;
  galat: string;
  sukses: string;
  kotor: boolean;
  teksBaru: (key: TextKey, ubah: Partial<SiteContent['texts'][TextKey]>) => void;
  menuBaru: (key: MenuKey, ubah: Partial<SiteContent['menus'][MenuKey]>) => void;
  gerakBaru: (ubah: Partial<SiteContent['motion']>) => void;
  blokBaru: (key: BlockKey, ubah: Partial<SiteContent['blocks'][BlockKey]>) => void;
  tampilanBaru: (ubah: Partial<SiteContent['appearance']>) => void;
  infoBaru: (ubah: Partial<SiteContent['info']>) => void;
  urutkan: (key: 'menus' | 'blocks', index: number, arah: -1 | 1) => void;
  setSemua: (next: SiteContent) => void;
  simpan: () => Promise<void>;
  keBawaan: () => void;
}

const Konteks = createContext<AdminDraft | null>(null);

export function useAdmin() {
  const ctx = useContext(Konteks);
  if (!ctx) throw new Error('useAdmin dipakai di luar Konteks Admin');
  return ctx;
}

export type Gerbang = 'memeriksa' | 'belum-masuk' | 'bukan-admin' | 'siap' | 'tanpa-backend';

export interface Sesi {
  gerbang: Gerbang;
  email: string;
  keluar: () => Promise<void>;
  masuk: (email: string, password: string) => Promise<string>;
}

const SesiKonteks = createContext<Sesi | null>(null);

export function useSesi() {
  const ctx = useContext(SesiKonteks);
  if (!ctx) throw new Error('useSesi dipakai di luar Konteks Admin');
  return ctx;
}

function tukar<T>(daftar: T[], dari: number, ke: number): T[] {
  if (ke < 0 || ke >= daftar.length) return daftar;
  const next = [...daftar];
  const [baris] = next.splice(dari, 1);
  next.splice(ke, 0, baris);
  return next;
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [gerbang, setGerbang] = useState<Gerbang>('memeriksa');
  const [email, setEmail] = useState('');
  const [draft, setDraft] = useState<SiteContent>(() => kontenBawaan());
  const [awal, setAwal] = useState(() => JSON.stringify(kontenBawaan()));
  const [muat, setMuat] = useState(true);
  const [simpanSedang, setSimpanSedang] = useState(false);
  const [galat, setGalat] = useState('');
  const [sukses, setSukses] = useState('');

  useEffect(() => {
    let aktif = true;
    async function periksa() {
      if (NOT_CONFIGURED_MESSAGE) {
        if (aktif) setGerbang('tanpa-backend');
        return;
      }
      try {
        // Tanpa sesi, pengunjung biasa harus disuguhi formulir — bukan pesan "bukan admin".
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) {
          if (aktif) setGerbang('belum-masuk');
          return;
        }
        if (aktif) setEmail(session.user.email ?? '');
        if (aktif) setGerbang((await checkAdminAccess()) ? 'siap' : 'bukan-admin');
      } catch {
        if (aktif) setGerbang('belum-masuk');
      }
    }
    void periksa();
    return () => {
      aktif = false;
    };
  }, []);

  useEffect(() => {
    if (gerbang !== 'siap') return;
    let aktif = true;
    void loadContent()
      .then(next => {
        if (!aktif) return;
        setDraft(next);
        setAwal(JSON.stringify(next));
      })
      .catch(() => {
        if (aktif) setGalat('Konten gagal dimuat. Nilai di bawah masih bawaan aplikasi.');
      })
      .finally(() => {
        if (aktif) setMuat(false);
      });
    return () => {
      aktif = false;
    };
  }, [gerbang]);

  const sunting = useCallback((ubah: (sebelum: SiteContent) => SiteContent) => {
    setDraft(prev => ubah(prev));
    setGalat('');
    setSukses('');
  }, []);

  const nilai = useMemo<AdminDraft>(
    () => ({
      draft,
      muat,
      simpanSedang,
      galat,
      sukses,
      kotor: JSON.stringify(draft) !== awal,
      teksBaru: (key, ubah) => sunting(p => ({ ...p, texts: { ...p.texts, [key]: { ...p.texts[key], ...ubah } } })),
      menuBaru: (key, ubah) => sunting(p => ({ ...p, menus: { ...p.menus, [key]: { ...p.menus[key], ...ubah } } })),
      gerakBaru: ubah => sunting(p => ({ ...p, motion: { ...p.motion, ...ubah } })),
      blokBaru: (key, ubah) => sunting(p => ({ ...p, blocks: { ...p.blocks, [key]: { ...p.blocks[key], ...ubah } } })),
      tampilanBaru: ubah => sunting(p => ({ ...p, appearance: { ...p.appearance, ...ubah } })),
      infoBaru: ubah => sunting(p => ({ ...p, info: { ...p.info, ...ubah } })),
      urutkan: (kelompok, index, arah) =>
        sunting(p => {
          const kunci = Object.keys(p[kelompok]) as string[];
          const tersusun = tukar(kunci, index, index + arah);
          if (kelompok === 'menus') {
            const menus = {} as SiteContent['menus'];
            for (const k of tersusun) menus[k as MenuKey] = p.menus[k as MenuKey];
            return { ...p, menus };
          }
          const blocks = {} as SiteContent['blocks'];
          for (const k of tersusun) blocks[k as BlockKey] = p.blocks[k as BlockKey];
          return { ...p, blocks };
        }),
      setSemua: next => sunting(() => next),
      keBawaan: () => sunting(() => kontenBawaan()),
      simpan: async () => {
        setSimpanSedang(true);
        try {
          await saveContent(draft);
          setAwal(JSON.stringify(draft));
          setSukses('Tersimpan. Semua pengunjung melihatnya pada muat berikutnya.');
        } catch (err) {
          setGalat(err instanceof Error ? err.message : 'Pengaturan gagal disimpan.');
        } finally {
          setSimpanSedang(false);
        }
      },
    }),
    [draft, awal, muat, simpanSedang, galat, sukses, sunting],
  );

  const sesi = useMemo<Sesi>(
    () => ({
      gerbang,
      email,
      keluar: async () => {
        await signOut();
        setGerbang('belum-masuk');
        setEmail('');
      },
      masuk: async (alamat, kataSandi) => {
        try {
          await masukSupabase(alamat, kataSandi);
          const boleh = await checkAdminAccess();
          setGerbang(boleh ? 'siap' : 'bukan-admin');
          setEmail(alamat);
          return boleh ? '' : 'Akun ini masuk, tetapi belum punya peran admin.';
        } catch (err) {
          return err instanceof Error ? err.message : 'Login gagal.';
        }
      },
    }),
    [gerbang, email],
  );

  return (
    <SesiKonteks.Provider value={sesi}>
      <Konteks.Provider value={nilai}>{children}</Konteks.Provider>
    </SesiKonteks.Provider>
  );
}
