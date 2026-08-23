import { useEffect, useState } from 'react';
import { dominantColour, swatchFromHex, type Swatch } from '@/lib/dominantColour';

/**
 * The colour a launch shows on the wall: the maker's pick, or its logo's.
 *
 * The chosen hex wins outright when there is one. Sampling was always a
 * fallback for "we do not know what colour this product is" — once the maker
 * has said, guessing is worse than useless, and a wall panel that ignores the
 * colour somebody explicitly set reads as a bug.
 *
 * Both paths go through the same contrast pass, so the panel's ink is right
 * either way and neither route can ship an unreadable label.
 */
export function useWallColour(
  chosen: string | undefined,
  logoUrl: string | undefined,
): Swatch | null {
  /* Called unconditionally — the sample is cheap, memoised per URL, and a
     conditional hook is not on the table. */
  const sampled = useDominantColour(logoUrl);
  return swatchFromHex(chosen) ?? sampled;
}

/**
 * The dominant colour of an image, once it has been decoded.
 *
 * Returns null until it resolves and whenever there isn't one — a greyscale
 * logo, a missing image, a cross-origin URL that taints the canvas. Callers are
 * expected to have a neutral fallback rather than treating null as an error;
 * "this product has no colour of its own" is a normal answer.
 *
 * The resolved swatch is stored *with the src it came from*, and the return
 * value is derived by comparing that against the current src. That does two
 * jobs at once: it avoids setting state synchronously during the effect, and it
 * makes a stale result structurally impossible rather than merely guarded. The
 * launch wall recycles nodes as it loops, so a slow decode landing on a card
 * that has since become a different launch is a real case, not a hypothetical.
 *
 * Extraction is memoised per URL in the layer below, so mounting this for the
 * same image in twenty places costs one decode.
 */
export function useDominantColour(src: string | undefined): Swatch | null {
  const [resolved, setResolved] = useState<{ src: string; swatch: Swatch | null } | null>(null);

  useEffect(() => {
    if (!src) return;

    let live = true;
    void dominantColour(src).then((swatch) => {
      if (live) setResolved({ src, swatch });
    });

    return () => {
      live = false;
    };
  }, [src]);

  return src && resolved?.src === src ? resolved.swatch : null;
}
