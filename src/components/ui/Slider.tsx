import { cn } from '@/lib/utils';

export interface SliderProps {
  min: number;
  max: number;
  step: number;
  value: number[];
  onValueChange: (value: number[]) => void;
  className?: string;
  'aria-label'?: string;
}

/** Slider gaya shadcn memakai <input type="range"> asli agar tetap bisa dibuka lewat keyboard. */
export function Slider({ min, max, step, value, onValueChange, className, ...rest }: SliderProps) {
  const current = value[0] ?? min;
  const percent = ((current - min) / (max - min)) * 100;

  return (
    <span className={cn('relative flex h-5 w-full items-center', className)}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 h-1.5 rounded-full bg-primary/20"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 h-1.5 rounded-full bg-primary"
        style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={event => onValueChange([Number(event.target.value)])}
        className="spin-range relative z-10 w-full"
        {...rest}
      />
    </span>
  );
}
