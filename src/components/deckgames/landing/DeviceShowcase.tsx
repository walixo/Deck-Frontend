import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useInView } from '../motion';

/**
 * One device that turns to fit whatever is playing.
 *
 * The video's tablet with its pill of tabs, made to answer this platform's
 * real question — portrait or landscape? Each tab turns the device to the
 * shape its screen wants, so the thing the player does for every game is the
 * thing this section shows.
 */

type Tab = 'portrait' | 'landscape' | 'leaderboards' | 'store' | 'developers';

const TABS: { id: Tab; label: string; turn: 'portrait' | 'landscape'; caption: string }[] = [
  {
    id: 'portrait',
    label: 'Portrait',
    turn: 'portrait',
    caption: 'Made for one thumb, filling a phone held upright.',
  },
  {
    id: 'landscape',
    label: 'Landscape',
    turn: 'landscape',
    caption: 'Wide games get the whole width — turn your phone, or go full screen.',
  },
  {
    id: 'leaderboards',
    label: 'Leaderboards',
    turn: 'portrait',
    caption: 'Every game keeps a board. Ten names, and where you stand.',
  },
  {
    id: 'store',
    label: 'Store',
    turn: 'portrait',
    caption: 'Buy a level, a skin or coins. 80% goes to whoever made the game.',
  },
  {
    id: 'developers',
    label: 'Developers',
    turn: 'landscape',
    caption: 'One script tag. Players, purchases and scores, handled by Deck.',
  },
];

export function DeviceShowcase() {
  const [tab, setTab] = useState<Tab>('portrait');
  const [ref, seen] = useInView<HTMLDivElement>();
  const current = TABS.find((entry) => entry.id === tab)!;
  const landscape = current.turn === 'landscape';

  return (
    <section
      aria-labelledby="device-title"
      className="relative bg-g-paper px-4 pb-24 pt-20 sm:px-6 sm:pt-28"
    >
      <h2
        id="device-title"
        className="mx-auto max-w-3xl text-center text-[clamp(2rem,4.6vw,3.75rem)] font-medium leading-[1] tracking-[-0.05em] text-balance"
      >
        The most complete arcade you’ve ever held
      </h2>

      <div
        ref={ref}
        className={cn('mt-14 flex flex-col items-center opacity-0', seen && 'animate-g-rise')}
      >
        {/* The stage keeps one footprint so the page does not jump as the
            device turns inside it. */}
        <div className="grid h-[min(78vw,520px)] w-full max-w-[900px] place-items-center">
          <div
            className={cn(
              'relative rounded-[34px] bg-[#0b0b0b] p-[10px] shadow-[0_40px_80px_-20px_rgb(0_0_0/0.35),0_0_0_1px_rgb(255_255_255/0.06)_inset] transition-[width,height] duration-700 ease-glide dark:shadow-[0_40px_90px_-20px_rgb(255_106_61/0.18)]',
              landscape
                ? 'h-[min(46vw,330px)] w-[min(88vw,640px)]'
                : 'h-[min(76vw,510px)] w-[min(40vw,270px)] min-w-[180px]',
            )}
          >
            <div className="relative size-full overflow-hidden rounded-[25px] bg-g-paper-2">
              <Screen tab={tab} />
            </div>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="What the player does"
          className="mt-10 flex max-w-full gap-1 overflow-x-auto rounded-full border border-g-line bg-g-paper p-1 shadow-[0_10px_30px_-12px_rgb(0_0_0/0.18)]"
        >
          {TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={tab === entry.id}
              onClick={() => setTab(entry.id)}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-medium tracking-[-0.01em] transition-colors duration-300 ease-glide',
                tab === entry.id ? 'bg-g-ink text-g-paper' : 'text-g-mute hover:text-g-ink',
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <p
          aria-live="polite"
          className="mt-5 max-w-sm text-center text-[13px] leading-relaxed text-g-mute"
        >
          {current.caption}
        </p>
      </div>
    </section>
  );
}

function Screen({ tab }: { tab: Tab }) {
  return (
    <div key={tab} className="absolute inset-0 animate-g-fade">
      {tab === 'portrait' && <PortraitGame />}
      {tab === 'landscape' && <LandscapeGame />}
      {tab === 'leaderboards' && <Board />}
      {tab === 'store' && <Store />}
      {tab === 'developers' && <Code />}
    </div>
  );
}

function Hud({ left, right, light }: { left: string; right: string; light?: boolean }) {
  return (
    <div
      className={cn(
        'absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-4 font-mono text-[9px] uppercase tracking-[0.14em]',
        light ? 'text-white/80' : 'text-g-mute',
      )}
    >
      <span>{left}</span>
      <span>{right}</span>
    </div>
  );
}

/** A three-lane runner, seen from above. */
function PortraitGame() {
  return (
    <div className="absolute inset-0 bg-[linear-gradient(180deg,#1d1030,#3b1d4a_45%,#e8641b)]">
      <Hud left="Lagos Rush" right="2,480" light />
      <div className="absolute inset-x-[18%] bottom-0 top-[18%] grid grid-cols-3 border-x border-white/15">
        {['top-[18%]', 'top-[40%] [animation-delay:-3s]', 'top-[62%] [animation-delay:-6s]'].map(
          (place) => (
            <div
              key={place}
              className="relative border-r border-dashed border-white/10 last:border-r-0"
            >
              <span
                className={cn(
                  'absolute left-1/2 size-3 -translate-x-1/2 animate-g-drift rounded-full bg-g-amber-1 shadow-[0_0_14px_2px] shadow-g-amber-2',
                  place,
                )}
              />
            </div>
          ),
        )}
      </div>
      <div className="absolute bottom-[12%] left-1/2 h-8 w-6 -translate-x-1/2 rounded-md bg-white shadow-[0_0_24px_4px_rgb(255_210_122/0.6)]" />
    </div>
  );
}

/** A side-scroller at dusk. */
function LandscapeGame() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(180deg,#7cc4ff,#ffd27a_70%,#f7a531)]">
      <Hud left="Sky Run" right="Best 1,204" />
      <div className="absolute right-[18%] top-[22%] size-14 rounded-full bg-white/80 blur-[1px]" />
      <svg
        viewBox="0 0 640 200"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-1/2 w-full"
      >
        <path
          d="M0 120 C 100 60 180 140 300 90 S 520 60 640 110 V200 H0Z"
          fill="#e8641b"
          opacity="0.6"
        />
        <path d="M0 150 C 120 110 220 170 360 130 S 560 120 640 150 V200 H0Z" fill="#8c2a07" />
      </svg>
      <div className="absolute left-[28%] top-[42%] h-4 w-6 animate-g-drift rounded-full bg-g-ink [--g-tilt:-8deg]" />
    </div>
  );
}

