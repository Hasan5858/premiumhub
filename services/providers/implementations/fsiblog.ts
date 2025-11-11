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
 * FSIBlog Provider
 * Handles fetching Indian adult content from FSIBlog5
 */
export class FSIBlogProvider extends BaseProvider {
  constructor() {
    super(providerConfigs.fsiblog5);
  }

  /**
   * Fetch videos from homepage or paginated list
   */
  async fetchVideos(params: PaginationParams): Promise<ProviderResponse<UnifiedVideoData[]>> {
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
        return this.createSuccessResponse(cached, { currentPage: page, hasMore: page < 10 });
      }

      // Construct URL
      const url = page > 1 ? `${this.config.api.baseUrl}/page/${page}/` : this.config.api.baseUrl;
      this.log(`Fetching videos from: ${url}`);
      
      const html = await this.fetchHtml(url);
      const videos: UnifiedVideoData[] = [];
      
      // Find all article elements
      const articlePattern = /<article[^>]+class="[^"]*elementor-post[^"]*post-(\d+)[^"]*type-(porn-video|sex-gallery|sex-story)[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
      const articles = this.extractAllMatches(html, articlePattern);
      
      for (const articleMatch of articles) {
        const postId = articleMatch[1];
        const type = articleMatch[2] as 'porn-video' | 'sex-gallery' | 'sex-story';
        const articleHtml = articleMatch[3];
        
        // Extract title and URL
        const titleMatch = articleHtml.match(/<h3[^>]*class="elementor-post__title"[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>[\s\S]*?([^<]+)</i);
        if (!titleMatch) continue;
        
        const postUrl = titleMatch[1];
        const title = titleMatch[2].trim();
        
        // Extract slug from URL
        const slugMatch = postUrl.match(/\/([^\/]+)\/?$/);
        const slug = slugMatch ? slugMatch[1] : postId;
        
        // Extract thumbnail with priority for data-src (lazy loading)
        let thumbnail = '';
        const dataSrcMatch = articleHtml.match(/data-src="([^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/i);
        if (dataSrcMatch) {
          thumbnail = dataSrcMatch[1];
        } else {
          const srcMatch = articleHtml.match(/<img[^>]+src="([^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/i);
          if (srcMatch && !srcMatch[1].startsWith('data:')) {
            thumbnail = srcMatch[1];
          }
        }
        
        // Clean and process thumbnail
        thumbnail = thumbnail.replace(/['")\]]+$/, '');
        thumbnail = this.removeImageSizeSuffix(thumbnail);
        thumbnail = this.normalizeUrl(thumbnail);
        thumbnail = this.proxyImage(thumbnail);
        
        // Extract excerpt
        const excerptMatch = articleHtml.match(/<div[^>]*class="elementor-post__excerpt"[^>]*>[\s\S]*?<p>([^<]+)</i);
        const excerpt = excerptMatch ? excerptMatch[1].trim() : '';
        
        // Extract categories
        const categories: string[] = [];
        const catMatches = this.extractAllMatches(articleHtml, /<a[^>]+href="[^"]*\/category\/([^"\/]+)"[^>]*>([^<]+)</gi);
        for (const catMatch of catMatches) {
          categories.push(catMatch[2].trim());
        }
        
        // Extract tags
        const tags: string[] = [];
        const tagMatches = this.extractAllMatches(articleHtml, /<a[^>]+href="[^"]*\/tag\/([^"\/]+)"[^>]*>([^<]+)</gi);
        for (const tagMatch of tagMatches) {
          tags.push(tagMatch[2].trim());
        }
        
        if (title && postUrl) {
          videos.push({
            id: postId,
            slug,
            title,
            thumbnail,
            postUrl,
            provider: this.config.metadata.id,
            type,
            description: excerpt,
            categories,
            tags,
            views: "0",
            duration: "0",
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
        hasMore: videos.length >= limit && page < 10 
      });
      
    } catch (error) {
      this.logError('Failed to fetch videos', error);
      return this.createErrorResponse('Failed to fetch videos from FSIBlog');
    }
  }

  /**
   * Fetch videos from a specific category
   */
  async fetchCategoryVideos(params: CategoryParams): Promise<ProviderResponse<UnifiedVideoData[]>> {
    try {
      const { categorySlug, page = 1, limit = 12 } = params;
      
      // Check cache
      const cached = await providerCache.get<UnifiedVideoData[]>(this.config.metadata.id, 'category_videos', { categorySlug, page });
      if (cached) {
        this.log(`Returning ${cached.length} cached category videos for ${categorySlug} page ${page}`);
        return this.createSuccessResponse(cached, { currentPage: page, hasMore: page < 10 });
      }

      // Construct category URL
      const url = page > 1 
        ? `${this.config.api.baseUrl}/category/${categorySlug}/page/${page}/`
        : `${this.config.api.baseUrl}/category/${categorySlug}/`;
      
      this.log(`Fetching category videos from: ${url}`);
      
      const html = await this.fetchHtml(url);
      const videos: UnifiedVideoData[] = [];
      
      // Use same extraction logic as fetchVideos
      const articlePattern = /<article[^>]+class="[^"]*elementor-post[^"]*post-(\d+)[^"]*type-(porn-video|sex-gallery|sex-story)[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
      const articles = this.extractAllMatches(html, articlePattern);
      
      for (const articleMatch of articles) {
        const postId = articleMatch[1];
        const type = articleMatch[2] as 'porn-video' | 'sex-gallery' | 'sex-story';
        const articleHtml = articleMatch[3];
        
        const titleMatch = articleHtml.match(/<h3[^>]*class="elementor-post__title"[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>[\s\S]*?([^<]+)</i);
        if (!titleMatch) continue;
        
        const postUrl = titleMatch[1];
        const title = titleMatch[2].trim();
        const slugMatch = postUrl.match(/\/([^\/]+)\/?$/);
        const slug = slugMatch ? slugMatch[1] : postId;
        
        let thumbnail = '';
        const dataSrcMatch = articleHtml.match(/data-src="([^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/i);
        if (dataSrcMatch) {
          thumbnail = dataSrcMatch[1];
        } else {
          const srcMatch = articleHtml.match(/<img[^>]+src="([^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/i);
          if (srcMatch && !srcMatch[1].startsWith('data:')) {
            thumbnail = srcMatch[1];
          }
        }
        
        thumbnail = thumbnail.replace(/['")\]]+$/, '');
        thumbnail = this.removeImageSizeSuffix(thumbnail);
        thumbnail = this.normalizeUrl(thumbnail);
        thumbnail = this.proxyImage(thumbnail);
        
        const excerptMatch = articleHtml.match(/<div[^>]*class="elementor-post__excerpt"[^>]*>[\s\S]*?<p>([^<]+)</i);
        const excerpt = excerptMatch ? excerptMatch[1].trim() : '';
        
        const categories: string[] = [];
        const catMatches = this.extractAllMatches(articleHtml, /<a[^>]+href="[^"]*\/category\/([^"\/]+)"[^>]*>([^<]+)</gi);
        for (const catMatch of catMatches) {
          categories.push(catMatch[2].trim());
        }
        
        const tags: string[] = [];
        const tagMatches = this.extractAllMatches(articleHtml, /<a[^>]+href="[^"]*\/tag\/([^"\/]+)"[^>]*>([^<]+)</gi);
        for (const tagMatch of tagMatches) {
          tags.push(tagMatch[2].trim());
        }
        
        if (title && postUrl) {
          videos.push({
            id: postId,
            slug,
            title,
            thumbnail,
            postUrl,
            provider: this.config.metadata.id,
            type,
            description: excerpt,
            categories,
            tags,
            views: "0",
            duration: "0",
          });
        }
      }
      
      this.log(`Extracted ${videos.length} videos from category ${categorySlug} page ${page}`);
      
      // Cache the result
      await providerCache.set(this.config.metadata.id, 'videos', videos, CACHE_DURATIONS.VIDEOS);
      
      return this.createSuccessResponse(videos, { 
        currentPage: page, 
        hasMore: videos.length >= limit && page < 10 
      });
      
    } catch (error) {
      this.logError(`Failed to fetch category videos for ${params.categorySlug}`, error);
      return this.createErrorResponse('Failed to fetch category videos');
    }
  }

  /**
   * Extract related videos from sidebar widgets
   * Returns basic video info from sidebar links
   */
  private async extractRelatedVideosFromSidebar(html: string, currentPostId: string, limit: number = 9): Promise<UnifiedVideoData[]> {
    const relatedVideos: UnifiedVideoData[] = [];
    
    try {
      // Look for the "Related Porn Videos" section
      const relatedSectionPattern = /<section[^>]*>[\s\S]*?<h3[^>]*>Related Porn Videos<\/h3>[\s\S]*?<\/section>/i;
      const relatedSectionMatch = html.match(relatedSectionPattern);
      
      if (!relatedSectionMatch) {
        this.log('No "Related Porn Videos" section found');
        return relatedVideos;
      }
      
      const relatedSection = relatedSectionMatch[0];
      this.log('Found "Related Porn Videos" section');
      
      // Extract all article elements from related section
      const articlePattern = /<article[^>]+class="[^"]*elementor-post[^"]*post-(\d+)[^"]*type-(porn-video|sex-gallery|sex-story)[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
      const articles = this.extractAllMatches(relatedSection, articlePattern);
      
      this.log(`Found ${articles.length} related video articles`);
      
      for (const articleMatch of articles) {
        const postId = articleMatch[1];
        const type = articleMatch[2] as 'porn-video' | 'sex-gallery' | 'sex-story';
        const articleHtml = articleMatch[3];
        
        // Skip if it's the current video
        if (postId === currentPostId) continue;
        
        // Extract title and URL
        const titleMatch = articleHtml.match(/<h3[^>]*class="elementor-post__title"[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>[\s\S]*?([^<]+)</i);
        if (!titleMatch) continue;
        
        const postUrl = titleMatch[1];
        const title = titleMatch[2].trim();
        
        // Extract slug from URL
        const slugMatch = postUrl.match(/\/([^\/]+)\/?$/);
        const slug = slugMatch ? slugMatch[1] : postId;
        
        // Extract thumbnail with priority for data-src (lazy loading) and src
        let thumbnail = '';
        const dataSrcMatch = articleHtml.match(/data-src="([^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/i);
        if (dataSrcMatch) {
          thumbnail = dataSrcMatch[1];
        } else {
          const srcMatch = articleHtml.match(/<img[^>]+src="([^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/i);
          if (srcMatch && !srcMatch[1].startsWith('data:')) {
            thumbnail = srcMatch[1];
          }
        }
        
        // Clean and process thumbnail
        if (thumbnail) {
          thumbnail = thumbnail.replace(/['")\]]+$/, '');
          thumbnail = this.removeImageSizeSuffix(thumbnail);
          thumbnail = this.normalizeUrl(thumbnail);
          thumbnail = this.proxyImage(thumbnail);
        }
        
        // Extract categories from article class or URL
        const categories: string[] = [];
        const categoryClassMatch = articleHtml.match(/category-([a-z0-9-]+)/i);
        const categoryUrlMatch = postUrl.match(/\/([^\/]+)\/[^\/]+\/?$/);
        
        if (categoryClassMatch) {
          categories.push(categoryClassMatch[1]);
        } else if (categoryUrlMatch) {
          categories.push(categoryUrlMatch[1]);
        }
        
        // Extract tags from article class
        const tags: string[] = [];
        const tagMatches = this.extractAllMatches(articleHtml, /video-tag-([a-z0-9-]+)/gi);
        for (const tagMatch of tagMatches) {
          tags.push(tagMatch[1]);
        }
        
        relatedVideos.push({
          id: postId,
          slug,
          title,
          thumbnail,
          postUrl,
          provider: this.config.metadata.id,
          type,
          categories,
          tags,
          views: '0',
          duration: '0',
        });
        
        if (relatedVideos.length >= limit) break;
      }
      
      this.log(`Extracted ${relatedVideos.length} related videos`);
      
    } catch (error) {
      this.logError('Failed to extract related videos', error);
    }
    
    return relatedVideos;
  }

  /**
   * Get detailed video information
   */
  async getVideoDetails(slug: string, categorySlug?: string): Promise<ProviderResponse<UnifiedVideoData>> {
    try {
      // Check cache
      const cached = await providerCache.get<UnifiedVideoData>(this.config.metadata.id, 'video_details', { slug, categorySlug });
      if (cached) {
        this.log(`Returning cached video details for ${slug}`);
        return this.createSuccessResponse(cached);
      }

      // Construct post URL
      let postUrl: string;
      if (categorySlug) {
        postUrl = `${this.config.api.baseUrl}/${categorySlug}/${slug}/`;
      } else {
        // Try to find the video from homepage
        const videosResponse = await this.fetchVideos({ page: 1 });
        if (videosResponse.success && videosResponse.data) {
          const video = videosResponse.data.find(v => v.slug === slug);
          if (video && video.postUrl) {
            postUrl = video.postUrl;
          } else {
            // Fallback: try blowjob category
            postUrl = `${this.config.api.baseUrl}/blowjob/${slug}/`;
          }
        } else {
          postUrl = `${this.config.api.baseUrl}/blowjob/${slug}/`;
        }
      }
      
      this.log(`Fetching video details from: ${postUrl}`);
      
      const html = await this.fetchHtml(postUrl);
      
      // Extract post ID and type
      const articleMatch = html.match(/<article[^>]+class="[^"]*post-(\d+)[^"]*type-(porn-video|sex-gallery|sex-story)/i);
      const postId = articleMatch ? articleMatch[1] : 'unknown';
      const type = articleMatch ? articleMatch[2] as 'porn-video' | 'sex-gallery' | 'sex-story' : 'porn-video';
      
      // Extract title
      const titleMatch = html.match(/<h1[^>]*class="[^"]*elementor-heading-title[^"]*"[^>]*>([^<]+)</i) || 
                         html.match(/<title>([^<]+)/i);
      const title = titleMatch ? titleMatch[1].trim().replace(' - FSI Blog', '').replace(' - FSIBlog5', '') : '';
      
      // Extract thumbnail
      const thumbMetaMatch = html.match(/<meta[^>]+itemprop="thumbnailUrl"[^>]+content="([^"]+)"/i) ||
                             html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i);
      let thumbnail = thumbMetaMatch ? thumbMetaMatch[1] : '';
      thumbnail = this.normalizeUrl(thumbnail);
      thumbnail = this.proxyImage(thumbnail);
      
      // Extract video URL
      let videoUrl = '';
      const videoMetaMatch = html.match(/<meta[^>]+itemprop="contentURL"[^>]+content="([^"]+)"/i);
      if (videoMetaMatch) {
        videoUrl = videoMetaMatch[1];
      }
      
      // Try iframe data-src fallback
      if (!videoUrl) {
        const iframeMatch = html.match(/<iframe[^>]+data-src="[^"]*\?q=([A-Za-z0-9+/=]+)"/i);
        if (iframeMatch) {
          try {
            const decoded = Buffer.from(iframeMatch[1], 'base64').toString('utf-8');
            const urlMatch = decoded.match(/src="(https:\/\/cdn\.fsiblog5\.com[^"]+)"/);
            if (urlMatch) {
              videoUrl = urlMatch[1];
            }
          } catch (e) {
            this.logError('Failed to decode iframe data', e);
          }
        }
      }
      
      // Extract upload date
      const dateMatch = html.match(/<meta[^>]+itemprop="uploadDate"[^>]+content="([^"]+)"/i);
      const uploadDate = dateMatch ? dateMatch[1] : '';
      
      // Extract description
      const excerptMatch = html.match(/<div[^>]*class="[^"]*elementor-widget-theme-post-content[^"]*"[^>]*>[\s\S]*?<p>([^<]+)</i);
      const description = excerptMatch ? excerptMatch[1].trim() : '';
      
      // Extract categories
      const categories: string[] = [];
      const catMatches = this.extractAllMatches(html, /<a[^>]+href="[^"]*\/category\/([^"\/]+)"[^>]*>([^<]+)</gi);
      for (const catMatch of catMatches) {
        categories.push(catMatch[2].trim());
      }
      
      // Extract tags
      const tags: string[] = [];
      const tagMatches = this.extractAllMatches(html, /<a[^>]+href="[^"]*\/tag\/([^"\/]+)"[^>]*>([^<]+)</gi);
      for (const tagMatch of tagMatches) {
        tags.push(tagMatch[2].trim());
      }
      
      // Extract gallery images if type is sex-gallery
      let galleryImages: string[] = [];
      if (type === 'sex-gallery') {
        this.log(`Extracting gallery images for: ${title}`);
        
        // FSIBlog galleries use Elementor Gallery widget
        const galleryPattern = /<a[^>]*class="[^"]*e-gallery-item[^"]*"[^>]*href="([^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/gi;
        const galleryMatches = this.extractAllMatches(html, galleryPattern);
        
        if (galleryMatches.length > 0) {
          this.log(`Found ${galleryMatches.length} gallery items`);
          
          for (const match of galleryMatches) {
            let imgUrl = match[1];
            imgUrl = this.removeImageSizeSuffix(imgUrl);
            imgUrl = this.normalizeUrl(imgUrl);
            imgUrl = this.proxyImage(imgUrl);
            galleryImages.push(imgUrl);
          }
          
          // Remove duplicates
          galleryImages = Array.from(new Set(galleryImages));
        } else {
          // Fallback: Try post content images
          const contentPattern = /<div[^>]*class="[^"]*elementor-widget-theme-post-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i;
          const contentMatch = html.match(contentPattern);
          
          if (contentMatch) {
            const contentHtml = contentMatch[1];
            const imgPattern = /<img[^>]+(?:data-src|src)="([^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/gi;
            const imgMatches = this.extractAllMatches(contentHtml, imgPattern);
            
            for (const imgMatch of imgMatches) {
              let imgUrl = imgMatch[1];
              
              // Skip icons/logos/placeholders
              if (imgUrl.includes('icon') || imgUrl.includes('logo') || imgUrl.includes('placeholder')) {
                continue;
              }
              
              imgUrl = this.removeImageSizeSuffix(imgUrl);
              imgUrl = this.normalizeUrl(imgUrl);
              imgUrl = this.proxyImage(imgUrl);
              galleryImages.push(imgUrl);
            }
            
            galleryImages = Array.from(new Set(galleryImages));
          }
        }
        
        this.log(`Found ${galleryImages.length} gallery images`);
      }
      
      // Extract related videos from sidebar
      const relatedVideos = await this.extractRelatedVideosFromSidebar(html, postId, 9);
      this.log(`Related videos: ${relatedVideos.length}`);
      
      const videoData: UnifiedVideoData = {
        id: postId,
        slug,
        title,
        thumbnail,
        postUrl,
        provider: this.config.metadata.id,
        type,
        videoUrl: videoUrl || undefined,
        description,
        categories,
        tags,
        uploadDate,
        galleryImages: galleryImages.length > 0 ? galleryImages : undefined,
        relatedVideos: relatedVideos.length > 0 ? relatedVideos : undefined,
        views: "0",
        duration: "0",
      };
      
      this.log(`Extracted video details: ${title}`);
      
      // Cache the result
      await providerCache.set(this.config.metadata.id, 'videoData', videoData, CACHE_DURATIONS.VIDEO_DETAILS);
      
      return this.createSuccessResponse(videoData);
      
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
      const cached = await providerCache.get<UnifiedCategoryData[]>(this.config.metadata.id, 'categories', {});
      if (cached) {
        this.log(`Returning ${cached.length} cached categories`);
        return this.createSuccessResponse(cached);
      }

      // FSIBlog has static categories
      const categories: UnifiedCategoryData[] = (this.config.staticCategories || []).map(cat => ({
        slug: cat.slug,
        name: cat.name,
        url: `${this.config.api.baseUrl}/category/${cat.slug}/`,
        provider: this.config.metadata.id,
        thumbnail: cat.thumbnail,
        count: 0,
      }));
      
      this.log(`Returning ${categories.length} static categories`);
      
      // Cache the result
      await providerCache.set(this.config.metadata.id, 'categories', categories, CACHE_DURATIONS.CATEGORIES);
      
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
      const { query, page = 1, limit = 12 } = params;
      
      // Check cache
      const cached = await providerCache.get<UnifiedVideoData[]>(this.config.metadata.id, 'search', { query, page });
      if (cached) {
        this.log(`Returning ${cached.length} cached search results for "${query}"`);
        return this.createSuccessResponse(cached, { currentPage: page, hasMore: false });
      }

      const searchUrl = `${this.config.api.baseUrl}/?s=${encodeURIComponent(query)}`;
      this.log(`Searching videos: ${searchUrl}`);
      
      const html = await this.fetchHtml(searchUrl);
      const videos: UnifiedVideoData[] = [];
      
      // Use same extraction logic
      const articlePattern = /<article[^>]+class="[^"]*elementor-post[^"]*post-(\d+)[^"]*type-(porn-video|sex-gallery|sex-story)[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
      const articles = this.extractAllMatches(html, articlePattern);
      
      for (const articleMatch of articles) {
        const postId = articleMatch[1];
        const type = articleMatch[2] as 'porn-video' | 'sex-gallery' | 'sex-story';
        const articleHtml = articleMatch[3];
        
        const titleMatch = articleHtml.match(/<h3[^>]*class="elementor-post__title"[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>[\s\S]*?([^<]+)</i);
        if (!titleMatch) continue;
        
        const postUrl = titleMatch[1];
        const title = titleMatch[2].trim();
        const slugMatch = postUrl.match(/\/([^\/]+)\/?$/);
        const slug = slugMatch ? slugMatch[1] : postId;
        
        let thumbnail = '';
        const dataSrcMatch = articleHtml.match(/data-src="([^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/i);
        if (dataSrcMatch) {
          thumbnail = dataSrcMatch[1];
        } else {
          const srcMatch = articleHtml.match(/<img[^>]+src="([^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/i);
          if (srcMatch && !srcMatch[1].startsWith('data:')) {
            thumbnail = srcMatch[1];
          }
        }
        
        thumbnail = thumbnail.replace(/['")\]]+$/, '');
        thumbnail = this.removeImageSizeSuffix(thumbnail);
        thumbnail = this.normalizeUrl(thumbnail);
        thumbnail = this.proxyImage(thumbnail);
        
        const excerptMatch = articleHtml.match(/<div[^>]*class="elementor-post__excerpt"[^>]*>[\s\S]*?<p>([^<]+)</i);
        const excerpt = excerptMatch ? excerptMatch[1].trim() : '';
        
        const categories: string[] = [];
        const catMatches = this.extractAllMatches(articleHtml, /<a[^>]+href="[^"]*\/category\/([^"\/]+)"[^>]*>([^<]+)</gi);
        for (const catMatch of catMatches) {
          categories.push(catMatch[2].trim());
        }
        
        const tags: string[] = [];
        const tagMatches = this.extractAllMatches(articleHtml, /<a[^>]+href="[^"]*\/tag\/([^"\/]+)"[^>]*>([^<]+)</gi);
        for (const tagMatch of tagMatches) {
          tags.push(tagMatch[2].trim());
        }
        
        if (title && postUrl) {
          videos.push({
            id: postId,
            slug,
            title,
            thumbnail,
            postUrl,
            provider: this.config.metadata.id,
            type,
            description: excerpt,
            categories,
            tags,
            views: "0",
            duration: "0",
          });
        }
      }
      
      this.log(`Found ${videos.length} search results for "${query}"`);
      
      // Cache the result
      await providerCache.set(this.config.metadata.id, 'videos', videos, CACHE_DURATIONS.SEARCH);
      
      return this.createSuccessResponse(videos, { 
        currentPage: page, 
        hasMore: false 
      });
      
    } catch (error) {
      this.logError(`Failed to search videos for "${params.query}"`, error);
      return this.createErrorResponse('Failed to search videos');
    }
  }
}
