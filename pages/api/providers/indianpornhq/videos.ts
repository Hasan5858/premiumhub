import type { NextApiRequest, NextApiResponse } from "next"
import { fetchHTML, scrapeVideosFromPage, getAvailablePageTypes } from "./utils/scraper"
import { generateVideoSlug, generateFallbackSlug, cleanVideoId } from "@/utils/slug"

// Types for IndianPornHQ video data
interface IndianPornHQResponse {
  success: boolean
  data: any[]
  total: number
  provider: string
  timestamp: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // Get page type from query parameter (default to homepage)
    const pageType = req.query.page as string || 'homepage'
    const pageTypes = getAvailablePageTypes()
    const pageConfig = pageTypes.find(p => p.type === pageType) || pageTypes[0]

    console.log(`Fetching videos from IndianPornHQ page: ${pageConfig.name}`)
    
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

    const responseData: IndianPornHQResponse = {
      success: true,
      data: videosWithSlugs,
      total: videosWithSlugs.length,
      provider: 'indianpornhq',
      pageType: pageType,
      pageName: pageConfig.name,
      timestamp: new Date().toISOString()
    }

    res.status(200).json(responseData)
  } catch (error) {
    console.error('IndianPornHQ API Error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Fetch or parse failed', 
      detail: error instanceof Error ? error.message : 'Unknown error',
      provider: 'indianpornhq',
      timestamp: new Date().toISOString()
    })
  }
}
