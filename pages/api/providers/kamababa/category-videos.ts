import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchCategoryVideos } from '../../../../services/kamababa';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { slug, page } = req.query;
    
    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Category slug is required',
      });
    }
    
    const pageNum = page && typeof page === 'string' ? parseInt(page, 10) : 1;
    const videos = await fetchCategoryVideos(slug, pageNum);
    
    res.status(200).json({
      success: true,
      provider: 'kamababa',
      category: slug,
      page: pageNum,
      count: videos.length,
      videos,
    });
  } catch (error) {
    console.error('[API] KamaBaba category videos error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch category videos',
    });
  }
}
