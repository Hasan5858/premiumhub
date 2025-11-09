import type { NextApiRequest, NextApiResponse } from 'next';
import { superpornProvider } from '@/services/providers/implementations';

/**
 * GET /api/v2/providers/superporn/categories
 * Fetch all categories from Superporn
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
    const response = await superpornProvider.getCategories();
    
    if (response.success) {
      return res.status(200).json(response);
    } else {
      return res.status(500).json(response);
    }
  } catch (error) {
    console.error('[Superporn API] Error fetching categories:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
    });
  }
}
