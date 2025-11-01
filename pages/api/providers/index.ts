import type { NextApiRequest, NextApiResponse } from "next"

// Provider configuration
const PROVIDERS = {
  indianpornhq: {
    name: 'IndianPornHQ',
    baseUrl: '/api/providers/indianpornhq',
    endpoints: {
      videos: '/videos',
      categories: '/categories',
      search: '/search',
      video: '/video'
    }
  }
  // Add more providers here as needed
  // site2: { ... },
  // site3: { ... }
}

interface ProviderInfo {
  name: string
  baseUrl: string
  endpoints: Record<string, string>
}

interface ProvidersResponse {
  success: boolean
  providers: Record<string, ProviderInfo>
  total: number
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

    const responseData: ProvidersResponse = {
      success: true,
      providers: PROVIDERS,
      total: Object.keys(PROVIDERS).length,
      timestamp: new Date().toISOString()
    }

    res.status(200).json(responseData)
  } catch (error) {
    console.error('Providers API Error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch providers', 
      detail: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}

export { PROVIDERS }
