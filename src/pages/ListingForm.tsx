import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageBanner } from '@/components/ui/Ambient';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { EmptyState } from '@/components/ui/States';
import { useCreateListing, useMyListings, useUpdateListing } from '@/hooks/useSeller';
import { Skeleton } from '@/components/ui/Skeleton';
import { MERCH_CATEGORY_LABELS } from '@/lib/utils';
import type { MerchProduct } from '@/types';

const CATEGORIES = ['apparel', 'stickers', 'print', 'accessories'] as const;

interface VariantDraft {
  sku: string;
  size: string;
  colour: string;
  stock: number;
}

const emptyVariant = (): VariantDraft => ({ sku: '', size: '', colour: '', stock: 0 });

/**
 * List a product, or edit one already listed.
 *
 * Editing an approved listing quietly sends it back for review — the API does
 * that, and the copy here says so rather than letting a seller discover it when
 * their product vanishes from the shop.
 */
export function ListingForm() {
  const { id } = useParams<{ id: string }>();

  const { data: listings, isLoading: loadingListings } = useMyListings(Boolean(id));

  const existing = id ? listings?.find((product) => product.id === id) : undefined;

  if (id && loadingListings) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (id && !existing) {
    return (
      <div className="relative isolate mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <PageBanner />
        <EmptyState
          title="We could not find that listing"
          description="It may have been removed, or it belongs to someone else."
          action={<ButtonLink to="/sell">Back to your shop</ButtonLink>}
        />
      </div>
    );
  }

  /*
   * Keyed on the listing so the fields mount with the right values already in
   * place. Seeding them from an effect instead would mean rendering an empty
   * form first and then overwriting it — a cascading render, and a visible
   * flash of blank inputs on a slow connection.
   */
  return <ListingFields key={existing?.id ?? 'new'} existing={existing} />;
}

function ListingFields({ existing }: { existing?: MerchProduct }) {
  const navigate = useNavigate();
  const create = useCreateListing();
  const update = useUpdateListing();
  const id = existing?.id;

  const [name, setName] = useState(existing?.name ?? '');
  const [tagline, setTagline] = useState(existing?.tagline ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [category, setCategory] = useState<string>(existing?.category ?? 'apparel');
  const [price, setPrice] = useState<number | ''>(existing ? existing.priceMinor / 100 : '');
  const [images, setImages] = useState<string[]>(existing?.images ?? []);
  const [variants, setVariants] = useState<VariantDraft[]>(
    existing?.variants.length
      ? existing.variants.map((variant) => ({
          sku: variant.sku,
          size: variant.size ?? '',
          colour: variant.colour ?? '',
          stock: variant.stock,
        }))
      : [emptyVariant()],
  );
  const [error, setError] = useState<string | null>(null);

  const setVariant = (index: number, patch: Partial<VariantDraft>) => {
    setVariants((current) =>
      current.map((variant, position) => (position === index ? { ...variant, ...patch } : variant)),
    );
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const cleaned = variants
      .filter((variant) => variant.sku.trim())
      .map((variant) => ({
        sku: variant.sku.trim().toUpperCase(),
        size: variant.size.trim() || undefined,
        colour: variant.colour.trim() || undefined,
        stock: Number(variant.stock) || 0,
      }));

    if (cleaned.length === 0) {
      setError('Add at least one variant with a SKU');
      return;
    }

    const payload = {
      name,
      tagline,
      description,
      category,
      price: Number(price) || 0,
      images,
      variants: cleaned,
    };

    try {
      if (id) {
        await update.mutateAsync({ id, ...payload });
      } else {
        await create.mutateAsync(payload);
      }
      void navigate('/sell');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'We could not save that');
    }
  };

  const saving = create.isPending || update.isPending;

  return (
    <div className="relative isolate mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <PageBanner />

      <header className="mb-8">
        <p className="mb-3 inline-block border-2 border-edge bg-acid px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-ink">
          {id ? 'Editing' : 'New listing'}
        </p>
        <h1 className="display-tight text-4xl uppercase text-balance">
          {id ? 'Edit your product' : 'List a product'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted text-pretty">
          {id
            ? 'Saving changes sends the listing back to Deck for a quick review before it returns to the shop.'
            : 'Deck reviews new listings before they reach the shop. You will see the status on your shop page.'}
        </p>
      </header>

      <form onSubmit={submit} className="space-y-5">
        <Input
          label="Product name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          required
        />

        <Input
          label="Tagline"
          value={tagline}
          onChange={(event) => setTagline(event.target.value)}
          maxLength={140}
          required
          hint="One line, shown on the shop card"
        />

        <Textarea
          label="Description"
          rows={5}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={4000}
          required
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Select
            label="Category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            options={CATEGORIES.map((value) => ({
              value,
              label: MERCH_CATEGORY_LABELS[value] ?? value,
            }))}
          />

          <Input
            label="Price"
            type="number"
            inputMode="decimal"
            min={0}
            step={100}
            value={price}
            onChange={(event) =>
              setPrice(event.target.value === '' ? '' : Number(event.target.value))
            }
            required
            hint="In whole naira"
          />
        </div>

        <ImageUpload
          label="Photos"
          hint="Up to six. The first is the shop card."
          value={images}
          onChange={setImages}
          max={6}
          aspect="wide"
        />

        <fieldset className="rounded-slab border-2 border-edge bg-surface p-4">
          <legend className="border-2 border-edge bg-surface px-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em]">
            Variants
          </legend>
          <p className="mb-4 text-xs leading-relaxed text-muted">
            One row per size or colour. The SKU is what carts and orders reference, so it has to be
            unique across the whole shop and cannot change once someone has bought it.
          </p>

          <div className="space-y-3">
            {variants.map((variant, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-[1.4fr_1fr_1fr_0.8fr_auto]">
                <Input
                  label={index === 0 ? 'SKU' : ''}
                  value={variant.sku}
                  onChange={(event) => setVariant(index, { sku: event.target.value.toUpperCase() })}
                  placeholder="TEE-BLK-M"
                  maxLength={32}
                />
                <Input
                  label={index === 0 ? 'Size' : ''}
                  value={variant.size}
                  onChange={(event) => setVariant(index, { size: event.target.value })}
                  placeholder="M"
                  maxLength={16}
                />
                <Input
                  label={index === 0 ? 'Colour' : ''}
                  value={variant.colour}
                  onChange={(event) => setVariant(index, { colour: event.target.value })}
                  placeholder="Black"
                  maxLength={24}
                />
                <Input
                  label={index === 0 ? 'Stock' : ''}
                  type="number"
                  min={0}
                  value={variant.stock}
                  onChange={(event) => setVariant(index, { stock: Number(event.target.value) })}
                />
                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setVariants((current) => current.filter((_, position) => position !== index))
                    }
                    aria-label={`Remove variant ${index + 1}`}
                    className={`h-11 border-2 border-edge px-3 font-mono text-[12px] font-bold text-muted transition-colors duration-[120ms] hover:bg-edge hover:text-canvas ${
                      index === 0 ? 'sm:mt-[1.6rem]' : ''
                    }`}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => setVariants((current) => [...current, emptyVariant()])}
          >
            Add a variant
          </Button>
        </fieldset>

        {error && (
          <p
            role="alert"
            className="border-2 border-edge bg-edge px-3 py-2 font-mono text-[11px] font-bold uppercase text-canvas"
          >
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" loading={saving}>
            {id ? 'Save changes' : 'Submit for review'}
          </Button>
          <ButtonLink to="/sell" variant="secondary">
            Cancel
          </ButtonLink>
        </div>
      </form>
    </div>
  );
}
