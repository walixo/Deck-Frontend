import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { useSetFutureGen } from '@/hooks/useAdmin';
import type { Item } from '@/types';

/**
 * Staff control for Future Gen membership, on the launch's own page.
 *
 * Here rather than in a queue in the admin area, because there is nothing to
 * queue: nobody applies to Future Gen, staff notice a launch and decide. The
 * moment that decision gets made is while looking at the launch, and a control
 * that lives at the moment of the decision needs no navigation and no second
 * tab to check what is being decided on.
 *
 * The note is required, and the server enforces that too — the audit entry for
 * "we put a teenager's fundraise on the front of a showcase" should say why.
 */
export function FutureGenToggle({ item }: { item: Item }) {
  const setFutureGen = useSetFutureGen();
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const on = item.futureGen;

  const submit = async () => {
    setError(null);
    if (note.trim().length < 4) {
      setError('Say why — it goes in the audit trail.');
      return;
    }

    try {
      await setFutureGen.mutateAsync({ id: item.id, futureGen: !on, note: note.trim() });
      setNote('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That did not go through');
    }
  };

  return (
    <div className="space-y-3 border-t-2 border-edge pt-4">
      <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em]">
        Future Gen
        <span
          className={`border-2 border-edge px-1.5 py-0.5 text-[10px] ${
            on ? 'bg-deep text-on-deep' : 'bg-surface-2 text-muted'
          }`}
        >
          {on ? 'On the timeline' : 'Not listed'}
        </span>
      </p>

      <Input
        label="Why"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={200}
        placeholder={on ? 'No longer a fit' : 'Hardware prototype, Lagos, 17'}
      />

      {error && (
        <p role="alert" className="font-mono text-[11px] font-bold uppercase text-red">
          {error}
        </p>
      )}

      <Button
        size="sm"
        variant={on ? 'secondary' : 'primary'}
        className="w-full"
        loading={setFutureGen.isPending}
        onClick={() => void submit()}
      >
        {on ? 'Remove from Future Gen' : 'Add to Future Gen'}
      </Button>
    </div>
  );
}
