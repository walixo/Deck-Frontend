import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CategoryLabel } from '@/components/illustrations/CategoryIcon';
import { ItemLogo } from '@/components/items/ItemLogo';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CharCount, Input, Select, Textarea } from '@/components/ui/Field';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { WallColourPicker } from '@/components/items/WallColourPicker';
import { InlineAlert } from '@/components/ui/States';
import { useCreateItem, useReleaseItem, useUpdateItem } from '@/hooks/useItems';
import { RequestError } from '@/lib/api';
import { useActiveCategories } from '@/hooks/useCategories';
import { PRICING_LABELS } from '@/lib/utils';
import type { Category, Item, PricingModel } from '@/types';

const PRICING_OPTIONS = (Object.keys(PRICING_LABELS) as PricingModel[]).map((value) => ({
  value,
  label: PRICING_LABELS[value],
}));

const LIMITS = { name: 70, tagline: 120, description: 4000, version: 24, changelog: 400 };

interface LaunchFormProps {
  /**
   * `release` ships a new version of `from`, which must then be supplied. The
   * two modes share every field because a release *is* a launch — the only
   * additions are the version label and the changelog.
   */
  mode: 'new' | 'release' | 'edit';
  from?: Item;
}

/**
 * The launch form, used both to post a product and to ship a new version of one.
 *
 * Prefilled state is read straight from `from` during the initial `useState`
 * call rather than pushed in by an effect. The caller is responsible for
 * mounting this only once `from` has loaded, and for keying it on the item's id
 * — that way a different launch remounts the form instead of trying to
 * reconcile fields the person may already have edited.
 */
