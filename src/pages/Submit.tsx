import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ItemLogo } from '@/components/items/ItemLogo';
import { PageGlow } from '@/components/ui/Ambient';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CharCount, Input, Select, Textarea } from '@/components/ui/Field';
import { InlineAlert } from '@/components/ui/States';
import { useCreateItem } from '@/hooks/useItems';
import { RequestError } from '@/lib/api';
import { CATEGORY_LABELS, PRICING_LABELS } from '@/lib/utils';
import type { Category, PricingModel } from '@/types';

const CATEGORY_OPTIONS = (Object.keys(CATEGORY_LABELS) as Category[]).map((value) => ({
  value,
  label: CATEGORY_LABELS[value],
}));

const PRICING_OPTIONS = (Object.keys(PRICING_LABELS) as PricingModel[]).map((value) => ({
  value,
  label: PRICING_LABELS[value],
}));

const LIMITS = { name: 70, tagline: 120, description: 4000 };

export function Submit() {
  const navigate = useNavigate();
  const createItem = useCreateItem();

  const [form, setForm] = useState({
    name: '',
    tagline: '',
    description: '',
    category: 'ai-tool' as Category,
    pricing: 'free' as PricingModel,
    websiteUrl: '',
    repoUrl: '',
    tags: '',
    makers: '',
  });

  const error = createItem.error instanceof RequestError ? createItem.error : null;

  const update =
    (key: keyof typeof form) =>
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ): void => {
      setForm((current) => ({ ...current, [key]: event.target.value }));
    };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    createItem.mutate(
      {
        name: form.name.trim(),
        tagline: form.tagline.trim(),
        description: form.description.trim(),
        category: form.category,
        pricing: form.pricing,
        websiteUrl: form.websiteUrl.trim(),
        repoUrl: form.repoUrl.trim() || undefined,
        // Comma separated in the UI, arrays on the wire.
        tags: splitList(form.tags, 6).map((tag) => tag.toLowerCase()),
        makers: splitList(form.makers, 8),
      },
      {
        onSuccess: (item) => navigate(`/item/${item.slug}`),
      },
    );
  };

  return (
    <div className="relative isolate mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <PageGlow />

      <header className="mb-8 max-w-2xl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-400">
          New launch
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Put your product on the board
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 text-pretty dark:text-zinc-400">
          It goes live immediately and joins today&apos;s leaderboard. You can delete it later from
          its page.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <form onSubmit={submit} className="space-y-8" noValidate>
          {error && !error.fields.length && <InlineAlert>{error.message}</InlineAlert>}

          <Card className="space-y-5 p-5 sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-zinc-400 dark:text-zinc-500">
              The basics
            </h2>

            <Input
              label="Product name"
              required
              value={form.name}
              onChange={update('name')}
              error={error?.fieldError('name')}
              maxLength={LIMITS.name}
              placeholder="Lumen 3"
              counter={<CharCount value={form.name} max={LIMITS.name} />}
            />

            <Input
              label="Tagline"
              required
              value={form.tagline}
              onChange={update('tagline')}
              error={error?.fieldError('tagline')}
              maxLength={LIMITS.tagline}
              hint="One line that makes someone want to click. No marketing filler."
              placeholder="A 7B reasoning model that runs comfortably on a laptop"
              counter={<CharCount value={form.tagline} max={LIMITS.tagline} />}
            />

            <Textarea
              label="Description"
              required
              value={form.description}
              onChange={update('description')}
              error={error?.fieldError('description')}
              maxLength={LIMITS.description}
              rows={8}
              hint="What it does, who it is for, and what makes it different. Blank lines become paragraphs."
              counter={<CharCount value={form.description} max={LIMITS.description} />}
            />
          </Card>

          <Card className="space-y-5 p-5 sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-zinc-400 dark:text-zinc-500">
              Where it lives
            </h2>

            <Input
              label="Website"
              type="url"
              required
              value={form.websiteUrl}
              onChange={update('websiteUrl')}
              error={error?.fieldError('websiteUrl')}
              placeholder="https://example.com"
            />

            <Input
              label="Repository (optional)"
              type="url"
              value={form.repoUrl}
              onChange={update('repoUrl')}
              error={error?.fieldError('repoUrl')}
              placeholder="https://github.com/you/project"
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <Select
                label="Category"
                value={form.category}
                onChange={update('category')}
                options={CATEGORY_OPTIONS}
                error={error?.fieldError('category')}
              />
              <Select
                label="Pricing"
                value={form.pricing}
                onChange={update('pricing')}
                options={PRICING_OPTIONS}
                error={error?.fieldError('pricing')}
              />
            </div>
          </Card>

          <Card className="space-y-5 p-5 sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-zinc-400 dark:text-zinc-500">
              Details
            </h2>

            <Input
              label="Tags"
              value={form.tags}
              onChange={update('tags')}
              error={error?.fieldError('tags')}
              hint="Comma separated, up to 6. These power search and the tag pages."
              placeholder="llm, local-first, open-weights"
            />

            <Input
              label="Makers"
              value={form.makers}
              onChange={update('makers')}
              error={error?.fieldError('makers')}
              hint="Comma separated, up to 8. Credit everyone who built it."
              placeholder="Ada Okonkwo, Priya Raman"
            />
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="lg" loading={createItem.isPending}>
              Publish launch
            </Button>
            <Button type="button" variant="ghost" size="lg" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </form>

        {/* Live preview of the card as it will appear in listings. */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
            Live preview
          </p>
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <ItemLogo
                item={{ name: form.name || 'Your product', slug: form.name || 'preview' }}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {form.name || 'Your product name'}
                </p>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {form.tagline || 'Your tagline shows up right here.'}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <Badge tone="outline">{CATEGORY_LABELS[form.category]}</Badge>
                  <Badge tone="muted">{PRICING_LABELS[form.pricing]}</Badge>
                </div>
              </div>
              <span className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-zinc-200 text-zinc-400 dark:border-zinc-800 dark:text-zinc-600">
                <span aria-hidden="true" className="text-[10px]">
                  ▲
                </span>
                <span className="text-sm font-semibold tabular-nums">0</span>
              </span>
            </div>

            {splitList(form.tags, 6).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                {splitList(form.tags, 6).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
                  >
                    #{tag.toLowerCase()}
                  </span>
                ))}
              </div>
            )}
          </Card>

          <div className="mt-5 rounded-2xl border border-dashed border-zinc-300 p-4 dark:border-zinc-800">
            <h3 className="text-xs font-semibold">What makes a launch land</h3>
            <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              <li>· Lead with the problem you removed.</li>
              <li>· Be specific about what is free and what is not.</li>
              <li>· Reply to the first comments — that is where votes come from.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function splitList(value: string, max: number): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, max);
}
