import { useState } from 'react';
import { CategoryIcon, ICON_SET, type IconKey } from '@/components/illustrations/CategoryIcon';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Field';
import { Skeleton } from '@/components/ui/Skeleton';
import { InlineAlert } from '@/components/ui/States';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/hooks/useCategories';
import { RequestError } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { CategoryCount } from '@/types';

const ICON_KEYS = Object.keys(ICON_SET) as IconKey[];

/**
 * Staff management for launch categories.
 *
 * Categories decide the shape of the whole board — the browse strip, the submit
 * form's picker, every filter URL — which is why this is staff-only rather than
 * something a maker can add mid-launch.
 *
 * Two rules are enforced by the server and surfaced here so the UI never offers
 * an action that will be refused:
 *
 *  - **Slugs are immutable.** They are the key every launch stores and every
 *    shared filter link carries. Editing one would orphan launches and break
 *    URLs, so the field is shown read-only and retiring is offered instead.
 *  - **Delete only while empty.** Anything holding launches can be retired —
 *    closed to new launches, still readable on the old ones — but not removed.
 */
export function AdminCategories() {
  const { data: categories, isLoading } = useCategories();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="display-tight text-3xl uppercase">Categories</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted text-pretty">
          What kinds of thing can launch on Deck. Adding one makes it available in the submit form
          immediately — no deploy. Retiring one closes it to new launches without touching the
          launches already filed there.
        </p>
      </header>

      <CategoryForm />

      <section>
        <h2 className="mb-3 border-b border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
          {categories ? `${categories.length} categories` : 'Categories'}
        </h2>

        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((n) => (
              <Skeleton key={n} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <ul className="space-y-2">
            {categories?.map((category) => (
              <CategoryRow key={category.id} category={category} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* --------------------------------------------------------------- creating --- */

function CategoryForm() {
  const create = useCreateCategory();

  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState<IconKey>('sparkles');
  const [blurb, setBlurb] = useState('');
  const [order, setOrder] = useState('100');

  const error = create.error instanceof RequestError ? create.error : null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    create.mutate(
      {
        label: label.trim(),
        icon,
        blurb: blurb.trim() || undefined,
        order: Number(order) || 100,
      },
      {
        onSuccess: () => {
          setLabel('');
          setBlurb('');
          setOrder('100');
        },
      },
    );
  };

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="border-b border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
        Add a category
      </h2>

      <form onSubmit={submit} className="mt-4 space-y-5" noValidate>
        {error && !error.fields.length && <InlineAlert>{error.message}</InlineAlert>}

        <div className="grid gap-5 sm:grid-cols-[1fr_7rem]">
          <Input
            label="Name"
            required
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            error={error?.fieldError('label')}
            maxLength={40}
            hint="Shown on the browse strip and every launch chip. The slug is derived from it."
            placeholder="Security & Privacy"
          />
          <Input
            label="Order"
            type="number"
            inputMode="numeric"
            value={order}
            onChange={(event) => setOrder(event.target.value)}
            error={error?.fieldError('order')}
            hint="Ascending."
          />
        </div>

        <Textarea
          label="Blurb (optional)"
          rows={2}
          value={blurb}
          onChange={(event) => setBlurb(event.target.value)}
          error={error?.fieldError('blurb')}
          maxLength={160}
          hint="One line, shown on the category page."
        />

        <IconPicker value={icon} onChange={setIcon} error={error?.fieldError('icon')} />

        <Button type="submit" loading={create.isPending} disabled={label.trim().length < 2}>
          Add category
        </Button>
      </form>
    </Card>
  );
}

/**
 * The curated set, as a grid of real icons.
 *
 * A dropdown of thirty names would be useless — nobody knows what
 * `wrench-screwdriver` looks like without seeing it. Rendered as a radiogroup so
 * arrow keys work and the selection is announced.
 */
function IconPicker({
  value,
  onChange,
  error,
}: {
  value: IconKey;
  onChange: (key: IconKey) => void;
  error?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em]">
        Icon
      </legend>
      <div
        role="radiogroup"
        aria-label="Category icon"
        className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-2"
      >
        {ICON_KEYS.map((key) => {
          const selected = key === value;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={key.replace(/-/g, ' ')}
              title={key.replace(/-/g, ' ')}
              onClick={() => onChange(key)}
              className={cn(
                'flex aspect-square items-center justify-center border border-edge transition-transform duration-[120ms] ease-[var(--ease-snap)]',
                selected
                  ? 'bg-pop text-on-pop shadow-hard-sm'
                  : 'bg-surface text-muted hover:-translate-y-0.5 hover:text-body',
              )}
            >
              {/* Rendered from the same map the category strip uses, so what you
                  pick here is exactly what appears on the site. */}
              <IconPreview iconKey={key} />
            </button>
          );
        })}
      </div>
      {error && (
        <p
          role="alert"
          className="mt-1.5 inline-block bg-edge px-1.5 py-0.5 font-mono text-[11px] font-bold uppercase text-canvas"
        >
          {error}
        </p>
      )}
    </fieldset>
  );
}

function IconPreview({ iconKey }: { iconKey: IconKey }) {
  const Icon = ICON_SET[iconKey];
  return <Icon className="size-5" aria-hidden="true" />;
}

/* ---------------------------------------------------------------- editing --- */

function CategoryRow({ category }: { category: CategoryCount }) {
  const update = useUpdateCategory();
  const remove = useDeleteCategory();

  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(category.label);
  const [icon, setIcon] = useState<IconKey>(category.icon as IconKey);

  const error =
    update.error instanceof RequestError
      ? update.error
      : remove.error instanceof RequestError
        ? remove.error
        : null;

  const save = () => {
    update.mutate(
      { id: category.id, label: label.trim(), icon },
      { onSuccess: () => setEditing(false) },
    );
  };

  return (
    <li
      className={cn(
        'rounded-slab border border-edge bg-surface p-3.5 shadow-hard-sm',
        !category.active && 'opacity-80',
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center border border-edge bg-surface-2">
          <CategoryIcon category={category.slug} className="size-5 text-body" aria-hidden />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-[13px] uppercase">
            {category.label}
            {!category.active && (
              <span className="ml-2 border border-edge bg-edge px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-canvas">
                Retired
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-[0.04em] text-muted">
            /{category.slug} · {category.count} {category.count === 1 ? 'launch' : 'launches'} ·
            order {category.order}
          </span>
        </span>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setEditing((open) => !open)}>
            {editing ? 'Cancel' : 'Edit'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            loading={update.isPending}
            onClick={() => update.mutate({ id: category.id, active: !category.active })}
          >
            {category.active ? 'Retire' : 'Reopen'}
          </Button>

          {/* Offered only when it would succeed. The server refuses a delete on
              anything holding launches, and a button that always errors is worse
              than no button. */}
          {category.count === 0 && (
            <Button
              variant="danger"
              size="sm"
              loading={remove.isPending}
              onClick={() => {
                if (window.confirm(`Delete "${category.label}"? It holds no launches.`)) {
                  remove.mutate(category.id);
                }
              }}
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 border border-edge bg-edge px-3 py-2 font-mono text-[11px] font-bold uppercase text-canvas"
        >
          {error.message}
        </p>
      )}

      {editing && (
        <div className="mt-4 space-y-4 border-t border-edge pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Name"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              maxLength={40}
            />
            <Input
              label="Slug"
              value={category.slug}
              readOnly
              hint="Fixed — every launch and every filter link uses it. Retire and re-add to change it."
            />
          </div>

          <IconPicker value={icon} onChange={setIcon} />

          <Button size="sm" loading={update.isPending} onClick={save}>
            Save changes
          </Button>
        </div>
      )}
    </li>
  );
}
