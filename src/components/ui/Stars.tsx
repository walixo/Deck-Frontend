import { cn } from '@/lib/utils';

interface StarsProps {
  value: number;
  size?: 'sm' | 'md';
  className?: string;
}

/** Read-only rating display; supports halves via a clipped overlay. */
export function Stars({ value, size = 'sm', className }: StarsProps) {
  const dimension = size === 'sm' ? 'text-sm' : 'text-lg';
  const percentage = Math.max(0, Math.min(100, (value / 5) * 100));

  return (
    <span
      className={cn('relative inline-block leading-none', dimension, className)}
      role="img"
      aria-label={`${value.toFixed(1)} out of 5 stars`}
    >
      <span className="text-zinc-300 dark:text-zinc-700">★★★★★</span>
      <span
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden text-amber-400"
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

/** Interactive star input — keyboard accessible via radio semantics. */
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
            'rounded text-2xl leading-none transition-all duration-150 hover:scale-110',
            star <= value ? 'text-amber-400' : 'text-zinc-300 hover:text-amber-300 dark:text-zinc-700',
          )}
        >
          ★
        </button>
      ))}
      {value > 0 && (
        <button
          type="button"
          onClick={() => onChange(0)}
          className="ml-2 text-xs text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          Clear
        </button>
      )}
    </div>
  );
}
