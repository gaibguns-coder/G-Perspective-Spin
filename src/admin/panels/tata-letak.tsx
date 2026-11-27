import { useRef, useState } from 'react';
import { LayoutGrid, Move } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAdmin } from '../store';
import { DEFAULT_BLOCKS, menuOn, type BlockKey } from '@/lib/settings';
import './letak.css';

/** Tempat semula setiap bagian di atas kanvas 16∶10, dalam persen lebar dan tinggi. */
const KANVAS: Record<BlockKey, { x: number; y: number; w: number; h: number; catatan: string }> = {
  header: { x: 2, y: 2, w: 96, h: 7, catatan: 'melebar di puncak' },
  intro: { x: 6, y: 12, w: 58, h: 11, catatan: 'kiri atas panggung' },
  scene: { x: 8, y: 25, w: 84, h: 41, catatan: 'carousel + koridor' },
  status: { x: 10, y: 67, w: 80, h: 4, catatan: 'garis di dasar panggung' },
  playback: { x: 26, y: 75, w: 48, h: 10, catatan: 'bawah panggung' },
  music: { x: 2, y: 80, w: 24, h: 15, catatan: 'melayang kiri bawah' },
  sidePanel: { x: 82, y: 11, w: 16, h: 9, catatan: 'melayang kanan atas' },
  footer: { x: 2, y: 92, w: 96, h: 5, catatan: 'melebar di dasar' },
};

const URUTAN = Object.keys(KANVAS) as BlockKey[];
const BATAS = { x: 50, y: 40 };

