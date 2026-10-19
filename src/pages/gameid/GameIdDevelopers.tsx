import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GameIdMark } from '@/components/gameid/GameIdMark';
import { GButton, GCard, GInput, GNotice, GTextarea } from '@/components/deckgames/ui';
import { useAuth } from '@/hooks/useAuth';
import { useCreateApp, useMyApps } from '@/hooks/useGameId';
import { RequestError } from '@/lib/api';
import { cn, relativeTime } from '@/lib/utils';

/**
 * `/gameid/developers` — the apps a developer has registered for "Sign in
 * with GameID", and the form to register another.
 */
export function GameIdDevelopers() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-24 pt-24 sm:px-6 sm:pt-28">
      <title>GameID for developers</title>
      <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-g-ember-ink">
        <GameIdMark className="size-4" /> GameID for developers
      </p>
      <h1 className="mt-4 max-w-3xl text-[clamp(2.25rem,5vw,4rem)] font-medium leading-[0.95] tracking-[-0.055em] text-balance">
        Let players sign in with GameID
      </h1>
      <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-g-mute">
        OAuth 2.0 with PKCE and OpenID Connect. You get a stable ID for each player and, if they
        agree, their GameID handle and avatar — nothing you would have to protect.{' '}
        <Link to="/gameid/docs" className="text-g-ink underline underline-offset-4">
          Read the docs
        </Link>
        .
      </p>

      {user ? (
        <Apps />
      ) : (
        <div className="mt-10">
          <Link
            to="/login"
            state={{ from: pathname }}
            className="rounded-[3px] bg-g-ember px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-g-on-ember"
          >
            Sign in to register an app
          </Link>
        </div>
      )}
    </div>
  );
}

