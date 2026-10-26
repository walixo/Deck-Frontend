import {
  A,
  API,
  Callout,
  Cards,
  Code,
  Endpoint,
  Fn,
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
 * Deck Games for developers: hosting a web game on Deck, the SDK, the server
 * API, webhooks and payouts. Written against what the platform does — every
 * call, field and header here exists in the code.
 */

const KEY = 'dk_test_YOUR_KEY';

/* Served by the API host, never by onedeck.africa — a game must not share Deck's origin. */
const SAMPLE_URL = 'https://deck-backend-9js1.onrender.com/samples/four-in-a-row';

const ROOM = {
  roomId: 'rm_7f3k9c2a41b0',
  code: 'K7QX2M',
  status: 'playing',
  visibility: 'private',
  hostPlayerId: 'p_2fb0302b0eb86df41737',
  minPlayers: 2,
  maxPlayers: 4,
  players: [
    {
      playerId: 'p_2fb0302b0eb86df41737',
      displayName: 'Ada',
      ready: true,
      host: true,
      online: true,
    },
    {
      playerId: 'p_9c41d07e5a3b1f2e8d60',
      displayName: 'Tunde',
      ready: true,
      host: false,
      online: true,
    },
  ],
  state: { turn: 'p_9c41d07e5a3b1f2e8d60', board: 'rnbqkbnr/pppppppp/…' },
  results: [],
};

const PURCHASE = {
  reference: 'GP-7JB5JXFB',
  status: 'paid',
  mode: 'live',
  productId: 'suya.pack',
  productName: 'Suya pack',
  productType: 'one_off',
  playerId: 'p_2fb0302b0eb86df41737',
  priceMinor: 150000,
  currency: 'NGN',
  paidAt: '2026-10-15T11:21:48.042Z',
  deliveredAt: null,
  createdAt: '2026-10-15T11:20:02.511Z',
};

const ENDPOINTS: EndpointSpec[] = [
  {
    title: 'Check your key',
    method: 'GET',
    path: '/games/v1/me',
    auth: KEY,
    description:
      'Which game and which mode a key belongs to. A quick way to confirm your server is set up.',
    response: {
      success: true,
      data: { game: 'lagos-rush', title: 'Lagos Rush', mode: 'test', status: 'approved' },
    },
  },
  {
    title: 'Verify a player',
    method: 'POST',
    path: '/games/v1/session/verify',
    auth: KEY,
    description: (
      <>
        Trades the session token your game got from <Code>DeckGames.session()</Code> for the player
        behind it. This is the call that lets your server trust who is playing. A token that is
        expired, forged, for another game or from the other mode is refused with 401.
      </>
    ),
    body: [
      {
        name: 'token',
        type: 'string',
        required: true,
        description: 'The token from DeckGames.session().',
      },
    ],
    example: { token: 'gs_…' },
    response: {
      success: true,
      data: {
        playerId: 'p_2fb0302b0eb86df41737',
        displayName: 'Ada',
        mode: 'live',
        expiresAt: '2026-10-15T11:36:02.000Z',
      },
    },
  },
  {
    title: 'List products',
    method: 'GET',
    path: '/games/v1/products',
    auth: KEY,
    description: 'Every product in your store, including retired ones (active: false).',
    response: {
      success: true,
      data: [
        {
          productId: 'suya.pack',
          name: 'Suya pack',
          description: 'Ten extra lives',
          priceMinor: 150000,
          currency: 'NGN',
          type: 'one_off',
          active: true,
        },
      ],
    },
  },
  {
    title: 'Fetch a purchase',
    method: 'GET',
    path: '/games/v1/purchases/:reference',
    auth: KEY,
    description:
      'One purchase by its reference — the one in the webhook, or from DeckGames.purchase().',
    pathParams: [
      { name: 'reference', type: 'string', required: true, description: 'e.g. GP-7JB5JXFB.' },
    ],
    response: { success: true, data: PURCHASE },
  },
  {
    title: 'Mark a purchase delivered',
    method: 'POST',
    path: '/games/v1/purchases/:reference/deliver',
    auth: KEY,
    description:
      'Record that you have handed a paid purchase over. Idempotent — a second call returns the first delivery’s time.',
    pathParams: [
      { name: 'reference', type: 'string', required: true, description: 'The purchase to mark.' },
    ],
    response: { success: true, data: { ...PURCHASE, deliveredAt: '2026-10-15T11:21:50.117Z' } },
  },
  {
    title: 'A player’s purchases',
    method: 'GET',
    path: '/games/v1/players/:playerId/purchases',
    auth: KEY,
    description:
      'Everything one player has bought. Run it with ?status=paid&undelivered=true when a player connects, to catch up on any webhook you missed.',
    pathParams: [
      {
        name: 'playerId',
        type: 'string',
        required: true,
        description: 'p_… for live, t_… for test.',
      },
    ],
    query: [
      {
        name: 'status',
        type: 'string',
        description: 'Only purchases with this status, e.g. paid.',
      },
      {
        name: 'undelivered',
        type: 'boolean',
        description: 'Only purchases not yet marked delivered.',
      },
    ],
    exampleQuery: 'status=paid&undelivered=true',
    response: { success: true, data: [PURCHASE] },
  },
  {
    title: 'Fetch a room',
    method: 'GET',
    path: '/games/v1/rooms/:roomId',
    auth: KEY,
    description: 'A multiplayer room with its players, shared state and results.',
    pathParams: [{ name: 'roomId', type: 'string', required: true, description: 'rm_…' }],
    response: { success: true, data: ROOM },
  },
  {
    title: 'Set room state',
    method: 'POST',
    path: '/games/v1/rooms/:roomId/state',
    auth: KEY,
    description: (
      <>
        Sets the room’s shared state as the authority. Every player gets a <Code>state</Code> event
        from <Code>server</Code>. Up to 16 KB.
      </>
    ),
    pathParams: [{ name: 'roomId', type: 'string', required: true, description: 'rm_…' }],
    body: [
      { name: 'state', type: 'any JSON', required: true, description: 'The new shared state.' },
    ],
    example: { state: { turn: 'p_2fb0302b0eb86df41737', board: 'rnbqkbnr/pppppppp/…' } },
    response: { success: true, data: ROOM },
  },
  {
    title: 'Message a room',
    method: 'POST',
    path: '/games/v1/rooms/:roomId/messages',
    auth: KEY,
    description: (
      <>
        A message from <Code>server</Code>. Players receive it as a <Code>message</Code> event.
      </>
    ),
    pathParams: [{ name: 'roomId', type: 'string', required: true, description: 'rm_…' }],
    body: [
      { name: 'data', type: 'any JSON', required: true, description: 'Up to 4 KB.' },
      { name: 'to', type: 'string', description: 'all (default), others, host, or a player ID.' },
    ],
    example: { data: { yourTurn: true }, to: 'p_9c41d07e5a3b1f2e8d60' },
    response: { success: true, data: { delivered: 1 } },
  },
  {
    title: 'End a room with results',
    method: 'POST',
    path: '/games/v1/rooms/:roomId/end',
    auth: KEY,
    description:
      'Ends the room and tells every player. In live mode, scores go to your leaderboard, keeping each player’s best. Only results sent from your server count.',
    pathParams: [{ name: 'roomId', type: 'string', required: true, description: 'rm_…' }],
    body: [
      {
        name: 'results',
        type: 'array',
        required: true,
        description:
          'Up to 16 of { playerId, rank (1–100), score? }. Every playerId must be in the room.',
      },
    ],
    example: {
      results: [
        { playerId: 'p_2fb0302b0eb86df41737', rank: 1, score: 2400 },
        { playerId: 'p_9c41d07e5a3b1f2e8d60', rank: 2, score: 1800 },
      ],
    },
    response: {
      success: true,
      data: {
        ...ROOM,
        status: 'ended',
        results: [
          { playerId: 'p_2fb0302b0eb86df41737', rank: 1, score: 2400 },
          { playerId: 'p_9c41d07e5a3b1f2e8d60', rank: 2, score: 1800 },
        ],
      },
    },
  },
];

/** The three parties and the two directions trust flows. */
function Diagram() {
  const box = 'rounded-2xl border border-g-line bg-g-paper p-4 text-center';
  return (
    <div className="mt-6 grid items-center gap-3 rounded-3xl bg-g-paper-2 p-5 text-[13px] sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
      <div className={box}>
        <p className="font-semibold">Your game</p>
        <p className="mt-1 text-[11px] text-g-mute">in the sandboxed frame</p>
      </div>
      <p className="text-center font-mono text-[10px] uppercase tracking-[0.14em] text-g-mute">
        SDK ⇄
      </p>
      <div className={box}>
        <p className="font-semibold">Deck player</p>
        <p className="mt-1 text-[11px] text-g-mute">sign-in, checkout, scores</p>
      </div>
      <p className="text-center font-mono text-[10px] uppercase tracking-[0.14em] text-g-mute">
        API · webhooks ⇄
      </p>
      <div className={box}>
        <p className="font-semibold">Your server</p>
        <p className="mt-1 text-[11px] text-g-mute">verifies, grants, delivers</p>
      </div>
    </div>
  );
}

export const developers: DocProduct = {
  id: 'developers',
  name: 'Developers',
  apiBase: API,
  groups: [
    {
      title: 'Get started',
      pages: [
        {
          slug: 'introduction',
          title: 'Introduction',
          lead: 'Host your web game anywhere, add one script, and Deck brings the players, sign-in, store and payouts.',
          body: () => (
            <>
              <P>
                Deck Games runs your web game in a player built for phones and laptops, with Deck’s
                players, sign-in, store, multiplayer and payouts behind it. You keep 80% of every
                sale.
              </P>
              <Cards
                items={[
                  {
                    title: 'Quick start',
                    body: 'Register a game and connect the SDK in minutes.',
                    to: '/docs/developers/quickstart',
                    mark: '01',
                  },
                  {
                    title: 'SDK reference',
                    body: 'Every call your game can make in the browser.',
                    to: '/docs/developers/sdk',
                    mark: 'JS',
                  },
                  {
                    title: 'Server API',
                    body: 'Verify players, read purchases, run rooms.',
                    to: '/docs/developers/api',
                    mark: '{}',
                  },
                  {
                    title: 'Multiplayer',
                    body: 'Rooms, invites and quick match — no server of your own.',
                    to: '/docs/developers/multiplayer',
                    mark: 'MP',
                  },
                  {
                    title: 'Webhooks',
                    body: 'Signed events the moment a purchase is paid.',
                    to: '/docs/developers/webhooks',
                    mark: '⇄',
                  },
                  {
                    title: 'Payouts',
                    body: 'How the 80/20 split and transfers work.',
                    to: '/docs/developers/payouts',
                    mark: '₦',
                  },
                ]}
              />
              <H2>How it works</H2>
              <P>
                Your game is a web page you host, on your own domain, over https. Deck shows it
                inside the Deck Games player — a sandboxed iframe sized for your game’s orientation
                — and gives it a small JavaScript SDK that talks to the player by{' '}
                <Code>postMessage</Code>.
              </P>
              <P>
                The player does everything that needs a Deck account: signing the player in, opening
                checkout, posting scores. Your game never sees a Deck password, cookie or email
                address. Each player gets a <strong>player ID</strong> that is random, stable for
                them in your game, and different in every other game.
              </P>
              <Diagram />
              <Callout>
                Anything you grant — items, coins, unlocks — should be granted by your server, after
                Deck’s server confirms it. The browser can be edited; Deck’s server API and signed
                webhooks cannot.
              </Callout>
            </>
          ),
        },
        {
          slug: 'quickstart',
          title: 'Quick start',
          lead: 'From a web game to a game on Deck: register, add the SDK, test, and submit.',
          body: () => (
            <>
              <H2>Register and connect</H2>
              <Steps
                items={[
                  <>
                    <A to="/games/developers/new">Register your game</A> with its live URL,
                    orientation and genre. Nobody sees it until it’s reviewed.
                  </>,
                  <>Add the SDK to your game’s page and connect on load:</>,
                ]}
              />
              <Pre label="HTML">{`<script src="${ORIGIN}/sdk/deck-games-v1.js"></script>
<script>
  const deck = await DeckGames.init();
  if (deck.standalone) {
    // Opened outside Deck — run as a plain web game.
  } else {
    console.log('Hello', deck.player?.displayName, 'in', deck.mode, 'mode');
  }
  // …load your assets, then:
  DeckGames.ready();
</script>`}</Pre>
              <H2>Test, then submit</H2>
              <Steps
                start={3}
                items={[
                  <>
                    In your game’s developer page, create a <strong>test key</strong> and a{' '}
                    <strong>webhook</strong>, and add a product if you sell anything.
                  </>,
                  <>
                    Press <strong>Play in test mode</strong>. Buy something — nothing is charged —
                    and watch the webhook arrive at your server.
                  </>,
                  <>
                    When it all works, it’s already submitted: Deck reviews it, and once approved
                    your live key and the live store switch on.
                  </>,
                ]}
              />
            </>
          ),
        },
      ],
    },
    {
      title: 'Build',
      pages: [
        {
          slug: 'orientation',
          title: 'Portrait, landscape and full screen',
          lead: 'How the player frames your game on every screen, and how full screen works.',
          body: () => (
            <>
              <H2>Orientation</H2>
              <P>Choose one when you register; change it any time in Settings.</P>
              <Table
                keyColumn="label"
                head={['Orientation', 'Desktop', 'Phone']}
                rows={[
                  [
                    'Portrait',
                    'A 9:16 column, as tall as the screen allows',
                    'Fills the screen held upright; asks to be turned if held sideways',
                  ],
                  [
                    'Landscape',
                    'A 16:9 band, as wide as the page',
                    'Asks to be turned sideways; full screen locks to landscape where the browser allows',
                  ],
                  ['Either way', 'Fills the stage', 'Fills the screen whichever way it is held'],
                ]}
              />
              <P>
                Design for the frame, not the window: size to <Code>window.innerWidth</Code> and{' '}
                <Code>innerHeight</Code> inside your page and listen for resize. The SDK also sends
                an <Code>orientation</Code> event when the device turns. Players can always choose
                “play anyway”, so a portrait game should not break if it is briefly given a wide
                frame.
              </P>
              <H2>Full screen</H2>
              <P>
                The player has a full-screen button on the stage, and your game can ask with{' '}
                <Code>DeckGames.fullscreen()</Code> from a tap. When the screen is your game’s shape
                the frame fills it edge to edge; when it isn’t, the frame keeps its shape and the
                rest goes dark.
              </P>
              <P>
                Where a browser refuses real full screen — iPhone Safari above all — Deck covers the
                whole viewport instead, inside the safe areas, and Escape brings it back. Either way
                your game gets a <Code>fullscreen</Code> event and a resize.
              </P>
              <H2>The frame</H2>
              <P>
                The frame allows <Code>fullscreen</Code>, <Code>gamepad</Code>,{' '}
                <Code>autoplay</Code> and motion sensors. Scripts, your own storage and pointer lock
                are allowed; top-level navigation, popups, forms, camera, microphone and location
                are not.
              </P>
            </>
          ),
        },
        {
          slug: 'sdk',
          title: 'SDK reference',
          lead: 'Every call your game makes in the browser. Each one returns a promise; errors carry a code.',
          body: () => (
            <>
              <H2>Connecting</H2>
              <Fn
                name="DeckGames.init()"
                returns="{ standalone, mode, orientation, viewport, player, multiplayer, invite }"
              >
                Connects to the player. Outside Deck it resolves after about 1.5 seconds with{' '}
                <Code>standalone: true</Code>. <Code>player</Code> is{' '}
                <Code>{'{ playerId, displayName }'}</Code> if someone is signed in, otherwise{' '}
                <Code>null</Code>. <Code>mode</Code> is <Code>test</Code> or <Code>live</Code>.{' '}
                <Code>multiplayer</Code> is <Code>{'{ minPlayers, maxPlayers }'}</Code> when it is
                on, and <Code>invite</Code> is a room code when the player came through an invite
                link.
              </Fn>
              <Fn name="DeckGames.ready()" returns="—">
                Tells the player your game has loaded so it can drop the loading screen. If you
                never call it, the player lifts the curtain after a few seconds anyway.
              </Fn>
              <Fn
                name="DeckGames.session()"
                returns="{ token, playerId, displayName, mode, expiresAt }"
              >
                A fresh 15-minute session token. Send it to your server and{' '}
                <A to="/docs/developers/api#verify-a-player">verify it there</A>. If the player is
                signed out, Deck asks them to sign in and this rejects with <Code>signed_out</Code>.
              </Fn>
              <H2>Store</H2>
              <Fn name="DeckGames.products()" returns="Product[]">
                Your active products: <Code>productId</Code>, <Code>name</Code>,{' '}
                <Code>description</Code>, <Code>priceMinor</Code>, <Code>currency</Code>,{' '}
                <Code>type</Code> (<Code>one_off</Code> or <Code>consumable</Code>).
              </Fn>
              <Fn name="DeckGames.purchase(productId)" returns="{ reference, status, productId }">
                Opens Deck checkout in a separate window so your game keeps running. Resolves with{' '}
                <Code>paid</Code> or <Code>cancelled</Code> (or <Code>pending</Code> if checkout ran
                past 15 minutes). Prices come from Deck, never from the call. Treat this as a hint
                for your UI; grant the item when your server gets <Code>purchase.paid</Code>. A
                one-off the player already owns rejects with a conflict, and a second purchase while
                checkout is open rejects with <Code>busy</Code>.
              </Fn>
              <Fn name="DeckGames.getPurchases()" returns="Purchase[]">
                Everything this player has bought in your game.
              </Fn>
              <H2>Scores</H2>
              <Fn name="DeckGames.submitScore(score)" returns="{ best, improved, rank }">
                Posts a whole-number score to your Deck leaderboard. Live mode only; at most once
                every 10 seconds. Scores come from the browser, so never tie rewards to them.
              </Fn>
              <Fn name="DeckGames.leaderboard()" returns="{ scores, players, you }">
                The top ten and the player’s own place.
              </Fn>
              <H2>Screen and events</H2>
              <Fn name="DeckGames.fullscreen(on?)" returns="{ active }">
                Asks the player to go full screen; <Code>fullscreen(false)</Code> comes back, and no
                argument toggles. Call it from a tap or a click — browsers only allow full screen in
                answer to the player.
              </Fn>
              <Fn name="DeckGames.on(event, fn)" returns="unsubscribe()">
                <Code>pause</Code> and <Code>resume</Code> when the tab is hidden or shown;{' '}
                <Code>orientation</Code> with <Code>{'{ orientation, viewport }'}</Code> on rotate
                or resize; <Code>fullscreen</Code> with <Code>{'{ active }'}</Code>; and the{' '}
                <A to="/docs/developers/multiplayer#events">multiplayer events</A>.
              </Fn>
              <Callout>
                Testing against a local copy of Deck? Allow its origin on the script tag:{' '}
                <Code>{'data-deck-origins="http://localhost:3000"'}</Code>. The SDK only listens to
                the window it is framed by, from an allowed Deck origin.
              </Callout>
            </>
          ),
        },
        {
          slug: 'multiplayer',
          title: 'Multiplayer',
          lead: 'Rooms, invite links and quick match, run by Deck — no game server of your own.',
          body: () => (
            <>
              <P>
                Switch multiplayer on in your game’s Settings and choose how many players a room
                holds — 2 to 16. Players find each other by a six-character room code, an invite
                link, or quick match. Messages and shared state travel through Deck in real time;
                your game still never holds a Deck credential.
              </P>
              <Pre label="JavaScript">{`const deck = await DeckGames.init();
const room = deck.invite
  ? await DeckGames.multiplayer.join(deck.invite)
  : await DeckGames.multiplayer.quickMatch();

DeckGames.on('room', (room) => drawLobby(room.players));
DeckGames.on('started', () => beginRound());
DeckGames.on('message', ({ from, data }) => applyMove(from, data));
DeckGames.on('state', ({ state }) => syncBoard(state));

await DeckGames.multiplayer.setReady(true);
// The host, once enough players are ready:
await DeckGames.multiplayer.start();
DeckGames.multiplayer.send({ move: 'e4' });`}</Pre>
              <H2>Calls</H2>
              <Fn name="multiplayer.create({ visibility })" returns="Room">
                A new room with you as host. Rooms are <Code>private</Code> (code or invite only)
                unless you pass <Code>{"visibility: 'public'"}</Code>, which lets quick match fill
                them.
              </Fn>
              <Fn name="multiplayer.join(code)" returns="Room">
                Joins by code. Rejects if the room is full, has started or has ended.
              </Fn>
              <Fn name="multiplayer.quickMatch()" returns="Room">
                The oldest open public room with a free seat, or a new public one with you as host.
              </Fn>
              <Fn name="multiplayer.room()" returns="Room | null">
                The room you are in, as last heard.
              </Fn>
              <Fn name="multiplayer.setReady(ready)" returns="Room">
                Marks you ready (or not) in the lobby.
              </Fn>
              <Fn name="multiplayer.start()" returns="Room">
                Host only, once the room has its minimum players. Everyone gets <Code>started</Code>
                .
              </Fn>
              <Fn name="multiplayer.send(data, { to })" returns="{ delivered }">
                Any JSON up to 4 KB. <Code>to</Code> is <Code>others</Code> (the default),{' '}
                <Code>all</Code>, <Code>host</Code>, or a player ID. Up to 20 messages a second per
                player, with bursts of 30.
              </Fn>
              <Fn name="multiplayer.setState(state)" returns="Room">
                Host only. Shared state up to 16 KB, kept on the room and sent to everyone as a{' '}
                <Code>state</Code> event — late joiners read it from the room.
              </Fn>
              <Fn name="multiplayer.leave()" returns="{ left }">
                Leaves the room. If the host leaves, the next player becomes host; when the last
                player leaves, the room ends.
              </Fn>
              <Fn name="multiplayer.end()" returns="Room">
                Host only. Ends the room without results — ranked results come from your server.
              </Fn>
              <H2>Events</H2>
              <Table
                keyColumn="code"
                head={['Event', 'Data', 'When']}
                rows={[
                  ['room', 'Room', 'Anyone joins, leaves, readies, or the host changes'],
                  ['started', 'Room', 'The host starts the game'],
                  [
                    'message',
                    '{ from, data, at }',
                    'A message arrives — from is a player ID or server',
                  ],
                  ['state', '{ state, from }', 'The host or your server sets shared state'],
                  ['ended', 'Room', 'The room ends, with results if your server sent them'],
                ]}
              />
              <H2>Rooms and invites</H2>
              <P>
                A room is{' '}
                <Code>
                  {
                    '{ roomId, code, status, visibility, hostPlayerId, minPlayers, maxPlayers, players, state, results }'
                  }
                </Code>
                , and each player is <Code>{'{ playerId, displayName, ready, host, online }'}</Code>
                . Status runs <Code>open</Code> → <Code>playing</Code> → <Code>ended</Code>. A room
                left idle for two hours is cleared away.
              </P>
              <P>
                Share <Code>{`${ORIGIN}/games/{your-game}?room=CODE`}</Code>. Whoever opens it gets
                the code as <Code>init().invite</Code> — pass it to <Code>join()</Code>.
              </P>
              <Callout tone="warning">
                Messages come from browsers, and browsers can be edited. For anything competitive,
                let one side decide: the host’s <Code>setState</Code> for casual games, or{' '}
                <A to="/docs/developers/api#fetch-a-room">your server</A> — which can read any room,
                set its state, message it and end it with results — when it matters. Only results
                your server sends reach the leaderboard.
              </Callout>
            </>
          ),
        },
        {
          slug: 'sample',
          title: 'Sample: Four in a Row',
          lead: 'A complete two-player game on Deck rooms — one HTML file, nothing in it special to Deck.',
          body: () => (
            <>
              <P>
                Four in a Row is the sample to read before you build your own multiplayer game. It
                uses quick match, private rooms, codes, ready-up and shared state, and it falls back
                to two players on one screen when opened outside Deck. Play it from{' '}
                <A to="/games/rooms">Rooms</A>, or read the source:{' '}
                <a href={SAMPLE_URL} className="underline" target="_blank" rel="noreferrer">
                  four-in-a-row
                </a>{' '}
                (view source in your browser).
              </P>
              <H2>How it fits together</H2>
              <Steps
                items={[
                  <>
                    <Code>init()</Code> on load. If the player came through an invite link,{' '}
                    <Code>invite</Code> holds the code and the game joins it straight away — that is
                    how Deck’s Rooms page opens a game into a room.
                  </>,
                  <>
                    Otherwise the menu offers <Code>quickMatch()</Code>,{' '}
                    <Code>{"create({ visibility: 'private' })"}</Code> and <Code>join(code)</Code>.
                  </>,
                  <>
                    In the lobby each player calls <Code>setReady(true)</Code>. When everyone is
                    ready, the host calls <Code>start()</Code>.
                  </>,
                  <>
                    The host’s copy is the referee. A guest sends its move to the host; the host
                    checks it and publishes the board with <Code>setState()</Code>.
                  </>,
                  <>
                    Everyone — host included — draws from the <Code>state</Code> event. After a
                    refresh, <Code>multiplayer.room()</Code> returns the room with its state, so the
                    board comes back as it was.
                  </>,
                ]}
              />
              <Pre label="The referee">{`DeckGames.on('message', ({ from, data }) => {
  if (room.hostPlayerId !== me) return;          // only the host decides
  const next = play(game, game.order.indexOf(from), data.col);
  if (next) DeckGames.multiplayer.setState(next); // illegal moves are ignored
});

DeckGames.on('state', ({ state }) => {
  game = state;
  render();                                       // one drawing path for everyone
});

function move(col) {
  if (room.hostPlayerId === me) referee(me, { col });
  else DeckGames.multiplayer.send({ col }, { to: 'host' });
}`}</Pre>
              <Callout>
                A host referee is right for a casual game: the other player cannot cheat the host,
                though a host could cheat a guest. For anything ranked, make your server the referee
                with the <A to="/docs/developers/api">server API</A> — only results your server sends
                reach the leaderboard.
              </Callout>
              <H2>Make it yours</H2>
              <List
                items={[
                  'Register it with your own URL, switch multiplayer on with 2 to 2 players, and play it in test mode.',
                  'Open the multiplayer sandbox to sit in both seats at once.',
                  'Swap the rules in play() for your own game; the room code around it stays the same.',
                ]}
              />
            </>
          ),
        },
        {
          slug: 'test-mode',
          title: 'Test mode and the sandbox',
          lead: 'Build against simulated purchases and real webhooks, and test multiplayer on your own.',
          body: () => (
            <>
              <H2>Test mode</H2>
              <P>
                Before review, test mode is the only mode, and only you (and Deck staff) can open
                your game. After approval you can switch between test and live on your game’s page.
              </P>
              <List
                items={[
                  'Purchases are simulated: nothing is charged and they settle instantly.',
                  'Webhooks fire for real, signed exactly as live ones are, with "mode": "test".',
                  'Test players have t_ IDs and are invisible to your live key, and vice versa.',
                  'Set a test build URL in Settings — even http://localhost — and test mode loads it in the real player.',
                  'Scores are not recorded in test mode.',
                ]}
              />
              <H2>Multiplayer sandbox</H2>
              <P>
                You are one person, so the sandbox seats you up to four times: open it from your
                game’s Settings and each seat runs your test build as a separate test player — Test
                player 1 to 4, each with its own <Code>t_</Code> ID.
              </P>
              <Steps
                items={[
                  'Press play in every seat.',
                  'Create a room in seat 1 and read its code.',
                  'Join from the other seats by code, or quick match in each with a public room.',
                  'Ready up, start as the host, and send messages and state between the seats.',
                ]}
              />
              <P>
                A room panel shows who is in, who is online, the host and the shared state — and
                your server’s test key sees the same rooms.
              </P>
            </>
          ),
        },
      ],
    },
    {
      title: 'Server',
      pages: [
        {
          slug: 'api',
          title: 'Server API',
          lead: 'Verify players, read purchases and run multiplayer rooms from your own server.',
          body: () => (
            <>
              <P>
                Base URL <Code>{`${API}/games/v1`}</Code>. Authenticate with your key:{' '}
                <Code>Authorization: Bearer dk_test_…</Code> or <Code>dk_live_…</Code>. A test key
                only sees test players and purchases; a live key only live ones. Keys are secrets —
                keep them on your server.
              </P>
              <P>
                Responses are <Code>{'{ success: true, data }'}</Code>; errors are{' '}
                <Code>{'{ success: false, error: { message } }'}</Code> with an HTTP status.
              </P>
              {ENDPOINTS.map((spec) => (
                <Endpoint key={spec.title} base={API} spec={spec} />
              ))}
            </>
          ),
        },
        {
          slug: 'webhooks',
          title: 'Webhooks',
          lead: 'Signed events the moment a purchase is paid, and when multiplayer rooms start and end.',
          body: () => (
            <>
              <H2>Events</H2>
              <P>
                Deck POSTs JSON to your endpoint the moment a purchase is paid. Each request carries{' '}
                <Code>X-Deck-Event</Code> and <Code>X-Deck-Signature: t=…,v1=…</Code>.
              </P>
              <Table
                head={['Event', 'When', 'Retried']}
                rows={[
                  ['purchase.paid', 'A player’s payment clears', 'Yes'],
                  ['ping', 'You press “Send a test” on the Keys tab', 'No'],
                  ['room.started', 'A multiplayer room starts', 'No'],
                  ['room.ended', 'A multiplayer room ends', 'No'],
                ]}
              />
              <Pre label="purchase.paid">{`{
  "id": "evt_GP-7JB5JXFB_paid",
  "type": "purchase.paid",
  "created_at": "2026-10-15T11:21:48.042Z",
  "mode": "live",
  "game": "lagos-rush",
  "data": {
    "reference": "GP-7JB5JXFB",
    "productId": "suya.pack",
    "productName": "Suya pack",
    "productType": "one_off",
    "playerId": "p_2fb0302b0eb86df41737",
    "priceMinor": 150000,
    "developerShareMinor": 120000,
    "currency": "NGN",
    "paidAt": "2026-10-15T11:21:48.042Z"
  }
}`}</Pre>
              <H2>Verifying the signature</H2>
              <P>
                The signature is an HMAC-SHA256, in hex, of <Code>{'"{t}.{raw body}"'}</Code> with
                your signing secret. Verify it against the <em>raw</em> body, and reject anything
                more than five minutes old.
              </P>
              <Pre label="Node · Express">{`import crypto from 'node:crypto';

app.post('/deck/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const header = req.get('X-Deck-Signature') ?? '';
  const { t, v1 } = Object.fromEntries(header.split(',').map((p) => p.split('=')));
  const expected = crypto
    .createHmac('sha256', process.env.DECK_WEBHOOK_SECRET)
    .update(\`\${t}.\${req.body}\`)
    .digest('hex');
  const fresh = Math.abs(Date.now() / 1000 - Number(t)) < 300;
  if (!fresh || !v1 || !crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected))) {
    return res.status(401).end();
  }
  const event = JSON.parse(req.body);
  // Seen event.id before? Acknowledge and stop.
  // Otherwise grant event.data.productId to event.data.playerId, then call /deliver.
  res.status(200).end();
});`}</Pre>
              <H2>Delivery and retries</H2>
              <P>
                Delivery is at least once: dedupe on <Code>id</Code>. Anything but a 2xx is retried
                — after 1 minute, 5 minutes, 30 minutes, 2 hours and 6 hours — then marked failed.
                Redirects are not followed. You can resend any purchase from the Sales tab.
                Endpoints must be https and publicly reachable.
              </P>
              <P>
                <Code>room.started</Code> and <Code>room.ended</Code> use the same envelope, signed
                the same way, with the room as <Code>data</Code>. They are sent once — read the room
                from the API if you miss one.
              </P>
            </>
          ),
        },
      ],
    },
    {
      title: 'Business',
      pages: [
        {
          slug: 'payouts',
          title: 'Money and payouts',
          lead: 'The 80/20 split, the 14-day hold, and how your share reaches your bank.',
          body: () => (
            <>
              <H2>The split</H2>
              <P>
                Players pay in naira through Bachs. Of every live purchase,{' '}
                <strong>80% is yours</strong> and 20% is Deck’s. The split is fixed at the moment of
                sale. Prices run from ₦100 to ₦500,000.
              </P>
              <H2>Getting paid</H2>
              <P>
                Your share is held for <strong>14 days</strong> to cover refunds and disputes, then
                sent automatically to your own Bachs account. Set that account up once, from{' '}
                <A to="/games/developers">your games</A> — Bachs collects your bank and identity
                details directly; Deck never sees them. Balances under ₦100 wait for the next sale.
              </P>
              <P>
                Earnings and transfers show on your developer page and in your Deck shop dashboard.
              </P>
            </>
          ),
        },
        {
          slug: 'review',
          title: 'Review and rules',
          lead: 'What a game needs to pass review, and what stays yours to change afterwards.',
          body: () => (
            <>
              <P>
                A person reviews every game before it goes live, and again if a rejected game is
                resubmitted.
              </P>
              <H2>Requirements</H2>
              <List
                items={[
                  'The game must load over https from your own domain — never a Deck domain.',
                  `It must allow being framed by ${ORIGIN}: no X-Frame-Options: DENY, and if you send a CSP frame-ancestors, include onedeck.africa.`,
                  'It must work in the orientation you chose, on a phone and a laptop.',
                  'It must never ask for a password, card number or other credentials. Payments only through DeckGames.purchase().',
                  'No malware, crypto-mining, deceptive ads or content that breaks Deck’s terms.',
                ]}
              />
              <H2>After approval</H2>
              <P>
                Your URL and write-up are locked to what was reviewed. Orientation, webhooks, keys
                and products stay yours to change.
              </P>
            </>
          ),
        },
      ],
    },
  ],
};
