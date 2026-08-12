import type { ReactNode } from 'react';
import { LaunchBoardIllustration } from '@/components/illustrations/Illustrations';
import { Logo } from '@/components/layout/Logo';
import { Backdrop } from '@/components/ui/Ambient';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="relative isolate overflow-hidden">
      <Backdrop pattern="halftone" blocks />

      <div className="relative mx-auto grid min-h-[calc(100dvh-4rem)] max-w-5xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16">
        {/* Form column */}
        <div className="mx-auto w-full max-w-md animate-[var(--animate-slide-up)] lg:order-2">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo />
          </div>

          <div className="rounded-slab border-2 border-edge bg-surface p-6 shadow-hard-xl sm:p-8">
            <h1 className="display-tight text-2xl uppercase text-balance">{title}</h1>
            <p className="mt-2.5 text-sm leading-relaxed text-muted text-pretty">{subtitle}</p>

            <div className="mt-7">{children}</div>
          </div>

          <p className="mt-6 text-center text-sm text-muted">{footer}</p>
        </div>

        {/* Illustration column — decorative, so it drops out entirely on small screens. */}
        <div
          className="hidden animate-[var(--animate-slide-up)] lg:order-1 lg:block"
          style={{ animationDelay: '120ms' }}
        >
          <LaunchBoardIllustration className="w-full max-w-md" />
          <h2 className="display-tight mt-8 max-w-sm text-3xl uppercase text-balance">
            Ship it, then watch the board.
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted text-pretty">
            Every launch on Deck gets a day on the leaderboard, real votes, and feedback from people
            who build the same things you do.
          </p>
        </div>
      </div>
    </div>
  );
}
