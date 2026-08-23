import { Link, useParams } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Backdrop } from '@/components/ui/Ambient';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { VerifiedMark } from '@/components/ui/VerifiedMark';
import { usePost } from '@/hooks/usePosts';
import { formatFullDate } from '@/lib/utils';

export function BlogPost() {
  const { slug = '' } = useParams();
  const { data: post, isLoading, isError, error, refetch } = usePost(slug);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorState message={error.message} onRetry={() => void refetch()} />
        <div className="mt-6 text-center">
          <Link
            to="/blog"
            className="font-mono text-[12px] font-bold uppercase underline-offset-4 hover:underline"
          >
            ← Back to the blog
          </Link>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <article>
      <header className="relative isolate overflow-hidden border-b-2 border-edge">
        <Backdrop pattern="halftone" />

        <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6">
            <Link
              to="/blog"
              className="font-mono text-[11px] font-bold uppercase text-muted hover:text-body"
            >
              ← The blog
            </Link>
          </nav>

          {/* Staff see drafts here; readers get a 404 instead, so this chip only
              ever appears for somebody who can act on it. */}
          {post.status === 'draft' && (
            <p className="mb-4 inline-block border-2 border-edge bg-edge px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-canvas">
              Draft — only staff can see this
            </p>
          )}

          <h1 className="display-tight text-4xl uppercase text-balance sm:text-5xl">
            {post.title}
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted text-pretty">
            {post.excerpt}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {post.author && (
              <>
                <Avatar user={post.author} size="sm" />
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.06em]">
                  {post.author.name}
                  {post.author.verified && <VerifiedMark name={post.author.name} className="ml-1" />}
                </span>
              </>
            )}
            <span aria-hidden="true" className="text-muted/50">
              /
            </span>
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
              {post.publishedAt ? formatFullDate(post.publishedAt) : 'Unpublished'} ·{' '}
              {post.readMinutes} min read
            </span>
          </div>
        </div>
      </header>

      {post.coverUrl && (
        <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6 lg:px-8">
          <img
            src={post.coverUrl}
            alt=""
            className="aspect-[3/1] w-full border-2 border-edge object-cover shadow-hard"
          />
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {/*
         * Blank-line-separated plain text, the same convention a launch
         * description uses. Deliberately not markdown: rendering user-authored
         * markdown means either shipping a parser and a sanitiser or accepting
         * an HTML injection surface, and Deck's posts have never needed more
         * than paragraphs.
         */}
        <div className="space-y-5 text-base leading-relaxed text-body text-pretty">
          {post.body
            .split('\n')
            .filter(Boolean)
            .map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
        </div>

        {post.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2 border-t-2 border-edge pt-6">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                to={`/blog?tag=${encodeURIComponent(tag)}`}
                className="border-2 border-edge px-2 py-0.5 font-mono text-[11px] font-bold uppercase text-muted transition-colors duration-[120ms] hover:bg-deep hover:text-on-deep"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
