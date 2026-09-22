/**
 * A category slug.
 *
 * Deliberately `string`. Categories live in the database and admins can add
 * them, so a union here would be a type that lies the moment somebody does —
 * and it would lie silently, since every existing usage still compiles.
 * Labels and icons come from `useCategories`.
 */
export type Category = string;

export type PricingModel = 'free' | 'freemium' | 'paid' | 'open-source';

export type SortOption = 'trending' | 'newest' | 'top' | 'discussed';

export interface PublicUser {
  id: string;
  /** Staff-granted identity mark, shown beside the name. */
  verified: boolean;
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
  /**
   * The colour this launch takes on the launch wall.
   *
   * A plain six-digit hex the maker chose. Absent means "sample my logo", which
   * is what every launch did before the field existed and remains the default.
   */
  wallColour?: string;
  /** A YouTube or Vimeo link. Played in the media slider, behind cookie consent. */
  videoUrl?: string;
  gallery: string[];
  makers: string[];
  launchDate: string;
  launchDateKey: string;
  featured: boolean;
  /** On the Future Gen showcase. Staff-set — see the page for what it is. */
  futureGen: boolean;
  /**
   * People who opened this launch, deduped per viewer per 12 hours.
   *
   * Counted server-side on the launch fetch, not by a beacon — so it does not
   * move when a card scrolls past, only when somebody opens the page.
   */
  viewCount: number;
  voteCount: number;
  commentCount: number;
  reviewCount: number;
  /** Edits since posting. Zero means the launch is exactly as it went up. */
  editCount: number;
  /** When the owner's edit window shuts. Staff may edit past it. */
  editableUntil: string;
  /** Maker-supplied label like "2.0". Absent on a product's first launch. */
  version?: string;
  /** The id of the first launch in this product's chain. */
  lineage: string;
  ratingAvg: number;
  /**
   * What the maker says the product earns each month.
   *
   * Absent unless they published a figure — which most launches have not, so
   * check for the key rather than for a zero. A zero that *is* present is a
   * real answer meaning pre-revenue.
   */
  revenue?: LaunchRevenue;
  createdAt: string;
  hasVoted: boolean;
  submittedBy: PublicUser;
  fundraise: Fundraise;
}

export interface LaunchRevenue {
  /** Integer minor units per month, in `currency`. */
  monthlyMinor: number;
  currency: string;
  /** The maker's claim that it covers its costs. False means "not claimed". */
  profitable: boolean;
  /** When the maker last confirmed it. Shown, and marked once it ages. */
  reportedAt: string | null;
}

/** The authored state of a launch at one point in time. */
export interface RevisionSnapshot {
  name: string;
  tagline: string;
  description: string;
  category: Category;
  pricing: PricingModel;
  websiteUrl: string;
  repoUrl?: string;
  logoUrl?: string;
  coverUrl?: string;
  wallColour?: string;
  videoUrl?: string;
  gallery: string[];
  tags: string[];
  makers: string[];
}

export type RevisionField = keyof RevisionSnapshot;

/**
 * One entry in a launch's edit history.
 *
 * Carries the whole snapshot rather than just what changed, because the diff is
 * rendered by comparing a revision against the one below it — the client needs
 * both sides. `editedByName` is the name as it stood at the time, which is not
 * always what `editedBy` says today.
 */
export interface Revision {
  id: string;
  version: number;
  snapshot: RevisionSnapshot;
  changed: RevisionField[];
  note?: string;
  role: 'owner' | 'admin';
  editedByName: string;
  editedBy: PublicUser;
  createdAt: string;
}

/**
 * A launch's optional fundraise. Every launch carries this block; `enabled`
 * says whether the launcher opted in, and `open` is the single flag the UI
 * should read before offering to take someone's money.
 */
/**
 * How close a launch is to being allowed to ask for money.
 *
 * The thresholds travel with the figures rather than being repeated as
 * frontend constants: they are the server's rule, and a copy here would be one
 * more thing to keep in step — the audit page has already shown what that
 * costs. Public on every launch, because "3 votes to go" is a reason to vote.
 */
export interface FundraiseEligibility {
  votes: number;
  votesNeeded: number;
  comments: number;
  commentsNeeded: number;
  met: boolean;
}

