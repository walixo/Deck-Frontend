/**
 * Working out what media a launch has, and how to play it.
 *
 * Separate from the slider component because these are pure functions and the
 * component is not — mixing the two in one module breaks React Fast Refresh,
 * which only works when a file exports components and nothing else.
 */

export interface Slide {
  kind: 'image' | 'video';
  src: string;
}

/**
 * Turns a launch's media into an ordered list of slides.
 *
 * Video first when there is one — somebody who filmed their prototype running
 * put more into that than into any photo, and it is the thing a reader will
 * want. Cover next, then the gallery. Duplicates are dropped, because a cover
 * that is also gallery item one is the common case and showing it twice makes
 * the slider look broken.
 */
export function slidesFor(item: {
  videoUrl?: string;
  coverUrl?: string;
  gallery?: string[];
}): Slide[] {
  const seen = new Set<string>();
  const slides: Slide[] = [];

  if (item.videoUrl) slides.push({ kind: 'video', src: item.videoUrl });

  for (const src of [item.coverUrl, ...(item.gallery ?? [])]) {
    if (!src || seen.has(src)) continue;
    seen.add(src);
    slides.push({ kind: 'image', src });
  }

  return slides;
}

/**
 * Converts a YouTube or Vimeo link into its privacy-preserving embed URL.
 *
 * `youtube-nocookie.com` and Vimeo's `dnt=1` are the versions that do not set
 * profiling cookies before you press play. They are not a substitute for
 * consent — the request still tells a third party someone is here, which is why
 * the player is click-to-load and gated — but they are the right default for
 * the reader who has said yes.
 *
 * Returns null for anything unrecognised, and the caller falls back to a plain
 * link out. The server already restricts the field to these two hosts; this is
 * the second check, because a URL that passes a host test can still be a shape
 * with no video id in it.
 */
export function embedUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = url.pathname.slice(1);
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }

    if (host === 'youtube.com') {
      const id = url.searchParams.get('v') ?? url.pathname.split('/embed/')[1];
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }

    if (host === 'vimeo.com') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}?dnt=1` : null;
    }
  } catch {
    /* Not a URL at all. Fall through to null. */
  }

  return null;
}

/** The host a video will load from, for telling the reader before they click. */
export function videoHost(raw: string): string {
  try {
    return new URL(raw).hostname.replace(/^www\./, '');
  } catch {
    return 'the video site';
  }
}
