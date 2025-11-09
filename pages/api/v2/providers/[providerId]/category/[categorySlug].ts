import type { NextApiRequest, NextApiResponse } from 'next';
import { providerRegistry } from '@/services/providers/implementations';

/**
 * Unified API route for fetching category videos from any provider
 * GET /api/v2/providers/[providerId]/category/[categorySlug]?page=1
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Set caching headers - category videos update frequently but not constantly
  // Browser cache: 5 minutes, Vercel CDN: 30 minutes, Stale-while-revalidate: 1 hour
  res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=3600, max-age=300');
  res.setHeader('CDN-Cache-Control', 'public, s-maxage=1800');
  res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=1800');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { providerId, categorySlug } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;

    // Validate provider ID
    if (!providerId || typeof providerId !== 'string') {
      return res.status(400).json({ 
        success: false,
        error: 'Provider ID is required' 
      });
    }

    // Validate category slug
    if (!categorySlug || typeof categorySlug !== 'string') {
      return res.status(400).json({ 
        success: false,
        error: 'Category slug is required' 
      });
    }

    // Get provider from registry
    const provider = providerRegistry.get(providerId);
    if (!provider) {
      return res.status(404).json({ 
        success: false,
        error: `Provider "${providerId}" not found`,
        availableProviders: providerRegistry.getAllIds()
      });
    }

    // Fetch category videos
    const result = await provider.fetchCategoryVideos({ 
      categorySlug, 
      page, 
      limit 
    });

    // Return result
    const statusCode = result.success ? 200 : 500;
    res.status(statusCode).json(result);

  } catch (error) {
    console.error('[API] Unified category videos endpoint error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
