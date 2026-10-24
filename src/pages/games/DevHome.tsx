import { useEffect, useRef } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { CoverArt } from '@/components/deckgames/CoverArt';
import { MorphShape } from '@/components/deckgames/MorphShape';
import { FrontHero } from '@/components/ui/FrontHero';
import { GButton, GCard, GNotice, StatusDot } from '@/components/deckgames/ui';
import { useAuth } from '@/hooks/useAuth';
import { useMyGames } from '@/hooks/useGames';
import {
  usePayoutAccount,
  useRefreshPayoutAccount,
  useSellerEarnings,
  useStartPayoutOnboarding,
} from '@/hooks/useSeller';
import { formatMoney, formatNumber } from '@/lib/utils';
import { GAME_ORIENTATION_LABELS } from '@/types';

/**
 * `/games/developers` — the developer's home.
 *
 * It opens on a night hero for everyone — the headline beside one glowing
 * shape, turning and becoming the next. Signed out, the pitch follows: what you get, what it costs,
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

function DevHero({ signedIn }: { signedIn: boolean }) {
  const { pathname } = useLocation();
  return (
    <FrontHero
      tall={!signedIn}
      pill={{ label: 'New · Multiplayer rooms →', to: '/docs/developers/multiplayer' }}
      title="Ship the game."
      fade="We do the rest."
      body="Host your web game anywhere and add one script. Deck brings the players, sign-in, store, multiplayer and payouts — and you keep 80% of every sale."
      primary={
        signedIn
          ? { label: 'New game', to: '/games/developers/new' }
          : { label: 'Get started', to: '/login', state: { from: pathname } }
      }
      secondary={{ label: 'Documentation →', to: '/docs/developers' }}
      visual={<MorphShape className="mx-auto aspect-square w-full max-w-[34rem]" />}
    />
  );
}

const HERO_BUTTON =
  'glass-primary rounded-xl px-5 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em]';

const HERO_LINK =
  'px-4 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70 transition-colors hover:text-white';

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
            <dt className="text-[clamp(2.75rem,4.6vw,4rem)] font-semibold leading-none tracking-[-0.055em]">
              {figure}
            </dt>
            <dd className="mt-4 max-w-xs text-[14px] leading-relaxed text-g-mute">{text}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="dev-features" className="mt-28">
        <h2
          id="dev-features"
          className="max-w-2xl text-[clamp(2.2rem,4.2vw,3.5rem)] font-semibold leading-[1] tracking-[-0.05em] text-balance"
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
        <h2 className="max-w-2xl text-[clamp(2.2rem,4.2vw,3.5rem)] font-semibold leading-[1] tracking-[-0.05em] text-balance">
          Your players are already here.
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/login" state={{ from: pathname }} className={HERO_BUTTON}>
            Get started
          </Link>
          <Link to="/docs/developers" className={HERO_LINK}>
            Documentation →
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
            to="/docs/developers"
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
          <GCard>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-g-mute">
              Deck Circuit
            </p>
            <p className="mt-2 text-[15px] font-semibold tracking-[-0.02em]">
              Build a challenge for AI agents
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-g-mute">
              Host it yourself or upload WebAssembly. Deck keeps the clock and the board.
            </p>
            <Link
              to="/games/developers/challenges"
              className="glass-secondary mt-4 inline-flex px-3.5 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]"
            >
              Your challenges
            </Link>
          </GCard>
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
