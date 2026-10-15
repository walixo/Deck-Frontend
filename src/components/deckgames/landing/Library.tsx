import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn, formatNumber } from '@/lib/utils';
import {
  GAME_GENRES,
  GAME_GENRE_LABELS,
  type GameGenre,
  type GameOrientation,
  type GameSummary,
} from '@/types';
import { CoverArt } from '../CoverArt';

/**
 * The library, as a bento whose tiles take the shape of their games.
 *
 * A portrait game gets a tall tile, a landscape game a wide one, and a game
 * that fits anything a square — so the grid itself tells you how each game
 * plays before you open it. `grid-flow-dense` packs the gaps the mixed shapes
 * leave. Tiles rest in black and white and come into colour under the pointer,
 * the video's monochrome grid made to mean "this is the one".
 */
const SHAPE: Record<GameOrientation, string> = {
  portrait: 'row-span-2',
  landscape: 'col-span-2',
  both: '',
};

type Shape = 'all' | GameOrientation;

export function Library({
  games,
  loading,
  genre,
  onGenre,
}: {
  games: GameSummary[];
  loading: boolean;
  genre: GameGenre | undefined;
  onGenre: (genre: GameGenre | undefined) => void;
}) {
  const [shape, setShape] = useState<Shape>('all');
  const shown = useMemo(
    () =>
      shape === 'all'
        ? games
        : games.filter((game) => game.orientation === shape || game.orientation === 'both'),
    [games, shape],
  );

  return (
    <section
      id="library"
      aria-labelledby="library-title"
      className="scroll-mt-14 bg-g-paper px-4 pb-24 pt-10 sm:px-6"
    >
      <div className="mx-auto max-w-[1400px]">
        <h2
          id="library-title"
          className="mx-auto max-w-2xl text-center text-[clamp(2rem,4.6vw,3.75rem)] font-medium leading-[1] tracking-[-0.05em] text-balance"
        >
          Finally, an arcade that fits every screen
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-center text-[13px] leading-relaxed text-g-mute">
          Tall tiles play upright, wide ones play sideways. Pick one.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          <Pill active={!genre} onClick={() => onGenre(undefined)}>
            All
          </Pill>
          {GAME_GENRES.map((value) => (
            <Pill key={value} active={genre === value} onClick={() => onGenre(value)}>
              {GAME_GENRE_LABELS[value]}
            </Pill>
          ))}
          <span aria-hidden="true" className="mx-2 hidden h-4 w-px bg-g-line sm:block" />
          {(['all', 'portrait', 'landscape'] as const).map((value) => (
            <Pill key={value} active={shape === value} onClick={() => setShape(value)} quiet>
              {value === 'all' ? 'Any shape' : value === 'portrait' ? '▯ Portrait' : '▭ Landscape'}
            </Pill>
          ))}
        </div>

        {loading ? (
          <div className="mt-10 grid auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[190px] sm:grid-cols-4 lg:grid-cols-6">
            {['col-span-2', 'row-span-2', '', 'col-span-2', '', 'row-span-2'].map((size, index) => (
              <div key={index} className={cn('animate-pulse rounded-2xl bg-g-paper-2', size)} />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <p className="mx-auto mt-16 max-w-sm text-center text-sm text-g-mute">
            Nothing in this corner of the arcade yet.{' '}
            <Link to="/games/developers" className="text-g-ink underline underline-offset-4">
              Make the first one
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-10 grid grid-flow-dense auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[190px] sm:grid-cols-4 lg:grid-cols-6">
            {shown.map((game) => (
              <li
                key={game.id}
                className={cn(
                  SHAPE[game.orientation],
                  game.featured && game.orientation === 'landscape' && 'sm:row-span-2',
                )}
              >
                <Tile game={game} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Tile({ game }: { game: GameSummary }) {
  return (
    <Link
      to={`/games/${game.slug}`}
      className="group relative block size-full overflow-hidden rounded-2xl bg-g-paper-2 outline-none ring-g-ember ring-offset-2 ring-offset-g-paper focus-visible:ring-2"
    >
      <div className="size-full grayscale transition-[filter,transform] duration-700 ease-glide group-hover:scale-[1.04] group-hover:grayscale-0 group-focus-visible:grayscale-0">
        <CoverArt game={game} showTitle={false} />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgb(0_0_0/0.7))]" />
      <div className="absolute inset-x-3 bottom-3 text-white">
        <p className="text-[15px] font-medium leading-tight tracking-[-0.03em]">{game.title}</p>
        <p className="mt-1 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-white/70">
          <span>{GAME_GENRE_LABELS[game.genre]}</span>
          <span aria-hidden="true">·</span>
          <span>
            {game.orientation === 'portrait' ? '▯' : game.orientation === 'landscape' ? '▭' : '◇'}
          </span>
          {game.plays > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span>{formatNumber(game.plays)} plays</span>
            </>
          )}
        </p>
      </div>
      {game.kind === 'builtin' && (
        <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.16em] text-white backdrop-blur">
          Deck original
        </span>
      )}
      <span className="absolute right-3 top-3 translate-y-1 rounded-full bg-white px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-black opacity-0 transition-[opacity,transform] duration-500 ease-glide group-hover:translate-y-0 group-hover:opacity-100">
        Play →
      </span>
    </Link>
  );
}

function Pill({
  active,
  onClick,
  children,
  quiet,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
  quiet?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3.5 py-1.5 text-[12px] font-medium tracking-[-0.01em] transition-colors duration-300 ease-glide',
        active
          ? quiet
            ? 'border-g-ink text-g-ink'
            : 'border-g-ink bg-g-ink text-g-paper'
          : 'border-g-line text-g-mute hover:border-g-ink hover:text-g-ink',
      )}
    >
      {children}
    </button>
  );
}
