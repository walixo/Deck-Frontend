import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Adds the lift-toward-the-shadow hover. Use for cards that are links. */
  interactive?: boolean;
}

/*
 * A glass panel: a translucent veil over blur, a hairline edge, and a
 * catch-light along the top so it reads as a pane rather than a painted box.
 *
 * The fill has to be translucent for any of that to mean anything — a blur
 * behind an opaque surface costs compositing and shows nothing. `--glass-fill`
 * is a 5% ink veil, which is close enough to the canvas that body text keeps
 * the contrast it had on `bg-surface`.
 */
export function Card({ children, className, interactive = false }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[24px] border border-[var(--glass-edge)] bg-[var(--glass-fill)] shadow-[var(--glass-sheen)] backdrop-blur-xl',
        interactive &&
          'transition-[transform,box-shadow,border-color,background-color] duration-300 ease-[var(--ease-snap)] ' +
            'hover:-translate-y-1 hover:border-[var(--glass-edge-strong)] hover:bg-[var(--glass-fill-hover)] ' +
            'hover:shadow-[var(--glass-sheen),var(--glass-lift)]',
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
