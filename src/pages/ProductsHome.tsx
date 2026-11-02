import { Link } from 'react-router-dom';
import { MorphShape } from '@/components/deckgames/MorphShape';
import { GameLogo } from '@/components/games/GameLogo';
import { ArcadeCoda } from '@/components/home/ArcadeCoda';
import { BrickDivider } from '@/components/ui/Bricks';
import { ButtonLink } from '@/components/ui/Button';
import { FrontHero } from '@/components/ui/FrontHero';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGames } from '@/hooks/useGames';
import { matchUrl } from '@/lib/matchUrl';
import type { GameSummary } from '@/types';

/**
 * The landing page while Deck leads with its own products: Match and Deck
 * Games. The launch board's landing page is still there for when launches come
 * back; staff pick between the two under Admin → Site.
 *
 * Same front door as every other Deck page — the shared hero — then one panel
 * per product, the developer way in, and the arcade game as a coda.
 */

export function ProductsHome() {
  const match = matchUrl();
  return (
    <>
      <FrontHero
        tall
        pill={{ label: 'Match is live every night · 8–10pm Lagos', href: match }}
        title="Things to play"
        fade="and people to talk to."
        body="Match puts two strangers on a two-minute voice call. Deck Games puts games made across Africa a tap away. Free to start, nothing to install."
        primary={{ label: 'Try Match', href: match }}
        secondary={{ label: 'Play Deck Games →', to: '/games' }}
        backdrop={<DuoLight />}
        visual={<ProductPair />}
      />
      <MatchPanel href={match} />
      <GamesPanel />
      <BrickDivider className="pt-4 text-edge/25" />
      <Developers />
      <ArcadeCoda eyebrow="While you’re here" />
    </>
  );
}

/** Pink from Match on one side, amber from the arcade on the other. */
function DuoLight() {
  return (
    <>
      <div className="absolute inset-0 bg-[#060506]" />
      <div className="absolute -left-[10%] top-[5%] size-[55vmax] rounded-full bg-[radial-gradient(circle,rgb(255_92_138/0.32),transparent_60%)] blur-3xl" />
      <div className="absolute -right-[12%] bottom-[-10%] size-[55vmax] animate-g-breathe rounded-full bg-[radial-gradient(circle,rgb(255_190_110/0.28),transparent_60%)] blur-3xl" />
    </>
  );
}

/** The two products as cards, overlapping, in the hero. */
function ProductPair() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[26rem]">
      <div className="absolute left-0 top-[6%] w-[62%] -rotate-6 rounded-[28px] border border-white/10 bg-[#0b0a09] p-5 shadow-[0_30px_80px_rgb(0_0_0/0.6)]">
        <p className="flex items-baseline gap-1.5 text-white">
          <span className="text-2xl font-semibold tracking-[-0.06em]">match</span>
          <span className="size-1.5 rounded-full bg-[#ff5c8a]" />
        </p>
        <MorphShape set="love" className="mx-auto -my-2 aspect-square w-full" />
        <p className="text-center text-[13px] text-white/70">Two voices. Two minutes.</p>
      </div>
      <div className="absolute bottom-[4%] right-0 w-[60%] rotate-[5deg] rounded-[28px] border border-white/10 bg-[radial-gradient(120%_90%_at_30%_20%,#3a2410,#0d0906)] p-5 shadow-[0_30px_80px_rgb(0_0_0/0.6)]">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ffcf8a]">
          Deck Games
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            ['sky-run', '#ffcf8a'],
            ['snakejo', '#9be7a1'],
            ['block-drop', '#8ec5ff'],
            ['speed-x', '#ff9a8a'],
          ].map(([mark, colour]) => (
            <div
              key={mark}
              className="grid aspect-square place-items-center rounded-2xl bg-white/[0.06]"
            >
              <GameLogo mark={mark} colour={colour} className="w-1/2" />
            </div>
          ))}
        </div>
        <p className="mt-3 text-[13px] text-white/70">Play in a tap.</p>
      </div>
    </div>
  );
}