export function LaunchForm({ mode, from }: LaunchFormProps) {
  const navigate = useNavigate();
  const createItem = useCreateItem();
  const releaseItem = useReleaseItem(from?.slug ?? '');
  const updateItem = useUpdateItem(from?.slug ?? '');

  /* Options come from the database now, so a category added this morning is
     offered here without a deploy. Retired ones are excluded — an existing
     launch keeps its category, but nothing new may be filed there. */
  const { data: categories } = useActiveCategories();
  const categoryOptions = categories.map((category) => ({
    value: category.slug,
    label: category.label,
  }));

  const releasing = mode === 'release' && Boolean(from);
  const editing = mode === 'edit' && Boolean(from);
  const mutation = releasing ? releaseItem : editing ? updateItem : createItem;

  const [form, setForm] = useState({
    name: from?.name ?? '',
    tagline: from?.tagline ?? '',
    description: from?.description ?? '',
    category: (from?.category ?? 'ai-tool') as Category,
    pricing: (from?.pricing ?? 'free') as PricingModel,
    websiteUrl: from?.websiteUrl ?? '',
    repoUrl: from?.repoUrl ?? '',
    tags: (from?.tags ?? []).join(', '),
    makers: (from?.makers ?? []).join(', '),
    version: '',
    changelog: '',
  });

  // Uploaded image paths, held apart from the text fields so the uploader owns them.
  const [logo, setLogo] = useState<string[]>(from?.logoUrl ? [from.logoUrl] : []);
  const [cover, setCover] = useState<string[]>(from?.coverUrl ? [from.coverUrl] : []);
  const [gallery, setGallery] = useState<string[]>(from?.gallery ?? []);
  /* '' means "sample my logo", which is what every launch did before makers
     could choose, and still the default for a new one. */
  const [wallColour, setWallColour] = useState<string>(from?.wallColour ?? '');
  const [videoUrl, setVideoUrl] = useState<string>(from?.videoUrl ?? '');

  const error = mutation.error instanceof RequestError ? mutation.error : null;

  const update =
    (key: keyof typeof form) =>
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ): void => {
      setForm((current) => ({ ...current, [key]: event.target.value }));
    };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    const draft = {
      name: form.name.trim(),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      category: form.category,
      pricing: form.pricing,
      websiteUrl: form.websiteUrl.trim(),
      repoUrl: form.repoUrl.trim() || undefined,
      logoUrl: logo[0],
      coverUrl: cover[0],
      wallColour,
      videoUrl: videoUrl.trim(),
      gallery,
      // Comma separated in the UI, arrays on the wire.
      tags: splitList(form.tags, 6).map((tag) => tag.toLowerCase()),
      makers: splitList(form.makers, 8),
    };

    const onSuccess = (item: Item) => navigate(`/item/${item.slug}`);

    if (editing && from) {
      /* Saving an edit returns to the launch rather than the form, because the
         thing the maker wants to see is whether the fix reads right in place. */
      updateItem.mutate({ id: from.id, ...draft }, { onSuccess: () => navigate(`/item/${from.slug}`) });
      return;
    }

    if (releasing) {
      releaseItem.mutate(
        {
          ...draft,
          version: form.version.trim(),
          changelog: form.changelog.trim() || undefined,
        },
        { onSuccess },
      );
      return;
    }

    createItem.mutate(draft, { onSuccess });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <form onSubmit={submit} className="space-y-8" noValidate>
        {error && !error.fields.length && <InlineAlert>{error.message}</InlineAlert>}

        {releasing && (
          <Card className="space-y-5 p-5 sm:p-6">
            <h2 className="border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
              This version
            </h2>

            <Input
              label="Version"
              required
              value={form.version}
              onChange={update('version')}
              error={error?.fieldError('version')}
              maxLength={LIMITS.version}
              hint="However you label your releases — 2.0, v3, 2026.1."
              placeholder="2.0"
            />

            <Textarea
              label="What's new (optional)"
              rows={3}
              value={form.changelog}
              onChange={update('changelog')}
              error={error?.fieldError('changelog')}
              maxLength={LIMITS.changelog}
              hint="A line or two on what changed since the last version."
              counter={<CharCount value={form.changelog} max={LIMITS.changelog} />}
            />
          </Card>
        )}

        <Card className="space-y-5 p-5 sm:p-6">
          <h2 className="border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
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
          <h2 className="border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
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
              options={categoryOptions}
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
          <h2 className="border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
            Images
          </h2>

          <ImageUpload
            label="Logo"
            aspect="square"
            value={logo}
            onChange={setLogo}
            error={error?.fieldError('logoUrl')}
            hint="Square works best. Without one, Deck generates a colour monogram from your product name."
          />

          <ImageUpload
            label="Cover image"
            value={cover}
            onChange={setCover}
            error={error?.fieldError('coverUrl')}
            /* No longer "shown on the launch wall". The wall takes a colour
               now, not a screenshot — see the note in LaunchWall. */
            hint="Shown at the top of your product page and on link previews."
          />

          <Input
            label="Video (optional)"
            type="url"
            value={videoUrl}
            onChange={(event) => setVideoUrl(event.target.value)}
            error={error?.fieldError('videoUrl')}
            hint="A YouTube or Vimeo link. Shown first in your gallery, and on Future Gen."
            placeholder="https://youtube.com/watch?v=..."
          />

          <ImageUpload
            label="Gallery"
            max={6}
            value={gallery}
            onChange={setGallery}
            error={error?.fieldError('gallery')}
            hint="Up to 6 screenshots. Drag several in at once."
          />

          <div className="border-t-2 border-edge pt-5">
            <WallColourPicker
              value={wallColour}
              onChange={setWallColour}
              logoUrl={logo[0]}
              error={error?.fieldError('wallColour')}
            />
          </div>
        </Card>

        <Card className="space-y-5 p-5 sm:p-6">
          <h2 className="border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
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
          <Button type="submit" size="lg" loading={mutation.isPending}>
            {releasing ? 'Ship this version' : editing ? 'Save changes' : 'Publish launch'}
          </Button>
          <Button type="button" variant="ghost" size="lg" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>

      {/* Live preview of the card as it will appear in listings. */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
          Live preview
        </p>
        <Card className="overflow-hidden">
          {cover[0] && (
            <img
              src={cover[0]}
              alt=""
              className="aspect-video w-full border-b-2 border-edge object-cover"
            />
          )}
          <div className="flex items-start gap-3 p-4">
            <ItemLogo
              item={{
                name: form.name || 'Your product',
                slug: form.name || 'preview',
                logoUrl: logo[0],
              }}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm uppercase">
                {form.name || 'Your product name'}
                {releasing && form.version && (
                  <span className="ml-1.5 font-mono text-[11px] text-muted">{form.version}</span>
                )}
              </p>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                {form.tagline || 'Your tagline shows up right here.'}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <Badge tone="outline">
                  <CategoryLabel slug={form.category} />
                </Badge>
                <Badge tone="neutral">{PRICING_LABELS[form.pricing]}</Badge>
              </div>
            </div>
            <span className="flex h-14 w-12 shrink-0 flex-col items-center justify-center border-2 border-edge bg-surface font-mono text-muted">
              <span aria-hidden="true" className="text-[10px]">
                ▲
              </span>
              <span className="text-sm font-bold tabular-nums">0</span>
            </span>
          </div>

          {splitList(form.tags, 6).length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t-2 border-edge px-4 py-3">
              {splitList(form.tags, 6).map((tag) => (
                <span
                  key={tag}
                  className="border-2 border-edge px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-muted"
                >
                  #{tag.toLowerCase()}
                </span>
              ))}
            </div>
          )}
        </Card>

        <div className="mt-5 border-2 border-dashed border-edge p-4">
          <h3 className="font-display text-xs uppercase">
            {releasing ? 'What carries over' : 'What makes a launch land'}
          </h3>
          <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-muted">
            {releasing ? (
              <>
                <li>· Votes and reviews stay on the old version.</li>
                <li>· This one starts at zero on today&apos;s board.</li>
                <li>· Any fundraise does not carry over — opt in again if you want one.</li>
              </>
            ) : (
              <>
                <li>· Lead with the problem you removed.</li>
                <li>· Be specific about what is free and what is not.</li>
                <li>· Reply to the first comments — that is where votes come from.</li>
              </>
            )}
          </ul>
        </div>
      </aside>
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
