import type { NextApiRequest, NextApiResponse } from "next"
import { fetchHTML, scrapeVideosFromHomepage } from "./utils/scraper"

interface SearchResponse {
  success: boolean
  data?: any[]
  total?: number
  query?: string
  error?: string
  provider: string
  timestamp: string
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

    const { q: query, page = '1' } = req.query

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
        provider: 'indianpornhq',
        timestamp: new Date().toISOString()
      })
    }

    // Construct search URL using the correct parameter format
    const searchUrl = `https://www.indianpornhq.com/?query=${encodeURIComponent(query)}`
    
    console.log(`Searching IndianPornHQ for: ${query}`)
    
    const html = await fetchHTML(searchUrl)
    const videos = scrapeVideosFromHomepage(html)

    const responseData: SearchResponse = {
      success: true,
      data: videos,
      total: videos.length,
      query,
      provider: 'indianpornhq',
      timestamp: new Date().toISOString()
    }

    res.status(200).json(responseData)
  } catch (error) {
    console.error('IndianPornHQ Search API Error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to search videos', 
      detail: error instanceof Error ? error.message : 'Unknown error',
      provider: 'indianpornhq',
      timestamp: new Date().toISOString()
    })
  }
}
