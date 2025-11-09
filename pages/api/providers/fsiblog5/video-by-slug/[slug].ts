import type { NextApiRequest, NextApiResponse } from 'next';
import { getVideoBySlug } from '../../../../../services/fsiblog5';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { slug, category } = req.query;
    
    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Video slug is required',
      });
    }
    
    const categorySlug = category && typeof category === 'string' ? category : undefined;
    const video = await getVideoBySlug(slug, categorySlug);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found',
      });
    }
    
    res.status(200).json({
      success: true,
      provider: 'fsiblog5',
      video,
    });
  } catch (error) {
    console.error('[API] FSIBlog5 video by slug error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch video',
    });
  }
}
