import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';

/**
 * Form furniture for Deck Games: soft, rounded, quiet. The launch board's
 * slab inputs would look like a different product in here, which is the
 * point — but the behaviour (labels, hints, errors, focus rings) is the same
 * standard as the rest of Deck.
 */

type Tone = 'ember' | 'ink' | 'ghost' | 'danger';

export const GButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; loading?: boolean; small?: boolean }
>(function GButton(
  { tone = 'ember', loading, small, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-mono font-semibold uppercase transition-[filter,background-color,color,transform] duration-300 ease-glide active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
        small
          ? 'px-3 py-1.5 text-[9px] tracking-[0.14em]'
          : 'px-4 py-2.5 text-[10px] tracking-[0.16em]',
        tone === 'ember' && 'glass-primary',
        tone === 'ink' && 'glass-ink',
        tone === 'ghost' && 'glass-secondary',
        tone === 'danger' && 'border border-danger/40 text-danger hover:bg-danger hover:text-white',
        className,
      )}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-3 animate-spin rounded-full border border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
});

const control =
  'w-full rounded-xl border border-g-line bg-g-paper px-3.5 py-2.5 text-[14px] text-g-ink placeholder:text-g-mute/70 outline-none transition-[border-color,box-shadow] duration-300 focus:border-g-ink focus:ring-4 focus:ring-g-ember/15';

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium tracking-[-0.01em]">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-[12px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[12px] leading-relaxed text-g-mute">{hint}</p>
      ) : null}
    </div>
  );
}

export function GInput({
  label,
  hint,
  error,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: ReactNode; error?: string }) {
  const id = useId();
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        aria-invalid={Boolean(error) || undefined}
        className={cn(control, className)}
        {...rest}
      />
    </Field>
  );
}

export function GTextarea({
  label,
  hint,
  error,
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: ReactNode;
  error?: string;
}) {
  const id = useId();
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <textarea
        id={id}
        aria-invalid={Boolean(error) || undefined}
        className={cn(control, 'min-h-28', className)}
        {...rest}
      />
    </Field>
  );
}

export function GSelect({
  label,
  hint,
  error,
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: ReactNode; error?: string }) {
  const id = useId();
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <select id={id} className={cn(control, 'appearance-none', className)} {...rest}>
        {children}
      </select>
    </Field>
  );
}

export function GCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-3xl border border-g-line bg-g-paper p-5 sm:p-7', className)}>
      {children}
    </div>
  );
}

export function GNotice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'error' | 'success';
  children: ReactNode;
}) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-2xl px-4 py-3 text-[13px] leading-relaxed',
        tone === 'info' && 'bg-g-paper-2 text-g-ink',
        tone === 'error' && 'bg-danger/10 text-danger',
        tone === 'success' && 'bg-success/10 text-success',
      )}
    >
      {children}
    </div>
  );
}

/** A secret shown once, with a copy button and a plain warning. */
export function SecretReveal({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-2xl border border-g-ember/40 bg-g-ember/5 p-4">
      <p className="text-[13px] font-medium">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg bg-g-paper px-3 py-2 font-mono text-[12px]">
          {value}
        </code>
        <GButton
          small
          tone="ink"
          onClick={() => {
            void navigator.clipboard?.writeText(value).then(() => setCopied(true));
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </GButton>
      </div>
      <p className="mt-2 text-[12px] text-g-mute">
        This is the only time it will be shown. Keep it on your server — never in game code a player
        can download.
      </p>
    </div>
  );
}

/** A native modal dialog, opened while `open` is true. */
export function GDialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="m-auto w-[min(92vw,30rem)] rounded-3xl border border-g-line bg-g-paper p-0 text-g-ink shadow-[0_40px_100px_-30px_rgb(0_0_0/0.5)] backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-medium tracking-[-0.03em]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-g-mute hover:text-g-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </dialog>
  );
}

export function StatusDot({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  const label = { pending: 'In review', approved: 'Live', rejected: 'Not approved' }[status];
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-g-mute">
      <span
        aria-hidden="true"
        className={cn(
          'size-1.5 rounded-full',
          status === 'approved' && 'bg-success shadow-[0_0_8px_1px] shadow-success/60',
          status === 'pending' && 'bg-warning',
          status === 'rejected' && 'bg-danger',
        )}
      />
      {label}
    </span>
  );
}
