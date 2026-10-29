import { useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { GIFTS, naira, shrinkPhoto } from './credit';
import type { MatchGift, MatchNight, MatchWallet } from './matchApi';
import { CARD, CHIP, EYEBROW, LABEL, LINK, PRIMARY, QUIET } from './styles';

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

/** A small turning ring: something is on its way. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent',
        className,
      )}
    />
  );
}

/**
 * A button that pays for something. Pressed, it turns into a spinner with
 * `busyLabel` until the payment is done or checkout opens, and every other
 * pay button waits — so a tap always visibly does something.
 */
export function PayButton({
  busy,
  locked = false,
  busyLabel,
  onClick,
  submit = false,
  className,
  children,
}: {
  /** This button's payment is under way. */
  busy: boolean;
  /** Another payment is under way. */
  locked?: boolean;
  busyLabel?: string;
  onClick: () => void;
  /** Sends its form instead of only calling `onClick`. */
  submit?: boolean;
  className: string;
  children: ReactNode;
}) {
  return (
    <button
      type={submit ? 'submit' : 'button'}
      onClick={onClick}
      disabled={busy || locked}
      aria-busy={busy}
      className={cn(className, busy && 'cursor-wait disabled:opacity-100')}
    >
      {busy ? (
        <>
          <Spinner />
          {busyLabel ?? children}
        </>
      ) : (
        children
      )}
    </button>
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
  pending,
  onTopUp,
}: {
  wallet: MatchWallet;
  /** Which payment is under way, if any: `topup:50000`, `plus`, … */
  pending: string | null;
  onTopUp: (amountMinor: number) => void;
}) {
  const [history, setHistory] = useState(false);
  return (
    <section className={CARD}>
      <div className="flex items-baseline justify-between gap-3">
        <p className={LABEL}>Match credit</p>
        {wallet.ledger.length > 0 && (
          <button type="button" onClick={() => setHistory(!history)} className={LINK}>
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
            <PayButton
              key={pack}
              busy={pending === `topup:${pack}`}
              locked={pending !== null}
              onClick={() => onTopUp(pack)}
              className={cn(
                CHIP,
                'inline-flex items-center justify-center gap-1.5 py-2.5 text-[13px]',
              )}
            >
              +{naira(pack)}
            </PayButton>
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
  pending,
}: {
  wallet: MatchWallet;
  onBuy: () => void;
  pending: string | null;
}) {
  const member = Boolean(wallet.plusUntil);
  return (
    <section
      className={cn(
        CARD,
        'bg-[linear-gradient(140deg,rgb(255_92_138_/_0.1),rgb(183_124_255_/_0.06))]',
        member && 'border-[#ff5c8a]/35',
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[20px] font-semibold tracking-[-0.03em]">
          Match
          <span className="bg-[linear-gradient(120deg,#ff5c8a,#b77cff)] bg-clip-text text-transparent">
            +
          </span>
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
      <PayButton
        busy={pending === 'plus'}
        locked={pending !== null}
        busyLabel="Paying…"
        onClick={onBuy}
        className={cn(member ? QUIET : PRIMARY, 'mt-4 w-full')}
      >
        {member
          ? `Add ${wallet.prices.plusDays} more days · ${naira(wallet.prices.plus)}`
          : `Get Match+ · ${naira(wallet.prices.plus)}`}
      </PayButton>
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
          <p className="rounded-[18px] bg-white/[0.07] px-4 py-3 text-[15px]">
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
          <PayButton
            busy={busy}
            busyLabel="Sending…"
            onClick={() => input.current?.click()}
            className={cn(PRIMARY, 'w-full')}
          >
            Take selfie · {naira(wallet.prices.badge)}
          </PayButton>
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
  pending,
}: {
  night: MatchNight & { entered: boolean };
  onJoin: () => void;
  pending: string | null;
}) {
  if (!night.theme) return null;
  return (
    <div
      className={cn(
        CARD,
        'mx-auto mt-6 max-w-sm border-[#ff5c8a]/30 bg-[linear-gradient(140deg,rgb(255_92_138_/_0.14),rgb(183_124_255_/_0.08))] text-left',
      )}
    >
      <p className={EYEBROW}>Tonight only</p>
      <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">{night.theme.title}</p>
      {night.theme.blurb && <p className="mt-1 text-[14px] text-white/65">{night.theme.blurb}</p>}
      {night.entered ? (
        <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.14em] text-[#5dcaa5]">
          You’re in for tonight
        </p>
      ) : (
        <PayButton
          busy={pending === 'night'}
          locked={pending !== null}
          busyLabel="Paying…"
          onClick={onJoin}
          className={cn(PRIMARY, 'mt-4 w-full')}
        >
          Join tonight · {naira(night.theme.entryMinor)}
        </PayButton>
      )}
    </div>
  );
}

/** Top up: the packs, shown when something needs more credit than they have. */
export function TopUpSheet({
  wallet,
  reason,
  pending,
  onTopUp,
  onClose,
}: {
  wallet: MatchWallet;
  reason: string;
  pending: string | null;
  onTopUp: (amountMinor: number) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Top up Match credit"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[28px] border border-white/12 bg-[#18141a]/95 p-6 shadow-[0_40px_100px_rgb(0_0_0_/_0.5)]"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-[20px] font-semibold tracking-[-0.03em]">Top up Match credit</p>
        <p className="mt-1 text-[14px] text-white/60">{reason}</p>
        <p className="mt-3 font-mono text-[12px] text-white/50">
          You have {naira(wallet.creditMinor)}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {wallet.packs.map((pack) => (
            <PayButton
              key={pack}
              busy={pending === `topup:${pack}`}
              locked={pending !== null}
              busyLabel="Opening…"
              onClick={() => onTopUp(pack)}
              className={cn(
                CHIP,
                'inline-flex items-center justify-center gap-2 py-3.5 text-[15px]',
              )}
            >
              +{naira(pack)}
            </PayButton>
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
  pending,
  onSend,
}: {
  prices: Record<MatchGift, number>;
  gifts: { gift: MatchGift; mine: boolean }[];
  /** `rose` or `drink` while that gift is being sent here; `other` while anything else is paid. */
  pending: MatchGift | 'other' | null;
  onSend: (gift: MatchGift) => void;
}) {
  const received = gifts.filter((gift) => !gift.mine);
  const sent = gifts.filter((gift) => gift.mine);
  return (
    <div className="space-y-2">
      {(received.length > 0 || sent.length > 0) && (
        <p className="text-[13px] text-white/60">
          {received.length > 0 &&
            `They sent you ${received.map((g) => `a ${GIFTS[g.gift].name} ${GIFTS[g.gift].emoji}`).join(' and ')}. `}
          {sent.length > 0 &&
            `You sent ${sent.map((g) => `a ${GIFTS[g.gift].name} ${GIFTS[g.gift].emoji}`).join(' and ')}.`}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(GIFTS) as MatchGift[]).map((gift) => (
          <PayButton
            key={gift}
            busy={pending === gift}
            locked={pending !== null}
            busyLabel="Sending…"
            onClick={() => onSend(gift)}
            className={cn(
              CHIP,
              'inline-flex items-center gap-2 px-3.5 py-2 font-sans text-[13px] text-white/85 hover:bg-[#ff5c8a]/20 hover:text-white',
            )}
          >
            Send a {GIFTS[gift].name} {GIFTS[gift].emoji} · {naira(prices[gift])}
          </PayButton>
        ))}
      </div>
    </div>
  );
}
