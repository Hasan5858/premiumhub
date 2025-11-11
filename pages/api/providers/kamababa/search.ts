import type { NextApiRequest, NextApiResponse } from 'next';
import { searchVideos } from '../../../../services/kamababa';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { q, query } = req.query;
    const searchQuery = (q || query) as string;
    
    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
    }
    
    const videos = await searchVideos(searchQuery);
    
    res.status(200).json({
      success: true,
      provider: 'kamababa',
      query: searchQuery,
      count: videos.length,
      videos,
    });
  } catch (error) {
    console.error('[API] KamaBaba search error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search videos',
    });
  }
}
