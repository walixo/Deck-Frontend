import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'pop' | 'deep' | 'invert' | 'outline';

/* Chips are soft pills with mono labels — they read as machine values. */
const TONES: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-body',
  pop: 'bg-pop text-on-pop',
  deep: 'bg-deep text-on-deep',
  invert: 'bg-edge text-canvas',
  outline: 'border border-line bg-transparent text-muted',
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
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em]',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
