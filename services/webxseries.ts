const BASE_URL = 'https://webxseries.to';

export interface WebXSeriesVideo {
  title: string;
  slug: string;
  thumbnail?: string;
  duration?: string;
  date?: string;
  url: string;
}

export interface WebXSeriesCategory {
  name: string;
  slug: string;
  count: number;
  url: string;
}

/**
 * Fetch and parse HTML from a URL
 */
async function fetchHTML(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error(`[WebXSeries] Error fetching ${url}:`, error);
    throw error;
  }
}

/**
 * Extract categories from OTT page
 */
export async function extractCategories(): Promise<WebXSeriesCategory[]> {
  try {
    const html = await fetchHTML(`${BASE_URL}/ott/`);
    
    const categories: WebXSeriesCategory[] = [];
    
    // New structure: <article class="taxonomy-card" data-name="slug">
    //   <a href="/ott/slug/">
    //     <h2>Category Name</h2>
    //     <span class="taxonomy-count">123 Videos</span>
    const pattern = /<article[^>]*class="taxonomy-card"[^>]*data-name="([^"]*)"[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<h2>([^<]+)<\/h2>[\s\S]*?<span[^>]*class="taxonomy-count"[^>]*>(\d+)\s+Videos?<\/span>/gi;
    
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const slug = match[1];
      const url = match[2];
      const name = match[3].trim();
      const count = parseInt(match[4]);
      
      categories.push({
        name,
        slug,
        count,
        url: url.startsWith('http') ? url : `${BASE_URL}${url}`
      });
    }
    
    console.log(`[WebXSeries] Extracted ${categories.length} categories from OTT page`);
    
    // Remove duplicates and sort
    const uniqueCategories = Array.from(new Map(
      categories.map(cat => [cat.slug, cat])
    ).values());
    
    return uniqueCategories.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('[WebXSeries] Error extracting categories:', error);
    return [];
  }
}

/**
 * Extract videos from homepage or category page
 */
export async function extractVideos(url: string): Promise<WebXSeriesVideo[]> {
  try {
    const html = await fetchHTML(url);
    
    const videos: WebXSeriesVideo[] = [];
    
    // Split HTML into video blocks - each video is wrapped in <a class="video ...>...</a>
    // Find all <a class="video ...> blocks
    const videoBlockPattern = /<a\s+class="[^"]*video[^"]*"[\s\S]*?<\/a>/g;
    const blocks = html.match(videoBlockPattern);
    
    if (blocks) {
      for (const block of blocks) {
        // Extract each component from the block
        const hrefMatch = block.match(/href="([^"]*)"/);
        const titleMatch = block.match(/title="([^"]*)"/);
        const databgMatch = block.match(/data-bg="([^"]*)"/);
        const timeMatch = block.match(/<span\s+class="time\s+clock">([^<]*)<\/span>/);
        const agoMatch = block.match(/<span\s+class="ago">([^<]*)<\/span>/);
        
        if (hrefMatch && titleMatch) {
          const fullHref = hrefMatch[1];
          const title = titleMatch[1];
          const thumbnail = databgMatch ? databgMatch[1] : undefined;
          const duration = timeMatch ? timeMatch[1].trim() : 'Unknown';
          const date = agoMatch ? agoMatch[1].trim() : 'Unknown';
          
          // Extract slug from href
          const slugMatch = fullHref.match(/\/([^/]+)\/$/);
          const slug = slugMatch ? slugMatch[1] : '';
          
          // Skip navigation links
          if (slug && slug !== 'ott' && slug !== 'tag' && slug !== 'model' && slug !== 'series' && slug !== 'page' && slug !== 'hot-web-series') {
            videos.push({
              title,
              slug,
              thumbnail,
              duration,
              date,
              url: fullHref.startsWith('http') ? fullHref : `${BASE_URL}${fullHref}`
            });
          }
        }
      }
    }
    
    // Remove duplicates
    const uniqueVideos = Array.from(new Map(
      videos.map(v => [v.slug, v])
    ).values());
    
    return uniqueVideos;
  } catch (error) {
    console.error('[WebXSeries] Error extracting videos:', error);
    return [];
  }
}

/**
 * Extract video details from a video page
 */
