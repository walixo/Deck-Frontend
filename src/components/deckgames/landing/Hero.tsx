import { Link } from 'react-router-dom';

/**
 * The way in: warm amber light and a silhouette, the way a phone screen lights
 * a face in a dark room.
 *
 * The silhouette is a controller rather than a person — this is a room for
 * games, and a stock face would be somebody nobody here knows. It sits in the
 * light the way the video's profile does: solid dark, with the glow wrapping
 * its edge. Everything is SVG and CSS gradient, so it costs no image request
 * and is sharp on any screen.
 */
export function Hero() {
  return (
    <section
      aria-labelledby="games-hero-title"
      className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-g-amber-5 text-white sm:items-center"
    >
      {/* The light. Layered radial gradients — a hot core, a warm falloff, then
          the room going dark. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-[radial-gradient(110%_85%_at_72%_38%,var(--color-g-amber-1)_0%,var(--color-g-amber-2)_22%,var(--color-g-amber-3)_45%,var(--color-g-amber-4)_72%,var(--color-g-amber-5)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute -right-[10%] top-[10%] -z-10 size-[70vmax] animate-g-breathe rounded-full bg-[radial-gradient(circle,rgb(255_220_150/0.55),transparent_60%)] blur-3xl"
      />

      <Silhouette />

      {/* Film grain, so the gradient reads as light rather than as a fill. */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0 size-full opacity-[0.18] mix-blend-overlay"
      >
        <filter id="games-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#games-grain)" />
      </svg>

      <div className="relative mx-auto w-full max-w-[1400px] px-4 pb-16 pt-28 sm:px-6 sm:pb-0 sm:pt-0">
        <div className="max-w-xl sm:pl-[6vw]">
          <h1
            id="games-hero-title"
            className="text-[clamp(2.75rem,6.4vw,5.25rem)] font-medium leading-[0.95] tracking-[-0.055em] text-balance"
          >
            <span className="block animate-g-rise">A new era</span>
            <span className="block animate-g-rise [animation-delay:120ms]">of play</span>
          </h1>
          <p className="mt-5 max-w-sm animate-g-rise text-[15px] leading-relaxed text-white/85 [animation-delay:260ms] text-pretty">
            Games made across Africa and the world, ready in a tap. Portrait on your phone,
            landscape on your laptop. Nothing to install.
          </p>
          <div className="mt-8 flex animate-g-rise flex-wrap items-center gap-5 [animation-delay:380ms]">
            <Link
              to="/games#library"
              className="rounded-[3px] bg-white/85 px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-g-amber-5 shadow-[0_8px_30px_rgb(0_0_0/0.18)] backdrop-blur transition-[background-color,transform] duration-300 ease-glide hover:bg-white active:scale-[0.98]"
            >
              Play now
            </Link>
            <Link
              to="/games/developers"
              className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-white/85 underline-offset-[6px] transition-colors hover:text-white hover:underline"
            >
              Build a game →
            </Link>
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-6 flex justify-center font-mono text-[9px] uppercase tracking-[0.3em] text-white/60"
      >
        <span className="animate-g-breathe">Scroll</span>
      </div>
    </section>
  );
}

/** A controller in silhouette, rim-lit by the amber behind it. */
function Silhouette() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 600 420"
      className="pointer-events-none absolute -right-[22%] bottom-[-6%] -z-10 w-[125vw] max-w-none rotate-[-14deg] sm:-right-[6%] sm:bottom-auto sm:top-[14%] sm:w-[66vw]"
    >
      <defs>
        <filter id="games-rim" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="10" result="blur" />
          <feFlood floodColor="#ffd27a" floodOpacity="0.85" />
          <feComposite in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="games-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3a1406" />
          <stop offset="0.5" stopColor="#1a0703" />
          <stop offset="1" stopColor="#0a0301" />
        </linearGradient>
      </defs>

      <g filter="url(#games-rim)">
        <path
          fill="url(#games-body)"
          d="M150 118c50-30 250-30 300 0 70 40 112 182 92 222-20 40-72 30-102-20-20-30-40-50-140-50s-120 20-140 50c-30 50-82 60-102 20-20-40 22-182 92-222z"
        />
      </g>
      {/* Detail in the shadow: the shapes you only see once your eyes adjust. */}
      <g fill="#2c0f05" opacity="0.9">
        <rect x="172" y="168" width="22" height="66" rx="4" />
        <rect x="150" y="190" width="66" height="22" rx="4" />
        <circle cx="408" cy="174" r="13" />
        <circle cx="438" cy="202" r="13" />
        <circle cx="378" cy="202" r="13" />
        <circle cx="408" cy="230" r="13" />
        <circle cx="250" cy="262" r="24" />
        <circle cx="352" cy="262" r="24" />
      </g>
    </svg>
  );
}
