import { useMemo } from 'react';
import { qrMatrix } from '@/lib/qr';
import { cn } from '@/lib/utils';

/**
 * A QR code for a link, drawn as one SVG path in `currentColor`.
 *
 * Carries its own two-module quiet zone, so it scans wherever it is put — but
 * it wants a light ground behind it: phone cameras read dark-on-light far more
 * reliably than the reverse.
 */
export function QrCode({
  value,
  label,
  className,
}: {
  value: string;
  /** What scanning it opens, for anyone who cannot see it. */
  label: string;
  className?: string;
}) {
  const { d, size } = useMemo(() => {
    const matrix = qrMatrix(value);
    let path = '';
    matrix.forEach((row, y) =>
      row.forEach((dark, x) => {
        if (dark) path += `M${x} ${y}h1v1h-1z`;
      }),
    );
    return { d: path, size: matrix.length };
  }, [value]);

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`-2 -2 ${size + 4} ${size + 4}`}
      shapeRendering="crispEdges"
      className={cn('block', className)}
    >
      <path d={d} fill="currentColor" />
    </svg>
  );
}
