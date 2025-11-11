import { BaseProvider } from '../base';
import { kamababaConfig } from '../config';
import type { 
  UnifiedVideoData, 
  UnifiedCategoryData, 
  ProviderResponse,
  PaginationParams,
  SearchParams,
  CategoryParams
} from '../types';
import * as kamababaService from '../../kamababa';

export class KamaBabaProvider extends BaseProvider {
  constructor() {
    super(kamababaConfig);
  }

  /**
   * Fetch videos from homepage or paginated pages
   */
  async fetchVideos(params?: PaginationParams): Promise<ProviderResponse<UnifiedVideoData[]>> {
    try {
      const { page = 1, limit = 33 } = params || {};
      console.log(`[KamaBabaProvider] Fetching videos for page ${page}`);
      
      const pageUrl = page > 1 ? `${this.config.metadata.baseUrl}/page/${page}/` : undefined;
      const videos = await kamababaService.fetchVideos(pageUrl);
      
      const normalizedVideos = videos.map(video => this.normalizeVideo(video));
      
      return this.createSuccessResponse(normalizedVideos, {
        currentPage: page,
        hasMore: videos.length >= limit,
      });
    } catch (error) {
      console.error('[KamaBabaProvider] Error fetching videos:', error);
      return this.createErrorResponse(error instanceof Error ? error.message : 'Failed to fetch videos');
    }
  }

  /**
   * Fetch videos by category
   */
  async fetchCategoryVideos(params: CategoryParams): Promise<ProviderResponse<UnifiedVideoData[]>> {
    try {
      const { categorySlug, page = 1, limit = 33 } = params;
      console.log(`[KamaBabaProvider] Fetching category videos: ${categorySlug}, page ${page}`);
      
      const videos = await kamababaService.fetchCategoryVideos(categorySlug, page);
      const normalizedVideos = videos.map(video => this.normalizeVideo(video));
      
      return this.createSuccessResponse(normalizedVideos, {
        currentPage: page,
        hasMore: videos.length >= limit,
      });
    } catch (error) {
      console.error('[KamaBabaProvider] Error fetching category videos:', error);
      return this.createErrorResponse(error instanceof Error ? error.message : 'Failed to fetch category videos');
    }
  }

  /**
   * Fetch video details
   */
  async getVideoDetails(slug: string, categorySlug?: string): Promise<ProviderResponse<UnifiedVideoData>> {
    try {
      console.log(`[KamaBabaProvider] Fetching video details: ${slug}`);
      
      const video = await kamababaService.getVideoBySlug(slug);
      if (!video) {
        return this.createErrorResponse('Video not found');
      }
      
      return this.createSuccessResponse(this.normalizeVideo(video));
    } catch (error) {
      console.error('[KamaBabaProvider] Error fetching video details:', error);
      return this.createErrorResponse(error instanceof Error ? error.message : 'Failed to fetch video details');
    }
  }

  /**
   * Fetch all categories
   */
  async getCategories(): Promise<ProviderResponse<UnifiedCategoryData[]>> {
    try {
      console.log('[KamaBabaProvider] Fetching categories');
      
      const categories = await kamababaService.fetchCategories();
      
      const normalizedCategories = categories.map(cat => ({
        slug: cat.slug,
        name: cat.name,
        url: cat.url,
        provider: this.config.metadata.id,
        thumbnail: cat.thumbnail,
        count: cat.count,
      }));
      
      return this.createSuccessResponse(normalizedCategories);
    } catch (error) {
      console.error('[KamaBabaProvider] Error fetching categories:', error);
      return this.createErrorResponse(error instanceof Error ? error.message : 'Failed to fetch categories');
    }
  }

  /**
   * Search videos
   */
  async searchVideos(params: SearchParams): Promise<ProviderResponse<UnifiedVideoData[]>> {
    try {
      const { query, page = 1, limit = 33 } = params;
      console.log(`[KamaBabaProvider] Searching videos: ${query}`);
      
      const videos = await kamababaService.searchVideos(query);
      const normalizedVideos = videos.map(video => this.normalizeVideo(video));
      
      return this.createSuccessResponse(normalizedVideos, {
        currentPage: page,
        hasMore: false, // Search doesn't support pagination
      });
    } catch (error) {
      console.error('[KamaBabaProvider] Error searching videos:', error);
      return this.createErrorResponse(error instanceof Error ? error.message : 'Failed to search videos');
    }
  }

  /**
   * Normalize kamababa video to unified format
   */
  private normalizeVideo(video: kamababaService.KamaBabaVideo): UnifiedVideoData {
    return {
      id: video.id,
      title: video.title,
      slug: video.slug,
      thumbnail: video.thumbnail,
      thumbnailUrl: video.thumbnail,
      duration: video.duration || 'Unknown',
      type: 'porn-video',
      postUrl: video.postUrl,
      videoUrl: video.videoUrl,
      embedUrl: video.embedUrl,
      provider: this.config.metadata.id,
      categories: video.categories,
      tags: video.tags,
      uploadDate: video.uploadDate,
      views: '0',
    };
  }
}
