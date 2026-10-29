import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { naira } from './credit';
import type { MatchGiftCard, MatchGiftCards, MatchGiftCardProduct } from './matchApi';
import { PayButton } from './money';
import { CARD, EYEBROW, FIELD, LABEL, LOVE, PRIMARY, QUIET } from './styles';

/**
 * Match gift cards on screen: the card itself, buying one, sharing it, and
 * claiming one you were sent.
 *
 * A card is credit or Match+ days behind a one-time code. Buying goes through
 * Deck's checkout like a top-up; the code is shown only once it is paid for.
 */

type Draft = { product: string; toName: string; fromName: string; message: string };

const dateOf = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

/** The headline a card carries: "₦2,000" or "30 days of Match+". */
const headline = (card: Pick<MatchGiftCardProduct, 'kind' | 'valueMinor' | 'plusDays'>) =>
  card.kind === 'plus' ? `${card.plusDays} days of Match+` : naira(card.valueMinor);

/** The card as it is seen and shared: the love gradient, the value, the note. */
export function GiftCardFace({
  card,
  className,
}: {
  card: Pick<
    MatchGiftCard,
    'kind' | 'valueMinor' | 'plusDays' | 'toName' | 'fromName' | 'message'
  > & {
    code?: string | null;
  };
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative isolate flex aspect-[1.6] w-full flex-col overflow-hidden rounded-[26px] p-5 text-left text-white shadow-[0_24px_60px_rgb(255_92_138_/_0.35)]',
        LOVE,
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="absolute -right-16 -top-20 -z-10 size-56 rounded-full bg-white/25 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-24 -left-10 -z-10 size-56 rounded-full bg-[#5b2a8f]/40 blur-2xl"
      />
      <div className="flex items-start justify-between">
        <span className="flex items-baseline gap-1.5">
          <span className="text-[22px] font-semibold tracking-[-0.06em]">match</span>
          <span className="size-[6px] rounded-full bg-white" />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/80">
          Gift card
        </span>
      </div>
      <p className="mt-[5%] text-[clamp(1.75rem,8vw,2.4rem)] font-semibold leading-none tracking-[-0.05em]">
        {headline(card)}
        {card.kind === 'credit' && (
          <span className="ml-2 text-[13px] font-normal tracking-normal text-white/80">
            Match credit
          </span>
        )}
      </p>
      {(card.toName || card.fromName) && (
        <p className="mt-2 text-[13px] text-white/90">
          {card.toName && <>For {card.toName}</>}
          {card.toName && card.fromName && ' · '}
          {card.fromName && <>from {card.fromName}</>}
        </p>
      )}
      {card.message && (
        <p
          className={cn(
            'mt-1 text-[13px] italic text-white/85',
            card.code ? 'line-clamp-1' : 'line-clamp-2',
          )}
        >
          “{card.message}”
        </p>
      )}
      {card.code && (
        <p className="mt-auto w-fit rounded-full bg-black/35 px-3 py-1.5 font-mono text-[13px] tracking-[0.12em] backdrop-blur">
          {card.code}
        </p>
      )}
    </div>
  );
}

