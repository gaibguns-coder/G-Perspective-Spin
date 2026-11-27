import { Move3d, Sparkles } from 'lucide-react';
import { MiniKarousel } from '../MiniKarousel';
import { Baris, Geser, Grup, Pilihan, Sakelar } from '../fields';
import { useAdmin } from '../store';
import { DEFAULT_MOTION } from '@/lib/settings';
import type { Motion } from '@/lib/settings';

/**
 * Susunan angka siap pakai. "Rapi" menyalin bawaan aplikasi sehingga admin selalu
 * punya jalan pulang bila hasil suntingan terasa berlebihan.
 */
const PRESET: { nama: string; petunjuk: string; nilai: Partial<Motion> }[] = [
  { nama: 'Lembut', petunjuk: 'Putaran lambat, kartu belakang sedikit meredup.', nilai: { orientation: 'horizontal', speed: 0.6, degPerSec: 5, easeRate: 2.2, hoverPct: 30, hoverMs: 2000, fadePct: 22, viewAngle: 12, perspective: 1900, stagePct: 100, radiusPct: 105 } },
  { nama: 'Rapi', petunjuk: 'Persis bawaan aplikasi.', nilai: { orientation: 'horizontal', speed: 1, degPerSec: 8, easeRate: 3.2, hoverPct: 18, hoverMs: 1400, fadePct: 0, viewAngle: 17, perspective: 1600, stagePct: 100, radiusPct: 100 } },
  { nama: 'Dramatis', petunjuk: 'Sudut curam dari atas, perspektif dekat, belakang gelap.', nilai: { orientation: 'horizontal', speed: 0.85, degPerSec: 6.5, easeRate: 2.6, hoverPct: 8, hoverMs: 1000, fadePct: 55, viewAngle: 32, perspective: 900, stagePct: 110, radiusPct: 130 } },
  { nama: 'Menara', petunjuk: 'Kincin berdiri tegak: kartu naik dari bawah ke atas.', nilai: { orientation: 'vertical', speed: 0.9, degPerSec: 7, easeRate: 3, hoverPct: 15, hoverMs: 1700, fadePct: 40, viewAngle: 0, perspective: 1300, stagePct: 92, radiusPct: 118 } },
];

