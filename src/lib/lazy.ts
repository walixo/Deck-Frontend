import { lazy, type ComponentType } from 'react';

/**
 * `React.lazy` for a module that uses named exports.
 *
 * `lazy` only understands a module's `default` export, and every page and game
 * in this codebase is a named export. Rather than add a default export to each
 * one just to satisfy the loader, this re-shapes the module after it arrives:
 *
 *   const Games = lazyNamed(() => import('@/pages/Games'), 'Games');
 *
 * The `import()` has to be written out at the call site — not built from the
 * name in here — because the bundler can only split on a literal path it can
 * see. Two components from the same module (`Privacy` and `Terms`) share one
 * chunk and one request, whichever asks first.
 */
export function lazyNamed<K extends string, M extends Record<K, ComponentType>>(
  load: () => Promise<M>,
  name: K,
) {
  return lazy(() => load().then((module) => ({ default: module[name] })));
}
