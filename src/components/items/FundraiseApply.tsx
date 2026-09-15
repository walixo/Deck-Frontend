import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';
import { InlineAlert } from '@/components/ui/States';
import { useApplyForFundraise } from '@/hooks/useFundraise';
import { RequestError } from '@/lib/api';
import { cn, formatMoney } from '@/lib/utils';
import type { Fundraise } from '@/types';

interface FundraiseApplyProps {
  slug: string;
  itemName: string;
  fundraise: Fundraise;
  className?: string;
}

/**
 * The launcher's entry point to running a fundraise.
 *
 * Applying replaced a checkbox. The checkbox let anyone start collecting money
 * from strangers on Deck's rails with nobody having looked — which is fine right
 * up until the first person takes the money and disappears, at which point it is
 * Deck's problem and Deck has no record of ever having considered it.
 *
 * The button reports where the application stands and disables itself once one
 * is in, so the state of the request is legible without opening anything.
 */
export function FundraiseApply({ slug, itemName, fundraise, className }: FundraiseApplyProps) {
  const [open, setOpen] = useState(false);

  const pending = fundraise.status === 'pending';
  const approved = fundraise.status === 'approved';
  const rejected = fundraise.status === 'rejected';

  /* Approved raises are configured elsewhere — this component's job is done
     once there is something to configure. */
  if (approved) return null;

  const { eligibility } = fundraise;
  /* An application already in flight outranks the gate. A launch can lose votes
     after applying, and showing the maker "you are no longer eligible" while
     staff are reading their application would be both alarming and untrue. */
  const gated = !eligibility.met && !pending;

  return (
    <div className={className}>
      {/*
       * The gate, shown rather than merely enforced.
       *
       * A disabled button with no explanation is the worst version of this: the
       * maker knows they cannot apply and has no idea what would change that.
       * Two bars and two counts answer it without them having to ask, and the
       * numbers come from the server so they cannot disagree with what the API
       * will actually accept.
       */}
      {gated && (
        <div className="mb-3 border border-edge bg-surface-2 px-3 py-2.5">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em]">
            Not ready to raise yet
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted text-pretty">
            A launch needs {eligibility.votesNeeded} votes and {eligibility.commentsNeeded} comments
            before it can apply.
          </p>

          <dl className="mt-3 space-y-2">
            <Requirement
              label="Votes"
              have={eligibility.votes}
              need={eligibility.votesNeeded}
            />
            <Requirement
              label="Comments"
              have={eligibility.comments}
              need={eligibility.commentsNeeded}
            />
          </dl>
        </div>
      )}

      <Button
        size="sm"
        className="w-full"
        variant={pending || gated ? 'secondary' : 'primary'}
        disabled={pending || gated}
        onClick={() => setOpen(true)}
      >
        {pending ? 'Applied for fundraise' : rejected ? 'Apply again' : 'Apply for fundraise'}
      </Button>

      {pending && (
        <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.06em] text-muted">
          Waiting on staff approval
        </p>
      )}

      {rejected && fundraise.reviewNote && (
        <p className="mt-2 border border-edge bg-surface-2 px-3 py-2 text-xs leading-relaxed text-muted text-pretty">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-body">
            Not approved
          </span>
          <br />
          {fundraise.reviewNote}
        </p>
      )}

      {open && (
        <ApplyDialog slug={slug} itemName={itemName} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}

/**
 * One threshold: where the launch stands, and how far that is.
 *
 * The bar is capped at 100% while the count beside it is not, so a launch with
 * 40 of 20 votes reads as a full bar and "40/20" rather than a bar overflowing
 * its own border.
 */
function Requirement({ label, have, need }: { label: string; have: number; need: number }) {
  const met = have >= need;
  const percent = need > 0 ? Math.min(100, Math.round((have / need) * 100)) : 100;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
          {label}
        </dt>
        <dd className="font-mono text-[10px] font-bold tabular-nums">
          <span className={met ? 'text-body' : 'text-muted'}>{have}</span>
          <span className="text-muted">/{need}</span>
        </dd>
      </div>
      <div
        role="progressbar"
        aria-valuenow={have}
        aria-valuemin={0}
        aria-valuemax={need}
        aria-label={`${label}: ${have} of ${need}`}
        className="mt-1 h-1.5 w-full overflow-hidden border border-edge bg-surface"
      >
        {/* The themed mark. A fixed accent is unreadable against one canvas or
            the other at this height — see CONTRACT rule 3. */}
        <div className="h-full bg-accent" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

/**
 * The application form, as a modal dialog.
 *
 * `<dialog>` rather than a hand-rolled overlay: the browser gives focus
 * trapping, Escape-to-close, inertness of the page behind and the top layer for
 * free, and every one of those is a thing hand-rolled modals get wrong.
 */
function ApplyDialog({
  slug,
  itemName,
  onClose,
}: {
  slug: string;
  itemName: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const apply = useApplyForFundraise(slug);

  const [form, setForm] = useState({
    purpose: '',
    useOfFunds: '',
    timeline: '',
    contact: '',
    target: '',
  });

  useEffect(() => {
    /* showModal rather than the `open` attribute — only the former puts the
       dialog in the top layer and makes the rest of the page inert. */
    ref.current?.showModal();
  }, []);

  const error = apply.error instanceof RequestError ? apply.error : null;

  const update =
    (key: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
      setForm((current) => ({ ...current, [key]: event.target.value }));
    };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    apply.mutate(
      {
        purpose: form.purpose.trim(),
        useOfFunds: form.useOfFunds.trim(),
        timeline: form.timeline.trim(),
        contact: form.contact.trim(),
        target: Number(form.target) || 0,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="apply-heading"
      className={cn(
        'w-[min(34rem,92vw)] rounded-slab border border-edge bg-surface p-0 text-body shadow-hard-lg',
        /* `m-auto` restores centring. A modal <dialog> is centred by the UA
           sheet's `inset: 0; margin: auto`, and Tailwind's preflight zeroes
           every margin — which silently pins it to the top of the viewport. */
        'm-auto max-h-[85dvh] overflow-y-auto',
        'backdrop:bg-edge/60',
      )}
    >
      <form onSubmit={submit} className="p-5 sm:p-6" noValidate>
        <h2
          id="apply-heading"
          className="border-b border-edge pb-3 font-display text-lg uppercase"
        >
          Raise money for {itemName}
        </h2>

        <p className="mt-3 text-xs leading-relaxed text-muted text-pretty">
          Deck reviews every fundraise before it opens. Tell us what you are raising for and how
          the money gets spent — the clearer this is, the faster it goes through.
        </p>

        <div className="mt-5 space-y-4">
          {error && !error.fields.length && <InlineAlert>{error.message}</InlineAlert>}

          <Textarea
            label="What is the money for?"
            required
            rows={3}
            value={form.purpose}
            onChange={update('purpose')}
            error={error?.fieldError('purpose')}
            maxLength={600}
            hint="What you are trying to do, and why it needs funding."
          />

          <Textarea
            label="How will it be spent?"
            required
            rows={3}
            value={form.useOfFunds}
            onChange={update('useOfFunds')}
            error={error?.fieldError('useOfFunds')}
            maxLength={600}
            hint="A rough breakdown. It does not have to be to the naira."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Target"
              type="number"
              inputMode="numeric"
              required
              min={1000}
              step={1000}
              value={form.target}
              onChange={update('target')}
              error={error?.fieldError('target')}
              hint={`In whole naira. Minimum contribution is ${formatMoney(100_000)}.`}
            />
            <Input
              label="Over what period?"
              required
              value={form.timeline}
              onChange={update('timeline')}
              error={error?.fieldError('timeline')}
              maxLength={200}
              placeholder="Three months"
            />
          </div>

          <Input
            label="How can we reach you?"
            required
            value={form.contact}
            onChange={update('contact')}
            error={error?.fieldError('contact')}
            maxLength={160}
            hint="An email or handle we can follow up on."
            placeholder="you@example.com"
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-edge pt-4">
          <Button type="submit" loading={apply.isPending}>
            Submit application
          </Button>
          <Button type="button" variant="ghost" onClick={() => ref.current?.close()}>
            Cancel
          </Button>
        </div>
      </form>
    </dialog>
  );
}
