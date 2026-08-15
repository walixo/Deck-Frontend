import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyCommentsIllustration } from '@/components/illustrations/Illustrations';
import { Avatar } from '@/components/ui/Avatar';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState, InlineAlert } from '@/components/ui/States';
import { Stars, StarPicker } from '@/components/ui/Stars';
import { useAuth } from '@/hooks/useAuth';
import { useComments, useCreateComment, useDeleteComment } from '@/hooks/useComments';
import { RequestError } from '@/lib/api';
import { cn, relativeTime } from '@/lib/utils';
import type { Comment } from '@/types';

const MAX_LENGTH = 2000;

export function CommentSection({ slug, itemName }: { slug: string; itemName: string }) {
  const { user, isAuthenticated } = useAuth();
  const { data: comments, isLoading, isError, error, refetch } = useComments(slug);
  const [filter, setFilter] = useState<'all' | 'reviews'>('all');

  const roots = (comments ?? []).filter((comment) => !comment.parent);
  const visible = filter === 'reviews' ? roots.filter((comment) => comment.rating) : roots;
  const repliesFor = (id: string) => (comments ?? []).filter((comment) => comment.parent === id);
  const reviewCount = roots.filter((comment) => comment.rating).length;

  return (
    <section aria-labelledby="discussion-heading" className="mt-12">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 id="discussion-heading" className="text-xl uppercase">
          Discussion
          {roots.length > 0 && (
            <span className="ml-2 font-mono text-sm font-bold tabular-nums text-muted">
              {roots.length}
            </span>
          )}
        </h2>

        {reviewCount > 0 && (
          <div className="flex gap-1">
            {(['all', 'reviews'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                aria-pressed={filter === option}
                className={cn(
                  'border-2 border-edge px-2.5 py-1 font-mono text-[11px] font-bold uppercase transition-colors duration-[120ms]',
                  filter === option
                    ? 'bg-lavender text-ink'
                    : 'bg-surface text-muted hover:bg-surface-2 hover:text-body',
                )}
              >
                {option === 'all' ? 'Everything' : `Reviews (${reviewCount})`}
              </button>
            ))}
          </div>
        )}
      </div>

      {isAuthenticated ? (
        <CommentComposer slug={slug} itemName={itemName} />
      ) : (
        <div className="border-2 border-dashed border-edge px-5 py-6 text-center">
          <p className="text-sm text-muted">Sign in to review {itemName} or join the discussion.</p>
          <div className="mt-4 flex justify-center gap-2">
            <ButtonLink to="/login" size="sm">
              Sign in
            </ButtonLink>
            <ButtonLink to="/register" variant="secondary" size="sm">
              Create an account
            </ButtonLink>
          </div>
        </div>
      )}

      <div className="mt-8">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message={error.message} onRetry={() => void refetch()} />
        ) : visible.length === 0 ? (
          <EmptyState
            illustration={<EmptyCommentsIllustration className="size-32" />}
            title={filter === 'reviews' ? 'No reviews yet' : 'No comments yet'}
            description={
              filter === 'reviews'
                ? 'Be the first to leave a star rating.'
                : `Share what you think of ${itemName}.`
            }
          />
        ) : (
          <ul className="space-y-4">
            {visible.map((comment) => (
              <li key={comment.id}>
                <CommentRow
                  comment={comment}
                  slug={slug}
                  canDelete={user?.id === comment.user.id || user?.role === 'admin'}
                  replies={repliesFor(comment.id)}
                  currentUserId={user?.id}
                  canReply={isAuthenticated}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function CommentComposer({
  slug,
  itemName,
  parent,
  onDone,
}: {
  slug: string;
  itemName: string;
  parent?: string;
  onDone?: () => void;
}) {
  const [body, setBody] = useState('');
  const [rating, setRating] = useState(0);
  const createComment = useCreateComment(slug);
  const { user } = useAuth();

  const error = createComment.error instanceof RequestError ? createComment.error : null;
  const tooLong = body.length > MAX_LENGTH;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (body.trim().length < 2 || tooLong) return;

    createComment.mutate(
      { body: body.trim(), rating: rating || undefined, parent },
      {
        onSuccess: () => {
          setBody('');
          setRating(0);
          onDone?.();
        },
      },
    );
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-slab border-2 border-edge bg-surface p-4 shadow-hard"
    >
      <div className="flex gap-3">
        {user && <Avatar user={user} size="sm" className="mt-1" />}
        <div className="min-w-0 flex-1">
          <label className="sr-only" htmlFor={`comment-${parent ?? 'root'}`}>
            {parent ? 'Write a reply' : `Write a comment about ${itemName}`}
          </label>
          <textarea
            id={`comment-${parent ?? 'root'}`}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={parent ? 2 : 3}
            placeholder={parent ? 'Write a reply…' : `What do you think of ${itemName}?`}
            className="w-full resize-y rounded-slab border-2 border-edge bg-surface px-3.5 py-2.5 text-sm leading-relaxed shadow-[inset_3px_3px_0_var(--surface-2)] transition-[box-shadow,border-color] duration-[120ms] placeholder:text-muted/70 focus:border-lavender focus:shadow-none focus:outline-none"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            {/* Replies are part of a thread, not a rating of the product. */}
            {!parent ? (
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] font-bold uppercase text-muted">
                  Rate it
                </span>
                <StarPicker value={rating} onChange={setRating} />
              </div>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'font-mono text-[11px] font-bold tabular-nums',
                  tooLong ? 'bg-edge px-1 text-canvas' : 'text-muted',
                )}
              >
                {body.length}/{MAX_LENGTH}
              </span>
              {onDone && (
                <Button type="button" variant="ghost" size="sm" onClick={onDone}>
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                loading={createComment.isPending}
                disabled={body.trim().length < 2 || tooLong}
              >
                {parent ? 'Reply' : rating > 0 ? 'Post review' : 'Post comment'}
              </Button>
            </div>
          </div>

          {error && (
            <div className="mt-3">
              <InlineAlert>{error.fieldError('body') ?? error.message}</InlineAlert>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}

function CommentRow({
  comment,
  slug,
  canDelete,
  replies,
  currentUserId,
  canReply,
}: {
  comment: Comment;
  slug: string;
  canDelete: boolean;
  replies: Comment[];
  currentUserId?: string;
  canReply: boolean;
}) {
  const [replying, setReplying] = useState(false);
  const deleteComment = useDeleteComment(slug);

  return (
    <article className="rounded-slab border-2 border-edge bg-surface p-4 shadow-hard">
      <div className="flex gap-3">
        <Link to={`/u/${comment.user.username}`} className="shrink-0">
          <Avatar user={comment.user} size="sm" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              to={`/u/${comment.user.username}`}
              className="font-display text-sm uppercase hover:underline"
            >
              {comment.user.name}
            </Link>
            <span className="font-mono text-[11px] text-muted">@{comment.user.username}</span>
            <span aria-hidden="true" className="text-muted/50">
              ·
            </span>
            <time
              dateTime={comment.createdAt}
              className="font-mono text-[11px] font-bold uppercase text-muted"
            >
              {relativeTime(comment.createdAt)}
            </time>
            {comment.rating && (
              <Badge tone="accent" className="ml-1">
                <Stars value={comment.rating} />
                <span className="ml-0.5 tabular-nums">{comment.rating}/5</span>
              </Badge>
            )}
          </div>

          <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-body text-pretty">
            {comment.body}
          </p>

          <div className="mt-3 flex items-center gap-3">
            {canReply && (
              <button
                type="button"
                onClick={() => setReplying((open) => !open)}
                className="font-mono text-[11px] font-bold uppercase text-muted transition-colors hover:text-body"
              >
                {replying ? 'Cancel' : 'Reply'}
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => deleteComment.mutate(comment.id)}
                disabled={deleteComment.isPending}
                className="font-mono text-[11px] font-bold uppercase text-muted transition-colors hover:bg-edge hover:px-1 hover:text-canvas disabled:opacity-50"
              >
                Delete
              </button>
            )}
          </div>

          {replying && (
            <div className="mt-4">
              <CommentComposer
                slug={slug}
                itemName=""
                parent={comment.id}
                onDone={() => setReplying(false)}
              />
            </div>
          )}

          {replies.length > 0 && (
            <ul className="mt-4 space-y-3 border-l-2 border-edge pl-4">
              {replies.map((reply) => (
                <li key={reply.id}>
                  <div className="flex gap-2.5">
                    <Link to={`/u/${reply.user.username}`} className="shrink-0">
                      <Avatar user={reply.user} size="xs" className="mt-0.5" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2">
                        <Link
                          to={`/u/${reply.user.username}`}
                          className="font-display text-xs uppercase hover:underline"
                        >
                          {reply.user.name}
                        </Link>
                        <time
                          dateTime={reply.createdAt}
                          className="font-mono text-[11px] font-bold uppercase text-muted"
                        >
                          {relativeTime(reply.createdAt)}
                        </time>
                        {currentUserId === reply.user.id && (
                          <button
                            type="button"
                            onClick={() => deleteComment.mutate(reply.id)}
                            className="font-mono text-[10px] font-bold uppercase text-muted transition-colors hover:bg-edge hover:px-1 hover:text-canvas"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-body">
                        {reply.body}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}
