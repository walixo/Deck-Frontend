import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface NeoOption {
  value: string;
  label: string;
  /** Shown under the label in the panel. Never in the trigger. */
  hint?: string;
}

interface NeoSelectProps {
  label: string;
  value: string;
  options: NeoOption[];
  onChange: (value: string) => void;
  /** Shown in the trigger when `value` matches no option — e.g. "Any". */
  placeholder?: string;
  /**
   * `pop` for a select that is the point of the screen it is on — a slightly
   * firmer edge. `grey` for the ones that are not. Both are neutral pills: the
   * accent is kept for the one action on a screen that should be pressed.
   */
  tone?: 'pop' | 'grey';
  className?: string;
}

/**
 * A custom select: a rounded pill that opens a soft panel, with the row under
 * the pointer or keyboard marked by a quiet fill.
 *
 * Hand-rolled rather than pulled in, because the published version is a Radix
 * wrapper and Deck has no Radix. Building on the native `<select>` was the other
 * option and is rejected for a specific reason: the popup of a native select is
 * drawn by the operating system and cannot be styled at all, so the one part
 * this is meant to restyle is the one part that would not change.
 *
 * What that costs is the keyboard and dismissal behaviour a native select gets
 * free, so it is implemented here: arrows move the highlight, Enter and Space
 * commit, Escape closes, Home and End jump, and a click anywhere else dismisses.
 */
export function NeoSelect({
  label,
  value,
  options,
  onChange,
  placeholder,
  tone = 'pop',
  className,
}: NeoSelectProps) {
  /* Both tones are neutral pills now; `pop` keeps a slightly firmer edge so a
     primary filter still reads as the one to reach for. */
  const fill = tone === 'grey' ? 'bg-surface text-body' : 'bg-surface text-body border-edge/25';
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  /*
   * Opening starts the highlight on the current choice rather than at the top,
   * so the first arrow press moves relative to where you are.
   *
   * Done here, at the moment of opening, rather than in an effect watching
   * `open`. Setting state synchronously inside an effect makes React render
   * twice for every open — and the rule that flags it is the same one that
   * caught the stale-swatch bug in useDominantColour.
   */
  const openPanel = () => {
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  /* Keeps the highlighted row in view when arrowing past the panel's edge. */
  useEffect(() => {
    if (!open) return;
    listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const commit = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }

    if (!open) {
      /* Down, Up, Enter and Space all open a closed select — the same set the
         native control responds to. */
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        openPanel();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActive((current) => Math.min(current + 1, options.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActive((current) => Math.max(current - 1, 0));
        break;
      case 'Home':
        event.preventDefault();
        setActive(0);
        break;
      case 'End':
        event.preventDefault();
        setActive(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        commit(active);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={rootRef} className={cn('relative', className)} onKeyDown={onKeyDown}>
      <button
        type="button"
        id={`${id}-trigger`}
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-2 rounded-full',
          'border border-line px-3.5',
          fill,
          'font-mono text-[10px] font-medium uppercase tracking-[0.14em]',
          'transition-[border-color] duration-300 ease-[var(--ease-snap)]',
          'hover:border-edge focus-visible:outline-none',
        )}
      >
        <span className="truncate">{selected?.label ?? placeholder ?? label}</span>
        <span
          aria-hidden="true"
          className={cn(
            'shrink-0 text-[9px] leading-none transition-transform duration-300',
            open && 'rotate-180',
          )}
        >
          ▼
        </span>
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          aria-labelledby={`${id}-trigger`}
          tabIndex={-1}
          className={cn(
            'absolute left-0 top-full z-50 mt-1 max-h-80 min-w-full overflow-y-auto',
            'animate-[var(--animate-slam)] rounded-2xl border border-line bg-surface p-1.5 text-body',
            'shadow-hard-lg',
          )}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => commit(index)}
                  onMouseEnter={() => setActive(index)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition-colors duration-200',
                    /* The row under the pointer or keyboard takes a soft fill. */
                    index === active && 'bg-surface-2',
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium tracking-[-0.01em]">
                      {option.label}
                    </span>
                    {option.hint && (
                      <span className="mt-0.5 block truncate text-[11px] normal-case opacity-70">
                        {option.hint}
                      </span>
                    )}
                  </span>

                  {isSelected && (
                    <span aria-hidden="true" className="shrink-0 text-[11px] leading-none">
                      ✓
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
