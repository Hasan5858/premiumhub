import type { NextApiRequest, NextApiResponse } from 'next';
import { providerRegistry } from '@/services/providers/implementations';
import type { UnifiedVideoData } from '@/services/providers/types';

/**
 * Unified Search API Endpoint
 * Searches across all providers and combines results
 * GET /api/v2/search?q=query&page=1&limit=20&providers=fsiblog5,kamababa
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Set caching headers - search results can be cached for 5 minutes
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600, max-age=180');
  res.setHeader('CDN-Cache-Control', 'public, s-maxage=300');
  res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=300');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  try {
    const { q, page = '1', limit = '20', providers: providersParam } = req.query;

    // Validate query parameter
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Search query is required',
        message: 'Please provide a search query using the "q" parameter'
      });
    }

    const query = q.trim();
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 20)); // Max 50 per page

    // Determine which providers to search
    let providerIds: string[] = [];
    
    if (providersParam && typeof providersParam === 'string') {
      // User specified specific providers
      providerIds = providersParam.split(',').map(p => p.trim()).filter(Boolean);
    } else {
      // Search all providers by default
      providerIds = providerRegistry.getAllIds();
    }

    console.log(`[Unified Search] Searching "${query}" across providers: ${providerIds.join(', ')}`);

    // Search each provider in parallel
    const searchPromises = providerIds.map(async (providerId) => {
      try {
        const provider = providerRegistry.get(providerId);
        if (!provider) {
          console.warn(`[Unified Search] Provider "${providerId}" not found`);
          return { providerId, results: [], error: 'Provider not found' };
        }

        // Check if provider supports search
        const config = provider.getConfig();
        if (!config.features.hasSearch) {
          console.log(`[Unified Search] Provider "${providerId}" does not support search`);
          return { providerId, results: [], error: 'Search not supported' };
        }

        // Perform search
        const result = await provider.searchVideos({ query, page: pageNum, limit: limitNum });
        
        if (result.success && result.data) {
          console.log(`[Unified Search] Provider "${providerId}" returned ${result.data.length} results`);
          return { 
            providerId, 
            results: Array.isArray(result.data) ? result.data : [], 
            error: null 
          };
        } else {
          console.error(`[Unified Search] Provider "${providerId}" search failed:`, result.error);
          return { providerId, results: [], error: result.error || 'Search failed' };
        }
      } catch (error) {
        console.error(`[Unified Search] Error searching provider "${providerId}":`, error);
        return { 
          providerId, 
          results: [], 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    });

    // Wait for all searches to complete
    const searchResults = await Promise.all(searchPromises);

    // Combine and flatten all results
    const allVideos: Array<UnifiedVideoData & { provider: string }> = [];
    const providerErrors: Record<string, string> = {};

    for (const result of searchResults) {
      if (result.error) {
        providerErrors[result.providerId] = result.error;
      }
      if (result.results.length > 0) {
        // Ensure each video has provider info
        const videosWithProvider = result.results.map(video => ({
          ...video,
          provider: result.providerId,
        }));
        allVideos.push(...videosWithProvider);
      }
    }

    // Sort by relevance (you can implement a scoring system here)
    // For now, we'll just interleave results from different providers
    const sortedVideos = allVideos; // Keep original order for now

    // Apply pagination to combined results
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedVideos = sortedVideos.slice(startIndex, endIndex);

    // Calculate pagination info
    const totalResults = sortedVideos.length;
    const totalPages = Math.ceil(totalResults / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    // Return combined results
    res.status(200).json({
      success: true,
      query,
      data: paginatedVideos,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalResults,
        resultsPerPage: limitNum,
        hasNextPage,
        hasPrevPage,
      },
      providers: {
        searched: providerIds,
        withResults: searchResults.filter(r => r.results.length > 0).map(r => r.providerId),
        errors: Object.keys(providerErrors).length > 0 ? providerErrors : undefined,
      },
      resultsByProvider: searchResults.reduce((acc, result) => {
        acc[result.providerId] = result.results.length;
        return acc;
      }, {} as Record<string, number>),
    });

  } catch (error) {
    console.error('[Unified Search] Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