export interface Fundraise {
  /** Where the application stands. Only `approved` ever turns a raise on. */
  status: 'none' | 'pending' | 'approved' | 'rejected';
  eligibility: FundraiseEligibility;
  /** Staff's note, shown to the maker when an application is turned down. */
  reviewNote?: string;
  appliedAt: string | null;
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

/** One launch in a product's version chain, trimmed to what a strip renders. */
export interface ItemVersion {
  slug: string;
  name: string;
  /** Absent on a product's first launch, which predates any versioning. */
  version?: string;
  launchDate: string;
  voteCount: number;
  ratingAvg: number;
  reviewCount: number;
  current: boolean;
}

export interface ItemDetail extends Item {
  related: Item[];
  /** Every version of this product, newest first. Empty when it has only one. */
  versions: ItemVersion[];
  /** Totals across the whole chain, derived server-side from each version. */
  allVersions: {
    voteCount: number;
    reviewCount: number;
    ratingAvg: number;
  };
}

/** One launch's traffic over the requested window, padded to the shared axis. */
export interface LaunchViewSeries {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string;
  /** Lifetime views. Usually larger than the window — most launches are older. */
  total: number;
  /** Views inside the window only. */
  windowViews: number;
  /** One entry per day in `LaunchViews.days`, same order. Zeroes are real. */
  series: number[];
}

export interface LaunchViews {
  /** The shared date axis, oldest first, as YYYY-MM-DD UTC day keys. */
  days: string[];
  launches: LaunchViewSeries[];
}

export type NotificationKind =
  | 'comment.received'
  | 'comment.replied'
  | 'review.received'
  | 'launch.milestone'
  | 'launch.ranked'
  | 'account.verified'
  | 'fundraise.reviewed'
  | 'acquisition.reviewed'
  | 'merch.reviewed'
  | 'game.reviewed'
  | 'custom.reviewed'
  | 'content.moderated'
  | 'fundraise.contribution'
  | 'order.status';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  /** An in-app path. Always routed, never opened as an external link. */
  link: string;
  read: boolean;
  createdAt: string;
  /** Who caused it, when a person did. Absent for staff and system events. */
  actor?: PublicUser;
}

/** Social sign-in methods the API can offer, when keys are configured. */
export type OAuthProvider = 'github' | 'google';

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
  id: string;
  slug: Category;
  label: string;
  /** A key into the curated icon set. See components/illustrations/CategoryIcon. */
  icon: string;
  blurb?: string;
  order: number;
  /** Retired categories still render on old launches but take no new ones. */
  active: boolean;
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
  futureGen?: boolean;
  /** A year, month or day — `2026`, `2026-08`, `2026-08-15`. */
  on?: string;
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

/*
 * Must stay in step with Backend/src/constants.ts.
 *
 * It drifted once and took the whole audit page down with it: fifteen actions
 * had been added on the server, the trail started returning them, and the
 * lookup that styles each row returned undefined for every one. Nothing here
 * is nullable, so the page threw on the first such entry and the admin route
 * rendered blank. The reader below no longer trusts this list to be complete —
 * see `describe` — but it is still the list the filter chips are built from,
 * so a missing action means a filter you cannot reach.
 */
