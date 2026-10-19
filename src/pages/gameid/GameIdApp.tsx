import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  GButton,
  GCard,
  GDialog,
  GInput,
  GNotice,
  GTextarea,
  SecretReveal,
} from '@/components/deckgames/ui';
import { useMyApp, useRotateSecret, useUpdateApp } from '@/hooks/useGameId';
import { RequestError } from '@/lib/api';
import type { GameIdApp as App } from '@/types';

/**
 * `/gameid/developers/:clientId` — one app's credentials, endpoints and
 * settings. A new confidential app arrives here with its secret in router
 * state, the one time it is ever shown.
 */
export function GameIdApp() {
  const { clientId = '' } = useParams();
  const { state } = useLocation();
  const { data: app, isLoading, error } = useMyApp(clientId);
  const firstSecret = (state as { clientSecret?: string | null } | null)?.clientSecret ?? null;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 pb-24 pt-28 sm:px-6">
        <div className="h-12 w-72 animate-pulse rounded-full bg-g-paper-2" />
      </div>
    );
  }
  if (!app) {
    return (
      <div className="mx-auto max-w-xl px-4 pb-24 pt-32 text-center sm:px-6">
        <p className="text-3xl font-medium tracking-[-0.04em]">Not one of your apps</p>
        <p className="mt-3 text-sm text-g-mute">{error?.message}</p>
        <Link
          to="/gameid/developers"
          className="mt-6 inline-block font-mono text-[10px] uppercase tracking-[0.16em] text-g-ember-ink"
        >
          ← Your apps
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-24 pt-24 sm:px-6 sm:pt-28">
      <title>{`${app.name} — GameID`}</title>
      <Link
        to="/gameid/developers"
        className="font-mono text-[10px] uppercase tracking-[0.16em] text-g-mute hover:text-g-ink"
      >
        ← Your apps
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(2rem,4.6vw,3.5rem)] font-medium leading-[1] tracking-[-0.05em]">
            {app.name}
          </h1>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-g-mute">
            {app.type} app · {app.status === 'active' ? 'active' : 'switched off'}
          </p>
        </div>
        {app.stats && (
          <p className="text-[13px] text-g-mute">
            <span className="text-2xl font-medium tracking-[-0.04em] text-g-ink">
              {app.stats.players}
            </span>{' '}
            players · {app.stats.activeSessions} signed in
          </p>
        )}
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_24rem]">
        <div className="min-w-0 space-y-4">
          {firstSecret && <SecretReveal label="Client secret" value={firstSecret} />}
          <Credentials app={app} />
          <TryIt app={app} />
        </div>
        <Settings key={app.clientId + app.redirectUris.join()} app={app} />
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 border-b border-g-line py-3 last:border-b-0">
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] text-g-mute">{label}</span>
        <code className="block truncate font-mono text-[13px]">{value}</code>
      </span>
      <GButton
        small
        tone="ghost"
        onClick={() => void navigator.clipboard?.writeText(value).then(() => setCopied(true))}
      >
        {copied ? 'Copied' : 'Copy'}
      </GButton>
    </div>
  );
}

function Credentials({ app }: { app: App }) {
  const rotate = useRotateSecret(app.clientId);
  const [confirm, setConfirm] = useState(false);
  const origin = window.location.origin;

  return (
    <GCard>
      <h2 className="text-lg font-medium tracking-[-0.03em]">Credentials</h2>
      <div className="mt-3">
        <Field label="Client ID" value={app.clientId} />
        <Field label="Discovery URL" value={`${origin}/.well-known/openid-configuration`} />
        <Field label="Authorization endpoint" value={`${origin}/gameid/authorize`} />
        <Field label="Token endpoint" value={`${origin}/api/gameid/oauth/token`} />
      </div>

      {app.type === 'confidential' ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-g-paper-2 p-4">
          <span>
            <span className="block text-[13px] font-medium">Client secret</span>
            <span className="block font-mono text-[12px] text-g-mute">
              gsk_••••{app.secretHint}
            </span>
          </span>
          <GButton small tone="ghost" loading={rotate.isPending} onClick={() => setConfirm(true)}>
            Rotate
          </GButton>
        </div>
      ) : (
        <p className="mt-4 rounded-2xl bg-g-paper-2 p-4 text-[13px] leading-relaxed text-g-mute">
          Public app: no secret. Every sign-in must use PKCE with S256.
        </p>
      )}
      {rotate.data && (
        <div className="mt-4">
          <SecretReveal label="New client secret" value={rotate.data.clientSecret} />
        </div>
      )}

      <GDialog open={confirm} onClose={() => setConfirm(false)} title="Rotate the client secret?">
        <p className="text-[14px] leading-relaxed text-g-mute">
          The current secret stops working the moment you confirm. Update your server straight
          after.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <GButton tone="ghost" onClick={() => setConfirm(false)}>
            Keep it
          </GButton>
          <GButton
            onClick={() => {
              setConfirm(false);
              rotate.mutate();
            }}
          >
            Rotate
          </GButton>
        </div>
      </GDialog>
    </GCard>
  );
}

