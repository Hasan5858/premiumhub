import type { NextApiRequest, NextApiResponse } from "next"
import { fetchHTML, scrapeCategories } from "./utils/scraper"

interface CategoriesResponse {
  success: boolean
  data?: Array<{name: string, url: string, count?: number}>
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

    console.log('Fetching categories from IndianPornHQ')
    
    const html = await fetchHTML('https://www.indianpornhq.com/')
    const categories = scrapeCategories(html)

    const responseData: CategoriesResponse = {
      success: true,
      data: categories,
      provider: 'indianpornhq',
      timestamp: new Date().toISOString()
    }

    res.status(200).json(responseData)
  } catch (error) {
    console.error('IndianPornHQ Categories API Error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch categories', 
      detail: error instanceof Error ? error.message : 'Unknown error',
      provider: 'indianpornhq',
      timestamp: new Date().toISOString()
    })
  }
}
