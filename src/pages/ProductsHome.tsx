import { Link } from 'react-router-dom';
import { MorphShape } from '@/components/deckgames/MorphShape';
import { GameLogo } from '@/components/games/GameLogo';
import { ArcadeCoda } from '@/components/home/ArcadeCoda';
import { BrickDivider } from '@/components/ui/Bricks';
import { ExternalButtonLink } from '@/components/ui/Button';
import { FrontHero } from '@/components/ui/FrontHero';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGames } from '@/hooks/useGames';
import { cn } from '@/lib/utils';
import { VaultMark } from '@/vault/VaultMark';
import { gamesUrl, matchUrl, vaultUrl } from '@/lib/siblings';
import type { GameSummary } from '@/types';

/**
 * The landing page while Deck leads with its own products: Match, Deck Games
 * and Vault. The launch board's landing page is still there for when launches
 * come back; staff pick between the two under Admin → Site.
 *
 * Same front door as every other Deck page — the shared hero — then the thread
 * that ties the three together, one panel per product, the developer way in,
 * and the arcade game as a coda.
 *
 * The order of the panels is the order of the argument: the thing people come
 * for (Match), the thing they stay for (Games), then the thing a business
 * builds on (Vault). Vault last is deliberate — it is the only one that asks
 * the reader to be a company rather than a person.
 */

export function ProductsHome() {
  const match = matchUrl();
  const vault = vaultUrl();
  /* This page is only ever served from Deck itself, so every link into the
     arcade leaves the origin. Plain anchors, not router links. */
  const games = gamesUrl();
  return (
    <>
      <FrontHero
        tall
        pill={{ label: 'Match is live every night · 8–10pm Lagos', href: match }}
        title="Play, talk,"
        fade="and send."
        body="Three products, one account. Match puts two strangers on a two-minute voice call. Deck Games puts games made across Africa a tap away. Vault lets any business sell a gift card — and anyone buy one and send it."
        primary={{ label: 'Try Match', href: match }}
        secondary={{ label: 'Play Deck Games →', href: games }}
        backdrop={<TrioLight />}
        visual={<ProductTrio games={games} match={match} vault={vault} />}
      />
      <Thread games={games} match={match} vault={vault} />
      <MatchPanel href={match} />
      <GamesPanel games={games} />
      <VaultPanel href={vault} />
      <BrickDivider className="pt-4 text-edge/25" />
      <Developers games={games} vault={vault} />
      <ArcadeCoda eyebrow="While you’re here" />
    </>
  );
}

/**
 * What the three have in common, said once and plainly.
 *
 * Without this the page is a list of unrelated things that happen to share a
 * logo. The claim is not that they are the same product; it is that they share
 * an account, a design system and a set of keys, and that each is usable
 * tonight and buildable on tomorrow.
 */
