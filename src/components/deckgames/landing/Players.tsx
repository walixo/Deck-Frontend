import { Link } from 'react-router-dom';
import { useActivePlayers } from '@/hooks/useGames';
import { cn, relativeTime } from '@/lib/utils';

/**
 * Who is in the arcade: how many are playing right now, how many came this
 * week, and the players themselves by their GameID handles — each one
 * showing the game they are in or last played.
 *
 * Only players with a GameID are named; everyone else is in the counts.
 */
export function Players() {
  const { data } = useActivePlayers();
  const players = data?.players ?? [];

  return (
    <section aria-labelledby="players-title" className="bg-g-paper px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-[1100px]">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-g-ember-ink">
              In the arcade
            </p>
            <h2
              id="players-title"
              className="mt-4 text-[clamp(2rem,4.6vw,3.5rem)] font-semibold leading-[1] tracking-[-0.055em]"
            >
              Who’s playing
            </h2>
          </div>
          <dl className="flex gap-10">
            <div>
              <dt className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-g-mute">
                <span
                  aria-hidden="true"
                  className={cn(
                    'size-2 rounded-full',
                    data?.playingNow ? 'animate-g-breathe bg-g-teal' : 'bg-g-line',
                  )}
                />
                Playing now
              </dt>
              <dd className="mt-1 text-4xl font-semibold tracking-[-0.05em] tabular-nums">
                {data?.playingNow ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-g-mute">
                This week
              </dt>
              <dd className="mt-1 text-4xl font-semibold tracking-[-0.05em] tabular-nums">
                {data?.thisWeek ?? '—'}
              </dd>
            </div>
          </dl>
        </div>

        {players.length ? (
          <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((player) => (
              <li key={player.handle}>
                <Link
                  to={`/games/${player.game.slug}`}
                  className="group flex items-center gap-3 rounded-2xl border border-g-line p-3 pr-4 transition-colors duration-300 hover:border-g-ink"
                >
                  <span className="relative shrink-0">
                    <span className="grid size-11 place-items-center overflow-hidden rounded-full bg-g-paper-2 font-mono text-[11px] uppercase text-g-mute">
                      {player.avatarUrl ? (
                        <img src={player.avatarUrl} alt="" className="size-full object-cover" />
                      ) : (
                        player.handle.slice(0, 2)
                      )}
                    </span>
                    {player.playingNow && (
                      <span
                        aria-hidden="true"
                        className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-g-paper bg-g-teal"
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold tracking-[-0.02em]">
                      @{player.handle}
                    </span>
                    <span className="block truncate text-[12px] text-g-mute">
                      {player.playingNow ? 'Playing' : 'Played'} {player.game.title}
                      {!player.playingNow && ` · ${relativeTime(player.lastSeenAt)}`}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-12 rounded-3xl border border-dashed border-g-line px-6 py-12 text-center">
            <p className="text-lg font-semibold tracking-[-0.03em]">
              The arcade is quiet right now
            </p>
            <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-g-mute">
              Pick a game and you’re the first face here. Players with a GameID show up by their
              handle.
            </p>
            <a
              href="#library"
              className="mt-5 inline-block font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-g-ember-ink"
            >
              Play now →
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
