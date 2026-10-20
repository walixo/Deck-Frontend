import { useId, useRef, useState } from 'react';
import { ImageFramer } from '@/components/ui/ImageFramer';
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

  /*
   * Images waiting for the maker to size them, one at a time, and the ones
   * already decided. Nothing is uploaded until the whole batch has been
   * through the preview — so cancelling halfway leaves no orphaned files on
   * Cloudinary from the images that were framed before it.
   */
  const [queue, setQueue] = useState<File[]>([]);
  const ready = useRef<File[]>([]);

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

    /* GIFs skip the preview. Drawing one onto a canvas keeps only its first
       frame, so "framing" an animated GIF would silently turn it into a still
       — the opposite of what anybody uploading a GIF wants. */
    ready.current = batch.filter((file) => file.type === 'image/gif');
    const toFrame = batch.filter((file) => file.type !== 'image/gif');

    if (toFrame.length === 0) {
      await upload(ready.current);
      ready.current = [];
      return;
    }
    setQueue(toFrame);
  };

  /** Moves past the image in the preview, keeping it (framed or not) or not. */
  const advance = (keep?: File) => {
    if (keep) ready.current.push(keep);
    const rest = queue.slice(1);
    setQueue(rest);

    if (rest.length === 0) {
      const files = ready.current;
      ready.current = [];
      if (files.length > 0) void upload(files);
      else if (inputRef.current) inputRef.current.value = '';
    }
  };

  const upload = async (files: File[]) => {
    setUploading(true);
    try {
      const urls = await uploadImages(files);
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
          className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-body"
        >
          {label}
        </label>
        {max > 1 && (
          <span className="font-mono text-[11px] font-medium tabular-nums text-muted">
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
                  /* Contain, not cover: this thumbnail is the maker's check on
                     how the image will look, and a crop here would hide the
                     exact problem the preview exists to catch. */
                  'w-full border border-line bg-surface-2 object-contain',
                  aspect === 'square' ? 'aspect-square' : 'aspect-video',
                )}
              />
              <button
                type="button"
                onClick={() => remove(url)}
                aria-label="Remove image"
                className="glass-ink rounded-xl absolute -right-2 -top-2 flex size-6 items-center justify-center text-[11px] font-bold transition-transform duration-300 ease-[var(--ease-snap)]"
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
            'rounded-slab border border-dashed px-4 py-6 text-center transition-colors duration-300',
            dragging ? 'border-accent bg-pop/20' : 'border-line',
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
              'rounded-2xl inline-flex cursor-pointer items-center gap-2 border border-line bg-surface px-3.5 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.06em] shadow-hard-sm',
              'transition-[transform,box-shadow,background-color] duration-300 ease-[var(--ease-snap)]',
              uploading
                ? 'pointer-events-none opacity-60'
                : 'hover:-translate-y-0.5 hover:bg-deep hover:text-on-deep hover:shadow-hard',
            )}
          >
            {uploading && (
              <span
                aria-hidden="true"
                className="size-3 animate-spin border border-current border-t-transparent"
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
        <p
          role="alert"
          className="rounded-full mt-1.5 inline-block bg-edge px-1.5 py-0.5 font-mono text-[11px] font-medium uppercase text-canvas"
        >
          {shown}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>
      )}

      {/* Keyed on the file so each image in a batch gets a fresh preview —
          zoom and position from the last one must not carry over. */}
      {queue.length > 0 && (
        <ImageFramer
          key={`${queue[0].name}-${queue[0].size}-${queue[0].lastModified}`}
          file={queue[0]}
          shape={aspect}
          onDone={(framed) => advance(framed)}
          onUseOriginal={() => advance(queue[0])}
          onCancel={() => advance()}
        />
      )}
    </div>
  );
}
