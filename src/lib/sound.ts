/**
 * The arcade's noises, synthesised rather than fetched.
 *
 * No audio files anywhere. Every sound here is a few oscillators and a gain
 * envelope, which costs nothing to download, never 404s, and can be tuned by
 * changing a number instead of re-exporting a wav. It also means the pitch can
 * follow the game — the engine hum rises with your speed, which a fixed clip
 * cannot do.
 *
 * Nothing is created until the first one is asked for. Browsers refuse to start
 * an AudioContext outside a user gesture, and constructing one on page load
 * leaves a suspended context running for every visitor who never plays.
 */

/* --------------------------------------------------------------- the switch --- */

/**
 * One preference for every sound the site makes.
 *
 * It used to be the arcade's alone, which was fine while the arcade was the only
 * thing with a voice. Now that a click follows the pointer around the whole
 * site, a person who turns sound off has said what they mean and it would be
 * rude to keep ticking at them on every other page — so this is the single
 * switch, and the arcade's button and the one in the header are two views of it.
 */
const MUTE_KEY = 'deck-audio-muted';

/** What the key was called while the switch only covered the arcade. */
const LEGACY_MUTE_KEY = 'deck-arcade-muted';

/** Headroom. Several voices can overlap on a crash, and a master at 1.0 clips. */
const MASTER_GAIN = 0.55;

function loadMuted(): boolean {
  try {
    /* The old key is read but never written. Somebody who muted the arcade
       before this existed keeps their answer; the moment they touch either
       control it moves to the new key and the old one stops mattering. */
    return (localStorage.getItem(MUTE_KEY) ?? localStorage.getItem(LEGACY_MUTE_KEY)) === '1';
  } catch {
    /* Private windows throw. Sound on is the better default when the choice
       cannot be read, because the control is right there in the header. */
    return false;
  }
}

let muted = loadMuted();
const listeners = new Set<() => void>();

export function getMuted(): boolean {
  return muted;
}

