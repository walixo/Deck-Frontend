import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const CONTROL =
  'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 ' +
  'border-zinc-200 hover:border-zinc-300 focus:border-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-900/5 ' +
  'dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:border-zinc-700 ' +
  'dark:focus:border-zinc-600 dark:focus:ring-white/5';

const INVALID =
  'border-red-400 focus:border-red-500 focus:ring-red-500/10 dark:border-red-800 dark:focus:border-red-700';

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
        <label htmlFor={htmlFor} className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {label}
        </label>
        {counter}
      </div>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-500">{hint}</p>
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
        className={cn(CONTROL, 'cursor-pointer appearance-none pr-9', error && INVALID, className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%2371717a'%3E%3Cpath d='M4.2 6.2 8 10l3.8-3.8Z'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.75rem center',
          backgroundSize: '1rem',
        }}
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
        'text-xs tabular-nums',
        remaining < 0
          ? 'text-red-600 dark:text-red-400'
          : remaining < max * 0.15
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-zinc-400 dark:text-zinc-600',
      )}
    >
      {value.length}/{max}
    </span>
  );
}
