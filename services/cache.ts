// Define default cache expiration times (in milliseconds)
const DEFAULT_CACHE_TIME = 15 * 60 * 1000; // 15 minutes
const CACHE_TIMES = {
  categories: 30 * 60 * 1000, // 30 minutes
  webseries: 30 * 60 * 1000,  // 30 minutes
  creators: 60 * 60 * 1000,   // 1 hour
  videos: 15 * 60 * 1000,     // 15 minutes
};

// Cache structure
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Set an item in the cache
 * @param key Cache key
 * @param data Data to cache
 * @param expirationTime Custom expiration time in ms (optional)
 */
export function setCacheItem<T>(key: string, data: T, expirationTime?: number): void {
  // Skip caching if localStorage is not available (SSR)
  if (typeof window === 'undefined') return;
  
  try {
    const timestamp = Date.now();
    // Get appropriate expiration time based on key prefix or use default/custom
    const cacheTime = expirationTime || getCacheTimeForKey(key);
    const expiresAt = timestamp + cacheTime;
    
    const cacheItem: CacheItem<T> = {
      data,
      timestamp,
      expiresAt,
    };
    
    localStorage.setItem(key, JSON.stringify(cacheItem));
  } catch (error) {
    console.error('Error setting cache item:', error);
  }
}

/**
 * Get an item from cache
 * @param key Cache key
 * @returns The cached data or null if not found/expired
 */
export function getCacheItem<T>(key: string): T | null {
  // Skip caching if localStorage is not available (SSR)
  if (typeof window === 'undefined') return null;
  
  try {
    const cacheItemJson = localStorage.getItem(key);
    if (!cacheItemJson) return null;
    
    const cacheItem = JSON.parse(cacheItemJson) as CacheItem<T>;
    const now = Date.now();
    
    // Check if cache has expired
    if (now > cacheItem.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }
    
    return cacheItem.data;
  } catch (error) {
    console.error('Error getting cache item:', error);
    return null;
  }
}

/**
 * Remove an item from cache
 * @param key Cache key
 */
export function removeCacheItem(key: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing cache item:', error);
  }
}

/**
 * Clear all cache or cache items matching a prefix
 * @param prefix Optional prefix to match keys to clear
 */
export function clearCache(prefix?: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    if (!prefix) {
      localStorage.clear();
      return;
    }
    
    // Get all keys that match the prefix
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    
    // Remove matched keys
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Get cache expiration time based on key prefix
 */
function getCacheTimeForKey(key: string): number {
  for (const prefix in CACHE_TIMES) {
    if (key.startsWith(prefix)) {
      return CACHE_TIMES[prefix as keyof typeof CACHE_TIMES];
    }
  }
  return DEFAULT_CACHE_TIME;
}

/**
 * Check if a cache key exists and is valid
 */
export function hasCacheItem(key: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const cacheItemJson = localStorage.getItem(key);
    if (!cacheItemJson) return false;
    
    const cacheItem = JSON.parse(cacheItemJson) as CacheItem<any>;
    return Date.now() <= cacheItem.expiresAt;
  } catch {
    return false;
  }
} 