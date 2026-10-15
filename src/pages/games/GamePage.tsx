import { Link, useParams, useSearchParams } from 'react-router-dom';
import { BlockDrop } from '@/components/games/BlockDrop';
import { SkyRun } from '@/components/games/SkyRun';
import { Snakejo } from '@/components/games/Snakejo';
import { SpeedX } from '@/components/games/SpeedX';
import { ArcadeSkinContext } from '@/components/games/skin';
import { CoverArt } from '@/components/deckgames/CoverArt';
import { Player } from '@/components/deckgames/Player';
import { useAuth } from '@/hooks/useAuth';
import { useDeveloperView, useGameProducts } from '@/hooks/useGamePlatform';
import { useGame, useLeaderboard, useRecordPlay } from '@/hooks/useGames';
import { cn, formatMoney, formatNumber } from '@/lib/utils';
import {
  GAME_GENRE_LABELS,
  GAME_ORIENTATION_LABELS,
  type GameDetail,
  type GameMode,
} from '@/types';

/**
 * Deck's own games, by component key — a lookup, never a dynamic import of a
 * string from the database. A bad row can fail to match; it cannot load
 * something unintended.
 */
const ORIGINALS: Record<string, () => React.ReactElement> = {
  'sky-run': () => <SkyRun />,
  snakejo: () => <Snakejo />,
  'block-drop': () => <BlockDrop />,
  'speed-x': () => <SpeedX />,
};

/**
 * One game, `/games/:slug`: the stage first, then who made it, what it sells
 * and who is winning.
 *
 * A developer looking at their own game gets test mode — before review it is
 * the only mode, and after it a toggle — with their test build if they have
 * registered one. Everyone else only ever sees an approved game, live.
 */
