import type { NextApiRequest, NextApiResponse } from "next"

interface ExtractedVideo {
  success: boolean
  sources?: Array<{
    url: string
    quality: string
    label: string
  }>
  error?: string
  timestamp: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ExtractedVideo>) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }

    if (req.method !== 'GET') {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
        timestamp: new Date().toISOString()
      })
    }

    const { url } = req.query

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Video URL is required',
        timestamp: new Date().toISOString()
      })
    }

    console.log(`[extract-video] Fetching embed page: ${url}`)

    // Fetch the embed page with proper error handling
    let embedResponse
    try {
      embedResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Referer': 'https://www.indianpornhq.com/'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })
    } catch (fetchError) {
      console.error('[extract-video] Fetch error:', fetchError)
      throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`)
    }

    if (!embedResponse.ok) {
      throw new Error(`Failed to fetch embed page: ${embedResponse.status}`)
    }

    const embedHtml = await embedResponse.text()

    // Extract the xHamster iframe URL
    const iframeMatch = /<iframe[^>]*src=["']([^"']+)["']/.exec(embedHtml)
    
    if (!iframeMatch || !iframeMatch[1]) {
      console.log('[extract-video] No iframe found in embed page')
      return res.status(404).json({
        success: false,
        error: 'No video iframe found',
        timestamp: new Date().toISOString()
      })
    }

    let xhamsterUrl = iframeMatch[1]
    if (xhamsterUrl.startsWith('//')) {
      xhamsterUrl = `https:${xhamsterUrl}`
    }

    console.log(`[extract-video] Found xHamster URL: ${xhamsterUrl}`)

    // Fetch the xHamster embed page
    const xhamsterResponse = await fetch(xhamsterUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': url
      }
    })

    if (!xhamsterResponse.ok) {
      throw new Error(`Failed to fetch xHamster page: ${xhamsterResponse.status}`)
    }

    const xhamsterHtml = await xhamsterResponse.text()

    // Extract video sources from xHamster
    // Look for JSON data with video sources
    const sources: Array<{url: string, quality: string, label: string}> = []

    // Pattern 1: Look for video sources in window.initials or similar
    const initialsMatch = /window\.initials\s*=\s*({[\s\S]*?});/.exec(xhamsterHtml)
    if (initialsMatch) {
      try {
        const initials = JSON.parse(initialsMatch[1])
        if (initials.videoModel?.sources) {
          const videoSources = initials.videoModel.sources
          
          // Extract sources from different quality levels
          for (const [quality, data] of Object.entries(videoSources)) {
            if (data && typeof data === 'object' && 'mp4' in data) {
              const mp4Url = (data as any).mp4
              if (mp4Url && typeof mp4Url === 'string') {
                sources.push({
                  url: mp4Url,
                  quality: quality,
                  label: quality === '1080p' ? '1080p HD' : 
                         quality === '720p' ? '720p HD' : 
                         quality === '480p' ? '480p' : 
                         quality === '240p' ? '240p' : quality
                })
              }
            }
          }
        }
      } catch (e) {
        console.error('[extract-video] Failed to parse initials JSON:', e)
      }
    }

    // Pattern 2: Look for direct source tags
    if (sources.length === 0) {
      const sourcePattern = /<source[^>]*src=["']([^"']+\.mp4[^"']*)["'][^>]*>/gi
      let sourceMatch
      while ((sourceMatch = sourcePattern.exec(xhamsterHtml)) !== null) {
        sources.push({
          url: sourceMatch[1],
          quality: 'auto',
          label: 'Auto'
        })
      }
    }

    // Pattern 3: Look for JSON-LD data
    if (sources.length === 0) {
      const jsonLdMatch = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi.exec(xhamsterHtml)
      if (jsonLdMatch) {
        try {
          const jsonLd = JSON.parse(jsonLdMatch[1])
          if (jsonLd.contentUrl) {
            sources.push({
              url: jsonLd.contentUrl,
              quality: 'auto',
              label: 'Auto'
            })
          }
        } catch (e) {
          console.error('[extract-video] Failed to parse JSON-LD:', e)
        }
      }
    }

    if (sources.length === 0) {
      console.log('[extract-video] No video sources found')
      return res.status(404).json({
        success: false,
        error: 'No video sources found in embed page',
        timestamp: new Date().toISOString()
      })
    }

    // Sort sources by quality (highest first)
    sources.sort((a, b) => {
      const qualityOrder: Record<string, number> = {
        '1080p': 4,
        '720p': 3,
        '480p': 2,
        '240p': 1,
        'auto': 0
      }
      return (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0)
    })

    console.log(`[extract-video] Found ${sources.length} video sources`)

    res.status(200).json({
      success: true,
      sources,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[extract-video] Error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract video',
      timestamp: new Date().toISOString()
    })
  }
}
