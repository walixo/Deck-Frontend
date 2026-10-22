import { useCallback, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Player } from '@/components/deckgames/Player';
import { GCard, GNotice } from '@/components/deckgames/ui';
import { useDeveloperView } from '@/hooks/useGamePlatform';
import { cn } from '@/lib/utils';
import type { GameRoom } from '@/types';

/**
 * `/games/developers/:slug/sandbox` — test multiplayer with nobody else.
 *
 * Multiplayer needs several players and a developer is one person, so the
 * sandbox seats them several times: up to four copies of the game's test build
 * side by side, each a separate test player with its own `t_` id. Create a room
 * in one seat, join it from the others, and everything — the lobby, ready and
 * start, shared state, messages, the end — flows between them exactly as it
 * will between real players. Test mode throughout: nothing is charged, nothing
 * reaches the live leaderboard, and only the developer (and staff) can open it.
 */

const SEAT_CHOICES = [2, 3, 4];

export function DevSandbox() {
  const { slug = '' } = useParams();
  const { data: view, isLoading, error } = useDeveloperView(slug);
  const [seatCount, setSeatCount] = useState(2);
  const [generation, setGeneration] = useState(0);
  const [rooms, setRooms] = useState<Record<number, GameRoom | null>>({});

  const onRoom = useCallback(
    (seat: number) => (room: GameRoom | null) =>
      setRooms((current) => ({ ...current, [seat]: room })),
    [],
  );
  const handlers = useMemo(() => [0, 1, 2, 3].map((seat) => onRoom(seat)), [onRoom]);

  if (isLoading) {
    return (
      <div className="mx-auto mt-28 h-72 max-w-[1400px] animate-pulse rounded-3xl bg-g-paper-2 px-4" />
    );
  }
  if (error || !view) {
    return (
      <div className="mx-auto max-w-xl px-4 pb-24 pt-28">
        <GNotice tone="error">We could not open the sandbox for this game.</GNotice>
      </div>
    );
  }

  const game = view.game;
  const src = view.settings.testUrl || game.playUrl;
  const mp = view.settings.multiplayer;
  const maxSeats = Math.min(4, mp.maxPlayers);
  const seats = Array.from({ length: Math.min(seatCount, maxSeats) }, (_, i) => i);

  /* The room most seats are in, for the inspector. */
  const shared = Object.values(rooms)
    .filter((room): room is GameRoom => Boolean(room))
    .sort((a, b) => b.players.length - a.players.length)[0];

  return (
    <div className="mx-auto max-w-[1500px] px-4 pb-24 pt-24 sm:px-6 sm:pt-28">
      <title>{`Multiplayer sandbox — ${game.title}`}</title>
      <Link
        to={`/games/developers/${slug}`}
        className="font-mono text-[10px] uppercase tracking-[0.16em] text-g-mute hover:text-g-ink"
      >
        ← {game.title}
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-g-ember-ink">
            Multiplayer sandbox · test mode
          </p>
          <h1 className="mt-3 text-[clamp(2rem,4.5vw,3.5rem)] font-medium leading-[0.95] tracking-[-0.055em]">
            Play against yourself
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-g-mute text-pretty">
            Each seat is a separate test player. Create a room in one, join it from the others with
            its code or quick match, and watch messages and state move between them — exactly as
            they will between real players.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div
            className="flex rounded-full border border-g-line p-1"
            role="group"
            aria-label="Seats"
          >
            {SEAT_CHOICES.filter((n) => n <= maxSeats).map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={seatCount === n}
                onClick={() => setSeatCount(n)}
                className={cn(
                  'rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em]',
                  seatCount === n ? 'bg-g-ink text-g-paper' : 'text-g-mute hover:text-g-ink',
                )}
              >
                {n} seats
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setRooms({});
              setGeneration((g) => g + 1);
            }}
            className="glass-secondary rounded-xl px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]"
          >
            Reload seats
          </button>
        </div>
      </div>

      {!mp.enabled && (
        <div className="mt-8">
          <GNotice tone="info">
            Multiplayer is off for this game. Switch it on in{' '}
            <Link to={`/games/developers/${slug}`} className="underline underline-offset-2">
              Settings
            </Link>{' '}
            first.
          </GNotice>
        </div>
      )}

      {mp.enabled && src && (
        <>
          <div
            className={cn(
              'mt-8 grid gap-4',
              game.orientation === 'portrait'
                ? seats.length >= 4
                  ? 'grid-cols-2 xl:grid-cols-4'
                  : seats.length === 3
                    ? 'grid-cols-1 md:grid-cols-3'
                    : 'grid-cols-1 sm:grid-cols-2'
                : 'grid-cols-1 lg:grid-cols-2',
            )}
          >
            {seats.map((seat) => (
              <section
                key={`${generation}-${seat}`}
                aria-label={`Seat ${seat + 1}`}
                className="min-w-0"
              >
                <SeatLabel seat={seat} room={rooms[seat] ?? null} />
                <Player
                  game={game}
                  src={src}
                  mode="test"
                  seat={seat}
                  compact
                  onRoom={handlers[seat]}
                />
              </section>
            ))}
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <RoomInspector room={shared ?? null} />
            <HowToTest slug={slug} />
          </div>
        </>
      )}
    </div>
  );
}