function Apps() {
  const { data, isLoading } = useMyApps();
  const [creating, setCreating] = useState(false);

  return (
    <div className="mt-12 grid gap-4 lg:grid-cols-[1fr_24rem]">
      <section aria-label="Your apps">
        {isLoading ? (
          <div className="h-28 animate-pulse rounded-3xl bg-g-paper-2" />
        ) : !data?.length ? (
          <GCard className="text-center">
            <p className="text-xl font-medium tracking-[-0.03em]">No apps yet</p>
            <p className="mx-auto mt-2 max-w-sm text-[13px] text-g-mute">
              Register your game to get a client ID. It takes a minute.
            </p>
            {!creating && (
              <GButton className="mt-5" onClick={() => setCreating(true)}>
                Register an app
              </GButton>
            )}
          </GCard>
        ) : (
          <ul className="space-y-3">
            {data.map((app) => (
              <li key={app.clientId}>
                <Link
                  to={`/gameid/developers/${app.clientId}`}
                  className="group flex items-center gap-4 rounded-3xl border border-g-line p-4 transition-colors duration-300 hover:border-g-ink"
                >
                  <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-g-paper-2">
                    {app.logoUrl ? (
                      <img src={app.logoUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="font-medium">{app.name.slice(0, 2)}</span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-lg font-medium tracking-[-0.03em]">
                      {app.name}
                    </span>
                    <span className="block font-mono text-[11px] text-g-mute">
                      {app.clientId} · {app.type} · {relativeTime(app.createdAt)}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'font-mono text-[10px] uppercase tracking-[0.14em]',
                      app.status === 'active' ? 'text-success' : 'text-g-mute',
                    )}
                  >
                    {app.status === 'active' ? 'Active' : 'Off'}
                  </span>
                </Link>
              </li>
            ))}
            {!creating && (
              <li>
                <GButton tone="ghost" onClick={() => setCreating(true)}>
                  Register another app
                </GButton>
              </li>
            )}
          </ul>
        )}
      </section>

      <aside>{creating ? <CreateApp onCancel={() => setCreating(false)} /> : <Checklist />}</aside>
    </div>
  );
}

function Checklist() {
  return (
    <GCard>
      <h2 className="text-lg font-medium tracking-[-0.03em]">What you need</h2>
      <ol className="mt-4 space-y-3 text-[13px] leading-relaxed text-g-mute">
        <li>
          <span className="font-medium text-g-ink">1. Your redirect URI</span> — where players come
          back after signing in. https, or http://localhost while you build.
        </li>
        <li>
          <span className="font-medium text-g-ink">2. Your app type</span> — confidential if you
          have a server that can keep a secret; public for browser, mobile and desktop games.
        </li>
        <li>
          <span className="font-medium text-g-ink">3. An OAuth library</span> — any that speaks
          OpenID Connect. Point it at the discovery URL in the docs.
        </li>
      </ol>
    </GCard>
  );
}

function CreateApp({ onCancel }: { onCancel: () => void }) {
  const create = useCreateApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    description: '',
    homepageUrl: '',
    privacyUrl: '',
    type: 'public' as 'public' | 'confidential',
    redirectUris: '',
  });
  const failure = create.error instanceof RequestError ? create.error : null;
  const set =
    (key: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  return (
    <GCard>
      <h2 className="text-lg font-medium tracking-[-0.03em]">Register an app</h2>
      <form
        noValidate
        className="mt-5 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate(
            {
              name: form.name.trim(),
              description: form.description.trim() || undefined,
              homepageUrl: form.homepageUrl.trim() || undefined,
              privacyUrl: form.privacyUrl.trim() || undefined,
              type: form.type,
              redirectUris: form.redirectUris.split(/\s+/).filter(Boolean),
            },
            {
              /* The secret, if there is one, is shown on the app's page — once. */
              onSuccess: (app) =>
                navigate(`/gameid/developers/${app.clientId}`, {
                  state: { clientSecret: app.clientSecret },
                }),
            },
          );
        }}
      >
        {failure && !failure.fields.length && <GNotice tone="error">{failure.message}</GNotice>}
        <GInput
          label="App name"
          value={form.name}
          onChange={set('name')}
          maxLength={60}
          error={failure?.fieldError('name')}
          hint="Players see this on the consent screen."
        />
        <GTextarea
          label="Description (optional)"
          value={form.description}
          onChange={set('description')}
          maxLength={240}
          rows={2}
        />

        <fieldset>
          <legend className="mb-2 text-[13px] font-medium">App type</legend>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ['public', 'Public', 'Browser, mobile or desktop game. Uses PKCE, no secret.'],
                ['confidential', 'Confidential', 'Has a server that keeps a client secret.'],
              ] as const
            ).map(([value, label, blurb]) => (
              <label
                key={value}
                className={cn(
                  'cursor-pointer rounded-2xl border p-3 transition-colors',
                  form.type === value
                    ? 'border-g-ink bg-g-paper-2'
                    : 'border-g-line hover:border-g-mute',
                )}
              >
                <input
                  type="radio"
                  name="type"
                  value={value}
                  checked={form.type === value}
                  onChange={() => setForm((current) => ({ ...current, type: value }))}
                  className="sr-only"
                />
                <span className="block text-[13px] font-medium">{label}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-g-mute">{blurb}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <GTextarea
          label="Redirect URIs"
          value={form.redirectUris}
          onChange={set('redirectUris')}
          rows={3}
          placeholder={'https://yourgame.com/auth/callback\nhttp://localhost:5173/callback'}
          error={failure?.fieldError('redirectUris')}
          hint="One per line. Matched exactly. Public apps may also use a reverse-domain scheme like com.yourstudio.game:/callback."
        />
        <GInput
          label="Homepage (optional)"
          type="url"
          value={form.homepageUrl}
          onChange={set('homepageUrl')}
          error={failure?.fieldError('homepageUrl')}
        />
        <GInput
          label="Privacy policy (optional)"
          type="url"
          value={form.privacyUrl}
          onChange={set('privacyUrl')}
          error={failure?.fieldError('privacyUrl')}
          hint="Linked from the consent screen."
        />

        <div className="flex items-center gap-3">
          <GButton type="submit" loading={create.isPending}>
            Register
          </GButton>
          <GButton type="button" tone="ghost" onClick={onCancel}>
            Cancel
          </GButton>
        </div>
      </form>
    </GCard>
  );
}
