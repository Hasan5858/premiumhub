import type { NextApiRequest, NextApiResponse } from 'next';
import { fsiblogProvider } from '@/services/providers/implementations';

/**
 * GET /api/v2/providers/fsiblog5/videos
 * Fetch videos from FSIBlog homepage with pagination
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;

    const response = await fsiblogProvider.fetchVideos({ page, limit });

    if (response.success) {
      return res.status(200).json(response);
    } else {
      return res.status(500).json(response);
    }
  } catch (error) {
    console.error('[FSIBlog API] Error fetching videos:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch videos',
    });
  }
}
