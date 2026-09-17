import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthShell } from '@/components/auth/AuthShell';
import { ButtonLink } from '@/components/ui/Button';
import { InlineAlert } from '@/components/ui/States';
import { useAuth } from '@/hooks/useAuth';

/**
 * Where a provider sign-in lands.
 *
 * The API finished the exchange and signed a token; it arrives in the URL
 * *fragment* rather than the query string, because a fragment is never sent to
 * a server — not to this one, not in a Referer header to the next page, and
 * not into any access log along the way. The cost is that only JavaScript can
 * read it, which is exactly what this page is for.
 *
 * The first thing it does after reading is erase it from the address bar, so
 * the token does not survive in history or in a screenshot of a shared screen.
 */
export function AuthCallback() {
  const navigate = useNavigate();
  const { adoptToken } = useAuth();

  /*
   * The token is read during the first render, not in the effect.
   *
   * It decides what this page paints immediately: with no token there is
   * nothing to wait for, and discovering that in an effect would flash
   * "Signing you in" for a frame before correcting itself.
   *
   * A lazy initialiser is safe here only because reading the fragment is pure
   * — StrictMode runs it twice in development and both runs see the same URL.
   * Erasing it is a side effect and belongs in the effect below, which is also
   * the only place it is safe to do once.
   */
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token'));
  const [failed, setFailed] = useState(!token);

  useEffect(() => {
    /* Out of the address bar before anything else, so the token cannot be left
       in history, in a bookmark, or in a screenshot of a shared screen. */
    window.history.replaceState(null, '', window.location.pathname);
    if (!token) return;

    let cancelled = false;
    adoptToken(token)
      .then(() => {
        if (!cancelled) navigate('/', { replace: true });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [token, adoptToken, navigate]);

  return (
    <AuthShell
      title={failed ? 'That did not work' : 'Signing you in'}
      subtitle={failed ? 'The sign-in could not be completed.' : 'One moment while we finish up.'}
      footer={null}
    >
      {failed ? (
        <div className="space-y-4">
          <InlineAlert>
            That sign-in link was already used or has expired. Please start again.
          </InlineAlert>
          <ButtonLink to="/login" size="lg" className="w-full">
            Back to sign in
          </ButtonLink>
        </div>
      ) : (
        <p className="text-sm text-muted" role="status">
          Finishing sign-in…
        </p>
      )}
    </AuthShell>
  );
}
