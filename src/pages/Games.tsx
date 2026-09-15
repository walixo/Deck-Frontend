import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageBanner } from '@/components/ui/Ambient';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { BlockDrop } from '@/components/games/BlockDrop';
import { GameLogo } from '@/components/games/GameLogo';
import { SkyRun } from '@/components/games/SkyRun';
import { SpeedX } from '@/components/games/SpeedX';
import { Snakejo } from '@/components/games/Snakejo';
import { useAuth } from '@/hooks/useAuth';
import { useGames } from '@/hooks/useGames';
import { cn, formatNumber } from '@/lib/utils';
import { GAME_GENRE_LABELS, type GameSummary } from '@/types';

/**
 * The arcade.
 *
 * A cabinet row across the top — three of Deck's games, each with its own
 * character as its mark — and whichever one you pick plays underneath it. That
 * is how an arcade page is read: you scan the marks, you press one, it starts.
 * A grid of cards that all go somewhere else is a directory, and nobody plays a
 * directory.
 *
 * Submitted games sit on a separate shelf below, because they behave
 * differently: Deck links out to them rather than running them here.
 */

/** Deck's own, in the order they go on the shelf. */
const CABINET = [
  {
    key: 'sky-run',
    slug: 'sky-run',
    name: 'Sky Run',
    blurb: 'Fly the bird. Dodge everything.',
    /* Each cabinet carries its own two colours. The rule Deck's chrome follows
       — neutral content layer, one accent — is about not fighting other
       people's logos; a game's own board has nothing to fight. */
    ink: '#f7f6f2',
    ground: '#2a2440',
    accent: '#b8a9fa',
  },
  {
    key: 'snakejo',
    slug: 'snakejo',
    name: 'Snakejo',
    blurb: 'Eat, grow, hit nothing.',
    /* Blue, not the board's green. The cabinet sits in a row of three and its
       job is to be told apart at a glance; the LCD green is the *board's*
       identity and reads as a stripe of highlighter next to the other two. */
    ink: '#dff1ff',
    ground: '#12386b',
    accent: '#4fc3f7',
  },
  {
    key: 'block-drop',
    slug: 'block-drop',
    name: 'Block Drop',
    blurb: 'Run the floor. Do not get flattened.',
    ink: '#6ad3d6',
    ground: '#0d0b1a',
    accent: '#ff5d73',
  },
  {
    key: 'speed-x',
    slug: 'speed-x',
    name: 'Speed X',
    blurb: 'One lane, one life, no brakes.',
    ink: '#dff6ff',
    ground: '#16161d',
    accent: '#4fc3f7',
  },
] as const;

type CabinetKey = (typeof CABINET)[number]['key'];

