import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={cn(
        'relative flex size-9 items-center justify-center overflow-hidden rounded-slab border-2 border-edge bg-surface text-body shadow-hard-sm',
        'transition-[transform,box-shadow,background-color] duration-[120ms] ease-[var(--ease-snap)]',
        'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-acid hover:text-ink hover:shadow-hard',
        'active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
        className,
      )}
    >
      {/* Both glyphs mounted; they slide past each other on toggle. */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute text-sm transition-transform duration-[160ms] ease-[var(--ease-snap)]',
          isDark ? 'translate-y-7' : 'translate-y-0',
        )}
      >
        ☀
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'absolute text-sm transition-transform duration-[160ms] ease-[var(--ease-snap)]',
          isDark ? 'translate-y-0' : '-translate-y-7',
        )}
      >
        ☾
      </span>
    </button>
  );
}
