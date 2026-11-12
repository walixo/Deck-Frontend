import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { APP, deckHref } from '@/lib/host';

/**
 * A link to a page on Deck proper, from anywhere.
 *
 * On Deck it is an ordinary router link and the navigation never touches the
 * network. On a subdomain — Vault, Deck Games — the page is on another origin,
 * so it has to be a real anchor and a real navigation. Writing it either way by
 * hand gets one of the two wrong: a `<Link to="/terms">` from Deck Games lands
 * on the arcade's catch-all, and a hardcoded absolute URL on Deck throws away
 * the whole SPA for a link that did not need to leave.
 */
export function DeckLink({
  to,
  className,
  children,
  title,
  'aria-label': ariaLabel,
}: {
  to: string;
  className?: string;
  children: ReactNode;
  title?: string;
  'aria-label'?: string;
}) {
  if (APP === 'deck') {
    return (
      <Link to={to} className={className} title={title} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }
  return (
    <a href={deckHref(to)} className={className} title={title} aria-label={ariaLabel}>
      {children}
    </a>
  );
}
