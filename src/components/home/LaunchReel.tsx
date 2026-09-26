import { PauseIcon, PlayIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { useEffect, useRef, useState } from 'react';
import { ReelStage, STAGE_HEIGHT, STAGE_WIDTH } from '@/components/reel/ReelStage';
import { REEL_DURATION } from '@/components/reel/timing';

/**
 * The launch reel: thirty seconds of Deck, on the landing page.
 *
 * A film, but not a video file. Every frame is drawn live from the theme's
 * tokens (see `components/reel`), which buys three things a baked MP4 cannot
 * have: it is a light film in light mode and a dark one in dark mode, it
 * follows the palette switcher, and it costs a few kilobytes of code rather
 * than megabytes of video. Because each frame is a pure function of time, the
 * same component can also be recorded frame by frame into a real MP4 for
 * posting elsewhere, and the recording matches the page exactly.
 *
 * **When it plays.** It rests on its end card — logo, line, address — until at
 * least 60% of it is on screen, then plays once from the top and comes back to
 * rest on the end card. It pauses when scrolled away and picks up where it was
 * when scrolled back, unless the reader paused it themselves, in which case it
 * stays paused: a player that overrides a pause is a player that is not
 * listening.
 *
 * **Reduced motion.** It never starts by itself. The end card is a complete
 * still — it says what Deck is and where — and the play button is there for
 * anybody who wants the motion anyway. Choosing to press it is exactly the
 * consent the preference is asking for.
 *
 * Silent by design; there is no soundtrack to mute.
 */
export function LaunchReel() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [t, setT] = useState(REEL_DURATION);
  const [playing, setPlaying] = useState(false);
  /* Whether it has ever played. The film rests on its end card before the
     first play as well as after the last, and only the second is a replay. */
  const [played, setPlayed] = useState(false);
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /*
   * Mirrors of the clock and the play state, for the rAF loop and the
   * observer. Both run outside React's render and need the value *now*, not
   * the one captured when they were set up; writing through `setTime` and
   * `setPlay` keeps each pair in step.
   */
  const timeRef = useRef(REEL_DURATION);
  const playingRef = useRef(false);

  /* Why it is paused, when it is. Refs, because they steer the observer's
     decisions without being anything the frame draws. */
  const userPaused = useRef(false);
  const scrolledAway = useRef(false);
  const started = useRef(false);

  function setTime(value: number) {
    timeRef.current = value;
    setT(value);
  }

  function setPlay(value: boolean) {
    playingRef.current = value;
    setPlaying(value);
    if (value) setPlayed(true);
  }

  /* The stage is 1920×1080 in its own pixels; this scales it to the frame. */
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / STAGE_WIDTH);
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  /*
   * The clock. One rAF loop while playing, advancing by real elapsed time so
   * the film runs at the same speed on a 60Hz and a 144Hz screen.
   *
   * The step is capped at a tenth of a second. Browsers stop rAF in hidden
   * tabs, and the first frame back would otherwise see the whole absence as one
   * step and jump the film forward by however long the tab was in the
   * background.
   */
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const step = Math.min((now - last) / 1000, 0.1);
      last = now;
      const next = Math.min(timeRef.current + step, REEL_DURATION);
      setTime(next);
      if (next >= REEL_DURATION) {
        setPlay(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  /* Autoplay on first view, pause off screen, resume on return. */
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.intersectionRatio >= 0.6;
        const gone = entry.intersectionRatio < 0.25;

        if (visible && !started.current && !reduced) {
          started.current = true;
          setTime(0);
          setPlay(true);
        } else if (visible && scrolledAway.current && !userPaused.current) {
          scrolledAway.current = false;
          setPlay(true);
        } else if (gone && playingRef.current) {
          scrolledAway.current = true;
          setPlay(false);
        }
      },
      { threshold: [0, 0.25, 0.6, 1] },
    );

    observer.observe(frame);
    return () => observer.disconnect();
  }, [reduced]);

  const ended = t >= REEL_DURATION;
  const replay = ended && played;

  function toggle() {
    started.current = true;
    scrolledAway.current = false;
    if (playing) {
      userPaused.current = true;
      setPlay(false);
      return;
    }
    userPaused.current = false;
    if (ended) setTime(0);
    setPlay(true);
  }

  function seek(value: number) {
    started.current = true;
    setTime(Math.min(Math.max(value, 0), REEL_DURATION));
  }

  return (
    <section aria-labelledby="reel-heading" className="border-b border-edge">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
          The thirty-second tour
        </p>
        <h2 id="reel-heading" className="display-tight mt-2 text-2xl uppercase sm:text-3xl">
          Deck, start to finish
        </h2>

        {/* What the film says, for anyone who cannot watch it. The stage itself
            is decoration to assistive technology — a screen reader announcing
            a timecode sixty times a second would be noise. */}
        <p className="sr-only">
          A thirty-second film. Deck is one board for every kind of launch — AI tools, mobile apps,
          Claude skills and more — where new tech gets its first fans. You post a launch with its
          name, tagline and category, it goes live on today’s board, and votes decide its rank;
          nothing is featured into first place. A new board starts every midnight UTC and everyone
          starts on zero. Ranks lock at 23:59, and every launch leaves with share cards, an
          embeddable badge and the text to paste. Deck is at onedeck.africa.
        </p>

        <div
          ref={frameRef}
          aria-hidden="true"
          className="relative mt-6 aspect-video overflow-hidden rounded-slab border border-edge bg-canvas shadow-hard-lg"
        >
          {scale > 0 && (
            <div
              className="absolute left-0 top-0 origin-top-left"
              style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT, transform: `scale(${scale})` }}
            >
              <ReelStage t={t} />
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-4">
          <button
            type="button"
            onClick={toggle}
            aria-label={
              playing ? 'Pause the film' : replay ? 'Play the film again' : 'Play the film'
            }
            className="flex size-10 shrink-0 items-center justify-center border border-edge bg-pop text-on-pop shadow-hard-sm transition-[transform,box-shadow] duration-[120ms] ease-[var(--ease-snap)] hover:-translate-x-px hover:-translate-y-px hover:shadow-hard active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            {playing ? (
              <PauseIcon className="size-5" />
            ) : replay ? (
              <ArrowPathIcon className="size-5" />
            ) : (
              <PlayIcon className="size-5" />
            )}
          </button>

          <input
            type="range"
            min={0}
            max={REEL_DURATION}
            step={0.01}
            value={t}
            onChange={(event) => seek(Number(event.target.value))}
            aria-label="Position in the film"
            aria-valuetext={`${Math.floor(t)} of ${REEL_DURATION} seconds`}
            className="h-2 min-w-0 flex-1 cursor-pointer accent-accent"
          />

          <span className="shrink-0 font-mono text-[12px] font-bold tabular-nums text-muted">
            0:{String(Math.floor(t)).padStart(2, '0')} / 0:{REEL_DURATION}
          </span>
        </div>
      </div>
    </section>
  );
}