export function PanelGerak() {
  const { draft, gerakBaru } = useAdmin();
  const m = draft.motion;

  return (
    <div className="ad-isi">
      <div className="ad-kepala">
        <Move3d className="size-4 text-primary" />
        <div>
          <h2>Carousel</h2>
          <p>Bentuk, arah, dan rasa gerak galeri. Miniatur di kanan memakai angka yang sama dengan halaman depan.</p>
        </div>
      </div>

      <div className="ad-2">
        <div>
          <Grup judul="Geometri kincin" petunjuk="Sumbu putaran, jarak antar kartu, dan besar panggung.">
            <Baris label="Bentuk putaran" petunjuk="Horizontal berputar ke kiri/kanan, vertikal berputar naik/turun.">
              <Pilihan
                value={m.orientation}
                onChange={orientation => gerakBaru({ orientation })}
                options={[
                  { value: 'horizontal', label: 'Horizontal' },
                  { value: 'vertical', label: 'Vertikal' },
                ]}
              />
            </Baris>
            <Geser
              label="Sudut lihat"
              petunjuk="Positif berarti melihat dari atas, negatif dari bawah."
              min={-45}
              max={45}
              value={m.viewAngle}
              bawaan={DEFAULT_MOTION.viewAngle}
              satuan="°"
              onChange={viewAngle => gerakBaru({ viewAngle })}
            />
            <Geser
              label="Kedalaman perspektif"
              petunjuk="Angka kecil membuat jarak terasa lebih dekat dan dramatis."
              min={400}
              max={4000}
              step={50}
              value={m.perspective}
              bawaan={DEFAULT_MOTION.perspective}
              satuan="px"
              onChange={perspective => gerakBaru({ perspective })}
            />
            <Geser
              label="Jarak antar kartu"
              petunjuk="100% berarti kartu bersentuhan pas tanpa tumpang tindih."
              min={40}
              max={300}
              step={5}
              value={m.radiusPct}
              bawaan={DEFAULT_MOTION.radiusPct}
              satuan="%"
              onChange={radiusPct => gerakBaru({ radiusPct })}
            />
            <Geser
              label="Besar panggung"
              petunjuk="Mengalikan skala bawaan layar, jadi ponsel tetap lebih kecil."
              min={50}
              max={200}
              step={2}
              value={m.stagePct}
              bawaan={DEFAULT_MOTION.stagePct}
              satuan="%"
              onChange={stagePct => gerakBaru({ stagePct })}
            />
            <Geser
              label="Jumlah slot awal"
              petunjuk="Kartu kosong yang disiapkan sebelum galeri berisi foto."
              min={3}
              max={40}
              value={m.slotCount}
              bawaan={DEFAULT_MOTION.slotCount}
              onChange={slotCount => gerakBaru({ slotCount })}
            />
          </Grup>

          <Grup judul="Kelajuan" petunjuk="Berapa cepat dan bagaimana putaran berubah.">
            <Baris label="Arah" petunjuk="Arah saat halaman pertama kali diputar.">
              <Pilihan
                value={m.direction}
                onChange={direction => gerakBaru({ direction })}
                options={[
                  { value: 'left', label: 'Kiri' },
                  { value: 'right', label: 'Kanan' },
                ]}
              />
            </Baris>
            <Geser
              label="Pengali kecepatan"
              min={0.2}
              max={3}
              step={0.1}
              value={m.speed}
              bawaan={DEFAULT_MOTION.speed}
              satuan="×"
              onChange={speed => gerakBaru({ speed })}
            />
            <Geser
              label="Kelajuan dasar"
              petunjuk="Derajat per detik ketika pengali berada di 1×."
              min={1}
              max={30}
              step={0.5}
              value={m.degPerSec}
              bawaan={DEFAULT_MOTION.degPerSec}
              satuan="°/s"
              onChange={degPerSec => gerakBaru({ degPerSec })}
            />
            <Baris label="Langsung berputar" petunjuk="Nonaktif bila pengunjung harus menekan tombol lebih dulu.">
              <Sakelar checked={m.autoplay} onChange={autoplay => gerakBaru({ autoplay })} label="Langsung berputar" />
            </Baris>
          </Grup>
        </div>

        <div>
          <div className="ad-pratinjau">
            <MiniKarousel motion={m} slot={Math.min(12, Math.max(4, Math.round(m.slotCount / 2)))} />
            <p className="ad-catat">
              Miniatur hanya untuk memperkirakan bentuk; jumlah kartunya dipangkas supaya muat di panel.
            </p>
          </div>

          <Grup judul="Rasa gerak" petunjuk="Bagaimana putaran melambat dan seberapa gelap kartu belakang.">
            <Baris label="Perlambat saat kursor di atas kartu" petunjuk="Bila dimatikan, putaran tetap penuh ketika disentuh kursor.">
              <Sakelar checked={m.pauseOnHover} onChange={pauseOnHover => gerakBaru({ pauseOnHover })} label="Perlambat saat kursor" />
            </Baris>
            <Geser
              label="Sisa kecepatan saat kursor"
              petunjuk="Tidak berlaku bila perlambatan kursor dimatikan."
              min={0}
              max={100}
              value={m.hoverPct}
              bawaan={DEFAULT_MOTION.hoverPct}
              satuan="%"
              onChange={hoverPct => gerakBaru({ hoverPct })}
            />
            <Geser
              label="Lama kartu membesar saat disorot"
              petunjuk="Waktu transisi membesar dan mengecilnya kartu, dalam milidetik. Makin besar makin mengambang."
              min={200}
              max={3000}
              step={50}
              value={m.hoverMs}
              bawaan={DEFAULT_MOTION.hoverMs}
              satuan="ms"
              onChange={hoverMs => gerakBaru({ hoverMs })}
            />
            <Geser
              label="Kelandaian kurva"
              petunjuk="Makin besar, makin cepat putaran bereaksi saat berubah."
              min={0.5}
              max={12}
              step={0.1}
              value={m.easeRate}
              bawaan={DEFAULT_MOTION.easeRate}
              onChange={easeRate => gerakBaru({ easeRate })}
            />
            <Geser
              label="Redup kartu belakang"
              petunjuk="0 berarti semua kartu sama terang seperti sebelumnya."
              min={0}
              max={90}
              value={m.fadePct}
              bawaan={DEFAULT_MOTION.fadePct}
              satuan="%"
              onChange={fadePct => gerakBaru({ fadePct })}
            />
          </Grup>

          <Grup
            judul="Gradasi latar koridor"
            petunjuk="Atur sendiri seberapa cepat garis perspektif dan bingkai kotak memudar. Semua angka disimpan sebagai satu baris di site_motion."
          >
            <Geser
              label="Terang di titik lenyap"
              petunjuk="Kecerahan garis paling tengah. 100 berarti penuh, 20 berarti kabur sejak dari pusat."
              min={20}
              max={100}
              value={m.corridorCorePct}
              bawaan={DEFAULT_MOTION.corridorCorePct}
              satuan="%"
              onChange={corridorCorePct => gerakBaru({ corridorCorePct })}
            />
            <Geser
              label="Jarak sebelum mulai pudar"
              petunjuk="Sebagian radius layar yang tetap terang penuh. Naikkan bila bingkai kotak ingin terlihat jelas lebih lama."
              min={0}
              max={100}
              value={m.corridorFadePct}
              bawaan={DEFAULT_MOTION.corridorFadePct}
              satuan="%"
              onChange={corridorFadePct => gerakBaru({ corridorFadePct })}
            />
            <Geser
              label="Terang sisa di tepi layar"
              petunjuk="0 berarti tepi benar-benar transparan; 100 berarti tidak ada transparansi sama sekali."
              min={0}
              max={100}
              value={m.corridorEdgePct}
              bawaan={DEFAULT_MOTION.corridorEdgePct}
              satuan="%"
              onChange={corridorEdgePct => gerakBaru({ corridorEdgePct })}
            />
          </Grup>

          <Grup judul="Preset" petunjuk="Menimpa angka di atas dengan susunan yang sudah dites.">
            <div className="ad-preset">
              <Sparkles className="size-3.5 text-primary" />
              {PRESET.map(p => (
                <button key={p.nama} type="button" title={p.petunjuk} onClick={() => gerakBaru(p.nilai)}>
                  {p.nama}
                </button>
              ))}
            </div>
          </Grup>
        </div>
      </div>
    </div>
  );
}
