import { useEffect, useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GameIdMark } from '@/components/gameid/GameIdMark';
import { PageBanner } from '@/components/ui/Ambient';
import { useAuth } from '@/hooks/useAuth';
import { useAuthorizeInfo, useDecideAuthorize } from '@/hooks/useGameId';
import { cn } from '@/lib/utils';
import type { GameIdAuthorizeInfo } from '@/types';

/**
 * `/gameid/authorize` — where another app sends a player to sign in with
 * GameID.
 *
 * It says, in plain words, who is asking, what they will get, what they will
 * never get, and where the player goes next. A returning player who already
 * agreed is passed straight through. A request GameID cannot trust — an
 * unknown app, an unregistered address — is explained here and never
 * redirected, because sending a browser to an address the app never
 * registered is how codes get stolen.
 */

const RELAYED = [
  'client_id',
  'redirect_uri',
  'response_type',
  'scope',
  'state',
  'code_challenge',
  'code_challenge_method',
  'nonce',
  'prompt',
] as const;

export function GameIdAuthorize() {
  const { search, pathname } = useLocation();
  const { user, isLoading: authLoading, logout } = useAuth();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const prompt = params.get('prompt') ?? '';
  const info = useAuthorizeInfo(search, Boolean(user));
  const decide = useDecideAuthorize();
  const acted = useRef(false);

  const body = useMemo(() => {
    const out: Record<string, string> = {};
    for (const key of RELAYED) {
      const value = params.get(key);
      if (value !== null) out[key] = value;
    }
    return out;
  }, [params]);

  const answer = (decision: 'allow' | 'deny') =>
    decide.mutate(
      { ...body, decision },
      { onSuccess: ({ redirectTo }) => window.location.assign(redirectTo) },
    );

  const data = info.data;

  /* The cases that need no click: errors the app should hear about, silent
     checks (`prompt=none`), and players who already said yes. */
  useEffect(() => {
    if (acted.current || authLoading || !data) return;

    if (!data.ok) {
      if (data.redirectTo) {
        acted.current = true;
        window.location.assign(data.redirectTo);
      }
      return;
    }

    const back = (error: string) => {
      const url = new URL(body.redirect_uri);
      url.searchParams.set('error', error);
      if (body.state) url.searchParams.set('state', body.state);
      acted.current = true;
      window.location.assign(url.toString());
    };

    if (prompt === 'none') {
      if (!user) return back('login_required');
      if (!data.granted) return back('consent_required');
    }
    if (user && data.granted && prompt !== 'consent') {
      acted.current = true;
      decide.mutate(
        { ...body, decision: 'allow' },
        { onSuccess: ({ redirectTo }) => window.location.assign(redirectTo) },
      );
    }
  }, [authLoading, body, data, decide, prompt, user]);

  return (
    <div className="relative isolate grid min-h-dvh place-items-center bg-canvas px-4 py-10 text-body">
      <title>Sign in with GameID</title>
      <PageBanner />
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <GameIdMark className="size-6 text-accent" />
          <span className="text-[17px] font-semibold tracking-[-0.04em]">GameID</span>
        </div>

        <div className="rounded-3xl border border-line bg-surface p-6 shadow-hard-lg sm:p-8">
          {info.isLoading || authLoading ? (
            <Waiting text="Checking the request…" />
          ) : info.isError || !data ? (
            <Problem
              title="Something went wrong"
              body="We could not read this sign-in request. Close this page and try again from the game."
            />
          ) : !data.ok ? (
            data.redirectTo ? (
              <Waiting text="Returning you to the app…" />
            ) : (
              <Problem title="This sign-in can’t continue" body={data.description} />
            )
          ) : user && data.granted && prompt !== 'consent' ? (
            <Waiting text={`Signing you in to ${data.app.name}…`} />
          ) : (
            <Consent
              data={data}
              signedIn={Boolean(user)}
              userName={user?.name ?? ''}
              loginState={{ from: `${pathname}${search}` }}
              busy={decide.isPending}
              error={decide.error?.message ?? null}
              onAllow={() => answer('allow')}
              onDeny={() => answer('deny')}
              onSwitch={logout}
            />
          )}
        </div>

        <p className="mt-6 text-center text-[12px] leading-relaxed text-muted">
          GameID is Deck’s gaming identity.{' '}
          <Link to="/gameid" className="underline underline-offset-4 hover:text-body">
            Learn more
          </Link>
        </p>
      </div>
    </div>
  );
}

