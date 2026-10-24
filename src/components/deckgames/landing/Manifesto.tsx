import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useInView } from '../motion';

/**
 * The close: what this is for, said plainly, and one glowing way forward.
 */
export function Manifesto() {
  const [ref, seen] = useInView<HTMLDivElement>();

  return (
    <section aria-labelledby="manifesto-title" className="bg-g-paper px-4 py-28 sm:px-6">
      <div
        ref={ref}
        className={cn('mx-auto max-w-xl text-center opacity-0', seen && 'animate-g-rise')}
      >
        <h2
          id="manifesto-title"
          className="text-[clamp(2rem,4.6vw,3.5rem)] font-medium leading-[1] tracking-[-0.05em] text-balance"
        >
          For developers who want more
        </h2>
        <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-g-mute text-pretty">
          <p>
            We believe the next great games will come from bedrooms in Lagos, studios in Nairobi and
            laptops everywhere in between.
          </p>
          <p>
            But getting a web game in front of players, and getting paid for it, still means app
            stores, card processors and months of plumbing that has nothing to do with the game.
          </p>
          <p>
            Deck Games is the other way. Host your game anywhere, add one script, and Deck brings
            the players, the sign-in, the store and the payouts. You keep 80% of every sale.
          </p>
          <p className="text-g-ink">
            It’s time to ship the game.{' '}
            <Link to="/docs/developers" className="underline underline-offset-4">
              Read the docs.
            </Link>
          </p>
        </div>
        <Link
          to="/games/developers"
          className="glass-primary relative mt-10 inline-block rounded-xl px-6 py-3.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] transition-[box-shadow,transform] duration-500 ease-glide active:scale-[0.98]"
        >
          Start building
        </Link>
      </div>
    </section>
  );
}
