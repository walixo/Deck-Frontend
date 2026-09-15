import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubmitScore } from '@/hooks/useGames';
import { Sound, getMuted, setMuted } from '@/lib/sound';
import { useMuted } from '@/hooks/useSound';

/**
 * The two things all three games need from React, and nothing else.
 *
 * The games themselves are canvas loops living in a ref — they deliberately do
 * not hold their state in React, because sixty setState calls a second to move
 * four numbers only the canvas reads is sixty renders a second of the whole
 * page. This hook covers the parts that genuinely are UI state: whether sound
 * is on, and what the best score was.
 */

/** Reads and writes one game's high score, surviving a private window. */
export function readBest(key: string): number {
  try {
    return Number(localStorage.getItem(key)) || 0;
  } catch {
    /* Private windows and blocked site data both throw. A game that refuses to
       start because it cannot remember a score is worse than one that forgets. */
    return 0;
  }
}

export function writeBest(key: string, value: number): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* The score stands for this session and is lost after. */
  }
}

/**
 * One `Sound` per mounted game, and the site switch that drives it.
 *
 * The preference is not the arcade's any more — it is the whole site's, so the
 * button in the game's chrome and the one in the header are the same switch
 * seen twice, and muting in either place is muting. The *voices* stay per game,
 * so leaving a page can never leave an oscillator running underneath the next
 * one.
 */
export function useArcadeSound(): {
  sound: Sound;
  muted: boolean;
  toggleMuted: () => void;
} {
  const muted = useMuted();

  /*
   * State with a lazy initialiser, not a ref.
   *
   * The value is needed by the render — it is handed to the game's effect — and
   * reading `ref.current` during render is exactly the pattern
   * `react-hooks/refs` exists to stop. `useState` gives the same construct-once
   * behaviour and is legal to read. Nothing ever calls the setter, so this
   * never causes a re-render; constructing during render is safe because the
   * class builds no AudioContext until `resume()` runs inside a real gesture.
   */
  const [sound] = useState(() => new Sound(getMuted()));

  useEffect(() => () => sound.dispose(), [sound]);

  /* Pushing the store's answer into the voice — including when the change came
     from the header, or from another tab. The master gain has already gone
     quiet by this point; this is what stops a muted game building nodes it
     will never be heard through. */
  useEffect(() => {
    sound.setMuted(muted);
  }, [sound, muted]);

  const toggleMuted = useCallback(() => {
    const next = !getMuted();
    setMuted(next);
    /* Unmuting is itself a gesture, so it is a valid moment to start the
       context for somebody who muted before ever pressing play. */
    if (!next) sound.resume();
  }, [sound]);

  return { sound, muted, toggleMuted };
}

/**
 * Posts a finished run to the game's leaderboard.
 *
 * Returns a function whose identity never changes, which is the whole point:
 * the games call it from inside a `useEffect` that must not re-run, and a
 * callback that changed on every render would tear the game loop down and
 * restart it mid-run.
 *
 * The latest-ref pattern gets both — a stable outer function, and an inner one
 * refreshed every render so it always sees the current user and mutation.
 * Written in an effect, never read during render.
 */
export function useScoreReporter(slug: string): (score: number) => void {
  const { user } = useAuth();
  const submit = useSubmitScore(slug);
  const latest = useRef<(score: number) => void>(() => {});

  useEffect(() => {
    latest.current = (score: number) => {
      /* Signed out, there is nowhere to put it — the local best still stands,
         and the board says so rather than silently dropping the run. */
      if (!user || score <= 0) return;
      submit.mutate(score);
    };
  });

  return useCallback((score: number) => latest.current(score), []);
}