/**
 * A ready-made authorize link for the first redirect URI, so a developer can
 * walk through the consent screen before writing any code. Confidential apps
 * only: a public app's link needs a PKCE challenge only their code can make.
 */
function TryIt({ app }: { app: App }) {
  const redirect = app.redirectUris[0];
  if (!redirect) return null;
  const params = new URLSearchParams({
    client_id: app.clientId,
    redirect_uri: redirect,
    response_type: 'code',
    scope: 'openid profile',
    state: 'try-it',
  });
  const href = `/gameid/authorize?${params.toString()}`;

  return (
    <GCard>
      <h2 className="text-lg font-medium tracking-[-0.03em]">See the consent screen</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-g-mute">
        {app.type === 'confidential'
          ? `Walk through it as a player. You’ll land on ${redirect} with a code your server can exchange.`
          : 'Public apps must send a PKCE challenge, so this link is shown without one — the screen will explain it was refused. Start the flow from your app to see the real thing.'}
      </p>
      <a
        href={href}
        className="mt-4 inline-block font-mono text-[10px] uppercase tracking-[0.16em] text-g-ember-ink underline-offset-[6px] hover:underline"
      >
        Open the consent screen →
      </a>
    </GCard>
  );
}

function Settings({ app }: { app: App }) {
  const update = useUpdateApp(app.clientId);
  const [form, setForm] = useState({
    name: app.name,
    description: app.description,
    homepageUrl: app.homepageUrl,
    privacyUrl: app.privacyUrl,
    logoUrl: app.logoUrl,
    redirectUris: app.redirectUris.join('\n'),
  });
  const failure = update.error instanceof RequestError ? update.error : null;
  const set =
    (key: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  return (
    <GCard>
      <h2 className="text-lg font-medium tracking-[-0.03em]">Settings</h2>
      <form
        noValidate
        className="mt-5 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          update.mutate({
            name: form.name.trim(),
            description: form.description.trim(),
            homepageUrl: form.homepageUrl.trim(),
            privacyUrl: form.privacyUrl.trim(),
            logoUrl: form.logoUrl.trim(),
            redirectUris: form.redirectUris.split(/\s+/).filter(Boolean),
          });
        }}
      >
        {failure && !failure.fields.length && <GNotice tone="error">{failure.message}</GNotice>}
        <GInput
          label="App name"
          value={form.name}
          onChange={set('name')}
          maxLength={60}
          error={failure?.fieldError('name')}
        />
        <GTextarea
          label="Description"
          value={form.description}
          onChange={set('description')}
          rows={2}
          maxLength={240}
        />
        <GInput
          label="Logo URL"
          type="url"
          value={form.logoUrl}
          onChange={set('logoUrl')}
          error={failure?.fieldError('logoUrl')}
          hint="Square, shown on the consent screen."
        />
        <GTextarea
          label="Redirect URIs"
          value={form.redirectUris}
          onChange={set('redirectUris')}
          rows={3}
          error={failure?.fieldError('redirectUris')}
          hint="One per line, matched exactly."
        />
        <GInput
          label="Homepage"
          type="url"
          value={form.homepageUrl}
          onChange={set('homepageUrl')}
          error={failure?.fieldError('homepageUrl')}
        />
        <GInput
          label="Privacy policy"
          type="url"
          value={form.privacyUrl}
          onChange={set('privacyUrl')}
          error={failure?.fieldError('privacyUrl')}
        />
        <div className="flex flex-wrap items-center gap-3">
          <GButton type="submit" tone="ink" loading={update.isPending}>
            Save
          </GButton>
          {update.isSuccess && !update.isPending && (
            <span className="text-[12px] text-success">Saved.</span>
          )}
        </div>
      </form>
      <div className="mt-6 flex items-center justify-between gap-3 border-t border-g-line pt-5">
        <span className="text-[13px] text-g-mute">
          {app.status === 'active'
            ? 'Switching off stops sign-ins, token refreshes and profile calls at once.'
            : 'Nothing works while it is off — sign-ins, refreshes or profile calls.'}
        </span>
        <GButton
          small
          tone={app.status === 'active' ? 'danger' : 'ink'}
          onClick={() => update.mutate({ status: app.status === 'active' ? 'disabled' : 'active' })}
        >
          {app.status === 'active' ? 'Switch off' : 'Switch on'}
        </GButton>
      </div>
    </GCard>
  );
}
