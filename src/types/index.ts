export type Category =
  | 'ai-model'
  | 'ai-tool'
  | 'claude-skill'
  | 'developer-tool'
  | 'mobile-app'
  | 'website'
  | 'hardware';

export type PricingModel = 'free' | 'freemium' | 'paid' | 'open-source';

export type SortOption = 'trending' | 'newest' | 'top' | 'discussed';

export interface PublicUser {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  headline?: string;
  bio?: string;
  websiteUrl?: string;
  createdAt?: string;
}

export interface AuthUser extends PublicUser {
  email: string;
  role: string;
}

export interface Item {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  category: Category;
  tags: string[];
  pricing: PricingModel;
  websiteUrl: string;
  repoUrl?: string;
  logoUrl?: string;
  coverUrl?: string;
  gallery: string[];
  makers: string[];
  launchDate: string;
  launchDateKey: string;
  featured: boolean;
  voteCount: number;
  commentCount: number;
  reviewCount: number;
  ratingAvg: number;
  createdAt: string;
  hasVoted: boolean;
  submittedBy: PublicUser;
  fundraise: Fundraise;
}

/**
 * A launch's optional fundraise. Every launch carries this block; `enabled`
 * says whether the launcher opted in, and `open` is the single flag the UI
 * should read before offering to take someone's money.
 */
export interface Fundraise {
  enabled: boolean;
  targetMinor: number;
  raisedMinor: number;
  contributorCount: number;
  pitch?: string;
  closed: boolean;
  /** Capped at 100 so the bar cannot overflow; compare the minors for the rest. */
  percent: number;
  open: boolean;
}

export interface Contribution {
  id: string;
  reference: string;
  amountMinor: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed';
  message?: string;
  anonymous: boolean;
  /** Null when they gave anonymously. */
  supporter: PublicUser | null;
  createdAt: string;
}

export interface ItemDetail extends Item {
  related: Item[];
}

export interface RankedItem extends Item {
  rank: number;
}

export interface Comment {
  id: string;
  body: string;
  rating?: number;
  parent: string | null;
  createdAt: string;
  user: PublicUser;
}

export interface CategoryCount {
  slug: Category;
  label: string;
  count: number;
}

export interface TagCount {
  tag: string;
  count: number;
}

export interface PlatformStats {
  launches: number;
  makers: number;
  votes: number;
  todayLaunches: number;
}

export interface LeaderboardDay {
  date: string;
  launches: number;
  votes: number;
}

export interface LeaderboardMeta {
  date: string;
  isToday: boolean;
  previousDate: string;
  nextDate: string | null;
  totalLaunches: number;
}

export interface TopMaker {
  rank: number;
  launches: number;
  votes: number;
  user: PublicUser;
}

export interface UserProfile {
  badges: ProfileBadge[];
  user: PublicUser;
  items: Item[];
  stats: {
    launches: number;
    votesReceived: number;
    votesGiven: number;
    commentsWritten: number;
  };
}

export interface Paginated<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasMore: boolean;
  };
}

export interface ItemFilters {
  category?: Category;
  sort?: SortOption;
  search?: string;
  pricing?: PricingModel;
  tag?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
}

export interface ItemDraft {
  name: string;
  tagline: string;
  description: string;
  category: Category;
  pricing: PricingModel;
  websiteUrl: string;
  repoUrl?: string;
  /** Paths returned by POST /api/uploads, or absolute URLs. */
  logoUrl?: string;
  coverUrl?: string;
  gallery?: string[];
  tags: string[];
  makers: string[];
}

export interface FieldError {
  field: string;
  message: string;
}

/* ---------------------------------------------------------------- merch --- */

export type MerchCategory = 'apparel' | 'stickers' | 'print' | 'accessories';
export type MerchSort = 'featured' | 'newest' | 'price-low' | 'price-high';
export type OrderStatus = 'awaiting_payment' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface MerchVariant {
  sku: string;
  size?: string;
  colour?: string;
  stock: number;
  inStock: boolean;
}

export interface MerchProduct {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  category: MerchCategory;
  /** Integer minor units. Format for display; never do arithmetic in floats. */
  priceMinor: number;
  currency: string;
  images: string[];
  variants: MerchVariant[];
  featured: boolean;
  active: boolean;
  status: MerchStatus;
  rejectionReason?: string;
  /** Null for Deck's own catalogue, the maker otherwise. */
  seller: PublicUser | null;
  sellerId: string | null;
  totalStock: number;
  soldOut: boolean;
  createdAt: string;
}

export type MerchStatus = 'draft' | 'pending' | 'approved' | 'rejected';

/**
 * One disbursement Deck has sent a seller.
 *
 * Deck collects every payment, so money reaches sellers as periodic payouts
 * rather than at the moment of sale.
 */
export interface Payout {
  id: string;
  reference: string;
  amountMinor: number;
  currency: string;
  destination?: string;
  note?: string;
  paidAt: string;
}

/** The ledger position: earned, paid out, and still owed. */
export interface SellerBalance {
  currency: string;
  merchNetMinor: number;
  merchShippingMinor: number;
  merchFeeMinor: number;
  orders: number;
  fundraiseNetMinor: number;
  fundraiseFeeMinor: number;
  contributions: number;
  earnedMinor: number;
  paidOutMinor: number;
  owedMinor: number;
}

export interface SellerEarnings {
  currency: string;
  feePercent: number;
  merch: { netMinor: number; shippingMinor: number; feeMinor: number; orders: number };
  fundraise: { netMinor: number; feeMinor: number; contributions: number };
  earnedMinor: number;
  paidOutMinor: number;
  owedMinor: number;
  listings: Partial<Record<MerchStatus, number>>;
}

