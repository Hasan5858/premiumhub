import type { NextApiRequest, NextApiResponse } from 'next';
import { superpornProvider } from '@/services/providers/implementations';

/**
 * GET /api/v2/providers/superporn/category/[categorySlug]
 * Fetch videos from a specific Superporn category
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
    const { categorySlug } = req.query;
    const page = parseInt(req.query.page as string) || 1;

    if (!categorySlug || typeof categorySlug !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Category slug is required',
      });
    }

    const response = await superpornProvider.fetchCategoryVideos({
      categorySlug,
      page,
    });

    if (response.success) {
      return res.status(200).json(response);
    } else {
      return res.status(500).json(response);
    }
  } catch (error) {
    console.error('[Superporn API] Error fetching category videos:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch category videos',
    });
  }
}
