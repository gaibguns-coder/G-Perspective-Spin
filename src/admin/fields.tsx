import { Ban, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { FONT_GROUPS, FONT_OPTIONS } from '@/lib/settings';
import './fields.css';

/** Kelompok bidang dengan judul dan satu baris petunjuk. */
export function Grup({ judul, petunjuk, children }: { judul: string; petunjuk?: string; children: ReactNode }) {
  return (
    <section className="ad-grup">
      <header className="ad-grup-kepala">
        <h3>{judul}</h3>
        {petunjuk && <p>{petunjuk}</p>}
      </header>
      <div className="ad-grup-isi">{children}</div>
    </section>
  );
}

/** Satu baris: keterangan di kiri, kendali di kanan. */
export function Baris({
  label,
  petunjuk,
  children,
  lebar,
}: {
  label: string;
  petunjuk?: string;
  children: ReactNode;
  lebar?: 'sempit' | 'sedang' | 'lebar';
}) {
  return (
    <div className={`ad-baris${lebar ? ` is-${lebar}` : ''}`}>
      <div className="ad-label">
        <span>{label}</span>
        {petunjuk && <small>{petunjuk}</small>}
      </div>
      <div className="ad-kendali">{children}</div>
    </div>
  );
}

export function Sakelar({ checked, onChange, label }: { checked: boolean; onChange: (next: boolean) => void; label: string }) {
  return (
    <div className="ad-sakelar">
      <span className="ad-sakelar-status">{checked ? 'Aktif' : 'Nonaktif'}</span>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

/**
 * Penggeser dengan angka di sebelahnya. Nilai sama dengan bawaan ditandai titik
 * agar admin tahu mana yang masih orisinal dan bisa mengembalikannya sekali klik.
 */
export function Geser({
  label,
  petunjuk,
  min,
  max,
  step = 1,
  value,
  bawaan,
  satuan = '',
  onChange,
}: {
  label: string;
  petunjuk?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  bawaan: number;
  satuan?: string;
  onChange: (next: number) => void;
}) {
  const sama = Math.abs(value - bawaan) < 1e-6;
  return (
    <Baris label={label} petunjuk={petunjuk}>
      <div className="ad-geser">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          aria-label={label}
        />
        <label className="ad-angka">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={e => onChange(Number(e.target.value))}
            aria-label={`${label} dalam angka`}
          />
          {satuan && <span>{satuan}</span>}
        </label>
        <button
          type="button"
          className="ad-reset"
          title={sama ? 'Sudah berupa bawaan' : `Kembalikan ke ${bawaan}${satuan ? ` ${satuan}` : ''}`}
          aria-label={`Kembalikan ${label} ke bawaan`}
          disabled={sama}
          onClick={() => onChange(bawaan)}
        >
          <RotateCcw className="size-3.5" />
        </button>
      </div>
    </Baris>
  );
}

export function Pilihan<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; petunjuk?: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className="ad-pilihan" role="group">
      {options.map(o => (
        <button key={o.value} type="button" title={o.petunjuk} data-active={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Isian({
  label,
  petunjuk,
  value,
  onChange,
  jenis = 'teks',
  max = 240,
  placeholder,
}: {
  label: string;
  petunjuk?: string;
  value: string;
  onChange: (next: string) => void;
  jenis?: 'teks' | 'uraian' | 'warna' | 'alamat';
  max?: number;
  placeholder?: string;
}) {
  return (
    <Baris label={label} petunjuk={petunjuk} lebar={jenis === 'uraian' ? 'lebar' : undefined}>
      {jenis === 'uraian' ? (
        <textarea maxLength={max} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
      ) : jenis === 'warna' ? (
        <span className="ad-warna">
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#38bdf8'}
            onChange={e => onChange(e.target.value)}
            aria-label={label}
          />
          <code>{value || '—'}</code>
        </span>
      ) : (
        <input
          type="text"
          inputMode={jenis === 'alamat' ? 'url' : undefined}
          maxLength={max}
          value={value}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
        />
      )}
    </Baris>
  );
}

/**
 * Keping jenis huruf: setiap nama ditulis dengan huruf itu sendiri, jadi admin
 * memilih dari contoh, bukan dari daftar teks datar.
 */
export function FontKeping({
  value,
  contoh,
  disabled,
  onChange,
}: {
  value: string;
  contoh: string;
  disabled?: boolean;
  onChange: (next: string) => void;
}) {
  const tumpukan = FONT_OPTIONS.find(f => f.name === value)?.stack;
  return (
    <Baris
      label="Jenis huruf"
      petunjuk="Tulisan besar di atas memakai huruf terpilih. Muatannya sudah disiapkan di halaman."
      lebar="lebar"
    >
      <span className="ad-font">
        <span className="ad-font-contoh" style={tumpukan ? { fontFamily: tumpukan } : undefined}>
          {contoh.slice(0, 34) || 'Abc'}
        </span>
        {FONT_GROUPS.map(g => (
          <span key={g.kelompok} className="ad-font-kel">
            <b>{g.kelompok}</b>
            <span className="ad-font-kisi">
              {g.opsi.map(f => (
                <button
                  key={f.name}
                  type="button"
                  title={f.name}
                  data-active={value === f.name}
                  disabled={disabled}
                  style={{ fontFamily: f.stack }}
                  onClick={() => onChange(value === f.name ? '' : f.name)}
                >
                  {f.name}
                </button>
              ))}
            </span>
          </span>
        ))}
        {value && (
          <Button variant="ghost" size="sm" disabled={disabled} onClick={() => onChange('')}>
            <Ban className="size-3.5" />
            Ikut font tema
          </Button>
        )}
      </span>
    </Baris>
  );
}