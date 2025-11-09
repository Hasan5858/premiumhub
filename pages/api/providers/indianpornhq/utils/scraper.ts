// Utility functions for IndianPornHQ scraping

export interface ScrapedVideo {
  title: string
  thumbnail_url: string
  duration: string
  url?: string
  id?: string
  quality?: string
  views?: string
}

export interface ScrapedVideoDetails {
  title: string
  description?: string
  thumbnail_url: string
  duration: string
  video_url?: string
  embed_url?: string
  xhamster_embed_url?: string  // Direct xHamster embed URL
  tags?: string[]
  views?: string
  upload_date?: string
  category?: string
}

/**
 * Scrapes video data from IndianPornHQ homepage HTML
 */
export function scrapeVideosFromHomepage(html: string): ScrapedVideo[] {
  const blocks = html.split('<div class="kmq"').slice(1)
  const results: ScrapedVideo[] = []

  for (const raw of blocks.slice(0, 40)) {
    // Thumbnail URL - look for img tags with src or data-src
    const thumbMatch = /<img[^>]*(?:src|data-src)=["']?([^"'>]+\.jpg)["']?/.exec(raw)
    let thumb = thumbMatch ? thumbMatch[1] : null
    if (thumb && !thumb.startsWith('http')) {
      thumb = `https://${thumb.replace(/^\/+/, "")}`
    }

    // Duration - look for span with class thumb-duration
    const durationMatch = /<span class="thumb-duration">([\d:]+)<\/span>/.exec(raw)
    let duration = durationMatch ? durationMatch[1] : null

    // Title - look for div with class iol
    const titleMatch = /<div class="iol">(.*?)<\/div>/.exec(raw)
    let title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, "").trim() : null

    // Extract video URL/ID if available
    const videoUrlMatch = /href=["']([^"']+)["']/.exec(raw)
    let videoUrl = videoUrlMatch ? videoUrlMatch[1] : null
    if (videoUrl && !videoUrl.startsWith('http')) {
      videoUrl = `https://www.indianpornhq.com${videoUrl}`
    }

    // Extract quality if available
    const qualityMatch = /<span class="thumb-quality">([^<]+)<\/span>/.exec(raw)
    let quality = qualityMatch ? qualityMatch[1] : undefined

    // Extract views if available
    const viewsMatch = /<span class="thumb-views">([^<]+)<\/span>/.exec(raw)
    let views = viewsMatch ? viewsMatch[1] : undefined

    if (title && thumb && duration) {
      results.push({
        title,
        thumbnail_url: thumb,
        duration,
        url: videoUrl || undefined,
        id: videoUrl ? videoUrl.split('/').pop() || undefined : undefined,
        quality: quality || undefined,
        views: views || undefined
      })
    }
  }
  return results
}

/**
 * Scrape videos from any page type (homepage, longest-videos, newest-videos, etc.)
 */
export function scrapeVideosFromPage(html: string, pageType: string = 'homepage'): ScrapedVideo[] {
  // All pages use the same structure, so we can reuse the homepage scraper
  return scrapeVideosFromHomepage(html)
}

/**
 * Get available page types for pagination
 */
export function getAvailablePageTypes(): Array<{type: string, url: string, name: string}> {
  return [
    { type: 'homepage', url: 'https://www.indianpornhq.com/', name: 'Latest Videos' },
    { type: 'longest', url: 'https://www.indianpornhq.com/indian/longest-videos/', name: 'Longest Videos' },
    { type: 'newest', url: 'https://www.indianpornhq.com/indian/newest-videos/', name: 'Newest Videos' },
    { type: 'trending', url: 'https://www.indianpornhq.com/indian/trending-videos/', name: 'Trending Videos' },
    { type: 'popular', url: 'https://www.indianpornhq.com/indian/popular-videos/', name: 'Popular Videos' }
  ]
}

/**
 * Scrapes detailed video information from a specific video page
 */
