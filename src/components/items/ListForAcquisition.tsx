import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';
import { InlineAlert } from '@/components/ui/States';
import { useListForAcquisition } from '@/hooks/useAcquisitions';
import { RequestError } from '@/lib/api';
import { cn, formatMoney } from '@/lib/utils';
import { ACQUISITION_ASSETS, ASSET_LABELS, type AcquisitionAsset, type Item } from '@/types';

/**
 * The launcher's way to put their product up for sale.
 *
 * Lives on the launch page beside the other owner controls, because the launch
 * is the thing being sold and this is one of the things you can do with it —
 * not a separate flow somebody has to discover.
 *
 * Like a fundraise, it is an application rather than a switch. An approved
 * listing puts Deck's name beside somebody's asking price, and the first
 * fraudulent one is Deck's problem regardless of who wrote it.
 */
export function ListForAcquisition({ item, feePercent = 8 }: { item: Item; feePercent?: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3 border-t border-edge pt-4">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em]">Sell this product</p>
      <p className="text-xs leading-relaxed text-muted text-pretty">
        List it for acquisition and take offers. Deck reviews every listing, and takes{' '}
        {feePercent}% only when a sale completes.
      </p>

      <Button variant="secondary" size="sm" className="w-full" onClick={() => setOpen(true)}>
        List for acquisition
      </Button>

      {open && <ListingDialog item={item} feePercent={feePercent} onClose={() => setOpen(false)} />}
    </div>
  );
}

