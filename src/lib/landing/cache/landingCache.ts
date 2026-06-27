// 
// CACHE UTILITIES - High-Performance In-Memory Caching
// 

import type { CacheEntry } from '@/types/landing';

class LandingCache {
  private cache: Map<string, CacheEntry<any>>;
  private maxSize: number;
  private enabled: boolean;

  constructor(maxSize: number = 1000, enabled: boolean = true) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.enabled = enabled;
  }

  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    if (!this.enabled) return null;

    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set item in cache
   */
  set<T>(key: string, data: T, ttl: number = 1800000): void {
    if (!this.enabled) return;

    // LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    this.cache.set(key, entry);
  }

  /**
   * Delete item from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

// Singleton instance
export const landingCache = new LandingCache();

// Clear expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    landingCache.clearExpired();
  }, 300000);
}

// Cache TTL constants (milliseconds)
export const CACHE_TTL = {
  COUNTRIES: 3600000,  // 1 hour
  STATES: 3600000,     // 1 hour
  CITIES: 3600000,     // 1 hour
  CONTENT: 1800000,    // 30 minutes
  SEO: 3600000,        // 1 hour
  SEARCH: 600000,      // 10 minutes
} as const;

/**
 * Generate cache key for location
 */
export function getCacheKey(
  type: 'country' | 'state' | 'city',
  identifier: string,
  lang?: string
): string {
  return lang ? `${type}:${identifier}:${lang}` : `${type}:${identifier}`;
}

/**
 * Cached async function wrapper
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: { keyPrefix: string; ttl?: number } = { keyPrefix: 'fn' }
): T {
  return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const cacheKey = `${options.keyPrefix}:${JSON.stringify(args)}`;
    
    const cached = landingCache.get<Awaited<ReturnType<T>>>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const result = await fn(...args);
    landingCache.set(cacheKey, result, options.ttl);
    
    return result;
  }) as T;
}
