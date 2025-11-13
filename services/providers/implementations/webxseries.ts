import { BaseProvider } from '../base';
import { webxseriesConfig } from '../config';
import type { 
  UnifiedVideoData, 
  UnifiedCategoryData, 
  ProviderResponse,
  PaginationParams,
  SearchParams,
  CategoryParams
} from '../types';
import * as webxseriesService from '../../webxseries';

export class WebXSeriesProvider extends BaseProvider {
  constructor() {
    super(webxseriesConfig);
  }

  /**
   * Fetch videos from homepage or paginated pages
   */
  async fetchVideos(params?: PaginationParams): Promise<ProviderResponse<UnifiedVideoData[]>> {
    try {
      const { page = 1, limit = 12 } = params || {};
      console.log(`[WebXSeriesProvider] Fetching videos for page ${page}, limit ${limit}`);
      
      const videos = await webxseriesService.fetchHomepageVideos(page);
      const normalizedVideos = videos.map(video => this.normalizeVideo(video));
      
      // Since we can't get exact total from the site, estimate based on results
      // WebXSeries typically has around 30 items per page
      const hasMore = videos.length >= 20; // If we got a decent number, assume there are more pages
      const estimatedTotal = hasMore ? (page * videos.length) + limit : page * videos.length;
      const totalPages = Math.ceil(estimatedTotal / limit);
      
      console.log(`[WebXSeriesProvider] Fetched ${normalizedVideos.length} videos, hasMore: ${hasMore}, estimated total: ${estimatedTotal}, totalPages: ${totalPages}`);
      
      return this.createSuccessResponse(normalizedVideos, {
        currentPage: page,
        totalPages,
        total: estimatedTotal,
        hasMore,
      });
    } catch (error) {
      console.error('[WebXSeriesProvider] Error fetching videos:', error);
      return this.createErrorResponse(error instanceof Error ? error.message : 'Failed to fetch videos');
    }
  }

  /**
   * Fetch videos by category
   */
  async fetchCategoryVideos(params: CategoryParams): Promise<ProviderResponse<UnifiedVideoData[]>> {
    try {
      const { categorySlug, page = 1, limit = 12 } = params;
      console.log(`[WebXSeriesProvider] Fetching category videos: ${categorySlug}, page ${page}`);
      
      const videos = await webxseriesService.fetchCategoryVideos(categorySlug, page);
      const normalizedVideos = videos.map(video => this.normalizeVideo(video));
      
      return this.createSuccessResponse(normalizedVideos, {
        currentPage: page,
        hasMore: videos.length >= limit,
      });
    } catch (error) {
      console.error('[WebXSeriesProvider] Error fetching category videos:', error);
      return this.createErrorResponse(error instanceof Error ? error.message : 'Failed to fetch category videos');
    }
  }

  /**
   * Fetch video details
   */
  async getVideoDetails(slug: string, categorySlug?: string): Promise<ProviderResponse<UnifiedVideoData>> {
    try {
      console.log(`[WebXSeriesProvider] Fetching video details: ${slug}`);
      
      const details = await webxseriesService.extractVideoDetails(slug);
      if (!details) {
        return this.createErrorResponse('Video not found');
      }
      
      const video: webxseriesService.WebXSeriesVideo = {
        title: details.title,
        slug: details.slug,
        url: details.url,
        thumbnail: details.thumbnail,
      };
      
      return this.createSuccessResponse(this.normalizeVideoWithDetails(video, details));
    } catch (error) {
      console.error('[WebXSeriesProvider] Error fetching video details:', error);
      return this.createErrorResponse(error instanceof Error ? error.message : 'Failed to fetch video details');
    }
  }

  /**
   * Fetch all categories
   */
  async getCategories(): Promise<ProviderResponse<UnifiedCategoryData[]>> {
    try {
      console.log('[WebXSeriesProvider] Fetching categories');
      
      const categories = await webxseriesService.extractCategories();
      
      const normalizedCategories = categories.map(cat => ({
        slug: cat.slug,
        name: cat.name,
        url: cat.url,
        provider: this.config.metadata.id,
        count: cat.count,
      }));
      
      return this.createSuccessResponse(normalizedCategories);
    } catch (error) {
      console.error('[WebXSeriesProvider] Error fetching categories:', error);
      return this.createErrorResponse(error instanceof Error ? error.message : 'Failed to fetch categories');
    }
  }

  /**
   * Search videos
   */
  async searchVideos(params: SearchParams): Promise<ProviderResponse<UnifiedVideoData[]>> {
    try {
      const { query, page = 1, limit = 12 } = params;
      console.log(`[WebXSeriesProvider] Searching videos: ${query}`);
      
      const videos = await webxseriesService.searchVideos(query, page);
      const normalizedVideos = videos.map(video => this.normalizeVideo(video));
      
      return this.createSuccessResponse(normalizedVideos, {
        currentPage: page,
        hasMore: videos.length >= limit,
      });
    } catch (error) {
      console.error('[WebXSeriesProvider] Error searching videos:', error);
      return this.createErrorResponse(error instanceof Error ? error.message : 'Failed to search videos');
    }
  }

  /**
   * Normalize webxseries video to unified format
   */
  private normalizeVideo(video: webxseriesService.WebXSeriesVideo): UnifiedVideoData {
    return {
      id: video.slug,
      title: video.title,
      slug: video.slug,
      thumbnail: video.thumbnail || '/api/placeholder?height=400&width=600&query=webxseries',
      thumbnailUrl: video.thumbnail || '/api/placeholder?height=400&width=600&query=webxseries',
      duration: video.duration || 'Unknown',
      type: 'porn-video',
      postUrl: video.url,
      videoUrl: video.url,
      provider: this.config.metadata.id,
      categories: [],
      tags: [],
      uploadDate: video.date,
      views: '0',
    };
  }

  /**
   * Normalize with extended details
   */
  private normalizeVideoWithDetails(video: webxseriesService.WebXSeriesVideo, details: any): UnifiedVideoData {
    // Normalize related videos if present
    const relatedVideos = details.relatedVideos?.map((relatedVideo: webxseriesService.WebXSeriesVideo) => 
      this.normalizeVideo(relatedVideo)
    ) || [];
    
    return {
      id: video.slug,
      title: details.title || video.title,
      slug: video.slug,
      thumbnail: details.thumbnail || video.thumbnail || '/api/placeholder?height=400&width=600&query=webxseries',
      thumbnailUrl: details.thumbnail || video.thumbnail || '/api/placeholder?height=400&width=600&query=webxseries',
      duration: video.duration || 'Unknown',
      type: 'porn-video',
      postUrl: details.url,
      videoUrl: details.videoUrl || details.url,
      embedUrl: details.iframeSrc || details.videoUrl,
      provider: this.config.metadata.id,
      categories: details.platform ? [details.platform] : [],
      tags: details.tags || [],
      uploadDate: video.date,
      views: '0',
      description: details.description,
      relatedVideos: relatedVideos,
    };
  }
}
