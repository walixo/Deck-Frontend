import { useEffect, useRef } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { CoverArt } from '@/components/deckgames/CoverArt';
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
 * Signed out, it is the pitch: what you get, what it costs, how to start.
 * Signed in, it is the desk: your games and their status, what you have
 * earned, and whether Deck can pay you yet.
 */
export function DevHome() {
  const { user } = useAuth();
  return (
    <div className="pb-24 pt-24 sm:pt-28">
      <title>Developers — Deck Games</title>
      {user ? <Desk /> : <Pitch />}
    </div>
  );
}

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

  return (
    <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-g-ember-ink">
        For developers
      </p>
      <h1 className="mt-4 max-w-3xl text-[clamp(2.5rem,6vw,5rem)] font-medium leading-[0.95] tracking-[-0.055em] text-balance">
        Ship the game. We’ll handle the rest.
      </h1>
      <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-g-mute text-pretty">
        Deck Games runs your web game in a player built for phones and laptops alike — portrait,
        landscape or both — with Deck’s players, store and payouts behind it.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Link
          to="/login"
          state={{ from: pathname }}
          className="rounded-[3px] bg-g-ember px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-g-on-ember shadow-[0_0_40px_4px] shadow-g-glow/30"
        >
          Sign in to start
        </Link>
        <Link
          to="/games/developers/docs"
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-g-ink underline-offset-[6px] hover:underline"
        >
          Read the docs →
        </Link>
      </div>

      <dl className="mt-20 grid gap-4 sm:grid-cols-3">
        {facts.map(([figure, text]) => (
          <div key={figure} className="rounded-3xl bg-g-paper-2 p-6">
            <dt className="text-4xl font-medium tracking-[-0.05em]">{figure}</dt>
            <dd className="mt-3 text-[13px] leading-relaxed text-g-mute">{text}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Desk() {
  const { user } = useAuth();
  const { data: games, isLoading } = useMyGames();
  const { data: earnings } = useSellerEarnings();

  return (
    <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
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
            className="rounded-[3px] bg-g-ember px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-g-on-ember"
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
                className="mt-5 inline-block rounded-[3px] bg-g-ink px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-g-paper"
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
