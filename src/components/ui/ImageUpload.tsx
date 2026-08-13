import { useId, useRef, useState } from 'react';
import { RequestError, uploadImages } from '@/lib/api';
import { cn } from '@/lib/utils';

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png,image/gif,image/webp,image/avif';

interface ImageUploadProps {
  label: string;
  hint?: string;
  /** Stored paths. One entry when `max` is 1, otherwise the gallery. */
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  /** Preview box shape — square for a logo, wide for a cover or gallery shot. */
  aspect?: 'square' | 'wide';
  error?: string;
}

export function ImageUpload({
  label,
  hint,
  value,
  onChange,
  max = 1,
  aspect = 'wide',
  error,
}: ImageUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const remaining = max - value.length;
  const full = remaining <= 0;

  const accept = async (fileList: FileList | null) => {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return;

    setLocalError(null);

    // Reject oversized files before the request so the feedback is immediate.
    const tooBig = files.find((file) => file.size > MAX_BYTES);
    if (tooBig) {
      setLocalError(`"${tooBig.name}" is over 5MB`);
      return;
    }

    const batch = files.slice(0, remaining);
    if (files.length > remaining) {
      setLocalError(`Only ${remaining} more ${remaining === 1 ? 'image' : 'images'} will fit`);
    }

    setUploading(true);
    try {
      const urls = await uploadImages(batch);
      onChange([...value, ...urls].slice(0, max));
    } catch (caught) {
      setLocalError(caught instanceof RequestError ? caught.message : 'That upload failed');
    } finally {
      setUploading(false);
      // Clear the input so re-picking the same file still fires a change event.
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (url: string) => {
    setLocalError(null);
    onChange(value.filter((entry) => entry !== url));
  };

  const shown = error ?? localError;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label
          htmlFor={inputId}
          className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-body"
        >
          {label}
        </label>
        {max > 1 && (
          <span className="font-mono text-[11px] font-bold tabular-nums text-muted">
            {value.length}/{max}
          </span>
        )}
      </div>

      {value.length > 0 && (
        <ul
          className={cn(
            'mb-3 grid gap-2',
            aspect === 'square' ? 'grid-cols-[repeat(auto-fill,minmax(5rem,1fr))]' : 'grid-cols-3',
          )}
        >
          {value.map((url) => (
            <li key={url} className="relative">
              <img
                src={url}
                alt=""
                className={cn(
                  'w-full border-2 border-edge object-cover',
                  aspect === 'square' ? 'aspect-square' : 'aspect-video',
                )}
              />
              <button
                type="button"
                onClick={() => remove(url)}
                aria-label="Remove image"
                className="absolute -right-2 -top-2 flex size-6 items-center justify-center border-2 border-edge bg-edge text-[11px] font-bold text-canvas transition-transform duration-[120ms] ease-[var(--ease-snap)] hover:-translate-y-0.5"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!full && (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void accept(event.dataTransfer.files);
          }}
          className={cn(
            'rounded-slab border-2 border-dashed px-4 py-6 text-center transition-colors duration-[120ms]',
            dragging ? 'border-cobalt bg-acid/15' : 'border-edge',
          )}
        >
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={ACCEPT}
            multiple={max > 1}
            disabled={uploading}
            onChange={(event) => void accept(event.target.files)}
            className="sr-only"
          />

          <label
            htmlFor={inputId}
            className={cn(
              'inline-flex cursor-pointer items-center gap-2 border-2 border-edge bg-surface px-3.5 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.06em] shadow-hard-sm',
              'transition-[transform,box-shadow,background-color] duration-[120ms] ease-[var(--ease-snap)]',
              uploading
                ? 'pointer-events-none opacity-60'
                : 'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-acid hover:text-ink hover:shadow-hard',
            )}
          >
            {uploading && (
              <span
                aria-hidden="true"
                className="size-3 animate-spin border-2 border-current border-t-transparent"
              />
            )}
            {uploading ? 'Uploading' : value.length > 0 ? 'Add another' : 'Choose image'}
          </label>

          <p className="mt-2 font-mono text-[10px] uppercase text-muted">
            or drop {max > 1 ? 'images' : 'an image'} here · JPEG PNG GIF WebP AVIF · max 5MB
          </p>
        </div>
      )}

      {shown ? (
        <p role="alert" className="mt-1.5 inline-block bg-edge px-1.5 py-0.5 font-mono text-[11px] font-bold uppercase text-canvas">
          {shown}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}
