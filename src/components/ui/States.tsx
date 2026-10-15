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
    <div className="relative overflow-hidden rounded-3xl bg-surface-2 px-6 py-14 text-center">
      {/* Sized by its widest child (the title), so the narrower art still centres. */}
      <div className="relative flex flex-col items-center">
        {illustration ?? <EmptyDeckIllustration />}
        <h3 className="mt-4 text-xl tracking-[-0.03em]">{title}</h3>
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
    <div className="rounded-3xl border border-line bg-surface px-6 py-10 text-center">
      <span
        aria-hidden="true"
        className="mx-auto mb-4 flex size-10 items-center justify-center rounded-full bg-danger/10 font-mono text-base text-danger dark:text-danger-soft"
      >
        !
      </span>
      <h3 className="text-xl tracking-[-0.03em]">That did not load</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted text-pretty">
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
  /* Soft tinted panels: red for a problem, green for done. The words carry the
     meaning; the tint only says which kind. */
  const styles =
    tone === 'error' ? 'bg-danger/10 text-danger dark:text-danger-soft' : 'bg-success/10 text-body';

  return (
    <div role="alert" className={`rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${styles}`}>
      {children}
    </div>
  );
}
