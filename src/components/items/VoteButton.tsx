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
  const [pop, setPop] = useState(false);

  const handleClick = (event: React.MouseEvent) => {
    // Vote buttons sit inside card links — never navigate on click.
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login', { state: { from: window.location.pathname, reason: 'vote' } });
      return;
    }

    if (!item.hasVoted) {
      setPop(true);
      window.setTimeout(() => setPop(false), 320);
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
        'group/vote flex shrink-0 items-center justify-center gap-1 border font-semibold transition-all duration-200 active:scale-95',
        stacked ? 'h-16 w-14 flex-col rounded-xl' : 'h-9 rounded-full px-3.5 text-sm',
        item.hasVoted
          ? 'border-brand-500/40 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
          : 'border-zinc-200 bg-white text-zinc-600 hover:border-brand-400 hover:bg-brand-50/60 hover:text-brand-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/10 dark:hover:text-brand-300',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'leading-none transition-transform duration-200 group-hover/vote:-translate-y-0.5',
          stacked ? 'text-[11px]' : 'text-[10px]',
          pop && 'animate-[var(--animate-pop)]',
        )}
      >
        ▲
      </span>
      <span className={cn('tabular-nums leading-none', stacked ? 'text-sm' : 'text-sm')}>
        {formatNumber(item.voteCount)}
      </span>
    </button>
  );
}
