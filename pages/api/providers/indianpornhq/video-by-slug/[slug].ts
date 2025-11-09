import type { NextApiRequest, NextApiResponse } from "next"
import { fetchHTML, scrapeVideoDetails } from "../utils/scraper"
import { getVideoByIndex } from "@/services/indianpornhq"

interface VideoDetailsResponse {
  success: boolean
  data?: any
  error?: string
  provider: string
  timestamp: string
  seo_slug?: string
  original_id?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { slug } = req.query

    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Video slug is required',
        provider: 'indianpornhq',
        timestamp: new Date().toISOString()
      })
    }

    // Try to extract video index from slug
    const slugParts = slug.split('-')
    const videoIndex = parseInt(slugParts[slugParts.length - 1])
    
    if (isNaN(videoIndex)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid video slug format',
        provider: 'indianpornhq',
        timestamp: new Date().toISOString()
      })
    }

    // Check if this video is from a category (via query parameter)
    const categoryUrl = req.query.cat_url as string | undefined

    const logMessage = categoryUrl 
      ? `[video-by-slug] Fetching video index ${videoIndex} from category: ${categoryUrl}`
      : `[video-by-slug] Fetching video index ${videoIndex} from homepage`
    console.log(logMessage)

    // Use service layer to get video by index (no internal HTTP calls!)
    const video = await getVideoByIndex(videoIndex, categoryUrl)
    
    if (!video) {
      return res.status(404).json({
        success: false,
        error: categoryUrl ? 'Video not found in category' : 'Video not found',
        provider: 'indianpornhq',
        timestamp: new Date().toISOString()
      })
    }

    const originalId = video.original_id || video.id || video.url || ''
    const videoUrl = video.url

    // Handle different ID formats for IndianPornHQ
    let finalVideoUrl: string
    
    if (videoUrl && videoUrl.startsWith('http')) {
      finalVideoUrl = videoUrl
    } else if (originalId.startsWith('?')) {
      finalVideoUrl = `https://www.indianpornhq.com/c/${originalId}`
    } else if (originalId.startsWith('http')) {
      finalVideoUrl = originalId
    } else if (originalId.length > 10 && !originalId.includes('/')) {
      finalVideoUrl = `https://www.indianpornhq.com/?v=${originalId}&cat=indian`
    } else {
      finalVideoUrl = `https://www.indianpornhq.com/video/${originalId}`
    }
    
    console.log(`[video-by-slug] Fetching video details from: ${finalVideoUrl}`)
    
    const html = await fetchHTML(finalVideoUrl)
    console.log(`[video-by-slug] HTML length: ${html.length}`)
    const videoDetails = scrapeVideoDetails(html)
    console.log(`[video-by-slug] Scraped video details:`, videoDetails ? 'Success' : 'Failed')

    // If we can't scrape details, create a fallback
    if (!videoDetails) {
      console.log('[video-by-slug] Could not scrape video details, creating fallback')
      
      const titleFromSlug = slug.split('-').slice(0, -2).join(' ').replace(/\b\w/g, l => l.toUpperCase())
      const title = titleFromSlug || video.title || 'Premium Video Content'
      
      const fallbackDetails = {
        title: title,
        description: 'High-quality video content from IndianPornHQ. This content is available for premium members.',
        thumbnail_url: video.thumbnail_url || '/api/placeholder?height=400&width=600&query=video',
        video_url: finalVideoUrl,
        embed_url: finalVideoUrl,
        duration: video.duration || 'Unknown',
        views: video.views || 'Unknown',
        tags: video.tags || ['indian', 'desi', 'premium'],
        category: video.category || 'Indian'
      }
      
      const responseData: VideoDetailsResponse = {
        success: true,
        data: fallbackDetails,
        provider: 'indianpornhq',
        seo_slug: slug,
        original_id: originalId,
        timestamp: new Date().toISOString()
      }
      
      return res.status(200).json(responseData)
    }

    const seoSlug = slug
    
    const responseData: VideoDetailsResponse = {
      success: true,
      data: videoDetails,
      provider: 'indianpornhq',
      seo_slug: seoSlug,
      original_id: originalId,
      timestamp: new Date().toISOString()
    }

    res.status(200).json(responseData)
  } catch (error) {
    console.error('[video-by-slug] IndianPornHQ Video Details API Error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch video details', 
      detail: error instanceof Error ? error.message : 'Unknown error',
      provider: 'indianpornhq',
      timestamp: new Date().toISOString()
    })
  }
}
