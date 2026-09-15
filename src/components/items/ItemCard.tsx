import { Link } from 'react-router-dom';
import { CategoryIcon, CategoryLabel } from '@/components/illustrations/CategoryIcon';
import { Badge } from '@/components/ui/Badge';
import { Stars } from '@/components/ui/Stars';
import { MEDAL_STYLES, cn, PRICING_LABELS } from '@/lib/utils';
import type { Item } from '@/types';
import { ItemLogo } from './ItemLogo';
import { CommentButton } from './CommentButton';
import { VoteButton } from './VoteButton';

interface ItemCardProps {
  item: Item;
  rank?: number;
  /**
   * `card` is the bordered, shadowed block — right where a launch sits among
   * other blocks and needs to be picked out of them: the daily board, a
   * profile, the related strip.
   *
   * `plain` drops the container entirely. On Discover the launches *are* the
   * page, so there is nothing to distinguish them from — and thirty identical
   * bordered blocks with hard shadows stacked vertically stop reading as thirty
   * products and start reading as texture. Without the box each one is its own
   * object on the page, separated by space alone.
   *
   * The hard hover lift goes with the box — nothing is being lifted off
   * anything — and is replaced by a tint. On a list with no borders the only
   * honest way to say "this row" is to change the ground under it.
   */
  variant?: 'card' | 'plain';
  /**
   * Caps how wide the text column may grow.
   *
   * Without it, `flex-1` pushes the vote control to whatever the container's far
   * edge happens to be — which on a wide page strands it a long way from the
   * launch it belongs to, and moves it every time the layout changes width.
   * Bounding the text instead puts the button a fixed distance from the left on
   * every row, so the column of vote counts lines up and each one still reads as
   * attached to its own launch.
   */
  measure?: string;
  /** Discover hides the comment button; commenting still lives on the launch. */
  showComment?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function ItemCard({
  item,
  rank,
  variant = 'card',
  measure,
  showComment = true,
  className,
  style,
}: ItemCardProps) {
  const plain = variant === 'plain';

  /*
   * The metadata row's parts, in order, minus whichever do not apply.
   *
   * Category is dropped on the plain rows. Discover is the only place they are
   * used and it already has the categories as a filter bar directly above the
   * list — so the label on every row is repeating a control the reader has just
   * scrolled past, in the one place on the site where horizontal space is
   * tightest. The bordered card keeps it: there, the launch is out on its own
   * with no filter bar in sight.
   */
  const meta: { key: string; node: React.ReactNode }[] = [];

  if (!plain) {
    meta.push({
      key: 'category',
      node: (
        <Link
          to={`/discover?category=${item.category}`}
          className="relative z-10 inline-flex shrink-0 items-center gap-1.5 text-body transition-colors hover:text-accent"
        >
          <CategoryIcon category={item.category} className="size-3.5" />
          <CategoryLabel slug={item.category} />
        </Link>
      ),
    });
  }

  meta.push({
    key: 'pricing',
    node: <span className="shrink-0">{PRICING_LABELS[item.pricing]}</span>,
  });

  if (item.reviewCount > 0) {
    meta.push({
      key: 'rating',
      node: (
        <span className="inline-flex shrink-0 items-center gap-1.5">
          <Stars value={item.ratingAvg} />
          <span className="tabular-nums">{item.ratingAvg.toFixed(1)}</span>
        </span>
      ),
    });
  }

  if (item.commentCount > 0) {
    meta.push({
      key: 'comments',
      node: (
        <span className="shrink-0 tabular-nums">
          {item.commentCount} {item.commentCount === 1 ? 'comment' : 'comments'}
        </span>
      ),
    });
  }

  return (
    <article
      style={style}
      className={cn(
        /*
         * `min-w-0`, or the row is wider than the phone it is on.
         *
         * A grid item's default `min-width` is `auto`, which is its min-content
         * width — and this card's min-content is enormous, because the title
         * is `truncate` and the metadata row is `whitespace-nowrap`, and
         * neither of those offers the layout a place to break. So the single
         * column on a 375px screen was resolving to 435px and taking the whole
         * page sideways with it. Clipping only starts once the box is allowed
         * to be narrower than its contents.
         */
        'group relative min-w-0',
        plain && 'rounded-slab px-3 py-3',
        /* Barely there on purpose. At 45% of surface-2 the tint reads as the
           row waking up rather than as a selection — enough to track the
           pointer down a long list, not enough to notice one at a time. */
        plain && 'transition-colors duration-[140ms] hover:bg-surface-2/45',
        !plain && 'rounded-slab border border-edge bg-surface p-3.5 shadow-hard',
        !plain && 'transition-[transform,box-shadow] duration-[120ms] ease-[var(--ease-snap)]',
        !plain && 'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {rank !== undefined && (
          <span
            className={cn(
              'mt-0.5 flex size-7 shrink-0 items-center justify-center border border-edge font-mono text-xs font-bold tabular-nums',
              MEDAL_STYLES[rank] ?? 'bg-surface-2 text-muted',
            )}
            aria-label={`Rank ${rank}`}
          >
            {rank}
          </span>
        )}

        {/* One size everywhere now. The plain variant used `lg` on the theory
            that a row with no card needs a bigger anchor, but a 56px mark on a
            three-line row is most of the row's height — and it was the single
            largest thing standing between somebody opening Discover and seeing
            more than four launches. */}
        <ItemLogo item={item} size="md" className="mt-0.5" />

        <div className={cn('min-w-0 flex-1', measure)}>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3
              className={cn(
                'truncate text-base leading-tight',
                /*
                 * Plain rows set their titles in Geist, sentence case.
                 *
                 * Discover is the only place this variant is used, and it is the
                 * one screen that is nothing but titles — two columns of them,
                 * twelve at a time. Archivo Black is a display face: it earns
                 * its weight on a hero, and repeated twelve times down a list it
                 * stops reading as emphasis and starts reading as noise. Caps
                 * compound that, and they also throw away a real signal — the
                 * shape of a product's own name. "Tinder Box" is how its maker
                 * writes it; "TINDER BOX" is how a stylesheet writes it.
                 */
                plain ? 'font-sans font-normal' : 'uppercase',
              )}
            >
              {/* The whole card is clickable via this stretched link. */}
              <Link to={`/item/${item.slug}`} className="hover:underline">
                <span className="absolute inset-0 z-0" aria-hidden="true" />
                <span className="relative">{item.name}</span>
              </Link>
            </h3>
            {item.featured && (
              <Badge tone="pop" className="relative z-10">
                ★ Spotlight
              </Badge>
            )}
          </div>

          <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted text-pretty">
            {item.tagline}
          </p>

          {/* Set in Geist, like the tagline above it, rather than Geist Mono.
              The house rule is that mono marks a machine value, and most of
              this row is not one — a licence is a word. Keeping the counts in
              `tabular-nums` holds the columns steady without putting the whole
              line in a typewriter face. */}
          {/*
           * One line that clips, rather than a row that wraps.
           *
           * In a half-width column this row has about 300px to work with — so
           * it wrapped, and a card whose height depends on how long its licence
           * is cannot be laid out in a grid. Clipping lets the tail go on
           * narrow cards; the full set is on the launch page.
           *
           * Assembled as a list rather than written out inline, because the
           * separators are *between* the parts and any of the parts can be
           * absent. Written inline, each one had to carry its own leading
           * slash, which only worked while the first item — the category — was
           * always present; the moment it came off Discover the row began with
           * a stray divider.
           */}
          {/* Wraps below md, clips from md up. The two-column grid starts at md
              and rows in it have to agree on a height, so that is exactly where
              a row of variable height stops being allowed — below it every card
              is its own grid row and can be as tall as it needs. Which is why
              the tail no longer gets cut off on a phone, where the column is
              210px and the licence, rating and comment count are 265px. */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 overflow-hidden whitespace-nowrap font-sans text-[11px] font-bold uppercase tracking-[0.04em] text-muted max-md:gap-x-3.5 md:flex-nowrap">
            {meta.map((part, index) => (
              /*
               * The separator travels inside the part it precedes, and only
               * exists where the row is one line.
               *
               * As a sibling it was free to be the last thing on a wrapped
               * line — "Paid / ★★★★ 4.0 /", a divider with nothing after it.
               * Moving it inside fixed that and produced the mirror image, a
               * line beginning "/ 2 comments". A divider is punctuation
               * *between* things on a line; once the row wraps, the line break
               * is already doing that job and the gap is enough.
               */
              <span key={part.key} className="inline-flex shrink-0 items-center gap-x-2.5">
                {index > 0 && (
                  <span aria-hidden="true" className="hidden text-muted/50 md:inline">
                    /
                  </span>
                )}
                {part.node}
              </span>
            ))}
          </div>
        </div>

        {/* React, or respond, without opening the launch first. Stacked on the
            narrowest screens so a long product name is not squeezed into
            nothing. Sits immediately after the text column rather than being
            pushed to the container's edge — see `measure`. */}
        <div className="relative z-10 mt-0.5 flex shrink-0 flex-col gap-1.5 sm:flex-row">
          {showComment && <CommentButton item={item} />}
          <VoteButton item={item} />
        </div>
      </div>
    </article>
  );
}
