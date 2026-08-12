import { cn } from '@/lib/utils';

interface StarsProps {
  value: number;
  size?: 'sm' | 'md';
  className?: string;
}

/** Read-only rating; supports halves via a clipped overlay. Coral, not gold. */
export function Stars({ value, size = 'sm', className }: StarsProps) {
  const dimension = size === 'sm' ? 'text-[13px]' : 'text-lg';
  const percentage = Math.max(0, Math.min(100, (value / 5) * 100));

  return (
    <span
      className={cn('relative inline-block leading-none tracking-[-0.06em]', dimension, className)}
      role="img"
      aria-label={`${value.toFixed(1)} out of 5 stars`}
    >
      <span className="text-muted/45">★★★★★</span>
      <span
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden text-coral"
        style={{ width: `${percentage}%` }}
      >
        ★★★★★
      </span>
    </span>
  );
}

interface StarPickerProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

/** Interactive star input — radio semantics, snappy scale on hover. */
export function StarPicker({ value, onChange, className }: StarPickerProps) {
  return (
    <div className={cn('flex items-center gap-1', className)} role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          onClick={() => onChange(value === star ? 0 : star)}
          className={cn(
            'text-2xl leading-none transition-transform duration-[120ms] ease-[var(--ease-kick)] hover:scale-125',
            star <= value ? 'text-coral' : 'text-muted/40 hover:text-coral/60',
          )}
        >
          ★
        </button>
      ))}
      {value > 0 && (
        <button
          type="button"
          onClick={() => onChange(0)}
          className="ml-2 font-mono text-[11px] font-bold uppercase text-muted underline-offset-2 hover:text-body hover:underline"
        >
          Clear
        </button>
      )}
    </div>
  );
}
