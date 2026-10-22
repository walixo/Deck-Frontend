import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { request } from '@/lib/api';
import { gameApi } from '@/hooks/useGamePlatform';
import type {
  AuthUser,
  GameMode,
  GameMultiplayer,
  GameOrientation,
  GameRoom,
  Leaderboard,
} from '@/types';
import { RoomConnection } from './roomConnection';

/**
 * The player's half of the SDK conversation.
 *
 * The game, inside its frame, posts requests; this answers them with Deck's
 * own authenticated API and posts the results back. Two checks guard every
 * message: it must come from *this* frame's window, and from the game's own
 * origin. Anything else on the page — an ad, an extension, another frame —
 * is ignored, so nothing can impersonate the game to spend a player's money.
 *
 * Replies are addressed to the game's origin only, so a frame that navigated
 * somewhere else mid-session cannot read them.
 */

interface BridgeMessage {
  __deck: 1;
  id?: string;
  type: string;
  payload?: Record<string, unknown>;
}

export type CheckoutState =
  | { phase: 'idle' }
  | { phase: 'opening'; productId: string }
  | { phase: 'blocked'; url: string; reference: string }
  | { phase: 'waiting'; url: string; reference: string };

class BridgeError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

const POLL_MS = 2500;
const CHECKOUT_TIMEOUT_MS = 15 * 60 * 1000;

