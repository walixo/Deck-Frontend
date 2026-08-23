import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Field';
import { BackerList, RaiseBar } from './FundraiseProgress';
import { useContributions, useUpdateFundraise } from '@/hooks/useFundraise';
import type { Item } from '@/types';
import { FundraiseApply } from './FundraiseApply';

/**
 * The launcher's own controls for their raise.
 *
 * Two states, and which one shows is not the maker's decision. Before approval
 * the only thing on offer is applying; after it, the target and the pitch are
 * theirs to edit. There is no longer a switch that turns a raise on, because
 * collecting money from strangers on Deck's rails is Deck's call to make.
 *
 * Pausing is still theirs — stopping new money without erasing what came in,
 * because what was given was given.
 */
export function FundraiseSettings({ item }: { item: Item }) {
  const save = useUpdateFundraise(item.slug);

  const raise = item.fundraise;
  const approved = raise.status === 'approved';

  /* Only fetched once there is a raise to fetch. The same query the public card
     uses, so the two share a cache entry rather than each polling separately. */
  const { data: supporters } = useContributions(item.slug, approved);
  /* Live figures beat the ones baked into the item payload, which may be a page
     load old — somebody may have given while this page was open. */
  const live = supporters?.meta ?? (approved ? raise : null);

  const [target, setTarget] = useState<number | ''>(
    raise.targetMinor ? raise.targetMinor / 100 : '',
  );
  const [pitch, setPitch] = useState(raise.pitch ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaved(false);

    try {
      await save.mutateAsync({ target: Number(target) || 0, pitch: pitch.trim() });
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'We could not save that');
    }
  };

  return (
    <Card className="p-5">
      <h2 className="border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em]">
        Raise money for this
      </h2>

      {!approved ? (
        <FundraiseApply
          slug={item.slug}
          itemName={item.name}
          fundraise={raise}
          className="mt-4"
        />
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-4">
          {/* The one place a success colour earns its keep: this is an outcome
              the maker has been waiting on, and it should not look like every
              other grey panel. The word carries it too — see CONTRACT rule 6. */}
          <p className="border-2 border-edge bg-success px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-ink">
            Approved — your raise is live
          </p>

          <Input
            label="Target"
            type="number"
            inputMode="numeric"
            min={1000}
            step={1000}
            value={target}
            onChange={(event) =>
              setTarget(event.target.value === '' ? '' : Number(event.target.value))
            }
            hint="In whole naira. Missing it costs you nothing — you keep whatever you raise."
          />

          <Textarea
            label="What is it for?"
            rows={3}
            maxLength={600}
            value={pitch}
            onChange={(event) => setPitch(event.target.value)}
            counter={`${pitch.length}/600`}
          />

          {error && (
            <p
              role="alert"
              className="border-2 border-edge bg-edge px-3 py-2 font-mono text-[11px] font-bold uppercase text-canvas"
            >
              {error}
            </p>
          )}

          {saved && !error && (
            <p className="border-2 border-edge bg-success px-3 py-2 font-mono text-[11px] font-bold uppercase text-ink">
              Saved
            </p>
          )}

          <Button type="submit" size="sm" className="w-full" loading={save.isPending}>
            Save
          </Button>

          {/*
           * The maker's own view of their raise.
           *
           * Owners get this panel *instead of* the public FundraiseCard, which
           * meant the one person with the most reason to watch a raise — the
           * person raising — was the only one who could not see it. They had a
           * single line of text where everybody else got a bar, the backers and
           * what each of them gave.
           *
           * Same components as the public card, fed by the same polling query,
           * so a contribution landing moves this too without a reload.
           */}
          {live && (
            <div className="space-y-5 border-t-2 border-edge pt-5">
              <RaiseBar raise={live} size="sm" />
              <BackerList backers={supporters?.data ?? []} limit={8} />
            </div>
          )}
        </form>
      )}
    </Card>
  );
}
