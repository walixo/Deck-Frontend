import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CoverArt } from '@/components/deckgames/CoverArt';
import { FrontHero } from '@/components/ui/FrontHero';
import { useAuth } from '@/hooks/useAuth';
import { useFindRoom, useMyRooms, useRoomDirectory, useStartRoom } from '@/hooks/useGames';
import { cn } from '@/lib/utils';
import type { RoomCard, RoomDirectory } from '@/types';

/**
 * `/games/rooms` — where players find each other.
 *
 * Rooms are made and played inside games, through the SDK; this page is the
 * lobby outside them. It lists the public rooms waiting for players, the rooms
 * you already have a seat in, and every game that can be played together, and
 * it turns a six-character code into the right game.
 *
 * Every way in ends the same way: open the game at `?room=CODE`. The game is
 * handed the code on init and joins it, so this page never has to know how any
 * particular game draws its lobby. Starting a room makes it here first, with
 * you as host, and then opens the game into it.
 *
 * The lists refresh every few seconds while the page is open. A room only shows
 * as waiting while somebody in it actually has the game open.
 */

const CODE = /^[23456789A-HJ-NP-Z]{6}$/;
const roomUrl = (slug: string, code: string) => `/games/${slug}?room=${code}`;

export function Rooms() {
  const { data, isLoading } = useRoomDirectory();
  const playersNow = data?.games.reduce((sum, game) => sum + game.playersNow, 0) ?? 0;
  return (
    <>
      <title>Rooms — play together · Deck Games</title>
      <meta
        name="description"
        content="Find an open room in a multiplayer game on Deck, start your own, or join a friend with a six-character code."
      />
      <FrontHero
        tall={false}
        pill={{
          label: playersNow
            ? `${playersNow} playing together now`
            : 'New · Rooms for every multiplayer game',
          href: '#open',
        }}
        title="Play together."
        fade="Pick a seat."
        body="Find an open room, start your own, or enter the code a friend sent you. Rooms are run by Deck, so every multiplayer game here works the same way."
        primary={{ label: 'Start a room', href: '#start' }}
        secondary={{ label: 'Open rooms →', href: '#open' }}
        visual={<CodeCard directory={data} />}
      />
      <MyRooms />
      <OpenRooms rooms={data?.rooms} loading={isLoading} />
      <StartRoom games={data?.games} loading={isLoading} />
      <Builders />
    </>
  );
}

/* ------------------------------------------------------------ the code --- */

function CodeCard({ directory }: { directory?: RoomDirectory }) {
  const navigate = useNavigate();
  const find = useFindRoom();
  const [code, setCode] = useState('');
  const [problem, setProblem] = useState('');
  const open = directory?.rooms.length ?? 0;
  const playing = directory?.games.reduce((sum, game) => sum + game.playing, 0) ?? 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = code.trim().toUpperCase();
    if (!CODE.test(value)) {
      setProblem('Room codes are six letters and numbers.');
      return;
    }
    setProblem('');
    find.mutate(value, {
      onSuccess: (room) => {
        if (room.status === 'playing') setProblem('That game has already started.');
        else if (room.seats >= room.maxPlayers) setProblem('That room is full.');
        else navigate(roomUrl(room.game.slug, room.code));
      },
      onError: (error) => setProblem(error.message),
    });
  };

  return (
    <form
      onSubmit={submit}
      className="mx-auto w-full max-w-[30rem] rounded-[10px] border-2 border-[#f4f2ee] bg-[#0d0d0d] p-6 shadow-[8px_8px_0_#f4f2ee] sm:p-8"
    >
      <label htmlFor="room-code" className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/60">
        Have a code?
      </label>
      <input
        id="room-code"
        value={code}
        onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^0-9A-Z]/g, ''))}
        maxLength={6}
        autoComplete="off"
        spellCheck={false}
        placeholder="K7Q2XM"
        className="mt-3 w-full rounded-[6px] border-2 border-[#f4f2ee] bg-[#050505] px-4 py-3 font-mono text-[clamp(2rem,6vw,2.75rem)] font-semibold uppercase tracking-[0.22em] text-white outline-none placeholder:text-white/20 focus-visible:border-g-glow"
      />
      <p role="status" className="mt-3 min-h-5 text-[13px] text-g-glow">
        {problem}
      </p>
      <button
        type="submit"
        disabled={find.isPending}
        className="glass-primary mt-2 w-full rounded-xl px-5 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] disabled:opacity-60"
      >
        {find.isPending ? 'Finding the room…' : 'Join the room'}
      </button>
      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10">
        {[
          [open, open === 1 ? 'room waiting' : 'rooms waiting'],
          [playing, playing === 1 ? 'game in progress' : 'games in progress'],
        ].map(([figure, label]) => (
          <div key={label} className="bg-[#0d0d0d] px-4 py-3">
            <dt className="font-mono text-2xl font-semibold tabular-nums">{figure}</dt>
            <dd className="text-[12px] text-white/55">{label}</dd>
          </div>
        ))}
      </dl>
    </form>
  );
}

