import {
  ArrowTrendingUpIcon,
  BanknotesIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
  FireIcon,
  GiftIcon,
  HandThumbUpIcon,
  HeartIcon,
  RocketLaunchIcon,
  ShoppingBagIcon,
  Square3Stack3DIcon,
  StarIcon,
  TrophyIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/solid';
import {
  ArrowTrendingUpIcon as ArrowTrendingUpOutline,
  BanknotesIcon as BanknotesOutline,
  BoltIcon as BoltOutline,
  ChatBubbleLeftRightIcon as ChatOutline,
  CheckBadgeIcon as CheckBadgeOutline,
  FireIcon as FireOutline,
  GiftIcon as GiftOutline,
  HandThumbUpIcon as HandThumbUpOutline,
  HeartIcon as HeartOutline,
  RocketLaunchIcon as RocketOutline,
  ShoppingBagIcon as ShoppingBagOutline,
  Square3Stack3DIcon as StackOutline,
  StarIcon as StarOutline,
  TrophyIcon as TrophyOutline,
  PaperAirplaneIcon as PaperAirplaneOutline,
} from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

interface BadgeArt {
  /** Filled once earned — the outline reads as an outline of a thing not yet had. */
  solid: Icon;
  outline: Icon;
  /**
   * A `badge-` scoped tone — never a site accent.
   *
   * Every tone in this map is a pale one that takes ink at 9:1 or better,
   * which is what lets the tile draw its icon in `text-ink` unconditionally.
   * Slate would be 1.9:1 there and the icon would vanish.
   */
  tone: string;
}

/**
 * How each badge looks.
 *
 * Kept on the frontend on purpose. The server decides what a badge *is* — its
 * name, what earns it, what it is worth — and knows nothing about Heroicons or
 * Tailwind classes. Adding an icon set to the API's vocabulary would tie a
 * data model to a rendering library it will outlive.
 *
 * Colour is chosen per badge rather than per family: a trophy that is gold and
 * a heart that is pink are recognisable before the label is read, which is
 * most of what a badge is for. The family is still stated in the label
 * underneath, so nothing depends on decoding the hue.
 */
export const BADGE_ART: Record<string, BadgeArt> = {
  /* ---------------------------------------------------------- making --- */
  'first-launch': { solid: RocketLaunchIcon, outline: RocketOutline, tone: 'bg-badge-teal' },
  'serial-launcher': {
    solid: PaperAirplaneIcon,
    outline: PaperAirplaneOutline,
    tone: 'bg-badge-sky',
  },
  prolific: { solid: Square3Stack3DIcon, outline: StackOutline, tone: 'bg-badge-orchid' },
  'hundred-votes': { solid: HeartIcon, outline: HeartOutline, tone: 'bg-badge-rose' },
  'thousand-votes': { solid: FireIcon, outline: FireOutline, tone: 'bg-badge-coral' },
  podium: { solid: ArrowTrendingUpIcon, outline: ArrowTrendingUpOutline, tone: 'bg-badge-mint' },
  /* Gold, because a trophy that is not gold is just a cup. */
  'chart-topper': { solid: TrophyIcon, outline: TrophyOutline, tone: 'bg-badge-sand' },
  'well-reviewed': { solid: StarIcon, outline: StarOutline, tone: 'bg-badge-yellow' },

  /* ------------------------------------------------------- community --- */
  'first-vote': { solid: HandThumbUpIcon, outline: HandThumbUpOutline, tone: 'bg-badge-sky' },
  'hundred-votes-given': { solid: BoltIcon, outline: BoltOutline, tone: 'bg-badge-yellow' },
  commenter: { solid: ChatBubbleLeftRightIcon, outline: ChatOutline, tone: 'bg-badge-orchid' },

  /* ----------------------------------------------------------- trade --- */
  backer: { solid: BanknotesIcon, outline: BanknotesOutline, tone: 'bg-badge-mint' },
  patron: { solid: GiftIcon, outline: GiftOutline, tone: 'bg-badge-orchid' },
  funded: { solid: CheckBadgeIcon, outline: CheckBadgeOutline, tone: 'bg-badge-teal' },
  shopkeeper: { solid: ShoppingBagIcon, outline: ShoppingBagOutline, tone: 'bg-badge-coral' },
};

/**
 * Falls back rather than crashing on an unknown id.
 *
 * The badge list lives on the server, so it can gain an entry that this map has
 * not caught up with. A generic yellow star is a worse badge than a bespoke one;
 * a blank tile or a thrown error is worse than both.
 */
export function artFor(id: string): BadgeArt {
  return BADGE_ART[id] ?? { solid: StarIcon, outline: StarOutline, tone: 'bg-badge-yellow' };
}
