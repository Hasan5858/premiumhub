import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL parameter is required' })
  }

  try {
    // Fetch the image from the external URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': new URL(url).origin,
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    })

    if (!response.ok) {
      console.error(`[ImageProxy] Failed to fetch image: ${response.status} ${response.statusText}`)
      return res.status(response.status).json({ error: `Failed to fetch image: ${response.statusText}` })
    }

    // Get the content type
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    
    // Get the image buffer
    const imageBuffer = await response.arrayBuffer()

    // Set appropriate headers
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400') // Cache for 24 hours
    res.setHeader('Access-Control-Allow-Origin', '*')

    // Send the image
    res.send(Buffer.from(imageBuffer))
  } catch (error) {
    console.error('[ImageProxy] Error proxying image:', error)
    res.status(500).json({ error: 'Failed to proxy image' })
  }
}
