import type { NextApiRequest, NextApiResponse } from "next"
import { fetchHTML, scrapeVideosFromPage } from "./utils/scraper"
import { generateVideoSlug } from "@/utils/slug"

interface CategoryVideosResponse {
  success: boolean
  data?: any[]
  total?: number
  error?: string
  provider: string
  category?: string
  timestamp: string
  page?: number
  hasNextPage?: boolean
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

    const { url } = req.query

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ 
        success: false,
        error: 'Category URL is required',
        provider: 'indianpornhq',
        timestamp: new Date().toISOString()
      })
    }

    // Categories only have videos on page 1 - no pagination exists
    // Always fetch page 1 only
    const categoryUrl = url
    
    console.log(`Fetching videos from IndianPornHQ category: ${categoryUrl} (page 1 only - no pagination)`)
    
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

    const responseData: CategoryVideosResponse = {
      success: true,
      data: videosWithSlugs,
      total: videosWithSlugs.length,
      provider: 'indianpornhq',
      category: url,
      timestamp: new Date().toISOString(),
      // Categories don't have pagination - always page 1, no next page
      page: 1,
      hasNextPage: false
    }

    res.status(200).json(responseData)
  } catch (error) {
    console.error('IndianPornHQ Category Videos API Error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch category videos', 
      detail: error instanceof Error ? error.message : 'Unknown error',
      provider: 'indianpornhq',
      timestamp: new Date().toISOString()
    })
  }
}

