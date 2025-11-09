import type { NextApiRequest, NextApiResponse } from 'next';
import { providerRegistry } from '@/services/providers/implementations';

/**
 * Unified API route for fetching video details from any provider
 * GET /api/v2/providers/[providerId]/video/[videoSlug]?categorySlug=xxx
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { providerId, videoSlug } = req.query;
    const categorySlug = req.query.categorySlug as string | undefined;

    // Validate provider ID
    if (!providerId || typeof providerId !== 'string') {
      return res.status(400).json({ 
        success: false,
        error: 'Provider ID is required' 
      });
    }

    // Validate video slug
    if (!videoSlug || typeof videoSlug !== 'string') {
      return res.status(400).json({ 
        success: false,
        error: 'Video slug is required' 
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

    // Fetch video details
    const result = await provider.getVideoDetails(videoSlug, categorySlug);

    // Return result
    const statusCode = result.success ? 200 : 500;
    res.status(statusCode).json(result);

  } catch (error) {
    console.error('[API] Unified video details endpoint error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
