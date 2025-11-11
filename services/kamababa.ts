const BASE_URL = 'https://www.kamababa.desi';
const WORKER_URL = 'https://fsiblog5.premiumhub.workers.dev'; // Using same worker as FSIBlog

export interface KamaBabaVideo {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  videoUrl?: string;
  embedUrl?: string;
  postUrl: string;
  categories: string[];
  tags: string[];
  duration?: string;
  uploadDate?: string;
  relatedVideos?: KamaBabaVideo[];
}

export interface KamaBabaCategory {
  name: string;
  slug: string;
  url: string;
  thumbnail?: string;
  count?: number;
}

/**
 * Fetch HTML via worker proxy
 */
async function fetchViaWorker(url: string): Promise<string> {
  const workerUrl = `${WORKER_URL}/?url=${encodeURIComponent(url)}`;
  const response = await fetch(workerUrl);
  
  if (!response.ok) {
    throw new Error(`Worker fetch failed: ${response.status} ${response.statusText}`);
  }
  
  return response.text();
}

/**
 * Extract all matches for a pattern
 */
function extractAllMatches(html: string, pattern: RegExp): RegExpMatchArray[] {
  const matches: RegExpMatchArray[] = [];
  let match: RegExpMatchArray | null;
  const globalPattern = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
  
  while ((match = globalPattern.exec(html)) !== null) {
    matches.push(match);
  }
  
  return matches;
}

/**
 * Extract video posts from homepage or category page
 */
