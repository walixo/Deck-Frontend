import { useMuted } from '@/hooks/useSound';
import { getMuted, playClick, setMuted } from '@/lib/sound';
import { cn } from '@/lib/utils';

/**
 * The site's audio switch, next to the theme switch.
 *
 * Built as the theme toggle's twin on purpose — same box, same lift, same
 * trick of mounting both glyphs and sliding one past the other — because the
 * two are the same kind of control and a pair that only half-matches reads as
 * an accident.
 *
 * The glyph shows the *state* and the label says the *action*, which is the
 * convention its neighbour already set: a sun means "it is light out", and the
 * label says "switch to dark". `GameFrame` argues elsewhere that a crossed-out
 * speaker is the one control everybody has to click twice to understand, and
 * that is right where there is room for a word — it spells out "Sound on". Up
 * here there is a row of 36px squares and no room, so the ambiguity is settled
 * the other way: `role="switch"` with `aria-checked` states it outright to a
 * screen reader, and the title states it to everyone else.
 */
export function SoundToggle({ className }: { className?: string }) {
  const muted = useMuted();

  const toggle = () => {
    const next = !getMuted();
    setMuted(next);
    /* Turning sound on answers with the sound. It is also the only moment the
       context can start for somebody who muted before ever making a noise —
       a click handler is a user gesture, which is the one place a browser
       allows it. */
    if (!next) playClick();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      /* Checked means sound is on, not muted — the switch is "audio", so the
         on position has to be the one where you can hear something. */
      aria-checked={!muted}
      aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
      title={muted ? 'Sound off — turn it on' : 'Sound on — turn it off'}
      className={cn(
        'relative flex size-9 items-center justify-center overflow-hidden rounded-slab border border-edge bg-surface text-body shadow-hard-sm',
        'transition-[transform,box-shadow,background-color] duration-[120ms] ease-[var(--ease-snap)]',
        'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-deep hover:text-on-deep hover:shadow-hard',
        'active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
        className,
      )}
    >
      <Speaker
        waves
        className={cn(
          'absolute size-4 transition-transform duration-[160ms] ease-[var(--ease-snap)]',
          muted ? 'translate-y-7' : 'translate-y-0',
        )}
      />
      <Speaker
        className={cn(
          'absolute size-4 transition-transform duration-[160ms] ease-[var(--ease-snap)]',
          muted ? 'translate-y-0' : '-translate-y-7',
        )}
      />
    </button>
  );
}

/**
 * A speaker, drawn rather than typed.
 *
 * The obvious glyphs — 🔊 and 🔇 — are emoji, which arrive in whatever colour
 * and weight the platform feels like and would sit beside a hairline sun and
 * moon looking like they came from a different site. Two paths in
 * `currentColor` inherit the button's hover inversion for free.
 */
function Speaker({ waves = false, className }: { waves?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* The cone: a box at the ear and a wedge opening out to the right. */}
      <path d="M2 6h2.4L7.6 3.2v9.6L4.4 10H2z" />
      {waves ? (
        <>
          <path d="M10 5.6a3.4 3.4 0 0 1 0 4.8" />
          <path d="M12.2 3.6a6.4 6.4 0 0 1 0 8.8" />
        </>
      ) : (
        <>
          <path d="M10.4 6.2l3.6 3.6" />
          <path d="M14 6.2l-3.6 3.6" />
        </>
      )}
    </svg>
  );
}
