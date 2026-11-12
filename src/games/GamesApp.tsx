import { Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Layout } from '@/components/layout/Layout';
import { lazyNamed } from '@/lib/lazy';
import { DECK_ORIGIN, onDeckDomain } from '@/lib/host';
import { NotFound } from '@/pages/NotFound';

/**
 * `game.onedeck.africa` — Deck Games as a site of its own.
 *
 * The same pages the apex serves under `/games`, with the arcade at the front
 * door instead of behind one. The paths keep their `/games` prefix on purpose:
 * every link in Deck Games is written that way, dozens of them, and so is the
 * `/api/games` surface they are easy to confuse with. Rewriting them would buy
 * a shorter URL and risk sending a fetch somewhere a fetch should not go. The
 * root redirects instead, which is the part a visitor actually types.
 *
 * Its documentation, GameID and the sign-in pages come along, because the
 * arcade links to all three and a link that leaves the subdomain mid-flow is a
 * link that loses the session. Everything else on Deck stays on Deck, and this
 * host sends people there rather than answering for it.
 *
 * One thing is worth knowing before this goes live: the session lives in
 * `localStorage`, which is per-origin, so signing in on Deck does not sign you
 * in here. That is why `/login` is routed on this host at all. Sharing one
 * session across both would mean moving the token to a cookie on
 * `.onedeck.africa`, which is a change to how Deck authenticates rather than a
 * change to where its pages are served.
 */

const GamesShell = lazyNamed(() => import('@/components/deckgames/GamesShell'), 'GamesShell');
const GamesHome = lazyNamed(() => import('@/pages/games/GamesHome'), 'GamesHome');
const GamePage = lazyNamed(() => import('@/pages/games/GamePage'), 'GamePage');
const DevHome = lazyNamed(() => import('@/pages/games/DevHome'), 'DevHome');
const DevNewGame = lazyNamed(() => import('@/pages/games/DevNewGame'), 'DevNewGame');
const DevGame = lazyNamed(() => import('@/pages/games/DevGame'), 'DevGame');
const DevSandbox = lazyNamed(() => import('@/pages/games/DevSandbox'), 'DevSandbox');
const DevChallenges = lazyNamed(() => import('@/pages/games/DevChallenges'), 'DevChallenges');
const DevChallengeNew = lazyNamed(() => import('@/pages/games/DevChallenges'), 'DevChallengeNew');
const DevChallenge = lazyNamed(() => import('@/pages/games/DevChallenges'), 'DevChallenge');
const AgentGames = lazyNamed(() => import('@/pages/games/AgentGames'), 'AgentGames');
const Rooms = lazyNamed(() => import('@/pages/games/Rooms'), 'Rooms');
const PurchaseComplete = lazyNamed(
  () => import('@/pages/games/PurchaseComplete'),
  'PurchaseComplete',
);

const GameIdHome = lazyNamed(() => import('@/pages/gameid/GameIdHome'), 'GameIdHome');
const GameIdAuthorize = lazyNamed(() => import('@/pages/gameid/GameIdAuthorize'), 'GameIdAuthorize');
const GameIdDevelopers = lazyNamed(
  () => import('@/pages/gameid/GameIdDevelopers'),
  'GameIdDevelopers',
);
const GameIdApp = lazyNamed(() => import('@/pages/gameid/GameIdApp'), 'GameIdApp');
const AgentClaim = lazyNamed(() => import('@/pages/gameid/AgentClaim'), 'AgentClaim');
const AgentProfile = lazyNamed(() => import('@/pages/gameid/AgentProfile'), 'AgentProfile');
const Docs = lazyNamed(() => import('@/pages/docs/Docs'), 'Docs');

const Login = lazyNamed(() => import('@/pages/Login'), 'Login');
const Register = lazyNamed(() => import('@/pages/Register'), 'Register');
const AuthCallback = lazyNamed(() => import('@/pages/AuthCallback'), 'AuthCallback');

const lazy = (element: React.ReactNode) => <Suspense fallback={null}>{element}</Suspense>;

export function GamesApp() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/games" replace />} />

      <Route path="/games" element={lazy(<GamesShell />)}>
        <Route index element={<GamesHome />} />
        <Route path="developers" element={<DevHome />} />
        <Route path="developers/docs" element={<Navigate to="/docs/developers" replace />} />
        <Route path="agents" element={<AgentGames />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="agents/docs" element={<Navigate to="/docs/circuit" replace />} />
        <Route element={<RequireAuth />}>
          <Route path="developers/new" element={<DevNewGame />} />
          <Route path="developers/challenges" element={<DevChallenges />} />
          <Route path="developers/challenges/new" element={<DevChallengeNew />} />
          <Route path="developers/challenges/:slug" element={<DevChallenge />} />
          <Route path="developers/:slug" element={<DevGame />} />
          <Route path="developers/:slug/sandbox" element={<DevSandbox />} />
          <Route path="purchase/complete" element={<PurchaseComplete />} />
        </Route>
        <Route path=":slug" element={<GamePage />} />
      </Route>

      {/* GameID's consent screen stands alone — no navigation, nothing to
          wander off to mid-sign-in. Declared before the shell's routes. */}
      <Route path="/gameid/authorize" element={lazy(<GameIdAuthorize />)} />
      <Route path="/gameid" element={lazy(<GamesShell />)}>
        <Route index element={<GameIdHome />} />
        <Route path="developers" element={<GameIdDevelopers />} />
        <Route path="docs" element={<Navigate to="/docs/gameid" replace />} />
        <Route path="agents/claim/:token" element={<AgentClaim />} />
        <Route path="agents/:agentId" element={<AgentProfile />} />
        <Route element={<RequireAuth />}>
          <Route path="developers/:clientId" element={<GameIdApp />} />
        </Route>
      </Route>

      <Route path="/docs" element={lazy(<Docs />)} />
      <Route path="/docs/:product" element={lazy(<Docs />)} />
      <Route path="/docs/:product/:page" element={lazy(<Docs />)} />

      {/* Signing in, on this host's own session — see the note at the top. */}
      <Route element={<Layout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Route>

      <Route path="*" element={<ToDeck />} />
    </Routes>
  );
}

/**
 * Anything this host does not serve lives on Deck.
 *
 * `/discover`, `/shop`, `/settings`, a profile — all real pages, none of them
 * routed here. A navigation rather than a 404, because the page the reader
 * asked for does exist; it is just on the other side of the subdomain, and a
 * genuine typo gets Deck's 404, which is the one that offers somewhere to go.
 *
 * In development, where this app is reached through `?app=games` rather than a
 * hostname, there is no other side to send anyone to — so the 404 it is.
 */
function ToDeck() {
  const { pathname, search, hash } = useLocation();
  const away = onDeckDomain();

  useEffect(() => {
    if (away) window.location.replace(`${DECK_ORIGIN}${pathname}${search}${hash}`);
  }, [away, pathname, search, hash]);

  return away ? null : <NotFound />;
}
