import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, InlineAlert } from '@/components/ui/States';
import { useCategories } from '@/hooks/useCategories';
import {
  useCreateCandidate,
  useFounderSearch,
  useImportQueue,
  useListingRequests,
  usePublishCandidate,
  useRejectCandidate,
  useResolveListingRequest,
  useUpdateCandidate,
  type CandidateDraft,
  type CandidateFounder,
  type ImportCandidate,
  type ImportStatus,
  type ListingRequest,
} from '@/hooks/useImports';
import { AFRICAN_COUNTRIES, countryName } from '@/lib/africa';
import { cn, PRICING_LABELS, prettyUrl } from '@/lib/utils';
import type { PricingModel } from '@/types';

/**
 * Imported listings, from first sighting to published page — and the requests
 * that come back about them.
 *
 * Nothing reaches the site without passing through here. Rows arrive from this
 * form or from the CSV loader (`npm run import-candidates`), wait as pending,
 * and go live only when somebody presses Publish. That is the step where a
 * parked domain, a misattributed founder or a description lifted from a press
 * article gets caught, which is cheap here and embarrassing in public.
 *
 * The rules that keep this honest live on the server: a duplicate domain is
 * refused, every listing needs a source, and a published listing never
 * competes on the board. This page only makes the queue workable.
 */

type Tab = ImportStatus | 'requests';

const TABS: { key: Tab; label: string }[] = [
  { key: 'pending', label: 'To review' },
  { key: 'published', label: 'Published' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'requests', label: 'Claims & removals' },
];

export function AdminImports() {
  const [tab, setTab] = useState<Tab>('pending');
  const [adding, setAdding] = useState(false);
  const counts = useImportQueue('pending').data?.meta?.counts;

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl">Imports</h1>
          <p className="mt-1 text-sm leading-relaxed text-muted text-pretty">
            African products Deck lists on their founders’ behalf. Each one is checked here before
            it goes live, never competes on the board, and can be claimed or taken down by the
            people behind it.
          </p>
        </div>
        {!adding && <Button onClick={() => setAdding(true)}>Add a product</Button>}
      </header>

      {adding && (
        <section className="mb-8 rounded-slab border border-line bg-surface p-5 shadow-hard">
          <h2 className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.12em]">
            New candidate
          </h2>
          <CandidateForm onDone={() => setAdding(false)} />
        </section>
      )}

      <nav aria-label="Import views" className="mb-5 flex flex-wrap gap-2">
        {TABS.map((entry) => (
          <button
            key={entry.key}
            type="button"
            onClick={() => setTab(entry.key)}
            aria-pressed={tab === entry.key}
            className={cn(
              'rounded-full border border-line px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.06em]',
              tab === entry.key ? 'bg-pop text-on-pop' : 'bg-surface text-muted hover:text-body',
            )}
          >
            {entry.label}
            {entry.key !== 'requests' && counts?.[entry.key] ? ` · ${counts[entry.key]}` : ''}
          </button>
        ))}
      </nav>

      {tab === 'requests' ? <RequestList /> : <QueueList status={tab} />}
    </div>
  );
}

/* ---------------------------------------------------------------- queue -- */

function QueueList({ status }: { status: ImportStatus }) {
  const { data, isLoading } = useImportQueue(status);
  const rows = data?.data ?? [];

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  if (!rows.length) {
    return (
      <EmptyState
        title={status === 'pending' ? 'Nothing to review' : `Nothing ${status}`}
        description={
          status === 'pending'
            ? 'Add a product above, or load a spreadsheet with npm run import-candidates.'
            : 'Candidates move here once they have been reviewed.'
        }
      />
    );
  }

  return (
    <ul className="space-y-4">
      {rows.map((candidate) => (
        <li key={candidate._id}>
          <CandidateCard candidate={candidate} />
        </li>
      ))}
    </ul>
  );
}

