import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Field';
import { InlineAlert } from '@/components/ui/States';
import { useCreateListingRequest, type ListingRequestDraft } from '@/hooks/useImports';
import { prettyUrl } from '@/lib/utils';
import type { Item } from '@/types';

/**
 * What a listing Deck made says about itself, in place of a maker's sidebar.
 *
 * Three jobs, in order of who needs them. A reader needs to know nobody from
 * the team posted this — so the votes and comments under it are not a launch
 * day, and the absence of a maker's replies is not rudeness. Anyone checking a
 * fact needs the sources, so they are listed rather than kept in the admin
 * area. And the founder, or anybody with standing, needs a way to take it
 * over or take it down — which is a request a person reads, never a button
 * that acts, so a competitor cannot claim or delete a rival's page.
 */
export function UnclaimedListing({ item }: { item: Item }) {
  const [open, setOpen] = useState<ListingRequestDraft['kind'] | null>(null);

  return (
    <Card className="p-5">
      <h2 className="border-b border-line pb-2 font-mono text-[11px] font-medium uppercase tracking-[0.1em]">
        Listed by Deck
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted text-pretty">
        Deck listed {item.name} so people can find it. Nobody from the team posted it here, so it
        does not compete on the daily board.
      </p>

      {item.sourceUrls.length > 0 && (
        <div className="mt-4">
          <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
            Where this comes from
          </h3>
          <ul className="mt-1.5 space-y-1">
            {item.sourceUrls.map((url) => (
              <li key={url} className="truncate text-sm">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="underline underline-offset-2 hover:text-accent"
                >
                  {prettyUrl(url)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 border-t border-line pt-4">
        {open ? (
          <RequestForm item={item} kind={open} onCancel={() => setOpen(null)} />
        ) : (
          <>
            <p className="font-display text-sm">Is this yours?</p>
            <div className="mt-3 flex flex-col gap-2">
              <Button size="sm" onClick={() => setOpen('claim')}>
                Claim this listing
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setOpen('removal')}>
                Ask us to remove it
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

function RequestForm({
  item,
  kind,
  onCancel,
}: {
  item: Item;
  kind: ListingRequestDraft['kind'];
  onCancel: () => void;
}) {
  const send = useCreateListingRequest(item.slug);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await send.mutateAsync({
        kind,
        name: name.trim(),
        email: email.trim(),
        relationship: relationship.trim() || undefined,
        message: message.trim() || undefined,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That did not send');
    }
  };

  if (send.isSuccess) {
    return (
      <p role="status" className="text-sm leading-relaxed text-body text-pretty">
        {send.data.alreadyOpen
          ? 'We already have this request from you, and someone will reply by email.'
          : kind === 'claim'
            ? 'Thanks. Someone at Deck will check it is you and reply by email — a work address on the product’s own domain is the quickest proof.'
            : 'Thanks. Someone at Deck will read this and reply by email.'}
      </p>
    );
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-3">
      <p className="font-display text-sm">
        {kind === 'claim' ? 'Claim this listing' : 'Remove this listing'}
      </p>
      <Input
        label="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        maxLength={60}
      />
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        hint={
          kind === 'claim'
            ? 'An address on the product’s domain makes this quick.'
            : 'Only used to reply to you.'
        }
      />
      {kind === 'claim' && (
        <Input
          label="Your role"
          placeholder="Co-founder, CTO…"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          maxLength={80}
        />
      )}
      <Textarea
        label={
          kind === 'claim' ? 'Anything that helps us check (optional)' : 'Why should it come down?'
        }
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={1000}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          size="sm"
          loading={send.isPending}
          disabled={!name.trim() || !email.trim()}
        >
          Send request
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      {error && <InlineAlert>{error}</InlineAlert>}
    </form>
  );
}
