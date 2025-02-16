import { DB_CONSTANTS } from '@/constants/db';
import { DatabaseCollections } from '@/types/database';
import { IVote } from '@/models/Vote';
import { ILogo } from '@/models/Logo';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface CacheOptions {
  ttl?: number;
  maxSize?: number;
}

class Cache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private ttl: number;
  private maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.ttl = options.ttl || 5 * 60 * 1000; // 5 minutes default TTL
    this.maxSize = options.maxSize || 1000;
  }

  set(key: string, value: T): void {
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
    });
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.data;
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > this.ttl;
  }

  private evictOldest(): void {
    const oldestKey = Array.from(this.cache.entries()).sort(
      ([, a], [, b]) => a.timestamp - b.timestamp
    )[0]?.[0];
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const caches: { [K in keyof DatabaseCollections]?: Cache<DatabaseCollections[K]> } = {};

interface LogoStats {
  voteCount: number;
}

interface LogoStatsWithId extends LogoStats {
  logoId: string;
}

interface VoteHistory {
  userName: string;
  userId: string;
  logoId: string;
  timestamp: Date;
}

// Create cache instances for different data types
export const logoStatsCache = new Cache<LogoStats | LogoStatsWithId[]>({ ttl: 30000 }); // 30 seconds TTL
export const userVotesCache = new Cache<IVote[]>({ ttl: 60000 }); // 1 minute TTL
export const voteHistoryCache = new Cache<IVote[]>({ ttl: 15000 }); // 15 seconds TTL

// Cache keys
export const CACHE_KEYS = {
  LOGO_STATS: (logoId: string) => `logo_stats_${logoId}`,
  USER_VOTES: (userId: string) => `user_votes_${userId}`,
  VOTE_HISTORY: 'vote_history',
  ALL_LOGO_STATS: 'all_logo_stats',
};
