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
      <h2 id="gallery-heading" className="mb-4 text-xl uppercase">
        Screenshots
      </h2>

      <figure className="border-2 border-edge shadow-hard">
        <img
          src={current}
          alt={`${name} screenshot ${active + 1} of ${images.length}`}
          className="aspect-video w-full bg-grey/30 object-contain"
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
                  'block border-2 transition-transform duration-[120ms] ease-[var(--ease-snap)] hover:-translate-y-0.5',
                  index === active ? 'border-cobalt' : 'border-edge opacity-60 hover:opacity-100',
                )}
              >
                <img src={image} alt="" className="h-14 w-24 bg-grey/30 object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
