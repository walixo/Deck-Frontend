import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Stars } from '@/components/ui/Stars';
import { CATEGORY_LABELS, cn, colourFor, PRICING_LABELS } from '@/lib/utils';
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
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % total),
      AUTOPLAY_MS,
    );
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

  if (isLoading) return <Skeleton className="h-72 w-full" />;
  if (total === 0) return null;

  const active = items[index];
  const colour = colourFor(active.slug);

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Spotlighted launches"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="rounded-slab border-2 border-edge bg-surface shadow-hard-lg"
    >
      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
        <div key={active.id} className="animate-[var(--animate-slam)]">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge tone="accent">★ Spotlight</Badge>
            <Badge tone="outline">{CATEGORY_LABELS[active.category]}</Badge>
            <Badge tone="outline">{PRICING_LABELS[active.pricing]}</Badge>
          </div>

          <div className="flex items-start gap-4">
            <ItemLogo item={active} size="lg" />
            <div className="min-w-0">
              <h3 className="display-tight text-2xl uppercase text-balance sm:text-3xl">
                <Link to={`/item/${active.slug}`} className="underline-offset-4 hover:underline">
                  {active.name}
                </Link>
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted text-pretty sm:text-base">
                {active.tagline}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <VoteButton item={active} layout="inline" />

            {active.reviewCount > 0 && (
              <span className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase text-muted">
                <Stars value={active.ratingAvg} size="md" />
                <span className="tabular-nums">
                  {active.ratingAvg.toFixed(1)} / {active.reviewCount}{' '}
                  {active.reviewCount === 1 ? 'review' : 'reviews'}
                </span>
              </span>
            )}

            <Link
              to={`/item/${active.slug}`}
              className="font-mono text-[11px] font-bold uppercase underline-offset-4 hover:underline"
            >
              Read more →
            </Link>
          </div>
        </div>

        {/* Stacked preview of what is coming up — clickable, and doubles as depth. */}
        <div className="hidden lg:flex lg:flex-col lg:gap-2">
          {items.map((item, itemIndex) => {
            const offset = (itemIndex - index + total) % total;
            if (offset === 0 || offset > 3) return null;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(itemIndex)}
                className="flex w-64 items-center gap-3 border-2 border-edge bg-canvas p-2.5 text-left transition-transform duration-[120ms] ease-[var(--ease-snap)] hover:-translate-x-1"
                style={{ transform: `translateX(${(offset - 1) * 12}px)` }}
              >
                <ItemLogo item={item} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-[13px] uppercase">
                    {item.name}
                  </span>
                  <span className="block truncate font-mono text-[10px] uppercase text-muted">
                    {CATEGORY_LABELS[item.category]}
                  </span>
                </span>
                <span className="font-mono text-[11px] font-bold tabular-nums text-muted">
                  ▲ {item.voteCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Colour bar keyed to the active item — the only thing that changes hue. */}
      <div className={cn('h-1.5 border-y-2 border-edge', colour.bg)} />

      <div className="flex items-center justify-between gap-4 px-5 py-3 sm:px-7">
        <div
          className="flex items-center gap-2"
          role="tablist"
          aria-label="Choose a spotlighted launch"
        >
          {items.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={itemIndex === index}
              aria-label={`Show ${item.name}`}
              onClick={() => goTo(itemIndex)}
              className={cn(
                'h-3 border-2 border-edge transition-[width,background-color] duration-[140ms]',
                itemIndex === index ? 'w-8 bg-lavender' : 'w-3 bg-surface-2 hover:bg-acid',
              )}
            />
          ))}
          <span className="ml-2 font-mono text-[11px] font-bold tabular-nums text-muted">
            {index + 1}/{total}
          </span>
        </div>

        <div className="flex items-center gap-2">
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
      className="flex size-8 items-center justify-center border-2 border-edge bg-surface text-sm transition-[transform,background-color] duration-[120ms] ease-[var(--ease-snap)] hover:-translate-y-0.5 hover:bg-acid hover:text-ink active:translate-y-0"
    >
      <span aria-hidden="true">{direction === 'next' ? '→' : '←'}</span>
    </button>
  );
}
