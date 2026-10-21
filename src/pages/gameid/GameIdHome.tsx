import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GameIdCard } from '@/components/gameid/GameIdCard';
import { YourAgents } from '@/components/agents/YourAgents';
import { GameIdMark } from '@/components/gameid/GameIdMark';
import { GButton, GCard, GInput, GNotice } from '@/components/deckgames/ui';
import { useAuth } from '@/hooks/useAuth';
import { useConnections, useDisconnect, useMyGameId, useUpdateHandle } from '@/hooks/useGameId';
import { RequestError } from '@/lib/api';
import { relativeTime } from '@/lib/utils';

/**
 * `/gameid` — what GameID is, and the player's own.
 *
 * Signed in, it is their card, their handle, and every app they have let in,
 * each one a click from being disconnected. Signed out, it is the case for
 * having one at all.
 */
export function GameIdHome() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const me = useMyGameId(Boolean(user));

  return (
    /* `overflow-x-clip`: the card's light reaches past it, and on a phone that
       would otherwise push the page sideways. Clip, not hidden, so nothing
       here becomes a scroll container. */
    <div className="overflow-x-clip pb-24 pt-24 sm:pt-28">
      <title>GameID — one identity for every game</title>

      <section className="mx-auto grid max-w-[1200px] items-center gap-16 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)]">
        <div className="max-w-xl">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-g-ember-ink">
            <GameIdMark className="size-4" /> GameID
          </p>
          <h1 className="mt-4 text-[clamp(2.5rem,6vw,4.75rem)] font-medium leading-[0.95] tracking-[-0.055em] text-balance">
            One identity for every game
          </h1>
          <p className="mt-5 max-w-md text-[16px] leading-relaxed text-g-mute text-pretty">
            Sign in to games across the web with your GameID. They get your handle and avatar if you
            say so — never your email, never your password, never anything else.
          </p>
          {!user && (
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/register"
                state={{ from: pathname }}
                className="glass-primary rounded-xl px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]"
              >
                Get your GameID
              </Link>
              <Link
                to="/login"
                state={{ from: pathname }}
                className="font-mono text-[10px] uppercase tracking-[0.16em] text-g-ink underline-offset-[6px] hover:underline"
              >
                Sign in →
              </Link>
            </div>
          )}
        </div>

        {/* A real column width, not `auto`: the card's contents are absolutely
            positioned, so an auto track sized to them collapsed it to nothing. */}
        <div className="w-full max-w-[34rem] justify-self-center px-4 py-10 sm:px-8">
          {user && me.data ? (
            <GameIdCard identity={me.data} />
          ) : (
            <GameIdCard
              identity={{
                handle: 'yourname',
                code: 'GID-••••-••••',
                displayName: 'Your name',
                avatarUrl: null,
                handleChangedAt: null,
                createdAt: null,
              }}
            />
          )}
        </div>
      </section>

      {user && me.data && (
        <div className="mx-auto mt-16 grid max-w-[1100px] grid-cols-1 gap-4 px-4 sm:px-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <HandleCard
            key={me.data.handle}
            handle={me.data.handle ?? ''}
            changedAt={me.data.handleChangedAt}
            code={me.data.code ?? ''}
          />
          <Connections />
          {/* Agents this GameID operates. Full width: each row carries a card and its controls. */}
          <div className="min-w-0 lg:col-span-2">
            <YourAgents />
          </div>
        </div>
      )}

      <section className="mx-auto mt-20 grid max-w-[1100px] gap-4 px-4 sm:grid-cols-3 sm:px-6">
        {[
          [
            'Sign in anywhere',
            'Games that support GameID show a “Sign in with GameID” button. One tap, and you are in — no new password.',
          ],
          [
            'Share only what you choose',
            'Every app sees an ID made just for it. Your handle and avatar go only to apps you allow, and your email to none.',
          ],
          [
            'Take it back any time',
            'Disconnect an app here and it is signed out everywhere, immediately.',
          ],
        ].map(([title, body]) => (
          <div key={title} className="rounded-3xl bg-g-paper-2 p-6">
            <h2 className="text-lg font-medium tracking-[-0.03em]">{title}</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-g-mute">{body}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto mt-16 max-w-[1100px] px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-g-night p-8 text-g-night-ink sm:p-10">
          <div className="max-w-md">
            <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-medium tracking-[-0.045em]">
              Building a game?
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-g-night-mute">
              Add “Sign in with GameID” in an afternoon. Standard OAuth 2.0 and OpenID Connect, so
              the library you already use works.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/gameid/developers"
              className="glass-primary rounded-xl px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]"
            >
              Register an app
            </Link>
            <Link
              to="/gameid/docs"
              className="font-mono text-[10px] uppercase tracking-[0.16em] underline-offset-[6px] hover:underline"
            >
              Read the docs →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function HandleCard({
  handle,
  changedAt,
  code,
}: {
  handle: string;
  changedAt: string | null;
  code: string;
}) {
  const update = useUpdateHandle();
  const [value, setValue] = useState(handle);
  const failure = update.error instanceof RequestError ? update.error : null;

  return (
    <GCard>
      <h2 className="text-lg font-medium tracking-[-0.03em]">Your handle</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-g-mute">
        What apps you allow will show. You can change it once every 30 days; your code{' '}
        <span className="font-mono text-[12px] text-g-ink">{code}</span> never changes.
      </p>
      <form
        className="mt-5 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          update.mutate(value.trim().toLowerCase());
        }}
      >
        <GInput
          label="Handle"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          maxLength={24}
          error={failure?.fieldError('handle') ?? failure?.message}
          hint={
            changedAt
              ? `Last changed ${relativeTime(changedAt)}`
              : 'Letters, numbers, dots and underscores'
          }
        />
        <GButton
          type="submit"
          tone="ink"
          small
          loading={update.isPending}
          disabled={value.trim().toLowerCase() === handle}
        >
          Save handle
        </GButton>
        {update.isSuccess && !update.isPending && (
          <span className="ml-3 text-[12px] text-success">Saved.</span>
        )}
      </form>
    </GCard>
  );
}

function Connections() {
  const { data, isLoading } = useConnections();
  const disconnect = useDisconnect();

  return (
    <GCard>
      <h2 className="text-lg font-medium tracking-[-0.03em]">Connected apps</h2>
      <p className="mt-1 text-[13px] text-g-mute">Everywhere you have signed in with GameID.</p>
      {disconnect.error && (
        <div className="mt-4">
          <GNotice tone="error">{disconnect.error.message}</GNotice>
        </div>
      )}
      {isLoading ? (
        <div className="mt-5 h-20 animate-pulse rounded-2xl bg-g-paper-2" />
      ) : !data?.length ? (
        <p className="mt-5 rounded-2xl bg-g-paper-2 px-4 py-6 text-center text-[13px] text-g-mute">
          No apps yet. When you sign in to a game with GameID, it appears here.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-g-line">
          {data.map((connection) => (
            <li key={connection.app.clientId} className="flex items-center gap-4 py-4">
              <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-g-paper-2">
                {connection.app.logoUrl ? (
                  <img src={connection.app.logoUrl} alt="" className="size-full object-cover" />
                ) : (
                  <span className="text-sm font-medium">{connection.app.name.slice(0, 2)}</span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium">
                  {connection.app.name}
                </span>
                <span className="block text-[12px] text-g-mute">
                  {connection.scopes.includes('profile')
                    ? 'Sees your GameID'
                    : 'Sees only its own ID for you'}{' '}
                  · used {relativeTime(connection.lastUsedAt)}
                </span>
              </span>
              <GButton
                small
                tone="ghost"
                loading={disconnect.isPending && disconnect.variables === connection.app.clientId}
                onClick={() => disconnect.mutate(connection.app.clientId)}
              >
                Disconnect
              </GButton>
            </li>
          ))}
        </ul>
      )}
    </GCard>
  );
}
