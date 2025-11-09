import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchCategoryVideos } from '../../../../services/fsiblog5';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { category, page } = req.query;
    
    if (!category || typeof category !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Category slug is required',
      });
    }
    
    const pageNum = page && typeof page === 'string' ? parseInt(page, 10) : 1;
    const videos = await fetchCategoryVideos(category, pageNum);
    
    res.status(200).json({
      success: true,
      provider: 'fsiblog5',
      category,
      page: pageNum,
      count: videos.length,
      videos,
    });
  } catch (error) {
    console.error('[API] FSIBlog5 category videos error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch category videos',
    });
  }
}
