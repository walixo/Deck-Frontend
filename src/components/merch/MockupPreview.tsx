import { useEffect, useRef, useState } from 'react';
import { drawMockup, type MockupPlacement, type MockupProduct } from '@/lib/mockup';
import { cn } from '@/lib/utils';

interface MockupPreviewProps {
  artworkUrl: string;
  product: MockupProduct;
  placement: MockupPlacement;
  garment: string;
  scale: number;
  className?: string;
}

/**
 * The live mockup.
 *
 * Redraws whenever anything about the choice changes, and on resize, because
 * the canvas backing store is sized to the element — a mockup that stays at its
 * mount-time resolution goes soft the moment the layout reflows.
 *
 * The image is loaded once per URL and held in state. Decoding a 4MB PNG on
 * every slider tick would make the scale control unusable; loading it once and
 * redrawing from the decoded bitmap is what keeps dragging smooth.
 */
export function MockupPreview({
  artworkUrl,
  product,
  placement,
  garment,
  scale,
  className,
}: MockupPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState<{ src: string; image: HTMLImageElement } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!artworkUrl) return;

    let live = true;
    const image = new Image();
    /* Same-origin uploads, but set anyway: without it an absolute URL would
       taint the canvas and any future "download this mockup" would throw. */
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      if (live) {
        setLoaded({ src: artworkUrl, image });
        setFailed(false);
      }
    };
    image.onerror = () => {
      if (live) setFailed(true);
    };
    image.src = artworkUrl;

    return () => {
      live = false;
    };
  }, [artworkUrl]);

  /* Derived rather than trusted: a slow decode landing after the artwork has
     changed would otherwise draw the previous file. */
  const image = loaded?.src === artworkUrl ? loaded.image : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const render = () => drawMockup(canvas, { product, placement, garment, scale, artwork: image });
    render();

    const observer = new ResizeObserver(render);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [image, product, placement, garment, scale]);

  return (
    <div
      className={cn(
        'relative aspect-square w-full overflow-hidden border border-edge bg-surface-2',
        className,
      )}
    >
      <canvas ref={canvasRef} className="size-full" aria-label="Mockup of your design" />

      {!image && (
        <p className="absolute inset-0 flex items-center justify-center px-6 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
          {failed ? 'That artwork could not be loaded' : 'Drawing your mockup…'}
        </p>
      )}
    </div>
  );
}
