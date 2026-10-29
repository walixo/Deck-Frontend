import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { GIFTS, naira, shrinkPhoto } from './credit';
import type { MatchGift, MatchNight, MatchWallet } from './matchApi';
import { CARD, EYEBROW, LABEL, PRIMARY, QUIET } from './styles';

/**
 * Match's wallet on screen: the balance and top-ups, Match+, the Verified
 * badge, tonight's sponsor or theme, and gifts.
 *
 * Everything here spends prepaid credit, because it happens mid-evening — a
 * checkout page in the middle of a call would end the call. Topping up is the
 * one step that leaves for Deck's checkout, and it comes straight back.
 */

const dateOf = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });

/** "Verified": shown beside someone who passed the selfie check. */
export function VerifiedMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-[#5dcaa5]/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#5dcaa5]',
        className,
      )}
    >
      <svg viewBox="0 0 16 16" className="size-3" aria-hidden="true">
        <path
          d="M3.5 8.5l3 3 6-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Verified
    </span>
  );
}

/** Tonight's sponsor line and theme, where Deck set them. */
export function TonightBanner({
  night,
  compact = false,
}: {
  night: MatchNight | null | undefined;
  compact?: boolean;
}) {
  if (!night || (!night.sponsor && !night.theme)) return null;
  return (
    <div className={cn('space-y-1 text-center', compact ? 'mt-5' : 'mt-6')}>
      {night.theme && (
        <p className="text-[15px] font-medium text-white">
          Tonight: {night.theme.title}
          {night.theme.blurb && !compact && (
            <span className="block text-[13px] font-normal text-white/55">{night.theme.blurb}</span>
          )}
        </p>
      )}
      {night.sponsor && (
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/45">
          Presented by{' '}
          {night.sponsor.url ? (
            <a
              href={night.sponsor.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="text-[#ff8fab] underline-offset-4 hover:underline"
            >
              {night.sponsor.name}
            </a>
          ) : (
            <span className="text-[#ff8fab]">{night.sponsor.name}</span>
          )}
          {night.sponsor.line && !compact && (
            <span className="mt-1 block normal-case tracking-normal text-white/50">
              {night.sponsor.line}
            </span>
          )}
        </p>
      )}
    </div>
  );
}

/** The balance, the top-up amounts, and what credit was spent on lately. */
export function WalletCard({
  wallet,
  onTopUp,
}: {
  wallet: MatchWallet;
  onTopUp: (amountMinor: number) => void;
}) {
  const [history, setHistory] = useState(false);
  return (
    <section className={CARD}>
      <div className="flex items-baseline justify-between gap-3">
        <p className={LABEL}>Match credit</p>
        {wallet.ledger.length > 0 && (
          <button
            type="button"
            onClick={() => setHistory(!history)}
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#ff8fab] hover:underline"
          >
            {history ? 'Hide' : 'History'}
          </button>
        )}
      </div>
      <p className="mt-1 text-[34px] font-semibold tracking-[-0.04em] tabular-nums">
        {naira(wallet.creditMinor)}
      </p>
      <p className="text-[13px] text-white/50">
        For extra minutes, gifts, themed nights, the Verified badge and Match+.
      </p>
      {wallet.payments ? (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {wallet.packs.map((pack) => (
            <button
              key={pack}
              type="button"
              onClick={() => onTopUp(pack)}
              className="rounded-[8px] border border-white/20 bg-white/[0.04] py-2.5 font-mono text-[13px] hover:border-[#ff5c8a]"
            >
              +{naira(pack)}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-[13px] text-white/45">Top-ups are not available right now.</p>
      )}
      {history && (
        <ul className="mt-4 space-y-1.5 border-t border-white/10 pt-3 text-[13px]">
          {wallet.ledger.map((row) => (
            <li key={`${row.at}-${row.note}`} className="flex justify-between gap-3">
              <span className="min-w-0 truncate text-white/65">{row.note}</span>
              <span
                className={cn(
                  'shrink-0 font-mono tabular-nums',
                  row.amountMinor > 0 ? 'text-[#5dcaa5]' : 'text-white/80',
                )}
              >
                {row.amountMinor > 0 ? '+' : '−'}
                {naira(Math.abs(row.amountMinor))}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[11px] leading-relaxed text-white/35">
        Paid securely through Deck checkout. Credit is for Match only and isn’t refundable as cash.
      </p>
    </section>
  );
}

/** Match+: what it gives, and when the current run ends. */
export function PlusCard({
  wallet,
  onBuy,
  busy,
}: {
  wallet: MatchWallet;
  onBuy: () => void;
  busy: boolean;
}) {
  const member = Boolean(wallet.plusUntil);
  return (
    <section className={cn(CARD, member && 'border-[#ff5c8a]/40 bg-[#ff5c8a]/[0.06]')}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[20px] font-semibold tracking-[-0.03em]">
          Match<span className="text-[#ff5c8a]">+</span>
        </p>
        <p className="font-mono text-[12px] text-white/60">
          {member
            ? `Until ${dateOf(wallet.plusUntil!)}`
            : `${naira(wallet.prices.plus)} / ${wallet.prices.plusDays} days`}
        </p>
      </div>
      <ul className="mt-3 space-y-1.5 text-[14px] text-white/75">
        <li>Unlimited +1 minutes, free</li>
        <li>An extra hour — talk until midnight</li>
        <li>Pings whenever someone’s free, not just once a night</li>
      </ul>
      <button
        type="button"
        onClick={onBuy}
        disabled={busy}
        className={cn(member ? QUIET : PRIMARY, 'mt-4 w-full')}
      >
        {member
          ? `Add ${wallet.prices.plusDays} more days · ${naira(wallet.prices.plus)}`
          : `Get Match+ · ${naira(wallet.prices.plus)}`}
      </button>
      <p className="mt-2 text-center text-[11px] text-white/35">
        Paid from credit. It doesn’t renew by itself.
      </p>
    </section>
  );
}

/**
 * The Verified badge: a selfie making a pose Match picks, checked by a person
 * at Deck. The photo is only for that check and is deleted once it is done.
 */
export function VerifyCard({
  wallet,
  onStart,
  onSubmit,
}: {
  wallet: MatchWallet;
  onStart: () => Promise<string | null>;
  onSubmit: (photo: string) => Promise<boolean>;
}) {
  const [prompt, setPrompt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const input = useRef<HTMLInputElement>(null);
  /* The profile decides whether someone is verified; the last check only says
     what is happening with it. A draft is a check never sent. */
  const last = wallet.verification?.status;
  const state = wallet.verified
    ? 'approved'
    : last === 'pending' || last === 'declined'
      ? last
      : null;

  if (state === 'approved') {
    return (
      <section className={cn(CARD, 'flex items-center justify-between gap-3')}>
        <p className="text-[15px]">You’re verified</p>
        <VerifiedMark />
      </section>
    );
  }
  if (state === 'pending') {
    return (
      <section className={CARD}>
        <p className="text-[15px] font-medium">Your photo is being checked</p>
        <p className="mt-1 text-[13px] text-white/55">
          Usually within a day. The badge appears here when it’s done.
        </p>
      </section>
    );
  }

  const choose = async () => {
    setProblem('');
    setBusy(true);
    const next = await onStart();
    setBusy(false);
    if (next) setPrompt(next);
  };

  return (
    <section className={CARD}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[15px] font-medium">Get the Verified badge</p>
        <p className="font-mono text-[12px] text-white/60">{naira(wallet.prices.badge)} once</p>
      </div>
      <p className="mt-1 text-[13px] leading-relaxed text-white/55">
        People you talk to see you’re real. A person at Deck checks one selfie, then deletes it.
      </p>
      {state === 'declined' && wallet.verification?.note && (
        <p className="mt-2 text-[13px] text-[#ffb3c4]">
          Last time: {wallet.verification.note} Your {naira(wallet.prices.badge)} went back to your
          credit.
        </p>
      )}
      {prompt ? (
        <div className="mt-4 space-y-3">
          <p className="rounded-[10px] bg-white/[0.06] px-4 py-3 text-[15px]">
            Take a selfie making <b className="font-semibold text-white">{prompt}</b>, with your
            face clearly in view.
          </p>
          <input
            ref={input}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (!file) return;
              setBusy(true);
              setProblem('');
              try {
                if (await onSubmit(await shrinkPhoto(file))) setPrompt(null);
              } catch {
                setProblem('That photo could not be read. Try another.');
              }
              setBusy(false);
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className={cn(PRIMARY, 'w-full')}
          >
            {busy ? 'Sending…' : `Take selfie · ${naira(wallet.prices.badge)}`}
          </button>
        </div>
      ) : (
        <button type="button" disabled={busy} onClick={choose} className={cn(QUIET, 'mt-4 w-full')}>
          {state === 'declined' ? 'Try again' : 'Start'}
        </button>
      )}
      {problem && <p className="mt-2 text-[13px] text-[#ffb3c4]">{problem}</p>}
    </section>
  );
}

/** Tonight's paid theme: the price, and the way in. */
export function EntryCard({
  night,
  onJoin,
  busy,
}: {
  night: MatchNight & { entered: boolean };
  onJoin: () => void;
  busy: boolean;
}) {
  if (!night.theme) return null;
  return (
    <div className="mx-auto mt-6 max-w-sm rounded-[12px] border border-[#ff5c8a]/40 bg-[#ff5c8a]/[0.07] p-5 text-left">
      <p className={EYEBROW}>Tonight only</p>
      <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">{night.theme.title}</p>
      {night.theme.blurb && <p className="mt-1 text-[14px] text-white/65">{night.theme.blurb}</p>}
      {night.entered ? (
        <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.14em] text-[#5dcaa5]">
          You’re in for tonight
        </p>
      ) : (
        <button
          type="button"
          onClick={onJoin}
          disabled={busy}
          className={cn(PRIMARY, 'mt-4 w-full')}
        >
          Join tonight · {naira(night.theme.entryMinor)}
        </button>
      )}
    </div>
  );
}

/** Top up: the packs, shown when something needs more credit than they have. */
export function TopUpSheet({
  wallet,
  reason,
  onTopUp,
  onClose,
}: {
  wallet: MatchWallet;
  reason: string;
  onTopUp: (amountMinor: number) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Top up Match credit"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[16px] border border-white/15 bg-[#161412] p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-[20px] font-semibold tracking-[-0.03em]">Top up Match credit</p>
        <p className="mt-1 text-[14px] text-white/60">{reason}</p>
        <p className="mt-3 font-mono text-[12px] text-white/50">
          You have {naira(wallet.creditMinor)}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {wallet.packs.map((pack) => (
            <button
              key={pack}
              type="button"
              onClick={() => onTopUp(pack)}
              className="rounded-[10px] border border-white/20 bg-white/[0.04] py-3.5 font-mono text-[15px] hover:border-[#ff5c8a]"
            >
              +{naira(pack)}
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} className={cn(QUIET, 'mt-4 w-full')}>
          Not now
        </button>
      </div>
    </div>
  );
}

/** After a match: a rose or a drink, and what has been sent either way. */
export function GiftBar({
  prices,
  gifts,
  onSend,
  dark = false,
}: {
  prices: Record<MatchGift, number>;
  gifts: { gift: MatchGift; mine: boolean }[];
  onSend: (gift: MatchGift) => void;
  dark?: boolean;
}) {
  const received = gifts.filter((gift) => !gift.mine);
  const sent = gifts.filter((gift) => gift.mine);
  return (
    <div className="space-y-2">
      {(received.length > 0 || sent.length > 0) && (
        <p className={cn('text-[13px]', dark ? 'text-[#0b0a09]/75' : 'text-white/60')}>
          {received.length > 0 &&
            `They sent you ${received.map((g) => `a ${GIFTS[g.gift].name} ${GIFTS[g.gift].emoji}`).join(' and ')}. `}
          {sent.length > 0 &&
            `You sent ${sent.map((g) => `a ${GIFTS[g.gift].name} ${GIFTS[g.gift].emoji}`).join(' and ')}.`}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(GIFTS) as MatchGift[]).map((gift) => (
          <button
            key={gift}
            type="button"
            onClick={() => onSend(gift)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-[13px]',
              dark
                ? 'bg-[#0b0a09] text-[#f4f2ee]'
                : 'border border-white/20 text-white/80 hover:border-[#ff5c8a]',
            )}
          >
            Send a {GIFTS[gift].name} {GIFTS[gift].emoji} · {naira(prices[gift])}
          </button>
        ))}
      </div>
    </div>
  );
}
