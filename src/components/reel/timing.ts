/**
 * The launch reel's clock arithmetic.
 *
 * Every frame of the reel is a pure function of one number — seconds since the
 * start — and nothing in it keeps time of its own. No CSS animations, no
 * timers, no "has this played yet" state. That is what lets the player pause,
 * scrub and replay without a scene ever drifting out of step with its
 * neighbours, and what lets a frame at 12.4s be rendered on its own, cold, and
 * look identical to the same frame reached by playing through — which is also
 * what makes it possible to record the film frame by frame into a video file.
 *
 * The easings are the site's own. `snap` and `kick` are the two curves in
 * `index.css` (`--ease-snap`, `--ease-kick`), solved here in JavaScript because
 * a value computed per frame cannot borrow a CSS timing function. Anything the
 * reel moves therefore moves the way a button or a card on the site does.
 */

/** Length of the reel, in seconds. Matches the reference cut. */
export const REEL_DURATION = 30;

/** Frames per second the timecode counts in. Display only — playback is rAF. */
export const TIMECODE_FPS = 30;

/** Pins `value` to the 0–1 range. */
export function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/**
 * How far `t` is through the window `[start, end]`, as 0–1.
 *
 * Clamped at both ends, so a scene can ask about a beat that has not started
 * (0) or has finished (1) without special-casing either.
 */
export function span(t: number, start: number, end: number): number {
  return clamp01((t - start) / (end - start));
}

export function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

/**
 * A CSS `cubic-bezier()` as a function of progress.
 *
 * Newton–Raphson on the x curve, then read y — the same method browsers use.
 * Eight iterations is far past the precision a 1080-pixel frame can show.
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const ax = 3 * x1 - 3 * x2 + 1;
  const bx = 3 * x2 - 6 * x1;
  const cx = 3 * x1;
  const ay = 3 * y1 - 3 * y2 + 1;
  const by = 3 * y2 - 6 * y1;
  const cy = 3 * y1;

  const sampleX = (s: number) => ((ax * s + bx) * s + cx) * s;
  const sampleY = (s: number) => ((ay * s + by) * s + cy) * s;
  const slopeX = (s: number) => (3 * ax * s + 2 * bx) * s + cx;

  return (progress: number): number => {
    if (progress <= 0) return 0;
    if (progress >= 1) return 1;

    let s = progress;
    for (let index = 0; index < 8; index += 1) {
      const slope = slopeX(s);
      if (Math.abs(slope) < 1e-6) break;
      s -= (sampleX(s) - progress) / slope;
    }
    return sampleY(s);
  };
}

/** `--ease-snap`: arrives fast and settles. The default for anything moving. */
export const snap = cubicBezier(0.2, 0.9, 0.3, 1);

/** `--ease-kick`: overshoots and settles back. Stamps and slams only. */
export const kick = cubicBezier(0.3, 1.6, 0.5, 1);

/** Shorthand for the commonest call: eased progress through a window. */
export function snapIn(t: number, start: number, duration: number): number {
  return snap(span(t, start, start + duration));
}

export function kickIn(t: number, start: number, duration: number): number {
  return kick(span(t, start, start + duration));
}

/**
 * The first `length` characters of `text` that have been "typed" by `t`.
 *
 * Linear, deliberately — typing that eases looks like a person hesitating,
 * which is not what a demo is for.
 */
export function typed(text: string, t: number, start: number, end: number): string {
  return text.slice(0, Math.round(text.length * span(t, start, end)));
}

/** A block cursor's on/off state, blinking twice a second. Steps, never fades. */
export function cursorOn(t: number): boolean {
  return Math.floor(t * 4) % 2 === 0;
}

/** `00:00:12:08` — hours, minutes, seconds, frames. */
export function timecode(t: number): string {
  const whole = Math.floor(t);
  const frames = Math.floor((t - whole) * TIMECODE_FPS);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `00:00:${pad(whole)}:${pad(frames)}`;
}
