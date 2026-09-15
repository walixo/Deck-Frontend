import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CharCount, Input, Textarea } from '@/components/ui/Field';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, InlineAlert } from '@/components/ui/States';
import { useCreatePost, useDeletePost, useMyPosts, useUpdatePost } from '@/hooks/usePosts';
import { RequestError } from '@/lib/api';
import { cn, relativeTime } from '@/lib/utils';
import type { PostDraft, PostSummary } from '@/types';

const LIMITS = { title: 120, excerpt: 240, body: 40_000 };

/**
 * Write and publish an article.
 *
 * Open to every account. Writing used to live entirely in the staff area, which
 * meant Deck had a blog only Deck could write in — the surest way to have a
 * blog nobody reads.
 *
 * Publishing is immediate rather than queued. Deck reviews the things that end
 * in money changing hands or an object in the post; an article is neither, and
 * a review queue is how a blog with one contributor stays a blog with one
 * contributor. Staff can unpublish, and that is audited.
 */
export function AccountWriting() {
  const { data: posts, isLoading } = useMyPosts();
  const [editing, setEditing] = useState<PostSummary | null>(null);
  const [composing, setComposing] = useState(false);

  const open = composing || editing !== null;

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-tight text-3xl uppercase">Writing</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted text-pretty">
            Anything you publish appears on{' '}
            <Link to="/blog" className="font-bold text-body underline underline-offset-2">
              the blog
            </Link>{' '}
            straight away, under your name.
          </p>
        </div>

        {!open && <Button onClick={() => setComposing(true)}>New article</Button>}
      </header>

      {open && (
        <Composer
          post={editing}
          onDone={() => {
            setComposing(false);
            setEditing(null);
          }}
        />
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1].map((n) => (
            <Skeleton key={n} className="h-20 w-full" />
          ))}
        </div>
      ) : posts?.length ? (
        <ul className="mt-8 space-y-2">
          {posts.map((post) => (
            <PostRow key={post.id} post={post} onEdit={() => setEditing(post)} />
          ))}
        </ul>
      ) : (
        !open && (
          <EmptyState
            title="Nothing written yet"
            description="Publish something and it goes on the blog under your name."
          />
        )
      )}
    </div>
  );
}

function PostRow({ post, onEdit }: { post: PostSummary; onEdit: () => void }) {
  const remove = useDeletePost();
  const live = post.status === 'published';

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-slab border border-edge bg-surface p-3 shadow-hard-sm">
      <span
        className={cn(
          'shrink-0 border border-edge px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em]',
          live ? 'bg-success text-ink' : 'bg-surface-2 text-muted',
        )}
      >
        {live ? 'Live' : 'Draft'}
      </span>

      {/* A live post links to itself; a draft has nowhere public to go. */}
      {live ? (
        <Link
          to={`/blog/${post.slug}`}
          className="min-w-0 flex-1 truncate font-display text-[13px] uppercase underline-offset-2 hover:underline"
        >
          {post.title}
        </Link>
      ) : (
        <span className="min-w-0 flex-1 truncate font-display text-[13px] uppercase">
          {post.title}
        </span>
      )}

      <span className="shrink-0 font-mono text-[10px] uppercase text-muted">
        {post.publishedAt ? relativeTime(post.publishedAt) : 'unpublished'} · {post.readMinutes} min
      </span>

      <Button variant="secondary" size="sm" onClick={onEdit}>
        Edit
      </Button>
      <Button
        variant="danger"
        size="sm"
        loading={remove.isPending}
        onClick={() => {
          if (window.confirm(`Delete "${post.title}"? This cannot be undone.`)) {
            remove.mutate(post.id);
          }
        }}
      >
        Delete
      </Button>
    </li>
  );
}

/**
 * The editor.
 *
 * Plain text with blank lines between paragraphs — the same rendering the forum
 * uses, and for the same reason. Supporting Markdown means shipping a parser
 * and a sanitiser or shipping an XSS hole, and a first blog does not need bold.
 *
 * Two submit buttons rather than a status dropdown: "save draft" and "publish"
 * are the two things anybody wants, and making somebody set a field and *then*
 * press save is one step more than the decision requires.
 */
function Composer({ post, onDone }: { post: PostSummary | null; onDone: () => void }) {
  const create = useCreatePost();
  const update = useUpdatePost();
  const mutation = post ? update : create;

  const [form, setForm] = useState({
    title: post?.title ?? '',
    excerpt: post?.excerpt ?? '',
    /* A summary row carries no body, so editing an existing post starts from
       empty here. Flagged in the hint rather than silently wiping their work. */
    body: '',
    tags: (post?.tags ?? []).join(', '),
  });
  const [cover, setCover] = useState<string[]>(post?.coverUrl ? [post.coverUrl] : []);

  const error = mutation.error instanceof RequestError ? mutation.error : null;

  const submit = (status: 'draft' | 'published') => {
    const draft: PostDraft = {
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      body: form.body.trim(),
      coverUrl: cover[0] ?? '',
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 6),
      status,
    };

    if (post) update.mutate({ id: post.id, ...draft }, { onSuccess: onDone });
    else create.mutate(draft, { onSuccess: onDone });
  };

  return (
    <Card className="mb-8 space-y-5 p-5 sm:p-6">
      <h2 className="border-b border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
        {post ? `Editing “${post.title}”` : 'New article'}
      </h2>

      {error && !error.fields.length && <InlineAlert>{error.message}</InlineAlert>}

      <Input
        label="Title"
        required
        value={form.title}
        onChange={(event) => setForm({ ...form, title: event.target.value })}
        error={error?.fieldError('title')}
        maxLength={LIMITS.title}
        counter={<CharCount value={form.title} max={LIMITS.title} />}
      />

      <Textarea
        label="Summary"
        required
        rows={2}
        value={form.excerpt}
        onChange={(event) => setForm({ ...form, excerpt: event.target.value })}
        error={error?.fieldError('excerpt')}
        maxLength={LIMITS.excerpt}
        hint="The line under the title on the blog index. Make somebody want to open it."
        counter={<CharCount value={form.excerpt} max={LIMITS.excerpt} />}
      />

      <Textarea
        label="Article"
        required
        rows={16}
        value={form.body}
        onChange={(event) => setForm({ ...form, body: event.target.value })}
        error={error?.fieldError('body')}
        maxLength={LIMITS.body}
        hint={
          post
            ? 'Re-paste the full article — editing loads the title and summary, not the body.'
            : 'Plain text. Leave a blank line between paragraphs.'
        }
        counter={<CharCount value={form.body} max={LIMITS.body} />}
      />

      <ImageUpload
        label="Cover image (optional)"
        value={cover}
        onChange={setCover}
        error={error?.fieldError('coverUrl')}
        hint="Shown on the blog index and at the top of the article."
      />

      <Input
        label="Tags"
        value={form.tags}
        onChange={(event) => setForm({ ...form, tags: event.target.value })}
        error={error?.fieldError('tags')}
        hint="Comma separated, up to 6."
        placeholder="launching, pricing"
      />

      <div className="flex flex-wrap gap-3 border-t border-edge pt-4">
        <Button loading={mutation.isPending} onClick={() => submit('published')}>
          {post?.status === 'published' ? 'Save and keep live' : 'Publish'}
        </Button>
        <Button variant="secondary" loading={mutation.isPending} onClick={() => submit('draft')}>
          Save as draft
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}
