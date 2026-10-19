/**
 * Where to send someone after they sign in — across the full-page redirect
 * of a GitHub or Google sign-in, which loses React Router's state.
 *
 * Kept in sessionStorage (this tab only, gone when it closes) and accepted
 * only as a same-site path: `/gameid/authorize?…` yes, `//evil.example` or
 * `https://…` never, so it cannot be turned into an open redirect.
 */
const KEY = 'deck-return-to';

export function isSafePath(path: unknown): path is string {
  return (
    typeof path === 'string' &&
    path.startsWith('/') &&
    !path.startsWith('//') &&
    !path.startsWith('/\\')
  );
}

export function rememberReturnTo(path: unknown): void {
  try {
    if (isSafePath(path)) sessionStorage.setItem(KEY, path);
    else sessionStorage.removeItem(KEY);
  } catch {
    /* Storage blocked: they land on the home page, which is the old behaviour. */
  }
}

export function takeReturnTo(): string | null {
  try {
    const path = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return isSafePath(path) ? path : null;
  } catch {
    return null;
  }
}
