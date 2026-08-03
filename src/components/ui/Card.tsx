import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}

export function Card({ children, className, interactive = false }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-zinc-200/80 bg-white shadow-[var(--shadow-soft)]',
        'dark:border-zinc-800 dark:bg-[color:var(--color-surface-dark)]',
        interactive &&
          'transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[var(--shadow-lifted)] dark:hover:border-zinc-700',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-400">
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl font-semibold text-balance sm:text-3xl">{title}</h2>
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 text-pretty dark:text-zinc-400">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
