import type { NextApiRequest, NextApiResponse } from "next"
import { fetchHTML, scrapeVideoDetails } from "../utils/scraper"
import { generateVideoSlug, generateFallbackSlug } from "@/utils/slug"

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

    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Video ID is required',
        provider: 'indianpornhq',
        timestamp: new Date().toISOString()
      })
    }

    // Handle different ID formats
    let videoUrl: string
    
    if (id.startsWith('?')) {
      // If ID starts with ?, it's a query string, construct full URL
      videoUrl = `https://www.indianpornhq.com/c/${id}`
    } else if (id.startsWith('http')) {
      // If it's already a full URL, use it directly
      videoUrl = id
    } else {
      // Otherwise, assume it's a simple ID
      videoUrl = `https://www.indianpornhq.com/video/${id}`
    }
    
    console.log(`Fetching video details from: ${videoUrl}`)
    console.log(`Video ID: ${id}`)
    
    const html = await fetchHTML(videoUrl)
    console.log(`HTML length: ${html.length}`)
    const videoDetails = scrapeVideoDetails(html)
    console.log(`Scraped video details:`, videoDetails ? 'Success' : 'Failed')

    // If we can't scrape details, create a fallback using the ID
    if (!videoDetails) {
      console.log('Could not scrape video details, creating fallback')
      
      // Try to extract a better title from the ID
      let title = 'Video Content'
      if (typeof id === 'string' && id.length > 10) {
        // Use a more user-friendly title
        title = 'Premium Video Content'
      }
      
      const fallbackDetails = {
        title: title,
        description: 'High-quality video content from IndianPornHQ. This content is available for premium members.',
        thumbnail_url: '/api/placeholder?height=400&width=600&query=video',
        video_url: videoUrl, // Use the original URL as video source
        embed_url: videoUrl, // Also set as embed URL for iframe fallback
        duration: 'Unknown',
        views: 'Unknown',
        tags: ['indian', 'desi', 'premium'],
        category: 'Indian'
      }
      
      // Generate SEO-friendly slug
      const seoSlug = generateVideoSlug(title, id, 'indianpornhq')
      
      const responseData: VideoDetailsResponse = {
        success: true,
        data: fallbackDetails,
        provider: 'indianpornhq',
        seo_slug: seoSlug,
        original_id: id,
        timestamp: new Date().toISOString()
      }
      
      return res.status(200).json(responseData)
    }

    // Generate SEO-friendly slug for scraped content
    const seoSlug = generateVideoSlug(videoDetails.title, id, 'indianpornhq')
    
    const responseData: VideoDetailsResponse = {
      success: true,
      data: videoDetails,
      provider: 'indianpornhq',
      seo_slug: seoSlug,
      original_id: id,
      timestamp: new Date().toISOString()
    }

    res.status(200).json(responseData)
  } catch (error) {
    console.error('IndianPornHQ Video Details API Error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch video details', 
      detail: error instanceof Error ? error.message : 'Unknown error',
      provider: 'indianpornhq',
      timestamp: new Date().toISOString()
    })
  }
}
