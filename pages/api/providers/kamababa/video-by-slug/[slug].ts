import type { NextApiRequest, NextApiResponse } from 'next';
import { getVideoBySlug } from '../../../../../services/kamababa';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { slug } = req.query;
    
    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Video slug is required',
      });
    }
    
    const video = await getVideoBySlug(slug);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found',
      });
    }
    
    // Normalize property names for consistency with player expectations
    // Note: Kamababa videoUrl is already a direct CDN link, no proxying needed
    const normalizedVideo = {
      ...video,
      video_url: video.videoUrl, // Direct CDN link, no proxying
      embed_url: video.embedUrl, // Embed player URL
      thumbnail_url: video.thumbnail, // Already proxied through worker in getVideoBySlug
    };
    
    res.status(200).json({
      success: true,
      provider: 'kamababa',
      video: normalizedVideo,
    });
  } catch (error) {
    console.error('[API] KamaBaba video by slug error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch video',
    });
  }
}
