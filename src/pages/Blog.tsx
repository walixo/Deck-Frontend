import { Link, useSearchParams } from 'react-router-dom';
import { PageBanner } from '@/components/ui/Ambient';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { usePosts } from '@/hooks/usePosts';
import { formatFullDate } from '@/lib/utils';
import type { PostSummary } from '@/types';

/**
 * Deck's own writing.
 *
 * The one place on the site that is Deck's voice rather than somebody else's —
 * which is why it is staff-authored. A launch board where anyone can publish
 * editorial beside the rankings loses the ability to say what is an opinion and
 * what is an advert.
 */
export function Blog() {
  const [params, setParams] = useSearchParams();
  const tag = params.get('tag') ?? undefined;
  const { data, isLoading, isError, error, refetch } = usePosts(tag);

  return (
    <div className="relative isolate mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <PageBanner />

      <header className="mb-8 max-w-2xl">
        <p className="mb-3 inline-block border-2 border-edge bg-deep px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-on-deep">
          The blog
        </p>
        <h1 className="display-tight text-4xl uppercase text-balance sm:text-5xl">
          Notes from Deck
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted text-pretty">
          What we are learning from watching things launch — what lands, what does not, and how
          the board actually works.
        </p>
      </header>

      {tag && (
        <div className="mb-6 flex items-center gap-2">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
            Filtered by
          </span>
          <button
            type="button"
            onClick={() => setParams({})}
            className="border-2 border-edge bg-pop px-2 py-0.5 font-mono text-[11px] font-bold uppercase text-on-pop"
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
            className="aspect-video w-full border-b-2 border-edge object-cover"
          />
        ) : (
          /* No cover: a flat neutral field with the texture, so a post without
             art still reads as a card rather than as a broken one. */
          <div
            aria-hidden="true"
            className="relative aspect-video w-full border-b-2 border-edge bg-surface-2"
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
                  className="border-2 border-edge px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-muted"
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