function SeatLabel({ seat, room }: { seat: number; room: GameRoom | null }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3 px-1 font-mono text-[10px] uppercase tracking-[0.14em]">
      <span className="text-g-ink">
        Seat {seat + 1} · Test player {seat + 1}
      </span>
      <span className="truncate text-g-mute">
        {room
          ? `${room.code} · ${room.status} · ${room.players.length}/${room.maxPlayers}`
          : 'Not in a room'}
      </span>
    </div>
  );
}

function RoomInspector({ room }: { room: GameRoom | null }) {
  return (
    <GCard>
      <h2 className="text-lg font-medium tracking-[-0.03em]">Room</h2>
      {!room ? (
        <p className="mt-3 rounded-2xl bg-g-paper-2 px-4 py-6 text-center text-[13px] text-g-mute">
          No room yet. Create or quick-match one in any seat.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px]">
            <span>
              Code <b className="font-mono text-[15px] tracking-[0.12em]">{room.code}</b>
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-g-mute">
              {room.status} · {room.visibility} · {room.players.length}/{room.maxPlayers} players ·
              min {room.minPlayers}
            </span>
          </div>
          <ul className="divide-y divide-g-line rounded-2xl border border-g-line">
            {room.players.map((player) => (
              <li
                key={player.playerId}
                className="flex items-center justify-between gap-3 px-4 py-3 text-[13px]"
              >
                <span className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'size-2 rounded-full',
                      player.online ? 'bg-success' : 'bg-g-line',
                    )}
                  />
                  {player.displayName}
                  {player.host && (
                    <span className="rounded-full bg-g-ink px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-g-paper">
                      Host
                    </span>
                  )}
                </span>
                <span className="font-mono text-[11px] text-g-mute">
                  {player.ready ? 'ready · ' : ''}
                  {player.playerId}
                </span>
              </li>
            ))}
          </ul>
          <p className="font-mono text-[11px] text-g-mute">{room.roomId}</p>
          {room.state != null && (
            <pre className="max-h-48 overflow-auto rounded-2xl bg-g-night p-4 font-mono text-[11px] leading-relaxed text-g-night-ink">
              {JSON.stringify(room.state, null, 2)}
            </pre>
          )}
        </div>
      )}
    </GCard>
  );
}

function HowToTest({ slug }: { slug: string }) {
  return (
    <GCard>
      <h2 className="text-lg font-medium tracking-[-0.03em]">How to test</h2>
      <ol className="mt-4 space-y-3 text-[13px] leading-relaxed">
        {[
          <>
            Press play in every seat. Each one is a different test player with its own{' '}
            <code className="font-mono">t_</code> id.
          </>,
          <>
            In seat 1, create a room (<code className="font-mono">multiplayer.create()</code>) and
            read its code.
          </>,
          <>
            Join from the other seats with <code className="font-mono">multiplayer.join(code)</code>{' '}
            — or quick match in every seat with a public room.
          </>,
          <>
            Mark players ready, start as the host, and send messages and state. The room panel shows
            who is in, who is online, and the shared state.
          </>,
          <>
            Your server, with a <strong>test key</strong>, sees these rooms too:{' '}
            <code className="font-mono">GET /api/games/v1/rooms/:roomId</code>, then end one with
            results.
          </>,
          <>
            Inviting a friend live? Share <code className="font-mono">/games/{slug}?room=CODE</code>{' '}
            — the code arrives in <code className="font-mono">init()</code> as{' '}
            <code className="font-mono">invite</code>.
          </>,
        ].map((step, index) => (
          <li key={index} className="flex gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full border border-g-line font-mono text-[11px] text-g-mute">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </GCard>
  );
}
