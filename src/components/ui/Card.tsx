import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Adds the lift-toward-the-shadow hover. Use for cards that are links. */
  interactive?: boolean;
}

export function Card({ children, className, interactive = false }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-slab border-2 border-edge bg-surface shadow-hard',
        interactive &&
          'transition-[transform,box-shadow] duration-[120ms] ease-[var(--ease-snap)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg',
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
          <p className="mb-3 inline-block border-2 border-edge bg-acid px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-ink">
            {eyebrow}
          </p>
        )}
        <h2 className="display-tight text-2xl uppercase text-balance sm:text-3xl">{title}</h2>
        {description && (
          <p className="mt-2.5 text-sm leading-relaxed text-muted text-pretty">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
