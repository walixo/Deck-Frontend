import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'accent' | 'outline' | 'muted';

const TONES: Record<Tone, string> = {
  neutral: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  accent:
    'bg-brand-50 text-brand-700 ring-1 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/25',
  outline:
    'ring-1 ring-zinc-200 text-zinc-600 dark:ring-zinc-800 dark:text-zinc-400',
  muted: 'bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500',
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
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
