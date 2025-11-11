const BASE_URL = 'https://www.fsiblog5.com';
const WORKER_URL = 'https://fsiblog5.premiumhub.workers.dev';

export interface FSIBlog5Video {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  videoUrl?: string;
  embedUrl?: string;
  postUrl: string;
  categories: string[];
  tags: string[];
  type: 'porn-video' | 'sex-gallery' | 'sex-story';
  excerpt?: string;
  uploadDate?: string;
  galleryImages?: string[]; // For sex-gallery posts
  relatedVideos?: FSIBlog5Video[]; // Related videos from sidebar or same category
}

/**
 * Extract related videos from sidebar widgets
 * Returns basic video info without recursively fetching full details
 */
async function extractRelatedVideosFromSidebar(html: string, currentPostId: string, limit: number = 9): Promise<FSIBlog5Video[]> {
  const relatedVideos: FSIBlog5Video[] = [];
  
  try {
    // Look for the "Related Porn Videos" section
    const relatedSectionPattern = /<section[^>]*>[\s\S]*?<h3[^>]*>Related Porn Videos<\/h3>[\s\S]*?<\/section>/i;
    const relatedSectionMatch = html.match(relatedSectionPattern);
    
    if (!relatedSectionMatch) {
      console.log('[fsiblog5] No "Related Porn Videos" section found');
      return relatedVideos;
    }
    
    const relatedSection = relatedSectionMatch[0];
    console.log('[fsiblog5] Found "Related Porn Videos" section');
    
    // Extract all article elements from related section
    const articlePattern = /<article[^>]+class="[^"]*elementor-post[^"]*post-(\d+)[^"]*type-(porn-video|sex-gallery|sex-story)[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
    const articles = extractAllMatches(relatedSection, articlePattern);
    
    console.log(`[fsiblog5] Found ${articles.length} related video articles`);
    
    for (const articleMatch of articles) {
      const postId = articleMatch[1];
      const type = articleMatch[2] as 'porn-video' | 'sex-gallery' | 'sex-story';
      const articleHtml = articleMatch[3];
      
      // Skip if it's the current video
      if (postId === currentPostId) continue;
      
      // Extract title and URL
      const titleMatch = articleHtml.match(/<h3[^>]*class="elementor-post__title"[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>[\s\S]*?([^<]+)</i);
      if (!titleMatch) continue;
      
      const postUrl = titleMatch[1];
      const title = titleMatch[2].trim();
      
      // Extract slug from URL
      const slugMatch = postUrl.match(/\/([^\/]+)\/?$/);
      const slug = slugMatch ? slugMatch[1] : postId;
      
      // Extract thumbnail with priority for data-src (lazy loading) and src
      let thumbnail = '';
      const dataSrcMatch = articleHtml.match(/data-src="([^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/i);
      if (dataSrcMatch) {
        thumbnail = dataSrcMatch[1];
      } else {
        const srcMatch = articleHtml.match(/<img[^>]+src="([^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/i);
        if (srcMatch && !srcMatch[1].startsWith('data:')) {
          thumbnail = srcMatch[1];
        }
      }
      
      // Clean and process thumbnail
      if (thumbnail) {
        thumbnail = thumbnail.replace(/['")\]]+$/, '');
        // Remove WordPress image size suffix
        thumbnail = thumbnail.replace(/-\d+x\d+(\.[a-z]+)$/i, '$1');
        // Ensure absolute URL
        if (!thumbnail.startsWith('http')) {
          thumbnail = `${BASE_URL}${thumbnail.startsWith('/') ? '' : '/'}${thumbnail}`;
        }
        // Proxy the thumbnail
        thumbnail = `${WORKER_URL}/?url=${encodeURIComponent(thumbnail)}`;
      }
      
      // Extract categories from article class or URL
      const categories: string[] = [];
      const categoryMatch = postUrl.match(/\/([^\/]+)\/[^\/]+\/?$/);
      if (categoryMatch) {
        categories.push(categoryMatch[1]);
      }
      
      // Extract tags from article class
      const tags: string[] = [];
      const tagMatches = extractAllMatches(articleMatch[0], /video-tag-([a-z0-9-]+)/gi);
      for (const tagMatch of tagMatches) {
        tags.push(tagMatch[1]);
      }
      
      relatedVideos.push({
        id: postId,
        slug,
        title,
        thumbnail,
        postUrl,
        categories,
        tags,
        type,
      });
      
      if (relatedVideos.length >= limit) break;
    }
    
    console.log(`[fsiblog5] Extracted ${relatedVideos.length} related videos`);
    
  } catch (error) {
    console.error('[fsiblog5] Error extracting related videos:', error);
  }
  
  return relatedVideos;
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
 * Extract text content from HTML string
 */
function extractTextContent(html: string, selector: string): string {
  const regex = new RegExp(selector + '[^>]*>([^<]+)<', 'i');
  const match = html.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Extract all matches for a selector
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
export async function fetchVideos(pageUrl?: string): Promise<FSIBlog5Video[]> {
  const url = pageUrl || BASE_URL;
  console.log(`[fsiblog5] Fetching videos from: ${url}`);
  
  const html = await fetchViaWorker(url);
  const videos: FSIBlog5Video[] = [];
  
  // Find all article elements using regex
  const articlePattern = /<article[^>]+class="[^"]*elementor-post[^"]*post-(\d+)[^"]*type-(porn-video|sex-gallery|sex-story)[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
  const articles = extractAllMatches(html, articlePattern);
  
  for (const articleMatch of articles) {
    const postId = articleMatch[1];
    const type = articleMatch[2] as 'porn-video' | 'sex-gallery' | 'sex-story';
    const articleHtml = articleMatch[3];
    
    // Extract title and URL
    const titleMatch = articleHtml.match(/<h3[^>]*class="elementor-post__title"[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>[\s\S]*?([^<]+)</i);
    if (!titleMatch) continue;
    
    const postUrl = titleMatch[1];
    const title = titleMatch[2].trim();
    
    // Extract slug from URL
    const slugMatch = postUrl.match(/\/([^\/]+)\/?$/);
    const slug = slugMatch ? slugMatch[1] : postId;
    
    // Extract thumbnail - FSIBlog uses lazy loading with data-src
    // Priority 1: Try data-src first (lazy loaded images)
    let thumbnail = '';
    const dataSrcMatch = articleHtml.match(/data-src="([^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/i);
    if (dataSrcMatch) {
      thumbnail = dataSrcMatch[1];
    } else {
      // Priority 2: Try regular src attribute
      const srcMatch = articleHtml.match(/<img[^>]+src="([^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/i);
      if (srcMatch && !srcMatch[1].startsWith('data:')) {
        thumbnail = srcMatch[1];
      }
    }
    
    // Clean up thumbnail URL (remove any trailing quotes or brackets)
    thumbnail = thumbnail.replace(/['")\]]+$/, '');
    
    // Remove WordPress image size suffix to get full-size image
    // e.g., image-300x225.jpg -> image.jpg
    thumbnail = thumbnail.replace(/-\d+x\d+(\.(jpg|jpeg|png|webp|gif))$/i, '$1');
    
    // Ensure absolute URL
    if (thumbnail && !thumbnail.startsWith('http')) {
      thumbnail = `https://www.fsiblog5.com${thumbnail.startsWith('/') ? '' : '/'}${thumbnail}`;
    }
    
    // Debug log for thumbnail extraction
    if (!thumbnail) {
      console.warn(`[fsiblog5] No thumbnail found for post: ${title} (ID: ${postId})`);
    } else {
      console.log(`[fsiblog5] Thumbnail extracted: ${thumbnail.substring(0, 80)}...`);
    }
    
    // Extract excerpt
    const excerptMatch = articleHtml.match(/<div[^>]*class="elementor-post__excerpt"[^>]*>[\s\S]*?<p>([^<]+)</i);
    const excerpt = excerptMatch ? excerptMatch[1].trim() : '';
    
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
      const video = {
        id: postId,
        title,
        slug,
        thumbnail: thumbnail.startsWith('http') ? thumbnail : `${BASE_URL}${thumbnail}`,
        postUrl,
        categories,
        tags,
        type,
        excerpt,
      };
      
      // Debug log each video
      console.log(`[fsiblog5] Video extracted: ${title.substring(0, 50)}... | Thumbnail: ${video.thumbnail ? 'YES' : 'NO'} | Type: ${type}`);
      
      videos.push(video);
    }
  }
  
  console.log(`[fsiblog5] Extracted ${videos.length} videos from ${url}`);
  console.log(`[fsiblog5] Videos with thumbnails: ${videos.filter(v => v.thumbnail).length}`);
  console.log(`[fsiblog5] Video types: ${videos.map(v => v.type).join(', ')}`);
  return videos;
}

/**
 * Fetch video details from individual post page
 */
export async function getVideoDetails(postUrl: string): Promise<FSIBlog5Video | null> {
  console.log(`[fsiblog5] Fetching video details from: ${postUrl}`);
  
  const html = await fetchViaWorker(postUrl);
  
  // Extract post ID from article class
  const articleMatch = html.match(/<article[^>]+class="[^"]*post-(\d+)[^"]*type-(porn-video|sex-gallery|sex-story)/i);
  const postId = articleMatch ? articleMatch[1] : 'unknown';
  const type = articleMatch ? articleMatch[2] as 'porn-video' | 'sex-gallery' | 'sex-story' : 'porn-video';
  
  // Extract title
  const titleMatch = html.match(/<h1[^>]*class="[^"]*elementor-heading-title[^"]*"[^>]*>([^<]+)</i) || 
                     html.match(/<title>([^<]+)/i);
  const title = titleMatch ? titleMatch[1].trim().replace(' - FSI Blog', '').replace(' - FSIBlog5', '') : '';
  
  // Extract slug from URL
  const slugMatch = postUrl.match(/\/([^\/]+)\/?$/);
  const slug = slugMatch ? slugMatch[1] : postId;
  
  // Extract thumbnail/poster
  const thumbMetaMatch = html.match(/<meta[^>]+itemprop="thumbnailUrl"[^>]+content="([^"]+)"/i) ||
                         html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i);
  let thumbnail = thumbMetaMatch ? thumbMetaMatch[1] : '';
  
  // Ensure absolute URL
  if (thumbnail && !thumbnail.startsWith('http')) {
    thumbnail = `https://www.fsiblog5.com${thumbnail.startsWith('/') ? '' : '/'}${thumbnail}`;
  }
  
  // Extract direct video URL from meta tag
  let videoUrl = '';
  const videoMetaMatch = html.match(/<meta[^>]+itemprop="contentURL"[^>]+content="([^"]+)"/i);
  if (videoMetaMatch) {
    videoUrl = videoMetaMatch[1];
  }
  
  // If no direct URL, try to extract from iframe data-src
  if (!videoUrl) {
    const iframeMatch = html.match(/<iframe[^>]+data-src="[^"]*\?q=([A-Za-z0-9+/=]+)"/i);
    if (iframeMatch) {
      try {
        const decoded = Buffer.from(iframeMatch[1], 'base64').toString('utf-8');
        const urlMatch = decoded.match(/src="(https:\/\/cdn\.fsiblog5\.com[^"]+)"/);
        if (urlMatch) {
          videoUrl = urlMatch[1];
        }
      } catch (e) {
        console.error('[fsiblog5] Failed to decode iframe data:', e);
      }
    }
  }
  
  // Extract upload date
  const dateMatch = html.match(/<meta[^>]+itemprop="uploadDate"[^>]+content="([^"]+)"/i);
  const uploadDate = dateMatch ? dateMatch[1] : '';
  
  // Extract description from post content
  const excerptMatch = html.match(/<div[^>]*class="[^"]*elementor-widget-theme-post-content[^"]*"[^>]*>[\s\S]*?<p>([^<]+)</i);
  const excerpt = excerptMatch ? excerptMatch[1].trim() : '';
  
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
  
  // Extract gallery images if type is sex-gallery
  let galleryImages: string[] = [];
  if (type === 'sex-gallery') {
    console.log(`[fsiblog5] Extracting gallery images for: ${title}`);
    console.log(`[fsiblog5] Post type detected as: ${type}`);
    
    // FSIBlog galleries use Elementor Gallery widget with <a> tags
    // Pattern: <a class="e-gallery-item" href="IMAGE_URL">
    const galleryPattern = /<a[^>]*class="[^"]*e-gallery-item[^"]*"[^>]*href="([^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/gi;
    const galleryMatches = extractAllMatches(html, galleryPattern);
    
    if (galleryMatches.length > 0) {
      console.log(`[fsiblog5] Found ${galleryMatches.length} gallery items`);
      
      for (const match of galleryMatches) {
        let imgUrl = match[1];
        
        // Remove WordPress image size suffix to get full-size image
        imgUrl = imgUrl.replace(/-\d+x\d+(\.(jpg|jpeg|png|webp|gif))$/i, '$1');
        
        // Ensure absolute URL
        if (!imgUrl.startsWith('http')) {
          imgUrl = `https://www.fsiblog5.com${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;
        }
        
        galleryImages.push(imgUrl);
      }
      
      // Remove duplicates
      galleryImages = Array.from(new Set(galleryImages));
    } else {
      console.log(`[fsiblog5] No e-gallery-item found, trying post content images...`);
      
      // Fallback: Try to find images in post content section
      const contentPattern = /<div[^>]*class="[^"]*elementor-widget-theme-post-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i;
      const contentMatch = html.match(contentPattern);
      
      if (contentMatch) {
        console.log(`[fsiblog5] Found elementor-widget-theme-post-content section`);
        const contentHtml = contentMatch[1];
        
        // Extract all image URLs (both data-src and src attributes)
        const imgPattern = /<img[^>]+(?:data-src|src)="([^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/gi;
        const imgMatches = extractAllMatches(contentHtml, imgPattern);
        
        console.log(`[fsiblog5] Found ${imgMatches.length} img tags in content`);
        
        for (const imgMatch of imgMatches) {
          let imgUrl = imgMatch[1];
          
          // Skip very small images (likely icons or placeholders)
          if (imgUrl.includes('icon') || imgUrl.includes('logo') || imgUrl.includes('placeholder')) {
            continue;
          }
          
          // Remove WordPress image size suffix to get full-size image
          imgUrl = imgUrl.replace(/-\d+x\d+(\.(jpg|jpeg|png|webp|gif))$/i, '$1');
          
          // Ensure absolute URL
          if (!imgUrl.startsWith('http')) {
            imgUrl = `https://www.fsiblog5.com${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;
          }
          
          galleryImages.push(imgUrl);
        }
        
        // Remove duplicates
        galleryImages = Array.from(new Set(galleryImages));
      }
    }
    
    console.log(`[fsiblog5] Found ${galleryImages.length} gallery images`);
  }
  
  // Extract related videos from sidebar
  const relatedVideos = await extractRelatedVideosFromSidebar(html, postId, 9);
  console.log(`[fsiblog5] Related videos: ${relatedVideos.length}`);
  
  console.log(`[fsiblog5] Extracted video: ${title}`);
  console.log(`[fsiblog5] Video URL: ${videoUrl}`);
  
  return {
    id: postId,
    title,
    slug,
    thumbnail,
    videoUrl: videoUrl || undefined,
    postUrl,
    categories,
    tags,
    type,
    excerpt,
    uploadDate,
    ...(type === 'sex-gallery' && galleryImages.length > 0 && { galleryImages }),
    ...(relatedVideos.length > 0 && { relatedVideos }),
  };
}

/**
 * Fetch videos by category
 */
export async function fetchCategoryVideos(categorySlug: string, page: number = 1): Promise<FSIBlog5Video[]> {
  const categoryUrl = page > 1 
    ? `${BASE_URL}/category/${categorySlug}/page/${page}/`
    : `${BASE_URL}/category/${categorySlug}/`;
  
  return fetchVideos(categoryUrl);
}

/**
 * Search videos
 */
export async function searchVideos(query: string): Promise<FSIBlog5Video[]> {
  const searchUrl = `${BASE_URL}/?s=${encodeURIComponent(query)}`;
  return fetchVideos(searchUrl);
}

/**
 * Get video by slug
 */
export async function getVideoBySlug(slug: string, categorySlug?: string): Promise<FSIBlog5Video | null> {
  // Construct post URL
  let postUrl: string;
  if (categorySlug) {
    postUrl = `${BASE_URL}/${categorySlug}/${slug}/`;
  } else {
    // Try to find the video from homepage first
    const videos = await fetchVideos();
    const video = videos.find(v => v.slug === slug);
    if (video) {
      postUrl = video.postUrl;
    } else {
      // Fallback: try common category paths
      postUrl = `${BASE_URL}/blowjob/${slug}/`;
    }
  }
  
  return getVideoDetails(postUrl);
}