export function scrapeVideoDetails(html: string): ScrapedVideoDetails | null {
  try {
    // Extract title from h1 tag (IndianPornHQ structure)
    const titleMatch = /<h1[^>]*>(.*?)<\/h1>/.exec(html)
    const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, "").trim() : null

    // Extract description
    const descMatch = /<div[^>]*class="[^"]*description[^"]*"[^>]*>(.*?)<\/div>/.exec(html)
    const description = descMatch ? descMatch[1].replace(/<[^>]*>/g, "").trim() : null

    // Extract thumbnail from video poster or img tags (IndianPornHQ structure)
    let thumbnail_url = null
    const posterMatch = /poster=["']([^"']+)["']/.exec(html)
    if (posterMatch) {
      thumbnail_url = posterMatch[1]
    } else {
      const thumbMatch = /<img[^>]*(?:src|data-src)=["']?([^"'>]+\.jpg)["']?/.exec(html)
      thumbnail_url = thumbMatch ? thumbMatch[1] : null
    }
    
    if (thumbnail_url && !thumbnail_url.startsWith('http')) {
      thumbnail_url = `https://${thumbnail_url.replace(/^\/+/, "")}`
    }

    // Extract duration
    const durationMatch = /<span[^>]*class="[^"]*duration[^"]*"[^>]*>([\d:]+)<\/span>/.exec(html)
    const duration = durationMatch ? durationMatch[1] : null

    // Extract video URL from video source tags (IndianPornHQ structure)
    // Enhanced patterns to catch URLs with query parameters and various formats
    let video_url = null
    const videoPatterns = [
      // Match source tags with video extensions, including query parameters
      /<source[^>]*(?:src|data-src)=["']([^"']*\.mp4(?:\?[^"']*)?)["']/i,
      /<source[^>]*(?:src|data-src)=["']([^"']*\.webm(?:\?[^"']*)?)["']/i,
      /<source[^>]*(?:src|data-src)=["']([^"']*\.ogg(?:\?[^"']*)?)["']/i,
      /<source[^>]*(?:src|data-src)=["']([^"']*\.m3u8(?:\?[^"']*)?)["']/i,
      /<source[^>]*(?:src|data-src)=["']([^"']*\.avi(?:\?[^"']*)?)["']/i,
      /<source[^>]*(?:src|data-src)=["']([^"']*\.mov(?:\?[^"']*)?)["']/i,
      // Match video tags directly
      /<video[^>]*(?:src|data-src)=["']([^"']+)["']/i,
      // Match URLs in script tags or data attributes that contain video URLs
      /(?:video|src|url)["']?\s*[:=]\s*["']([^"']*\.(?:mp4|webm|ogg|m3u8|avi|mov)(?:\?[^"']*)?)["']/i
    ]

    for (const pattern of videoPatterns) {
      const match = pattern.exec(html)
      if (match && match[1]) {
        video_url = match[1].trim()
        // Remove any trailing characters that aren't part of the URL
        video_url = video_url.replace(/[<>"']/g, '').trim()
        
        // Ensure URL is properly formatted
        if (video_url && !video_url.startsWith('http')) {
          // If it's a relative URL, make it absolute
          if (video_url.startsWith('//')) {
            video_url = `https:${video_url}`
          } else if (video_url.startsWith('/')) {
            video_url = `https://www.indianpornhq.com${video_url}`
          } else {
            video_url = `https://${video_url.replace(/^\/+/, "")}`
          }
        }
        
        // Validate that we got a proper URL
        if (video_url && (video_url.startsWith('http') || video_url.startsWith('//'))) {
          break
        } else {
          video_url = null
        }
      }
    }

    // Extract embed URL
    const embedMatch = /<iframe[^>]*src=["']([^"']+)["']/.exec(html)
    let embed_url = embedMatch ? embedMatch[1] : null
    
    // Make embed URL absolute if it's relative
    if (embed_url && !embed_url.startsWith('http')) {
      if (embed_url.startsWith('//')) {
        embed_url = `https:${embed_url}`
      } else if (embed_url.startsWith('/')) {
        embed_url = `https://www.indianpornhq.com${embed_url}`
      } else {
        embed_url = `https://${embed_url}`
      }
    }

    // Try to extract xHamster video ID from the embed URL for direct playback
    let xhamster_embed_url = undefined
    if (embed_url) {
      // Pattern: extract video ID from query parameter (e.g., ?i=xhLmQdD)
      const videoIdMatch = /[?&]i=([a-zA-Z0-9]+)/.exec(embed_url)
      if (videoIdMatch && videoIdMatch[1]) {
        const videoId = videoIdMatch[1]
        // Use worker proxy to extract video and remove ads
        // Format: https://xhamster.premiumhub.workers.dev/https://xhamster.com/videos/{videoId}
        xhamster_embed_url = `https://xhamster.premiumhub.workers.dev/https://xhamster.com/videos/${videoId}`
        console.log(`[scraper] Extracted xHamster worker URL: ${xhamster_embed_url}`)
      }
    }

    // Extract tags from category links (IndianPornHQ structure)
    const tags: string[] = []
    // Look for tags in the video description area, not the footer categories
    const videoSection = html.match(/<div class="gwt">([\s\S]*?)<\/div>/)
    if (videoSection) {
      const tagLinks = videoSection[1].match(/<a[^>]*href="[^"]*"[^>]*>([^<]+)<\/a>/g)
      if (tagLinks) {
        tagLinks.forEach(link => {
          const tagMatch = link.match(/>([^<]+)</)
          if (tagMatch && tagMatch[1] && !tagMatch[1].includes('Home') && !tagMatch[1].includes('To Top')) {
            tags.push(tagMatch[1].trim())
          }
        })
      }
    }

    // Extract views
    const viewsMatch = /<span[^>]*class="[^"]*views[^"]*"[^>]*>([^<]+)<\/span>/.exec(html)
    const views = viewsMatch ? viewsMatch[1] : null

    // Extract upload date
    const dateMatch = /<span[^>]*class="[^"]*date[^"]*"[^>]*>([^<]+)<\/span>/.exec(html)
    const upload_date = dateMatch ? dateMatch[1] : null

    // Extract category from the first category link
    const categoryMatch = /<a[^>]*href="[^"]*\/[^"]*"[^>]*>([^<]+)<\/a>/.exec(html)
    const category = categoryMatch ? categoryMatch[1] : null

    // If we have a title, return the data (even if some fields are missing)
    if (title) {
      return {
        title,
        description: description || undefined,
        thumbnail_url: thumbnail_url || '/api/placeholder?height=400&width=600&query=video',
        duration: duration || 'Unknown',
        video_url: video_url || undefined,
        embed_url: embed_url || undefined,
        xhamster_embed_url: xhamster_embed_url || undefined,  // Include direct xHamster embed
        tags: tags.length > 0 ? tags : undefined,
        views: views || undefined,
        upload_date: upload_date || undefined,
        category: category || undefined
      }
    }

    return null
  } catch (error) {
    console.error('Error scraping video details:', error)
    return null
  }
}

/**
 * Scrapes categories from the site
 */
export function scrapeCategories(html: string): Array<{name: string, url: string, count?: number}> {
  const categories: Array<{name: string, url: string, count?: number}> = []
  const seenUrls = new Set<string>()
  
  try {
    // Pattern 1: Categories in list items with links and counts
    // Structure: <li><a href="/category/">Category Name</a>&nbsp;<span>123</span></li>
    const listItemPattern = /<li>\s*<a[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>(?:[^<]*<span[^>]*>(\d+)<\/span>)?[^<]*<\/li>/gi
    let match
    
    while ((match = listItemPattern.exec(html)) !== null) {
      const url = match[1].trim()
      const name = match[2].trim()
      const countStr = match[3] || ''
      
      // Filter valid category URLs (they start with / and are not special pages)
      if (url.startsWith('/') && 
          !url.startsWith('//') && 
          !url.includes('#') &&
          !url.includes('javascript:') &&
          !url.includes('mailto:') &&
          !url.match(/^\/(home|about|contact|login|sign|search|user|admin)/i) &&
          name.length > 0 &&
          name.length < 100 &&
          !seenUrls.has(url)) {
        
        let fullUrl = url
        if (!fullUrl.startsWith('http')) {
          fullUrl = `https://www.indianpornhq.com${fullUrl}`
        }
        
        const category = {
          name,
          url: fullUrl,
          count: countStr ? parseInt(countStr, 10) : undefined
        }
        
        categories.push(category)
        seenUrls.add(url)
      }
    }
    
    // Pattern 2: Direct category links (backup pattern)
    // Look for links that look like category links but weren't caught above
    const directLinkPattern = /<a[^>]*href=["'](\/[^"']+\/)[^>]*>([^<]+)<\/a>/gi
    while ((match = directLinkPattern.exec(html)) !== null) {
      const url = match[1].trim()
      const name = match[2].trim()
      
      // Skip if already seen or if it's clearly not a category
      if (seenUrls.has(url) || 
          url === '/' ||
          url.match(/^\/(videos?|photo|image|tag|search|user|login|register)/i) ||
          name.length === 0 ||
          name.length > 100) {
        continue
      }
      
      // Additional filters for common non-category links
      const skipPatterns = [
        /home/i, /about/i, /contact/i, /privacy/i, /terms/i,
        /login/i, /sign/i, /register/i, /search/i, /help/i,
        /faq/i, /dmca/i, /sitemap/i
      ]
      
      if (skipPatterns.some(pattern => name.match(pattern) || url.match(pattern))) {
        continue
      }
      
      let fullUrl = url
      if (!fullUrl.startsWith('http')) {
        fullUrl = `https://www.indianpornhq.com${fullUrl}`
      }
      
      categories.push({
        name,
        url: fullUrl
      })
      seenUrls.add(url)
    }
    
    // Remove duplicates and sort by name
    const uniqueCategories = categories.filter((cat, index, self) =>
      index === self.findIndex((c) => c.url === cat.url)
    )
    
    return uniqueCategories.sort((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    console.error('Error scraping categories:', error)
  }
  
  return categories
}

/**
 * Fetches HTML from a URL with proper headers
 */
export async function fetchHTML(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { 
      'User-Agent': 'Mozilla/5.0 (compatible; NextBot/1.0)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    }
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.text()
}