export function GamePage() {
  const { slug = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const { data: game, isLoading, isError, error } = useGame(slug);
  const play = useRecordPlay();
  const isDeveloper = Boolean(
    user && game && (user.role === 'admin' || game.author?.id === user.id),
  );
  /* Only the developer's own view knows where their test build is. */
  const developer = useDeveloperView(slug, isDeveloper && game?.kind === 'external');

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 pb-20 pt-24 sm:px-6">
        <div className="h-10 w-64 animate-pulse rounded-full bg-g-paper-2" />
        <div className="mt-8 aspect-video w-full animate-pulse rounded-[28px] bg-g-paper-2" />
      </div>
    );
  }

  if (isError || !game) {
    return (
      <div className="mx-auto max-w-xl px-4 pb-24 pt-32 text-center sm:px-6">
        <p className="text-3xl font-medium tracking-[-0.04em]">This game isn’t here</p>
        <p className="mt-3 text-sm text-g-mute">
          {error?.message ?? 'It may have been taken down.'}
        </p>
        <Link
          to="/games#library"
          className="mt-6 inline-block font-mono text-[10px] uppercase tracking-[0.16em] text-g-ember-ink underline-offset-4 hover:underline"
        >
          ← Back to the library
        </Link>
      </div>
    );
  }

  const live = game.status === 'approved';
  const wantsTest = params.get('mode') === 'test';
  const mode: GameMode = isDeveloper && (!live || wantsTest) ? 'test' : 'live';
  const Original =
    game.kind === 'builtin' && game.component ? ORIGINALS[game.component] : undefined;
  const maker = game.studio || game.author?.name || 'Deck';

  return (
    <div className="pb-24 pt-20 sm:pt-24">
      <title>{`${game.title} — Deck Games`}</title>

      <header className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <Link
          to="/games#library"
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-g-mute hover:text-g-ink"
        >
          ← Library
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="text-[clamp(2.25rem,5vw,4rem)] font-medium leading-[0.95] tracking-[-0.055em]">
              {game.title}
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-g-mute text-pretty">
              {game.tagline}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip>{GAME_GENRE_LABELS[game.genre]}</Chip>
            <Chip>{GAME_ORIENTATION_LABELS[game.orientation]}</Chip>
            {game.plays > 0 && <Chip>{formatNumber(game.plays)} plays</Chip>}
            {game.kind === 'builtin' && <Chip strong>Deck original</Chip>}
            {!live && (
              <Chip strong>{game.status === 'pending' ? 'In review' : 'Not approved'}</Chip>
            )}
          </div>
        </div>

        {isDeveloper && game.kind === 'external' && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-g-line bg-g-paper-2 px-4 py-3 text-[13px]">
            <span className="text-g-mute">
              {mode === 'test'
                ? 'You’re in test mode. Purchases are simulated and nothing is charged; webhooks still fire.'
                : 'You’re seeing your game as players do.'}
            </span>
            <span className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.14em]">
              {live && (
                <button
                  type="button"
                  onClick={() =>
                    setParams(mode === 'test' ? {} : { mode: 'test' }, { replace: true })
                  }
                  className="text-g-ink hover:text-g-ember-ink"
                >
                  Switch to {mode === 'test' ? 'live' : 'test'}
                </button>
              )}
              <Link
                to={`/games/developers/${game.slug}`}
                className="text-g-ink hover:text-g-ember-ink"
              >
                Developer settings →
              </Link>
            </span>
          </div>
        )}
      </header>

      <div className="mx-auto mt-8 max-w-[1400px] px-0 sm:px-6">
        {Original ? (
          <ArcadeSkinContext.Provider value="games">
            <div className="rounded-[28px] bg-g-paper-2 p-4 sm:p-8">
              <Original />
            </div>
          </ArcadeSkinContext.Provider>
        ) : (
          <Stage
            game={game}
            mode={mode}
            testUrl={developer.data?.settings.testUrl ?? null}
            onPlay={() => live && play.mutate(game.slug)}
          />
        )}
      </div>

      <div className="mx-auto mt-14 grid max-w-[1400px] gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-labelledby="about-title">
          <h2
            id="about-title"
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-g-mute"
          >
            About
          </h2>
          <div className="mt-4 space-y-4">
            {game.description.split('\n\n').map((paragraph) => (
              <p
                key={paragraph.slice(0, 40)}
                className="max-w-2xl text-[16px] leading-[1.75] text-pretty"
              >
                {paragraph}
              </p>
            ))}
          </div>
          <p className="mt-8 flex items-center gap-3 text-[13px] text-g-mute">
            <span className="size-8 overflow-hidden rounded-full bg-g-paper-2">
              {game.author?.avatarUrl ? (
                <img src={game.author.avatarUrl} alt="" className="size-full object-cover" />
              ) : null}
            </span>
            Made by <span className="font-medium text-g-ink">{maker}</span>
          </p>
        </section>

        <aside className="space-y-10">
          {game.sdk && <StoreList slug={game.slug} enabled={live || isDeveloper} />}
          {live && <Board slug={game.slug} />}
        </aside>
      </div>
    </div>
  );
}

/** The player, or — for a game staff have not cleared to frame — a way out. */
function Stage({
  game,
  mode,
  testUrl,
  onPlay,
}: {
  game: GameDetail;
  mode: GameMode;
  testUrl: string | null;
  onPlay: () => void;
}) {
  const src = (mode === 'test' && testUrl) || game.playUrl;

  /* In test mode the developer's own build is framed whether or not staff
     have cleared embedding — it is their code, on their screen. */
  if (src && (game.embeddable || mode === 'test')) {
    return <Player game={game} src={src} mode={mode} onPlay={onPlay} />;
  }

  return (
    <div className="relative mx-4 grid min-h-[50svh] place-items-center overflow-hidden rounded-[28px] bg-g-night p-8 text-center text-white sm:mx-0">
      <div aria-hidden="true" className="absolute inset-0 opacity-50 blur-2xl">
        <CoverArt game={game} showTitle={false} />
      </div>
      <div className="relative max-w-sm">
        <p className="text-xl font-medium tracking-[-0.03em]">Plays on its maker’s site</p>
        <p className="mt-2 text-[13px] leading-relaxed text-white/70">
          This game opens in a new tab. Deck only runs a game inside its own player once staff have
          cleared it.
        </p>
        {game.playUrl && (
          <a
            href={game.playUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onPlay}
            className="mt-6 inline-block rounded-[3px] bg-white px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-black"
          >
            Play {game.title} ↗
          </a>
        )}
      </div>
    </div>
  );
}