export async function extractVideoDetails(slug: string) {
  try {
    const url = `${BASE_URL}/${slug}/`;
    const html = await fetchHTML(url);
    
    // Extract title - look for h1 tag
    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // Extract description - look for the first paragraph after title
    const descPattern = /<p[^>]*>([^<]+)<\/p>/i;
    const descMatch = html.match(descPattern);
    const description = descMatch ? descMatch[1].trim() : '';
    
    // Try to extract thumbnail from meta og:image
    const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
    const thumbnail = ogImageMatch ? ogImageMatch[1] : '';
    
    // Extract direct video URL from <source src="..."> tag (most common)
    const videoSourceMatch = html.match(/<source\s+src="([^"]+)"\s+type="video\/mp4"/i);
    const videoUrl = videoSourceMatch ? videoSourceMatch[1] : '';
    
    // Alternative: Extract video URL from <video> tag poster/data attributes or iframe
    const iframeMatch = html.match(/<iframe[^>]*src="([^"]+)"/i);
    const iframeSrc = iframeMatch ? iframeMatch[1] : '';
    
    // Use direct video URL if available, otherwise use iframe
    const embedUrl = videoUrl || iframeSrc;
    
    // Extract series info
    const seriesMatch = html.match(/<a[^>]*href="[^"]*\/series\/[^"]*">([^<]+)<\/a>/i);
    const series = seriesMatch ? seriesMatch[1].trim() : '';
    
    // Extract model info
    const modelMatch = html.match(/<a[^>]*href="[^"]*\/model\/[^"]*">([^<]+)<\/a>/i);
    const model = modelMatch ? modelMatch[1].trim() : '';
    
    // Extract platform/OTT
    const platformMatch = html.match(/<a[^>]*href="[^"]*\/ott\/([^"]*)\/">([^<]+)<\/a>/i);
    const platform = platformMatch ? platformMatch[2].trim() : '';
    
    // Extract tags
    const tags: string[] = [];
    const tagPattern = /<a[^>]*href="[^"]*\/tag\/[^"]*">([^<]+)<\/a>/gi;
    let tagMatch;
    let tagCount = 0;
    while ((tagMatch = tagPattern.exec(html)) !== null && tagCount < 10) {
      tags.push(tagMatch[1].trim());
      tagCount++;
    }
    
    // Extract related videos
    const relatedVideos: WebXSeriesVideo[] = [];
    
    // Find the "Related Videos" section
    const relatedSectionMatch = html.match(/<h2[^>]*class="h"[^>]*>Related Videos<\/h2>[\s\S]*?<div[^>]*class="videos"[^>]*>([\s\S]*?)<\/div>/i);
    
    if (relatedSectionMatch) {
      const relatedSection = relatedSectionMatch[1];
      
      // Extract video blocks from related section using same pattern as extractVideos
      const videoBlockPattern = /<a\s+class="[^"]*video[^"]*"[\s\S]*?<\/a>/g;
      const blocks = relatedSection.match(videoBlockPattern);
      
      if (blocks) {
        for (const block of blocks) {
          const hrefMatch = block.match(/href="([^"]*)"/);
          const titleMatch = block.match(/title="([^"]*)"/);
          const databgMatch = block.match(/data-bg="([^"]*)"/);
          const timeMatch = block.match(/<span\s+class="time\s+clock">([^<]*)<\/span>/);
          const agoMatch = block.match(/<span\s+class="ago">([^<]*)<\/span>/);
          
          if (hrefMatch && titleMatch) {
            const fullHref = hrefMatch[1];
            const videoTitle = titleMatch[1];
            const videoThumbnail = databgMatch ? databgMatch[1] : undefined;
            const videoDuration = timeMatch ? timeMatch[1].trim() : 'Unknown';
            const videoDate = agoMatch ? agoMatch[1].trim() : 'Unknown';
            
            // Extract slug from href
            const slugMatch = fullHref.match(/\/([^/]+)\/$/);
            const videoSlug = slugMatch ? slugMatch[1] : '';
            
            if (videoSlug && videoSlug !== 'ott' && videoSlug !== 'tag' && videoSlug !== 'model' && videoSlug !== 'series' && videoSlug !== 'page') {
              relatedVideos.push({
                title: videoTitle,
                slug: videoSlug,
                thumbnail: videoThumbnail,
                duration: videoDuration,
                date: videoDate,
                url: fullHref.startsWith('http') ? fullHref : `${BASE_URL}${fullHref}`
              });
            }
          }
        }
      }
    }
    
    return {
      title,
      slug,
      description,
      thumbnail,
      iframeSrc: embedUrl,
      videoUrl,
      series,
      model,
      platform,
      tags,
      relatedVideos,
      url
    };
  } catch (error) {
    console.error('[WebXSeries] Error extracting video details:', error);
    return null;
  }
}

/**
 * Search videos
 */
export async function searchVideos(query: string, page: number = 1): Promise<WebXSeriesVideo[]> {
  try {
    const searchUrl = `${BASE_URL}/?s=${encodeURIComponent(query)}&paged=${page}`;
    return await extractVideos(searchUrl);
  } catch (error) {
    console.error('[WebXSeries] Error searching videos:', error);
    return [];
  }
}

/**
 * Fetch category videos with pagination
 */
export async function fetchCategoryVideos(categorySlug: string, page: number = 1): Promise<WebXSeriesVideo[]> {
  try {
    const categoryUrl = `${BASE_URL}/ott/${categorySlug}/page/${page}/`;
    return await extractVideos(categoryUrl);
  } catch (error) {
    console.error('[WebXSeries] Error fetching category videos:', error);
    return [];
  }
}

/**
 * Fetch homepage videos
 */
export async function fetchHomepageVideos(page: number = 1): Promise<WebXSeriesVideo[]> {
  try {
    const pageUrl = page === 1 ? BASE_URL : `${BASE_URL}/page/${page}/`;
    return await extractVideos(pageUrl);
  } catch (error) {
    console.error('[WebXSeries] Error fetching homepage videos:', error);
    return [];
  }
}
