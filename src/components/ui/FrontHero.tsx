import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * The hero every front door shares — the landing page, Games, Circuit, GameID
 * and Developers.
 *
 * One standard, so the doors read as one building: set at night in both
 * themes, a small mono pill, a two-line headline whose second line fades, a
 * short paragraph, one primary action and a quiet second one, and the page's
 * own picture on the right. Only the picture and the light behind it change
 * from page to page.
 *
 * The words stand still. Motion belongs to the picture; a headline that
 * arrives in pieces makes people wait to read it.
 *
 * Colours are fixed night values rather than themed tokens, so light mode
 * cannot turn a hero to day. The section also carries `dark`, so anything
 * inside that is written against Deck's themed tokens takes their dark half.
 */

interface Action {
  label: string;
  /** An in-app route. */
  to?: string;
  /** A same-page anchor or an outside link. */
  href?: string;
  /** Router state, e.g. `{ from }` for sign-in. */
  state?: unknown;
}

interface FrontHeroProps {
  pill?: Action;
  title: string;
  /** The second line, which fades. */
  fade: string;
  body: ReactNode;
  primary?: Action;
  secondary?: Action;
  /** The page's picture, on the right (below the words on a phone). */
  visual?: ReactNode;
  /** Replaces the default light — beams and a haze along the floor. */
  backdrop?: ReactNode;
  /** Full screen height; otherwise a little shorter. */
  tall?: boolean;
  /** Anything that belongs under the actions, such as stat tiles. */
  children?: ReactNode;
  className?: string;
}

const PRIMARY =
  'glass-primary inline-flex rounded-xl px-5 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em]';
const SECONDARY =
  'inline-flex px-4 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70 transition-colors hover:text-white';

function ActionLink({
  action,
  className,
  children,
}: {
  action: Action;
  className: string;
  children?: ReactNode;
}) {
  const content = (
    <>
      {children}
      {action.label}
    </>
  );
  if (action.to) {
    return (
      <Link to={action.to} state={action.state} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <a href={action.href} className={className}>
      {content}
    </a>
  );
}

export function FrontHero({
  pill,
  title,
  fade,
  body,
  primary,
  secondary,
  visual,
  backdrop,
  tall = true,
  children,
  className,
}: FrontHeroProps) {
  return (
    <section
      className={cn(
        'dark relative isolate flex items-center overflow-hidden bg-[#050505] text-[#f4f2ee]',
        tall ? 'min-h-[100svh]' : 'min-h-[min(82svh,820px)]',
        className,
      )}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {backdrop ?? <NightLight />}
      </div>

      <div
        className={cn(
          'mx-auto grid w-full max-w-[1400px] items-center gap-12 px-4 pb-16 pt-28 sm:px-6 lg:gap-6 lg:px-12 lg:pb-20',
          Boolean(visual) && 'lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]',
        )}
      >
        <div className="max-w-2xl">
          {pill && (
            <ActionLink
              action={pill}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white/85 backdrop-blur transition-colors hover:text-white"
            >
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-[#ff6a3d] shadow-[0_0_10px_1px_rgb(255_106_61/0.7)]"
              />
            </ActionLink>
          )}

          {/* `data-sky-keepout`: the landing page's starfield measures this and
              draws nothing across it. Harmless everywhere else. */}
          <h1
            data-sky-keepout
            className={cn(
              'text-[clamp(3rem,6.4vw,5.75rem)] font-semibold leading-[0.95] tracking-[-0.055em]',
              pill && 'mt-7',
            )}
          >
            {title}
            <span className="block bg-[linear-gradient(100deg,#f4f2ee_25%,rgb(244_242_238/0.42)_95%)] bg-clip-text pb-[0.08em] text-transparent">
              {fade}
            </span>
          </h1>

          <p className="mt-6 max-w-[34rem] text-[17px] leading-relaxed text-white/60 text-pretty">
            {body}
          </p>

          {(primary || secondary) && (
            <div className="mt-9 flex flex-wrap items-center gap-2">
              {primary && <ActionLink action={primary} className={PRIMARY} />}
              {secondary && <ActionLink action={secondary} className={SECONDARY} />}
            </div>
          )}

          {children}
        </div>

        {visual && <div className="min-w-0">{visual}</div>}
      </div>
    </section>
  );
}

/** The default light: beams falling from the top right, and a haze along the floor. */
export function NightLight({ glow = 'rgb(155 123 255 / 0.08)' }: { glow?: string }) {
  return (
    <>
      <div className="absolute -right-[10%] -top-[30%] h-[140%] w-[55%] rotate-[24deg] animate-[var(--animate-g-beam)] bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.07)_45%,rgb(255_255_255/0.02)_70%,transparent)] blur-2xl" />
      <div
        className="absolute -right-[25%] -top-[20%] h-[120%] w-[30%] rotate-[24deg] animate-[var(--animate-g-beam)] bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.05),transparent)] blur-3xl"
        style={{ animationDelay: '-6s' }}
      />
      <div
        className="absolute right-[12%] top-1/2 size-[36rem] -translate-y-1/2 rounded-full blur-[120px]"
        style={{ background: glow }}
      />
      <div className="absolute -bottom-24 -left-[10%] h-48 w-[120%] -rotate-[4deg] bg-[linear-gradient(90deg,rgb(255_255_255/0.07),rgb(255_255_255/0.02)_60%,transparent)] blur-3xl" />
    </>
  );
}
