import { FrontHero } from '@/components/ui/FrontHero';

/**
 * The way in: warm amber light and a silhouette, the way a phone screen lights
 * a face in a dark room — on the front-door standard every Deck hero shares.
 *
 * The silhouette is a controller rather than a person — this is a room for
 * games, and a stock face would be somebody nobody here knows. Everything is
 * SVG and CSS gradient, so it costs no image request and is sharp on any
 * screen.
 */
export function Hero() {
  return (
    <FrontHero
      pill={{ label: 'Free to play · nothing to install', href: '#library' }}
      title="A new era"
      fade="of play."
      body="Games made across Africa and the world, ready in a tap. Portrait on your phone, landscape on your laptop."
      primary={{ label: 'Play now', href: '#library' }}
      secondary={{ label: 'Build a game →', to: '/games/developers' }}
      backdrop={<AmberLight />}
      visual={<Silhouette />}
    />
  );
}

/** The light: a hot amber core low on the right, falling off into the dark. */
function AmberLight() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(80%_75%_at_78%_45%,var(--color-g-amber-1)_0%,var(--color-g-amber-2)_18%,var(--color-g-amber-3)_38%,var(--color-g-amber-4)_62%,#050505_92%)]" />
      <div className="absolute -right-[10%] top-[10%] size-[60vmax] animate-g-breathe rounded-full bg-[radial-gradient(circle,rgb(255_220_150/0.4),transparent_60%)] blur-3xl" />
      {/* Film grain, so the gradient reads as light rather than as a fill. */}
      <svg className="absolute inset-0 size-full opacity-[0.18] mix-blend-overlay">
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
    </>
  );
}

/** A controller in silhouette, rim-lit by the amber behind it. */
function Silhouette() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 600 420"
      className="pointer-events-none mx-auto w-full max-w-[40rem] rotate-[-14deg] animate-g-drift [--g-tilt:-14deg]"
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