/** For `useSyncExternalStore`, so every control on the page agrees. */
export function subscribeMuted(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function announce(): void {
  applyMasterGain();
  listeners.forEach((listener) => listener());
}

export function setMuted(next: boolean): void {
  if (next === muted) return;
  muted = next;
  try {
    localStorage.setItem(MUTE_KEY, next ? '1' : '0');
  } catch {
    /* The choice holds for this session and is forgotten after. */
  }
  announce();
}

/*
 * Other tabs count too.
 *
 * `storage` fires in every tab except the one that wrote, so muting in one
 * window silences the others rather than leaving a forgotten tab ticking away
 * behind this one.
 */
window.addEventListener('storage', (event) => {
  if (event.key !== MUTE_KEY) return;
  const next = event.newValue === '1';
  if (next === muted) return;
  muted = next;
  announce();
});

type Ctx = AudioContext & { __deckMaster?: GainNode };

let ctx: Ctx | null = null;

function audio(): Ctx | null {
  if (ctx) return ctx;
  const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor() as Ctx;
  const master = ctx.createGain();
  master.gain.value = muted ? 0 : MASTER_GAIN;
  master.connect(ctx.destination);
  ctx.__deckMaster = master;
  return ctx;
}

/**
 * The switch, in hardware.
 *
 * Muting on the master rather than by refusing to create voices is what makes
 * it a *site-wide* switch: it catches the sounds already in flight — the engine
 * hum a game is holding down, a crash still decaying — instead of only the ones
 * that have not started yet. The callers short-circuit as well, but that is an
 * optimisation; this is the guarantee.
 *
 * Ramped over 20ms rather than stepped, because a gain that jumps to zero
 * mid-note puts a discontinuity in the buffer, and that is heard as a click —
 * an ironic way for a mute button to announce itself.
 */
function applyMasterGain(): void {
  const context = ctx;
  const bus = context?.__deckMaster;
  if (!context || !bus) return;
  bus.gain.cancelScheduledValues(context.currentTime);
  bus.gain.setTargetAtTime(muted ? 0 : MASTER_GAIN, context.currentTime, 0.02);
}

function master(): GainNode | null {
  const context = audio();
  return context?.__deckMaster ?? null;
}

/**
 * One shared noise buffer.
 *
 * Two seconds of white noise, generated once and replayed from different
 * offsets. Regenerating 88,200 random samples on every crash is real work at
 * exactly the moment the game is busiest.
 */
let noiseBuffer: AudioBuffer | null = null;

function noise(): AudioBuffer | null {
  const context = audio();
  if (!context) return null;
  if (noiseBuffer) return noiseBuffer;

  const length = context.sampleRate * 2;
  noiseBuffer = context.createBuffer(1, length, context.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

/**
 * A handle on the arcade's audio for one game.
 *
 * Owns its own gain node, so muting or unmounting a game silences exactly that
 * game's voices and cannot leave an oscillator running under the next page.
 */
export class Sound {
  private out: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private muted: boolean;

  constructor(muted = getMuted()) {
    this.muted = muted;
  }

  /** Called from a click or keypress — the only place a context may start. */
  resume(): void {
    const context = audio();
    if (!context) return;
    if (context.state === 'suspended') void context.resume();
    if (!this.out) {
      const bus = master();
      if (!bus) return;
      this.out = context.createGain();
      this.out.gain.value = this.muted ? 0 : 1;
      this.out.connect(bus);
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.out) this.out.gain.value = muted ? 0 : 1;
  }

  /** A short tone. The building block for every one-shot below. */
  private tone(
    type: OscillatorType,
    from: number,
    to: number,
    duration: number,
    peak: number,
  ): void {
    const context = audio();
    if (!context || !this.out || this.muted) return;

    const now = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(from, now);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), now + duration);

    /* A 6ms attack rather than an instant one. Starting a gain at full volume
       puts a step discontinuity into the buffer, which is heard as a click in
       front of every single note. */
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain).connect(this.out);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  /** Collecting something good. Two notes up. */
  pickup(): void {
    this.tone('square', 660, 990, 0.09, 0.16);
    window.setTimeout(() => this.tone('square', 990, 1320, 0.08, 0.12), 55);
  }

  /** An extra life. Longer, and it lands on a major third above the pickup. */
  bonus(): void {
    this.tone('triangle', 523, 784, 0.12, 0.2);
    window.setTimeout(() => this.tone('triangle', 784, 1047, 0.16, 0.16), 90);
  }

  /** Eating, in Snake. Deliberately blunt and short — it fires a lot. */
  chomp(): void {
    this.tone('square', 220, 440, 0.06, 0.14);
  }

  /** Crossing a speed threshold. A warning, not a reward. */
  levelUp(): void {
    this.tone('sawtooth', 300, 900, 0.18, 0.1);
  }

  /**
   * Hitting something.
   *
   * A noise burst through a falling lowpass, plus a square dropping two
   * octaves. The noise is the impact and the square is the "you lost a life" —
   * either alone reads as a bug rather than a crash.
   */
  crash(): void {
    const context = audio();
    if (!context || !this.out || this.muted) return;
    const buffer = noise();
    if (!buffer) return;

    const now = context.currentTime;

    const src = context.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + 0.34);

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.5, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);

    src.connect(filter).connect(gain).connect(this.out);
    src.start(now);
    src.stop(now + 0.36);

    this.tone('square', 180, 45, 0.32, 0.22);
  }

  /** The run ending. A descending three-note sting. */
  gameOver(): void {
    this.tone('square', 392, 392, 0.14, 0.18);
    window.setTimeout(() => this.tone('square', 311, 311, 0.14, 0.18), 150);
    window.setTimeout(() => this.tone('square', 233, 110, 0.42, 0.2), 300);
  }

  /**
   * The engine: a continuous hum whose pitch and volume follow `intensity`.
   *
   * This is the "it is going fast now" cue. It is a sawtooth through a lowpass
   * rather than a pure tone because a pure tone at a slowly rising pitch is a
   * test signal, and a filtered saw is an engine. Gain stays low — it plays for
   * the whole run and anything louder becomes unbearable inside a minute.
   */
  engine(intensity: number): void {
    const context = audio();
    if (!context || !this.out) return;

    if (!this.engineOsc) {
      this.engineOsc = context.createOscillator();
      this.engineGain = context.createGain();
      this.engineFilter = context.createBiquadFilter();

      this.engineOsc.type = 'sawtooth';
      this.engineFilter.type = 'lowpass';
      this.engineGain.gain.value = 0;

      this.engineOsc.connect(this.engineFilter).connect(this.engineGain).connect(this.out);
      this.engineOsc.start();
    }

    const clamped = Math.max(0, Math.min(1, intensity));
    const now = context.currentTime;
    /* Ramped, not set: assigning frequency every frame steps the pitch sixty
       times a second, which is heard as a rasp on top of the note. */
    this.engineOsc.frequency.linearRampToValueAtTime(46 + clamped * 120, now + 0.12);
    this.engineFilter!.frequency.linearRampToValueAtTime(260 + clamped * 900, now + 0.12);
    this.engineGain!.gain.linearRampToValueAtTime(0.02 + clamped * 0.075, now + 0.12);
  }

  /** Fades the engine out rather than cutting it, which would click. */
  engineOff(): void {
    const context = audio();
    if (!context || !this.engineGain) return;
    this.engineGain.gain.linearRampToValueAtTime(0.0001, context.currentTime + 0.25);
  }

  /** Tears down every voice this game owns. */
  dispose(): void {
    try {
      this.engineOsc?.stop();
    } catch {
      /* Already stopped — nothing to do. */
    }
    this.engineOsc?.disconnect();
    this.engineGain?.disconnect();
    this.engineFilter?.disconnect();
    this.out?.disconnect();
    this.engineOsc = null;
    this.engineGain = null;
    this.engineFilter = null;
    this.out = null;
  }
}

