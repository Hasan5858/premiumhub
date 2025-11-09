import type { NextApiRequest, NextApiResponse } from "next"
import { fetchCategoryVideos } from "@/services/indianpornhq"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  // Use service layer to fetch category videos
  const result = await fetchCategoryVideos(url)

  // Return appropriate status code based on result
  const statusCode = result.success ? 200 : 500
  res.status(statusCode).json(result)
}

