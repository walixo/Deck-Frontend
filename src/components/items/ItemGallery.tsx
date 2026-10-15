import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ItemGalleryProps {
  images: string[];
  name: string;
}

/**
 * Screenshot gallery: one large frame with thumbnails beneath. Deliberately not
 * a lightbox — a launch page should show the work without trapping focus in a
 * modal.
 */
export function ItemGallery({ images, name }: ItemGalleryProps) {
  const [active, setActive] = useState(0);

  if (images.length === 0) return null;

  const current = images[Math.min(active, images.length - 1)];

  return (
    <section aria-labelledby="gallery-heading" className="mt-10">
      <h2 id="gallery-heading" className="mb-4 text-xl">
        Screenshots
      </h2>

      {/*
       * The whole screenshot, always, with its own colours behind it.
       *
       * It was already `object-contain`, so nothing was cropped here — but a
       * tall phone screenshot in a 16:9 frame sat between two flat grey slabs
       * that read as a broken layout. The blurred copy fills that space with
       * the image's own palette instead. Images sized through the upload
       * preview already match the frame, so this only shows on older ones.
       */}
      <figure className="relative aspect-video w-full overflow-hidden border border-line bg-surface-2 shadow-hard">
        <img
          src={current}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full scale-110 object-cover opacity-40 blur-2xl"
        />
        <img
          src={current}
          alt={`${name} screenshot ${active + 1} of ${images.length}`}
          className="relative size-full object-contain"
        />
      </figure>

      {images.length > 1 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {images.map((image, index) => (
            <li key={image}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-current={index === active}
                aria-label={`Show screenshot ${index + 1}`}
                className={cn(
                  'block border transition-transform duration-300 ease-[var(--ease-snap)] hover:-translate-y-0.5',
                  index === active ? 'border-accent' : 'border-line opacity-60 hover:opacity-100',
                )}
              >
                {/* Contain here too: a thumbnail that crops is a thumbnail of
                    a different picture from the one it opens. */}
                <img src={image} alt="" className="h-14 w-24 bg-surface-2 object-contain" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
