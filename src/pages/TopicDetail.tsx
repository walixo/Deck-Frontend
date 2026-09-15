import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Field';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState, InlineAlert } from '@/components/ui/States';
import { Star } from '@/components/ui/Star';
import { VerifiedMark } from '@/components/ui/VerifiedMark';
import { useAuth } from '@/hooks/useAuth';
import {
  useCreateReply,
  useDeleteReply,
  useDeleteTopic,
  useModerateTopic,
  useTopic,
} from '@/hooks/useForum';
import { RequestError } from '@/lib/api';
import { formatFullDate, relativeTime, profilePath } from '@/lib/utils';
import { SECTION_META, type PublicUser, type Reply } from '@/types';

/**
 * One thread: the post, then every reply in order.
 *
 * Flat, oldest first. A forum thread is a conversation and reads in sequence —
 * see the note on the Reply model for why this is not nested like launch
 * comments are.
 */
export function TopicDetail() {
  const { slug = '' } = useParams();
  const { data: topic, isLoading, isError, error, refetch } = useTopic(slug);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const deleteTopic = useDeleteTopic();
  const moderate = useModerateTopic(slug);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorState message={error.message} onRetry={() => void refetch()} />
        <div className="mt-6 text-center">
          <Link
            to="/forum"
            className="font-mono text-[12px] font-bold uppercase underline-offset-4 hover:underline"
          >
            ← Back to the forum
          </Link>
        </div>
      </div>
    );
  }

  if (!topic) return null;

  const isAuthor = user?.id === topic.author?.id;
  const isStaff = user?.role === 'admin';

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-2 font-mono text-[11px] font-bold uppercase text-muted"
      >
        <Link to="/forum" className="hover:text-body">
          Forum
        </Link>
        <span aria-hidden="true">/</span>
        <Link to={`/forum?section=${topic.section}`} className="hover:text-body">
          {SECTION_META[topic.section].label}
        </Link>
      </nav>

      <header>
        <div className="flex flex-wrap items-center gap-2">
          {topic.pinned && (
            <span className="inline-flex items-center gap-1 border border-edge bg-pop px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-on-pop">
              <Star name="glint" className="size-2" /> Pinned
            </span>
          )}
          {topic.locked && (
            <span className="border border-edge bg-edge px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-canvas">
              Locked
            </span>
          )}
        </div>

        <h1 className="display-tight mt-3 text-3xl uppercase text-balance sm:text-4xl">
          {topic.title}
        </h1>
      </header>

      {/* The opening post, set apart from the replies by weight rather than by
          a label: it is the only thing on the page with a hard shadow. */}
      <Card className="mt-6 p-5 shadow-hard sm:p-6">
        <Byline user={topic.author} at={topic.createdAt} />
        <Prose body={topic.body} className="mt-4" />

        {(isAuthor || isStaff) && (
          <div className="mt-5 flex flex-wrap gap-2 border-t border-edge pt-4">
            <Button
              variant="danger"
              size="sm"
              loading={deleteTopic.isPending}
              onClick={() => {
                const confirmed = window.confirm(
                  `Delete "${topic.title}"? Every reply goes with it, and it cannot be undone.`,
                );
                if (confirmed) {
                  deleteTopic.mutate(topic.slug, { onSuccess: () => navigate('/forum') });
                }
              }}
            >
              Delete topic
            </Button>

            {isStaff && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={moderate.isPending}
                  onClick={() =>
                    moderate.mutate({
                      pinned: !topic.pinned,
                      note: topic.pinned ? 'Unpinned' : 'Pinned to the section',
                    })
                  }
                >
                  {topic.pinned ? 'Unpin' : 'Pin'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={moderate.isPending}
                  onClick={() =>
                    moderate.mutate({
                      locked: !topic.locked,
                      note: topic.locked ? 'Reopened' : 'Locked to new replies',
                    })
                  }
                >
                  {topic.locked ? 'Unlock' : 'Lock'}
                </Button>
              </>
            )}
          </div>
        )}
      </Card>

      <section aria-labelledby="replies-heading" className="mt-10">
        <h2
          id="replies-heading"
          className="border-b border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]"
        >
          {topic.replies.length} {topic.replies.length === 1 ? 'reply' : 'replies'}
        </h2>

        {topic.replies.length > 0 && (
          <ul className="mt-5 space-y-4">
            {topic.replies.map((reply) => (
              <li key={reply.id}>
                <ReplyRow reply={reply} slug={topic.slug} />
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8">
          {topic.locked ? (
            <p className="border border-edge bg-surface-2 px-4 py-3 text-sm text-muted">
              This topic is locked. Nobody can add to it.
            </p>
          ) : isAuthenticated ? (
            <ReplyForm slug={topic.slug} />
          ) : (
            <p className="border border-edge bg-surface-2 px-4 py-3 text-sm text-muted">
              <Link to="/login" className="font-bold underline underline-offset-2">
                Sign in
              </Link>{' '}
              to reply.
            </p>
          )}
        </div>
      </section>

      <div className="mt-12 border-t border-edge pt-6">
        <ButtonLink to="/forum" variant="secondary" size="sm">
          ← All topics
        </ButtonLink>
      </div>
    </div>
  );
}

function Byline({ user, at }: { user: PublicUser | null; at: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
      {user ? <Avatar user={user} size="sm" /> : null}
      {user ? (
        <Link to={profilePath(user.username)} className="font-bold text-body hover:underline">
          {user.name}
        </Link>
      ) : (
        <span className="font-bold text-body">Deleted account</span>
      )}
      {user?.verified && <VerifiedMark name={user.name} />}
      <span aria-hidden="true">/</span>
      <time dateTime={at} title={formatFullDate(at)}>
        {relativeTime(at)}
      </time>
    </div>
  );
}

/**
 * Body text, one paragraph per blank-line-separated block.
 *
 * Plain text on purpose. Rendering user-supplied Markdown means either shipping
 * a parser and a sanitiser or shipping an XSS hole, and a forum works fine
 * without bold. Line breaks are the one thing people genuinely need and they
 * come free from splitting on newlines.
 */
function Prose({ body, className }: { body: string; className?: string }) {
  return (
    <div className={className}>
      {body
        .split('\n')
        .filter(Boolean)
        .map((paragraph, index) => (
          <p key={index} className="mt-3 text-sm leading-relaxed text-body text-pretty first:mt-0">
            {paragraph}
          </p>
        ))}
    </div>
  );
}

function ReplyRow({ reply, slug }: { reply: Reply; slug: string }) {
  const { user } = useAuth();
  const remove = useDeleteReply(slug);
  const mine = user?.id === reply.author?.id;

  return (
    <article className="rounded-slab border border-edge bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <Byline user={reply.author} at={reply.createdAt} />

        {(mine || user?.role === 'admin') && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Delete this reply?')) remove.mutate(reply.id);
            }}
            className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-muted underline-offset-2 hover:text-body hover:underline"
          >
            Delete
          </button>
        )}
      </div>

      <Prose body={reply.body} className="mt-3" />
    </article>
  );
}

function ReplyForm({ slug }: { slug: string }) {
  const reply = useCreateReply(slug);
  const [body, setBody] = useState('');

  const error = reply.error instanceof RequestError ? reply.error : null;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        reply.mutate(body.trim(), { onSuccess: () => setBody('') });
      }}
      className="space-y-3"
      noValidate
    >
      {error && !error.fields.length && <InlineAlert>{error.message}</InlineAlert>}

      <Textarea
        label="Reply"
        rows={4}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        error={error?.fieldError('body')}
        maxLength={8000}
        counter={`${body.length}/8000`}
      />

      <Button type="submit" loading={reply.isPending} disabled={body.trim().length < 2}>
        Post reply
      </Button>
    </form>
  );
}
