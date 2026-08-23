import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState, InlineAlert } from '@/components/ui/States';
import { Star } from '@/components/ui/Star';
import { VerifiedMark } from '@/components/ui/VerifiedMark';
import { useAuth } from '@/hooks/useAuth';
import { useCreateTopic, useTopics } from '@/hooks/useForum';
import { RequestError } from '@/lib/api';
import { cn, relativeTime } from '@/lib/utils';
import { SECTION_META, TOPIC_SECTIONS, type TopicSection, type TopicSummary } from '@/types';

/**
 * The forum index.
 *
 * Ordered by last activity rather than by creation, with pinned threads on top —
 * see the note in the controller. The section filter lives in the URL so a link
 * to "Hiring" is a link somebody can send.
 *
 * Deliberately a list, not a grid of cards. A forum index is scanned down the
 * left edge for a title that matches what you came for; a grid makes you read
 * in two dimensions to do the same job, and fits fewer threads on a screen.
 */
export function Forum() {
  const [params, setParams] = useSearchParams();
  const section = params.get('section') ?? '';
  const search = params.get('search') ?? '';

  const [draft, setDraft] = useState(search);
  const [composing, setComposing] = useState(false);
  const { isAuthenticated } = useAuth();

  const { data, isLoading, isError, error, refetch } = useTopics(section, search);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="border-b-2 border-edge pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="display-tight text-[clamp(2rem,5vw,3rem)] uppercase">Forum</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted text-pretty">
              Ask something, show what you are working on, or argue about Deck. Anyone can read;
              you need an account to post.
            </p>
          </div>

          {isAuthenticated ? (
            <Button onClick={() => setComposing(!composing)}>
              {composing ? 'Cancel' : 'New topic'}
            </Button>
          ) : (
            <ButtonLink to="/login">Sign in to post</ButtonLink>
          )}
        </div>
      </header>

      {composing && <Composer onDone={() => setComposing(false)} />}

      {/* Sections, then search. Both write to the URL. */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <SectionChip label="All" value="" current={section} onPick={(v) => setParam('section', v)} />
        {TOPIC_SECTIONS.map((value) => (
          <SectionChip
            key={value}
            label={SECTION_META[value].label}
            value={value}
            current={section}
            onPick={(v) => setParam('section', v)}
          />
        ))}
      </div>

      <form
        role="search"
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setParam('search', draft.trim());
        }}
      >
        <input
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="SEARCH TOPICS"
          aria-label="Search topics"
          className="h-10 min-w-0 flex-1 border-2 border-edge bg-surface px-3 font-mono text-[12px] font-bold uppercase tracking-[0.06em] placeholder:text-muted/70 focus:border-accent focus:outline-none"
        />
        <Button type="submit" variant="secondary" size="sm">
          Search
        </Button>
      </form>

      {isLoading ? (
        <div className="mt-8 space-y-3">
          {[0, 1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-20 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="mt-8">
          <ErrorState message={error.message} onRetry={() => void refetch()} />
        </div>
      ) : data?.data.length ? (
        <ul className="mt-8 space-y-3">
          {data.data.map((topic) => (
            <li key={topic.id}>
              <TopicRow topic={topic} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8">
          <EmptyState
            title={search ? `Nothing matching "${search}"` : 'No topics here yet'}
            description={
              section
                ? `Nobody has posted in ${SECTION_META[section as TopicSection].label} yet. Be first.`
                : 'Start the first conversation.'
            }
          />
        </div>
      )}
    </div>
  );
}

function SectionChip({
  label,
  value,
  current,
  onPick,
}: {
  label: string;
  value: string;
  current: string;
  onPick: (value: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(value)}
      aria-pressed={current === value}
      className={cn(
        'border-2 border-edge px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.06em] transition-colors duration-[120ms]',
        current === value
          ? 'bg-pop text-on-pop'
          : 'bg-surface text-muted hover:bg-surface-2 hover:text-body',
      )}
    >
      {label}
    </button>
  );
}

/**
 * One row in the index.
 *
 * The reply count is a block on the right rather than a line of text: it is the
 * one number anybody scans for, and at 11px in a row of grey metadata it
 * disappears. "Last reply by" beats "posted by" here — it says whether the
 * thread is alive.
 */
function TopicRow({ topic }: { topic: TopicSummary }) {
  const last = topic.lastReplyBy ?? topic.author;

  return (
    <Link
      to={`/forum/${topic.slug}`}
      className="group flex items-start gap-4 rounded-slab border-2 border-edge bg-surface p-4 transition-transform duration-[120ms] ease-[var(--ease-snap)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {topic.pinned && (
            <span className="inline-flex items-center gap-1 border-2 border-edge bg-pop px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-on-pop">
              <Star name="glint" className="size-2" /> Pinned
            </span>
          )}
          {topic.locked && (
            <span className="border-2 border-edge bg-edge px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-canvas">
              Locked
            </span>
          )}
          <span className="border-2 border-edge bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
            {SECTION_META[topic.section].label}
          </span>
        </div>

        <h2 className="mt-2 font-display text-base uppercase leading-tight underline-offset-4 group-hover:underline sm:text-lg">
          {topic.title}
        </h2>

        <p className="mt-1.5 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.06em] text-muted">
          {last && <Avatar user={last} size="sm" />}
          <span>{last?.name ?? 'Someone'}</span>
          {last?.verified && <VerifiedMark name={last.name} />}
          <span aria-hidden="true">/</span>
          <span>
            {topic.replyCount > 0 ? 'replied' : 'posted'} {relativeTime(topic.lastReplyAt)}
          </span>
        </p>
      </div>

      <span className="flex shrink-0 flex-col items-center border-2 border-edge bg-surface-2 px-3 py-1.5">
        <span className="font-display text-lg tabular-nums leading-none">{topic.replyCount}</span>
        <span className="mt-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.06em] text-muted">
          {topic.replyCount === 1 ? 'reply' : 'replies'}
        </span>
      </span>
    </Link>
  );
}

/** The new-topic form, inline rather than on its own route. */
function Composer({ onDone }: { onDone: () => void }) {
  const create = useCreateTopic();
  const [form, setForm] = useState({ title: '', body: '', section: 'ask' as TopicSection });

  const error = create.error instanceof RequestError ? create.error : null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    create.mutate(
      { title: form.title.trim(), body: form.body.trim(), section: form.section },
      { onSuccess: onDone },
    );
  };

  return (
    <Card className="mt-6 p-5 sm:p-6">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <h2 className="border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
          Start a topic
        </h2>

        {error && !error.fields.length && <InlineAlert>{error.message}</InlineAlert>}

        <Input
          label="Title"
          required
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          error={error?.fieldError('title')}
          maxLength={140}
          placeholder="How do you price a Claude skill?"
          hint="A title somebody could answer without opening the post."
        />

        <Select
          label="Section"
          value={form.section}
          onChange={(event) => setForm({ ...form, section: event.target.value as TopicSection })}
          error={error?.fieldError('section')}
          options={TOPIC_SECTIONS.map((value) => ({
            value,
            label: `${SECTION_META[value].label} — ${SECTION_META[value].blurb}`,
          }))}
        />

        <Textarea
          label="Post"
          required
          rows={6}
          value={form.body}
          onChange={(event) => setForm({ ...form, body: event.target.value })}
          error={error?.fieldError('body')}
          maxLength={8000}
          counter={`${form.body.length}/8000`}
        />

        <div className="flex flex-wrap gap-3">
          <Button type="submit" loading={create.isPending}>
            Post topic
          </Button>
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