function Consent({
  data,
  signedIn,
  userName,
  loginState,
  busy,
  error,
  onAllow,
  onDeny,
  onSwitch,
}: {
  data: Extract<GameIdAuthorizeInfo, { ok: true }>;
  signedIn: boolean;
  userName: string;
  loginState: { from: string };
  busy: boolean;
  error: string | null;
  onAllow: () => void;
  onDeny: () => void;
  onSwitch: () => void;
}) {
  const { app, scopes, gameId } = data;
  const wantsProfile = scopes.some((entry) => entry.scope === 'profile');

  return (
    <div>
      <div className="flex items-center gap-4">
        <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-surface-2">
          {app.logoUrl ? (
            <img src={app.logoUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-lg font-medium">{app.name.slice(0, 2)}</span>
          )}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-xl tracking-[-0.03em]">{app.name}</h1>
          <p className="text-[13px] text-muted">wants you to sign in with GameID</p>
        </div>
      </div>

      {!signedIn ? (
        <div className="mt-7">
          <p className="text-[14px] leading-relaxed text-muted">
            Sign in to Deck to continue. You will see exactly what {app.name} gets before anything
            is shared.
          </p>
          <div className="mt-6 grid gap-2.5">
            <Link
              to="/login"
              state={loginState}
              className="flex h-11 items-center justify-center rounded-[4px] bg-pop font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-on-pop hover:bg-pop-hover"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              state={loginState}
              className="flex h-11 items-center justify-center rounded-[4px] border border-line font-mono text-[11px] font-medium uppercase tracking-[0.16em] hover:border-edge"
            >
              Create an account
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            {app.name} will get
          </p>
          <ul className="mt-3 space-y-2.5">
            <Item ok>
              An ID unique to {app.name}, so it knows it’s you next time.
              <span className="block text-[12px] text-muted">
                Other apps can’t match it to you.
              </span>
            </Item>
            {wantsProfile && gameId && (
              <Item ok>
                Your GameID: <span className="font-medium">@{gameId.handle}</span>{' '}
                <span className="font-mono text-[12px] text-muted">{gameId.code}</span>
                <span className="block text-[12px] text-muted">
                  With your display name and avatar.
                </span>
              </Item>
            )}
          </ul>

          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Never shared
          </p>
          <ul className="mt-3 space-y-2.5">
            <Item>Your email address or password</Item>
            <Item>Your launches, purchases or anything else on Deck</Item>
          </ul>

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-2xl bg-danger/10 px-4 py-3 text-[13px] text-danger dark:text-danger-soft"
            >
              {error}
            </p>
          )}

          <div className="mt-7 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onDeny}
              disabled={busy}
              className="h-11 rounded-[4px] border border-line font-mono text-[11px] font-medium uppercase tracking-[0.16em] hover:border-edge disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onAllow}
              disabled={busy}
              className="h-11 rounded-[4px] bg-pop font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-on-pop hover:bg-pop-hover disabled:opacity-50"
            >
              {busy ? 'One moment…' : 'Continue'}
            </button>
          </div>

          <div className="mt-6 space-y-1.5 border-t border-line pt-5 text-[12px] leading-relaxed text-muted">
            <p>
              You’ll go back to <span className="font-medium text-body">{app.redirectHost}</span>.
              {app.privacyUrl && (
                <>
                  {' '}
                  <a
                    href={app.privacyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4 hover:text-body"
                  >
                    Their privacy policy
                  </a>
                  .
                </>
              )}
            </p>
            <p>
              Signed in as {userName}.{' '}
              <button
                type="button"
                onClick={onSwitch}
                className="underline underline-offset-4 hover:text-body"
              >
                Not you?
              </button>{' '}
              You can disconnect {app.name} any time from{' '}
              <Link to="/gameid" className="underline underline-offset-4 hover:text-body">
                GameID
              </Link>
              .
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Item({ ok, children }: { ok?: boolean; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-[14px] leading-snug">
      <span
        aria-hidden="true"
        className={cn(
          'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[11px]',
          ok ? 'bg-success/15 text-success' : 'bg-surface-2 text-muted',
        )}
      >
        {ok ? '✓' : '✕'}
      </span>
      <span>{children}</span>
    </li>
  );
}

function Waiting({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center py-10 text-center" role="status">
      <span className="size-8 animate-spin rounded-full border-2 border-line border-t-accent" />
      <p className="mt-4 text-[14px] text-muted">{text}</p>
    </div>
  );
}

function Problem({ title, body }: { title: string; body: string }) {
  return (
    <div className="py-4 text-center">
      <span
        aria-hidden="true"
        className="mx-auto mb-4 grid size-10 place-items-center rounded-full bg-danger/10 font-mono text-danger dark:text-danger-soft"
      >
        !
      </span>
      <h1 className="text-xl tracking-[-0.03em]">{title}</h1>
      <p className="mx-auto mt-2 max-w-xs text-[14px] leading-relaxed text-muted">{body}</p>
    </div>
  );
}
