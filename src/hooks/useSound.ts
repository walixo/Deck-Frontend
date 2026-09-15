import { useSyncExternalStore } from 'react';
import { getMuted, subscribeMuted } from '@/lib/sound';

/**
 * Whether the site is muted, from the one store that knows.
 *
 * `useSyncExternalStore` rather than a context, because the preference is not
 * React's to hold: it is read by a plain `pointerdown` listener installed
 * before the first render, written by a game that may be mid-frame, and
 * changed by another tab entirely. A provider would make the header the owner
 * of a value the header does not own.
 *
 * Every control that shows the switch calls this, so they cannot disagree.
 */
export function useMuted(): boolean {
  return useSyncExternalStore(
    subscribeMuted,
    getMuted,
    /* No server render here, but the third argument is not optional and
       "unmuted" is the honest answer for a page that has no browser yet. */
    () => false,
  );
}
