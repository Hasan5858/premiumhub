import type { NextApiRequest, NextApiResponse } from "next"
import { fetchHTML, scrapeVideoDetails } from "../utils/scraper"
import { extractVideoIdFromSlug, cleanVideoId } from "@/utils/slug"

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
    let originalId: string
    let videoUrl: string | undefined

    if (categoryUrl) {
      // Fetch from category videos API
      const encodedCategoryUrl = encodeURIComponent(categoryUrl)
      const categoryVideosResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/providers/indianpornhq/category-videos?url=${encodedCategoryUrl}`)
      const categoryVideosData = await categoryVideosResponse.json()
      
      if (!categoryVideosData.success || !categoryVideosData.data || !categoryVideosData.data[videoIndex]) {
        return res.status(404).json({
          success: false,
          error: 'Video not found in category',
          provider: 'indianpornhq',
          timestamp: new Date().toISOString()
        })
      }

      const categoryVideo = categoryVideosData.data[videoIndex]
      originalId = categoryVideo.original_id || categoryVideo.id || categoryVideo.url || ''
      videoUrl = categoryVideo.url // Use the URL directly from category video
    } else {
      // Get the video list from homepage to find the original ID by index
      const videosResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/providers/indianpornhq/videos`)
      const videosData = await videosResponse.json()
      
      if (!videosData.success || !videosData.data || !videosData.data[videoIndex]) {
        return res.status(404).json({
          success: false,
          error: 'Video not found',
          provider: 'indianpornhq',
          timestamp: new Date().toISOString()
        })
      }

      const homepageVideo = videosData.data[videoIndex]
      originalId = homepageVideo.original_id || homepageVideo.id || homepageVideo.url || ''
      videoUrl = homepageVideo.url // Use the URL directly from homepage video
    }

    // Handle different ID formats for IndianPornHQ
    // Use the videoUrl from the video object if available, otherwise construct from originalId
    let finalVideoUrl: string
    
    if (videoUrl && videoUrl.startsWith('http')) {
      // Use the URL directly from the video object
      finalVideoUrl = videoUrl
    } else if (originalId.startsWith('?')) {
      // If ID starts with ?, it's a query string, construct full URL
      finalVideoUrl = `https://www.indianpornhq.com/c/${originalId}`
    } else if (originalId.startsWith('http')) {
      // If it's already a full URL, use it directly
      finalVideoUrl = originalId
    } else if (originalId.length > 10 && !originalId.includes('/')) {
      // If it's a video ID like "aVct18xbaFD", construct the proper URL
      finalVideoUrl = `https://www.indianpornhq.com/?v=${originalId}&cat=indian`
    } else {
      // Otherwise, assume it's a simple ID
      finalVideoUrl = `https://www.indianpornhq.com/video/${originalId}`
    }
    
    console.log(`Fetching video details from slug: ${slug}`)
    console.log(`Extracted original ID: ${originalId}`)
    console.log(`Video URL: ${finalVideoUrl}`)
    
    const html = await fetchHTML(finalVideoUrl)
    console.log(`HTML length: ${html.length}`)
    const videoDetails = scrapeVideoDetails(html)
    console.log(`Scraped video details:`, videoDetails ? 'Success' : 'Failed')

    // If we can't scrape details, create a fallback using the ID
    if (!videoDetails) {
      console.log('Could not scrape video details, creating fallback')
      
      // Try to extract a better title from the slug
      const titleFromSlug = slug.split('-').slice(0, -2).join(' ').replace(/\b\w/g, l => l.toUpperCase())
      const title = titleFromSlug || 'Premium Video Content'
      
      const fallbackDetails = {
        title: title,
        description: 'High-quality video content from IndianPornHQ. This content is available for premium members.',
        thumbnail_url: '/api/placeholder?height=400&width=600&query=video',
        video_url: finalVideoUrl,
        embed_url: finalVideoUrl,
        duration: 'Unknown',
        views: 'Unknown',
        tags: ['indian', 'desi', 'premium'],
        category: 'Indian'
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

    // Generate SEO-friendly slug for scraped content
    const seoSlug = slug // Use the provided slug
    
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