/* ----------------------------------------------------------------- admin -- */

export interface AdminOverview {
  currency: string;
  feePercent: number;
  /** Work waiting to be done. Anything above zero wants attention. */
  queues: {
    pendingListings: number;
    pendingAds: number;
    awaitingFulfilment: number;
    sellersOwed: number;
    totalOwedMinor: number;
  };
  money: {
    grossMinor: number;
    platformFeeMinor: number;
    paidOrders: number;
    contributions: number;
  };
  catalogue: { liveListings: number; launches: number; openRaises: number; comments: number };
  people: { users: number; admins: number };
}

export interface AdminUser extends PublicUser {
  email: string;
  role: 'user' | 'admin';
}

export interface AdminOrder extends Order {
  buyer: PublicUser | null;
  sellerCount: number;
  platformFeeMinor: number;
}

export const AUDIT_ACTIONS = [
  'role.granted',
  'role.revoked',
  'merch.approved',
  'merch.rejected',
  'merch.edited',
  'merch.retired',
  'order.shipped',
  'order.delivered',
  'payout.recorded',
  'item.edited',
  'item.deleted',
  'fundraise.changed',
  'comment.deleted',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/** One privileged action, as recorded. Append-only — nothing here can change. */
export interface AuditEvent {
  id: string;
  action: AuditAction;
  /** Null when a command-line script did it rather than a signed-in admin. */
  actorId: string | null;
  actorName: string;
  actorEmail?: string;
  targetType: 'user' | 'merch' | 'order' | 'payout' | 'item' | 'comment';
  targetId: string;
  targetLabel: string;
  summary: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
  createdAt: string;
}

/** A row in the disbursement run: one seller Deck still owes. */
export interface OwedRow {
  sellerId: string;
  earnedMinor: number;
  paidOutMinor: number;
  owedMinor: number;
  currency: string;
  seller: PublicUser | null;
  email: string | null;
}

export interface MerchProductDetail extends MerchProduct {
  related: MerchProduct[];
}

export interface MerchFilters {
  category?: MerchCategory;
  sort?: MerchSort;
  search?: string;
  /** Split Deck's own goods from what the community lists. */
  source?: 'all' | 'deck' | 'makers';
  seller?: string;
  page?: number;
  limit?: number;
}

/** A line held in the browser's cart. Prices are cached for display only — the
 *  server reprices everything at checkout. */
export interface CartLine {
  sku: string;
  slug: string;
  name: string;
  size?: string;
  colour?: string;
  unitPriceMinor: number;
  quantity: number;
  image?: string;
  maxStock: number;
}

export interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  country: string;
}

export interface OrderLine {
  sku: string;
  name: string;
  size?: string;
  colour?: string;
  unitPriceMinor: number;
  quantity: number;
  image?: string;
  /** Who sold it. Null is Deck's own stock, which Deck posts itself. */
  sellerId: string | null;
}

export interface Order {
  id: string;
  reference: string;
  email: string;
  status: OrderStatus;
  currency: string;
  subtotalMinor: number;
  shippingMinor: number;
  totalMinor: number;
  shippingAddress: ShippingAddress;
  lines: OrderLine[];
  createdAt: string;
}

export interface ShippingQuote {
  subtotalMinor: number;
  shippingMinor: number;
  freeShippingThresholdMinor: number;
  currency: string;
}

/* ------------------------------------------------------------------ ads --- */

export const AD_PLACEMENTS = ['home', 'discover', 'board'] as const;
export type AdPlacement = (typeof AD_PLACEMENTS)[number];

export type AdStatus = 'pending_review' | 'rejected' | 'awaiting_payment' | 'live' | 'cancelled';

/** Where a `live` campaign sits against the calendar. Derived server-side. */
export type AdPhase = AdStatus | 'scheduled' | 'running' | 'finished';

export interface AdCampaign {
  id: string;
  reference: string;
  placement: AdPlacement;
  headline: string;
  body: string;
  imageUrl?: string;
  ctaLabel: string;
  days: number;
  startAt: string;
  endAt: string;
  priceMinor: number;
  currency: string;
  status: AdStatus;
  phase: AdPhase;
  rejectionReason?: string;
  impressions: number;
  clicks: number;
  clickRate: number;
  item: { name: string; slug: string; logoUrl?: string } | null;
  advertiser: PublicUser | null;
  createdAt: string;
}

/** What a public slot receives — the creative and nothing else. */
export interface ServedAd {
  reference: string;
  headline: string;
  body: string;
  imageUrl?: string;
  ctaLabel: string;
  item: { name: string; slug: string; logoUrl?: string } | null;
}

export interface AdRateCard {
  currency: string;
  durations: number[];
  placements: {
    placement: AdPlacement;
    label: string;
    dayRateMinor: number;
    prices: { days: number; priceMinor: number }[];
  }[];
}

/* --------------------------------------------------------------- badges --- */

export interface ProfileBadge {
  id: string;
  name: string;
  description: string;
  family: 'making' | 'community' | 'trade';
  mark: string;
  threshold: number;
  earned: boolean;
  earnedAt?: string;
  /** Capped at the threshold, so a bar never reads past full. */
  progress: number;
}

/* ---------------------------------------------------------------- share --- */

export interface ShareKit {
  name: string;
  tagline: string;
  slug: string;
  voteCount: number;
  logoUrl?: string;
  pageUrl: string;
  badgeUrl: string;
  embed: { markdown: string; html: string };
  post: string;
}