function ListingDialog({
  item,
  feePercent,
  onClose,
}: {
  item: Item;
  feePercent: number;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();
  const list = useListForAcquisition(item.slug);

  const [form, setForm] = useState({
    asking: '',
    negotiable: true,
    reason: '',
    monthlyRevenue: '',
    monthlyCost: '',
    activeUsers: '',
    notes: '',
  });
  const [assets, setAssets] = useState<AcquisitionAsset[]>(['source']);

  useEffect(() => {
    /* showModal, not the `open` attribute — only the former puts the dialog in
       the top layer and makes the rest of the page inert. */
    ref.current?.showModal();
  }, []);

  const error = list.error instanceof RequestError ? list.error : null;

  const askingMinor = Math.round((Number(form.asking) || 0) * 100);
  const feeMinor = Math.round((askingMinor * feePercent) / 100);

  const toggleAsset = (asset: AcquisitionAsset) =>
    setAssets((current) =>
      current.includes(asset) ? current.filter((entry) => entry !== asset) : [...current, asset],
    );

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    list.mutate(
      {
        asking: Number(form.asking) || 0,
        negotiable: form.negotiable,
        reason: form.reason.trim(),
        assets,
        monthlyRevenue: Number(form.monthlyRevenue) || 0,
        monthlyCost: Number(form.monthlyCost) || 0,
        activeUsers: Number(form.activeUsers) || 0,
        notes: form.notes.trim() || undefined,
      },
      { onSuccess: (listing) => navigate(`/acquisitions/${listing.slug}`) },
    );
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="list-heading"
      className={cn(
        'w-[min(38rem,92vw)] rounded-slab border border-edge bg-surface p-0 text-body shadow-hard-lg',
        /* `m-auto` restores centring. A modal <dialog> is centred by the UA
           sheet's `inset: 0; margin: auto`, and Tailwind's preflight zeroes
           every margin — which silently pins it to the top of the viewport. */
        'm-auto max-h-[85dvh] overflow-y-auto',
        'backdrop:bg-edge/60',
      )}
    >
      <form onSubmit={submit} className="p-5 sm:p-6" noValidate>
        <h2 id="list-heading" className="border-b border-edge pb-3 font-display text-lg uppercase">
          List {item.name} for acquisition
        </h2>

        <p className="mt-3 text-xs leading-relaxed text-muted text-pretty">
          Deck reviews every listing before it goes on the board. Nothing is charged to list, and
          Deck&apos;s {feePercent}% is only due if you accept an offer.
        </p>

        <div className="mt-5 space-y-4">
          {error && !error.fields.length && <InlineAlert>{error.message}</InlineAlert>}

          <Input
            label="Asking price"
            type="number"
            inputMode="numeric"
            required
            min={50_000}
            step={50_000}
            value={form.asking}
            onChange={(event) => setForm({ ...form, asking: event.target.value })}
            error={error?.fieldError('asking')}
            hint="In whole naira. This is the figure the board sets in large type."
          />

          {/* The split, computed as they type. A seller should never have to
              work out 8% of their own number to know what they walk away with. */}
          {askingMinor > 0 && (
            <dl className="space-y-1 border border-edge bg-surface-2 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.06em] text-muted">
              <div className="flex justify-between gap-2">
                <dt>Deck&apos;s {feePercent}%</dt>
                <dd className="tabular-nums">{formatMoney(feeMinor)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>You keep</dt>
                <dd className="tabular-nums text-body">{formatMoney(askingMinor - feeMinor)}</dd>
              </div>
            </dl>
          )}

          <label className="flex items-start gap-2.5 text-xs leading-relaxed">
            <input
              type="checkbox"
              checked={form.negotiable}
              onChange={(event) => setForm({ ...form, negotiable: event.target.checked })}
              className="mt-0.5 size-4 shrink-0 border border-edge accent-pop"
            />
            <span>
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.06em]">
                Open to offers
              </span>
              <span className="mt-0.5 block text-muted text-pretty">
                Uncheck for a firm price — Deck will refuse anything under it rather than passing
                it to you.
              </span>
            </span>
          </label>

          <fieldset>
            <legend className="font-mono text-[11px] font-bold uppercase tracking-[0.1em]">
              What is included
            </legend>
            <p className="mt-1 text-xs text-muted">
              The first thing every buyer asks. Pick everything that transfers.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {ACQUISITION_ASSETS.map((asset) => (
                <button
                  key={asset}
                  type="button"
                  onClick={() => toggleAsset(asset)}
                  aria-pressed={assets.includes(asset)}
                  className={cn(
                    'border border-edge px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.06em] transition-colors duration-[120ms]',
                    assets.includes(asset)
                      ? 'bg-pop text-on-pop'
                      : 'bg-surface text-muted hover:bg-surface-2 hover:text-body',
                  )}
                >
                  {ASSET_LABELS[asset]}
                </button>
              ))}
            </div>
            {error?.fieldError('assets') && (
              <p role="alert" className="mt-2 font-mono text-[11px] font-bold uppercase text-red">
                {error.fieldError('assets')}
              </p>
            )}
          </fieldset>

          <Textarea
            label="Why are you selling?"
            required
            rows={4}
            value={form.reason}
            onChange={(event) => setForm({ ...form, reason: event.target.value })}
            error={error?.fieldError('reason')}
            maxLength={1500}
            hint="Buyers read this before the price. Be straight about it — 'no time' sells better than a story nobody believes."
            counter={`${form.reason.length}/1500`}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Revenue / month"
              type="number"
              inputMode="numeric"
              min={0}
              value={form.monthlyRevenue}
              onChange={(event) => setForm({ ...form, monthlyRevenue: event.target.value })}
              error={error?.fieldError('monthlyRevenue')}
              hint="0 if pre-revenue"
            />
            <Input
              label="Costs / month"
              type="number"
              inputMode="numeric"
              min={0}
              value={form.monthlyCost}
              onChange={(event) => setForm({ ...form, monthlyCost: event.target.value })}
              error={error?.fieldError('monthlyCost')}
              hint="Hosting, APIs"
            />
            <Input
              label="Active users"
              type="number"
              inputMode="numeric"
              min={0}
              value={form.activeUsers}
              onChange={(event) => setForm({ ...form, activeUsers: event.target.value })}
              error={error?.fieldError('activeUsers')}
              hint="Monthly"
            />
          </div>

          <Textarea
            label="Anything else (optional)"
            rows={3}
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            error={error?.fieldError('notes')}
            maxLength={1500}
            hint="Stack, hosting, how much handover you will do."
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-edge pt-4">
          <Button type="submit" loading={list.isPending}>
            Submit for review
          </Button>
          <Button type="button" variant="ghost" onClick={() => ref.current?.close()}>
            Cancel
          </Button>
        </div>
      </form>
    </dialog>
  );
}
