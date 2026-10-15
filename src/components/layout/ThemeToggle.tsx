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
        'relative flex size-9 items-center justify-center overflow-hidden rounded-full border border-line bg-surface text-body',
        'transition-[border-color] duration-300 ease-[var(--ease-snap)] hover:border-edge',
        className,
      )}
    >
      {/* Both glyphs mounted; they slide past each other on toggle. */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute text-sm transition-transform duration-300 ease-[var(--ease-snap)]',
          isDark ? 'translate-y-7' : 'translate-y-0',
        )}
      >
        ☀
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'absolute text-sm transition-transform duration-300 ease-[var(--ease-snap)]',
          isDark ? 'translate-y-0' : '-translate-y-7',
        )}
      >
        ☾
      </span>
    </button>
  );
}