/** A dialog that rises from the bottom on phones. */
function Sheet({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={onClose}
    >
      <div
        className="max-h-[92dvh] w-full max-w-sm overflow-y-auto rounded-[28px] border border-white/12 bg-[#18141a]/95 p-6 shadow-[0_40px_100px_rgb(0_0_0_/_0.5)]"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/** Choosing a card and writing its note, with the card drawn as you type. */
export function GiftCardBuySheet({
  data,
  pending,
  onBuy,
  onClose,
}: {
  data: MatchGiftCards;
  pending: string | null;
  onBuy: (draft: Draft) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Draft>({
    product: data.products[1]?.id ?? data.products[0].id,
    toName: '',
    fromName: '',
    message: '',
  });
  const product = data.products.find((p) => p.id === draft.product) ?? data.products[0];
  const field = (key: 'toName' | 'fromName', label: string, placeholder: string) => (
    <label className="block">
      <span className={LABEL}>{label}</span>
      <input
        value={draft[key]}
        onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
        maxLength={40}
        placeholder={placeholder}
        className={cn(FIELD, 'mt-1.5 w-full px-4 py-3 text-[15px] placeholder:text-white/25')}
      />
    </label>
  );
  return (
    <Sheet label="Buy a Match gift card" onClose={onClose}>
      <p className="text-[20px] font-semibold tracking-[-0.03em]">Give someone Match</p>
      <p className="mt-1 text-[14px] text-white/60">
        A code they claim in Match. It works once, for {data.months} months.
      </p>
      <GiftCardFace card={{ ...product, ...draft }} className="mt-5" />
      <div className="mt-5 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Gift card">
        {data.products.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={draft.product === option.id}
            onClick={() => setDraft({ ...draft, product: option.id })}
            className={cn(
              'rounded-[18px] border px-3 py-3 text-left transition-[transform,background-color,border-color] duration-150 active:scale-[0.97]',
              draft.product === option.id
                ? 'border-[#ff5c8a]/70 bg-[#ff5c8a]/[0.14]'
                : 'border-white/10 bg-white/[0.05] hover:bg-white/[0.09]',
            )}
          >
            <span className="block text-[15px] font-semibold tracking-[-0.02em]">
              {headline(option)}
            </span>
            <span className="mt-0.5 block font-mono text-[12px] text-white/55">
              {option.kind === 'plus' ? naira(option.priceMinor) : 'credit'}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-5 space-y-3">
        {field('toName', 'For (optional)', 'Their name')}
        {field('fromName', 'From (optional)', 'Your name')}
        <label className="block">
          <span className={LABEL}>Note (optional)</span>
          <textarea
            value={draft.message}
            onChange={(event) => setDraft({ ...draft, message: event.target.value })}
            maxLength={140}
            rows={2}
            placeholder="Go talk to someone new"
            className={cn(
              FIELD,
              'mt-1.5 w-full resize-none px-4 py-3 text-[15px] placeholder:text-white/25',
            )}
          />
        </label>
      </div>
      {data.payments ? (
        <PayButton
          busy={pending === 'giftcard'}
          locked={pending !== null}
          busyLabel="Opening checkout…"
          onClick={() => onBuy(draft)}
          className={cn(PRIMARY, 'mt-5 w-full')}
        >
          Pay {naira(product.priceMinor)}
        </PayButton>
      ) : (
        <p className="mt-5 text-center text-[13px] text-white/45">
          Gift cards are not available right now.
        </p>
      )}
      <button type="button" onClick={onClose} className={cn(QUIET, 'mt-2 w-full')}>
        Not now
      </button>
    </Sheet>
  );
}

/** A bought card: the code, and the ways to send it. */
export function GiftCardShowSheet({ card, onClose }: { card: MatchGiftCard; onClose: () => void }) {
  const [copied, setCopied] = useState('');
  const copy = async (what: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
    } catch {
      setCopied('');
    }
  };
  const share = async () => {
    if (!card.link) return;
    const text = `${card.fromName ? `${card.fromName} sent you` : 'You’ve been sent'} ${card.label} — two voices, two minutes. Claim it here:`;
    try {
      await navigator.share({ title: 'A Match gift card', text, url: card.link });
    } catch {
      /* Closed the share sheet: nothing to do. */
    }
  };
  const canShare = typeof navigator.share === 'function';
  return (
    <Sheet label="Your Match gift card" onClose={onClose}>
      <p className={EYEBROW}>
        {card.status === 'redeemed'
          ? `Claimed ${card.redeemedAt ? dateOf(card.redeemedAt) : ''}`
          : card.status === 'void'
            ? 'Cancelled'
            : 'Ready to send'}
      </p>
      <GiftCardFace card={card} className="mt-3" />
      {card.status === 'active' && card.code && card.link && (
        <>
          <div className="mt-5 grid gap-2">
            {canShare && (
              <button type="button" onClick={share} className={cn(PRIMARY, 'w-full')}>
                Send it
              </button>
            )}
            <button
              type="button"
              onClick={() => copy('link', card.link!)}
              className={cn(canShare ? QUIET : PRIMARY, 'w-full')}
            >
              {copied === 'link' ? 'Link copied' : 'Copy the link'}
            </button>
            <button
              type="button"
              onClick={() => copy('code', card.code!)}
              className={cn(QUIET, 'w-full')}
            >
              {copied === 'code' ? 'Code copied' : `Copy the code · ${card.code}`}
            </button>
          </div>
          <p className="mt-3 text-center text-[12px] leading-relaxed text-white/45">
            Anyone with the code can claim it, so send it only to them. It works once
            {card.expiresAt ? `, until ${dateOf(card.expiresAt)}` : ''}.
            {card.test && ' Test card — no money moved.'}
          </p>
        </>
      )}
      <button type="button" onClick={onClose} className={cn(QUIET, 'mt-3 w-full')}>
        Done
      </button>
    </Sheet>
  );
}

/** Opened from a gift card link: what it is, and the one tap to claim it. */
export function RedeemSheet({
  code,
  pending,
  onRedeem,
  onClose,
}: {
  code: string;
  pending: string | null;
  onRedeem: (code: string) => void;
  onClose: () => void;
}) {
  return (
    <Sheet label="Claim a Match gift card" onClose={onClose}>
      <p className="text-center text-[44px] leading-none">🎁</p>
      <p className="mt-3 text-center text-[22px] font-semibold tracking-[-0.03em]">
        Someone sent you Match
      </p>
      <p className="mt-1 text-center text-[14px] text-white/60">
        Claim this gift card to add it to your account.
      </p>
      <p className="mx-auto mt-4 w-fit rounded-full bg-white/[0.07] px-4 py-2 font-mono text-[15px] tracking-[0.12em]">
        {code}
      </p>
      <PayButton
        busy={pending === 'redeem'}
        locked={pending !== null}
        busyLabel="Claiming…"
        onClick={() => onRedeem(code)}
        className={cn(PRIMARY, 'mt-5 w-full')}
      >
        Claim it
      </PayButton>
      <button type="button" onClick={onClose} className={cn(QUIET, 'mt-2 w-full')}>
        Not now
      </button>
    </Sheet>
  );
}

/** The lobby's gift card panel: buy one, claim one, and the ones you bought. */
export function GiftCardsCard({
  data,
  pending,
  onBuy,
  onRedeem,
  onShow,
}: {
  data: MatchGiftCards;
  pending: string | null;
  onBuy: () => void;
  onRedeem: (code: string) => Promise<boolean>;
  onShow: (card: MatchGiftCard) => void;
}) {
  const [code, setCode] = useState('');
  return (
    <section className={CARD}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[17px] font-semibold tracking-[-0.02em]">Gift cards 🎁</p>
          <p className="mt-0.5 text-[13px] text-white/55">
            Give someone credit or a month of Match+.
          </p>
        </div>
        <button
          type="button"
          onClick={onBuy}
          className={cn(PRIMARY, 'shrink-0 px-5 py-3 text-[14px]')}
        >
          Buy one
        </button>
      </div>
      <form
        className="mt-4 flex gap-2"
        onSubmit={async (event) => {
          event.preventDefault();
          if (code.trim() && (await onRedeem(code.trim()))) setCode('');
        }}
      >
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="Have a code?"
          aria-label="Gift card code"
          autoCapitalize="characters"
          autoComplete="off"
          className={cn(
            FIELD,
            'min-w-0 flex-1 px-4 py-3 font-mono text-[15px] tracking-[0.08em] placeholder:font-sans placeholder:tracking-normal placeholder:text-white/30',
          )}
        />
        <PayButton
          busy={pending === 'redeem'}
          locked={pending !== null || !code.trim()}
          onClick={() => undefined}
          className={cn(QUIET, 'px-5 py-3 text-[14px]')}
          submit
        >
          Claim
        </PayButton>
      </form>
      {data.cards.length > 0 && (
        <ul className="mt-4 space-y-1.5 border-t border-white/10 pt-3">
          {data.cards.map((card) => (
            <li
              key={card.reference}
              className="flex items-center justify-between gap-3 text-[14px]"
            >
              <span className="min-w-0 truncate text-white/75">
                {card.label}
                {card.toName && <span className="text-white/45"> · for {card.toName}</span>}
              </span>
              {card.status === 'active' ? (
                <button
                  type="button"
                  onClick={() => onShow(card)}
                  className="shrink-0 text-[13px] font-medium text-[#ff8fab] underline-offset-4 hover:underline"
                >
                  Send
                </button>
              ) : (
                <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.12em] text-white/40">
                  {card.status === 'redeemed'
                    ? 'Claimed'
                    : card.status === 'void'
                      ? 'Cancelled'
                      : ''}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