export async function fetchVideos(pageUrl?: string): Promise<KamaBabaVideo[]> {
  const url = pageUrl || BASE_URL;
  console.log(`[kamababa] Fetching videos from: ${url}`);
  
  const html = await fetchViaWorker(url);
  const videos: KamaBabaVideo[] = [];
  
  // Find all article elements - kamababa uses <article class="thumb-block">
  // Pattern: <article id="post-{ID}" class="thumb-block post-{ID} post type-post...">
  const articlePattern = /<article[^>]+id="post-(\d+)"[^>]+class="[^"]*thumb-block[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
  const articles = extractAllMatches(html, articlePattern);
  
  console.log(`[kamababa] Found ${articles.length} articles`);
  
  for (const articleMatch of articles) {
    const postId = articleMatch[1];
    const articleHtml = articleMatch[2];
    
    // Extract title and URL from <a> tag with title attribute
    // kamababa uses: <a href="URL" title="TITLE">
    const titleMatch = articleHtml.match(/<a[^>]+href="([^"]+)"[^>]+title="([^"]+)"/i);
    if (!titleMatch) {
      console.warn(`[kamababa] No title found for post ${postId}`);
      continue;
    }
    
    const postUrl = titleMatch[1];
    const title = titleMatch[2].trim();
    
    // Extract slug from URL
    const slugMatch = postUrl.match(/\/([^\/]+)\/?$/);
    const slug = slugMatch ? slugMatch[1] : postId;
    
    // Extract thumbnail from <video> tag poster attribute
    // kamababa uses video previews with poster images instead of <img> tags
    let thumbnail = '';
    
    // Try to extract poster attribute from video tag
    const posterMatch = articleHtml.match(/<video[^>]+poster="([^"]+)"/i);
    if (posterMatch) {
      thumbnail = posterMatch[1];
    } else {
      // Fallback: Try data-perfmatters-preload
      const dataPerfMatch = articleHtml.match(/data-perfmatters-preload[^>]*src="([^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/i);
      if (dataPerfMatch) {
        thumbnail = dataPerfMatch[1];
      } else {
        // Fallback: Try data-src
        const dataSrcMatch = articleHtml.match(/data-src="([^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/i);
        if (dataSrcMatch) {
          thumbnail = dataSrcMatch[1];
        } else {
          // Fallback: Try regular img src
          const srcMatch = articleHtml.match(/<img[^>]+src="([^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/i);
          if (srcMatch && !srcMatch[1].startsWith('data:')) {
            thumbnail = srcMatch[1];
          }
        }
      }
    }
    
    // Clean thumbnail URL
    thumbnail = thumbnail.replace(/['")\]]+$/, '');
    
    // Ensure absolute URL
    if (thumbnail && !thumbnail.startsWith('http')) {
      thumbnail = `${BASE_URL}${thumbnail.startsWith('/') ? '' : '/'}${thumbnail}`;
    }
    
    // Proxy thumbnail through worker to bypass region restrictions
    if (thumbnail) {
      thumbnail = `${WORKER_URL}/?url=${encodeURIComponent(thumbnail)}`;
    }
    
    // Extract duration from <span class="duration">
    const durationMatch = articleHtml.match(/<span[^>]*class="duration"[^>]*>([^<]+)</i);
    const duration = durationMatch ? durationMatch[1].trim() : undefined;
    
    // Extract categories
    const categories: string[] = [];
    const catMatches = extractAllMatches(articleHtml, /<a[^>]+href="[^"]*\/category\/([^"\/]+)"[^>]*>([^<]+)</gi);
    for (const catMatch of catMatches) {
      categories.push(catMatch[2].trim());
    }
    
    // Extract tags
    const tags: string[] = [];
    const tagMatches = extractAllMatches(articleHtml, /<a[^>]+href="[^"]*\/tag\/([^"\/]+)"[^>]*>([^<]+)</gi);
    for (const tagMatch of tagMatches) {
      tags.push(tagMatch[2].trim());
    }
    
    if (title && postUrl) {
      const video: KamaBabaVideo = {
        id: postId,
        title,
        slug,
        thumbnail,
        postUrl,
        categories,
        tags,
        duration,
      };
      
      console.log(`[kamababa] Video extracted: ${title.substring(0, 50)}... | Thumbnail: ${thumbnail ? 'YES' : 'NO'}`);
      videos.push(video);
    }
  }
  
  console.log(`[kamababa] Extracted ${videos.length} videos from ${url}`);
  return videos;
}

/**
 * Fetch video details from individual post page
 */
export async function getVideoDetails(postUrl: string): Promise<KamaBabaVideo | null> {
  console.log(`[kamababa] Fetching video details from: ${postUrl}`);
  
  const html = await fetchViaWorker(postUrl);
  
  // Extract post ID from article id
  const articleMatch = html.match(/<article[^>]+id="post-(\d+)"/i);
  const postId = articleMatch ? articleMatch[1] : 'unknown';
  
  // Extract title from <h1 class="entry-title">
  const titleMatch = html.match(/<h1[^>]*class="entry-title"[^>]*>([^<]+)</i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  
  // Extract slug from URL
  const slugMatch = postUrl.match(/\/([^\/]+)\/?$/);
  const slug = slugMatch ? slugMatch[1] : postId;
  
  // Extract thumbnail from og:image meta tag
  const thumbMetaMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i);
  let thumbnail = thumbMetaMatch ? thumbMetaMatch[1] : '';
  
  // Clean thumbnail URL
  thumbnail = thumbnail.replace(/['")\]]+$/, '');
  
  // Ensure absolute URL
  if (thumbnail && !thumbnail.startsWith('http')) {
    thumbnail = `${BASE_URL}${thumbnail.startsWith('/') ? '' : '/'}${thumbnail}`;
  }
  
  // Proxy thumbnail through worker to bypass region restrictions
  if (thumbnail) {
    thumbnail = `${WORKER_URL}/?url=${encodeURIComponent(thumbnail)}`;
  }
  
  // Extract video URL from iframe
  // kamababa uses: <iframe src="...player-x.php?q=BASE64_ENCODED_DATA">
  let videoUrl = '';
  let embedUrl = '';
  
  const iframeMatch = html.match(/<iframe[^>]*src="([^"]+player-x\.php\?q=([^"]+))"/i);
  if (iframeMatch) {
    embedUrl = iframeMatch[1];
    const base64Data = iframeMatch[2];
    
    try {
      // Decode the base64 parameter
      const decoded = Buffer.from(base64Data, 'base64').toString('utf-8');
      const urlDecoded = decodeURIComponent(decoded);
      
      // Extract video URL from the decoded HTML
      const videoSrcMatch = urlDecoded.match(/src=\\"([^\\]+\.mp4[^\\]*)\\"/i) || 
                           urlDecoded.match(/src="([^"]+\.mp4[^"]*)"/i);
      if (videoSrcMatch) {
        videoUrl = videoSrcMatch[1].replace(/\\/g, '');
      }
    } catch (e) {
      console.error('[kamababa] Failed to decode video URL:', e);
    }
  }
  
  // Extract duration
  const durationMatch = html.match(/<span[^>]*class="duration"[^>]*>([^<]+)</i);
  const duration = durationMatch ? durationMatch[1].trim() : undefined;
  
  // Extract upload date from meta tag
  const dateMatch = html.match(/<meta[^>]+property="article:published_time"[^>]+content="([^"]+)"/i);
  const uploadDate = dateMatch ? dateMatch[1] : undefined;
  
  // Extract categories
  const categories: string[] = [];
  const catMatches = extractAllMatches(html, /<a[^>]+href="[^"]*\/category\/([^"\/]+)"[^>]*>([^<]+)</gi);
  for (const catMatch of catMatches) {
    categories.push(catMatch[2].trim());
  }
  
  // Extract tags
  const tags: string[] = [];
  const tagMatches = extractAllMatches(html, /<a[^>]+href="[^"]*\/tag\/([^"\/]+)"[^>]*>([^<]+)</gi);
  for (const tagMatch of tagMatches) {
    tags.push(tagMatch[2].trim());
  }
  
  // Extract related videos from the page
  // On Kamababa, related videos are in <main> as article.thumb-block elements
  // The current video is ALSO an article.thumb-block, but it has the iframe/video player
  const relatedVideos: KamaBabaVideo[] = [];
  
  // Find all articles in the page
  const articlePattern = /<article[^>]+id="post-(\d+)"[^>]+class="[^"]*thumb-block[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
  const allArticles = extractAllMatches(html, articlePattern);
  
  console.log(`[kamababa] Found ${allArticles.length} total articles on page`);
  
  // Filter out the current video (which has the iframe or matches current postId)
  for (const articleMatch of allArticles) {
    const articlePostId = articleMatch[1];
    const articleHtml = articleMatch[2];
    
    // Skip if this is the current video (has iframe player or matches current post ID)
    if (articlePostId === postId || articleHtml.includes('player-x.php') || articleHtml.includes('<iframe')) {
      console.log(`[kamababa] Skipping article ${articlePostId} (main video)`);
      continue;
    }
    
    // This is a related video
    // Extract title and URL
    const relatedTitleMatch = articleHtml.match(/<a[^>]+href="([^"]+)"[^>]+title="([^"]+)"/i);
    if (!relatedTitleMatch) {
      console.warn(`[kamababa] No title found for related article ${articlePostId}`);
      continue;
    }
    
    const relatedPostUrl = relatedTitleMatch[1];
    const relatedTitle = relatedTitleMatch[2].trim();
    
    // Extract slug from URL
    const relatedSlugMatch = relatedPostUrl.match(/\/([^\/]+)\/?$/);
    const relatedSlug = relatedSlugMatch ? relatedSlugMatch[1] : articlePostId;
    
    // Extract thumbnail
    let relatedThumbnail = '';
    // First try to get thumbnail from <video poster> attribute (main image for related videos)
    let relatedImgMatch = articleHtml.match(/<video[^>]+poster="([^"]+)"/i);
    if (!relatedImgMatch) {
      // Fallback to <img> tag if no video poster
      relatedImgMatch = articleHtml.match(/<img[^>]+src="([^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/i);
    }
    
    if (relatedImgMatch) {
      relatedThumbnail = relatedImgMatch[1].replace(/['")\]]+$/, '');
      if (relatedThumbnail && !relatedThumbnail.startsWith('http')) {
        relatedThumbnail = `${BASE_URL}${relatedThumbnail.startsWith('/') ? '' : '/'}${relatedThumbnail}`;
      }
      if (relatedThumbnail) {
        relatedThumbnail = `${WORKER_URL}/?url=${encodeURIComponent(relatedThumbnail)}`;
      }
    }
    
    // Extract duration
    const relatedDurationMatch = articleHtml.match(/<span[^>]*class="duration"[^>]*>([^<]+)</i);
    const relatedDuration = relatedDurationMatch ? relatedDurationMatch[1].trim() : undefined;
    
    relatedVideos.push({
      id: articlePostId,
      title: relatedTitle,
      slug: relatedSlug,
      thumbnail: relatedThumbnail,
      postUrl: relatedPostUrl,
      categories: [],
      tags: [],
      duration: relatedDuration,
    });
    
    // Limit to 12 related videos
    if (relatedVideos.length >= 12) break;
  }
  
  console.log(`[kamababa] Extracted video: ${title}`);
  console.log(`[kamababa] Video URL: ${videoUrl || 'Not found'}`);
  console.log(`[kamababa] Embed URL: ${embedUrl || 'Not found'}`);
  console.log(`[kamababa] Related videos: ${relatedVideos.length}`);
  
  return {
    id: postId,
    title,
    slug,
    thumbnail,
    videoUrl: videoUrl || undefined,
    embedUrl: embedUrl || undefined,
    postUrl,
    categories,
    tags,
    duration,
    uploadDate,
    relatedVideos: relatedVideos.length > 0 ? relatedVideos : undefined,
  };
}

/**
 * Fetch all categories
 */
export async function fetchCategories(): Promise<KamaBabaCategory[]> {
  console.log('[kamababa] Fetching categories');
  
  const html = await fetchViaWorker(`${BASE_URL}/categories/`);
  const categories: KamaBabaCategory[] = [];
  
  // Extract category blocks from article elements
  // kamababa categories page uses article blocks similar to video listings
  const articlePattern = /<article[^>]+class="[^"]*thumb-block[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
  const articles = extractAllMatches(html, articlePattern);
  
  console.log(`[kamababa] Found ${articles.length} category articles`);
  
  for (const articleMatch of articles) {
    const articleHtml = articleMatch[1];
    
    // Extract category link and name from <a> tag with title attribute
    const linkMatch = articleHtml.match(/<a[^>]+href="([^"]*\/category\/([^"\/]+)\/)"[^>]+title="([^"]+)"/i);
    if (!linkMatch) {
      console.warn('[kamababa] No category link found in article');
      continue;
    }
    
    const url = linkMatch[1];
    const slug = linkMatch[2];
    const name = linkMatch[3].trim();
    
    // Extract count from the title or content
    const countMatch = articleHtml.match(/(\d+)\s+videos?/i);
    const count = countMatch ? parseInt(countMatch[1], 10) : undefined;
    
    // Extract thumbnail from img src attribute
    let thumbnail = '';
    const imgMatch = articleHtml.match(/<img[^>]+src="([^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/i);
    if (imgMatch) {
      thumbnail = imgMatch[1];
      
      // Clean and proxy the thumbnail
      thumbnail = thumbnail.replace(/['")\]]+$/, '');
      
      // Ensure absolute URL
      if (thumbnail && !thumbnail.startsWith('http')) {
        thumbnail = `${BASE_URL}${thumbnail.startsWith('/') ? '' : '/'}${thumbnail}`;
      }
      
      // Proxy thumbnail through worker
      if (thumbnail) {
        thumbnail = `${WORKER_URL}/?url=${encodeURIComponent(thumbnail)}`;
      }
    }
    
    categories.push({
      name,
      slug,
      url,
      thumbnail: thumbnail || undefined,
      count,
    });
    
    console.log(`[kamababa] Category: ${name} (${slug}) - Thumbnail: ${thumbnail ? 'YES' : 'NO'}`);
  }
  
  console.log(`[kamababa] Extracted ${categories.length} categories`);
  return categories;
}

/**
 * Fetch videos by category
 */
export async function fetchCategoryVideos(categorySlug: string, page: number = 1): Promise<KamaBabaVideo[]> {
  const categoryUrl = page > 1 
    ? `${BASE_URL}/category/${categorySlug}/page/${page}/`
    : `${BASE_URL}/category/${categorySlug}/`;
  
  return fetchVideos(categoryUrl);
}

/**
 * Search videos
 */
export async function searchVideos(query: string): Promise<KamaBabaVideo[]> {
  const searchUrl = `${BASE_URL}/?s=${encodeURIComponent(query)}`;
  return fetchVideos(searchUrl);
}

/**
 * Get video by slug
 */
export async function getVideoBySlug(slug: string): Promise<KamaBabaVideo | null> {
  // Construct post URL - kamababa uses simple slug structure
  const postUrl = `${BASE_URL}/${slug}/`;
  return getVideoDetails(postUrl);
}
