import type { NextApiRequest, NextApiResponse } from 'next';
import { providerRegistry } from '@/services/providers/implementations';

/**
 * Unified API route for fetching categories from any provider
 * GET /api/v2/providers/[providerId]/categories
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Set caching headers - categories don't change often
  // Browser cache: 6 hours, Vercel CDN: 12 hours, Stale-while-revalidate: 24 hours
  res.setHeader('Cache-Control', 'public, s-maxage=43200, stale-while-revalidate=86400, max-age=21600');
  res.setHeader('CDN-Cache-Control', 'public, s-maxage=43200');
  res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=43200');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { providerId } = req.query;

    // Validate provider ID
    if (!providerId || typeof providerId !== 'string') {
      return res.status(400).json({ 
        success: false,
        error: 'Provider ID is required' 
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

    // Fetch categories
    const result = await provider.getCategories();

    // Return result
    const statusCode = result.success ? 200 : 500;
    res.status(statusCode).json(result);

  } catch (error) {
    console.error('[API] Unified categories endpoint error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