/* ----------------------------------------------------------- the lists --- */

function MyRooms() {
  const { user } = useAuth();
  const { data } = useMyRooms(Boolean(user));
  if (!data?.length) return null;
  return (
    <Section eyebrow="Your rooms" title="Pick up where you left off" tone="paper">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((room) => (
          <li key={room.code}>
            <RoomTile room={room} action="Rejoin" />
          </li>
        ))}
      </ul>
    </Section>
  );
}

function OpenRooms({ rooms, loading }: { rooms?: RoomCard[]; loading: boolean }) {
  return (
    <Section
      id="open"
      eyebrow="Open rooms"
      title="Waiting for players"
      aside="Public rooms with a free seat and someone already in them. Join one and the game opens straight into it."
    >
      {loading ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((n) => (
            <li key={n} className="h-44 animate-pulse rounded-[10px] bg-g-paper-2" />
          ))}
        </ul>
      ) : rooms?.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <li key={room.code}>
              <RoomTile room={room} action="Join" />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-[10px] border-2 border-dashed border-g-line px-6 py-12 text-center">
          <p className="text-xl font-medium tracking-[-0.03em]">No open rooms right now</p>
          <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-g-mute">
            Start one below and the first seat is yours. A public room shows up here for anyone
            looking for a game.
          </p>
        </div>
      )}
    </Section>
  );
}

function RoomTile({ room, action }: { room: RoomCard; action: string }) {
  const free = room.maxPlayers - room.seats;
  return (
    <Link
      to={roomUrl(room.game.slug, room.code)}
      className="group flex h-full gap-4 rounded-[10px] border-2 border-g-ink bg-g-paper p-4 shadow-[5px_5px_0_var(--g-ink)] transition-[transform,box-shadow] duration-150 hover:-translate-x-px hover:-translate-y-px hover:shadow-[6px_6px_0_var(--g-ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_var(--g-ink)]"
    >
      <CoverArt
        game={{ ...room.game, kind: 'external', component: null }}
        className="aspect-[3/4] w-20 shrink-0 rounded-[6px]"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-[17px] font-semibold tracking-[-0.03em]">{room.game.title}</p>
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]',
              room.status === 'playing' ? 'bg-g-ink text-g-paper' : 'bg-g-paper-2 text-g-mute',
            )}
          >
            {room.status === 'playing' ? 'Playing' : room.visibility === 'public' ? 'Public' : 'Private'}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[12px] text-g-mute">
          {room.host ? `Hosted by ${room.host}` : 'Open room'} · {room.code}
        </p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            <div className="flex gap-1" aria-hidden="true">
              {Array.from({ length: room.maxPlayers }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    'size-3 rounded-full border-[1.5px] border-g-ink',
                    i < room.seats && 'bg-g-ember',
                  )}
                />
              ))}
            </div>
            <p className="mt-1.5 font-mono text-[11px] text-g-mute">
              {room.seats}/{room.maxPlayers} ·{' '}
              {room.status === 'playing' ? 'in progress' : free === 1 ? '1 seat left' : `${free} seats left`}
            </p>
          </div>
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-g-ember-ink group-hover:underline">
            {action} →
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ---------------------------------------------------------- start one --- */

