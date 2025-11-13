import type { NextApiRequest, NextApiResponse } from 'next'
import { trackPageInSitemap } from '@/services/sitemap-tracker'
import { PageToTrack } from '@/types/sitemap'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const page: PageToTrack = req.body

    if (!page || !page.type || !page.data) {
      console.warn('[Sitemap API] Invalid page data received:', page)
      return res.status(400).json({ error: 'Invalid page data' })
    }

    console.log('[Sitemap API] Tracking:', page.type, page.data.slug || page.data.title)

    // Track the page in the sitemap
    await trackPageInSitemap(page)

    res.status(200).json({ success: true, message: 'Page tracked successfully' })
  } catch (error) {
    console.error('[Sitemap API] Error tracking page:', error)
    res.status(500).json({ error: 'Failed to track page' })
  }
}
