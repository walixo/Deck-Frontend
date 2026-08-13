import type { ReactNode } from 'react';
import { EmptyDeckIllustration } from '@/components/illustrations/Illustrations';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  /** An illustration from `components/illustrations`. Defaults to the empty deck. */
  illustration?: ReactNode;
}

export function EmptyState({ title, description, action, illustration }: EmptyStateProps) {
  return (
    <div className="relative overflow-hidden rounded-slab border-2 border-dashed border-edge px-6 py-12 text-center">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-halftone text-edge opacity-[0.06]" />

      {/* Sized by its widest child (the title), so the narrower art still centres. */}
      <div className="relative flex flex-col items-center">
        {illustration ?? <EmptyDeckIllustration />}
        <h3 className="mt-3 text-lg uppercase">{title}</h3>
        {description && (
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted text-pretty">{description}</p>
        )}
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-slab border-2 border-edge bg-edge px-6 py-9 text-center shadow-hard">
      <span
        aria-hidden="true"
        className="mx-auto mb-3 flex size-12 items-center justify-center border-2 border-canvas bg-canvas font-display text-2xl text-edge"
      >
        !
      </span>
      <h3 className="text-lg uppercase text-canvas">That did not load</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-canvas/90 text-pretty">
        {message ?? 'Something went wrong while fetching this.'}
      </p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function InlineAlert({
  children,
  tone = 'error',
}: {
  children: ReactNode;
  tone?: 'error' | 'success';
}) {
  const styles = tone === 'error' ? 'bg-edge text-canvas' : 'bg-acid text-ink';

  return (
    <div
      role="alert"
      className={`rounded-slab border-2 border-edge px-4 py-3 text-sm font-medium shadow-hard-sm ${styles}`}
    >
      {children}
    </div>
  );
}