/** Match: what it is, how it works, the way in. Night colours, like Match itself. */
function MatchPanel({ href }: { href: string }) {
  const points = [
    ['No photos, no profiles', 'Just a voice. You hear each other before anything else.'],
    ['Every night, 8–10pm', 'Lagos time. Men meet women, women meet men.'],
    ['Liked them? Swap socials', 'Your X or Instagram — revealed only if you both tap.'],
  ];
  return (
    <section className="dark relative isolate overflow-hidden bg-[#0b0a09] text-white">
      <div
        aria-hidden="true"
        className="absolute -top-40 left-1/2 -z-10 size-[44rem] -translate-x-1/2 rounded-full bg-[#ff5c8a]/15 blur-3xl"
      />
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ff8fab]">
            Match · by Deck
          </p>
          <h2 className="mt-4 text-[clamp(2.5rem,7vw,4.25rem)] font-semibold leading-[0.95] tracking-[-0.05em]">
            Two voices.
            <span className="block text-white/45">Two minutes.</span>
          </h2>
          <ul className="mt-8 space-y-5">
            {points.map(([title, body]) => (
              <li key={title} className="flex gap-4">
                <span className="mt-2 size-2 shrink-0 rounded-full bg-[linear-gradient(120deg,#ff5c8a,#b77cff)]" />
                <span>
                  <span className="block text-[17px] font-medium">{title}</span>
                  <span className="mt-0.5 block text-[15px] text-white/60">{body}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href={href}
              className="inline-flex items-center rounded-full bg-[linear-gradient(120deg,#ff5c8a,#ff7a8f_45%,#b77cff)] px-7 py-4 text-[15px] font-semibold text-white shadow-[0_14px_40px_rgb(255_92_138/0.38)] transition-transform hover:-translate-y-0.5 active:scale-[0.97]"
            >
              Find someone tonight
            </a>
            <span className="text-[13px] text-white/50">Voice only · never recorded · 18+</span>
          </div>
        </div>
        <MorphShape set="love" className="mx-auto aspect-square w-full max-w-[24rem]" />
      </div>
    </section>
  );
}

/** Deck Games: a shelf of real games from the library, and the two ways in. */
function GamesPanel() {
  const { data, isLoading } = useGames();
  const shelf = (data ?? [])
    .filter((game) => game.status === 'approved')
    .sort((a, b) => Number(b.featured) - Number(a.featured) || b.plays - a.plays)
    .slice(0, 4);
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
              Deck Games
            </p>
            <h2 className="display-tight mt-3 text-4xl text-balance sm:text-5xl">
              A new era of play.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted text-pretty">
              Games made across Africa and the world, ready in a tap — portrait on your phone,
              landscape on your laptop. Play alone, or open a room and play live with friends.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink to="/games" size="lg">
              Play now
            </ButtonLink>
            <ButtonLink to="/games/rooms" variant="secondary" size="lg">
              Open a room
            </ButtonLink>
          </div>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="aspect-[4/5] w-full rounded-slab" />
              ))
            : shelf.map((game) => <GameTile key={game.id} game={game} />)}
        </div>
      </div>
    </section>
  );
}

function GameTile({ game }: { game: GameSummary }) {
  return (
    <Link
      to={`/games/${game.slug}`}
      className="group block overflow-hidden rounded-slab border border-line bg-surface shadow-hard transition-transform hover:-translate-y-1"
    >
      <div className="grid aspect-[4/3] place-items-center overflow-hidden bg-surface-2">
        {game.coverUrl ? (
          <img
            src={game.coverUrl}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <GameLogo mark={game.component ?? ''} className="w-1/3 text-edge" />
        )}
      </div>
      <div className="p-4">
        <p className="font-medium">{game.title}</p>
        <p className="mt-0.5 line-clamp-1 text-[13px] text-muted">{game.tagline}</p>
      </div>
    </Link>
  );
}

/** The developer way in: build on Deck Games, sign players in with GameID. */
function Developers() {
  const doors = [
    {
      to: '/games/developers',
      title: 'Build a game',
      body: 'Put your game in front of players, sell in-game items, and keep 80% of every sale.',
    },
    {
      to: '/gameid',
      title: 'GameID',
      body: 'One player account across games: sign-in, profiles and saves you do not have to build.',
    },
    {
      to: '/docs',
      title: 'Docs',
      body: 'The SDK, the APIs and the guides, in one place.',
    },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <h2 className="display-tight text-2xl text-balance sm:text-3xl">For developers</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {doors.map((door) => (
          <Link
            key={door.to}
            to={door.to}
            className="block rounded-slab border border-line bg-surface p-5 shadow-hard transition-transform hover:-translate-y-0.5"
          >
            <p className="font-medium">{door.title} →</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-muted text-pretty">{door.body}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
