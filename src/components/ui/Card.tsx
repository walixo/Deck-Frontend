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
        'rounded-3xl border border-line bg-surface',
        interactive &&
          'transition-[transform,box-shadow,border-color] duration-500 ease-[var(--ease-snap)] hover:-translate-y-0.5 hover:border-edge/20 hover:shadow-hard-lg',
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
          <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-accent">
            {eyebrow}
          </p>
        )}
        <h2 className="display-tight text-[clamp(1.75rem,3.4vw,2.5rem)] text-balance">{title}</h2>
        {description && (
          <p className="mt-2.5 text-sm leading-relaxed text-muted text-pretty">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
