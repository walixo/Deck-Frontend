import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { InlineAlert } from '@/components/ui/States';
import { useUpdateItem } from '@/hooks/useItems';
import { RequestError } from '@/lib/api';
import type { ItemDetail } from '@/types';

/**
 * Owner-only panel for adding or replacing a launch's images after it has gone
 * live — the submit form is not the only chance to get artwork on a product.
 */
export function ManageImages({ item }: { item: ItemDetail }) {
  const [open, setOpen] = useState(false);
  const [logo, setLogo] = useState<string[]>(item.logoUrl ? [item.logoUrl] : []);
  const [cover, setCover] = useState<string[]>(item.coverUrl ? [item.coverUrl] : []);
  const [gallery, setGallery] = useState<string[]>(item.gallery ?? []);

  const updateItem = useUpdateItem(item.slug);
  const error = updateItem.error instanceof RequestError ? updateItem.error : null;

  // Empty strings clear a field server-side; undefined would leave it untouched.
  const save = () =>
    updateItem.mutate(
      { id: item.id, logoUrl: logo[0] ?? '', coverUrl: cover[0] ?? '', gallery },
      { onSuccess: () => setOpen(false) },
    );

  if (!open) {
    return (
      <Button variant="secondary" size="sm" className="w-full" onClick={() => setOpen(true)}>
        Manage images
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      {error && !error.fields.length && <InlineAlert>{error.message}</InlineAlert>}

      <ImageUpload
        label="Logo"
        aspect="square"
        value={logo}
        onChange={setLogo}
        error={error?.fieldError('logoUrl')}
      />
      <ImageUpload
        label="Cover image"
        value={cover}
        onChange={setCover}
        error={error?.fieldError('coverUrl')}
      />
      <ImageUpload
        label="Gallery"
        max={6}
        value={gallery}
        onChange={setGallery}
        error={error?.fieldError('gallery')}
      />

      <div className="flex gap-2">
        <Button size="sm" className="flex-1" loading={updateItem.isPending} onClick={save}>
          Save images
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
