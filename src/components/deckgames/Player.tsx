import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { GameDetail, GameMode } from '@/types';
import { CoverArt } from './CoverArt';
import { useGameBridge } from './useGameBridge';

/**
 * The stage a hosted game plays on — portrait, landscape, or anything.
 *
 * **Shape.** The frame takes the game's orientation: a portrait game is a
 * tall 9:16 column, as tall as the screen allows; a landscape game a 16:9
 * band as wide as the page; an `any` game fills what it is given. On a phone
 * held the wrong way for the game, the player asks to be turned rather than
 * shrinking the game to a postage stamp — with "play anyway" for people who
 * cannot or would rather not.
 *
 * **Full screen.** One button takes the stage full screen and, where the
 * browser allows it (Android Chrome, mostly), locks the screen to the game's
 * orientation. iOS has no orientation lock for the web; there the rotate
 * prompt does the job instead.
 *
 * **Trust.** Nothing is requested from the developer's server until somebody
 * presses play. The frame is sandboxed: scripts and its own storage (so saves
 * work), pointer lock for games that need it — and no top-level navigation,
 * no popups, no forms, no camera, microphone or location. The caption says,
 * in words, that this is not Deck, and that Deck never asks for a password
 * inside a game.
 */
export function Player({
  game,
  src,
  mode,
  onPlay,
}: {
  game: GameDetail;
  src: string;
  mode: GameMode;
  onPlay?: () => void;
}) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [askSignIn, setAskSignIn] = useState(false);
  const [ignoreTurn, setIgnoreTurn] = useState(false);
  const mismatch = useOrientationMismatch(game.orientation);

  const markReady = useCallback(() => setReady(true), []);
  const wantSignIn = useCallback(() => setAskSignIn(true), []);

  const { checkout, reopenCheckout, cancelCheckout, origin } = useGameBridge({
    frameRef,
    src: started && game.sdk ? src : null,
    slug: game.slug,
    mode,
    orientation: game.orientation,
    user,
    onReady: markReady,
    onSignInWanted: wantSignIn,
  });

  /* A game without the SDK never says it is ready; give it a moment after
     its page loads, then lift the curtain anyway. */
  const onFrameLoad = () => {
    if (!game.sdk) window.setTimeout(markReady, 600);
    else window.setTimeout(markReady, 4000);
  };

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === stageRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = async () => {
    const stage = stageRef.current;
    if (!stage) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => undefined);
      return;
    }
    await stage.requestFullscreen?.().catch(() => undefined);
    /* Best effort: most desktop browsers and iOS refuse, and that is fine. */
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (orientation: string) => Promise<void>;
    };
    if (game.orientation !== 'both') {
      await orientation.lock?.(game.orientation).catch(() => undefined);
    }
  };

  const host = origin ? new URL(origin).host : safeHost(src);

  return (
    <figure className="w-full">
      <div
        ref={stageRef}
        className={cn(
          'relative isolate flex items-center justify-center overflow-hidden bg-g-night',
          fullscreen ? 'h-full w-full' : 'rounded-[28px] px-0 py-0 sm:px-6 sm:py-6',
          !fullscreen && game.orientation === 'portrait' && 'min-h-[min(86svh,860px)]',
        )}
      >
        {/* The game's own colours, blurred into the room around it. */}
        <div aria-hidden="true" className="absolute inset-0 -z-10 scale-110 opacity-40 blur-3xl">
          <CoverArt game={game} showTitle={false} />
        </div>

        <div
          className={cn(
            'relative overflow-hidden bg-black shadow-[0_30px_80px_-20px_rgb(0_0_0/0.6)]',
            frameShape(game.orientation, fullscreen),
          )}
        >
          {started ? (
            <iframe
              ref={frameRef}
              src={src}
              title={game.title}
              onLoad={onFrameLoad}
              className="absolute inset-0 size-full border-0"
              sandbox="allow-scripts allow-same-origin allow-pointer-lock"
              allow="fullscreen; gamepad; autoplay; accelerometer; gyroscope"
              referrerPolicy="strict-origin"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setStarted(true);
                onPlay?.();
              }}
              className="group absolute inset-0 grid place-items-center text-white"
            >
              <span className="absolute inset-0 opacity-70 transition-opacity duration-700 group-hover:opacity-90">
                <CoverArt game={game} showTitle={false} />
              </span>
              <span className="absolute inset-0 bg-black/35" />
              <span className="relative flex flex-col items-center gap-4">
                <span className="grid size-20 place-items-center rounded-full bg-white/90 text-black shadow-[0_0_60px_10px_rgb(255_210_122/0.35)] transition-transform duration-500 ease-glide group-hover:scale-105">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="ml-1 size-7 fill-current">
                    <path d="M7 4.5v15l12-7.5z" />
                  </svg>
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
                  Play {game.title}
                </span>
              </span>
            </button>
          )}

          {started && !ready && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black">
              <span className="size-10 animate-spin rounded-full border-2 border-white/15 border-t-g-glow" />
            </div>
          )}

          {started && mismatch && !ignoreTurn && (
            <TurnPrompt orientation={game.orientation} onDismiss={() => setIgnoreTurn(true)} />
          )}

          {askSignIn && (
            <Overlay>
              <p className="text-lg font-medium tracking-[-0.03em]">Sign in to keep playing</p>
              <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-white/70">
                {game.title} wants to save your progress and purchases to your Deck account.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <Link
                  to="/login"
                  state={{ from: pathname }}
                  className="rounded-[3px] bg-white px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-black"
                >
                  Sign in
                </Link>
                <button
                  type="button"
                  onClick={() => setAskSignIn(false)}
                  className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/70 hover:text-white"
                >
                  Not now
                </button>
              </div>
            </Overlay>
          )}

          {checkout.phase === 'opening' && (
            <Overlay>
              <span className="size-8 animate-spin rounded-full border-2 border-white/15 border-t-g-glow" />
              <p className="mt-4 text-sm text-white/80">Opening checkout…</p>
            </Overlay>
          )}
          {(checkout.phase === 'waiting' || checkout.phase === 'blocked') && (
            <Overlay>
              <p className="text-lg font-medium tracking-[-0.03em]">
                {checkout.phase === 'waiting'
                  ? 'Finish paying in the other window'
                  : 'Continue to payment'}
              </p>
              <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-white/70">
                Payment happens on Bachs’s secure page. The game picks up where you left off once it
                goes through.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={reopenCheckout}
                  className="rounded-[3px] bg-g-ember px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-g-on-ember"
                >
                  {checkout.phase === 'waiting' ? 'Show payment window' : 'Open payment'}
                </button>
                <button
                  type="button"
                  onClick={cancelCheckout}
                  className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/70 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </Overlay>
          )}
        </div>

        {fullscreen && (
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="absolute right-4 top-4 rounded-full bg-black/50 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-white backdrop-blur"
          >
            Exit full screen
          </button>
        )}
      </div>

      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1 font-mono text-[10px] uppercase tracking-[0.12em] text-g-mute">
        <span>
          {mode === 'test' && (
            <span className="mr-2 rounded-full bg-g-ember px-2 py-0.5 text-g-on-ember">
              Test mode
            </span>
          )}
          Running from {host} — not Deck. Deck never asks for your password inside a game.
        </span>
        <span className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="hover:text-g-ink"
          >
            ⤢ Full screen
          </button>
          {mode === 'live' && (
            <a href={src} target="_blank" rel="noopener noreferrer" className="hover:text-g-ink">
              New tab ↗
            </a>
          )}
        </span>
      </figcaption>
    </figure>
  );
}

