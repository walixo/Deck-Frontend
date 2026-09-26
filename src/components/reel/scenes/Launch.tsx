import { cn, MEDAL_STYLES } from '@/lib/utils';
import { Mono, Rise, Stop } from '../primitives';
import { cursorOn, kickIn, lerp, snap, snapIn, span, typed } from '../timing';

const NAME = 'Your product';
const TAGLINE = 'The thing you shipped last night';
const CATEGORIES = ['AI Tools', 'Mobile Apps', 'Websites', 'Hardware'];

/* When the form gives way to the board. */
const POSTED = 10.1;

/* The two launches already on the board. Unnamed on purpose: the reel shows
   the mechanic, and inventing products to lose to the demo would be putting
   words in strangers' mouths. They are drawn as skeleton rows instead. */
const RIVALS = [31, 22];
const FINAL_VOTES = 48;

function votesAt(t: number): number {
  return Math.round(FINAL_VOTES * snap(span(t, 10.3, 11.3)));
}

/*
 * When the demo launch overtakes each rival. Found by scanning rather than by
 * inverting the easing — it runs once, at import, and an exact inverse of a
 * Newton-solved curve buys nothing a 5ms step cannot see.
 */
const OVERTAKES = RIVALS.map((rival) => {
  for (let at = 10.3; at <= 11.3; at += 0.005) {
    if (votesAt(at) > rival) return at;
  }
  return 11.3;
}).sort((a, b) => a - b);

/** The demo row's slot on the board, 2 → 0, easing between slots. */
function slotAt(t: number): number {
  return 2 - OVERTAKES.reduce((moved, at) => moved + snapIn(t, at, 0.22), 0);
}

const ROW_H = 110;
const ROW_GAP = 20;

/**
 * 8.0–12.0s. A launch is typed into the form, posted, and climbs the board.
 *
 * The reference's terminal demo, with Deck's actual flow in its place: name,
 * tagline, category, launch — then today's board, where votes decide the order
 * and nothing else does. Captions cut on the beat, bottom left, exactly as the
 * reference's "Plan it. Cap it. Review it." do.
 */
export function Launch({ t }: { t: number }) {
  const enter = snapIn(t, 8.0, 0.55);
  const posted = t >= POSTED;

  return (
    <div className="absolute inset-0 [perspective:1600px]">
      <div
        className="absolute left-[370px] top-[156px] h-[572px] w-[1180px] rounded-slab border-[3px] border-edge bg-surface shadow-hard-xl"
        style={{
          transform: `translateY(${lerp(80, 0, enter)}px) rotateX(${lerp(16, 0, enter)}deg)`,
          transformOrigin: '50% 100%',
        }}
      >
        <TitleBar posted={posted} />
        <div className="relative h-[calc(100%-58px)] overflow-hidden px-12 py-9">
          {posted ? <Board t={t} /> : <Form t={t} />}
        </div>

        {posted && (
          <span
            className="absolute -right-6 -top-6 border-[3px] border-edge bg-deep px-5 py-2.5 font-mono text-[18px] font-bold uppercase tracking-[0.12em] text-on-deep shadow-hard"
            style={{ transform: `scale(${lerp(0.4, 1, kickIn(t, POSTED, 0.3))}) rotate(2deg)` }}
          >
            ● Live on today’s board
          </span>
        )}
      </div>

      <Caption t={t} />

      <div className="absolute right-[150px] top-[838px] flex flex-col items-end gap-2">
        <Mono className="text-[14px]">One vote per person, per launch</Mono>
        <Mono className="text-[14px]">Nothing is featured into first place</Mono>
      </div>
    </div>
  );
}

function TitleBar({ posted }: { posted: boolean }) {
  return (
    <div className="flex h-[58px] items-center border-b-[3px] border-edge px-5">
      <div className="flex gap-2">
        {[0, 1, 2].map((index) => (
          <span key={index} className="size-3.5 border-2 border-edge" />
        ))}
      </div>
      <Mono className="flex-1 text-center text-[15px] normal-case tracking-[0.06em]">
        onedeck.africa/{posted ? 'leaderboard' : 'submit'}
      </Mono>
      <span className="w-[58px]" />
    </div>
  );
}

function Field({
  label,
  value,
  active,
  t,
}: {
  label: string;
  value: string;
  active: boolean;
  t: number;
}) {
  return (
    <div>
      <Mono className="text-[15px]">{label}</Mono>
      <div className="mt-2.5 flex h-[74px] items-center border-2 border-edge bg-canvas px-5 font-sans text-[32px] text-body">
        {value}
        {active && cursorOn(t) && <span className="ml-1 h-9 w-3.5 bg-accent" />}
      </div>
    </div>
  );
}