/* ------------------------------------------------------------- interface --- */

/**
 * The click the whole site makes under a left button.
 *
 * It lives in this file rather than one of its own because there is only one
 * AudioContext to have, and this is where it is. Browsers cap how many a page
 * may open and each one carries a hardware output; a second context for a
 * fifteen-millisecond tick would be the most expensive sound on the site.
 *
 * It is not an arcade voice and does not go through `Sound`. No game owns it,
 * nothing mutes it per-game, and it has to survive every unmount on the site —
 * so it hangs off the master bus directly.
 */

/**
 * When the last click sounded, on the page clock rather than the audio one.
 *
 * `AudioContext.currentTime` looks like the natural choice and is a trap: a
 * context that has not been resumed yet reports 0 and stays there. Compared
 * against an initial 0 that makes the first click — and every click after it,
 * for as long as the context is suspended — look like a repeat, and the whole
 * feature silently does nothing. `performance.now()` advances regardless of
 * what the audio hardware is doing.
 */
let lastClick = Number.NEGATIVE_INFINITY;

/**
 * A short mechanical tick: a filtered noise burst with a little body under it.
 *
 * Noise rather than a tone, because a click is broadband — a sine at any pitch
 * reads as a note, and a note on every button turns a site into an instrument.
 * The bandpass puts it where a keyboard or a mouse switch sits, and 18ms is
 * short enough that it registers as texture rather than as a sound.
 */
export function playClick(): void {
  /* Ahead of `audio()`, so a muted visitor never opens an AudioContext at all —
     no hardware output, no suspended graph, nothing to resume. */
  if (muted) return;

  const context = audio();
  const bus = master();
  const buffer = noise();
  if (!context || !bus || !buffer) return;

  if (context.state === 'suspended') void context.resume();

  /* Two clicks inside 40ms is a double-click, a drag start, or a stray
     synthetic event. One tick is the honest report of all three. */
  const wall = performance.now();
  if (wall - lastClick < 40) return;
  lastClick = wall;

  const now = context.currentTime;

  const source = context.createBufferSource();
  source.buffer = buffer;
  /* An offset into the shared two seconds, so consecutive clicks are not
     bit-identical — real switches are not either. */
  source.playbackRate.value = 1;
  const start = Math.random() * 1.5;

  const band = context.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 2100;
  band.Q.value = 0.9;

  const gain = context.createGain();
  /* 1.5ms up, 18ms down. The attack is deliberately not instant — a step from
     silence is itself a click, and stacking one on top of this one is what
     makes cheap UI sounds sound cheap. */
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.09, now + 0.0015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);

  source.connect(band).connect(gain).connect(bus);
  source.start(now, start, 0.05);
  source.stop(now + 0.06);

  /* The body: one very short low sine, well under the noise. Without it the
     tick is thin and sits on top of the page; with it, it lands on it. */
  const body = context.createOscillator();
  const bodyGain = context.createGain();
  body.type = 'sine';
  body.frequency.setValueAtTime(320, now);
  body.frequency.exponentialRampToValueAtTime(140, now + 0.03);
  bodyGain.gain.setValueAtTime(0.0001, now);
  bodyGain.gain.exponentialRampToValueAtTime(0.035, now + 0.002);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
  body.connect(bodyGain).connect(bus);
  body.start(now);
  body.stop(now + 0.05);
}

/**
 * Wires the click up for the life of the page.
 *
 * `pointerdown` rather than `click`, because the sound is feedback for the
 * press and `click` does not fire until the button comes back up — a tick that
 * arrives after you have already let go reads as lag, not as a response. In
 * the capture phase so a handler that stops propagation cannot silence it, and
 * passive because it never calls `preventDefault`.
 *
 * `button === 0` is the left button. A right click opens a context menu and a
 * middle click opens a tab; neither is this page responding to you. On a touch
 * screen a tap reports button 0 as well, which is the same gesture and gets the
 * same tick.
 *
 * Nothing is constructed until that first press. An AudioContext cannot start
 * outside a user gesture anyway, and building one at import time would leave a
 * suspended context and a hardware output open for every visitor.
 */
export function installClickSound(): void {
  window.addEventListener(
    'pointerdown',
    (event) => {
      if (event.button !== 0) return;
      playClick();
    },
    { capture: true, passive: true },
  );
}
