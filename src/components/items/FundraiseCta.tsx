import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import type { Item } from '@/types';

/** Where the full fundraise panel lives on the page. */
const PANEL_ID = 'fundraise';

/**
 * The raise button in the launch's action row.
 *
 * A shortcut to the panel, not a second implementation of it. Every condition
 * it tests comes off `item.fundraise` exactly as the server computed it —
 * `open` and `eligibility.met` — rather than being re-derived here from vote
 * and comment counts. The serializer makes the point directly: the thresholds
 * are the server's rule, and a client that guesses them eventually guesses
 * wrong, in the specific way that shows somebody an enabled button the API
 * then refuses.
 *
 * It is also not a gate. `applyForFundraise` re-checks traction on every call
 * regardless of what the UI offered, because hiding a button does not stop
 * anybody from posting to the endpoint. This is a convenience on top of a rule
 * enforced somewhere it cannot be skipped.
 *
 * Three states, and two of them render nothing:
 *
 *  - Taking money, and you are not the maker → back it.
 *  - You are the maker, you have the traction, and you have either never
 *    applied or been turned down → apply. Reapplying after a rejection is
 *    allowed by the state machine, so it is offered here too.
 *  - Anything else — pending review, paused, approved-but-no-target, or short
 *    of the thresholds → nothing. The sidebar already explains where the
 *    launch stands, and a disabled button in the hero says less than the
 *    "3 votes to go" the panel is already showing.
 */
export function FundraiseCta({ item }: { item: Item }) {
  const { user } = useAuth();
  const { open, status, eligibility } = item.fundraise;

  /*
   * The real owner, not the page's `isOwner`.
   *
   * That flag is `owner || admin`, which is the right question for the edit
   * and moderation tools and the wrong one here. Passing it in denied staff
   * the back button on every launch on the site, and — worse — offered them
   * "Raise funding" on launches they do not own, where `applyForFundraise`
   * answers "Only the person who launched this can apply". A button that
   * leads to a refusal is the exact failure this component is written to
   * avoid, so it asks the narrower question itself rather than trusting a
   * caller to pass the right one.
   */
  const isMine = user?.id === item.submittedBy.id;

  const canApply = isMine && (status === 'none' || status === 'rejected') && eligibility.met;
  const canBack = open && !isMine;

  if (!canBack && !canApply) return null;

  /*
   * Scrolled to rather than linked to.
   *
   * React Router does not scroll to a hash on navigation, so `to="#fundraise"`
   * would change the URL and leave the reader exactly where they were —
   * looking at a button that appeared to do nothing. Moving the page directly
   * is the honest version, and on a launch page the panel is always already
   * mounted.
   */
  const focusPanel = (): void => {
    document.getElementById(PANEL_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <Button variant="secondary" size="md" onClick={focusPanel}>
      {canBack ? 'Back this project' : 'Raise funding'}
    </Button>
  );
}