function Form({ t }: { t: number }) {
  const name = typed(NAME, t, 8.2, 8.85);
  const tagline = typed(TAGLINE, t, 8.95, 9.55);
  const chosen = t >= 9.62;
  const pressed = t >= 9.9 && t < 10.02;

  return (
    <div className="space-y-6">
      <Field label="Name" value={name} active={t < 8.9} t={t} />
      <Field label="Tagline" value={tagline} active={t >= 8.9 && t < 9.6} t={t} />

      <div className="flex items-end justify-between">
        <div>
          <Mono className="text-[15px]">Category</Mono>
          <div className="mt-2.5 flex gap-3">
            {CATEGORIES.map((category, index) => (
              <span
                key={category}
                className={cn(
                  'border-2 border-edge px-4 py-2 font-mono text-[17px] font-bold uppercase tracking-[0.08em]',
                  chosen && index === 0
                    ? 'bg-pop text-on-pop shadow-hard-sm'
                    : 'bg-canvas text-muted',
                )}
                style={
                  chosen && index === 0
                    ? { transform: `scale(${lerp(0.9, 1, kickIn(t, 9.62, 0.25))})` }
                    : undefined
                }
              >
                {category}
              </span>
            ))}
          </div>
        </div>

        {/* Pressed the way every button on the site is: it drops onto its own
            shadow. */}
        <span
          className={cn(
            'border-[3px] border-edge bg-pop px-8 py-4 font-sans text-[26px] font-semibold text-on-pop',
            pressed ? 'translate-x-[4px] translate-y-[4px] shadow-none' : 'shadow-hard',
          )}
        >
          Launch →
        </span>
      </div>
    </div>
  );
}

function Board({ t }: { t: number }) {
  const votes = votesAt(t);
  const slot = slotAt(t);
  /* Rivals move down one slot each as they are overtaken. */
  const rivalSlots = RIVALS.map((_, index) => index + snapIn(t, OVERTAKES[1 - index], 0.22));

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Mono className="text-[15px] text-body">Today’s board</Mono>
        <Mono className="text-[15px]">Ranked by votes · locks 23:59 UTC</Mono>
      </div>

      <div className="relative mt-5" style={{ height: 3 * ROW_H + 2 * ROW_GAP }}>
        {/* The ranks stay put; the rows move past them. */}
        {[1, 2, 3].map((rank, index) => (
          <span
            key={rank}
            className={cn(
              'absolute left-0 flex size-[64px] items-center justify-center border-[3px] border-edge font-display text-[28px]',
              MEDAL_STYLES[rank],
            )}
            style={{ top: index * (ROW_H + ROW_GAP) + (ROW_H - 64) / 2 }}
          >
            {rank}
          </span>
        ))}

        {RIVALS.map((rival, index) => (
          <Row key={rival} slot={rivalSlots[index]}>
            <span className="size-[70px] shrink-0 border-2 border-edge bg-surface-2" />
            <div className="flex-1 space-y-3">
              <span className="block h-5 w-72 bg-edge/15" />
              <span className="block h-4 w-[26rem] bg-edge/10" />
            </div>
            <Votes count={rival} />
          </Row>
        ))}

        <Row slot={slot} highlight>
          {/* The product's own tile is content, so it is neutral: grey ground,
              ink initials — CONTRACT rule 1. */}
          <span className="flex size-[70px] shrink-0 items-center justify-center border-2 border-edge bg-surface-2 font-display text-[26px] text-body">
            YP
          </span>
          <div className="flex-1">
            <div className="font-display text-[30px] uppercase leading-none text-body">{NAME}</div>
            <div className="mt-2 font-sans text-[22px] text-muted">{TAGLINE}</div>
          </div>
          <Votes count={votes} active />
        </Row>
      </div>
    </div>
  );
}

function Row({
  slot,
  highlight,
  children,
}: {
  slot: number;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'absolute left-[88px] right-0 flex items-center gap-6 border-edge bg-canvas px-6',
        highlight ? 'z-10 border-[3px] shadow-hard' : 'border-2',
      )}
      style={{ top: slot * (ROW_H + ROW_GAP), height: ROW_H }}
    >
      {children}
    </div>
  );
}

function Votes({ count, active }: { count: number; active?: boolean }) {
  return (
    <span
      className={cn(
        'flex w-[92px] flex-col items-center border-2 border-edge py-2 font-mono font-bold tabular-nums',
        active ? 'bg-pop text-on-pop' : 'bg-surface text-muted',
      )}
    >
      <span className="text-[18px] leading-none">▲</span>
      <span className="text-[28px] leading-tight">{count}</span>
    </span>
  );
}

const CAPTIONS = [
  { at: 9.0, until: 10.0, text: 'Post it' },
  { at: 10.0, until: 11.0, text: 'Get voted' },
  { at: 11.0, until: 12.01, text: 'Climb' },
];

function Caption({ t }: { t: number }) {
  const current = CAPTIONS.find((caption) => t >= caption.at && t < caption.until);
  if (!current) return null;

  return (
    <div className="absolute left-[150px] top-[768px] font-display text-[120px] uppercase leading-none text-body display-tight">
      <Rise key={current.text} progress={snapIn(t, current.at, 0.22)}>
        {current.text}
        <Stop />
      </Rise>
    </div>
  );
}
