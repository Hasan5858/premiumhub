// Cache version - increment this when you want to invalidate all cache
// Change this version number whenever you make changes that require cache invalidation
// IMPORTANT: Cache is GLOBAL and shared by all users. Only user-specific data (auth tokens, user preferences) 
// should be stored separately. All content cache (videos, categories, etc.) is global.
const CACHE_VERSION = 'v2.4.0'
const CACHE_VERSION_KEY = 'cache_version'

// Development mode: Set to true to disable caching completely in development
const DISABLE_CACHE_IN_DEV = typeof window !== 'undefined' && 
  process.env.NODE_ENV === 'development' && 
  (typeof window !== 'undefined' && localStorage.getItem('disable_cache') === 'true')

// Define default cache expiration times (in milliseconds)
const DEFAULT_CACHE_TIME = 15 * 60 * 1000; // 15 minutes
const CACHE_TIMES = {
  categories: 30 * 60 * 1000, // 30 minutes
  webseries: 30 * 60 * 1000,  // 30 minutes
  videos: 15 * 60 * 1000,     // 15 minutes
  indianpornhq: 60 * 60 * 1000, // 1 hour - for IndianPornHQ provider data
};

/**
 * Initialize and check cache version - should be called on app mount
 * This runs regardless of user authentication status to ensure cache is shared globally
 */
export function initializeCache(): void {
  if (typeof window === 'undefined') return;
  
  const storedVersion = localStorage.getItem(CACHE_VERSION_KEY)
  
  // Check if cache should be cleared
  let shouldClearCache = false
  let clearReason = ''
  
  if (!storedVersion || storedVersion !== CACHE_VERSION) {
    shouldClearCache = true
    clearReason = `Version changed from ${storedVersion || 'none'} to ${CACHE_VERSION}`
  }
  
  if (shouldClearCache) {
    console.log(`[Cache] ${clearReason}. Clearing all cache.`)
    console.log(`[Cache] Note: Cache is shared globally - not user-specific.`)
    try {
      // Get all keys
      const keysToRemove: string[] = []
      const keysToKeep: string[] = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key) continue
        
        // Only keep auth/user-related keys - all other cache is global and should be cleared
        if (key.startsWith('auth_') || 
            key === 'user' ||
            key.startsWith('current_device') ||
            key.startsWith('refresh_token') ||
            key === CACHE_VERSION_KEY ||
            key === 'disable_cache') {
          keysToKeep.push(key)
        } else {
          // All other keys are global cache and should be removed
          keysToRemove.push(key)
        }
      }
      
      console.log(`[Cache] Removing ${keysToRemove.length} global cache items, keeping ${keysToKeep.length} user/auth items`)
      
      // Remove cache items
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        console.log(`[Cache] Removed: ${key}`)
      })
      
      // Set new version - this is also global, not user-specific
      localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION)
      console.log(`[Cache] Cache cleared and version updated to ${CACHE_VERSION} (global cache)`)
      
      // In development, show instruction to disable cache if needed
      if (process.env.NODE_ENV === 'development') {
        console.log('[Cache] Dev mode: Run localStorage.setItem("disable_cache", "true") and reload to disable caching')
      }
    } catch (error) {
      console.error('[Cache] Error clearing cache on version change:', error)
    }
  } else {
    console.log(`[Cache] Version check passed: ${CACHE_VERSION} (global cache, not user-specific)`)
  }
}

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
  
  // In development, if cache is disabled, don't cache
  if (DISABLE_CACHE_IN_DEV) {
    return
  }
  
  try {
    // Verify cache version before setting
    const storedVersion = localStorage.getItem(CACHE_VERSION_KEY)
    if (storedVersion && storedVersion !== CACHE_VERSION) {
      // Version mismatch, don't cache
      return
    }
    
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
  
  // In development, if cache is disabled, don't return cached data
  if (typeof window !== 'undefined' && 
      process.env.NODE_ENV === 'development' && 
      localStorage.getItem('disable_cache') === 'true') {
    return null
  }
  
  try {
    // Always check cache version first - this ensures cache is invalidated on version change
    const storedVersion = localStorage.getItem(CACHE_VERSION_KEY)
    if (!storedVersion || storedVersion !== CACHE_VERSION) {
      // Version mismatch or no version set, invalidate this cache item
      if (localStorage.getItem(key)) {
        console.log(`[Cache] Invalidating ${key} due to version mismatch (stored: ${storedVersion}, current: ${CACHE_VERSION})`)
        localStorage.removeItem(key)
      }
      return null
    }
    
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
    // Check cache version first
    const storedVersion = localStorage.getItem(CACHE_VERSION_KEY)
    if (storedVersion !== CACHE_VERSION) {
      // Version mismatch, cache is invalid
      return false
    }
    
    const cacheItemJson = localStorage.getItem(key);
    if (!cacheItemJson) return false;
    
    const cacheItem = JSON.parse(cacheItemJson) as CacheItem<any>;
    return Date.now() <= cacheItem.expiresAt;
  } catch {
    return false;
  }
} 