function StoreList({ slug, enabled }: { slug: string; enabled: boolean }) {
  const { data: products } = useGameProducts(slug, enabled);
  if (!products?.length) return null;

  return (
    <section aria-labelledby="store-title">
      <h2
        id="store-title"
        className="font-mono text-[10px] uppercase tracking-[0.18em] text-g-mute"
      >
        In this game
      </h2>
      <ul className="mt-4 space-y-2">
        {products.map((product) => (
          <li
            key={product.productId}
            className="flex items-center gap-3 rounded-2xl bg-g-paper-2 p-3"
          >
            <span className="size-10 shrink-0 rounded-xl bg-[linear-gradient(135deg,var(--color-g-amber-1),var(--color-g-amber-3))]" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-medium tracking-[-0.02em]">
                {product.name}
              </span>
              {product.description && (
                <span className="block truncate text-[12px] text-g-mute">
                  {product.description}
                </span>
              )}
            </span>
            <span className="font-mono text-[11px] tabular-nums">
              {formatMoney(product.priceMinor, product.currency)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[12px] leading-relaxed text-g-mute">
        Bought inside the game. 80% of every purchase goes to its developer.
      </p>
    </section>
  );
}

function Board({ slug }: { slug: string }) {
  const { data, isLoading } = useLeaderboard(slug);
  const { user } = useAuth();

  return (
    <section aria-labelledby="board-title">
      <div className="flex items-baseline justify-between">
        <h2
          id="board-title"
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-g-mute"
        >
          Leaderboard
        </h2>
        {data && (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-g-mute">
            {formatNumber(data.players)} {data.players === 1 ? 'player' : 'players'}
          </span>
        )}
      </div>
      {isLoading ? (
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((row) => (
            <div key={row} className="h-11 animate-pulse rounded-xl bg-g-paper-2" />
          ))}
        </div>
      ) : data?.scores.length ? (
        <ol className="mt-4 space-y-1.5">
          {data.scores.map((row) => {
            const mine = Boolean(user && row.player?.id === user.id);
            return (
              <li
                key={row.id}
                className={cn(
                  'flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px]',
                  mine ? 'bg-g-ember text-g-on-ember' : 'bg-g-paper-2',
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      'w-5 font-mono text-[11px]',
                      !mine && row.rank <= 3 ? 'text-g-ember-ink' : 'opacity-70',
                    )}
                  >
                    {row.rank}
                  </span>
                  <span className="truncate font-medium">{row.player?.name ?? 'A player'}</span>
                </span>
                <span className="font-mono tabular-nums">{formatNumber(row.score)}</span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-4 text-[13px] text-g-mute">No scores yet. Yours could be the first.</p>
      )}
      {data?.you && !data.scores.some((row) => row.player?.id === user?.id) && (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-g-mute">
          You’re #{data.you.rank} with {formatNumber(data.you.score)}
        </p>
      )}
      <p className="mt-3 text-[11px] leading-relaxed text-g-mute">
        Scores are sent by the game from your browser, so treat the board as bragging rights, not a
        contest.
      </p>
    </section>
  );
}

function Chip({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <span
      className={cn(
        'rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em]',
        strong ? 'bg-g-ink text-g-paper' : 'border border-g-line text-g-mute',
      )}
    >
      {children}
    </span>
  );
}
