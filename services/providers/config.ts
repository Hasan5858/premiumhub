import { ProviderMetadata, UnifiedCategoryData } from './types';

/**
 * Provider configuration
 * Each provider must have a configuration object
 */
export interface ProviderConfig {
  metadata: ProviderMetadata;
  
  // API configuration
  api: {
    baseUrl: string;
    workerUrl?: string;
    endpoints: {
      videos: string;
      categoryVideos: string;
      videoDetails: string;
      search?: string;
    };
  };
  
  // Static categories (if not fetched dynamically)
  staticCategories?: UnifiedCategoryData[];
  
  // Pagination settings
  pagination: {
    enabled: boolean;
    maxPages: number;
    itemsPerPage: number;
  };
  
  // Feature flags
  features: {
    hasSearch: boolean;
    hasGalleries: boolean;
    hasStories: boolean;
    hasDynamicCategories: boolean;
  };
}

/**
 * FSIBlog Provider Configuration
 */
export const fsiblogConfig: ProviderConfig = {
  metadata: {
    id: 'fsiblog5',
    name: 'fsiblog5',
    displayName: 'FSIBlog',
    description: 'Extensive library of desi content featuring videos, photo galleries, and exclusive stories.',
    icon: '📸',
    color: {
      primary: 'emerald-500',
      secondary: 'green-600',
      gradient: 'from-emerald-500 to-green-600',
    },
    stats: {
      videos: '15,000+',
      categories: 12,
    },
    features: ['Video Content', 'Photo Galleries', 'Stories', 'Daily Updates'],
    baseUrl: 'https://www.fsiblog5.com',
    workerUrl: 'https://fsiblog5.premiumhub.workers.dev',
  },
  
  api: {
    baseUrl: 'https://www.fsiblog5.com',
    workerUrl: 'https://fsiblog5.premiumhub.workers.dev',
    endpoints: {
      videos: '/sex-photos/page/{page}/',
      categoryVideos: '/category/{category}/page/{page}/',
      videoDetails: '/{category}/{slug}/',
      search: '/?s={query}',
    },
  },
  
  staticCategories: [
    { slug: 'blowjob', name: 'Blowjob', url: 'https://www.fsiblog5.com/category/blowjob/', provider: 'fsiblog5' },
    { slug: 'couple', name: 'Couple', url: 'https://www.fsiblog5.com/category/couple/', provider: 'fsiblog5' },
    { slug: 'cuckold', name: 'Cuckold', url: 'https://www.fsiblog5.com/category/cuckold/', provider: 'fsiblog5' },
    { slug: 'nude-indian-girl', name: 'Nude Indian Girl', url: 'https://www.fsiblog5.com/category/nude-indian-girl/', provider: 'fsiblog5' },
    { slug: 'indian-wife', name: 'Indian Wife', url: 'https://www.fsiblog5.com/category/indian-wife/', provider: 'fsiblog5' },
    { slug: 'college-girl', name: 'College Girl', url: 'https://www.fsiblog5.com/category/college-girl/', provider: 'fsiblog5' },
    { slug: 'aunty', name: 'Aunty', url: 'https://www.fsiblog5.com/category/aunty/', provider: 'fsiblog5' },
    { slug: 'bhabhi', name: 'Bhabhi', url: 'https://www.fsiblog5.com/category/bhabhi/', provider: 'fsiblog5' },
    { slug: 'desi-mms', name: 'Desi MMS', url: 'https://www.fsiblog5.com/category/desi-mms/', provider: 'fsiblog5' },
    { slug: 'fingering', name: 'Fingering', url: 'https://www.fsiblog5.com/category/fingering/', provider: 'fsiblog5' },
    { slug: 'lesbian', name: 'Lesbian', url: 'https://www.fsiblog5.com/category/lesbian/', provider: 'fsiblog5' },
    { slug: 'threesome', name: 'Threesome', url: 'https://www.fsiblog5.com/category/threesome/', provider: 'fsiblog5' },
  ],
  
  pagination: {
    enabled: true,
    maxPages: 10,
    itemsPerPage: 12,
  },
  
  features: {
    hasSearch: true,
    hasGalleries: true,
    hasStories: true,
    hasDynamicCategories: false,
  },
};

/**
 * IndianPornHQ Provider Configuration
 */
export const indianPornHQConfig: ProviderConfig = {
  metadata: {
    id: 'indianpornhq',
    name: 'indianpornhq',
    displayName: 'IndianPornHQ',
    description: 'Premium collection of high-quality Indian adult content with exclusive videos and categories.',
    icon: '🇮🇳',
    color: {
      primary: 'blue-500',
      secondary: 'indigo-600',
      gradient: 'from-blue-500 to-indigo-600',
    },
    stats: {
      videos: '10,000+',
      categories: 50,
    },
    features: ['HD Videos', 'Multiple Categories', 'Regular Updates', 'High Quality'],
    baseUrl: 'https://indianpornhq.com',
    workerUrl: 'https://indianpornhq.premiumhub.workers.dev',
  },
  
  api: {
    baseUrl: 'https://indianpornhq.com',
    workerUrl: 'https://indianpornhq.premiumhub.workers.dev',
    endpoints: {
      videos: '/page/{page}',
      categoryVideos: '/category/{category}/',
      videoDetails: '/watch/{id}/',
    },
  },
  
  staticCategories: undefined, // Fetched dynamically
  
  pagination: {
    enabled: true,
    maxPages: 1, // Single page for categories
    itemsPerPage: 20,
  },
  
  features: {
    hasSearch: false,
    hasGalleries: false,
    hasStories: false,
    hasDynamicCategories: true,
  },
};

/**
 * Superporn Provider Configuration (Foreign Provider)
 */
export const superpornConfig: ProviderConfig = {
  metadata: {
    id: 'superporn',
    name: 'superporn',
    displayName: 'Superporn',
    description: 'International adult content with diverse categories and high-quality videos.',
    icon: '🌍',
    color: {
      primary: 'purple-500',
      secondary: 'pink-600',
      gradient: 'from-purple-500 to-pink-600',
    },
    stats: {
      videos: '25,000+',
      categories: 100,
    },
    features: ['International Content', 'Multiple Categories', 'Search', 'HD Videos'],
    baseUrl: '/api/proxy',
    workerUrl: undefined,
  },
  
  api: {
    baseUrl: '/api/proxy',
    endpoints: {
      videos: '/videos/{page}',
      categoryVideos: '/categories/{category}/{page}',
      videoDetails: '/video/{id}/',
      search: '/search?q={query}&page={page}',
    },
  },
  
  staticCategories: undefined, // Fetched dynamically
  
  pagination: {
    enabled: true,
    maxPages: 20,
    itemsPerPage: 12,
  },
  
  features: {
    hasSearch: true,
    hasGalleries: false,
    hasStories: false,
    hasDynamicCategories: true,
  },
};

/**
 * All provider configurations
 */
export const providerConfigs: Record<string, ProviderConfig> = {
  fsiblog5: fsiblogConfig,
  indianpornhq: indianPornHQConfig,
  superporn: superpornConfig,
};

/**
 * Get provider configuration
 */
export function getProviderConfig(providerId: string): ProviderConfig | undefined {
  return providerConfigs[providerId];
}

/**
 * Get all provider IDs
 */
export function getAllProviderIds(): string[] {
  return Object.keys(providerConfigs);
}

/**
 * Get all provider metadata
 */
export function getAllProviderMetadata(): ProviderMetadata[] {
  return Object.values(providerConfigs).map(config => config.metadata);
}
