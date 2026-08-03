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
        <h2 id="discussion-heading" className="text-xl font-semibold">
          Discussion
          {roots.length > 0 && (
            <span className="ml-2 text-sm font-normal text-zinc-500 tabular-nums dark:text-zinc-500">
              {roots.length}
            </span>
          )}
        </h2>

        {reviewCount > 0 && (
          <div className="flex rounded-xl border border-zinc-200 p-0.5 dark:border-zinc-800">
            {(['all', 'reviews'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                aria-pressed={filter === option}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  filter === option
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white',
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
        <div className="rounded-2xl border border-dashed border-zinc-300 px-5 py-6 text-center dark:border-zinc-800">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Sign in to review {itemName} or join the discussion.
          </p>
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
              <Skeleton key={index} className="h-24 w-full rounded-2xl" />
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
    <form onSubmit={submit} className="rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-[color:var(--color-surface-dark)]">
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
            className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-900/60 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600 dark:focus:ring-white/5"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            {/* Replies are part of a thread, not a rating of the product. */}
            {!parent ? (
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
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
                  'text-xs tabular-nums',
                  tooLong ? 'text-red-600 dark:text-red-400' : 'text-zinc-400 dark:text-zinc-600',
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
    <article className="rounded-2xl border border-zinc-200/80 bg-white p-4 transition-colors dark:border-zinc-800 dark:bg-[color:var(--color-surface-dark)]">
      <div className="flex gap-3">
        <Link to={`/u/${comment.user.username}`} className="shrink-0">
          <Avatar user={comment.user} size="sm" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              to={`/u/${comment.user.username}`}
              className="text-sm font-medium hover:underline"
            >
              {comment.user.name}
            </Link>
            <span className="text-xs text-zinc-400 dark:text-zinc-600">
              @{comment.user.username}
            </span>
            <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-700">
              ·
            </span>
            <time
              dateTime={comment.createdAt}
              className="text-xs text-zinc-500 dark:text-zinc-500"
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

          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-700 text-pretty dark:text-zinc-300">
            {comment.body}
          </p>

          <div className="mt-3 flex items-center gap-3">
            {canReply && (
              <button
                type="button"
                onClick={() => setReplying((open) => !open)}
                className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              >
                {replying ? 'Cancel' : 'Reply'}
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => deleteComment.mutate(comment.id)}
                disabled={deleteComment.isPending}
                className="text-xs font-medium text-zinc-400 transition-colors hover:text-red-600 disabled:opacity-50 dark:text-zinc-500 dark:hover:text-red-400"
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
            <ul className="mt-4 space-y-3 border-l-2 border-zinc-100 pl-4 dark:border-zinc-800">
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
                          className="text-xs font-medium hover:underline"
                        >
                          {reply.user.name}
                        </Link>
                        <time
                          dateTime={reply.createdAt}
                          className="text-xs text-zinc-500 dark:text-zinc-500"
                        >
                          {relativeTime(reply.createdAt)}
                        </time>
                        {currentUserId === reply.user.id && (
                          <button
                            type="button"
                            onClick={() => deleteComment.mutate(reply.id)}
                            className="text-xs text-zinc-400 transition-colors hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
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