export const AUDIT_ACTIONS = [
  'role.granted',
  'role.revoked',
  'user.verified',
  'user.unverified',
  'post.created',
  'post.published',
  'post.unpublished',
  'post.deleted',
  'merch.approved',
  'merch.rejected',
  'merch.edited',
  'merch.retired',
  'order.shipped',
  'order.delivered',
  'payout.recorded',
  'item.edited',
  'item.deleted',
  'item.rescheduled',
  'category.created',
  'category.updated',
  'category.removed',
  'fundraise.changed',
  'fundraise.approved',
  'fundraise.rejected',
  'futuregen.added',
  'futuregen.removed',
  'comment.deleted',
  'topic.edited',
  'topic.deleted',
  'topic.moderated',
  'reply.deleted',
  'acquisition.approved',
  'acquisition.rejected',
  'acquisition.sold',
  'acquisition.removed',
  'custom.approved',
  'custom.rejected',
  'game.approved',
  'game.rejected',
  'game.edited',
  'game.removed',
  'ad.approved',
  'ad.rejected',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/** One privileged action, as recorded. Append-only — nothing here can change. */
export interface AuditEvent {
  id: string;
  /* Typed as the union *plus* string: the server is free to record an action
     this build has never heard of, and the page has to survive reading one. */
  action: AuditAction | (string & {});
  /** Null when a command-line script did it rather than a signed-in admin. */
  actorId: string | null;
  actorName: string;
  actorEmail?: string;
  targetType:
    | 'user'
    | 'merch'
    | 'order'
    | 'payout'
    | 'item'
    | 'category'
    | 'comment'
    | 'ad'
    | 'post'
    | 'topic'
    | 'acquisition'
    | 'custom';
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

/* ----------------------------------------------------------------- blog --- */

export interface PostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverUrl?: string;
  tags: string[];
  status: 'draft' | 'published';
  publishedAt: string | null;
  /** Derived from the body server-side, so it can never disagree with it. */
  readMinutes: number;
  author: PublicUser | null;
}

export interface Post extends PostSummary {
  body: string;
}

export interface PostDraft {
  title: string;
  excerpt: string;
  body: string;
  coverUrl?: string;
  tags: string[];
  status: 'draft' | 'published';
  publishedAt?: string;
}

/** A fundraise as the review page sees it, pending or approved. */
export interface FundraiseApplicationRow {
  slug: string;
  name: string;
  logoUrl?: string;
  status: 'none' | 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  reviewedAt: string | null;
  targetMinor: number;
  raisedMinor: number;
  contributorCount: number;
  /** Approved *and* currently taking money — a paused raise is neither. */
  live: boolean;
  percent: number;
  application: {
    purpose?: string;
    useOfFunds?: string;
    timeline?: string;
    contact?: string;
  };
  submittedBy: PublicUser;
}

export interface FundraiseReviewData {
  pending: FundraiseApplicationRow[];
  approved: FundraiseApplicationRow[];
  totals: { raisedMinor: number; targetMinor: number; backers: number; live: number };
}

/* ---------------------------------------------------------------- forum --- */

export const TOPIC_SECTIONS = ['ask', 'show', 'feedback', 'hiring', 'meta'] as const;
export type TopicSection = (typeof TOPIC_SECTIONS)[number];

/** Reader-facing names and a line on what each section is for. */
export const SECTION_META: Record<TopicSection, { label: string; blurb: string }> = {
  ask: { label: 'Ask', blurb: 'Questions for the room' },
  show: { label: 'Show', blurb: 'Something you made or found' },
  feedback: { label: 'Feedback', blurb: 'Put your work up for critique' },
  hiring: { label: 'Hiring', blurb: 'Roles, contracts, looking for work' },
  meta: { label: 'Meta', blurb: 'Deck itself — bugs, ideas, complaints' },
};

/** A topic in the index. No body — see TopicDetail. */
export interface TopicSummary {
  id: string;
  title: string;
  slug: string;
  /** The opening of the post, trimmed server-side. Empty for a very short one. */
  excerpt: string;
  section: TopicSection;
  replyCount: number;
  lastReplyAt: string;
  /** Null until somebody replies; the index shows the author instead. */
  lastReplyBy: PublicUser | null;
  pinned: boolean;
  locked: boolean;
  createdAt: string;
  author: PublicUser | null;
}

export interface Reply {
  id: string;
  body: string;
  createdAt: string;
  author: PublicUser | null;
}

export interface TopicDetail extends TopicSummary {
  body: string;
  replies: Reply[];
}

export interface TopicDraft {
  title: string;
  body: string;
  section: TopicSection;
}

/* --------------------------------------------------------- acquisitions --- */

export type AcquisitionStatus = 'pending' | 'approved' | 'rejected' | 'sold' | 'withdrawn';

export const ACQUISITION_ASSETS = [
  'source',
  'domain',
  'users',
  'revenue',
  'brand',
  'socials',
  'contracts',
  'support',
] as const;
export type AcquisitionAsset = (typeof ACQUISITION_ASSETS)[number];

/** What each included asset means, in the buyer's words rather than the seller's. */
export const ASSET_LABELS: Record<AcquisitionAsset, string> = {
  source: 'Source code',
  domain: 'Domain name',
  users: 'User accounts',
  revenue: 'Revenue',
  brand: 'Brand & assets',
  socials: 'Social accounts',
  contracts: 'Customer contracts',
  support: 'Handover support',
};

/** The launch being sold, trimmed to what a listing card draws. */
export interface AcquisitionItemRef {
  name: string;
  slug: string;
  tagline?: string;
  logoUrl?: string;
  category?: string;
  wallColour?: string;
  voteCount: number;
}

export interface AcquisitionSummary {
  id: string;
  slug: string;
  status: AcquisitionStatus;
  /** The asking price. The figure the board sets in display type. */
  askingMinor: number;
  currency: string;
  negotiable: boolean;
  assets: AcquisitionAsset[];
  monthlyRevenueMinor: number;
  monthlyCostMinor: number;
  activeUsers: number;
  bidCount: number;
  /** Zero when nobody has bid. Never the list — see the note on the Bid model. */
  highestBidMinor: number;
  /** Deck's commission, and what it comes to at the asking price. */
  feePercent: number;
  feeMinor: number;
  /** What the seller keeps at the asking price. */
  netMinor: number;
  soldAt: string | null;
  soldMinor: number;
  createdAt: string;
  item: AcquisitionItemRef | null;
  seller: PublicUser | null;
}

export interface Bid {
  id: string;
  amountMinor: number;
  currency: string;
  message: string;
  status: 'active' | 'withdrawn' | 'accepted' | 'declined';
  createdAt: string;
  bidder: PublicUser | null;
}

export interface AcquisitionDetail extends AcquisitionSummary {
  reason: string;
  notes?: string;
  reviewNote?: string;
  appliedAt: string;
  reviewedAt: string | null;
  soldFeeMinor: number;
  /** Only ever populated for the seller and staff. Empty for everybody else. */
  bids: Bid[];
  /** Your own live offer, so a buyer can always see what they said. */
  yourBid: Bid | null;
}

export interface AcquisitionDraft {
  asking: number;
  negotiable: boolean;
  reason: string;
  assets: AcquisitionAsset[];
  monthlyRevenue: number;
  monthlyCost: number;
  activeUsers: number;
  notes?: string;
}

/** The admin queue's shape. */
export interface AcquisitionQueue {
  pending: AcquisitionDetail[];
  live: AcquisitionSummary[];
  sold: AcquisitionSummary[];
  totals: {
    feePercent: number;
    listedMinor: number;
    soldMinor: number;
    earnedMinor: number;
    openBids: number;
  };
}

/* --------------------------------------------------- custom print jobs --- */

export const CUSTOM_PRODUCTS = ['sticker', 'sticker-sheet', 'tee', 'hoodie'] as const;
export type CustomProduct = (typeof CUSTOM_PRODUCTS)[number];

export const CUSTOM_PLACEMENTS = ['centre-chest', 'left-chest', 'full-front', 'back'] as const;
export type CustomPlacement = (typeof CUSTOM_PLACEMENTS)[number];

export const PLACEMENT_LABELS: Record<CustomPlacement, string> = {
  'centre-chest': 'Centre chest',
  'left-chest': 'Left chest',
  'full-front': 'Full front',
  back: 'Back',
};

export type CustomStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

/** What Deck measured in the uploaded file. See services/artwork on the server. */
export interface ArtworkAnalysis {
  width: number;
  height: number;
  maxInchesAtGoodDpi: number;
  transparent: boolean;
  inkCoverage: number;
  dominantHex: string;
  luminance: number;
  suggestedGarments: string[];
  warnings: string[];
}

export interface Garment {
  id: string;
  label: string;
  hex: string;
}

/** The reply to POST /custom/inspect: everything the picker needs to render. */
export interface ArtworkInspection {
  analysis: ArtworkAnalysis;
  pricing: Record<
    CustomProduct,
    { baseMinor: number; label: string; apparel: boolean; priceMinor: number; currency: string }
  >;
  garments: Garment[];
  sizes: string[];
  /** False when no image provider is configured — the page hides the offer. */
  lifestyleAvailable: boolean;
}

export interface CustomDesign {
  id: string;
  reference: string;
  name: string;
  artworkUrl: string;
  analysis: ArtworkAnalysis;
  product: CustomProduct;
  garment: string;
  placement: CustomPlacement;
  scale: number;
  size?: string;
  /** An AI-generated scene. Illustrative — never the print proof. */
  lifestyleUrl?: string;
  priceMinor: number;
  currency: string;
  status: CustomStatus;
  reviewNote?: string;
  reviewedAt: string | null;
  createdAt: string;
  /** Populated only on the staff queue. */
  owner: PublicUser | null;
}

export interface CustomDesignDraft {
  artworkUrl: string;
  name: string;
  product: CustomProduct;
  garment: string;
  placement: CustomPlacement;
  scale: number;
  size?: string;
}

export interface CustomQueue {
  submitted: CustomDesign[];
  approved: CustomDesign[];
  rejected: CustomDesign[];
}

/* ---------------------------------------------------------------- arcade */

export const GAME_GENRES = ['arcade', 'puzzle', 'action', 'strategy', 'idle', 'other'] as const;
export type GameGenre = (typeof GAME_GENRES)[number];

export const GAME_GENRE_LABELS: Record<GameGenre, string> = {
  arcade: 'Arcade',
  puzzle: 'Puzzle',
  action: 'Action',
  strategy: 'Strategy',
  idle: 'Idle',
  other: 'Other',
};

export interface GameSummary {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  genre: GameGenre;
  coverUrl: string;
  /** `builtin` runs in this bundle; `external` lives at somebody else's URL. */
  kind: 'builtin' | 'external';
  /** For `builtin`: the key `GAME_COMPONENTS` maps to a component. */
  component: string | null;
  playUrl: string | null;
  embeddable: boolean;
  status: 'pending' | 'approved' | 'rejected';
  reviewNote: string;
  plays: number;
  featured: boolean;
  createdAt: string;
  author: PublicUser | null;
}

export interface GameDetail extends GameSummary {
  description: string;
}

export interface GameDraft {
  title: string;
  tagline: string;
  description: string;
  genre: GameGenre;
  coverUrl?: string;
  playUrl: string;
}

export interface ScoreRow {
  id: string;
  rank: number;
  score: number;
  achievedAt: string;
  player: PublicUser | null;
}

export interface Leaderboard {
  scores: ScoreRow[];
  /** Everyone who has ever posted a score, not just the ten shown. */
  players: number;
  /** The signed-in reader's own standing, if they have one. */
  you: { rank: number; score: number } | null;
}