export function Games() {
  const { data, isLoading, isError, error, refetch } = useGames();
  const { user } = useAuth();
  const [playing, setPlaying] = useState<CabinetKey>('sky-run');

  const ours = new Set<string>(CABINET.map((entry) => entry.slug));
  const shelf = data?.filter((game) => !ours.has(game.slug)) ?? [];
  const playsBySlug = new Map((data ?? []).map((game) => [game.slug, game.plays]));

  return (
    <div className="relative isolate mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageBanner />

      <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="mb-3 inline-block border border-edge bg-deep px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-on-deep">
            The arcade
          </p>
          <h1 className="display-tight text-3xl uppercase text-balance sm:text-4xl">Games</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted text-pretty">
            Four of ours, and a shelf for yours. Everything here plays in the browser — no
            downloads, and no account needed unless you want a place on the board.
          </p>
        </div>

        <ButtonLink to="#host" variant="secondary">
          Host your game
        </ButtonLink>
      </header>

      {/* --------------------------------------------------------- cabinets */}
      <section aria-labelledby="ours" className="mb-14">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3 border-b border-edge pb-2">
          <h2 id="ours" className="font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
            Made by Deck
          </h2>
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
            {CABINET.length} games
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Deck's games"
          /* Four across at lg. Three columns with four cabinets leaves one
             stranded on its own row, which reads as a mistake. */
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {CABINET.map((entry) => {
            const active = playing === entry.key;
            return (
              <button
                key={entry.key}
                role="tab"
                type="button"
                aria-selected={active}
                aria-controls="cabinet-panel"
                onClick={() => setPlaying(entry.key)}
                className={cn(
                  'group flex items-center gap-3 rounded-slab border border-edge p-3 text-left transition-[transform,box-shadow] duration-[120ms] ease-[var(--ease-snap)]',
                  active
                    ? 'shadow-hard-lg -translate-x-0.5 -translate-y-0.5'
                    : 'shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg',
                )}
                style={{ background: entry.ground, color: entry.ink }}
              >
                <span
                  aria-hidden="true"
                  className="grid size-12 shrink-0 place-items-center rounded-[6px] border"
                  style={{ borderColor: entry.ink, background: 'rgba(0,0,0,0.16)' }}
                >
                  <GameLogo
                    mark={entry.key}
                    colour={entry.ink}
                    accent={entry.accent}
                    className="size-8"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-sm uppercase leading-tight">
                    {entry.name}
                  </span>
                  <span className="mt-0.5 block truncate font-mono text-[11px] uppercase tracking-[0.04em] opacity-75">
                    {entry.blurb}
                  </span>
                  <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.06em] opacity-60">
                    {formatNumber(playsBySlug.get(entry.slug) ?? 0)} plays
                    {active ? ' · playing' : ''}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div id="cabinet-panel" role="tabpanel" className="mt-6">
          {/*
           * Keyed, so switching cabinets unmounts the previous game.
           *
           * Without the key React would reuse the element and the old game's
           * rAF loop, key listeners and audio would keep running underneath the
           * new one — two games reading the arrow keys at once.
           */}
          {playing === 'sky-run' && <SkyRun key="sky-run" />}
          {playing === 'snakejo' && <Snakejo key="snakejo" />}
          {playing === 'block-drop' && <BlockDrop key="block-drop" />}
          {playing === 'speed-x' && <SpeedX key="speed-x" />}
        </div>
      </section>

      {/* ------------------------------------------------------------ shelf */}
      <section aria-labelledby="shelf">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3 border-b border-edge pb-2">
          <h2 id="shelf" className="font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
            From the community
          </h2>
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
            {shelf.length} {shelf.length === 1 ? 'game' : 'games'}
          </span>
        </div>

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((n) => (
              <Skeleton key={n} className="h-56 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message={error.message} onRetry={() => void refetch()} />
        ) : shelf.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shelf.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nobody has put a game up yet"
            description="The shelf is empty. If you have made something small and playable, it could be the first thing on it."
          />
        )}
      </section>

      <HostSection signedIn={Boolean(user)} />
    </div>
  );
}

function GameCard({ game }: { game: GameSummary }) {
  return (
    <Card interactive className="group relative flex flex-col overflow-hidden">
      <div
        className={cn(
          'relative aspect-[16/9] border-b border-edge bg-surface-2',
          !game.coverUrl && 'bg-stripes text-edge/20',
        )}
      >
        {game.coverUrl && (
          <img src={game.coverUrl} alt="" loading="lazy" className="size-full object-cover" />
        )}
        {game.featured && (
          <Badge tone="pop" className="absolute left-2 top-2">
            ★ Pick
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base uppercase leading-tight">
          <Link to={`/games/${game.slug}`} className="hover:underline">
            <span className="absolute inset-0 z-0" aria-hidden="true" />
            <span className="relative">{game.title}</span>
          </Link>
        </h3>

        <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-muted text-pretty">
          {game.tagline}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-sans text-[11px] font-bold uppercase tracking-[0.04em] text-muted">
          <span>{GAME_GENRE_LABELS[game.genre]}</span>
          <span aria-hidden="true" className="text-muted/50">
            /
          </span>
          <span className="tabular-nums">{formatNumber(game.plays)} plays</span>
          {game.author && (
            <>
              <span aria-hidden="true" className="text-muted/50">
                /
              </span>
              <span className="truncate">@{game.author.username}</span>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * The pitch for hosting, and what it actually involves.
 *
 * Written as terms rather than as marketing because the two questions somebody
 * with a game actually has are "what do you do with it" and "what do you take" —
 * and the honest answers here are "link to it" and "nothing". Saying that Deck
 * links out rather than embeds is the important one: it is a real limitation,
 * it is the safe choice, and burying it would waste the time of anybody
 * expecting their game to run inside the page.
 */
function HostSection({ signedIn }: { signedIn: boolean }) {
  return (
    <section
      id="host"
      aria-labelledby="host-heading"
      className="mt-16 scroll-mt-24 rounded-slab border border-edge bg-surface-2 p-6 sm:p-8"
    >
      <div className="max-w-2xl">
        <p className="mb-3 inline-block border border-edge bg-pop px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-on-pop">
          For makers
        </p>
        <h2 id="host-heading" className="display-tight text-2xl uppercase text-balance sm:text-3xl">
          Put your game on Deck
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted text-pretty">
          If you have made something small and playable, it can sit on the shelf above. Deck
          takes nothing, there is no exclusivity, and you keep the game.
        </p>
      </div>

      <dl className="mt-7 grid gap-x-8 gap-y-5 border-t border-edge pt-6 sm:grid-cols-2">
        <Term label="What we need">
          A name, a line about it, a few sentences on how it plays, and an https link to where
          it runs. A cover image helps but is not required.
        </Term>
        <Term label="What happens next">
          Staff read every submission before it appears — the same queue as fundraises and
          listings. If it is turned down you get a reason, and editing it puts it back in the
          queue.
        </Term>
        <Term label="Where it runs">
          On your site. By default the play button opens it in a new tab — your code running
          under Deck&apos;s header is exactly what a convincing fake sign-in page needs, and you
          could change the page after review. Staff can clear a game to run embedded instead,
          in a locked-down frame that cannot reach Deck; ask if you want that.
        </Term>
        <Term label="What it costs">
          Nothing. There is no revenue share because there is no revenue — the arcade exists
          because the people who launch here also build this sort of thing on weekends.
        </Term>
      </dl>

      <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-edge pt-6">
        {signedIn ? (
          <ButtonLink to="/settings/games">Submit a game</ButtonLink>
        ) : (
          <>
            <ButtonLink to="/register">Create an account</ButtonLink>
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
              needed so we can reach you about it
            </span>
          </>
        )}
      </div>
    </section>
  );
}

function Term({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-[11px] font-bold uppercase tracking-[0.08em]">{label}</dt>
      <dd className="mt-1.5 text-sm leading-relaxed text-muted text-pretty">{children}</dd>
    </div>
  );
}
