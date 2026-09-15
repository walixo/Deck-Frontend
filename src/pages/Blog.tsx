import { Link, useSearchParams } from 'react-router-dom';
import { PageBanner } from '@/components/ui/Ambient';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import { formatFullDate } from '@/lib/utils';
import type { PostSummary } from '@/types';

/**
 * Deck's writing, and everybody else's.
 *
 * It was staff-authored on the argument that a launch board where anyone can
 * publish editorial beside the rankings loses the ability to say what is an
 * opinion and what is an advert. True, and outweighed: a blog only Deck can
 * write in is a blog with one contributor, posting whenever somebody remembers
 * to, which is the surest way to have a blog nobody reads.
 *
 * Every post carries its author's name and links to their profile, which is
 * what actually answers "who is telling me this" — a byline does the work the
 * closed door was doing, without the empty page.
 *
 * The invitation is here rather than only in the account area. Somebody
 * discovers they can write by reading, not by going looking through settings
 * for a feature they have no reason to think exists.
 */
export function Blog() {
  const [params, setParams] = useSearchParams();
  const tag = params.get('tag') ?? undefined;
  const { data, isLoading, isError, error, refetch } = usePosts(tag);
  const { user } = useAuth();

  return (
    <div className="relative isolate mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <PageBanner />

      <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="mb-3 inline-block border border-edge bg-deep px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-on-deep">
            The blog
          </p>
          <h1 className="display-tight text-3xl uppercase text-balance sm:text-4xl">
            Notes from Deck
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted text-pretty">
            What we are learning from watching things launch — what lands, what does not, and how
            the board actually works. Anyone with an account can write here.
          </p>
        </div>

        {/* Signed out, this is a sign-up pitch and would read as one; the
            invitation only means anything to somebody who can accept it. */}
        {user && <ButtonLink to="/settings/writing">Write an article</ButtonLink>}
      </header>

      {tag && (
        <div className="mb-6 flex items-center gap-2">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
            Filtered by
          </span>
          <button
            type="button"
            onClick={() => setParams({})}
            className="border border-edge bg-pop px-2 py-0.5 font-mono text-[11px] font-bold uppercase text-on-pop"
          >
            {tag} ✕
          </button>
        </div>
      )}

      {isLoading ? (
        /* Six placeholders, not four: at three across, four leaves a ragged
           second row that the real content never has. */
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <Skeleton key={n} className="h-64 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={error.message} onRetry={() => void refetch()} />
      ) : data?.data.length ? (
        /* Three across from lg. Held at two on sm–md on purpose: a third column
           inside a 768px container gives each card ~240px, which is narrower
           than the title needs before it starts breaking mid-word. */
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.data.map((post, index) => (
            <PostCard key={post.id} post={post} index={index} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={tag ? `Nothing tagged "${tag}" yet` : 'Nothing published yet'}
          description="Deck's writing will show up here."
        />
      )}
    </div>
  );
}

function PostCard({ post, index }: { post: PostSummary; index: number }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      style={{ animationDelay: `${index * 60}ms` }}
      className="group block animate-[var(--animate-slide-up)] transition-transform duration-[120ms] ease-[var(--ease-snap)] hover:-translate-x-0.5 hover:-translate-y-0.5"
    >
      <Card className="h-full overflow-hidden group-hover:shadow-hard-lg">
        {post.coverUrl ? (
          <img
            src={post.coverUrl}
            alt=""
            loading="lazy"
            className="aspect-video w-full border-b border-edge object-cover"
          />
        ) : (
          /* No cover: a flat neutral field with the texture, so a post without
             art still reads as a card rather than as a broken one. */
          <div
            aria-hidden="true"
            className="relative aspect-video w-full border-b border-edge bg-surface-2"
          >
            <div className="absolute inset-0 bg-halftone text-edge opacity-[0.12]" />
          </div>
        )}

        <div className="p-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
            {post.publishedAt ? formatFullDate(post.publishedAt) : 'Draft'} · {post.readMinutes} min
            read
          </p>
          <h2 className="mt-2 font-display text-lg uppercase leading-tight text-balance">
            {post.title}
          </h2>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted text-pretty">
            {post.excerpt}
          </p>

          {post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {post.tags.slice(0, 3).map((entry) => (
                <span
                  key={entry}
                  className="border border-edge px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-muted"
                >
                  {entry}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
