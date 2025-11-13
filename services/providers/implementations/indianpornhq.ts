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
import { fetchHTML, scrapeVideosFromPage, scrapeVideoDetails, scrapeCategories } from '@/pages/api/providers/indianpornhq/utils/scraper';
import { generateVideoSlug } from '@/utils/slug';

/**
 * IndianPornHQ Provider
 * Handles fetching HD Indian porn content from IndianPornHQ
 */
export class IndianPornHQProvider extends BaseProvider {
  constructor() {
    super(providerConfigs.indianpornhq);
  }

  /**
   * Fetch videos from homepage or specific page type
   */
  async fetchVideos(params: PaginationParams = {}): Promise<ProviderResponse<UnifiedVideoData[]>> {
    try {
      const { page = 1 } = params;
      
      // Check cache first
      const cached = await providerCache.get<UnifiedVideoData[]>(
        this.config.metadata.id,
        'videos',
        { page }
      );
      if (cached) {
        this.log(`Returning ${cached.length} cached videos for page ${page}`);
        return this.createSuccessResponse(cached, { currentPage: page, hasMore: false });
      }

      // IndianPornHQ doesn't have pagination, always fetch homepage
      const url = this.config.api.baseUrl;
      this.log(`Fetching videos from: ${url}`);
      
      const html = await fetchHTML(url);
      const scrapedVideos = scrapeVideosFromPage(html, 'homepage');
      
      // Transform to UnifiedVideoData
      const videos: UnifiedVideoData[] = scrapedVideos.map((video, index) => {
        const videoId = video.id || video.url || `video-${index}`;
        const title = video.title || 'Video Content';
        const seoSlug = generateVideoSlug(title, videoId, this.config.metadata.id, index);
        
        return {
          id: videoId,
          slug: seoSlug,
          title,
          thumbnail: video.thumbnail_url, // IndianPornHQ images don't need proxying
          postUrl: video.url || '',
          provider: this.config.metadata.id,
          type: 'porn-video',
          videoUrl: video.url,
          duration: video.duration || '0:00',
          views: video.views || '0',
          categories: [],
          tags: [],
        };
      });
      
      this.log(`Extracted ${videos.length} videos`);
      
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
        hasMore: false // IndianPornHQ doesn't support pagination
      });
      
    } catch (error) {
      this.logError('Failed to fetch videos', error);
      return this.createErrorResponse('Failed to fetch videos from IndianPornHQ');
    }
  }

  /**
   * Fetch videos from a specific category
   */
  async fetchCategoryVideos(params: CategoryParams): Promise<ProviderResponse<UnifiedVideoData[]>> {
    try {
      const { categorySlug, page = 1 } = params;
      
      // Check cache
      const cached = await providerCache.get<UnifiedVideoData[]>(
        this.config.metadata.id,
        'category_videos',
        { categorySlug, page }
      );
      if (cached) {
        this.log(`Returning ${cached.length} cached category videos for ${categorySlug}`);
        return this.createSuccessResponse(cached, { currentPage: page, hasMore: false });
      }

      // Construct category URL
      // categorySlug could be full URL, path with /, or just slug
      let categoryUrl: string;
      if (categorySlug.startsWith('http')) {
        // Full URL provided
        categoryUrl = categorySlug;
      } else if (categorySlug.startsWith('/')) {
        // Path provided (like /indian/longest-videos/)
        categoryUrl = `${this.config.api.baseUrl}${categorySlug}`;
      } else {
        // Just slug provided (like "69" or "amateur")
        // These are direct categories at the root level
        categoryUrl = `${this.config.api.baseUrl}/${categorySlug}/`;
      }
      
      this.log(`Fetching category videos from: ${categoryUrl}`);
      
      const html = await fetchHTML(categoryUrl);
      const scrapedVideos = scrapeVideosFromPage(html, 'category');
      
      // Transform to UnifiedVideoData
      const videos: UnifiedVideoData[] = scrapedVideos.map((video, index) => {
        const videoId = video.id || video.url || `video-${index}`;
        const title = video.title || 'Video Content';
        const seoSlug = generateVideoSlug(title, videoId, this.config.metadata.id, index);
        
        return {
          id: videoId,
          slug: seoSlug,
          title,
          thumbnail: video.thumbnail_url, // IndianPornHQ images don't need proxying
          postUrl: video.url || '',
          provider: this.config.metadata.id,
          type: 'porn-video',
          videoUrl: video.url,
          duration: video.duration || '0:00',
          views: video.views || '0',
          categories: [categorySlug],
          tags: [],
        };
      });
      
      this.log(`Extracted ${videos.length} videos from category ${categorySlug}`);
      
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
        hasMore: false 
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

      // For IndianPornHQ, we need to fetch from the list to find the video
      // The slug is a generated SEO slug, we need to extract the index
      const indexMatch = slug.match(/-(\d+)$/);
      if (!indexMatch) {
        return this.createErrorResponse('Invalid video slug format');
      }
      
      const videoIndex = parseInt(indexMatch[1], 10);
      this.log(`Extracting video at index ${videoIndex} from slug: ${slug}`);
      
      // Fetch videos list
      let videosResponse: ProviderResponse<UnifiedVideoData[]>;
      if (categorySlug) {
        this.log(`Fetching videos from category: ${categorySlug}`);
        videosResponse = await this.fetchCategoryVideos({ categorySlug });
      } else {
        this.log(`Fetching videos from homepage`);
        videosResponse = await this.fetchVideos({});
      }
      
      if (!videosResponse.success || !videosResponse.data) {
        this.log(`[getVideoDetails] Failed to fetch videos list`);
        return this.createErrorResponse('Failed to fetch video list');
      }
      
      this.log(`[getVideoDetails] Got ${videosResponse.data.length} videos, looking for index ${videoIndex}`);
      
      const video = videosResponse.data[videoIndex];
      if (!video) {
        this.log(`[getVideoDetails] Video not found at index ${videoIndex}. Available indices: 0-${videosResponse.data.length - 1}`);
        return this.createErrorResponse('Video not found at index');
      }
      
      this.log(`[getVideoDetails] Found video at index ${videoIndex}: ${video.title}`);
      
      // If we have a video URL, fetch detailed information
      if (video.postUrl) {
        this.log(`Fetching detailed video info from: ${video.postUrl}`);
        
        try {
          const html = await fetchHTML(video.postUrl);
          const details = scrapeVideoDetails(html);
          
          if (details) {
            // Merge details with existing video data
            const detailedVideo: UnifiedVideoData = {
              ...video,
              title: details.title || video.title,
              description: details.description,
              thumbnail: details.thumbnail_url || video.thumbnail, // IndianPornHQ images don't need proxying
              videoUrl: details.video_url || details.embed_url,
              embedUrl: details.embed_url,
              xhamsterEmbedUrl: details.xhamster_embed_url,
              duration: details.duration || video.duration,
              views: details.views || video.views,
              tags: details.tags || [],
              uploadDate: details.upload_date,
            };
            
            this.log(`[getVideoDetails] Tags from scraper: ${details.tags?.length || 0} tags - ${details.tags?.join(', ') || 'none'}`);
            this.log(`[getVideoDetails] Merged detailedVideo.tags: ${detailedVideo.tags?.length || 0} tags - ${detailedVideo.tags?.join(', ') || 'none'}`);
            
            // Cache the result
            await providerCache.set(
              this.config.metadata.id,
              'video_details',
              detailedVideo,
              CACHE_DURATIONS.VIDEO_DETAILS,
              { slug, categorySlug }
            );
            
            this.log(`Extracted detailed video info: ${detailedVideo.title}`);
            return this.createSuccessResponse(detailedVideo);
          }
        } catch (detailError) {
          this.logError('Failed to fetch detailed video info, returning basic info', detailError);
        }
      }
      
      // Return basic video info if detailed fetch failed
      return this.createSuccessResponse(video);
      
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

      // Fetch and scrape categories from homepage
      this.log('Fetching categories from homepage');
      const html = await fetchHTML(this.config.api.baseUrl);
      const scrapedCategories = scrapeCategories(html);
      
      // Transform to UnifiedCategoryData
      const categories: UnifiedCategoryData[] = scrapedCategories.map(cat => ({
        slug: cat.url.split('/').filter(Boolean).pop() || cat.name.toLowerCase().replace(/\s+/g, '-'),
        name: cat.name,
        url: cat.url,
        provider: this.config.metadata.id,
        count: cat.count,
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
   * Note: IndianPornHQ doesn't have a search endpoint, so we'll search through fetched videos
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
      
      // Fetch all videos and filter by query
      const videosResponse = await this.fetchVideos({});
      if (!videosResponse.success || !videosResponse.data) {
        return this.createErrorResponse('Failed to fetch videos for search');
      }
      
      // Simple search: filter videos by title
      const searchTerm = query.toLowerCase();
      const matchingVideos = videosResponse.data.filter(video =>
        video.title.toLowerCase().includes(searchTerm)
      );
      
      this.log(`Found ${matchingVideos.length} search results for "${query}"`);
      
      // Cache the result
      await providerCache.set(
        this.config.metadata.id,
        'search',
        matchingVideos,
        CACHE_DURATIONS.SEARCH,
        { query, page }
      );
      
      return this.createSuccessResponse(matchingVideos, { 
        currentPage: page, 
        hasMore: false 
      });
      
    } catch (error) {
      this.logError(`Failed to search videos for "${params.query}"`, error);
      return this.createErrorResponse('Failed to search videos');
    }
  }
}