function CandidateCard({ candidate }: { candidate: ImportCandidate }) {
  const { data: categories } = useCategories();
  const categoryLabel =
    categories?.find((entry) => entry.slug === candidate.category)?.label ?? candidate.category;
  const publish = usePublishCandidate();
  const reject = useRejectCandidate();
  const [mode, setMode] = useState<'view' | 'edit' | 'reject'>('view');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That did not go through');
    }
  };

  if (mode === 'edit') {
    return (
      <article className="rounded-slab border border-line bg-surface p-5 shadow-hard">
        <CandidateForm candidate={candidate} onDone={() => setMode('view')} />
      </article>
    );
  }

  return (
    <article className="rounded-slab border border-line bg-surface shadow-hard">
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* The logo, or a dashed gap where one is missing — so the queue
              shows at a glance which listings still need one before they go
              out with a monogram. */}
          {candidate.logoUrl ? (
            <img
              src={candidate.logoUrl}
              alt=""
              className="size-9 shrink-0 rounded-slab border border-line object-contain"
            />
          ) : (
            <span
              title="No logo yet"
              className="flex size-9 shrink-0 items-center justify-center rounded-slab border border-dashed border-line font-mono text-[9px] uppercase text-muted"
            >
              logo
            </span>
          )}
          <h3 className="font-display text-base">{candidate.name}</h3>
          <Chip>{categoryLabel}</Chip>
          {candidate.country && <Chip>{countryName(candidate.country)}</Chip>}
          <Chip>{candidate.origin}</Chip>
        </div>
        <p className="mt-1 text-sm text-body">{candidate.tagline}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted text-pretty">
          {candidate.description}
        </p>

        <dl className="mt-3 grid gap-x-6 gap-y-1 font-mono text-[11px] uppercase sm:grid-cols-2">
          <Fact term="Website">
            <a
              href={candidate.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="normal-case underline underline-offset-2"
            >
              {candidate.domain}
            </a>
          </Fact>
          {candidate.launchedAt && <Fact term="Launched">{candidate.launchedAt.slice(0, 10)}</Fact>}
          <Fact term="Pricing">{PRICING_LABELS[candidate.pricing]}</Fact>
          {candidate.founders.length > 0 && (
            <Fact term="Founders">
              <span className="normal-case">
                {candidate.founders
                  .map((founder) =>
                    founder.headline ? `${founder.name} (${founder.headline})` : founder.name,
                  )
                  .join(', ')}
              </span>
            </Fact>
          )}
        </dl>

        <div className="mt-3">
          <p className="font-mono text-[11px] uppercase text-muted">Sources</p>
          <ul className="mt-1 space-y-0.5">
            {candidate.sourceUrls.map((url) => (
              <li key={url} className="truncate text-sm">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                >
                  {prettyUrl(url)}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {candidate.notes && (
          <p className="mt-3 rounded-slab bg-surface-2 px-3 py-2 text-xs text-muted">
            Note: {candidate.notes}
          </p>
        )}
        {candidate.status === 'rejected' && candidate.rejectionReason && (
          <p className="mt-3 text-xs text-muted">Rejected: {candidate.rejectionReason}</p>
        )}
        {candidate.status === 'published' && candidate.item && (
          <Link
            to={`/item/${candidate.item.slug}`}
            className="mt-3 inline-block font-mono text-[11px] uppercase underline underline-offset-2"
          >
            View the listing →
          </Link>
        )}
      </div>

      {candidate.status === 'pending' && (
        <div className="border-t border-line p-4">
          {mode === 'reject' ? (
            <div className="space-y-3">
              <Textarea
                label="Why not?"
                rows={2}
                maxLength={400}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                hint="Kept with the row, for whoever looks at this product next."
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={reason.trim().length < 4}
                  loading={reject.isPending}
                  onClick={() =>
                    void run(() => reject.mutateAsync({ id: candidate._id, reason: reason.trim() }))
                  }
                >
                  Reject
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setMode('view')}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                loading={publish.isPending}
                onClick={() => void run(() => publish.mutateAsync(candidate._id))}
              >
                Publish listing
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setMode('edit')}>
                Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setMode('reject')}>
                Reject
              </Button>
            </div>
          )}
          {error && (
            <div className="mt-3">
              <InlineAlert>{error}</InlineAlert>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-line bg-surface-2 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
      {children}
    </span>
  );
}

function Fact({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="text-muted">{term}</dt>
      <dd className="min-w-0 truncate text-body">{children}</dd>
    </div>
  );
}

/* ----------------------------------------------------------------- form -- */

const PRICING: PricingModel[] = ['free', 'freemium', 'paid', 'open-source'];

/* African countries first, by name — the pilot's catalogue — then a way out
   for the occasional product built elsewhere by an African team. */
const COUNTRY_OPTIONS = [
  { value: '', label: 'Choose a country' },
  ...[...AFRICAN_COUNTRIES]
    .map((code) => ({ value: code, label: countryName(code) }))
    .sort((a, b) => a.label.localeCompare(b.label)),
];

const lines = (text: string) =>
  text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

/** One founder row: a name, a role, and links one per line. */
interface FounderRow {
  name: string;
  headline: string;
  links: string;
  founderId?: string;
}

const labelFor = (url: string) => {
  const host = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  })();
  if (host === 'x.com' || host === 'twitter.com') return 'X';
  if (host.endsWith('linkedin.com')) return 'LinkedIn';
  if (host === 'github.com') return 'GitHub';
  return 'Website';
};

/**
 * Add or correct a candidate. Founders are entered as rows; typing a name
 * offers any founder Deck already lists, so the same person attached to a
 * second product links to one record rather than becoming two.
 */
function CandidateForm({ candidate, onDone }: { candidate?: ImportCandidate; onDone: () => void }) {
  const create = useCreateCandidate();
  const update = useUpdateCandidate();
  const { data: categories } = useCategories();

  const [name, setName] = useState(candidate?.name ?? '');
  const [websiteUrl, setWebsiteUrl] = useState(candidate?.websiteUrl ?? '');
  const [tagline, setTagline] = useState(candidate?.tagline ?? '');
  const [description, setDescription] = useState(candidate?.description ?? '');
  const [category, setCategory] = useState(candidate?.category ?? '');
  const [country, setCountry] = useState(candidate?.country ?? '');
  const [tags, setTags] = useState(candidate?.tags.join(', ') ?? '');
  const [pricing, setPricing] = useState<PricingModel>(candidate?.pricing ?? 'free');
  const [logoUrl, setLogoUrl] = useState(candidate?.logoUrl ?? '');
  const [launchedAt, setLaunchedAt] = useState(candidate?.launchedAt?.slice(0, 10) ?? '');
  const [sources, setSources] = useState(candidate?.sourceUrls.join('\n') ?? '');
  const [notes, setNotes] = useState(candidate?.notes ?? '');
  const [founders, setFounders] = useState<FounderRow[]>(
    candidate?.founders.map((founder) => ({
      name: founder.name,
      headline: founder.headline ?? '',
      links: founder.links.map((link) => link.url).join('\n'),
      founderId: founder.founderId,
    })) ?? [{ name: '', headline: '', links: '' }],
  );
  const [error, setError] = useState<string | null>(null);

  const setFounder = (index: number, patch: Partial<FounderRow>) =>
    setFounders((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const draft: CandidateDraft = {
      name: name.trim(),
      websiteUrl: websiteUrl.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      category,
      country: country || undefined,
      tags: tags
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
      pricing,
      logoUrl: logoUrl.trim() || undefined,
      launchedAt: launchedAt || undefined,
      sourceUrls: lines(sources),
      notes: notes.trim() || undefined,
      founders: founders
        .filter((row) => row.name.trim())
        .map((row): CandidateFounder => ({
          name: row.name.trim(),
          headline: row.headline.trim() || undefined,
          founderId: row.founderId,
          links: lines(row.links).map((url) => ({ label: labelFor(url), url })),
        })),
    };

    try {
      if (candidate) await update.mutateAsync({ id: candidate._id, draft });
      else await create.mutateAsync(draft);
      onDone();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That did not save');
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Product name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={70}
        />
        <Input
          label="Website"
          type="url"
          placeholder="https://"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          required
        />
      </div>
      <Input
        label="Tagline"
        value={tagline}
        onChange={(e) => setTagline(e.target.value)}
        required
        maxLength={120}
        hint="Write it yourself, or quote the product’s own one-liner — never a journalist’s."
      />
      <Textarea
        label="Description"
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        maxLength={4000}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Select
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          options={[
            { value: '', label: 'Choose one' },
            ...(categories ?? [])
              .filter((entry) => entry.active)
              .map((entry) => ({ value: entry.slug, label: entry.label })),
          ]}
        />
        <Select
          label="Country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          options={COUNTRY_OPTIONS}
        />
        <Select
          label="Pricing"
          value={pricing}
          onChange={(e) => setPricing(e.target.value as PricingModel)}
          options={PRICING.map((value) => ({ value, label: PRICING_LABELS[value] }))}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Tags"
          placeholder="payments, fintech"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <Input
          label="Launched"
          type="date"
          value={launchedAt}
          onChange={(e) => setLaunchedAt(e.target.value)}
        />
      </div>
      {/* Uploaded into Deck's own storage, the same as a maker's logo. Most
          imports get theirs from `npm run fetch-logos`; this is for the ones
          whose sites only publish a tiny or unusable icon. */}
      <ImageUpload
        label="Logo"
        aspect="square"
        value={logoUrl ? [logoUrl] : []}
        onChange={(urls) => setLogoUrl(urls[0] ?? '')}
        hint="Square, at least 256px. Use the company’s own logo — from its press kit if it has one."
      />

      <fieldset className="space-y-3">
        <legend className="font-mono text-[11px] font-medium uppercase tracking-[0.12em]">
          Founders
        </legend>
        {founders.map((row, index) => (
          <FounderFields
            key={index}
            row={row}
            onChange={(patch) => setFounder(index, patch)}
            onRemove={() => setFounders((rows) => rows.filter((_, i) => i !== index))}
          />
        ))}
        {founders.length < 8 && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setFounders((rows) => [...rows, { name: '', headline: '', links: '' }])}
          >
            + Another founder
          </Button>
        )}
      </fieldset>

      <Textarea
        label="Sources"
        rows={2}
        value={sources}
        onChange={(e) => setSources(e.target.value)}
        required
        hint="One URL per line: the product’s own about page first, then press. Shown publicly on the listing."
      />
      <Textarea
        label="Notes for the reviewer"
        rows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        maxLength={1000}
        hint="Never shown publicly."
      />

      {error && <InlineAlert>{error}</InlineAlert>}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={create.isPending || update.isPending}>
          {candidate ? 'Save changes' : 'Add to the queue'}
        </Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function FounderFields({
  row,
  onChange,
  onRemove,
}: {
  row: FounderRow;
  onChange: (patch: Partial<FounderRow>) => void;
  onRemove: () => void;
}) {
  /* Only searches while the row is not already linked to a record. */
  const { data: matches } = useFounderSearch(row.founderId ? '' : row.name);

  return (
    <div className="rounded-slab border border-line p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Name"
          value={row.name}
          onChange={(e) => onChange({ name: e.target.value, founderId: undefined })}
          maxLength={60}
        />
        <Input
          label="Role"
          placeholder="Co-founder & CEO"
          value={row.headline}
          onChange={(e) => onChange({ headline: e.target.value })}
          maxLength={100}
        />
      </div>
      {row.founderId ? (
        <p className="mt-2 font-mono text-[11px] uppercase text-muted">
          Linked to an existing founder record ·{' '}
          <button
            type="button"
            className="underline"
            onClick={() => onChange({ founderId: undefined })}
          >
            unlink
          </button>
        </p>
      ) : (
        matches &&
        matches.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="font-mono text-[11px] uppercase text-muted">Already listed:</span>
            {matches.map((match) => (
              <button
                key={match.id}
                type="button"
                onClick={() =>
                  onChange({
                    name: match.name,
                    headline: match.headline ?? row.headline,
                    founderId: match.id,
                  })
                }
                className="rounded-full border border-line px-2 py-0.5 font-mono text-[11px] uppercase hover:bg-surface-2"
              >
                {match.name}
                {match.headline ? ` · ${match.headline}` : ''}
              </button>
            ))}
          </div>
        )
      )}
      <Textarea
        label="Public links"
        rows={2}
        value={row.links}
        onChange={(e) => onChange({ links: e.target.value })}
        className="mt-3"
        hint="One per line. Only links they publish professionally — never a personal email or phone number."
      />
      <button
        type="button"
        onClick={onRemove}
        className="mt-2 font-mono text-[11px] uppercase text-muted underline"
      >
        Remove founder
      </button>
    </div>
  );
}

/* ------------------------------------------------------------- requests -- */

function RequestList() {
  const [status, setStatus] = useState<ListingRequest['status']>('open');
  const { data: requests, isLoading } = useListingRequests(status);

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(['open', 'resolved', 'dismissed'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatus(value)}
            aria-pressed={status === value}
            className={cn(
              'font-mono text-[11px] uppercase underline-offset-4',
              status === value ? 'text-body underline' : 'text-muted hover:text-body',
            )}
          >
            {value}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-28 w-full" />
      ) : !requests?.length ? (
        <EmptyState
          title={status === 'open' ? 'No open requests' : `Nothing ${status}`}
          description="“This is mine” and “take this down” requests from listing pages arrive here."
        />
      ) : (
        <ul className="space-y-3">
          {requests.map((request) => (
            <li key={request._id}>
              <RequestCard request={request} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * One request. Resolving records what was done; the doing — moving a listing
 * to a founder's account, or deleting it — is done first with the ordinary
 * tools, until automatic claiming exists.
 */
function RequestCard({ request }: { request: ListingRequest }) {
  const resolve = useResolveListingRequest();
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const close = async (outcome: 'resolved' | 'dismissed') => {
    setError(null);
    try {
      await resolve.mutateAsync({ id: request._id, outcome, note: note.trim() || undefined });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That did not go through');
    }
  };

  return (
    <article className="rounded-slab border border-line bg-surface p-4 shadow-hard">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'rounded-full border border-line px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em]',
            request.kind === 'claim' ? 'bg-pop text-on-pop' : 'bg-edge text-canvas',
          )}
        >
          {request.kind === 'claim' ? 'Claim' : 'Removal'}
        </span>
        {request.item ? (
          <Link
            to={`/item/${request.item.slug}`}
            className="font-display text-base hover:text-accent"
          >
            {request.item.name}
          </Link>
        ) : (
          <span className="font-display text-base text-muted">Listing removed</span>
        )}
        <span className="font-mono text-[11px] uppercase text-muted">
          {new Date(request.createdAt).toLocaleDateString('en-GB')}
        </span>
      </div>
      <p className="mt-2 text-sm text-body">
        {request.name}
        {request.relationship ? ` · ${request.relationship}` : ''} ·{' '}
        <a href={`mailto:${request.email}`} className="underline underline-offset-2">
          {request.email}
        </a>
        {request.account && (
          <span className="text-muted"> · signed in as @{request.account.username}</span>
        )}
      </p>
      {request.message && (
        <p className="mt-2 text-sm leading-relaxed text-muted text-pretty">{request.message}</p>
      )}
      {request.resolutionNote && (
        <p className="mt-2 text-xs text-muted">Outcome: {request.resolutionNote}</p>
      )}

      {request.status === 'open' && (
        <div className="mt-4 space-y-3 border-t border-line pt-4">
          <Input
            label="What was done"
            placeholder="Moved to @username after a domain email check"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={400}
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" loading={resolve.isPending} onClick={() => void close('resolved')}>
              Mark resolved
            </Button>
            <Button size="sm" variant="secondary" onClick={() => void close('dismissed')}>
              Dismiss
            </Button>
          </div>
          {error && <InlineAlert>{error}</InlineAlert>}
        </div>
      )}
    </article>
  );
}
