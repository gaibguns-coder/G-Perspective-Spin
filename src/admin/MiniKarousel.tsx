import { useEffect, useRef, type CSSProperties } from 'react';
import type { Motion } from '@/lib/settings';
import { advanceRotation, radiusRing, tileOpacity } from '@/lib/motion';
import './mini.css';

const KURANGI_GERAK = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Miniatur kincin yang memakai fungsi gerak yang sama dengan halaman depan, supaya
 * angka yang digeser admin langsung terlihat hasilnya tanpa membuka tab lain.
 */
export function MiniKarousel({ motion, slot = 8 }: { motion: Motion; slot?: number }) {
  const ring = useRef<HTMLDivElement>(null);
  const angle = useRef(0);
  const tegak = motion.orientation === 'vertical';
  const sumbu = tegak ? 'rotateX' : 'rotateY';
  const jarak = radiusRing(slot, motion.radiusPct) * 0.34;

  useEffect(() => {
    if (KURANGI_GERAK) return;
    let raf = 0;
    let last = 0;
    const frame = (t: number) => {
      const dt = last ? (t - last) / 1000 : 0;
      last = t;
      angle.current = advanceRotation(
        angle.current,
        dt,
        motion.speed,
        motion.direction,
        motion.autoplay ? 1 : 0,
        motion.degPerSec,
      );
      if (ring.current) {
        ring.current.style.transform = `${sumbu}(${angle.current}deg)`;
        const kartu = ring.current.children;
        for (let i = 0; i < kartu.length; i++) {
          const sudut = (i * 360) / slot + angle.current;
          (kartu[i] as HTMLElement).style.opacity = Math.min(1, tileOpacity(sudut, motion.fadePct)).toFixed(2);
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [sumbu, slot, motion.speed, motion.direction, motion.autoplay, motion.degPerSec, motion.fadePct]);

  return (
    <div
      className="ad-mini"
      style={{ '--tilik': `${-motion.viewAngle}deg`, '--kedalaman': `${motion.perspective / 6}px` } as CSSProperties}
      aria-hidden="true"
    >
      <div className={`ad-mini-orbit${tegak ? ' is-tegak' : ''}`}>
        <div ref={ring} className="ad-mini-ring">
          {Array.from({ length: slot }, (_, i) => (
            <div
              key={i}
              className="ad-mini-kartu"
              style={{ transform: `${sumbu}(${(i * 360) / slot}deg) translateZ(${jarak}px)` }}
            />
          ))}
        </div>
      </div>
      {KURANGI_GERAK && <span className="ad-mini-catat">Pratinjau diam: peranti meminta gerak minimal.</span>}
    </div>
  );
}
