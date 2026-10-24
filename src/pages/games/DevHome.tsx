import '@fontsource/instrument-serif/latin-400.css';
import { useEffect, useRef } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { CoverArt } from '@/components/deckgames/CoverArt';
import { DevCube } from '@/components/deckgames/DevCube';
import { GButton, GCard, GNotice, StatusDot } from '@/components/deckgames/ui';
import { useAuth } from '@/hooks/useAuth';
import { useMyGames } from '@/hooks/useGames';
import {
  usePayoutAccount,
  useRefreshPayoutAccount,
  useSellerEarnings,
  useStartPayoutOnboarding,
} from '@/hooks/useSeller';
import { cn, formatMoney, formatNumber } from '@/lib/utils';
import { GAME_ORIENTATION_LABELS } from '@/types';

/**
 * `/games/developers` — the developer's home.
 *
 * It opens on a night hero for everyone — a serif headline and a slowly
 * turning cube. Signed out, the pitch follows: what you get, what it costs,
 * how to start. Signed in, the desk follows: your games and their status, what
 * you have earned, and whether Deck can pay you yet.
 */
export function DevHome() {
  const { user } = useAuth();
  return (
    <div className="pb-24">
      <title>Developers — Deck Games</title>
      <DevHero signedIn={Boolean(user)} />
      {user ? <Desk /> : <Pitch />}
    </div>
  );
}

/**
 * Set at night in both themes, like the arcade's own front door: the header
 * floats over it in light ink (see `GamesShell`). Colours are the fixed night
 * tokens, never the themed ones, so light mode cannot turn it to day.
 */
