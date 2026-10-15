import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

/**
 * The output size for each frame shape, in pixels.
 *
 * Fixed rather than taken from the source, so every gallery image on a launch
 * is the same shape and the same size — the slider never jumps between a tall
 * screenshot and a wide one. 1600 wide is enough for a sharp full-width image
 * on a laptop and comfortably inside the 5MB upload limit as WebP.
 */
export const FRAMES = {
  wide: { width: 1600, height: 900, label: '16:9' },
  square: { width: 800, height: 800, label: '1:1' },
} as const;

export type FrameShape = keyof typeof FRAMES;

type Backdrop = 'transparent' | 'dark' | 'light';

const BACKDROP_FILL: Record<Exclude<Backdrop, 'transparent'>, string> = {
  dark: '#111111',
  light: '#ffffff',
};

/** How far past "fill" the zoom goes, for cropping in on a detail. */
const MAX_ZOOM_OVER_FILL = 3;

interface ImageFramerProps {
  file: File;
  shape: FrameShape;
  /** The framed image, ready to upload. */
  onDone: (framed: File) => void;
  /** Upload the original exactly as chosen, unframed. */
  onUseOriginal: () => void;
  onCancel: () => void;
}

/**
 * A preview that lets the maker size an image into the frame it will be shown
 * in, before it is uploaded.
 *
 * The preview *is* the output. It is drawn on a canvas at the real export
 * size and scaled down for display, and exporting reads that same canvas — so
 * what the maker sees is byte-for-byte what gets uploaded. A CSS preview with
 * a separate export path would be two renderings of the same intent, and the
 * day they disagree is the day somebody's screenshot loses its edge.
 *
 * Three ways to get there:
 *  - **Fit** shows the whole image, with the leftover space filled by the
 *    backdrop. Right for screenshots, where cutting anything off is the
 *    failure this exists to fix.
 *  - **Fill** covers the frame edge to edge and crops the overflow. Right for
 *    photos, where letterboxing looks like a mistake.
 *  - The **zoom** slider and dragging cover everything in between.
 *
 * A transparent backdrop is the default, exported as WebP with its alpha kept,
 * so the letterbox takes whatever colour sits behind it on the page and is
 * correct in both themes. Dark and light are there for when an image needs a
 * solid ground baked in, such as a logo going onto a share card.
 */
