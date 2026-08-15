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
        'group/vote flex shrink-0 items-center justify-center gap-1 rounded-slab border-2 border-edge font-mono font-bold',
        'transition-[transform,box-shadow,background-color] duration-[120ms] ease-[var(--ease-snap)]',
        'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
        stacked ? 'h-14 w-12 flex-col' : 'h-9 px-3.5',
        item.hasVoted
          ? 'bg-acid text-ink shadow-hard-sm'
          : 'bg-surface text-body shadow-hard-sm hover:bg-acid hover:text-ink',
        stamping && 'animate-[var(--animate-stamp)]',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('leading-none', stacked ? 'text-[10px]' : 'text-[9px]')}
      >
        ▲
      </span>
      <span className="text-sm leading-none tabular-nums">{formatNumber(item.voteCount)}</span>
    </button>
  );
}
