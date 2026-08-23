import { useState } from 'react';
import { useConsent } from '@/hooks/useConsent';
import { embedUrl, videoHost, type Slide } from '@/lib/media';
import { cn } from '@/lib/utils';

interface MediaSliderProps {
  slides: Slide[];
  /** Announced to screen readers so the slider is not just "image". */
  label: string;
  className?: string;
}

/**
 * One piece of media at a time, with a way to move between them.
 *
 * Not a carousel: nothing auto-advances. A slider that moves on its own steals
 * the thing you were looking at, and on a page where each slide is somebody's
 * prototype that is exactly the wrong behaviour.
 *
 * Every slide stays in the DOM and is hidden with `hidden` rather than being
 * unmounted, so a browser that has already decoded image three does not decode
 * it again on the way back. The inactive ones are `inert`, so a keyboard user
 * tabs through the visible slide only.
 */
export function MediaSlider({ slides, label, className }: MediaSliderProps) {
  const [index, setIndex] = useState(0);

  if (slides.length === 0) return null;

  const at = Math.min(index, slides.length - 1);

  /*
   * Stepping uses the functional updater, not the `at` captured above.
   *
   * Two clicks inside one React batch both read the same rendered `at`, so
   * `go(at + 1)` twice lands on the same slide — a fast double-click on Next
   * advanced one frame instead of two. Deriving from the previous state makes
   * each step count regardless of how they are batched.
   */
  const step = (delta: number) =>
    setIndex((current) => (current + delta + slides.length) % slides.length);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      className={cn('relative', className)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') step(-1);
        if (event.key === 'ArrowRight') step(1);
      }}
    >
      <div className="relative aspect-video w-full overflow-hidden border-2 border-edge bg-surface-2">
        {slides.map((slide, i) => (
          <div
            key={slide.src}
            hidden={i !== at}
            inert={i !== at || undefined}
            className="absolute inset-0"
          >
            {slide.kind === 'video' ? (
              <VideoSlide src={slide.src} />
            ) : (
              <img
                src={slide.src}
                alt=""
                loading={i === 0 ? undefined : 'lazy'}
                className="size-full object-cover"
              />
            )}
          </div>
        ))}

        {slides.length > 1 && (
          <>
            <Arrow direction="left" onClick={() => step(-1)} />
            <Arrow direction="right" onClick={() => step(1)} />
          </>
        )}
      </div>

      {slides.length > 1 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {slides.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show ${slide.kind} ${i + 1} of ${slides.length}`}
              aria-current={i === at}
              /* A bar, not a dot. Dots at 8px are both hard to hit and hard to
                 count; a 24px bar is a real target and reads as a position. */
              className={cn(
                'h-2 w-6 border-2 border-edge transition-colors duration-[120ms]',
                i === at ? 'bg-accent' : 'bg-surface hover:bg-surface-2',
              )}
            />
          ))}

          <span
            aria-live="polite"
            className="ml-auto font-mono text-[10px] font-bold uppercase tabular-nums tracking-[0.08em] text-muted"
          >
            {at + 1} / {slides.length}
          </span>
        </div>
      )}
    </section>
  );
}

function Arrow({ direction, onClick }: { direction: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'left' ? 'Previous' : 'Next'}
      className={cn(
        'absolute top-1/2 flex size-9 -translate-y-1/2 items-center justify-center',
        'border-2 border-edge bg-surface text-body shadow-hard-sm',
        'transition-transform duration-[120ms] ease-[var(--ease-snap)] hover:scale-105',
        direction === 'left' ? 'left-2' : 'right-2',
      )}
    >
      <span aria-hidden="true" className="text-sm leading-none">
        {direction === 'left' ? '‹' : '›'}
      </span>
    </button>
  );
}

/**
 * A video slide: a poster with a play button until the reader asks for it.
 *
 * Click-to-load, always — even for somebody who accepted cookies. An iframe
 * mounted on page load makes a request to YouTube for every visitor who scrolls
 * past, whether or not they ever wanted the video; loading on the click is both
 * the private option and the fast one.
 *
 * With consent rejected there is no player at all, only a link out. That is the
 * honest outcome: Deck cannot embed a third party for somebody who said no, and
 * pretending the video is unavailable would be a lie.
 */
function VideoSlide({ src }: { src: string }) {
  const { choice } = useConsent();
  const [playing, setPlaying] = useState(false);
  const embed = embedUrl(src);

  if (playing && embed) {
    return (
      <iframe
        src={`${embed}${embed.includes('?') ? '&' : '?'}autoplay=1`}
        title="Video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
        allowFullScreen
        className="size-full border-0"
      />
    );
  }

  return (
    <div className="flex size-full flex-col items-center justify-center gap-3 bg-ink p-6 text-center text-bone">
      <span aria-hidden="true" className="font-display text-3xl">
        ▶
      </span>

      {embed && choice === 'granted' ? (
        <>
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="border-2 border-bone bg-bone px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-ink transition-transform duration-[120ms] ease-[var(--ease-snap)] hover:-translate-y-0.5"
          >
            Play video
          </button>
          <p className="font-mono text-[9px] uppercase tracking-[0.08em] opacity-70">
            Loads from {videoHost(src)}
          </p>
        </>
      ) : (
        <>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="border-2 border-bone bg-bone px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-ink transition-transform duration-[120ms] ease-[var(--ease-snap)] hover:-translate-y-0.5"
          >
            Watch on {videoHost(src)} ↗
          </a>
          <p className="max-w-xs font-mono text-[9px] uppercase leading-relaxed tracking-[0.08em] opacity-70">
            {embed
              ? 'Playing here needs cookies, which you turned down'
              : 'This one only plays on its own site'}
          </p>
        </>
      )}
    </div>
  );
}
