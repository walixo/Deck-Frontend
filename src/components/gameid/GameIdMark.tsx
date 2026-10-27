import { GAMEID_MARK_LAYERS, GAMEID_MARK_VIEWBOX } from '@/lib/gameIdMark';
import { cn } from '@/lib/utils';

/**
 * The GameID mark: an ember controller — a d-pad and four buttons — standing
 * on a white slab, the same raised, hard-edged step as Deck's buttons.
 *
 * Full colour everywhere, so it reads the same on night, on paper and on the
 * sign-in button other sites embed. A faint outer edge keeps the white slab
 * visible on light backgrounds. The drawing lives in `lib/gameIdMark.ts`.
 */
export function GameIdMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox={GAMEID_MARK_VIEWBOX}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={cn('block', className)}
    >
      {title && <title>{title}</title>}
      {/* Fixed markup from lib/gameIdMark.ts, never user input. */}
      <g dangerouslySetInnerHTML={{ __html: GAMEID_MARK_LAYERS }} />
    </svg>
  );
}
