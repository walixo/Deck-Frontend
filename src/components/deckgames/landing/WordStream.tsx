import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * Two rows of words running past in opposite directions, under a call to
 * build. The video's biomarker ticker, spelling out what the platform does.
 *
 * Each row is its list twice over and slides by exactly half its width, so
 * the loop has no seam. Paused for reduced motion, where it simply wraps.
 */
const ROW_ONE = [
  ['Puzzle', 'ink'],
  ['Arcade', 'ember'],
  ['Portrait', 'ink'],
  ['Landscape', 'teal'],
  ['Strategy', 'ink'],
  ['Leaderboards', 'ember'],
  ['Idle', 'ink'],
  ['Action', 'teal'],
] as const;

const ROW_TWO = [
  ['Sandboxed', 'ink'],
  ['80/20 split', 'ember'],
  ['Test keys', 'ink'],
  ['Signed webhooks', 'teal'],
  ['Sub-accounts', 'ink'],
  ['Paid in naira', 'ember'],
  ['No installs', 'ink'],
  ['Player IDs', 'teal'],
] as const;

const TONE = {
  ink: 'text-g-ink',
  ember: 'text-g-ember-ink',
  teal: 'text-[#0f8f84] dark:text-g-teal',
};

export function WordStream() {
  return (
    <section aria-label="What Deck Games does" className="overflow-hidden bg-g-paper py-24">
      <div className="flex justify-center px-4">
        <Bracketed to="/games/developers">Build a game</Bracketed>
      </div>
      <div aria-hidden="true" className="mx-auto mt-10 h-16 w-px bg-g-line" />

      <div className="mt-8 space-y-3 font-mono text-[clamp(1.25rem,3.2vw,2.5rem)] uppercase leading-none tracking-[0.02em]">
        <Row words={ROW_ONE} />
        <Row words={ROW_TWO} reverse />
      </div>
      <div aria-hidden="true" className="mx-auto mt-10 h-16 w-px bg-g-line" />
    </section>
  );
}

function Row({
  words,
  reverse,
}: {
  words: readonly (readonly [string, keyof typeof TONE])[];
  reverse?: boolean;
}) {
  return (
    <div className="flex w-max motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center">
      {[0, 1].map((copy) => (
        <ul
          key={copy}
          aria-hidden={copy === 1 || undefined}
          className={cn(
            'flex shrink-0 gap-[0.6em] pr-[0.6em] motion-reduce:animate-none',
            reverse ? 'animate-g-marquee-reverse' : 'animate-g-marquee',
            copy === 1 && 'motion-reduce:hidden',
          )}
        >
          {words.map(([word, tone]) => (
            <li key={word} className={cn('whitespace-nowrap', TONE[tone])}>
              {word}
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}

/** A link framed by four corner brackets, like a viewfinder. */
export function Bracketed({ to, children }: { to: string; children: string }) {
  const corner = 'absolute size-2.5 border-g-ink transition-all duration-500 ease-glide';
  return (
    <Link
      to={to}
      className="group relative px-7 py-3.5 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-g-ink"
    >
      <span
        className={cn(
          corner,
          'left-0 top-0 border-l border-t group-hover:-left-1 group-hover:-top-1',
        )}
      />
      <span
        className={cn(
          corner,
          'right-0 top-0 border-r border-t group-hover:-right-1 group-hover:-top-1',
        )}
      />
      <span
        className={cn(
          corner,
          'bottom-0 left-0 border-b border-l group-hover:-bottom-1 group-hover:-left-1',
        )}
      />
      <span
        className={cn(
          corner,
          'bottom-0 right-0 border-b border-r group-hover:-bottom-1 group-hover:-right-1',
        )}
      />
      {children}
    </Link>
  );
}
