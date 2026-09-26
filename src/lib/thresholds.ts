/**
 * When the landing page starts quoting numbers.
 *
 * Below this, the hero shows no stat tiles (the founding-board card that used
 * to fill the slot is parked), and the vortex says "the whole board" instead
 * of a count. Both read it from here so they switch on the same day — stat
 * tiles in the hero above a vortex without a number, or the other way round,
 * would contradict each other.
 *
 * Its own file rather than exported from `Hero`, because a component module
 * that also exports a constant breaks React fast refresh for that file.
 *
 * Both have to clear. Fifty launches from three accounts is not a community,
 * and it would say so the moment somebody looked.
 */
export const STATS_SHOWN_FROM = { launches: 50, makers: 20 };