function StartRoom({ games, loading }: { games?: RoomDirectory['games']; loading: boolean }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const start = useStartRoom();
  const [problem, setProblem] = useState<{ slug: string; message: string } | null>(null);

  const open = (slug: string, visibility: 'public' | 'private') => {
    if (!user) {
      navigate('/login', { state: { from: pathname } });
      return;
    }
    setProblem(null);
    start.mutate(
      { slug, visibility },
      {
        onSuccess: (room) => navigate(roomUrl(slug, room.code)),
        onError: (error) => setProblem({ slug, message: error.message }),
      },
    );
  };

  return (
    <Section
      id="start"
      eyebrow="Start a room"
      title="Every game you can play together"
      aside="A public room is listed above for anyone to join. A private one is only for people you give the code to."
      tone="paper"
    >
      {loading ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((n) => (
            <li key={n} className="h-72 animate-pulse rounded-[10px] bg-g-paper" />
          ))}
        </ul>
      ) : games?.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => {
            const busy = start.isPending && start.variables?.slug === game.slug;
            return (
              <li
                key={game.slug}
                className="flex flex-col overflow-hidden rounded-[10px] border-2 border-g-ink bg-g-paper shadow-[5px_5px_0_var(--g-ink)]"
              >
                <CoverArt
                  game={{ ...game, kind: 'external', component: null }}
                  showTitle
                  className="aspect-[16/9] w-full border-b-2 border-g-ink"
                />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <Link
                      to={`/games/${game.slug}`}
                      className="text-xl font-semibold tracking-[-0.035em] hover:underline"
                    >
                      {game.title}
                    </Link>
                    <span className="shrink-0 font-mono text-[11px] text-g-mute">
                      {game.minPlayers === game.maxPlayers
                        ? `${game.maxPlayers} players`
                        : `${game.minPlayers}–${game.maxPlayers} players`}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-g-mute">{game.tagline}</p>
                  <p className="mt-3 font-mono text-[11px] text-g-mute">
                    {game.open} waiting · {game.playing} playing · {game.playersNow} online
                  </p>
                  {problem?.slug === game.slug && (
                    <p role="alert" className="mt-2 text-[13px] text-danger">
                      {problem.message}
                    </p>
                  )}
                  <div className="mt-auto flex gap-2 pt-5">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => open(game.slug, 'public')}
                      className="glass-primary flex-1 rounded-xl px-3 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] disabled:opacity-60"
                    >
                      {busy && start.variables?.visibility === 'public' ? 'Opening…' : 'Public room'}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => open(game.slug, 'private')}
                      className="glass-secondary flex-1 rounded-xl px-3 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] disabled:opacity-60"
                    >
                      {busy && start.variables?.visibility === 'private' ? 'Opening…' : 'Private room'}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-[14px] text-g-mute">
          No multiplayer games are live yet. They will appear here as soon as one is approved.
        </p>
      )}
    </Section>
  );
}

function Builders() {
  return (
    <section className="bg-g-night px-4 py-20 text-g-night-ink sm:px-6">
      <div className="mx-auto flex max-w-[1100px] flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-g-glow">For developers</p>
          <h2 className="mt-4 max-w-xl text-[clamp(2rem,4.6vw,3.25rem)] font-medium leading-[1] tracking-[-0.05em] text-balance">
            Your game gets rooms for free.
          </h2>
          <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-white/65">
            Switch multiplayer on and your game appears here. Codes, invites, quick match and live
            messages are Deck’s — no game server of your own. Four in a Row is a complete example
            to read.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/docs/developers/multiplayer"
            className="glass-primary rounded-xl px-5 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em]"
          >
            Multiplayer docs
          </Link>
          <Link
            to="/docs/developers/sample"
            className="px-4 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70 transition-colors hover:text-white"
          >
            The sample game →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- shared --- */

function Section({
  id,
  eyebrow,
  title,
  aside,
  tone,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  aside?: string;
  tone?: 'paper';
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn('scroll-mt-14 px-4 py-20 sm:px-6', tone === 'paper' ? 'bg-g-paper-2' : 'bg-g-paper')}
    >
      <div className="mx-auto max-w-[1100px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-g-ember-ink">
              {eyebrow}
            </p>
            <h2 className="mt-4 max-w-xl text-[clamp(2rem,4.6vw,3.25rem)] font-medium leading-[1] tracking-[-0.05em] text-balance">
              {title}
            </h2>
          </div>
          {aside && <p className="max-w-sm text-[13px] leading-relaxed text-g-mute">{aside}</p>}
        </div>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}
