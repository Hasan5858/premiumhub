/**
 * Unified caching system for providers
 * Uses the existing cache service but with provider-aware keys
 */

import { getCacheItem, setCacheItem } from '../cache';

export class ProviderCache {
  private prefix = 'provider_v2';

  /**
   * Generate a cache key for provider data
   */
  private getKey(provider: string, resource: string, params: Record<string, any> = {}): string {
    const paramsKey = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('_');
    
    return `${this.prefix}_${provider}_${resource}${paramsKey ? `_${paramsKey}` : ''}`;
  }

  /**
   * Get cached data
   */
  async get<T>(provider: string, resource: string, params?: Record<string, any>): Promise<T | null> {
    const key = this.getKey(provider, resource, params);
    return getCacheItem<T>(key);
  }

  /**
   * Set cached data
   */
  async set<T>(
    provider: string,
    resource: string,
    data: T,
    duration: number,
    params?: Record<string, any>
  ): Promise<void> {
    const key = this.getKey(provider, resource, params);
    setCacheItem(key, data, duration);
  }

  /**
   * Clear cache for a provider
   */
  clearProvider(provider: string): void {
    if (typeof window === 'undefined') return;
    
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(`${this.prefix}_${provider}_`)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Clear all provider cache
   */
  clearAll(): void {
    if (typeof window === 'undefined') return;
    
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(`${this.prefix}_`)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Get cache statistics
   */
  getStats(): { totalKeys: number; providers: Record<string, number> } {
    if (typeof window === 'undefined') {
      return { totalKeys: 0, providers: {} };
    }

    const keys = Object.keys(localStorage);
    const providerKeys = keys.filter(key => key.startsWith(`${this.prefix}_`));
    
    const providers: Record<string, number> = {};
    providerKeys.forEach(key => {
      const parts = key.split('_');
      if (parts.length >= 3) {
        const provider = parts[2];
        providers[provider] = (providers[provider] || 0) + 1;
      }
    });

    return {
      totalKeys: providerKeys.length,
      providers,
    };
  }
}

// Singleton instance
export const providerCache = new ProviderCache();

// Cache duration constants (in milliseconds)
export const CACHE_DURATIONS = {
  VIDEOS: 30 * 60 * 1000, // 30 minutes
  CATEGORIES: 60 * 60 * 1000, // 1 hour
  VIDEO_DETAILS: 60 * 60 * 1000, // 1 hour
  THUMBNAILS: 6 * 60 * 60 * 1000, // 6 hours
  SEARCH: 15 * 60 * 1000, // 15 minutes
};
