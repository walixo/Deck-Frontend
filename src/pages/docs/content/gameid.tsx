import { SIGN_IN_BUTTON_HTML, SignInWithGameId } from '@/components/gameid/SignInWithGameId';
import {
  A,
  Callout,
  Cards,
  Code,
  Endpoint,
  H2,
  List,
  ORIGIN,
  P,
  Pre,
  Steps,
  Table,
  type DocProduct,
  type EndpointSpec,
} from '@/components/docs/kit';

/**
 * GameID for developers: "Sign in with GameID" — OAuth 2.0 authorization code
 * flow with PKCE, and OpenID Connect on top. The endpoints, parameters,
 * claims and errors are the ones the server implements.
 */

const ENDPOINTS: EndpointSpec[] = [
  {
    title: 'Discovery document',
    method: 'GET',
    path: '/.well-known/openid-configuration',
    auth: null,
    description:
      'Everything an OIDC library needs to configure itself. Point yours here and most of the setup is done.',
    response: {
      issuer: ORIGIN,
      authorization_endpoint: `${ORIGIN}/gameid/authorize`,
      token_endpoint: `${ORIGIN}/api/gameid/oauth/token`,
      userinfo_endpoint: `${ORIGIN}/api/gameid/oauth/userinfo`,
      revocation_endpoint: `${ORIGIN}/api/gameid/oauth/revoke`,
      jwks_uri: `${ORIGIN}/api/gameid/oauth/jwks.json`,
      response_types_supported: ['code'],
      response_modes_supported: ['query'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      subject_types_supported: ['pairwise'],
      id_token_signing_alg_values_supported: ['RS256'],
      scopes_supported: ['openid', 'profile'],
      claims_supported: [
        'sub',
        'iss',
        'aud',
        'exp',
        'iat',
        'auth_time',
        'nonce',
        'gameid',
        'preferred_username',
        'name',
        'picture',
      ],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'none'],
      authorization_response_iss_parameter_supported: true,
    },
  },
  {
    title: 'Authorize',
    method: 'GET',
    path: '/gameid/authorize',
    auth: null,
    description: (
      <>
        Not an API call — the page you send the player to. They sign in to Deck if needed, see what
        your app gets, and return to your <Code>redirect_uri</Code> with a <Code>code</Code>.
      </>
    ),
    query: [
      {
        name: 'client_id',
        type: 'string',
        required: true,
        description: 'gid_… from your app page.',
      },
      {
        name: 'redirect_uri',
        type: 'string',
        required: true,
        description: 'Must match a registered URI exactly.',
      },
      { name: 'response_type', type: 'string', required: true, description: 'code' },
      {
        name: 'scope',
        type: 'string',
        required: true,
        description: 'openid, optionally with profile.',
      },
      {
        name: 'state',
        type: 'string',
        required: true,
        description: 'Random; check it on the way back.',
      },
      {
        name: 'code_challenge',
        type: 'string',
        required: true,
        description: 'base64url(SHA-256(code_verifier)).',
      },
      { name: 'code_challenge_method', type: 'string', required: true, description: 'S256' },
      { name: 'nonce', type: 'string', description: 'Echoed in the ID token.' },
      { name: 'prompt', type: 'string', description: 'none, to fail instead of showing a page.' },
    ],
    exampleQuery:
      'client_id=gid_YOUR_CLIENT_ID&redirect_uri=https%3A%2F%2Fyourgame.com%2Fcallback&response_type=code&scope=openid%20profile&state=RANDOM_STATE&code_challenge=CHALLENGE&code_challenge_method=S256',
    status: 302,
    response: {
      location:
        'https://yourgame.com/callback?code=gac_…&state=RANDOM_STATE&iss=https%3A%2F%2Fonedeck.africa',
    },
  },
  {
    title: 'Exchange a code',
    method: 'POST',
    path: '/api/gameid/oauth/token',
    auth: undefined,
    form: true,
    description: (
      <>
        Form-encoded. Confidential apps authenticate with <Code>client_secret_basic</Code> (send{' '}
        <Code>-u client_id:secret</Code>) or <Code>client_secret_post</Code>; public apps send{' '}
        <Code>client_id</Code> and rely on PKCE. Codes last ten minutes and work once.
      </>
    ),
    body: [
      {
        name: 'grant_type',
        type: 'string',
        required: true,
        description: 'authorization_code, or refresh_token.',
      },
      { name: 'code', type: 'string', description: 'gac_… from the redirect.' },
      { name: 'redirect_uri', type: 'string', description: 'The same one used to authorize.' },
      { name: 'code_verifier', type: 'string', description: 'The verifier behind your challenge.' },
      { name: 'client_id', type: 'string', description: 'Public apps, and client_secret_post.' },
      {
        name: 'refresh_token',
        type: 'string',
        description: 'grt_…, for grant_type=refresh_token.',
      },
      { name: 'scope', type: 'string', description: 'On refresh, an equal or narrower scope.' },
    ],
    example: {
      grant_type: 'authorization_code',
      code: 'gac_THE_CODE',
      redirect_uri: 'https://yourgame.com/callback',
      client_id: 'gid_YOUR_CLIENT_ID',
      code_verifier: 'THE_VERIFIER',
    },
    response: {
      access_token: 'gat_…',
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: 'grt_…',
      id_token: 'eyJhbGciOiJSUzI1NiIs…',
      scope: 'openid profile',
    },
  },
  {
    title: 'Get the player',
    method: 'GET',
    path: '/api/gameid/oauth/userinfo',
    auth: 'gat_ACCESS_TOKEN',
    description: 'The signed-in player’s claims, for the scopes they granted.',
    response: {
      sub: 'gid_Q3m9…',
      gameid: 'GID-7F3K-9Q2M',
      preferred_username: 'priya',
      name: 'Priya Raman',
      picture: 'https://…',
    },
  },
  {
    title: 'Revoke a token',
    method: 'POST',
    path: '/api/gameid/oauth/revoke',
    auth: undefined,
    form: true,
    description:
      'RFC 7009. Revokes the token and its whole refresh chain. Always 200, even for an unknown token.',
    body: [
      { name: 'token', type: 'string', required: true, description: 'An access or refresh token.' },
      { name: 'client_id', type: 'string', description: 'Public apps.' },
    ],
    example: { token: 'grt_…', client_id: 'gid_YOUR_CLIENT_ID' },
    response: {},
  },
  {
    title: 'Signing keys',
    method: 'GET',
    path: '/api/gameid/oauth/jwks.json',
    auth: null,
    description:
      'Public keys for verifying ID tokens. Cache them, and refetch when you meet an unknown kid.',
    response: {
      keys: [{ kty: 'RSA', kid: 'gid-2026-10', use: 'sig', alg: 'RS256', n: '…', e: 'AQAB' }],
    },
  },
];

