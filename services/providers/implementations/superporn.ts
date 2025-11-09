import { BaseProvider } from '../base';
import { 
  UnifiedVideoData, 
  ProviderResponse, 
  UnifiedCategoryData,
  PaginationParams,
  SearchParams,
  CategoryParams
} from '../types';
import { providerConfigs } from '../config';
import { providerCache, CACHE_DURATIONS } from '../cache';

/**
 * Superporn Provider (Foreign Provider)
 * Handles fetching international adult content from Superporn API
 */
export class SuperpornProvider extends BaseProvider {
  constructor() {
    super(providerConfigs.superporn);
  }

  /**
   * Fetch videos from homepage or paginated list
   */
  async fetchVideos(params: PaginationParams = {}): Promise<ProviderResponse<UnifiedVideoData[]>> {
    try {
      const { page = 1, limit = 12 } = params;
      
      // Check cache first
      const cached = await providerCache.get<UnifiedVideoData[]>(
        this.config.metadata.id,
        'videos',
        { page }
      );
      if (cached) {
        this.log(`Returning ${cached.length} cached videos for page ${page}`);
        return this.createSuccessResponse(cached, { currentPage: page, hasMore: true });
      }

      // Use environment variable or localhost for development
      const baseUrl = process.env.CATEGORY_API_URL || 'http://localhost:3000/api/proxy/categories';
      const url = `${baseUrl}/videos${page > 1 ? `/${page}` : ''}`;
      this.log(`Fetching videos from: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform to UnifiedVideoData
      const videos: UnifiedVideoData[] = [];
      
      if (data.videos && Array.isArray(data.videos)) {
        for (const [index, video] of data.videos.entries()) {
          // Use thumbnailUrl from API or fallback to thumbnail field
          const thumbnailUrl = video.thumbnailUrl || video.thumbnail || '';
          
          videos.push({
            id: video.id || `video-${index}`,
            slug: video.id || `video-${index}`,
            title: video.title || 'Video Content',
            thumbnail: thumbnailUrl, // Ensure thumbnail is populated for /categories page
            thumbnailUrl: thumbnailUrl, // Keep thumbnailUrl for direct access
            url: video.url || '', // Add URL for video player
            postUrl: `/category/video/${video.id}`,
            provider: this.config.metadata.id,
            type: 'porn-video',
            videoUrl: video.playerUrl || '',
            duration: video.duration || '0:00',
            views: video.views || '0',
            categories: video.category ? [video.category] : [],
            tags: [],
          });
        }
      }
      
      this.log(`Extracted ${videos.length} videos from page ${page}`);
      
      // Cache the result
      await providerCache.set(
        this.config.metadata.id,
        'videos',
        videos,
        CACHE_DURATIONS.VIDEOS,
        { page }
      );
      
      return this.createSuccessResponse(videos, { 
        currentPage: page, 
        hasMore: data.pagination?.hasNextPage || false
      });
      
    } catch (error) {
      this.logError('Failed to fetch videos', error);
      return this.createErrorResponse('Failed to fetch videos from Superporn');
    }
  }

  /**
   * Fetch videos from a specific category
   */
  async fetchCategoryVideos(params: CategoryParams): Promise<ProviderResponse<UnifiedVideoData[]>> {
    try {
      const { categorySlug, page = 1, limit = 12 } = params;
      
      // Check cache
      const cached = await providerCache.get<UnifiedVideoData[]>(
        this.config.metadata.id,
        'category_videos',
        { categorySlug, page }
      );
      if (cached) {
        this.log(`Returning ${cached.length} cached category videos for ${categorySlug}`);
        return this.createSuccessResponse(cached, { currentPage: page, hasMore: true });
      }

      // Use environment variable or localhost for development
      const baseUrl = process.env.CATEGORY_API_URL || 'http://localhost:3000/api/proxy/categories';
      const url = `${baseUrl}/${categorySlug}${page > 1 ? `/${page}` : ''}`;
      
      this.log(`Fetching category videos from: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform to UnifiedVideoData
      const videos: UnifiedVideoData[] = [];
      
      if (data.videos && Array.isArray(data.videos)) {
        for (const [index, video] of data.videos.entries()) {
          videos.push({
            id: video.id || `video-${index}`,
            slug: video.id || `video-${index}`,
            title: video.title || 'Video Content',
            thumbnail: video.thumbnail || '',
            postUrl: `/category/video/${video.id}`,
            provider: this.config.metadata.id,
            type: 'porn-video',
            videoUrl: video.playerUrl || '',
            duration: video.duration || '0:00',
            views: video.views || '0',
            categories: [categorySlug],
            tags: [],
          });
        }
      }
      
      this.log(`Extracted ${videos.length} videos from category ${categorySlug} page ${page}`);
      
      // Cache the result
      await providerCache.set(
        this.config.metadata.id,
        'category_videos',
        videos,
        CACHE_DURATIONS.VIDEOS,
        { categorySlug, page }
      );
      
      return this.createSuccessResponse(videos, { 
        currentPage: page, 
        hasMore: data.pagination?.hasNextPage || false
      });
      
    } catch (error) {
      this.logError(`Failed to fetch category videos for ${params.categorySlug}`, error);
      return this.createErrorResponse('Failed to fetch category videos');
    }
  }

  /**
   * Get detailed video information
   */
  async getVideoDetails(slug: string, categorySlug?: string): Promise<ProviderResponse<UnifiedVideoData>> {
    try {
      // Check cache
      const cached = await providerCache.get<UnifiedVideoData>(
        this.config.metadata.id,
        'video_details',
        { slug, categorySlug }
      );
      if (cached) {
        this.log(`Returning cached video details for ${slug}`);
        return this.createSuccessResponse(cached);
      }

      // For Superporn, fetch video details
      // First try to get from category videos if categorySlug is provided
      if (categorySlug) {
        const videosResponse = await this.fetchCategoryVideos({ categorySlug, page: 1 });
        if (videosResponse.success && videosResponse.data) {
          const video = videosResponse.data.find(v => v.id === slug || v.slug === slug);
          if (video) {
            return this.createSuccessResponse(video);
          }
        }
      }
      
      // Fallback: get from general videos
      const videosResponse = await this.fetchVideos({ page: 1 });
      if (videosResponse.success && videosResponse.data) {
        const video = videosResponse.data.find(v => v.id === slug || v.slug === slug);
        if (video) {
          // Cache the result
          await providerCache.set(
            this.config.metadata.id,
            'video_details',
            video,
            CACHE_DURATIONS.VIDEO_DETAILS,
            { slug, categorySlug }
          );
          return this.createSuccessResponse(video);
        }
      }
      
      return this.createErrorResponse('Video not found');
      
    } catch (error) {
      this.logError(`Failed to fetch video details for ${slug}`, error);
      return this.createErrorResponse('Failed to fetch video details');
    }
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<ProviderResponse<UnifiedCategoryData[]>> {
    try {
      // Check cache
      const cached = await providerCache.get<UnifiedCategoryData[]>(
        this.config.metadata.id,
        'categories',
        {}
      );
      if (cached) {
        this.log(`Returning ${cached.length} cached categories`);
        return this.createSuccessResponse(cached);
      }

      // Fetch categories from external API
      this.log('Fetching categories from API');
      
      // Use environment variable for the base URL or default to localhost in development
      const baseUrl = process.env.CATEGORY_API_URL || 'http://localhost:3000/api/proxy/categories';
      
      // Fetch multiple pages to get all categories (Superporn has 100+ categories)
      const pagesToFetch = 5; // Fetch first 5 pages to get ~100 categories
      const categoryPromises = [];
      
      for (let page = 1; page <= pagesToFetch; page++) {
        const url = page === 1 ? `${baseUrl}/categories` : `${baseUrl}/categories/${page}`;
        categoryPromises.push(
          fetch(url).then(res => res.ok ? res.json() : { categories: [] })
        );
      }
      
      const pagesData = await Promise.all(categoryPromises);
      
      // Combine all categories from all pages
      const allCategoriesData = pagesData.flatMap(pageData => pageData.categories || []);
      
      // Transform to UnifiedCategoryData
      const categories: UnifiedCategoryData[] = allCategoriesData.map(cat => ({
        slug: cat.slug,
        name: cat.name,
        url: `/category/${cat.slug}`,
        provider: this.config.metadata.id,
        count: cat.videoCount,
        thumbnail: cat.imageUrl,
      }));
      
      this.log(`Extracted ${categories.length} categories`);
      
      // Cache the result
      await providerCache.set(
        this.config.metadata.id,
        'categories',
        categories,
        CACHE_DURATIONS.CATEGORIES
      );
      
      return this.createSuccessResponse(categories);
      
    } catch (error) {
      this.logError('Failed to fetch categories', error);
      return this.createErrorResponse('Failed to fetch categories');
    }
  }

  /**
   * Search videos
   */
  async searchVideos(params: SearchParams): Promise<ProviderResponse<UnifiedVideoData[]>> {
    try {
      const { query, page = 1 } = params;
      
      // Check cache
      const cached = await providerCache.get<UnifiedVideoData[]>(
        this.config.metadata.id,
        'search',
        { query, page }
      );
      if (cached) {
        this.log(`Returning ${cached.length} cached search results for "${query}"`);
        return this.createSuccessResponse(cached, { currentPage: page, hasMore: false });
      }

      this.log(`Searching videos for: "${query}"`);
      
      // Use environment variable or localhost for development
      const baseUrl = process.env.SEARCH_API_URL || 'http://localhost:3000/api/proxy/search';
      const url = `${baseUrl}?q=${encodeURIComponent(query)}&page=${page}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform to UnifiedVideoData
      const videos: UnifiedVideoData[] = [];
      
      if (data.videos && Array.isArray(data.videos)) {
        for (const [index, video] of data.videos.entries()) {
          // Use thumbnailUrl from API or fallback to thumbnail field
          const thumbnailUrl = video.thumbnailUrl || video.thumbnail || '';
          
          videos.push({
            id: video.id || `video-${index}`,
            slug: video.id || `video-${index}`,
            title: video.title || 'Video Content',
            thumbnail: thumbnailUrl, // Ensure thumbnail is populated for /categories page
            thumbnailUrl: thumbnailUrl, // Keep thumbnailUrl for direct access
            url: video.url || '', // Add URL for video player
            postUrl: `/category/video/${video.id}`,
            provider: this.config.metadata.id,
            type: 'porn-video',
            videoUrl: video.playerUrl || '',
            duration: video.duration || '0:00',
            views: video.views || '0',
            categories: video.category ? [video.category] : [],
            tags: [],
          });
        }
      }
      
      this.log(`Found ${videos.length} search results for "${query}"`);
      
      // Cache the result
      await providerCache.set(
        this.config.metadata.id,
        'search',
        videos,
        CACHE_DURATIONS.SEARCH,
        { query, page }
      );
      
      return this.createSuccessResponse(videos, { 
        currentPage: page, 
        hasMore: data.pagination?.hasNextPage || false
      });
      
    } catch (error) {
      this.logError(`Failed to search videos for "${params.query}"`, error);
      return this.createErrorResponse('Failed to search videos');
    }
  }
}
