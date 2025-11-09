import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchVideos } from '../../../../services/fsiblog5';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { page } = req.query;
    const pageUrl = page && typeof page === 'string' ? page : undefined;
    
    const videos = await fetchVideos(pageUrl);
    
    res.status(200).json({
      success: true,
      provider: 'fsiblog5',
      count: videos.length,
      videos,
    });
  } catch (error) {
    console.error('[API] FSIBlog5 videos error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch videos',
    });
  }
}