export function ImageFramer({ file, shape, onDone, onUseOriginal, onCancel }: ImageFramerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width: W, height: H, label } = FRAMES[shape];

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [backdrop, setBackdrop] = useState<Backdrop>('transparent');
  const [exporting, setExporting] = useState(false);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  /* The two scales everything else is measured against. */
  const fitScale = image ? Math.min(W / image.naturalWidth, H / image.naturalHeight) : 1;
  const fillScale = image ? Math.max(W / image.naturalWidth, H / image.naturalHeight) : 1;
  const maxScale = fillScale * MAX_ZOOM_OVER_FILL;

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  /* Decode the file once. Starts on Fit, because the bug this exists to fix
     was images losing their edges — the safe first view shows all of it. */
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setScale(Math.min(W / img.naturalWidth, H / img.naturalHeight));
      setOffset({ x: 0, y: 0 });
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file, W, H]);

  /**
   * Keeps the image covering whatever it can cover.
   *
   * On an axis where the scaled image is larger than the frame, it can slide
   * only as far as its own edge — never far enough to open a gap. On an axis
   * where it is smaller, it stays centred; there is nothing to reveal by
   * moving it, and letting it drift would only make a lopsided letterbox.
   */
  const clamp = useCallback(
    (x: number, y: number, s: number) => {
      if (!image) return { x: 0, y: 0 };
      const spareX = Math.max(0, (image.naturalWidth * s - W) / 2);
      const spareY = Math.max(0, (image.naturalHeight * s - H) / 2);
      return {
        x: Math.min(spareX, Math.max(-spareX, x)),
        y: Math.min(spareY, Math.max(-spareY, y)),
      };
    },
    [image, W, H],
  );

  /* Redraw on every change. Cheap — one image, one canvas. */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);
    if (backdrop !== 'transparent') {
      ctx.fillStyle = BACKDROP_FILL[backdrop];
      ctx.fillRect(0, 0, W, H);
    }

    const w = image.naturalWidth * scale;
    const h = image.naturalHeight * scale;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, (W - w) / 2 + offset.x, (H - h) / 2 + offset.y, w, h);
  }, [image, scale, offset, backdrop, W, H]);

  const zoomTo = (next: number) => {
    const s = Math.min(maxScale, Math.max(fitScale, next));
    setScale(s);
    setOffset((current) => clamp(current.x, current.y, s));
  };

  /* Screen pixels to canvas pixels: the canvas is drawn at export size and
     shrunk by CSS, so a 10px drag on screen is more than 10px in the image. */
  const toCanvas = (screenDelta: number): number => {
    const canvas = canvasRef.current;
    return canvas ? screenDelta * (W / canvas.clientWidth) : screenDelta;
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current) return;
    const { x, y, ox, oy } = drag.current;
    setOffset(clamp(ox + toCanvas(event.clientX - x), oy + toCanvas(event.clientY - y), scale));
  };

  const onPointerUp = () => {
    drag.current = null;
  };

  /* Arrow keys pan, so positioning is not a pointer-only ability. Shift moves
     further, for crossing a large image without forty key presses. */
  const onKeyDown = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
    const step = event.shiftKey ? 80 : 16;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    setOffset((current) => clamp(current.x + move[0], current.y + move[1], scale));
  };

  /**
   * Reads the canvas back out as a file.
   *
   * WebP first, because it keeps the alpha channel a transparent letterbox
   * needs and compresses photographs to a fraction of PNG's size. A browser
   * that cannot encode WebP hands back a PNG instead, and the blob's own type
   * says which — so the filename is built from what was actually produced,
   * not from what was asked for.
   */
  const exportFramed = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setExporting(true);
    canvas.toBlob(
      (blob) => {
        setExporting(false);
        if (!blob) return;
        const ext = blob.type === 'image/webp' ? 'webp' : 'png';
        const base = file.name.replace(/\.[^.]+$/, '') || 'image';
        onDone(new File([blob], `${base}-framed.${ext}`, { type: blob.type }));
      },
      'image/webp',
      0.9,
    );
  };

  const percent = Math.round((scale / fillScale) * 100);

  return (
    <dialog
      ref={dialogRef}
      onClose={onCancel}
      aria-labelledby="framer-heading"
      className={cn(
        'w-[min(46rem,94vw)] rounded-slab border border-line bg-surface p-0 text-body shadow-hard-lg',
        /* `m-auto` restores the centring Tailwind's preflight removes from a
           modal dialog — the same fix the acquisition dialog carries. */
        'm-auto max-h-[92dvh] overflow-y-auto',
        'backdrop:bg-edge/60',
      )}
    >
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
          <h2 id="framer-heading" className="font-display text-lg">
            Size your image
          </h2>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
            {label} frame — exactly as it will show
          </p>
        </div>

        {/*
         * A checkerboard behind the canvas, so a transparent letterbox reads
         * as "nothing here" rather than as the panel's own colour — which is
         * what it would otherwise look like, and would hide the very gap the
         * maker is deciding about.
         */}
        <div
          className="mt-4 overflow-hidden rounded-slab border border-line"
          style={{
            backgroundImage:
              'repeating-conic-gradient(var(--color-surface-2) 0% 25%, transparent 0% 50%)',
            backgroundSize: '20px 20px',
          }}
        >
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            tabIndex={0}
            role="img"
            aria-label="Preview of the framed image. Drag, or use the arrow keys, to reposition it."
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={(event) => zoomTo(scale * (event.deltaY < 0 ? 1.06 : 1 / 1.06))}
            onKeyDown={onKeyDown}
            className="block h-auto w-full cursor-grab touch-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent active:cursor-grabbing"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={Math.abs(scale - fitScale) < 1e-6 ? 'primary' : 'secondary'}
            onClick={() => {
              setScale(fitScale);
              setOffset({ x: 0, y: 0 });
            }}
          >
            Fit — show all
          </Button>
          <Button
            type="button"
            size="sm"
            variant={Math.abs(scale - fillScale) < 1e-6 ? 'primary' : 'secondary'}
            onClick={() => {
              setScale(fillScale);
              setOffset({ x: 0, y: 0 });
            }}
          >
            Fill — crop to frame
          </Button>

          <label className="ml-auto flex min-w-[12rem] flex-1 items-center gap-3 sm:flex-none">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
              Zoom
            </span>
            <input
              type="range"
              min={fitScale}
              max={maxScale}
              step={(maxScale - fitScale) / 200 || 0.001}
              value={scale}
              onChange={(event) => zoomTo(Number(event.target.value))}
              className="w-full accent-[var(--color-accent)]"
            />
            <span className="w-10 text-right font-mono text-[11px] tabular-nums text-muted">
              {percent}%
            </span>
          </label>
        </div>

        {/* Only matters when the image does not cover the frame, so it says so
            rather than offering a choice that changes nothing visible. */}
        <fieldset className="mt-4 flex flex-wrap items-center gap-2">
          <legend className="sr-only">Background for any empty space</legend>
          <span className="mr-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
            Empty space
          </span>
          {(['transparent', 'dark', 'light'] as Backdrop[]).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={backdrop === option}
              onClick={() => setBackdrop(option)}
              className={cn(
                'rounded-full border px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.06em] transition-colors',
                backdrop === option
                  ? 'border-accent bg-accent/10 text-body'
                  : 'border-line text-muted hover:text-body',
              )}
            >
              {option === 'transparent' ? 'Clear' : option}
            </button>
          ))}
          <span className="text-xs text-muted">Clear matches whichever theme the page is in.</span>
        </fieldset>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <Button type="button" variant="ghost" size="sm" onClick={onUseOriginal}>
            Upload the original instead
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => dialogRef.current?.close()}>
              Cancel
            </Button>
            <Button type="button" onClick={exportFramed} loading={exporting} disabled={!image}>
              Use this
            </Button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