function Board() {
  const rows = [
    ['Adaeze', '48,210'],
    ['Kofi', '41,905'],
    ['Thandi', '39,120'],
    ['You', '33,402'],
    ['Yusuf', '30,018'],
  ];
  return (
    <div className="absolute inset-0 bg-g-paper p-4 pt-10">
      <Hud left="Leaderboard" right="This week" />
      <ol className="space-y-1.5">
        {rows.map(([name, score], index) => (
          <li
            key={name}
            className={cn(
              'flex items-center justify-between rounded-xl px-3 py-2.5 text-[12px]',
              name === 'You' ? 'bg-g-ember text-g-on-ember' : 'bg-g-paper-2',
            )}
          >
            <span className="flex items-center gap-2.5">
              <span className="w-4 font-mono text-[10px] opacity-70">{index + 1}</span>
              <span className="font-medium">{name}</span>
            </span>
            <span className="font-mono tabular-nums">{score}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Store() {
  const products = [
    ['Suya pack', 'Ten extra lives', '₦1,500'],
    ['100 coins', 'Spend in any run', '₦500'],
    ['Danfo skin', 'Yellow, of course', '₦800'],
  ];
  return (
    <div className="absolute inset-0 bg-g-paper p-4 pt-10">
      <Hud left="Store" right="Lagos Rush" />
      <ul className="space-y-2">
        {products.map(([name, blurb, price]) => (
          <li key={name} className="flex items-center gap-3 rounded-xl bg-g-paper-2 p-2.5">
            <span className="size-9 shrink-0 rounded-lg bg-[linear-gradient(135deg,var(--color-g-amber-1),var(--color-g-amber-3))]" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-medium">{name}</span>
              <span className="block truncate text-[10px] text-g-mute">{blurb}</span>
            </span>
            <span className="rounded-full bg-g-ink px-2.5 py-1 font-mono text-[10px] text-g-paper">
              {price}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-g-mute">
        80% to the developer
      </p>
    </div>
  );
}

function Code() {
  return (
    <div className="absolute inset-0 bg-g-night p-5 pt-10 font-mono text-[11px] leading-[1.75] text-g-night-mute">
      <Hud left="index.html" right="Deck Games SDK" light />
      <p>
        <span className="text-g-violet">const</span> <span className="text-white">deck</span> ={' '}
        <span className="text-g-violet">await</span> DeckGames.
        <span className="text-g-teal">init</span>();
      </p>
      <p>
        <span className="text-g-violet">const</span> <span className="text-white">s</span> ={' '}
        <span className="text-g-violet">await</span> DeckGames.
        <span className="text-g-teal">session</span>();
      </p>
      <p className="text-white/40">{'// your server verifies s.token with Deck'}</p>
      <p>
        <span className="text-g-violet">await</span> DeckGames.
        <span className="text-g-teal">purchase</span>(
        <span className="text-g-amber-1">&apos;suya.pack&apos;</span>);
      </p>
      <p>
        DeckGames.<span className="text-g-teal">submitScore</span>(
        <span className="text-g-amber-2">2480</span>);
      </p>
    </div>
  );
}
