/**
 * Unified data types for all providers
 * This ensures consistent data structure across different content providers
 */

/**
 * Content type classification
 */
export type ContentType = 'porn-video' | 'sex-gallery' | 'sex-story';

/**
 * Unified video/post data structure
 * All providers must transform their data to this format
 */
export interface UnifiedVideoData {
  // Core identification
  id: string;
  slug: string;
  title: string;
  provider: string;
  
  // Content classification
  type: ContentType;
  
  // Visual content
  thumbnail: string;
  thumbnailUrl?: string; // Alternative thumbnail field for some providers
  
  // Video-specific (for type: 'porn-video')
  videoUrl?: string;
  embedUrl?: string;
  xhamsterEmbedUrl?: string; // For IndianPornHQ worker proxy
  url?: string; // Alternative URL field for video player
  duration?: string;
  
  // Gallery-specific (for type: 'sex-gallery')
  galleryImages?: string[];
  
  // Related content
  relatedVideos?: UnifiedVideoData[];
  
  // Metadata
  description?: string;
  excerpt?: string;
  uploadDate?: string;
  views?: string;
  models?: Array<{ slug: string; name: string }>; // Models/actors in the video
  
  // Categorization
  categories: string[];
  tags: string[];
  
  // URLs
  postUrl: string;
  categoryUrl?: string;
}

/**
 * Unified category data structure
 */
export interface UnifiedCategoryData {
  slug: string;
  name: string;
  url: string;
  provider: string;
  thumbnail?: string;
  count?: number;
  description?: string;
}

/**
 * API response wrapper
 */
export interface ProviderResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  provider?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

/**
 * Provider metadata for UI display
 */
export interface ProviderMetadata {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  color: {
    primary: string;
    secondary: string;
    gradient: string;
  };
  stats: {
    videos: string;
    categories: number;
  };
  features: string[];
  baseUrl: string;
  workerUrl?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Search parameters
 */
export interface SearchParams {
  query: string;
  page?: number;
  limit?: number;
}

/**
 * Category filter parameters
 */
export interface CategoryParams {
  categorySlug: string;
  page?: number;
  limit?: number;
}
