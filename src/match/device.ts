import { useEffect, useState } from 'react';

/**
 * Match on a phone: keeping the screen on through a call, knowing an iPhone
 * when we see one, offering to install, and the push subscription behind
 * "ping me when someone's free".
 */

/** iPhones and iPads, including iPads that announce themselves as Macs. */
export const isIOS = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** Already opened from the home screen. */
export const isInstalled = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/**
 * Keeps the screen on while `active`. Browsers drop the lock when the page is
 * hidden, so it is asked for again whenever the page comes back.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const take = async () => {
      try {
        const next = await navigator.wakeLock.request('screen');
        if (cancelled) void next.release();
        else lock = next;
      } catch {
        /* Low battery, or the page is hidden: not worth telling anyone. */
      }
    };
    const again = () => {
      if (document.visibilityState === 'visible') void take();
    };
    void take();
    document.addEventListener('visibilitychange', again);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', again);
      void lock?.release();
    };
  }, [active]);
}

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * The browser's own install offer (Chrome, Edge, Android), held until the
 * person asks for it. iPhones have none: they get instructions instead.
 */
export function useInstallPrompt() {
  const [offer, setOffer] = useState<InstallPromptEvent | null>(null);
  useEffect(() => {
    const hold = (event: Event) => {
      event.preventDefault();
      setOffer(event as InstallPromptEvent);
    };
    const done = () => setOffer(null);
    window.addEventListener('beforeinstallprompt', hold);
    window.addEventListener('appinstalled', done);
    return () => {
      window.removeEventListener('beforeinstallprompt', hold);
      window.removeEventListener('appinstalled', done);
    };
  }, []);
  return {
    canInstall: Boolean(offer),
    install: async () => {
      if (!offer) return;
      await offer.prompt();
      await offer.userChoice;
      setOffer(null);
    },
  };
}

/** Registers Match's service worker (pings, installing). Safe to call twice. */
export async function registerWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/match-sw.js', { scope: '/' });
  } catch {
    return null;
  }
}

export const pushSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

function keyBytes(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

/** Asks permission and subscribes this browser. Null if the person said no. */
export async function subscribeToPings(publicKey: string): Promise<PushSubscriptionJSON | null> {
  const registration = await registerWorker();
  if (!registration) return null;
  if ((await Notification.requestPermission()) !== 'granted') return null;
  await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyBytes(publicKey),
    }));
  return subscription.toJSON();
}

/** Unsubscribes this browser; returns the endpoint it had, if any. */
export async function unsubscribeFromPings(): Promise<string | undefined> {
  const registration = await navigator.serviceWorker?.getRegistration('/');
  const subscription = await registration?.pushManager.getSubscription();
  const endpoint = subscription?.endpoint;
  await subscription?.unsubscribe();
  return endpoint;
}
