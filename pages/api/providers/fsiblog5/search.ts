import type { NextApiRequest, NextApiResponse } from 'next';
import { searchVideos } from '../../../../services/fsiblog5';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
    }
    
    const videos = await searchVideos(q);
    
    res.status(200).json({
      success: true,
      provider: 'fsiblog5',
      query: q,
      count: videos.length,
      videos,
    });
  } catch (error) {
    console.error('[API] FSIBlog5 search error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search videos',
    });
  }
}
