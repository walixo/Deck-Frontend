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
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-zinc-300 px-6 py-14 text-center dark:border-zinc-800">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-halo opacity-60 dark:bg-halo-dark dark:opacity-80"
      />
      {/* This wrapper is sized by its widest child (the title), so it centers its
          own contents rather than letting the narrower illustration sit left. */}
      <div className="relative flex flex-col items-center">
        {illustration ?? <EmptyDeckIllustration />}
        <h3 className="mt-2 text-base font-semibold">{title}</h3>
        {description && (
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-zinc-600 text-pretty dark:text-zinc-400">
            {description}
          </p>
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
    <div className="rounded-2xl border border-red-200 bg-red-50/60 px-6 py-10 text-center dark:border-red-900/50 dark:bg-red-950/20">
      <div
        aria-hidden="true"
        className="mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl bg-red-100 text-lg text-red-600 dark:bg-red-900/40 dark:text-red-400"
      >
        !
      </div>
      <h3 className="text-base font-semibold text-red-900 dark:text-red-200">
        That did not load
      </h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-red-700/90 text-pretty dark:text-red-300/80">
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

export function InlineAlert({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'success' }) {
  const styles =
    tone === 'error'
      ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300'
      : 'border-brand-200 bg-brand-50 text-brand-800 dark:border-brand-800/50 dark:bg-brand-950/30 dark:text-brand-300';

  return (
    <div role="alert" className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}
