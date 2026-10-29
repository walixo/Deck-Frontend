import { useEffect, useSyncExternalStore } from 'react';

/**
 * Match's music: the first sixteen seconds of "Pulsing Shadows" (two of its
 * 8-second phrases), looped without a gap, under the landing page, the lobby
 * and the wait.
 *
 * It is played through Web Audio rather than an <audio loop>, which leaves a
 * small gap at every turn; the file itself was cut so its end runs straight
 * into its start (see `public/match-loop.m4a`). It fades out before a call
 * connects so it never competes with a voice, and comes back afterwards.
 *
 * Browsers will not start sound before someone taps or types, so the first
 * gesture anywhere on the page starts it. Muting is remembered on this device.
 */

const SRC = '/match-loop.m4a';
const MUTE_KEY = 'match-music-muted';
const VOLUME = 0.32;

function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

let muted = loadMuted();
let wanted = false;
const listeners = new Set<() => void>();

let context: AudioContext | null = null;
let gain: GainNode | null = null;
let source: AudioBufferSourceNode | null = null;
let starting = false;
let track: Promise<AudioBuffer | null> | null = null;

const load = (ctx: AudioContext) =>
  (track ??= fetch(SRC)
    .then((res) => res.arrayBuffer())
    .then((bytes) => ctx.decodeAudioData(bytes))
    .catch(() => {
      track = null;
      return null;
    }));

async function start(): Promise<void> {
  /* Before the first tap or key press the browser would refuse; wait for one. */
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  context ??= new AudioContext();
  /* Asked on every call, ahead of the guard below, so the call a tap makes is
     the one that wakes it. Never awaited: a resume the browser refuses stays
     pending for good, and waiting on one used to leave the music stuck off. */
  if (context.state !== 'running') void context.resume().catch(() => undefined);
  if (source || starting) return;
  starting = true;
  try {
    const data = await load(context);
    /* Started even if the context is still asleep: it plays once it wakes. */
    if (!data || !wanted || muted || source) return;
    gain ??= context.createGain();
    gain.connect(context.destination);
    const now = context.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(VOLUME, now + 1.5);
    source = context.createBufferSource();
    source.buffer = data;
    source.loop = true;
    source.connect(gain);
    source.start();
  } finally {
    starting = false;
  }
}

function stop(): void {
  if (!source || !context || !gain) return;
  const playing = source;
  source = null;
  const now = context.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(0, now + 0.5);
  playing.stop(now + 0.55);
}

function sync(): void {
  if (wanted && !muted) void start();
  else stop();
}

export function getMusicMuted(): boolean {
  return muted;
}

export function setMusicMuted(next: boolean): void {
  muted = next;
  try {
    localStorage.setItem(MUTE_KEY, next ? '1' : '0');
  } catch {
    /* Private windows: the choice lasts for this visit. */
  }
  sync();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const useMusicMuted = () => useSyncExternalStore(subscribe, getMusicMuted);

/** Plays the loop while `active`, from the first gesture on the page. */
export function useMusic(active: boolean): void {
  useEffect(() => {
    wanted = active;
    sync();
    if (!active) return;
    /* Phones only allow sound from the end of a touch, not its start. */
    const unlock = () => sync();
    const events = ['pointerdown', 'pointerup', 'touchend', 'keydown'] as const;
    for (const name of events) window.addEventListener(name, unlock);
    return () => {
      for (const name of events) window.removeEventListener(name, unlock);
    };
  }, [active]);
}
