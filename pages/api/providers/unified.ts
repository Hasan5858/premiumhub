import type { NextApiRequest, NextApiResponse } from "next"
import { providerManager } from "@/services/providers"

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

    const { provider, action, query, page, videoId } = req.query

    // Handle different actions
    switch (action) {
      case 'videos':
        if (provider && provider !== 'all') {
          const result = await providerManager.getVideos(provider as string)
          return res.status(200).json(result)
        } else {
          const result = await providerManager.getAllVideos()
          return res.status(200).json(result)
        }

      case 'search':
        if (!query) {
          return res.status(400).json({ error: 'Search query is required' })
        }
        
        if (provider && provider !== 'all') {
          const result = await providerManager.searchVideos(provider as string, query as string, parseInt(page as string) || 1)
          return res.status(200).json(result)
        } else {
          const result = await providerManager.searchAllVideos(query as string, parseInt(page as string) || 1)
          return res.status(200).json(result)
        }

      case 'video':
        if (!videoId || !provider) {
          return res.status(400).json({ error: 'Video ID and provider are required' })
        }
        
        const videoDetails = await providerManager.getVideoDetails(provider as string, videoId as string)
        return res.status(200).json({
          success: true,
          data: videoDetails,
          provider,
          timestamp: new Date().toISOString()
        })

      case 'categories':
        if (provider && provider !== 'all') {
          const result = await providerManager.getCategories(provider as string)
          return res.status(200).json(result)
        } else {
          // Get categories from all providers
          const allCategories: any[] = []
          const errors: string[] = []

          for (const providerName of Object.keys(providerManager.getProviders())) {
            try {
              const result = await providerManager.getCategories(providerName)
              allCategories.push(...result.data)
            } catch (error) {
              errors.push(`${providerName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
            }
          }

          return res.status(200).json({
            success: true,
            data: allCategories,
            total: allCategories.length,
            provider: 'all',
            timestamp: new Date().toISOString()
          })
        }

      case 'providers':
        return res.status(200).json({
          success: true,
          providers: providerManager.getProviders(),
          total: Object.keys(providerManager.getProviders()).length,
          timestamp: new Date().toISOString()
        })

      default:
        return res.status(400).json({ 
          error: 'Invalid action. Supported actions: videos, search, video, categories, providers' 
        })
    }
  } catch (error) {
    console.error('Unified Provider API Error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Internal server error', 
      detail: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}
