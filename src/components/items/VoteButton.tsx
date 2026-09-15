import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToggleVote } from '@/hooks/useVote';
import { cn, formatNumber } from '@/lib/utils';
import type { Item } from '@/types';

interface VoteButtonProps {
  item: Pick<Item, 'id' | 'name' | 'voteCount' | 'hasVoted'>;
  layout?: 'stacked' | 'inline';
  className?: string;
}

export function VoteButton({ item, layout = 'stacked', className }: VoteButtonProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toggleVote = useToggleVote();
  const [stamping, setStamping] = useState(false);

  const handleClick = (event: React.MouseEvent) => {
    // Vote buttons sit inside card links — never navigate on click.
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login', { state: { from: window.location.pathname, reason: 'vote' } });
      return;
    }

    // Only stamp on the way up; removing a vote should feel undramatic.
    if (!item.hasVoted) {
      setStamping(true);
      window.setTimeout(() => setStamping(false), 300);
    }

    toggleVote.mutate(item);
  };

  const stacked = layout === 'stacked';

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={item.hasVoted}
      aria-label={`${item.hasVoted ? 'Remove your upvote from' : 'Upvote'} ${item.name}`}
      className={cn(
        'group/vote flex shrink-0 items-center justify-center gap-1 rounded-slab border border-edge font-mono font-bold',
        'transition-[transform,box-shadow,background-color] duration-[120ms] ease-[var(--ease-snap)]',
        'hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
        /*
         * 36x36, down from 56x48 and then 44x40.
         *
         * The control repeats on every row of every list on the site, so its
         * size is a tax paid per launch — a column of twelve was 672px of
         * button at the original size and is 432px now. Square rather than
         * portrait: at this height the caret and the count no longer need a
         * taller box than they need a wider one.
         */
        stacked ? 'h-9 w-9 flex-col' : 'h-7 px-2.5',
        /* Primary in both states — it sits beside the comment button and the
           two are a matched pair. Voted is distinguished by the deeper fill and
           by `aria-pressed`, never by colour alone. */
        /* Secondary, like its partner. Voted is told apart by the filled
           accent and by `aria-pressed` — the one state that has earned colour,
           against a quiet resting state. */
        item.hasVoted
          ? 'bg-pop text-on-pop shadow-hard-sm'
          : 'bg-surface text-body shadow-hard-sm hover:bg-surface-2',
        stamping && 'animate-[var(--animate-stamp)]',
        className,
      )}
    >
      <span aria-hidden="true" className="text-[8px] leading-none">
        ▲
      </span>
      {/* 11px, not 13. `formatNumber` caps a count at five characters —
          "12.3k" — and at 13px mono that is 36px of glyph in a 34px box. */}
      <span className="text-[11px] leading-none tabular-nums">{formatNumber(item.voteCount)}</span>
    </button>
  );
}
