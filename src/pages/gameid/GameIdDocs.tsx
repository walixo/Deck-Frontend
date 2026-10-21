import { Link } from 'react-router-dom';
import { Code, DocsPage, List, P, Pre, Section, Steps, Table } from '@/components/docs/DocParts';
import { GameIdMark } from '@/components/gameid/GameIdMark';
import { SIGN_IN_BUTTON_HTML, SignInWithGameId } from '@/components/gameid/SignInWithGameId';

/**
 * `/gameid/docs` — how to add "Sign in with GameID".
 *
 * Everything described here exists in the code: the endpoints, parameters,
 * claims and errors are the ones the server implements, and the examples are
 * the flow the end-to-end tests run.
 */
const ORIGIN = 'https://onedeck.africa';

const SECTIONS = [
  ['what', 'What you get'],
  ['register', 'Register your app'],
  ['flow', 'The sign-in flow'],
  ['tokens', 'Tokens and claims'],
  ['button', 'The button'],
  ['endpoints', 'Endpoints'],
  ['errors', 'Errors'],
  ['security', 'Security notes'],
] as const;

export function GameIdDocs() {
  return (
    <DocsPage
      title="GameID docs"
      eyebrow={
        <>
          <GameIdMark className="size-4" /> GameID docs
        </>
      }
      heading="Add “Sign in with GameID”"
      intro={
        <>
          Standard OAuth 2.0 authorization code flow with PKCE, and OpenID Connect on top. If your
          stack has an OIDC library, point it at the discovery URL and you are most of the way
          there.
        </>
      }
      sections={SECTIONS}
    >
      <Section id="what" title="What you get">
        <P>
          GameID is built to give you as little to protect as possible. There is no email scope and
          no way to ask for one.
        </P>
        <Table
          head={['Scope', 'You receive', 'Notes']}
          rows={[
            [
              'openid',
              'sub',
              'Required. A stable ID for this player in your app only — different in every other app, so nobody can join your players up with theirs.',
            ],
            [
              'profile',
              'gameid, preferred_username, name, picture',
              'Optional. The player’s public GameID: permanent code (GID-XXXX-XXXX), handle, display name and avatar. Shown to the player before they agree.',
            ],
          ]}
        />
        <P>
          Key your accounts on <Code>sub</Code>. Use the handle for display; it can change (once a
          month at most). The <Code>gameid</Code> code never changes, so it is the one to use if you
          want to recognise the same player across your own titles.
        </P>
      </Section>

      <Section id="register" title="Register your app">
        <P>
          <Link to="/gameid/developers" className="underline underline-offset-4">
            Register it here
          </Link>
          . Choose:
        </P>
        <List
          items={[
            'Confidential — you have a server that can keep a client secret. The secret is shown once; store it like a password.',
            'Public — a browser, mobile or desktop game that cannot keep a secret. No secret; PKCE is required on every sign-in.',
          ]}
        />
        <P>
          Add every redirect URI you will use. They are matched exactly. Use https, or{' '}
          <Code>http://localhost</Code> while developing. Native apps may register a reverse-domain
          scheme such as <Code>com.yourstudio.game:/callback</Code>.
        </P>
      </Section>

      <Section id="flow" title="The sign-in flow">
        <Steps
          items={[
            <>
              Make a PKCE pair: a random <Code>code_verifier</Code> (43–128 characters) and its
              SHA-256, base64url-encoded, as the <Code>code_challenge</Code>. Make a random{' '}
              <Code>state</Code> (and a <Code>nonce</Code> if you will read the ID token).
            </>,
            <>Send the player to the authorize URL:</>,
          ]}
        />
        <Pre>{`${ORIGIN}/gameid/authorize
  ?client_id=gid_YOUR_CLIENT_ID
  &redirect_uri=https%3A%2F%2Fyourgame.com%2Fauth%2Fcallback
  &response_type=code
  &scope=openid%20profile
  &state=RANDOM_STATE
  &nonce=RANDOM_NONCE
  &code_challenge=BASE64URL_SHA256_OF_VERIFIER
  &code_challenge_method=S256`}</Pre>
        <Steps
          start={3}
          items={[
            <>
              They sign in to Deck if needed and see your app, what it gets and what it never gets.
              A player who already agreed is passed straight back.
            </>,
            <>
              They return to your redirect URI with <Code>code</Code>, your <Code>state</Code> and{' '}
              <Code>iss</Code>. Check that <Code>state</Code> matches, and <Code>iss</Code> is{' '}
              <Code>{ORIGIN}</Code>.
            </>,
            <>Exchange the code from your server (or from the game, for public apps):</>,
          ]}
        />
        <Pre>{`curl -X POST ${ORIGIN}/api/gameid/oauth/token \\
  -u "gid_YOUR_CLIENT_ID:gsk_YOUR_SECRET" \\
  -d grant_type=authorization_code \\
  -d code=gac_THE_CODE \\
  -d redirect_uri=https://yourgame.com/auth/callback \\
  -d code_verifier=THE_VERIFIER

# Public apps: drop -u, send -d client_id=gid_YOUR_CLIENT_ID instead.`}</Pre>
        <Pre>{`{
  "access_token": "gat_…",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "grt_…",
  "id_token": "eyJhbGciOiJSUzI1NiIs…",
  "scope": "openid profile"
}`}</Pre>
        <P>A minimal browser example, start to finish:</P>
        <Pre>{`const b64url = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');

async function signInWithGameID() {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  const state = b64url(crypto.getRandomValues(new Uint8Array(16)));
  sessionStorage.setItem('gameid', JSON.stringify({ verifier, state }));

  location.href = '${ORIGIN}/gameid/authorize?' + new URLSearchParams({
    client_id: 'gid_YOUR_CLIENT_ID',
    redirect_uri: location.origin + '/callback',
    response_type: 'code',
    scope: 'openid profile',
    state, code_challenge: challenge, code_challenge_method: 'S256',
  });
}

// On /callback:
async function finishSignIn() {
  const params = new URLSearchParams(location.search);
  const { verifier, state } = JSON.parse(sessionStorage.getItem('gameid'));
  if (params.get('state') !== state) throw new Error('State mismatch');

  const res = await fetch('${ORIGIN}/api/gameid/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: params.get('code'),
      redirect_uri: location.origin + '/callback',
      client_id: 'gid_YOUR_CLIENT_ID',
      code_verifier: verifier,
    }),
  });
  return res.json(); // { access_token, id_token, refresh_token, … }
}`}</Pre>
      </Section>

      <Section id="tokens" title="Tokens and claims">
        <Table
          head={['Token', 'Lifetime', 'Use']}
          rows={[
            [
              'Authorization code',
              '10 minutes, once',
              'Exchange it immediately. A second use fails and revokes everything the first issued.',
            ],
            ['Access token (gat_)', '1 hour', 'Bearer token for /userinfo.'],
            [
              'Refresh token (grt_)',
              '30 days, rotating',
              'Each refresh returns a new pair; the old one stops working. Reusing an old one signs the player out of your app everywhere.',
            ],
            [
              'ID token (JWT)',
              '1 hour',
              'RS256, signed with a key from the JWKS. Verify iss, aud (your client ID), exp and nonce.',
            ],
          ]}
        />
        <Pre>{`{
  "iss": "${ORIGIN}",
  "aud": "gid_YOUR_CLIENT_ID",
  "sub": "gid_Q3m9…",              // stable, unique to your app
  "gameid": "GID-7F3K-9Q2M",       // profile scope
  "preferred_username": "priya",   // profile scope
  "name": "Priya Raman",           // profile scope
  "picture": "https://…",          // profile scope, if set
  "nonce": "RANDOM_NONCE",
  "auth_time": 1792066428,
  "iat": 1792066428,
  "exp": 1792070028
}`}</Pre>
        <P>
          Refresh with <Code>grant_type=refresh_token</Code>. You may pass a narrower{' '}
          <Code>scope</Code>, never a wider one.
        </P>
      </Section>

      <Section id="button" title="The button">
        <div className="flex flex-wrap items-center gap-4 rounded-3xl bg-g-paper-2 p-6">
          <SignInWithGameId />
          <SignInWithGameId tone="light" />
        </div>
        <P>Plain HTML, no stylesheet needed — swap in your authorize URL:</P>
        <Pre>{SIGN_IN_BUTTON_HTML}</Pre>
      </Section>

      <Section id="endpoints" title="Endpoints">
        <Table
          head={['Method', 'URL', 'Notes']}
          rows={[
            ['GET', `${ORIGIN}/.well-known/openid-configuration`, 'Discovery document.'],
            ['GET', `${ORIGIN}/gameid/authorize`, 'Where players sign in and consent.'],
            [
              'POST',
              `${ORIGIN}/api/gameid/oauth/token`,
              'Form-encoded. client_secret_basic, client_secret_post, or none (public + PKCE).',
            ],
            ['GET', `${ORIGIN}/api/gameid/oauth/userinfo`, 'Bearer access token.'],
            [
              'POST',
              `${ORIGIN}/api/gameid/oauth/revoke`,
              'RFC 7009. Revokes the token and its whole refresh chain.',
            ],
            [
              'GET',
              `${ORIGIN}/api/gameid/oauth/jwks.json`,
              'Public keys for ID tokens. Cache, and refetch on an unknown kid.',
            ],
          ]}
        />
        <P>The token, userinfo, revoke and JWKS endpoints accept requests from any origin.</P>
      </Section>

      <Section id="errors" title="Errors">
        <P>
          Errors on the token, userinfo and revoke endpoints follow RFC 6749:{' '}
          <Code>{'{ "error": "invalid_grant", "error_description": "…" }'}</Code>. Errors during
          sign-in come back to your redirect URI as <Code>?error=…&state=…</Code>:
        </P>
        <Table
          head={['error', 'Means']}
          rows={[
            ['access_denied', 'The player chose Cancel.'],
            ['invalid_scope', 'Scopes must include openid; only openid and profile exist.'],
            [
              'invalid_request',
              'Usually a missing or malformed PKCE challenge, or a method other than S256.',
            ],
            [
              'login_required / consent_required',
              'You sent prompt=none and the player is signed out or has not agreed yet.',
            ],
            [
              'invalid_grant',
              'At the token endpoint: the code or refresh token is wrong, expired, used, or the verifier or redirect URI does not match.',
            ],
            ['invalid_client', 'Unknown client, wrong secret, or a secret sent by a public app.'],
          ]}
        />
        <P>
          An unknown <Code>client_id</Code> or an unregistered <Code>redirect_uri</Code> is never
          redirected: the player sees an explanation on GameID instead.
        </P>
      </Section>

      <Section id="security" title="Security notes">
        <List
          items={[
            'Always check state on the way back, and iss if your library supports RFC 9207.',
            'Exchange codes straight away; they last ten minutes and work once.',
            'Keep client secrets on your server. If one leaks, rotate it from your app page — the old one stops working at once.',
            'Store refresh tokens like passwords. Rotate on every use; do not share one between devices.',
            'Players can disconnect your app from their GameID page at any time. Expect refreshes to fail with invalid_grant and send them through sign-in again.',
          ]}
        />
      </Section>
    </DocsPage>
  );
}
