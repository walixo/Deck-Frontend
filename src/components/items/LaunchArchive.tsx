import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { request } from '@/lib/api';
import { cn, formatNumber } from '@/lib/utils';

interface ArchiveDay {
  date: string;
  launches: number;
}
interface ArchiveMonth {
  month: string;
  launches: number;
  days: ArchiveDay[];
}
interface ArchiveYear {
  year: string;
  launches: number;
  months: ArchiveMonth[];
}
interface Archive {
  total: number;
  years: ArchiveYear[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Every day Deck has had launches, as a rail you can walk backwards through.
 *
 * Cascading rather than flat: years, then months inside a year, then days
 * inside a month. A board that has been running for two years is seven hundred
 * dates, and a flat list of seven hundred dates is not navigation.
 *
 * The three levels are the same filter at three depths — `2026`, `2026-08`,
 * `2026-08-15` — so clicking any of them scopes the list, and clicking a year
 * shows that whole year rather than making somebody drill to a day before
 * anything happens.
 */
export function LaunchArchive({
  value,
  onPick,
  className,
}: {
  value: string;
  onPick: (on: string) => void;
  className?: string;
}) {
  const { data } = useQuery({
    queryKey: ['launch-archive'],
    queryFn: () => request<Archive>('get', '/leaderboard/archive'),
    /* The archive only changes when a launch is posted, and a reader browsing
       last March does not need to know that within the minute. */
    staleTime: 10 * 60 * 1000,
  });

  /* Open the branch containing the current selection, so arriving on a
     scoped URL shows where you are rather than a collapsed rail. */
  const [openYear, setOpenYear] = useState<string | null>(value.slice(0, 4) || null);
  const [openMonth, setOpenMonth] = useState<string | null>(
    value.length >= 7 ? value.slice(0, 7) : null,
  );

  if (!data || data.years.length === 0) return null;

  return (
    <nav aria-label="Launch archive" className={cn('text-sm', className)}>
      <div className="flex items-baseline justify-between gap-2 border-b border-edge pb-2">
        <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.1em]">Archive</h2>
        <span className="font-mono text-[10px] tabular-nums text-muted">
          {formatNumber(data.total)}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onPick('')}
        aria-current={value === '' || undefined}
        className={cn(
          'mt-2 w-full px-1.5 py-1 text-left font-mono text-[11px] font-bold uppercase tracking-[0.06em] transition-colors duration-[120ms]',
          value === '' ? 'bg-pop text-on-pop' : 'text-muted hover:bg-surface-2 hover:text-body',
        )}
      >
        All time
      </button>

      <ul className="mt-1 space-y-0.5">
        {data.years.map((year) => {
          const yearOpen = openYear === year.year;

          return (
            <li key={year.year}>
              <Row
                label={year.year}
                count={year.launches}
                depth={0}
                expanded={yearOpen}
                selected={value === year.year}
                onToggle={() => setOpenYear(yearOpen ? null : year.year)}
                onSelect={() => onPick(year.year)}
              />

              {yearOpen && (
                <ul className="mt-0.5 space-y-0.5">
                  {year.months.map((month) => {
                    const key = `${year.year}-${month.month}`;
                    const monthOpen = openMonth === key;

                    return (
                      <li key={key}>
                        <Row
                          label={MONTH_NAMES[Number(month.month) - 1] ?? month.month}
                          count={month.launches}
                          depth={1}
                          expanded={monthOpen}
                          selected={value === key}
                          onToggle={() => setOpenMonth(monthOpen ? null : key)}
                          onSelect={() => onPick(key)}
                        />

                        {monthOpen && (
                          <ul className="mt-0.5 space-y-0.5">
                            {month.days.map((day) => (
                              <li key={day.date}>
                                <Row
                                  /* Day number alone — the month is the row
                                     above and repeating it is noise. */
                                  label={String(Number(day.date.slice(8, 10)))}
                                  count={day.launches}
                                  depth={2}
                                  selected={value === day.date}
                                  onSelect={() => onPick(day.date)}
                                />
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * One rail row.
 *
 * Where a row has children it is two controls, not one: the label scopes the
 * list, the chevron opens the level below. Collapsing those into a single
 * button would mean you could not look at a whole year without first opening
 * it, or open a year without also navigating to it.
 */
function Row({
  label,
  count,
  depth,
  expanded,
  selected,
  onToggle,
  onSelect,
}: {
  label: string;
  count: number;
  depth: 0 | 1 | 2;
  expanded?: boolean;
  selected: boolean;
  onToggle?: () => void;
  onSelect: () => void;
}) {
  const indent = ['pl-1.5', 'pl-4', 'pl-7'][depth];

  return (
    <div className="flex items-stretch">
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected || undefined}
        className={cn(
          'flex min-w-0 flex-1 items-baseline gap-2 py-1 pr-1.5 text-left transition-colors duration-[120ms]',
          indent,
          depth === 0
            ? 'font-mono text-[11px] font-bold uppercase tracking-[0.06em]'
            : 'font-mono text-[11px]',
          selected ? 'bg-pop text-on-pop' : 'text-muted hover:bg-surface-2 hover:text-body',
        )}
      >
        <span className="truncate">{label}</span>
        <span className="ml-auto shrink-0 tabular-nums opacity-60">{count}</span>
      </button>

      {onToggle && (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${label}`}
          className="flex w-6 shrink-0 items-center justify-center text-muted transition-colors duration-[120ms] hover:bg-surface-2 hover:text-body"
        >
          <span
            aria-hidden="true"
            className={cn(
              'text-[8px] leading-none transition-transform duration-[140ms]',
              expanded && 'rotate-90',
            )}
          >
            ▶
          </span>
        </button>
      )}
    </div>
  );
}