export function PanelLetak() {
  const { draft, blokBaru, menuBaru, urutkan } = useAdmin();
  const kanvas = useRef<HTMLDivElement>(null);
  const seret = useRef<{ key: BlockKey; px: number; py: number; x: number; y: number } | null>(null);
  const [aktif, setAktif] = useState<BlockKey | null>(null);

  function turun(e: React.PointerEvent<HTMLDivElement>) {
    const key = e.currentTarget.dataset.blok as BlockKey;
    const b = draft.blocks[key];
    seret.current = { key, px: e.clientX, py: e.clientY, x: b.x, y: b.y };
    setAktif(key);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* penangkapan pointer tidak selalu tersedia (Safari, event sintetis) */
    }
  }

  function gerak(e: React.PointerEvent<HTMLDivElement>) {
    const awal = seret.current;
    const box = kanvas.current?.getBoundingClientRect();
    if (!awal || !box) return;
    const dx = ((e.clientX - awal.px) / box.width) * 100;
    const dy = ((e.clientY - awal.py) / box.height) * 100;
    blokBaru(awal.key, {
      x: Math.round(Math.min(BATAS.x, Math.max(-BATAS.x, awal.x + dx)) * 10) / 10,
      y: Math.round(Math.min(BATAS.y, Math.max(-BATAS.y, awal.y + dy)) * 10) / 10,
    });
  }

  function lepas(e: React.PointerEvent<HTMLDivElement>) {
    seret.current = null;
    setAktif(null);
    const blok = e.currentTarget.closest('.ad-kanvas-blok') as HTMLDivElement | null;
    if (blok?.hasPointerCapture?.(e.pointerId)) blok.releasePointerCapture(e.pointerId);
  }

  function geser1(key: BlockKey, sumbu: 'x' | 'y', arah: -1 | 1) {
    const langkah = sumbu === 'x' ? 1 : 0.5;
    const nilai = draft.blocks[key][sumbu] + arah * langkah;
    const batas = sumbu === 'x' ? BATAS.x : BATAS.y;
    blokBaru(key, { [sumbu]: Math.min(batas, Math.max(-batas, Math.round(nilai * 10) / 10)) } as Partial<(typeof DEFAULT_BLOCKS)[BlockKey]>);
  }

  return (
    <div className="ad-isi">
      <div className="ad-kepala">
        <LayoutGrid className="size-4 text-primary" />
        <div>
          <h2>Tata letak</h2>
          <p>
            Seret bagian pada kanvas untuk menggesernya, atau pakai tombol panah untuk langkah presisi. Posisi disimpan sebagai
            pergeseran dari tempat semula, jadi tampilan tetap rapi pada layar lain.
          </p>
        </div>
      </div>

      <div className="ad-2">
        <div>
          <div className="ad-letak-head">
            <span className="ad-letak-ket">Kanvas perkiraan</span>
            {aktif && (
              <Button variant="ghost" size="sm" onClick={() => blokBaru(aktif, { x: 0, y: 0 })}>
                <Move className="size-3.5" />
                Pusatkan “{draft.blocks[aktif].label}”
              </Button>
            )}
          </div>
          <div className="ad-kanvas" ref={kanvas}>
            {URUTAN.map((key, i) => {
              const b = draft.blocks[key];
              const t = KANVAS[key];
              const nyala = key === 'scene' || menuOn(draft, key);
              return (
                <div
                  key={key}
                  className={`ad-kanvas-blok${aktif === key ? ' is-aktif' : ''}${nyala ? '' : ' is-mati'}`}
                  data-blok={key}
                  role="button"
                  tabIndex={0}
                  aria-label={`Geser ${b.label}`}
                  title={`${b.label} — ${t.catatan}`}
                  style={{
                    left: `${t.x + b.x}%`,
                    top: `${t.y + b.y}%`,
                    width: `${t.w}%`,
                    height: `${t.h}%`,
                    transform: `scale(${b.scale})`,
                    zIndex: b.z || i + 1,
                  }}
                  onPointerDown={turun}
                  onPointerMove={gerak}
                  onPointerUp={lepas}
                  onPointerCancel={lepas}
                  onKeyDown={e => {
                    if (e.key === 'ArrowLeft') geser1(key, 'x', -1);
                    if (e.key === 'ArrowRight') geser1(key, 'x', 1);
                    if (e.key === 'ArrowUp') geser1(key, 'y', -1);
                    if (e.key === 'ArrowDown') geser1(key, 'y', 1);
                  }}
                >
                  <span>{b.label}</span>
                  {(b.x !== 0 || b.y !== 0) && <em>
                    {b.x > 0 ? '+' : ''}
                    {b.x} / {b.y > 0 ? '+' : ''}
                    {b.y}
                  </em>}
                </div>
              );
            })}
          </div>
          <p className="ad-catat">
            Kanvas hanya perkiraan urutan dan tempat; tinggi aslinya mengikuti isi tiap bagian. Angka x = persen lebar layar,
            y = persen tinggi layar.
          </p>
        </div>

        <div className="ad-letak-tabel">
          {URUTAN.map((key, i) => {
            const b = draft.blocks[key];
            const ubah = Math.abs(b.x) > 0.01 || Math.abs(b.y) > 0.01 || Math.abs(b.scale - 1) > 0.01 || b.z !== 0;
            return (
              <div key={key} className={`ad-letak-baris${ubah ? '' : ' is-bersih'}`}>
                <div className="ad-letak-nama">
                  <span className="ad-letak-urut">{i + 1}</span>
                  <div>
                    <strong>{b.label}</strong>
                    <small>{KANVAS[key].catatan}</small>
                  </div>
                </div>
                <div className="ad-letak-kendali">
                  {(['x', 'y'] as const).map(sumbu => (
                    <label key={sumbu} className="ad-letak-angka">
                      <span>{sumbu}</span>
                      <input
                        type="number"
                        min={sumbu === 'x' ? -BATAS.x : -BATAS.y}
                        max={sumbu === 'x' ? BATAS.x : BATAS.y}
                        step={0.5}
                        value={b[sumbu]}
                        onChange={e => blokBaru(key, { [sumbu]: Number(e.target.value) } as Partial<typeof b>)}
                      />
                    </label>
                  ))}
                  <label className="ad-letak-angka">
                    <span>skala</span>
                    <input
                      type="number"
                      min={0.5}
                      max={2}
                      step={0.05}
                      value={b.scale}
                      onChange={e => blokBaru(key, { scale: Number(e.target.value) })}
                    />
                  </label>
                  <label className="ad-letak-angka">
                    <span>z</span>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={b.z}
                      onChange={e => blokBaru(key, { z: Number(e.target.value) })}
                    />
                  </label>
                </div>
                <div className="ad-letak-aksi">
                  <button type="button" title="Naikkan urutan" onClick={() => urutkan('blocks', i, -1)}>
                    ↑
                  </button>
                  <button type="button" title="Turunkan urutan" onClick={() => urutkan('blocks', i, 1)}>
                    ↓
                  </button>
                  <button
                    type="button"
                    title="Kembalikan ke tempat semula"
                    disabled={!ubah}
                    onClick={() => blokBaru(key, { ...DEFAULT_BLOCKS[key], label: b.label, hint: b.hint })}
                  >
                    ⟲
                  </button>
                </div>
                {key !== 'scene' && (
                  <button
                    type="button"
                    className={`ad-letak-nyala${menuOn(draft, key) ? ' is-nyala' : ''}`}
                    title="Menyalakan atau mematikan bagian ini di halaman"
                    onClick={() => menuBaru(key, { on: !menuOn(draft, key) })}
                  >
                    {menuOn(draft, key) ? 'tampil' : 'sembunyi'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