function DevHero({ signedIn }: { signedIn: boolean }) {
  const { pathname } = useLocation();
  return (
    <section
      className={cn(
        'relative isolate flex items-center overflow-hidden bg-g-night text-g-night-ink',
        signedIn ? 'min-h-[min(82svh,820px)]' : 'min-h-[100svh]',
      )}
    >
      {/* Light falling across the night from the top right, and a haze along
          the floor — the room the cube turns in. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-[10%] -top-[30%] h-[140%] w-[55%] rotate-[24deg] animate-[var(--animate-g-beam)] bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.07)_45%,rgb(255_255_255/0.02)_70%,transparent)] blur-2xl" />
        <div
          className="absolute -right-[25%] -top-[20%] h-[120%] w-[30%] rotate-[24deg] animate-[var(--animate-g-beam)] bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.05),transparent)] blur-3xl"
          style={{ animationDelay: '-6s' }}
        />
        <div className="absolute right-[12%] top-1/2 size-[36rem] -translate-y-1/2 rounded-full bg-g-glow/[0.06] blur-[120px]" />
        <div className="absolute -bottom-24 -left-[10%] h-48 w-[120%] -rotate-[4deg] bg-[linear-gradient(90deg,rgb(255_255_255/0.07),rgb(255_255_255/0.02)_60%,transparent)] blur-3xl" />
      </div>

      <div className="mx-auto grid w-full max-w-[1400px] items-center gap-12 px-4 pb-16 pt-28 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-6 lg:px-12 lg:pb-20">
        <div className="max-w-2xl">
          <Link
            to="/games/developers/docs#multiplayer"
            className="inline-flex animate-[var(--animate-g-rise)] rounded-full bg-[linear-gradient(90deg,rgb(255_106_61/0.55),rgb(155_123_255/0.45),rgb(63_209_193/0.45))] p-px"
          >
            <span className="flex items-center gap-2 rounded-full bg-[#0b0b0b] px-3.5 py-1.5 text-[13px] text-white/85 transition-colors hover:text-white">
              New: multiplayer rooms, built in
              <span aria-hidden="true" className="text-white/50">
                ›
              </span>
            </span>
          </Link>

          <h1
            className="mt-7 animate-[var(--animate-g-rise)] font-serif text-[clamp(3.25rem,7.2vw,6.6rem)] font-normal leading-[0.98] tracking-[-0.02em]"
            style={{ animationDelay: '90ms' }}
          >
            Ship the game.
            <span className="block bg-[linear-gradient(100deg,#f4f2ee_25%,#7d7b77_95%)] bg-clip-text pb-[0.08em] text-transparent">
              We do the rest.
            </span>
          </h1>

          <p
            className="mt-6 max-w-[34rem] animate-[var(--animate-g-rise)] text-[17px] leading-relaxed text-white/60 text-pretty"
            style={{ animationDelay: '180ms' }}
          >
            Host your web game anywhere and add one script. Deck brings the players, sign-in, store,
            multiplayer and payouts — and you keep 80% of every sale.
          </p>

          <div
            className="mt-9 flex animate-[var(--animate-g-rise)] flex-wrap items-center gap-2"
            style={{ animationDelay: '270ms' }}
          >
            {signedIn ? (
              <Link to="/games/developers/new" className={HERO_BUTTON}>
                New game
              </Link>
            ) : (
              <Link to="/login" state={{ from: pathname }} className={HERO_BUTTON}>
                Get started
              </Link>
            )}
            <Link
              to="/games/developers/docs"
              className="rounded-2xl px-5 py-3 text-[15px] font-medium text-white/60 transition-colors hover:text-white"
            >
              Documentation
            </Link>
          </div>
        </div>

        <DevCube className="mx-auto h-[min(80vw,30rem)] w-full animate-[var(--animate-g-fade)] lg:h-[34rem]" />
      </div>
    </section>
  );
}

const HERO_BUTTON =
  'rounded-2xl border border-white/15 bg-white/[0.08] px-5 py-3 text-[15px] font-medium text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] backdrop-blur transition-colors hover:bg-white/[0.14]';

function Pitch() {
  const { pathname } = useLocation();
  const facts = [
    [
      '80%',
      'of every in-game purchase is yours. Deck keeps 20% for hosting, review, players and payments.',
    ],
    [
      '1 script',
      'adds sign-in, purchases, scores and leaderboards. Host your game anywhere you like.',
    ],
    [
      '14 days',
      'after a sale, your share is transferred to your own Bachs account. Automatically.',
    ],
  ];

  const features = [
    [
      'Players and sign-in',
      'Every Deck player can play, signed in with GameID. Your game gets a stable player ID — never a password or an email.',
    ],
    [
      'Store and payouts',
      'Sell items and unlocks through Deck checkout. Prices, receipts and signed webhooks are handled; payouts arrive on their own.',
    ],
    [
      'Multiplayer rooms',
      'Codes, invite links and quick match, with live messages and shared state — no game server of your own required.',
    ],
    [
      'Portrait, landscape, full screen',
      'A player built for phones and laptops alike, in either orientation, expanding to full screen on any device.',
    ],
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
      <dl className="mt-20 grid gap-px overflow-hidden rounded-3xl border border-g-line bg-g-line sm:grid-cols-3">
        {facts.map(([figure, text]) => (
          <div key={figure} className="bg-g-paper p-7 sm:p-8">
            <dt className="font-serif text-[clamp(3rem,5vw,4.25rem)] font-normal leading-none tracking-[-0.02em]">
              {figure}
            </dt>
            <dd className="mt-4 max-w-xs text-[14px] leading-relaxed text-g-mute">{text}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="dev-features" className="mt-28">
        <h2
          id="dev-features"
          className="max-w-2xl font-serif text-[clamp(2.4rem,4.6vw,4rem)] font-normal leading-[1] tracking-[-0.02em] text-balance"
        >
          Everything a game needs, <span className="text-g-mute">already built.</span>
        </h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {features.map(([title, text], index) => (
            <div key={title} className="rounded-3xl border border-g-line p-7 sm:p-8">
              <p className="font-mono text-[11px] text-g-mute">0{index + 1}</p>
              <h3 className="mt-6 text-[22px] font-medium tracking-[-0.03em]">{title}</h3>
              <p className="mt-2 max-w-md text-[14px] leading-relaxed text-g-mute">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-28 flex flex-col items-start justify-between gap-8 rounded-3xl bg-g-night p-8 text-g-night-ink sm:p-12 lg:flex-row lg:items-end">
        <h2 className="max-w-2xl font-serif text-[clamp(2.4rem,4.6vw,4rem)] font-normal leading-[1] tracking-[-0.02em] text-balance">
          Your players are already here.
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/login" state={{ from: pathname }} className={HERO_BUTTON}>
            Get started
          </Link>
          <Link
            to="/games/developers/docs"
            className="rounded-2xl px-5 py-3 text-[15px] font-medium text-white/60 transition-colors hover:text-white"
          >
            Documentation
          </Link>
        </div>
      </section>
    </div>
  );
}

function Desk() {
  const { user } = useAuth();
  const { data: games, isLoading } = useMyGames();
  const { data: earnings } = useSellerEarnings();

  return (
    <div className="mx-auto mt-16 max-w-[1100px] px-4 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-g-mute">Developer</p>
          <h1 className="mt-2 text-[clamp(2rem,4.6vw,3.5rem)] font-medium leading-[1] tracking-[-0.05em]">
            {user?.name.split(' ')[0]}’s games
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/games/developers/docs"
            className="font-mono text-[10px] uppercase tracking-[0.16em] text-g-mute hover:text-g-ink"
          >
            Docs
          </Link>
          <Link
            to="/games/developers/new"
            className="glass-primary rounded-xl px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]"
          >
            New game
          </Link>
        </div>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-[1fr_22rem]">
        <section aria-label="Your games">
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1].map((row) => (
                <div key={row} className="h-28 animate-pulse rounded-3xl bg-g-paper-2" />
              ))}
            </div>
          ) : !games?.length ? (
            <GCard className="text-center">
              <p className="text-xl font-medium tracking-[-0.03em]">No games yet</p>
              <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-g-mute">
                Register your game, then build against test mode — you can buy things, get webhooks
                and verify players before anyone reviews it.
              </p>
              <Link
                to="/games/developers/new"
                className="glass-ink mt-5 inline-block rounded-xl px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]"
              >
                Register a game
              </Link>
            </GCard>
          ) : (
            <ul className="space-y-3">
              {games.map((game) => (
                <li key={game.id}>
                  <Link
                    to={`/games/developers/${game.slug}`}
                    className="group flex items-center gap-4 rounded-3xl border border-g-line p-3 pr-5 transition-colors duration-300 hover:border-g-ink"
                  >
                    <span className="size-20 shrink-0 overflow-hidden rounded-2xl">
                      <CoverArt game={game} showTitle={false} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-lg font-medium tracking-[-0.03em]">
                        {game.title}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-3">
                        <StatusDot status={game.status} />
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-g-mute">
                          {GAME_ORIENTATION_LABELS[game.orientation]}
                        </span>
                        {game.plays > 0 && (
                          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-g-mute">
                            {formatNumber(game.plays)} plays
                          </span>
                        )}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="text-g-mute transition-transform duration-300 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <GCard>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-g-mute">
              Earned from games
            </p>
            <p className="mt-2 text-4xl font-medium tracking-[-0.05em] tabular-nums">
              {formatMoney(earnings?.games.netMinor ?? 0, earnings?.currency ?? 'NGN')}
            </p>
            <p className="mt-1 text-[12px] text-g-mute">
              {earnings?.games.sales ?? 0} {earnings?.games.sales === 1 ? 'sale' : 'sales'} · your
              80%
            </p>
            {earnings && earnings.owedMinor > 0 && (
              <p className="mt-4 border-t border-g-line pt-4 text-[12px] leading-relaxed text-g-mute">
                {formatMoney(earnings.availableMinor, earnings.currency)} ready ·{' '}
                {formatMoney(earnings.heldMinor, earnings.currency)} in the {earnings.holdDays}-day
                hold. Includes anything owed from the shop or fundraises.
              </p>
            )}
          </GCard>
          <Payouts />
        </aside>
      </div>
    </div>
  );
}

/** Whether Deck can pay this developer, and the one button that fixes it. */
function Payouts() {
  const [params, setParams] = useSearchParams();
  const account = usePayoutAccount();
  const start = useStartPayoutOnboarding('games');
  const refresh = useRefreshPayoutAccount();
  const handled = useRef(false);

  const go = () => start.mutate(undefined, { onSuccess: ({ url }) => window.location.assign(url) });

  useEffect(() => {
    if (handled.current) return;
    const arrival = params.get('payouts');
    if (!arrival) return;
    handled.current = true;
    const next = new URLSearchParams(params);
    next.delete('payouts');
    setParams(next, { replace: true });
    if (arrival === 'returned') refresh.mutate();
    if (arrival === 'refresh') go();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on arrival
  }, []);

  const status = account.data?.status ?? 'none';
  const copy = {
    none: [
      'Set up payouts',
      'Connect a Bachs account so Deck can send your share. Your bank and ID details go to Bachs, never to Deck.',
    ],
    pending: [
      'Continue setup',
      'Bachs is checking your details. Sales keep counting meanwhile, and go out once transfers switch on.',
    ],
    active: ['Update bank details', 'You’re paid automatically once each sale clears the hold.'],
  }[status];

  return (
    <GCard>
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-g-mute">Payouts</p>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em]">
          {refresh.isPending
            ? 'Checking…'
            : status === 'active'
              ? 'Active'
              : status === 'pending'
                ? 'Pending'
                : 'Not set up'}
        </span>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-g-mute">{copy[1]}</p>
      {(start.error || refresh.error) && (
        <div className="mt-3">
          <GNotice tone="error">{(start.error ?? refresh.error)?.message}</GNotice>
        </div>
      )}
      <GButton
        className="mt-4"
        small
        tone={status === 'active' ? 'ghost' : 'ember'}
        loading={start.isPending}
        onClick={go}
      >
        {copy[0]}
      </GButton>
    </GCard>
  );
}
