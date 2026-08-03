import { cn } from '@/lib/utils';

type Variant = 'aurora' | 'halo';

interface AmbientProps {
  variant?: Variant;
  /** Adds slow-floating blobs. Off for page headers, on for full-height scenes. */
  blobs?: boolean;
  /** Overlays a faint grid, masked to fade downward. */
  grid?: boolean;
  className?: string;
}

/**
 * Decorative background layer: a gradient wash plus optional texture and drifting
 * blobs. Purely presentational — always `aria-hidden` and never interactive, so it
 * can be dropped into any `relative` container without affecting focus or layout.
 */
export function Ambient({
  variant = 'aurora',
  blobs = false,
  grid = false,
  className,
}: AmbientProps) {
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div
        className={cn(
          'absolute inset-0',
          variant === 'aurora' ? 'bg-aurora dark:bg-aurora-dark' : 'bg-halo dark:bg-halo-dark',
        )}
      />

      {grid && (
        <div
          className="absolute inset-0 bg-grid text-zinc-900 opacity-[0.035] dark:text-zinc-100 dark:opacity-[0.07]"
          style={{ maskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, black, transparent)' }}
        />
      )}

      {blobs && (
        <>
          <div className="absolute -left-24 -top-32 size-80 animate-[var(--animate-float)] rounded-full bg-gradient-to-br from-brand-300/40 to-brand-500/20 blur-3xl dark:from-brand-500/20 dark:to-brand-700/10" />
          <div
            className="absolute -right-20 top-16 size-72 animate-[var(--animate-float)] rounded-full bg-gradient-to-br from-zinc-300/50 to-zinc-500/20 blur-3xl dark:from-zinc-700/40 dark:to-zinc-900/20"
            style={{ animationDelay: '2.5s' }}
          />
        </>
      )}

      {/* Grain sits on top of everything so it breaks up gradient banding. */}
      <div className="absolute inset-0 bg-grain opacity-[0.15] mix-blend-overlay dark:opacity-[0.2]" />
    </div>
  );
}

/**
 * Soft gradient wash for the top of a page header, fading into the page.
 * Thinner and calmer than `Ambient` — it should register without being noticed.
 */
export function PageGlow({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden',
        className,
      )}
    >
      <div
        className="absolute inset-0 bg-halo dark:bg-halo-dark"
        style={{ maskImage: 'linear-gradient(to bottom, black, transparent)' }}
      />
      <div className="absolute inset-0 bg-grain opacity-[0.12] mix-blend-overlay dark:opacity-[0.18]" />
    </div>
  );
}
