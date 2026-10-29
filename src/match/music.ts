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
    .catch(() => null));

async function start(): Promise<void> {
  if (source || starting) return;
  starting = true;
  try {
    /* Created and resumed synchronously, so a gesture that calls this counts. */
    context ??= new AudioContext();
    const resumed = context.state === 'suspended' ? context.resume() : Promise.resolve();
    const data = await load(context);
    await resumed.catch(() => undefined);
    if (!data || context.state !== 'running' || !wanted || muted || source) return;
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
    const unlock = () => sync();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [active]);
}
