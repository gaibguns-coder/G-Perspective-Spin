import { useEffect, useRef } from 'react';
import { colorThemes, paletteColors, type ColorThemeKey } from './Gallery';

interface CorridorProps {
  theme?: 'light' | 'dark';
  colorTheme?: ColorThemeKey;
}

const FRAME_INTERVAL = 1000 / 30;
const SPEED_PER_FRAME = 0.003;
const NUM_RAYS = 56;
const NUM_SLICES = 28;

export function PerspectiveCorridor({ theme = 'dark', colorTheme = 'cyan' }: CorridorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let rafId = 0;
    let lastFrameTime = 0;
    let zOffset = 0;
    let width = 0;
    let height = 0;
    let isVisible = true;
    let isRunning = false;

    const isDark = theme === 'dark';
    const palette = colorThemes[colorTheme] ?? colorThemes.cyan;
    const { line, glow } = paletteColors(colorTheme, isDark);

    // Di latar terang garis dan glow perlu alpha supaya 56 sinar tidak menumpuk jadi blok warna.
    const toRgba = (hex: string, alpha: number) => {
      const nilai = parseInt(hex.slice(1), 16);
      return `rgba(${(nilai >> 16) & 255}, ${(nilai >> 8) & 255}, ${nilai & 255}, ${alpha})`;
    };

    const colors = {
      bg: isDark ? palette.bg : '#f8fafc',
      wall: isDark ? palette.wall : 'rgba(241, 245, 249, 0.45)',
      line: isDark ? line : toRgba(line, 0.5),
      glow: isDark ? glow : toRgba(glow, 0.4),
    };

    let radialGradient: CanvasGradient | null = null;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      width = rect.width;
      height = rect.height;

      // Resolusi internal dibatasi agar kanvas tidak membebani perangkat kelas bawah.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const pixelWidth = Math.round(width * dpr);
      const pixelHeight = Math.round(height * dpr);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      radialGradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        2,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.45,
      );
      radialGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      radialGradient.addColorStop(1, colors.line);
    };

    const render = (timestamp: number) => {
      if (!isRunning || !isVisible) return;
      rafId = requestAnimationFrame(render);

      if (!lastFrameTime) lastFrameTime = timestamp;
      const elapsed = timestamp - lastFrameTime;
      if (elapsed < FRAME_INTERVAL) return;

      // Lonjakan setelah tab dibekukan tidak boleh membuat koridor melompat.
      const delta = Math.min(elapsed, 100);
      lastFrameTime = timestamp - (elapsed % FRAME_INTERVAL);

      const vx = width / 2;
      const vy = height / 2;
      zOffset = (zOffset + (SPEED_PER_FRAME * delta) / (1000 / 60)) % 1;

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.shadowBlur = 0;
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);

      // Dinding kiri & kanan.
      ctx.fillStyle = colors.wall;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(vx, vy);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(width, 0);
      ctx.lineTo(vx, vy);
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // Garis perspektif dari titik hilang.
      ctx.strokeStyle = radialGradient ?? colors.line;
      ctx.lineWidth = 1;
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = isDark ? 4 : 3;

      const rayLength = Math.max(width, height) * 1.5;
      ctx.beginPath();
      for (let i = 0; i <= NUM_RAYS; i++) {
        const angle = (i / NUM_RAYS) * Math.PI * 2;
        ctx.moveTo(vx, vy);
        ctx.lineTo(vx + Math.cos(angle) * rayLength, vy + Math.sin(angle) * rayLength);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Bingkai kedalaman yang bergerak ke arah penonton.
      ctx.strokeStyle = colors.line;
      for (let i = 0; i < NUM_SLICES; i++) {
        const z = ((i - zOffset + NUM_SLICES) % NUM_SLICES) / NUM_SLICES;
        const scale = Math.pow(z, 2.2) * 1.6;
        if (scale <= 0.001) continue;

        const alpha = 0.1 + Math.pow(z, 2) * 0.9;
        const boxW = width * scale;
        const boxH = height * scale;

        ctx.globalAlpha = alpha;
        ctx.strokeRect(vx - boxW / 2, vy - boxH / 2, boxW, boxH);
      }
      ctx.globalAlpha = 1;
    };

    const start = () => {
      if (isRunning || !isVisible || document.hidden) return;
      isRunning = true;
      lastFrameTime = 0;
      rafId = requestAnimationFrame(render);
    };

    const stop = () => {
      isRunning = false;
      cancelAnimationFrame(rafId);
    };

    const handleVisibility = () => (document.hidden ? stop() : start());
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = Boolean(entry?.isIntersecting);
      if (isVisible) start();
      else stop();
    });

    resize();
    observer.observe(canvas);

    const resizeObserver = new ResizeObserver(resize);
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

    document.addEventListener('visibilitychange', handleVisibility);
    start();

    return () => {
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [theme, colorTheme]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      style={{ display: 'block' }}
    />
  );
}
