import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Stars } from '@/components/ui/Stars';
import { CATEGORY_LABELS, cn, gradientFor, PRICING_LABELS } from '@/lib/utils';
import type { Item } from '@/types';
import { ItemLogo } from './ItemLogo';
import { VoteButton } from './VoteButton';

const AUTOPLAY_MS = 6500;

interface SpotlightSliderProps {
  items: Item[];
  isLoading?: boolean;
}

export function SpotlightSlider({ items, isLoading = false }: SpotlightSliderProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);

  const total = items.length;

  const goTo = useCallback(
    (next: number) => {
      if (total === 0) return;
      setIndex(((next % total) + total) % total);
    },
    [total],
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const previous = useCallback(() => goTo(index - 1), [goTo, index]);

  // Autoplay, paused on hover, focus, or when the tab is hidden.
  useEffect(() => {
    if (paused || total <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % total);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused, total]);

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      next();
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      previous();
    }
  };

  if (isLoading) {
    return <Skeleton className="h-80 w-full rounded-3xl sm:h-72" />;
  }

  if (total === 0) return null;

  const active = items[index];

  return (
    <div
      ref={regionRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Spotlighted launches"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="group relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-[var(--shadow-soft)] dark:border-zinc-800 dark:bg-[color:var(--color-surface-dark)]"
    >
      {/* Ambient wash keyed to the active item, so the panel shifts colour as it rotates. */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-gradient-to-br opacity-20 blur-3xl transition-all duration-1000 dark:opacity-25',
          gradientFor(active.slug),
        )}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent"
      />

      <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
        <div key={active.id} className="animate-[var(--animate-fade-up)]">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge tone="accent">
              <span aria-hidden="true" className="mr-0.5">
                ✦
              </span>
              Spotlight
            </Badge>
            <Badge tone="outline">{CATEGORY_LABELS[active.category]}</Badge>
            <Badge tone="muted">{PRICING_LABELS[active.pricing]}</Badge>
          </div>

          <div className="flex items-start gap-4">
            <ItemLogo item={active} size="lg" />
            <div className="min-w-0">
              <h3 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                <Link
                  to={`/item/${active.slug}`}
                  className="underline-offset-4 transition-colors hover:text-brand-600 hover:underline dark:hover:text-brand-400"
                >
                  {active.name}
                </Link>
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600 text-pretty sm:text-base dark:text-zinc-400">
                {active.tagline}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <VoteButton item={active} layout="inline" />

            {active.reviewCount > 0 && (
              <span className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <Stars value={active.ratingAvg} size="md" />
                <span className="tabular-nums">
                  {active.ratingAvg.toFixed(1)} · {active.reviewCount}{' '}
                  {active.reviewCount === 1 ? 'review' : 'reviews'}
                </span>
              </span>
            )}

            <Link
              to={`/item/${active.slug}`}
              className="text-sm font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
            >
              Read more →
            </Link>
          </div>
        </div>

        {/* Stacked preview of the upcoming items — clickable, and doubles as depth. */}
        <div className="hidden lg:flex lg:flex-col lg:gap-2">
          {items.map((item, itemIndex) => {
            const offset = (itemIndex - index + total) % total;
            if (offset === 0 || offset > 3) return null;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(itemIndex)}
                className={cn(
                  'flex w-64 items-center gap-3 rounded-xl border border-zinc-200/70 bg-white/70 p-2.5 text-left transition-all duration-300 hover:border-zinc-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700 dark:hover:bg-zinc-900',
                  offset === 1 ? 'opacity-100' : offset === 2 ? 'opacity-70' : 'opacity-45',
                )}
                style={{ transform: `translateX(${(offset - 1) * 10}px)` }}
              >
                <ItemLogo item={item} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{item.name}</span>
                  <span className="block truncate text-xs text-zinc-500 dark:text-zinc-500">
                    {CATEGORY_LABELS[item.category]}
                  </span>
                </span>
                <span className="text-xs tabular-nums text-zinc-400 dark:text-zinc-600">
                  ▲ {item.voteCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative flex items-center justify-between gap-4 border-t border-zinc-200/80 px-6 py-3.5 dark:border-zinc-800 sm:px-8">
        <div className="flex items-center gap-2" role="tablist" aria-label="Choose a spotlighted launch">
          {items.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={itemIndex === index}
              aria-label={`Show ${item.name}`}
              onClick={() => goTo(itemIndex)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-500',
                itemIndex === index
                  ? 'w-8 bg-brand-500'
                  : 'w-1.5 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-600',
              )}
            />
          ))}
          <span className="ml-2 text-xs tabular-nums text-zinc-400 dark:text-zinc-600">
            {index + 1}/{total}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <SliderArrow direction="previous" onClick={previous} />
          <SliderArrow direction="next" onClick={next} />
        </div>
      </div>
    </div>
  );
}

function SliderArrow({
  direction,
  onClick,
}: {
  direction: 'previous' | 'next';
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'next' ? 'Next spotlight' : 'Previous spotlight'}
      className="flex size-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 active:scale-95 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-white"
    >
      <span aria-hidden="true" className="text-xs">
        {direction === 'next' ? '→' : '←'}
      </span>
    </button>
  );
}
