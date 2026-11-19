import { useState } from 'react';
import { cn } from '@/lib/utils';
import { naira } from './credit';
import type { MatchInvite, MatchRecap } from './matchApi';
import { CARD, EYEBROW, LABEL, PRIMARY, QUIET } from './styles';

/**
 * The pieces that bring people back: the icebreaker in a call, "talk again"
 * after one, the streak and the evening's recap, and inviting a friend.
 */

/** The icebreaker both people see, and a way to ask for another. */
export function PromptCard({
  prompt,
  left,
  onNext,
}: {
  prompt: string;
  left: number;
  onNext: () => void;
}) {
  return (
    <div className={cn(CARD, 'mx-auto mt-6 max-w-sm px-5 py-4 text-center')}>
      <p className={EYEBROW}>Ask each other</p>
      <p className="mt-2 text-[17px] font-medium leading-snug tracking-[-0.01em]">{prompt}</p>
      {left > 0 && (
        <button
          type="button"
          onClick={onNext}
          className="mt-3 text-[13px] text-white/50 underline underline-offset-4 hover:text-white/75"
        >
          Another question · {left} left
        </button>
      )}
    </div>
  );
}

/** After a call: "I'd talk to them again", and what came of it. */
export function AgainButton({
  said,
  mutual,
  busy,
  onSay,
}: {
  said: boolean;
  mutual: boolean;
  busy: boolean;
  onSay: () => void;
}) {
  if (mutual) {
    return (
      <p className="mx-auto mt-6 max-w-sm rounded-[18px] bg-[#5dcaa5]/[0.14] px-4 py-3.5 text-[14px] font-medium text-[#5dcaa5]">
        You both want to talk again — you’ll be matched first the next time you’re both on.
      </p>
    );
  }
  if (said) {
    return (
      <p className="mx-auto mt-6 max-w-sm text-[14px] text-white/55">
        Noted. If they say the same, you’ll be matched first next time. They won’t know otherwise.
      </p>
    );
  }
  return (
    <button
      type="button"
      onClick={onSay}
      disabled={busy}
      className={cn(QUIET, 'mx-auto mt-6 py-3 text-[14px]')}
    >
      I’d talk to them again
    </button>
  );
}

/* The Lagos date, to tell tonight's recap from last night's. */
const lagosDay = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(Date.now());

const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** The streak, and the evening in numbers. Hidden until there is something to show. */
export function RecapCard({ recap }: { recap: MatchRecap }) {
  const { streak } = recap;
  if (recap.calls === 0 && streak.count === 0 && streak.best === 0) return null;
  const tonight = recap.day === lagosDay();
  const stats = [
    count(recap.calls, 'person', 'people'),
    count(recap.minutes, 'minute'),
    recap.swapped > 0 && `${recap.swapped} swapped`,
    recap.again > 0 && `${recap.again} want to talk again`,
  ].filter(Boolean);
  return (
    <section className={CARD}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={LABEL}>Your streak</p>
          <p className="mt-1 text-[34px] font-semibold leading-none tracking-[-0.04em]">
            {streak.count > 0 ? `🔥 ${count(streak.count, 'night')}` : 'No streak yet'}
          </p>
        </div>
        {streak.best > 1 && (
          <p className="pt-1 text-right font-mono text-[11px] uppercase tracking-[0.14em] text-white/45">
            Best
            <br />
            <span className="text-[15px] text-white/75">{streak.best}</span>
          </p>
        )}
      </div>
      <p className="mt-2 text-[13px] text-white/55">
        {streak.atRisk
          ? 'Talk to someone tonight to keep it going.'
          : streak.tonight
            ? 'Tonight counts. Come back tomorrow to keep it going.'
            : 'Talk to someone on Match on nights in a row to build one.'}
      </p>
      {recap.calls > 0 && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className={LABEL}>{tonight ? 'Tonight so far' : 'Last night'}</p>
          <p className="mt-1.5 text-[15px] text-white/80">{stats.join(' · ')}</p>
        </div>
      )}
    </section>
  );
}

/** Your invite link, and what it has brought you. */
export function InviteCard({
  invite,
  onNotice,
}: {
  invite: MatchInvite;
  onNotice: (text: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const bonus = invite.bonusMinor > 0 ? naira(invite.bonusMinor) : null;
  const send = async () => {
    const text = bonus
      ? `Talk to someone new for two minutes on Match. Join with my link and we both get ${bonus} free credit:`
      : 'Talk to someone new for two minutes on Match:';
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Match', text, url: invite.link });
        return;
      } catch (error) {
        /* Closing the share sheet isn't a failure. */
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${invite.link}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      onNotice(`Copy your link: ${invite.link}`);
    }
  };
  return (
    <section className={CARD}>
      <p className={LABEL}>Invite a friend</p>
      <p className="mt-2 text-[15px] leading-relaxed text-white/75">
        {bonus
          ? `When a friend joins with your link and has their first call, you both get ${bonus} of free credit.`
          : 'More people on Match means shorter waits for everyone.'}
        {bonus && invite.cap > 0 && (
          <span className="text-white/45"> Up to {invite.cap} friends.</span>
        )}
      </p>
      {invite.owed && bonus && (
        <p className="mt-2 text-[13px] text-[#5dcaa5]">
          You came through a friend’s invite — your {bonus} arrives after your first call.
        </p>
      )}
      <div className="mt-4 flex items-center gap-3">
        <p className="min-w-0 flex-1 truncate rounded-full bg-white/[0.07] px-4 py-3 font-mono text-[13px] text-white/70">
          {invite.link.replace(/^https?:\/\//, '')}
        </p>
        <button type="button" onClick={() => void send()} className={cn(PRIMARY, 'px-5 py-3')}>
          {copied ? 'Copied' : 'Share'}
        </button>
      </div>
      {invite.joined > 0 && (
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-white/45">
          {count(invite.joined, 'friend')} joined · {invite.talked} talked
          {invite.earnedMinor > 0 && ` · ${naira(invite.earnedMinor)} earned`}
        </p>
      )}
    </section>
  );
}