/** The frame's size for each orientation, in and out of full screen. */
function frameShape(orientation: GameDetail['orientation'], fullscreen: boolean): string {
  if (orientation === 'portrait') {
    return fullscreen
      ? 'aspect-[9/16] h-full max-w-full'
      : 'aspect-[9/16] h-[min(86svh,820px)] max-w-full sm:rounded-2xl';
  }
  if (orientation === 'landscape') {
    return fullscreen
      ? 'aspect-video w-full max-h-full'
      : 'aspect-video w-full max-w-[1200px] max-h-[80svh] sm:rounded-2xl';
  }
  return fullscreen ? 'size-full' : 'h-[min(80svh,760px)] w-full sm:rounded-2xl';
}

/**
 * True on a touch screen held against the game's grain. Desktop windows are
 * never nagged: a landscape game in a narrow browser window is the user's
 * choice, and they can make the window wider.
 */
function useOrientationMismatch(orientation: GameDetail['orientation']): boolean {
  const [mismatch, setMismatch] = useState(false);

  useEffect(() => {
    if (orientation === 'both') return;
    const touch = window.matchMedia('(pointer: coarse)');
    const check = () => {
      const portraitScreen = window.innerHeight > window.innerWidth;
      setMismatch(touch.matches && (orientation === 'landscape') === portraitScreen);
    };
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, [orientation]);

  return mismatch;
}

function TurnPrompt({
  orientation,
  onDismiss,
}: {
  orientation: GameDetail['orientation'];
  onDismiss: () => void;
}) {
  return (
    <Overlay>
      <span
        aria-hidden="true"
        className={cn(
          'block h-14 w-8 rounded-[8px] border-2 border-white/80 transition-transform duration-1000 ease-glide',
          orientation === 'landscape' ? 'animate-[g-turn_2.4s_ease-in-out_infinite]' : 'rotate-90',
        )}
      />
      <p className="mt-5 text-lg font-medium tracking-[-0.03em]">
        Turn your phone {orientation === 'landscape' ? 'sideways' : 'upright'}
      </p>
      <p className="mt-1 text-[13px] text-white/70">This game is made for {orientation}.</p>
      <button
        type="button"
        onClick={onDismiss}
        className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-white/70 underline-offset-4 hover:text-white hover:underline"
      >
        Play anyway
      </button>
    </Overlay>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 p-6 text-center text-white backdrop-blur-md">
      {children}
    </div>
  );
}

function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return 'another site';
  }
}
