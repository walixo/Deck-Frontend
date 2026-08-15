import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Field';
import { useUpdateFundraise } from '@/hooks/useFundraise';
import { formatMoney } from '@/lib/utils';
import type { Item } from '@/types';

/**
 * The launcher's own controls for their raise.
 *
 * Opt-in, never opt-out: a launch that says nothing raises nothing. Turning it
 * off later stops new money without erasing what came in, because what was
 * given was given.
 */
export function FundraiseSettings({ item }: { item: Item }) {
  const save = useUpdateFundraise(item.slug);

  const raise = item.fundraise;
  const [enabled, setEnabled] = useState(raise.enabled);
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
      await save.mutateAsync({
        enabled,
        target: Number(target) || 0,
        pitch: pitch.trim(),
      });
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

      <form onSubmit={submit} className="mt-4 space-y-4">
        <label className="flex items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            className="mt-0.5 size-4 shrink-0 border-2 border-edge accent-lavender"
          />
          <span>
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em]">
              Accept contributions
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-muted">
              Shows a progress bar on your launch and lets people back it from{' '}
              {formatMoney(100_000)} up.
            </span>
          </span>
        </label>

        {enabled && (
          <>
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
          </>
        )}

        {raise.raisedMinor > 0 && (
          <p className="border-2 border-edge bg-surface-2 px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.06em]">
            Raised so far: {formatMoney(raise.raisedMinor)} from {raise.contributorCount}{' '}
            {raise.contributorCount === 1 ? 'backer' : 'backers'}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="border-2 border-edge bg-edge px-3 py-2 font-mono text-[11px] font-bold uppercase text-canvas"
          >
            {error}
          </p>
        )}

        {saved && !error && (
          <p className="border-2 border-edge bg-acid px-3 py-2 font-mono text-[11px] font-bold uppercase text-ink">
            Saved
          </p>
        )}

        <Button type="submit" size="sm" className="w-full" loading={save.isPending}>
          Save
        </Button>
      </form>
    </Card>
  );
}
