import { ChatBubbleOvalLeftIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import { cn, formatNumber } from '@/lib/utils';
import type { Item } from '@/types';

interface CommentButtonProps {
  item: Pick<Item, 'slug' | 'name' | 'commentCount'>;
  layout?: 'stacked' | 'inline';
  className?: string;
}

/**
 * Jumps straight into a launch's discussion, carrying its comment count.
 *
 * Sits beside the vote button and matches it exactly in shape, weight and
 * colour — the two are a pair of primary actions, and the whole point is that a
 * reader can react *or* respond without first opening the launch and hunting for
 * the thread.
 *
 * It is a button and not a link even though it navigates, for the same reason
 * the vote button is: both live inside a card that is itself an anchor. Nesting
 * an <a> inside an <a> is invalid and browsers resolve it unpredictably, so this
 * stops the outer navigation and routes deliberately.
 */
export function CommentButton({ item, layout = 'stacked', className }: CommentButtonProps) {
  const navigate = useNavigate();
  const stacked = layout === 'stacked';

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    /* The hash is what the item page scrolls to, so this lands on the thread
       rather than the top of a long description. */
    navigate(`/item/${item.slug}#discussion`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={
        item.commentCount === 1
          ? `Read the 1 comment on ${item.name}`
          : `Read ${item.commentCount} comments on ${item.name}, or add yours`
      }
      className={cn(
        'group/comment flex shrink-0 items-center justify-center gap-1 rounded-slab border border-edge font-mono font-bold',
        'transition-[transform,box-shadow,background-color] duration-[120ms] ease-[var(--ease-snap)]',
        /* The shadow stays small at rest and on hover — it lifts on hover by
           moving, not by growing. A tier change mid-interaction reads as the
           button changing size. */
        'hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
        /* Matched to VoteButton — the two are a pair and must stay the
           same height wherever they sit side by side, so this follows every
           time that one is resized. */
        stacked ? 'h-9 w-9 flex-col' : 'h-7 px-2.5',
        'bg-surface text-body shadow-hard-sm hover:bg-surface-2',
        className,
      )}
    >
      {/* Solid and small. The outline version at size-4 dominated a 48px
          button — the number is the information, the mark is only a label. */}
      <ChatBubbleOvalLeftIcon
        aria-hidden="true"
        className="size-2.5 shrink-0"
      />
      <span className="text-[11px] leading-none tabular-nums">
        {formatNumber(item.commentCount)}
      </span>
    </button>
  );
}
