import type { NextApiRequest, NextApiResponse } from 'next';
import { providerRegistry } from '@/services/providers/implementations';

/**
 * Unified API route for fetching videos from any provider
 * GET /api/v2/providers/[providerId]/videos?page=1
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Set caching headers - videos update frequently
  // Browser cache: 5 minutes, Vercel CDN: 15 minutes, Stale-while-revalidate: 30 minutes
  res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800, max-age=300');
  res.setHeader('CDN-Cache-Control', 'public, s-maxage=900');
  res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=900');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { providerId } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;

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

    // Fetch videos
    const result = await provider.fetchVideos({ page, limit });

    // Return result
    const statusCode = result.success ? 200 : 500;
    res.status(statusCode).json(result);

  } catch (error) {
    console.error('[API] Unified videos endpoint error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
