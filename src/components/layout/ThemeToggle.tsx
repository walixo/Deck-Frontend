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
        'relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 text-zinc-600 transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 active:scale-95 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-white',
        className,
      )}
    >
      {/* Both glyphs are mounted; they cross-fade and rotate on toggle. */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute text-base transition-all duration-500',
          isDark ? 'translate-y-6 rotate-90 opacity-0' : 'translate-y-0 rotate-0 opacity-100',
        )}
      >
        ☀
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'absolute text-base transition-all duration-500',
          isDark ? 'translate-y-0 rotate-0 opacity-100' : '-translate-y-6 -rotate-90 opacity-0',
        )}
      >
        ☾
      </span>
    </button>
  );
}
