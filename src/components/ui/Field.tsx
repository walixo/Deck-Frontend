import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';

/*
 * Inputs are inset blocks: 2px edge, no radius softening, and an inner hard
 * shadow so the field reads as a cut-out rather than a raised surface. On focus
 * the edge turns the accent colour and the inset shadow snaps off.
 */
const CONTROL =
  'w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[14px] text-body ' +
  'transition-[box-shadow,border-color] duration-300 ease-[var(--ease-snap)] ' +
  'placeholder:text-muted/70 focus:border-edge focus:outline-none focus:ring-4 focus:ring-accent/15';

// Invalid fields take the danger edge; the message below says what to fix.
const INVALID = 'border-danger/60 focus:border-danger focus:ring-danger/15';

interface FieldShellProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  counter?: ReactNode;
  children: ReactNode;
}

function FieldShell({ label, htmlFor, hint, error, counter, children }: FieldShellProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[13px] font-medium tracking-[-0.01em] text-body">
          {label}
        </label>
        {counter}
      </div>
      {children}
      {error ? (
        <p
          role="alert"
          /* Plain red type, no block: the field's own red edge already says
             where; this says what. Lighter on dark to keep 4.5:1. */
          className="mt-1.5 text-[12px] text-danger dark:text-danger-soft"
        >
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{hint}</p>
      )}
    </div>
  );
}

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string;
  counter?: ReactNode;
}

export function Input({ label, hint, error, counter, className, ...props }: InputProps) {
  const id = useId();
  return (
    <FieldShell label={label} htmlFor={id} hint={hint} error={error} counter={counter}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        className={cn(CONTROL, error && INVALID, className)}
        {...props}
      />
    </FieldShell>
  );
}

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string;
  counter?: ReactNode;
}

export function Textarea({ label, hint, error, counter, className, ...props }: TextareaProps) {
  const id = useId();
  return (
    <FieldShell label={label} htmlFor={id} hint={hint} error={error} counter={counter}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        className={cn(CONTROL, 'min-h-32 resize-y leading-relaxed', error && INVALID, className)}
        {...props}
      />
    </FieldShell>
  );
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, hint, error, options, className, ...props }: SelectProps) {
  const id = useId();
  return (
    <FieldShell label={label} htmlFor={id} hint={hint} error={error}>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        className={cn(
          CONTROL,
          /* The arrow lives in CSS, not here: it is a background-image whose
             fill has to be written out per theme. See `.select-chevron`. */
          'select-chevron cursor-pointer appearance-none pr-9',
          error && INVALID,
          className,
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function CharCount({ value, max }: { value: string; max: number }) {
  const remaining = max - value.length;
  return (
    <span
      className={cn(
        'font-mono text-[11px] font-medium tabular-nums',
        remaining < 0
          ? 'text-danger dark:text-danger-soft'
          : remaining < max * 0.15
            ? 'text-accent'
            : 'text-muted',
      )}
    >
      {value.length}/{max}
    </span>
  );
}
