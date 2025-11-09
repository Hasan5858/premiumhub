import type { NextApiRequest, NextApiResponse } from "next"
import { fetchVideos } from "@/services/indianpornhq"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  // Use service layer to fetch videos
  const result = await fetchVideos(pageType)

  // Return appropriate status code based on result
  const statusCode = result.success ? 200 : 500
  res.status(statusCode).json(result)
}
