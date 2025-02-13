import { DB_CONSTANTS } from '@/constants/db';

class Cache<T> {
  private cache: Map<string, { data: T; timestamp: number }>;
  private ttl: number;

  constructor(ttl = 60000) {
    // Default TTL: 1 minute
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > this.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

// Create cache instances for different data types
export const logoStatsCache = new Cache<any>(30000); // 30 seconds TTL
export const userVotesCache = new Cache<any>(60000); // 1 minute TTL
export const voteHistoryCache = new Cache<any>(15000); // 15 seconds TTL

// Cache keys
export const CACHE_KEYS = {
  LOGO_STATS: (logoId: string) => `logo_stats_${logoId}`,
  USER_VOTES: (userId: string) => `user_votes_${userId}`,
  VOTE_HISTORY: 'vote_history',
  ALL_LOGO_STATS: 'all_logo_stats',
};
