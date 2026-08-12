import { cn } from '@/lib/utils';

type Pattern = 'grid' | 'halftone' | 'stripes';

interface BackdropProps {
  pattern?: Pattern;
  /** Flat colour blocks scattered behind the content. */
  blocks?: boolean;
  className?: string;
}

/*
 * Decorative background. The style has no atmosphere — no blur, no glow, no
 * gradient — so depth comes from flat pattern and hard-edged colour blocks
 * instead. Always aria-hidden and non-interactive.
 */
export function Backdrop({ pattern = 'grid', blocks = false, className }: BackdropProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      <div
        className={cn(
          'absolute inset-0 text-edge opacity-[0.07]',
          pattern === 'grid' && 'bg-gridlines',
          pattern === 'halftone' && 'bg-halftone',
          pattern === 'stripes' && 'bg-stripes',
        )}
      />

      {blocks && (
        <>
          {/* Hard-edged shapes, rotated off-axis so they read as deliberate. */}
          <div className="absolute -left-10 top-8 size-28 rotate-12 border-2 border-edge bg-acid" />
          <div className="absolute -right-8 top-24 size-20 -rotate-6 border-2 border-edge bg-cobalt" />
          <div className="absolute bottom-6 left-[18%] size-14 rotate-[24deg] border-2 border-edge bg-coral" />
          <div className="absolute bottom-16 right-[22%] size-10 -rotate-12 border-2 border-edge bg-surface" />
        </>
      )}
    </div>
  );
}

/** Thin banded strip for the top of a page header. */
export function PageBanner({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 overflow-hidden',
        className,
      )}
    >
      <div className="absolute inset-0 bg-halftone text-edge opacity-[0.09]" />
      <div className="absolute inset-x-0 top-0 h-1.5 bg-cobalt" />
    </div>
  );
}