export const gameid: DocProduct = {
  id: 'gameid',
  name: 'GameID',
  apiBase: ORIGIN,
  groups: [
    {
      title: 'Get started',
      pages: [
        {
          slug: 'introduction',
          title: 'Introduction',
          lead: 'Add “Sign in with GameID”: standard OAuth 2.0 with PKCE, and OpenID Connect on top.',
          body: () => (
            <>
              <P>
                If your stack has an OIDC library, point it at the{' '}
                <A to="/docs/gameid/api#discovery-document">discovery URL</A> and you are most of
                the way there. GameID is built to give you as little to protect as possible: there
                is no email scope and no way to ask for one.
              </P>
              <Cards
                items={[
                  {
                    title: 'Quick start',
                    body: 'Register an app and sign a player in.',
                    to: '/docs/gameid/quickstart',
                    mark: '01',
                  },
                  {
                    title: 'The sign-in flow',
                    body: 'Every step, with a browser example.',
                    to: '/docs/gameid/flow',
                    mark: '→',
                  },
                  {
                    title: 'API reference',
                    body: 'Token, userinfo, revoke and keys.',
                    to: '/docs/gameid/api',
                    mark: '{}',
                  },
                ]}
              />
              <H2>What you get</H2>
              <Table
                head={['Scope', 'You receive', 'Notes']}
                rows={[
                  [
                    'openid',
                    'sub',
                    'Required. A stable ID for this player in your app only — different in every other app.',
                  ],
                  [
                    'profile',
                    'gameid, preferred_username, name, picture',
                    'Optional. The player’s public GameID: permanent code, handle, display name and avatar. Shown to the player before they agree.',
                  ],
                ]}
              />
              <P>
                Key your accounts on <Code>sub</Code>. Use the handle for display; it can change
                (once a month at most). The <Code>gameid</Code> code never changes, so it is the one
                to use to recognise the same player across your own titles.
              </P>
            </>
          ),
        },
        {
          slug: 'quickstart',
          title: 'Quick start',
          lead: 'Register your app, then send a player through sign-in.',
          body: () => (
            <>
              <H2>Register your app</H2>
              <P>
                <A to="/gameid/developers">Register it here</A> and choose:
              </P>
              <List
                items={[
                  'Confidential — you have a server that can keep a client secret. The secret is shown once.',
                  'Public — a browser, mobile or desktop game that cannot keep a secret. PKCE is required on every sign-in.',
                ]}
              />
              <P>
                Add every redirect URI you will use. They are matched exactly. Use https, or{' '}
                <Code>http://localhost</Code> while developing. Native apps may register a
                reverse-domain scheme such as <Code>com.yourstudio.game:/callback</Code>.
              </P>
              <H2>Sign a player in</H2>
              <Steps
                items={[
                  <>Make a PKCE pair and a random state.</>,
                  <>
                    Send the player to <A to="/docs/gameid/api#authorize">/gameid/authorize</A>.
                  </>,
                  <>
                    On your redirect URI, check <Code>state</Code> and{' '}
                    <A to="/docs/gameid/api#exchange-a-code">exchange the code</A> for tokens.
                  </>,
                  <>Read the player from the ID token, or from userinfo.</>,
                ]}
              />
              <P>
                The full walk-through, with a working browser example, is in{' '}
                <A to="/docs/gameid/flow">The sign-in flow</A>.
              </P>
            </>
          ),
        },
      ],
    },
    {
      title: 'Guides',
      pages: [
        {
          slug: 'flow',
          title: 'The sign-in flow',
          lead: 'Authorization code with PKCE, step by step, and a complete browser example.',
          body: () => (
            <>
              <H2>Steps</H2>
              <Steps
                items={[
                  <>
                    Make a PKCE pair: a random <Code>code_verifier</Code> (43–128 characters) and
                    its SHA-256, base64url-encoded, as the <Code>code_challenge</Code>. Make a
                    random <Code>state</Code> (and a <Code>nonce</Code> if you will read the ID
                    token).
                  </>,
                  <>Send the player to the authorize URL.</>,
                  <>
                    They sign in to Deck if needed and see your app, what it gets and what it never
                    gets. A player who already agreed is passed straight back.
                  </>,
                  <>
                    They return to your redirect URI with <Code>code</Code>, your <Code>state</Code>{' '}
                    and <Code>iss</Code>. Check that <Code>state</Code> matches, and{' '}
                    <Code>iss</Code> is <Code>{ORIGIN}</Code>.
                  </>,
                  <>Exchange the code from your server (or from the game, for public apps).</>,
                ]}
              />
              <H2>Browser example</H2>
              <Pre label="JavaScript">{`const b64url = (bytes) =>
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
            </>
          ),
        },
        {
          slug: 'tokens',
          title: 'Tokens and claims',
          lead: 'What each token is for, how long it lasts, and what the ID token says.',
          body: () => (
            <>
              <H2>Tokens</H2>
              <Table
                keyColumn="label"
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
                    'RS256, signed with a key from the JWKS. Verify iss, aud, exp and nonce.',
                  ],
                ]}
              />
              <H2>ID token claims</H2>
              <Pre label="JWT payload">{`{
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
              <H2>Refreshing</H2>
              <P>
                Refresh with <Code>grant_type=refresh_token</Code>. You may pass a narrower{' '}
                <Code>scope</Code>, never a wider one.
              </P>
            </>
          ),
        },
        {
          slug: 'button',
          title: 'The button',
          lead: 'The “Sign in with GameID” button, in plain HTML.',
          body: () => (
            <>
              <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-g-line bg-g-paper-2 p-6">
                <SignInWithGameId />
                <SignInWithGameId tone="light" />
              </div>
              <P>No stylesheet needed — swap in your authorize URL:</P>
              <Pre label="HTML">{SIGN_IN_BUTTON_HTML}</Pre>
            </>
          ),
        },
      ],
    },
    {
      title: 'Reference',
      pages: [
        {
          slug: 'api',
          title: 'API reference',
          lead: 'Discovery, authorize, token, userinfo, revoke and signing keys.',
          body: () => (
            <>
              <P>
                The token, userinfo, revoke and JWKS endpoints accept requests from any origin.
                OAuth endpoints return standard OAuth bodies, not Deck’s{' '}
                <Code>{'{ success, data }'}</Code> envelope.
              </P>
              {ENDPOINTS.map((spec) => (
                <Endpoint key={spec.title} base={ORIGIN} spec={spec} />
              ))}
            </>
          ),
        },
        {
          slug: 'errors',
          title: 'Errors',
          lead: 'OAuth errors at the endpoints, and errors that come back to your redirect URI.',
          body: () => (
            <>
              <P>
                Errors on the token, userinfo and revoke endpoints follow RFC 6749:{' '}
                <Code>{'{ "error": "invalid_grant", "error_description": "…" }'}</Code>. Errors
                during sign-in come back to your redirect URI as <Code>?error=…&state=…</Code>:
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
                  ['login_required', 'You sent prompt=none and the player is signed out.'],
                  ['consent_required', 'You sent prompt=none and the player has not agreed yet.'],
                  [
                    'invalid_grant',
                    'The code or refresh token is wrong, expired or used, or the verifier or redirect URI does not match.',
                  ],
                  [
                    'invalid_client',
                    'Unknown client, wrong secret, or a secret sent by a public app.',
                  ],
                ]}
              />
              <Callout>
                An unknown <Code>client_id</Code> or an unregistered <Code>redirect_uri</Code> is
                never redirected: the player sees an explanation on GameID instead.
              </Callout>
            </>
          ),
        },
        {
          slug: 'security',
          title: 'Security notes',
          lead: 'The handful of things that keep a GameID integration safe.',
          body: () => (
            <List
              items={[
                'Always check state on the way back, and iss if your library supports RFC 9207.',
                'Exchange codes straight away; they last ten minutes and work once.',
                'Keep client secrets on your server. If one leaks, rotate it from your app page — the old one stops working at once.',
                'Store refresh tokens like passwords. Rotate on every use; do not share one between devices.',
                'Players can disconnect your app from their GameID page at any time. Expect refreshes to fail with invalid_grant and send them through sign-in again.',
              ]}
            />
          ),
        },
      ],
    },
  ],
};
