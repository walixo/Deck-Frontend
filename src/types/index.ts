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
