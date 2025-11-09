import { ProviderConfig } from './config';
import {
  UnifiedVideoData,
  UnifiedCategoryData,
  ProviderResponse,
  PaginationParams,
  SearchParams,
  CategoryParams,
} from './types';

/**
 * Abstract base class for all content providers
 * All providers must extend this class and implement the abstract methods
 */
export abstract class BaseProvider {
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  /**
   * Get provider configuration
   */
  public getConfig(): ProviderConfig {
    return this.config;
  }

  /**
   * Get provider metadata
   */
  public getMetadata() {
    return this.config.metadata;
  }

  // ========== Abstract methods that must be implemented ==========

  /**
   * Fetch videos/posts from the provider
   */
  abstract fetchVideos(params?: PaginationParams): Promise<ProviderResponse<UnifiedVideoData[]>>;

  /**
   * Fetch videos from a specific category
   */
  abstract fetchCategoryVideos(params: CategoryParams): Promise<ProviderResponse<UnifiedVideoData[]>>;

  /**
   * Get detailed information about a specific video/post
   */
  abstract getVideoDetails(slug: string, categorySlug?: string): Promise<ProviderResponse<UnifiedVideoData>>;

  /**
   * Get all categories from the provider
   */
  abstract getCategories(): Promise<ProviderResponse<UnifiedCategoryData[]>>;

  /**
   * Search videos (if supported)
   */
  abstract searchVideos(params: SearchParams): Promise<ProviderResponse<UnifiedVideoData[]>>;

  // ========== Common utility methods ==========

  /**
   * Normalize URL to absolute URL
   */
  protected normalizeUrl(url: string, baseUrl?: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const base = baseUrl || this.config.api.baseUrl;
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  /**
   * Proxy image through worker (if worker URL is configured)
   */
  protected proxyImage(imageUrl: string): string {
    if (!imageUrl) return '';
    if (!this.config.api.workerUrl) return imageUrl;
    
    // Ensure absolute URL
    const absoluteUrl = this.normalizeUrl(imageUrl);
    
    return `${this.config.api.workerUrl}/?url=${encodeURIComponent(absoluteUrl)}`;
  }

  /**
   * Remove WordPress image size suffix to get full-size image
   */
  protected removeImageSizeSuffix(url: string): string {
    return url.replace(/-\d+x\d+(\.(jpg|jpeg|png|webp|gif))$/i, '$1');
  }

  /**
   * Extract all regex matches from HTML
   */
  protected extractAllMatches(html: string, pattern: RegExp): RegExpMatchArray[] {
    const matches: RegExpMatchArray[] = [];
    let match: RegExpMatchArray | null;
    
    while ((match = pattern.exec(html)) !== null) {
      matches.push(match);
    }
    
    return matches;
  }

  /**
   * Create a success response
   */
  protected createSuccessResponse<T>(data: T, pagination?: any): ProviderResponse<T> {
    return {
      success: true,
      data,
      provider: this.config.metadata.id,
      pagination,
    };
  }

  /**
   * Create an error response
   */
  protected createErrorResponse(error: string): ProviderResponse<never> {
    return {
      success: false,
      error,
      provider: this.config.metadata.id,
    };
  }

  /**
   * Fetch HTML from URL using worker proxy
   */
  protected async fetchHtml(url: string): Promise<string> {
    try {
      const workerUrl = this.config.api.workerUrl;
      if (!workerUrl) {
        throw new Error('Worker URL not configured for this provider');
      }

      const fetchUrl = `${workerUrl}/?url=${encodeURIComponent(url)}`;
      const response = await fetch(fetchUrl);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      console.error(`[${this.config.metadata.id}] Failed to fetch HTML from ${url}:`, error);
      throw error;
    }
  }

  /**
   * Sleep utility for rate limiting
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log with provider prefix
   */
  protected log(message: string, ...args: any[]): void {
    console.log(`[${this.config.metadata.id}] ${message}`, ...args);
  }

  /**
   * Log error with provider prefix
   */
  protected logError(message: string, ...args: any[]): void {
    console.error(`[${this.config.metadata.id}] ${message}`, ...args);
  }
}
