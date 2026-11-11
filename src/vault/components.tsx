import { CheckIcon, ClipboardIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { VaultMode } from './useVault';

/** A titled block. Every dashboard section is one, so they all sit the same. */
export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-3xl border border-line bg-surface', className)}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <h2 className="display-tight text-base">{title}</h2>
          {description && (
            <p className="mt-1 text-xs leading-relaxed text-muted text-pretty">{description}</p>
          )}
        </div>
        {action}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

/**
 * A state, as a word plus a colour — never a colour alone.
 *
 * Contract rule 5: remove the hue and the state still has to read, so the
 * label is the chip. Only the three semantic status colours are used, and
 * every other state is neutral.
 */
export function StatusChip({ status }: { status: string }) {
  const tone =
    status === 'live' || status === 'fulfilled' || status === 'paid' || status === 'active'
      ? 'border-success/40 bg-success/10 text-success'
      : status === 'failed' || status === 'suspended' || status === 'rejected' || status === 'void'
        ? 'border-danger/40 bg-danger/10 text-danger'
        : status === 'pending' || status === 'draft'
          ? 'border-warning/50 bg-warning/15 text-body'
          : 'border-line bg-surface-2 text-muted';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em]',
        tone,
      )}
    >
      {status}
    </span>
  );
}

/** Test / live, as an ink pill pair. */
export function ModeSwitch({
  mode,
  onChange,
}: {
  mode: VaultMode;
  onChange: (mode: VaultMode) => void;
}) {
  return (
    <div
      className="inline-flex rounded-full border border-line p-0.5"
      role="group"
      aria-label="Environment"
    >
      {(['test', 'live'] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={mode === option}
          className={cn(
            'rounded-full px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.08em] transition-colors',
            mode === option ? 'bg-deep text-on-deep' : 'text-muted hover:text-body',
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

/**
 * A secret, shown once.
 *
 * The copy button matters more than it looks: a key that has to be selected by
 * hand off a screen is a key somebody will truncate, and the whole reason it
 * is shown exactly once is that Vault cannot reprint it.
 */
export function SecretReveal({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Clipboard refused — the value is on screen to select by hand. */
    }
  };

  return (
    <div className="rounded-2xl border border-warning/50 bg-warning/10 p-4">
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-body">
        {label} — copy it now
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        This is the only time it is shown. Vault stores a hash, so it cannot be
        displayed again — losing it means minting a new one.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-xl border border-line bg-surface px-3 py-2 font-mono text-xs">
          {value}
        </code>
        <Button type="button" size="sm" variant="secondary" onClick={copy}>
          {copied ? (
            <>
              <CheckIcon aria-hidden="true" className="size-3.5" /> Copied
            </>
          ) : (
            <>
              <ClipboardIcon aria-hidden="true" className="size-3.5" /> Copy
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/** A code the owner may see, hidden until they ask. */
export function RevealButton({
  onReveal,
  revealed,
  pending,
}: {
  onReveal: () => void;
  revealed: { code: string; pin: string | null } | null;
  pending: boolean;
}) {
  if (revealed) {
    return (
      <div className="font-mono text-sm">
        <span className="select-all">{revealed.code}</span>
        {revealed.pin && (
          <span className="ml-3 text-muted">
            PIN <span className="select-all text-body">{revealed.pin}</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <Button type="button" size="sm" variant="secondary" onClick={onReveal} loading={pending}>
      <EyeIcon aria-hidden="true" className="size-3.5" /> Show code
    </Button>
  );
}

/** A plain definition row, for the many small key/value lists in here. */
export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <dt className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted">{label}</dt>
      <dd className="text-right text-sm tabular-nums">{children}</dd>
    </div>
  );
}
