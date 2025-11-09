/**
 * Service layer for IndianPornHQ provider
 * Extracts business logic to be reusable across API routes and server-side code
 */

import { fetchHTML, scrapeVideosFromPage, getAvailablePageTypes } from "@/pages/api/providers/indianpornhq/utils/scraper"
import { generateVideoSlug } from "@/utils/slug"

export interface VideoData {
  id?: string
  title?: string
  url?: string
  thumbnail_url?: string
  duration?: string
  views?: string
  tags?: string[]
  category?: string
  seo_slug?: string
  original_id?: string
  video_index?: number
}

export interface VideosResult {
  success: boolean
  data: VideoData[]
  total: number
  provider: string
  timestamp: string
  pageType?: string
  pageName?: string
  error?: string
  detail?: string
}

export interface CategoryVideosResult {
  success: boolean
  data?: VideoData[]
  total?: number
  error?: string
  provider: string
  category?: string
  timestamp: string
  page?: number
  hasNextPage?: boolean
  detail?: string
}

/**
 * Fetch videos from IndianPornHQ homepage or specific page type
 */
export async function fetchVideos(pageType: string = 'homepage'): Promise<VideosResult> {
  try {
    const pageTypes = getAvailablePageTypes()
    const pageConfig = pageTypes.find(p => p.type === pageType) || pageTypes[0]

    console.log(`[Service] Fetching videos from IndianPornHQ page: ${pageConfig.name}`)
    
    const html = await fetchHTML(pageConfig.url)
    const videos = scrapeVideosFromPage(html, pageType)

    // Generate SEO-friendly slugs for each video
    const videosWithSlugs = videos.map((video, index) => {
      const videoId = video.id || video.url || `video-${index}`
      const title = video.title || 'Video Content'
      const seoSlug = generateVideoSlug(title, videoId, 'indianpornhq', index)
      
      return {
        ...video,
        seo_slug: seoSlug,
        original_id: videoId,
        video_index: index
      }
    })

    return {
      success: true,
      data: videosWithSlugs,
      total: videosWithSlugs.length,
      provider: 'indianpornhq',
      pageType: pageType,
      pageName: pageConfig.name,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('[Service] IndianPornHQ fetchVideos Error:', error)
    return {
      success: false,
      data: [],
      total: 0,
      error: 'Failed to fetch videos',
      detail: error instanceof Error ? error.message : 'Unknown error',
      provider: 'indianpornhq',
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Fetch videos from a specific category
 */
export async function fetchCategoryVideos(categoryUrl: string): Promise<CategoryVideosResult> {
  try {
    if (!categoryUrl) {
      return {
        success: false,
        error: 'Category URL is required',
        provider: 'indianpornhq',
        timestamp: new Date().toISOString()
      }
    }

    console.log(`[Service] Fetching videos from IndianPornHQ category: ${categoryUrl}`)
    
    const html = await fetchHTML(categoryUrl)
    const videos = scrapeVideosFromPage(html, 'category')
    
    // Categories don't have pagination - always return false
    const hasNextPage = false

    // Generate SEO-friendly slugs for each video
    const videosWithSlugs = videos.map((video, index) => {
      const videoId = video.id || video.url || `video-${index}`
      const title = video.title || 'Video Content'
      const seoSlug = generateVideoSlug(title, videoId, 'indianpornhq', index)
      
      return {
        ...video,
        seo_slug: seoSlug,
        original_id: videoId,
        video_index: index
      }
    })

    return {
      success: true,
      data: videosWithSlugs,
      total: videosWithSlugs.length,
      provider: 'indianpornhq',
      category: categoryUrl,
      timestamp: new Date().toISOString(),
      page: 1,
      hasNextPage: false
    }
  } catch (error) {
    console.error('[Service] IndianPornHQ fetchCategoryVideos Error:', error)
    return {
      success: false,
      error: 'Failed to fetch category videos',
      detail: error instanceof Error ? error.message : 'Unknown error',
      provider: 'indianpornhq',
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Get a specific video by index from homepage or category
 */
export async function getVideoByIndex(
  videoIndex: number,
  categoryUrl?: string
): Promise<VideoData | null> {
  try {
    if (categoryUrl) {
      // Fetch from category
      const result = await fetchCategoryVideos(categoryUrl)
      if (result.success && result.data && result.data[videoIndex]) {
        return result.data[videoIndex]
      }
    } else {
      // Fetch from homepage
      const result = await fetchVideos('homepage')
      if (result.success && result.data[videoIndex]) {
        return result.data[videoIndex]
      }
    }
    return null
  } catch (error) {
    console.error('[Service] IndianPornHQ getVideoByIndex Error:', error)
    return null
  }
}
