import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { naira } from './credit';
import type { MatchBrandCards, MatchBrandOrder, MatchBrandProduct } from './matchApi';
import { PayButton } from './money';
import { CARD, EYEBROW, FIELD, LABEL, PRIMARY, QUIET } from './styles';

/**
 * Other brands' gift cards in Match — Chowdeck, Jumia and the rest — bought
 * through Reloadly. Pick a brand and an amount, pay through Deck's checkout,
 * and the code appears here as soon as the brand issues it.
 */

const faceLabel = (face: number, currency: string) =>
  currency === 'NGN' ? naira(face * 100) : `${face.toLocaleString('en-NG')} ${currency}`;

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

/** The brand's logo, or its first letter if there is none or it won't load. */
function Logo({ src, name, className }: { src: string; name: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  return src && !broken ? (
    <img
      src={src}
      alt=""
      onError={() => setBroken(true)}
      className={cn('rounded-2xl bg-white object-contain', className)}
    />
  ) : (
    <span
      className={cn(
        'grid place-items-center rounded-2xl bg-white/10 text-[18px] font-semibold',
        className,
      )}
    >
      {name.slice(0, 1)}
    </span>
  );
}

/** Choosing a brand, then an amount, then paying. */
export function BrandCardsSheet({
  data,
  pending,
  onBuy,
  onClose,
}: {
  data: MatchBrandCards;
  pending: string | null;
  onBuy: (input: { productId: number; faceValue: number; toName: string }) => void;
  onClose: () => void;
}) {
  const [product, setProduct] = useState<MatchBrandProduct | null>(null);
  const [face, setFace] = useState<number | null>(null);
  const [toName, setToName] = useState('');
  const chosen = product?.amounts.find((amount) => amount.face === face) ?? null;
  return (
    <Sheet label="Gift cards from other brands" onClose={onClose}>
      {!product ? (
        <>
          <p className="text-[20px] font-semibold tracking-[-0.03em]">
            Gift cards for other brands
          </p>
          <p className="mt-1 text-[14px] text-white/60">
            Food, shopping and more — the code arrives here after you pay.
          </p>
          {data.products.length === 0 ? (
            <p className="mt-6 text-center text-[14px] text-white/45">
              No brands on sale right now.
            </p>
          ) : (
            <div className="mt-5 grid grid-cols-3 gap-3">
              {data.products.map((option) => (
                <button
                  key={option.productId}
                  type="button"
                  onClick={() => {
                    setProduct(option);
                    setFace(option.amounts[0]?.face ?? null);
                  }}
                  className="flex flex-col items-center gap-2 rounded-[18px] bg-white/[0.05] p-3 transition-[transform,background-color] hover:bg-white/[0.09] active:scale-[0.97]"
                >
                  <Logo src={option.logoUrl} name={option.brand} className="size-14" />
                  <span className="line-clamp-1 text-[13px] font-medium">{option.brand}</span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setProduct(null)}
            className="text-[13px] text-white/55 hover:text-white"
          >
            ← All brands
          </button>
          <div className="mt-3 flex items-center gap-4">
            <Logo src={product.logoUrl} name={product.brand} className="size-16" />
            <div>
              <p className="text-[20px] font-semibold tracking-[-0.03em]">{product.brand}</p>
              <p className="text-[13px] text-white/55">{product.name}</p>
            </div>
          </div>
          <p className={cn(LABEL, 'mt-5')}>Amount</p>
          <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Amount">
            {product.amounts.map((amount) => (
              <button
                key={amount.face}
                type="button"
                role="radio"
                aria-checked={face === amount.face}
                onClick={() => setFace(amount.face)}
                className={cn(
                  'rounded-[18px] border px-3 py-3 text-left transition-[transform,background-color,border-color] active:scale-[0.97]',
                  face === amount.face
                    ? 'border-[#ff5c8a]/70 bg-[#ff5c8a]/[0.14]'
                    : 'border-white/10 bg-white/[0.05] hover:bg-white/[0.09]',
                )}
              >
                <span className="block text-[16px] font-semibold">
                  {faceLabel(amount.face, product.currency)}
                </span>
                <span className="mt-0.5 block font-mono text-[12px] text-white/55">
                  {naira(amount.priceMinor)}
                </span>
              </button>
            ))}
          </div>
          <label className="mt-4 block">
            <span className={LABEL}>For (optional)</span>
            <input
              value={toName}
              onChange={(event) => setToName(event.target.value)}
              maxLength={40}
              placeholder="Who it’s for — just for your list"
              className={cn(FIELD, 'mt-1.5 w-full px-4 py-3 text-[15px] placeholder:text-white/25')}
            />
          </label>
          <PayButton
            busy={pending === 'brandcard'}
            locked={pending !== null || !chosen}
            busyLabel="Opening checkout…"
            onClick={() =>
              chosen && onBuy({ productId: product.productId, faceValue: chosen.face, toName })
            }
            className={cn(PRIMARY, 'mt-5 w-full')}
          >
            {chosen ? `Pay ${naira(chosen.priceMinor)}` : 'Choose an amount'}
          </PayButton>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-white/35">
            Sold by Deck through Reloadly. {product.brand}’s own terms apply to the card. Codes
            can’t be returned once issued.
          </p>
        </>
      )}
      <button type="button" onClick={onClose} className={cn(QUIET, 'mt-3 w-full')}>
        Close
      </button>
    </Sheet>
  );
}

/** A bought brand card: the code and PIN, how to redeem, or where it's up to. */
export function BrandCardShowSheet({
  order,
  onClose,
}: {
  order: MatchBrandOrder;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState('');
  const copy = async (what: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
    } catch {
      setCopied('');
    }
  };
  return (
    <Sheet label={`${order.brand} gift card`} onClose={onClose}>
      <div className="flex items-center gap-4">
        <Logo src={order.logoUrl} name={order.brand} className="size-16" />
        <div>
          <p className={EYEBROW}>
            {order.status === 'fulfilled'
              ? 'Ready to use'
              : order.status === 'refunded'
                ? 'Refunded'
                : 'On its way'}
          </p>
          <p className="mt-1 text-[22px] font-semibold tracking-[-0.03em]">
            {faceLabel(order.faceValue, order.faceCurrency)} {order.brand}
          </p>
          {order.toName && <p className="text-[13px] text-white/55">For {order.toName}</p>}
        </div>
      </div>
      {order.code ? (
        <div className="mt-5 space-y-2">
          {[
            ['Code', order.code.cardNumber],
            ['PIN', order.code.pinCode],
          ]
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <button
                key={label}
                type="button"
                onClick={() => copy(label, value)}
                className="flex w-full items-center justify-between gap-3 rounded-[18px] bg-white/[0.07] px-4 py-3.5 text-left"
              >
                <span>
                  <span className={cn(LABEL, 'block')}>{label}</span>
                  <span className="mt-1 block break-all font-mono text-[18px] tracking-[0.06em]">
                    {value}
                  </span>
                </span>
                <span className="shrink-0 text-[12px] text-[#ff8fab]">
                  {copied === label ? 'Copied' : 'Copy'}
                </span>
              </button>
            ))}
          {order.code.redemptionUrl && (
            <a
              href={order.code.redemptionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(PRIMARY, 'w-full')}
            >
              Redeem on {order.brand}
            </a>
          )}
          {order.redeemInstruction && (
            <p className="whitespace-pre-line pt-1 text-[13px] leading-relaxed text-white/60">
              {order.redeemInstruction}
            </p>
          )}
          <p className="text-[12px] text-white/40">
            Anyone with the code can use it — share it only with the person it’s for.
            {order.test && ' Test card from the sandbox — not a real code.'}
          </p>
        </div>
      ) : (
        <p className={cn(CARD, 'mt-5 text-[14px] text-white/70')}>
          {order.status === 'refunded'
            ? `We couldn’t get this card from ${order.brand}, so ${naira(order.priceMinor)} went back to your Match credit.`
            : `${order.brand} hasn’t issued the code yet. It usually takes a moment — it appears here, and we keep trying automatically.`}
        </p>
      )}
      <button type="button" onClick={onClose} className={cn(QUIET, 'mt-4 w-full')}>
        Done
      </button>
    </Sheet>
  );
}

/** The lobby's way in: other brands' cards, and the ones you bought. */
export function BrandCardsRow({
  data,
  onOpen,
  onShow,
}: {
  data: MatchBrandCards;
  onOpen: () => void;
  onShow: (order: MatchBrandOrder) => void;
}) {
  if (!data.available && data.orders.length === 0) return null;
  return (
    <section className={CARD}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[17px] font-semibold tracking-[-0.02em]">Other brands</p>
          <p className="mt-0.5 text-[13px] text-white/55">
            Gift cards for food, shopping and more
            {data.products.length
              ? ` — ${data.products
                  .slice(0, 3)
                  .map((p) => p.brand)
                  .join(', ')}`
              : ''}
            .
          </p>
        </div>
        {data.available && (
          <button
            type="button"
            onClick={onOpen}
            className={cn(QUIET, 'shrink-0 px-5 py-3 text-[14px]')}
          >
            Browse
          </button>
        )}
      </div>
      {data.orders.length > 0 && (
        <ul className="mt-4 space-y-1.5 border-t border-white/10 pt-3">
          {data.orders.map((order) => (
            <li
              key={order.reference}
              className="flex items-center justify-between gap-3 text-[14px]"
            >
              <span className="min-w-0 truncate text-white/75">
                {faceLabel(order.faceValue, order.faceCurrency)} {order.brand}
                {order.toName && <span className="text-white/45"> · for {order.toName}</span>}
              </span>
              <button
                type="button"
                onClick={() => onShow(order)}
                className="shrink-0 text-[13px] font-medium text-[#ff8fab] underline-offset-4 hover:underline"
              >
                {order.status === 'fulfilled'
                  ? 'View code'
                  : order.status === 'refunded'
                    ? 'Refunded'
                    : 'On its way'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
