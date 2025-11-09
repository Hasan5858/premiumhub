import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { url, slug } = req.query

    if (!url && !slug) {
      return res.status(400).json({ 
        error: 'URL or slug parameter is required',
        example: '/api/debug-webseries?url=https://uncutdesi.org/some-webseries-slug'
      })
    }

    // Construct URL
    let targetUrl: string
    if (url && typeof url === 'string' && url.startsWith('http')) {
      targetUrl = url
    } else if (slug && typeof slug === 'string') {
      targetUrl = `https://uncutdesi.org/${slug}`
    } else if (url && typeof url === 'string') {
      targetUrl = `https://uncutdesi.org/${url}`
    } else {
      return res.status(400).json({ error: 'Invalid URL or slug' })
    }

    console.log(`[Debug] Fetching HTML from: ${targetUrl}`)
    
    // Fetch the HTML
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    })

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed to fetch: ${response.status} ${response.statusText}`,
        url: targetUrl
      })
    }

    const html = await response.text()
    console.log(`[Debug] HTML length: ${html.length}`)

    // Analyze the HTML structure
    const analysis: any = {
      url: targetUrl,
      htmlLength: html.length,
      findings: {
        iframes: [],
        videoSources: [],
        playerIframes: [],
        episodeCards: [],
        videoLinks: [],
        scripts: [],
      },
      extracted: {
        videos: [],
        episodes: []
      }
    }

    // 1. Find all iframes
    const iframeRegex = /<iframe[^>]*src=["']([^"']+)["'][^>]*>/gi
    let iframeMatch
    while ((iframeMatch = iframeRegex.exec(html)) !== null) {
      analysis.findings.iframes.push({
        src: iframeMatch[1],
        fullTag: iframeMatch[0].substring(0, 200)
      })
    }

    // 2. Find video sources
    const videoSourceRegex = /<source[^>]*src=["']([^"']+)["'][^>]*>/gi
    let videoSourceMatch
    while ((videoSourceMatch = videoSourceRegex.exec(html)) !== null) {
      analysis.findings.videoSources.push(videoSourceMatch[1])
    }

    // 3. Look for player.iframe or playerIframe patterns
    const playerIframeRegex = /playerIframe|player\.iframe|player-iframe|player_iframe/gi
    let playerIframeMatch
    while ((playerIframeMatch = playerIframeRegex.exec(html)) !== null) {
      // Get context around the match
      const start = Math.max(0, (playerIframeMatch.index || 0) - 200)
      const end = Math.min(html.length, (playerIframeMatch.index || 0) + playerIframeMatch[0].length + 200)
      analysis.findings.playerIframes.push({
        context: html.substring(start, end),
        position: playerIframeMatch.index
      })
    }

    // 4. Look for video cards/episode containers - common patterns
    const cardPatterns = [
      /<div[^>]*class=["'][^"']*card[^"']*["'][^>]*>[\s\S]*?<\/div>/gi,
      /<div[^>]*class=["'][^"']*episode[^"']*["'][^>]*>[\s\S]*?<\/div>/gi,
      /<div[^>]*class=["'][^"']*video[^"']*["'][^>]*>[\s\S]*?<\/div>/gi,
      /<article[^>]*>[\s\S]*?<\/article>/gi,
    ]

    for (const pattern of cardPatterns) {
      let match
      while ((match = pattern.exec(html)) !== null) {
        const cardHtml = match[0]
        // Check if this card contains a video link or iframe
        const hasVideo = cardHtml.includes('iframe') || cardHtml.includes('video') || cardHtml.includes('player')
        if (hasVideo && cardHtml.length < 5000) { // Limit size
          analysis.findings.episodeCards.push({
            html: cardHtml.substring(0, 1000),
            hasIframe: cardHtml.includes('iframe'),
            hasVideo: cardHtml.includes('<video') || cardHtml.includes('video'),
            hasPlayer: cardHtml.includes('player'),
            length: cardHtml.length
          })
        }
      }
    }

    // 5. Find all video links (href containing video/play/episode)
    const videoLinkRegex = /<a[^>]*href=["']([^"']*(?:video|play|episode|watch)[^"']*)["'][^>]*>/gi
    let videoLinkMatch
    while ((videoLinkMatch = videoLinkRegex.exec(html)) !== null) {
      analysis.findings.videoLinks.push({
        href: videoLinkMatch[1],
        fullTag: videoLinkMatch[0].substring(0, 200)
      })
    }

    // 6. Look for JavaScript variables that might contain video URLs
    const jsVideoPatterns = [
      /(?:videoUrl|video_url|src|url|source)\s*[:=]\s*["']([^"']+)["']/gi,
      /(?:videoUrl|video_url|src|url|source)\s*[:=]\s*\[([^\]]+)\]/gi,
    ]

    for (const pattern of jsVideoPatterns) {
      let match
      while ((match = pattern.exec(html)) !== null) {
        analysis.findings.scripts.push({
          pattern: pattern.toString(),
          value: match[1],
          context: match[0].substring(0, 200)
        })
      }
    }

    // 7. Try to extract structured video/episode data
    // Look for JSON-LD or structured data
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    let jsonLdMatch
    while ((jsonLdMatch = jsonLdRegex.exec(html)) !== null) {
      try {
        const jsonData = JSON.parse(jsonLdMatch[1])
        if (jsonData['@type'] === 'VideoObject' || jsonData.video) {
          analysis.extracted.videos.push({
            type: 'json-ld',
            data: jsonData
          })
        }
      } catch (e) {
        // Not valid JSON
      }
    }

    // 7b. Extract all video/episode cards and their unique sources
    // This is the key part - find all video containers and extract their unique URLs
    const videoContainerPatterns = [
      // Pattern 1: Look for div containers with video-related classes
      /<div[^>]*class=["'][^"']*(?:video|episode|card|item|post)[^"']*["'][^>]*>([\s\S]{0,5000}?)<\/div>/gi,
      // Pattern 2: Article tags
      /<article[^>]*>([\s\S]{0,5000}?)<\/article>/gi,
      // Pattern 3: List items
      /<li[^>]*class=["'][^"']*(?:video|episode|card|item)[^"']*["'][^>]*>([\s\S]{0,5000}?)<\/li>/gi,
    ]

    const extractedCards: any[] = []
    for (const pattern of videoContainerPatterns) {
      let match
      let cardIndex = 0
      while ((match = pattern.exec(html)) !== null) {
        const cardHtml = match[1] || match[0]
        
        // Skip if too small (probably not a video card)
        if (cardHtml.length < 100) continue
        
        // Extract video URL/source from this card
        const cardInfo: any = {
          index: cardIndex++,
          htmlLength: cardHtml.length,
          sources: [],
          iframes: [],
          links: [],
          titles: [],
        }

        // Find iframe src
        const iframeSrcMatch = cardHtml.match(/<iframe[^>]*src=["']([^"']+)["']/i)
        if (iframeSrcMatch) {
          cardInfo.iframes.push(iframeSrcMatch[1])
          cardInfo.sources.push(iframeSrcMatch[1])
        }

        // Find video source
        const videoSrcMatch = cardHtml.match(/<source[^>]*src=["']([^"']+)["']/i)
        if (videoSrcMatch) {
          cardInfo.sources.push(videoSrcMatch[1])
        }

        // Find data attributes
        const dataRegex = /data-(?:video|src|url|source|iframe)=["']([^"']+)["']/gi
        let dataMatch
        while ((dataMatch = dataRegex.exec(cardHtml)) !== null) {
          cardInfo.sources.push(dataMatch[1])
        }

        // Find title
        const titleMatches = [
          cardHtml.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i),
          cardHtml.match(/title=["']([^"']+)["']/i),
          cardHtml.match(/<a[^>]*>([^<]+)<\/a>/i),
        ]
        for (const titleMatch of titleMatches) {
          if (titleMatch && titleMatch[1]) {
            const title = titleMatch[1].trim()
            if (title.length > 3 && title.length < 200) {
              cardInfo.titles.push(title)
            }
          }
        }

        // Find links
        const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>/gi
        let linkMatch
        while ((linkMatch = linkRegex.exec(cardHtml)) !== null) {
          cardInfo.links.push(linkMatch[1])
        }

        // Only add if it seems like a video card (has iframe, source, or link)
        if (cardInfo.sources.length > 0 || cardInfo.iframes.length > 0 || cardInfo.links.length > 0) {
          extractedCards.push(cardInfo)
        }
      }
    }

    analysis.extracted.episodes = extractedCards

    // 8. Look for data attributes that might contain video info
    const dataAttributeRegex = /data-(?:video|src|url|source|iframe)=["']([^"']+)["']/gi
    let dataAttributeMatch
    while ((dataAttributeMatch = dataAttributeRegex.exec(html)) !== null) {
      analysis.findings.episodeCards.push({
        type: 'data-attribute',
        attribute: dataAttributeMatch[0].match(/data-([^=]+)/)?.[1],
        value: dataAttributeMatch[1],
        context: dataAttributeMatch[0].substring(0, 200)
      })
    }

    // 9. Look for common video player patterns
    // Check for popular video hosting URLs
    const videoHostPatterns = [
      /https?:\/\/(?:player\.)?(?:vimeo|youtube|dailymotion|jwplayer|flowplayer|vidcloud|streamtape|doodstream)\.(?:com|net|to|stream)\/[^\s"']+/gi,
      /https?:\/\/[^\s"']*\.(?:mp4|m3u8|webm|ogg|avi|mov)(?:\?[^\s"']*)?/gi,
    ]

    for (const pattern of videoHostPatterns) {
      let match: RegExpExecArray | null
      while ((match = pattern.exec(html)) !== null) {
        if (match && match[0]) {
          const videoUrl = match[0]
          if (!analysis.extracted.videos.some((v: any) => v.url === videoUrl)) {
            analysis.extracted.videos.push({
              type: 'direct-url',
              url: videoUrl,
              source: 'pattern-match'
            })
          }
        }
      }
    }

    // 10. Look for array-like structures in JavaScript
    // Pattern: var videos = [...], videos: [...], episodes: [...]
    const arrayPatterns = [
      /(?:videos|episodes|items|list)\s*[:=]\s*\[([^\]]+)\]/gi,
      /(?:videos|episodes|items|list)\s*[:=]\s*\{([^}]+)\}/gi,
    ]

    for (const pattern of arrayPatterns) {
      let match
      while ((match = pattern.exec(html)) !== null) {
        analysis.findings.scripts.push({
          type: 'array-structure',
          content: match[1].substring(0, 500),
          fullMatch: match[0].substring(0, 500)
        })
      }
    }

    // Count unique findings
    analysis.summary = {
      totalIframes: analysis.findings.iframes.length,
      totalVideoSources: analysis.findings.videoSources.length,
      totalEpisodeCards: analysis.findings.episodeCards.length,
      totalVideoLinks: analysis.findings.videoLinks.length,
      totalScriptMatches: analysis.findings.scripts.length,
      totalExtractedVideos: analysis.extracted.videos.length,
      totalExtractedEpisodes: analysis.extracted.episodes.length,
    }

    // Add a summary of unique video URLs found in episodes
    const uniqueEpisodeSources = new Set<string>()
    analysis.extracted.episodes.forEach((ep: any) => {
      ep.sources.forEach((src: string) => uniqueEpisodeSources.add(src))
      ep.iframes.forEach((src: string) => uniqueEpisodeSources.add(src))
    })
    analysis.summary.uniqueEpisodeSources = Array.from(uniqueEpisodeSources)
    analysis.summary.uniqueEpisodeCount = uniqueEpisodeSources.size

    // Return the analysis
    res.status(200).json({
      success: true,
      analysis,
      // Also include a snippet of the HTML for manual inspection
      htmlSnippet: {
        start: html.substring(0, 5000),
        middle: html.length > 10000 ? html.substring(html.length / 2 - 2500, html.length / 2 + 2500) : null,
        end: html.substring(Math.max(0, html.length - 5000))
      }
    })

  } catch (error) {
    console.error('[Debug] Error:', error)
    res.status(500).json({
      error: 'Failed to debug webseries',
      detail: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

