import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'accent' | 'cobalt' | 'invert' | 'outline';

/* Chips are hard-edged blocks with mono labels — they read as machine values. */
const TONES: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-body',
  accent: 'bg-acid text-ink',
  cobalt: 'bg-cobalt text-white',
  invert: 'bg-edge text-canvas',
  outline: 'bg-transparent text-muted',
};

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border-2 border-edge px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-[0.04em]',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