export function useGameBridge({
  frameRef,
  src,
  slug,
  mode,
  orientation,
  user,
  onReady,
  onSignInWanted,
  multiplayer,
  seat = 0,
  invite = null,
  onRoom,
  onFullscreen,
}: {
  frameRef: RefObject<HTMLIFrameElement | null>;
  src: string | null;
  slug: string;
  mode: GameMode;
  orientation: GameOrientation;
  user: AuthUser | null;
  onReady: () => void;
  onSignInWanted: () => void;
  multiplayer?: GameMultiplayer;
  /** A sandbox seat: test mode, the game's developer only. 0 is the player. */
  seat?: number;
  /** A room code from an invite link, handed to the game on `init`. */
  invite?: string | null;
  /** Told whenever this player's room changes — the sandbox shows it. */
  onRoom?: (room: GameRoom | null) => void;
  /** The game asked to go full screen (or back). Resolves to the new state. */
  onFullscreen?: (want?: boolean) => Promise<boolean>;
}) {
  const [checkout, setCheckout] = useState<CheckoutState>({ phase: 'idle' });
  const popupRef = useRef<Window | null>(null);
  const settleRef = useRef<((status: 'paid' | 'cancelled' | 'pending') => void) | null>(null);
  const referenceRef = useRef<string | null>(null);
  /* One purchase at a time. A second request while a checkout is open used to
     replace the first one's wait, leaving the game's first promise hanging. */
  const buyingRef = useRef(false);

  /* Kept in refs so the message listener is attached once per game, not on
     every render — re-attaching mid-checkout would drop the conversation. */
  const latest = useRef({
    user,
    mode,
    orientation,
    onReady,
    onSignInWanted,
    multiplayer,
    seat,
    invite,
    onRoom,
    onFullscreen,
  });
  useEffect(() => {
    latest.current = {
      user,
      mode,
      orientation,
      onReady,
      onSignInWanted,
      multiplayer,
      seat,
      invite,
      onRoom,
      onFullscreen,
    };
  });
  const roomRef = useRef<RoomConnection | null>(null);

  const origin = (() => {
    try {
      return src ? new URL(src).origin : null;
    } catch {
      return null;
    }
  })();

  const post = useCallback(
    (message: Record<string, unknown>) => {
      const target = frameRef.current?.contentWindow;
      if (target && origin) target.postMessage({ __deck: 1, ...message }, origin);
    },
    [frameRef, origin],
  );

  /** Checks a purchase once; resolves the waiting promise if it has settled. */
  const checkPurchase = useCallback(async () => {
    const reference = referenceRef.current;
    if (!reference || !settleRef.current) return;
    try {
      const purchase = await gameApi.purchaseStatus(reference);
      if (purchase.status === 'paid') settleRef.current('paid');
      else if (purchase.status === 'failed') settleRef.current('cancelled');
    } catch {
      /* A failed poll is not a failed purchase; try again next tick. */
    }
  }, []);

  /* The checkout window tells us when it lands back on Deck. */
  useEffect(() => {
    const onReturn = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; reference?: string; outcome?: string };
      if (data?.type !== 'deck:purchase-return' || data.reference !== referenceRef.current) return;
      if (data.outcome === 'cancelled') settleRef.current?.('cancelled');
      else void checkPurchase();
    };
    window.addEventListener('message', onReturn);
    return () => window.removeEventListener('message', onReturn);
  }, [checkPurchase]);

  const runCheckout = useCallback(
    (url: string, reference: string) =>
      new Promise<'paid' | 'cancelled' | 'pending'>((resolve) => {
        referenceRef.current = reference;
        const started = Date.now();
        let timer = 0;

        const finish = (status: 'paid' | 'cancelled' | 'pending') => {
          window.clearInterval(timer);
          settleRef.current = null;
          referenceRef.current = null;
          setCheckout({ phase: 'idle' });
          try {
            popupRef.current?.close();
          } catch {
            /* Already closed. */
          }
          popupRef.current = null;
          resolve(status);
        };
        settleRef.current = finish;

        const popup = window.open(url, 'deck-checkout', 'popup,width=480,height=760');
        popupRef.current = popup;
        setCheckout(
          popup ? { phase: 'waiting', url, reference } : { phase: 'blocked', url, reference },
        );

        timer = window.setInterval(() => {
          if (Date.now() - started > CHECKOUT_TIMEOUT_MS) {
            finish('pending');
            return;
          }
          void checkPurchase();
          /* Closed without paying: one last look, then call it cancelled. */
          if (popupRef.current?.closed) {
            popupRef.current = null;
            void gameApi
              .purchaseStatus(reference)
              .then((purchase) => {
                if (!settleRef.current) return;
                if (purchase.status === 'paid') finish('paid');
                else setCheckout({ phase: 'blocked', url, reference });
              })
              .catch(() => undefined);
          }
        }, POLL_MS);
      }),
    [checkPurchase],
  );

  /** For the player's own buttons while a checkout is open. */
  const reopenCheckout = useCallback(() => {
    if (checkout.phase !== 'blocked' && checkout.phase !== 'waiting') return;
    const popup = window.open(checkout.url, 'deck-checkout', 'popup,width=480,height=760');
    if (popup) {
      popupRef.current = popup;
      setCheckout({ phase: 'waiting', url: checkout.url, reference: checkout.reference });
    }
  }, [checkout]);

  const cancelCheckout = useCallback(() => settleRef.current?.('cancelled'), []);

  useEffect(() => {
    if (!src || !origin) return;

    const requireUser = () => {
      if (!latest.current.user) {
        latest.current.onSignInWanted();
        throw new BridgeError('signed_out', 'The player is not signed in to Deck');
      }
    };

    /** Multiplayer, relayed to Deck's room API on the player's behalf. */
    const connection = () => {
      if (!latest.current.multiplayer?.enabled) {
        throw new BridgeError('multiplayer_off', 'Multiplayer is not switched on for this game');
      }
      requireUser();
      if (!roomRef.current) {
        roomRef.current = new RoomConnection(
          slug,
          latest.current.mode,
          latest.current.seat ?? 0,
          (event, data) => {
            post({ type: 'event', event, data });
            if (event === 'room' || event === 'started' || event === 'ended') {
              latest.current.onRoom?.(data as GameRoom);
            }
          },
        );
      }
      return roomRef.current;
    };

    const multiplayerCall = async (
      type: string,
      payload: Record<string, unknown>,
    ): Promise<unknown> => {
      const room = connection();
      const remember = (value: GameRoom) => {
        latest.current.onRoom?.(value);
        return value;
      };
      switch (type) {
        case 'mp.create':
          return remember(
            await room.create(payload.visibility === 'public' ? 'public' : 'private'),
          );
        case 'mp.join':
          return remember(await room.join(String(payload.code ?? '')));
        case 'mp.quickMatch':
          return remember(await room.quickMatch());
        case 'mp.room':
          return room.room;
        case 'mp.ready':
          return room.setReady(Boolean(payload.ready));
        case 'mp.start':
          return room.start();
        case 'mp.send':
          return room.send(
            payload.data ?? null,
            typeof payload.to === 'string' ? payload.to : 'others',
          );
        case 'mp.setState':
          return room.setState(payload.state ?? null);
        case 'mp.leave': {
          const left = await room.leave();
          latest.current.onRoom?.(null);
          return left;
        }
        case 'mp.end':
          return room.end();
        default:
          throw new BridgeError('unknown', `Deck does not know "${type}"`);
      }
    };

    const handle = async (message: BridgeMessage): Promise<unknown> => {
      const { mode: currentMode, orientation: currentOrientation } = latest.current;
      const payload = message.payload ?? {};

      switch (message.type) {
        case 'init': {
          let player: { playerId: string; displayName: string } | null = null;
          if (latest.current.user) {
            try {
              const session = await gameApi.session(slug, currentMode, latest.current.seat);
              player = { playerId: session.playerId, displayName: session.displayName };
            } catch {
              player = null;
            }
          }
          return {
            standalone: false,
            mode: currentMode,
            orientation: currentOrientation,
            viewport: { width: window.innerWidth, height: window.innerHeight },
            player,
            multiplayer: latest.current.multiplayer?.enabled
              ? {
                  minPlayers: latest.current.multiplayer.minPlayers,
                  maxPlayers: latest.current.multiplayer.maxPlayers,
                }
              : null,
            invite: latest.current.invite ?? null,
          };
        }
        case 'ready':
          latest.current.onReady();
          return null;
        case 'session':
          requireUser();
          return gameApi.session(slug, currentMode, latest.current.seat);
        case 'products':
          return gameApi.products(slug);
        case 'getPurchases':
          requireUser();
          return gameApi.entitlements(slug, currentMode);
        case 'purchase': {
          requireUser();
          if (buyingRef.current) {
            throw new BridgeError('busy', 'A purchase is already in progress');
          }
          buyingRef.current = true;
          const productId = String(payload.productId ?? '');
          setCheckout({ phase: 'opening', productId });
          try {
            const purchase = await gameApi.purchase(slug, productId, currentMode);
            if (purchase.status === 'paid' || !purchase.checkoutUrl) {
              setCheckout({ phase: 'idle' });
              return {
                reference: purchase.reference,
                status: purchase.status === 'paid' ? 'paid' : 'cancelled',
                productId,
              };
            }
            const status = await runCheckout(purchase.checkoutUrl, purchase.reference);
            return { reference: purchase.reference, status, productId };
          } catch (error) {
            setCheckout({ phase: 'idle' });
            throw error;
          } finally {
            buyingRef.current = false;
          }
        }
        case 'submitScore': {
          requireUser();
          if (currentMode !== 'live') {
            throw new BridgeError('test_mode', 'Scores are only recorded for live games');
          }
          return request<{ best: number; improved: boolean; rank: number }>(
            'post',
            `/games/${slug}/scores`,
            { score: Number(payload.score) },
          );
        }
        case 'leaderboard':
          return request<Leaderboard>('get', `/games/${slug}/scores`);
        case 'fullscreen': {
          const want = typeof payload.on === 'boolean' ? payload.on : undefined;
          const active = (await latest.current.onFullscreen?.(want)) ?? false;
          return { active };
        }
        default:
          if (message.type.startsWith('mp.')) return multiplayerCall(message.type, payload);
          throw new BridgeError('unknown', `Deck does not know "${message.type}"`);
      }
    };

    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (event.origin !== origin) return;
      const message = event.data as BridgeMessage;
      if (!message || message.__deck !== 1 || typeof message.type !== 'string') return;

      void handle(message).then(
        (data) => message.id && post({ type: 'response', id: message.id, ok: true, data }),
        (error: unknown) =>
          message.id &&
          post({
            type: 'response',
            id: message.id,
            ok: false,
            error: {
              code: error instanceof BridgeError ? error.code : 'error',
              message: error instanceof Error ? error.message : 'Something went wrong',
            },
          }),
      );
    };

    const onVisibility = () =>
      post({ type: 'event', event: document.hidden ? 'pause' : 'resume', data: null });
    const onResize = () =>
      post({
        type: 'event',
        event: 'orientation',
        data: {
          orientation: window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait',
          viewport: { width: window.innerWidth, height: window.innerHeight },
        },
      });

    window.addEventListener('message', onMessage);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('message', onMessage);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
      /* Stop listening, but stay in the room: a reload can pick it back up. */
      roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, [frameRef, origin, post, runCheckout, slug, src]);

  /** Lets the player host tell the game about things it did not ask for. */
  const notify = useCallback(
    (event: string, data: unknown) => post({ type: 'event', event, data }),
    [post],
  );

  return { checkout, reopenCheckout, cancelCheckout, origin, notify };
}
