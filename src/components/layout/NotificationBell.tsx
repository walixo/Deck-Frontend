import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { useMarkAllRead, useNotifications } from '@/hooks/useNotifications';
import { cn, relativeTime } from '@/lib/utils';
import type { AppNotification, NotificationKind } from '@/types';

/**
 * A glyph per kind, so the list is scannable without reading it.
 *
 * Text, not icons: these sit at 13px beside a title, the set has to stay
 * distinguishable at that size, and adding fourteen SVGs to the bundle to
 * label fourteen rows is a poor trade. They are decorative — every row says
 * the same thing in words directly beside them.
 */
const GLYPH: Record<NotificationKind, string> = {
  'comment.received': '❝',
  'comment.replied': '↩',
  'review.received': '★',
  'launch.milestone': '▲',
  'launch.ranked': '#',
  'account.verified': '✓',
  'fundraise.reviewed': '◆',
  'acquisition.reviewed': '⇄',
  'merch.reviewed': '▣',
  'game.reviewed': '◈',
  'custom.reviewed': '✎',
  'content.moderated': '!',
  'fundraise.contribution': '₦',
  'order.status': '⬈',
};

function Row({ item, onNavigate }: { item: AppNotification; onNavigate: () => void }) {
  return (
    <Link
      to={item.link}
      onClick={onNavigate}
      className={cn(
        'flex gap-3 border-b border-edge px-3 py-2.5 transition-colors last:border-b-0',
        'hover:bg-surface-2',
        /* Unread rows are tinted rather than dotted. A per-row dot is another
           thing to align and to explain; a warmer ground reads instantly and
           degrades gracefully when every row is unread. */
        !item.read && 'bg-accent/5',
      )}
    >
      <span className="mt-0.5 shrink-0">
        {item.actor ? (
          <Avatar user={item.actor} size="xs" />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-7 items-center justify-center border border-edge bg-surface-2 font-mono text-[13px] text-muted"
          >
            {GLYPH[item.kind]}
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className={cn('block text-[13px] leading-snug', !item.read && 'font-bold')}>
          {item.title}
        </span>
        {item.body && (
          <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-muted">
            {item.body}
          </span>
        )}
        <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.06em] text-muted">
          {relativeTime(item.createdAt)}
        </span>
      </span>
    </Link>
  );
}

/**
 * The bell, its badge, and the panel behind it.
 *
 * Signed-out readers never see it — there is nothing to notify them about, and
 * most of Deck's traffic is signed out, so the header stays exactly as it was
 * for the people who are only reading.
 *
 * It sits beside the cart rather than inside the avatar menu. The avatar is a
 * menu of places to go; this is a list of things that happened, it needs a
 * count on it, and a badge on an avatar is ambiguous — is that unread mail, an
 * incomplete profile, or a notification? Two taps to reach something whose
 * whole purpose is to be noticed is one too many.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useNotifications(true);
  const markAllRead = useMarkAllRead();

  const items = data?.data ?? [];
  const unread = data?.meta.unread ?? 0;

  /* Opening the panel is the act that means "seen". Fired once per opening,
     and only when there is something to clear. */
  useEffect(() => {
    if (open && unread > 0) markAllRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the mutation is stable; re-running on it would loop
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent): void => {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        className="relative flex size-9 items-center justify-center rounded-slab border border-edge bg-surface shadow-hard-sm transition-[transform,box-shadow,background-color] duration-[120ms] ease-[var(--ease-snap)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-deep hover:text-on-deep hover:shadow-hard"
      >
        <span aria-hidden="true" className="text-sm">
          ◔
        </span>
        {/* Exactly the cart's badge — same offsets, same red, same border. The
            header already taught readers what that mark means. */}
        {unread > 0 && (
          <span className="absolute -right-2 -top-2 flex min-w-5 items-center justify-center border border-edge bg-red px-1 font-mono text-[10px] font-bold tabular-nums text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'z-50 animate-[var(--animate-slam)] border border-edge bg-surface shadow-hard-lg',
            /*
             * Anchored to the button on a wide screen, to the viewport on a
             * narrow one.
             *
             * `right-0` aligns the panel's right edge with the bell's, which
             * is fine while the bell is near the edge of the page. It is not:
             * the launch button and the avatar sit to its right, so at 560px
             * a 352px panel hung 80px off the left of the screen — measured,
             * not guessed. Below sm it becomes a sheet pinned to both edges
             * instead, which cannot overflow whatever the header is doing.
             */
            'fixed inset-x-2 top-[4.25rem]',
            'sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[22rem]',
          )}
        >
          <div className="flex items-center justify-between border-b border-edge px-3 py-2.5">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em]">
              Notifications
            </p>
            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className="font-mono text-[10px] uppercase text-muted underline-offset-4 hover:text-accent hover:underline"
            >
              Settings
            </Link>
          </div>

          <div className="max-h-[26rem] overflow-y-auto">
            {isLoading ? (
              <p className="px-3 py-6 text-center text-xs text-muted">Loading…</p>
            ) : items.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="font-display text-sm uppercase">Nothing yet</p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted text-pretty">
                  Comments on your launches, review decisions and order updates land here.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <Row key={item.id} item={item} onNavigate={() => setOpen(false)} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