function Thread({ games, match, vault }: { games: string; match: string; vault: string }) {
  const strands = [
    {
      verb: 'Play',
      name: 'Deck Games',
      body: 'Games made across Africa and the world, ready in a tap. No install, no store.',
      href: games,
    },
    {
      verb: 'Talk',
      name: 'Match',
      body: 'Two strangers, two minutes, voice only. Every night, 8–10pm Lagos.',
      href: match,
    },
    {
      verb: 'Send',
      name: 'Vault',
      body: 'Gift cards from any business — buy one for someone, or sell your own.',
      href: vault,
    },
  ];
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
          One Deck
        </p>
        <h2 className="display-tight mt-3 max-w-3xl text-3xl text-balance sm:text-4xl">
          Something to do, someone to talk to, and a way to send value.
        </h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted text-pretty">
          Deck builds consumer products for Africa and opens every one of them as a platform. The
          same account plays a game, joins a call and holds a gift card; the same keys and the same
          docs let you build on any of it.
        </p>

        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {strands.map((strand, index) => {
            const inner = (
              <>
                <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
                  {String(index + 1).padStart(2, '0')} · {strand.name}
                </span>
                <span className="display-tight mt-2 block text-2xl">{strand.verb}</span>
                <span className="mt-2 block text-[14px] leading-relaxed text-muted text-pretty">
                  {strand.body}
                </span>
              </>
            );
            const className =
              'block rounded-slab border border-line bg-surface p-5 shadow-hard transition-transform hover:-translate-y-0.5';
            return (
              <li key={strand.verb}>
                <a href={strand.href} className={className}>
                  {inner}
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/** Pink from Match, amber from the arcade, and indigo from Vault between them. */
function TrioLight() {
  return (
    <>
      <div className="absolute inset-0 bg-[#060506]" />
      <div className="absolute -left-[10%] top-[5%] size-[55vmax] rounded-full bg-[radial-gradient(circle,rgb(255_92_138/0.32),transparent_60%)] blur-3xl" />
      <div className="absolute -right-[12%] bottom-[-10%] size-[55vmax] animate-g-breathe rounded-full bg-[radial-gradient(circle,rgb(255_190_110/0.28),transparent_60%)] blur-3xl" />
      <div className="absolute left-1/2 top-1/2 size-[46vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(87_105_247/0.26),transparent_62%)] blur-3xl" />
    </>
  );
}

/**
 * The three products as cards, overlapping, in the hero — and each one a way
 * in, because with three of them the two hero buttons can no longer reach
 * everything the headline just promised.
 *
 * Only Match carries a shader here. A second ray-marcher beside it would
 * double the hero's cost for a card the eye reads as a gift card either way,
 * so Vault's is drawn flat; its morph gets a section of its own further down,
 * where nothing else is competing for the frame.
 */
const HERO_CARD =
  'absolute block rounded-[28px] border border-white/10 shadow-[0_30px_80px_rgb(0_0_0/0.6)] ' +
  'transition-transform duration-500 ease-[var(--ease-snap)] hover:-translate-y-1';

function ProductTrio({ games, match, vault }: { games: string; match: string; vault: string }) {
  return (
    <div className="relative mx-auto aspect-[5/6] w-full max-w-[25rem]">
      <a
        href={match}
        aria-label="Match — two voices, two minutes"
        className={cn(HERO_CARD, 'left-0 top-0 w-[54%] -rotate-6 bg-[#0b0a09] p-5')}
      >
        <p className="flex items-baseline gap-1.5 text-white">
          <span className="text-2xl font-semibold tracking-[-0.06em]">match</span>
          <span className="size-1.5 rounded-full bg-[#ff5c8a]" />
        </p>
        <MorphShape set="love" className="mx-auto -my-2 aspect-[4/3] w-full" />
        <p className="text-center text-[13px] text-white/70">Two voices. Two minutes.</p>
      </a>

      <a
        href={games}
        aria-label="Deck Games — play in a tap"
        className={cn(
          HERO_CARD,
          'right-0 top-[19%] w-[52%] rotate-[5deg] bg-[radial-gradient(120%_90%_at_30%_20%,#3a2410,#0d0906)] p-5',
        )}
      >
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
        {/* Right-aligned: the Vault card in front clips this one's left edge. */}
        <p className="mt-3 text-right text-[13px] text-white/70">Play in a tap.</p>
      </a>

      <a
        href={vault}
        aria-label="Vault — gift cards from any business"
        className={cn(
          HERO_CARD,
          'bottom-0 left-[2%] w-[52%] rotate-[-3deg] bg-[radial-gradient(120%_90%_at_25%_15%,#1b1f4d,#07080f)] p-5',
        )}
      >
        <p className="flex items-center gap-2 text-white">
          <VaultMark className="size-[18px]" />
          <span className="text-[17px] font-semibold tracking-[-0.04em]">Vault</span>
        </p>
        <div className="mt-4 rounded-2xl bg-[linear-gradient(115deg,#5769f7,#a366f0_52%,#f0528f)] p-px">
          <div className="rounded-[15px] bg-[#0b0c18] px-3.5 py-3">
            <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-white/45">
              Gift card
            </span>
            <span className="mt-1.5 block font-display text-xl tabular-nums text-white">
              ₦10,000
            </span>
            <span className="mt-2 block truncate font-mono text-[10px] tracking-[0.1em] text-white/35">
              VLT-6V5K-••••-APQX
            </span>
          </div>
        </div>
        <p className="mt-3 text-[13px] text-white/70">Buy one. Send it.</p>
      </a>
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
function GamesPanel({ games }: { games: string }) {
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
            <ExternalButtonLink href={games} size="lg">
              Play now
            </ExternalButtonLink>
            <ExternalButtonLink href={`${games}/games/rooms`} variant="secondary" size="lg">
              Open a room
            </ExternalButtonLink>
          </div>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="aspect-[4/5] w-full rounded-slab" />
              ))
            : shelf.map((game) => <GameTile key={game.id} game={game} games={games} />)}
        </div>
      </div>
    </section>
  );
}

function GameTile({ game, games }: { game: GameSummary; games: string }) {
  return (
    <a
      href={`${games}/games/${game.slug}`}
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
    </a>
  );
}

/**
 * Vault: the two sides of it, and the way in for each.
 *
 * On `deep` rather than a hand-mixed night colour. Match's panel is allowed
 * its own pink because Match is its own world; Vault wears Deck's design
 * system, so it takes Deck's own block token — and a block brings its own text
 * with it, which is why nothing here needs a `dark` class to stay readable.
 */
function VaultPanel({ href }: { href: string }) {
  const points = [
    [
      'Sell your own gift card',
      'Set your amounts and the discount you offer. Vault mints the codes, holds the balances and handles redemption — or calls your system to mint them.',
    ],
    [
      'Or resell everyone else’s',
      'One integration reaches every merchant on Vault. Prepay a wallet, place an order, get the codes back in the same response.',
    ],
    [
      'Send one to someone',
      'Every live merchant has a shop. Buy a card, add a message, and it is delivered the moment the payment clears.',
    ],
  ];
  return (
    <section className="relative isolate overflow-hidden bg-deep text-on-deep">
      <div
        aria-hidden="true"
        className="absolute -top-40 left-1/2 -z-10 size-[44rem] -translate-x-1/2 rounded-full bg-pop/20 blur-3xl"
      />
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div>
          <p className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-on-deep/70">
            <VaultMark className="size-4" />
            Vault · by Deck
          </p>
          <h2 className="mt-4 text-[clamp(2.5rem,7vw,4.25rem)] font-semibold leading-[0.95] tracking-[-0.05em]">
            Any card.
            <span className="block text-on-deep/45">One API.</span>
          </h2>
          <ul className="mt-8 space-y-5">
            {points.map(([title, body]) => (
              <li key={title} className="flex gap-4">
                <span className="mt-2 size-2 shrink-0 rounded-full bg-[linear-gradient(120deg,#5769f7,#a366f0)]" />
                <span>
                  <span className="block text-[17px] font-medium">{title}</span>
                  <span className="mt-0.5 block text-[15px] text-on-deep/60">{body}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href={href}
              className="inline-flex items-center rounded-full bg-[linear-gradient(120deg,#5769f7,#7d6bf4_45%,#a366f0)] px-7 py-4 text-[15px] font-semibold text-white shadow-[0_14px_40px_rgb(87_105_247/0.4)] transition-transform hover:-translate-y-0.5 active:scale-[0.97]"
            >
              Open Vault
            </a>
            <a
              href={`${href}/docs`}
              className="text-[13px] text-on-deep/60 underline-offset-4 hover:text-on-deep hover:underline"
            >
              Read the API docs →
            </a>
          </div>
        </div>
        <MorphShape set="gift" className="mx-auto aspect-square w-full max-w-[24rem]" />
      </div>
    </section>
  );
}

/** The developer way in: build on Deck Games, sign players in with GameID. */
function Developers({ games, vault }: { games: string; vault: string }) {
  const doors = [
    {
      href: `${games}/games/developers`,
      title: 'Build a game',
      body: 'Put your game in front of players, sell in-game items, and keep 80% of every sale.',
    },
    {
      href: `${games}/gameid`,
      title: 'GameID',
      body: 'One player account across games: sign-in, profiles and saves you do not have to build.',
    },
    {
      href: `${vault}/docs`,
      title: 'Vault API',
      body: 'Issue gift cards, or buy from every merchant on Vault through a single integration.',
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
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {doors.map((door) => {
          const className =
            'block rounded-slab border border-line bg-surface p-5 shadow-hard transition-transform hover:-translate-y-0.5';
          const inner = (
            <>
              <p className="font-medium">{door.title} →</p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted text-pretty">
                {door.body}
              </p>
            </>
          );
          /* All but the docs are on another origin now, so those are anchors. */
          return door.to ? (
            <Link key={door.title} to={door.to} className={className}>
              {inner}
            </Link>
          ) : (
            <a key={door.title} href={door.href} className={className}>
              {inner}
            </a>
          );
        })}
      </div>
    </section>
  );
}
