import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchCategories } from '../../../../services/kamababa';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const categories = await fetchCategories();
    
    res.status(200).json({
      success: true,
      provider: 'kamababa',
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error('[API] KamaBaba categories error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch categories',
    });
  }
}
