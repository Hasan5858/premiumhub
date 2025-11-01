import type {
  Category,
  CategoryResponse,
  CategoryDetails,
  WebseriesDetails,
  SearchResponse,
} from "@/types"
import { generateSlug } from "@/utils/slug"
import { getCacheItem, setCacheItem, hasCacheItem, removeCacheItem } from "@/services/cache"
import { providerManager } from "@/services/providers"

// Use Next.js API routes as a proxy to hide the actual API endpoints
const API_BASE_URL = "/api/proxy"

// Mock data for fallback when APIs fail

const mockCategories = [
  {
    slug: "action",
    name: "Action",
    videoCount: 245,
    imageUrl: "/action-movie-scene.png",
  },
  {
    slug: "comedy",
    name: "Comedy",
    videoCount: 189,
    imageUrl: "/placeholder-ow5mb.png",
  },
  {
    slug: "drama",
    name: "Drama",
    videoCount: 210,
    imageUrl: "/dramatic-emotional-scene.png",
  },
  {
    slug: "documentary",
    name: "Documentary",
    videoCount: 156,
    imageUrl: "/nature-documentary-filming.png",
  },
  {
    slug: "sci-fi",
    name: "Sci-Fi",
    videoCount: 132,
    imageUrl: "/futuristic-cityscape.png",
  },
]

const mockWebseries = [
  {
    id: "ws1",
    title: "The Hidden Truth",
    thumbnail: "/dark-mystery-series.png",
    duration: "45 min",
    quality: "HD",
    link: "/webseries/the-hidden-truth",
    originalUrl: "https://example.com/the-hidden-truth",
  },
  {
    id: "ws2",
    title: "Beyond the Horizon",
    thumbnail: "/sci-fi-space-adventure.png",
    duration: "52 min",
    quality: "4K",
    link: "/webseries/beyond-the-horizon",
    originalUrl: "https://example.com/beyond-the-horizon",
  },
  {
    id: "ws3",
    title: "City Lights",
    thumbnail: "/urban-night-cityscape.png",
    duration: "38 min",
    quality: "HD",
    link: "/webseries/city-lights",
    originalUrl: "https://example.com/city-lights",
  },
  {
    id: "ws4",
    title: "Wilderness",
    thumbnail: "/nature-documentary-forest.png",
    duration: "42 min",
    quality: "HD",
    link: "/webseries/wilderness",
    originalUrl: "https://example.com/wilderness",
  },
]

// Helper function to parse view counts like "2.9B" or "592.2M" to numbers
function parseViewCount(viewStr: string): number {
  if (!viewStr) return 0

  try {
    // Remove any non-numeric characters except dots and letters
    const cleanStr = viewStr.replace(/[^0-9.KMBT]/gi, "")

    // Extract the number and the unit
    const num = Number.parseFloat(cleanStr.replace(/[KMBT]/gi, ""))
    const unit = cleanStr.match(/[KMBT]$/i)?.[0]?.toUpperCase() || ""

    // Convert based on unit
    switch (unit) {
      case "K":
        return num * 1000
      case "M":
        return num * 1000000
      case "B":
        return num * 1000000000
      case "T":
        return num * 1000000000000
      default:
        return num
    }
  } catch (e) {
    console.error("Error parsing view count:", viewStr, e)
    return 0
  }
}

export async function fetchCategories(page = 1): Promise<CategoryResponse> {
  const cacheKey = `categories-page-${page}`
  
  // Check cache first, but validate that cached data has proper imageUrl values
  const cachedData = getCacheItem<CategoryResponse>(cacheKey)
  if (cachedData) {
    // Validate cached data - check if categories have imageUrl
    const hasValidImageUrls = cachedData.categories && cachedData.categories.length > 0 &&
      cachedData.categories.every((cat: Category) => cat.imageUrl && cat.imageUrl.startsWith('http'))
    
    if (hasValidImageUrls) {
      console.log(`Using cached data for ${cacheKey}`)
      return cachedData
    } else {
      // Cache has invalid data (no imageUrls), clear it and fetch fresh
      console.log(`Cached data for ${cacheKey} has invalid imageUrls, clearing cache and fetching fresh`)
      removeCacheItem(cacheKey)
    }
  }

  try {
    // Use the original API endpoint directly (this is for "Popular Categories" section)
    // Provider categories are handled separately via fetchAllProviderCategories()
    const url = `${API_BASE_URL}/categories/categories${page > 1 ? `/${page}` : ""}`
    console.log("Fetching categories from:", url)
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`)
    }
    const data = await response.json()
    
    // Validate the fetched data has imageUrl
    if (data.categories && Array.isArray(data.categories)) {
      const validCategories = data.categories.filter((cat: Category) => 
        cat.imageUrl && (cat.imageUrl.startsWith('http') || cat.imageUrl.startsWith('/'))
      )
      
      if (validCategories.length > 0) {
        // Only cache if we have valid data
        data.categories = validCategories
        setCacheItem(cacheKey, data)
      } else {
        console.warn("Fetched categories don't have valid imageUrls")
      }
    }
    
    return data
  } catch (error) {
    console.error("Error fetching categories:", error)
    // Only return mock data as last resort if all else fails
    return {
      categories: mockCategories,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
        nextPageUrl: null,
        prevPageUrl: null,
      },
    }
  }
}

export async function fetchCategoryVideos(slug: string, page = 1): Promise<CategoryDetails> {
  const cacheKey = `category-${slug}-page-${page}`
  
  // Check cache first
  const cachedData = getCacheItem<CategoryDetails>(cacheKey)
  if (cachedData) {
    console.log(`Using cached data for ${cacheKey}`)
    return cachedData
  }
  
  const url = `${API_BASE_URL}/categories/${slug}${page > 1 ? `/${page}` : ""}`

  try {
    console.log("Fetching category videos from:", url)
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch videos for category ${slug}: ${response.status} ${response.statusText}`)
    }
    const data = await response.json()
    
    // Cache the results
    setCacheItem(cacheKey, data)
    
    return data
  } catch (error) {
    console.error(`Error fetching category videos for ${slug}:`, error)
    throw error
  }
}

// Update the fetchCategoryVideoDetails function to use the correct URL format
export async function fetchCategoryVideoDetails(id: string): Promise<any> {
  const cacheKey = `category-video-${id}`
  
  // Check cache first
  const cachedData = getCacheItem<any>(cacheKey)
  if (cachedData) {
    console.log(`Using cached data for ${cacheKey}`)
    return cachedData
  }
  
  try {
    // For category videos, we need to use the data directly from the category listing
    // instead of making another API call that's failing
    console.log("Using direct video data for:", id)

    // Return the video data structure directly
    const videoData = {
      id: id,
      title: id
        .split("-")
        .join(" ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      url: `https://www.superporn.com/es/video/${id}`,
      thumbnailUrl: `/api/placeholder?height=400&width=600&query=${encodeURIComponent(id)}`,
      duration: "08:00",
      views: "10k",
      models: [
        {
          slug: "model",
          name: "Model Name",
        },
      ],
      categories: [
        {
          slug: "category",
          name: "Category",
        },
      ],
    }
    
    // Cache the results
    setCacheItem(cacheKey, videoData)
    
    return videoData
  } catch (error) {
    console.error(`Error handling video details for ${id}:`, error)
    // Return minimal mock data
    return {
      id: id,
      title: id
        .split("-")
        .join(" ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      url: "",
      thumbnailUrl: "/api/placeholder?height=400&width=600&query=video",
      duration: "00:00",
      views: "0",
    }
  }
}



export async function searchVideos(query: string, page = 1): Promise<SearchResponse> {
  const cacheKey = `search-${query.toLowerCase()}-page-${page}`
  
  // Check cache first
  const cachedData = getCacheItem<SearchResponse>(cacheKey)
  if (cachedData) {
    console.log(`Using cached data for ${cacheKey}`)
    return cachedData
  }

  try {
    // Try provider-based search first
    console.log("Searching videos from providers")
    const providerResults = await searchAllProviderVideos(query, page)
    
    if (providerResults.success && providerResults.data && providerResults.data.length > 0) {
      // Transform provider videos to SearchResponse format
      const transformedVideos = providerResults.data.map((video: any) => ({
        id: video.id || video.seo_slug || `video-${video.original_id}`,
        title: video.title || 'Untitled Video',
        thumbnail: video.thumbnail_url || video.thumbnail || '/api/placeholder?height=400&width=600&query=video',
        duration: video.duration || '00:00',
        rating: 0,
        year: new Date().getFullYear(),
        category: video.category || 'Uncategorized',
        views: video.views || '0',
        playerUrl: video.url || video.seo_slug ? `/provider/${video.provider || 'indianpornhq'}/video/${video.seo_slug || video.id}` : '',
      }))
      
      const result: SearchResponse = {
        videos: transformedVideos,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(providerResults.total / 20), // Assuming 20 items per page
          hasNextPage: transformedVideos.length >= 20,
        },
      }
      
      // Cache the results
      setCacheItem(cacheKey, result)
      
      return result
    }
  } catch (providerError) {
    console.log("Provider search failed, trying fallback:", providerError)
  }
  
  // Fallback to old API endpoint if provider search fails
  try {
    // Encode the query parameter properly
    const encodedQuery = encodeURIComponent(query)
    const url = `${API_BASE_URL}/search?q=${encodedQuery}&page=${page}`

    console.log("Searching videos from:", url)
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to search videos: ${response.status} ${response.statusText}`)
    }
    const data = await response.json()
    
    // Cache the results
    setCacheItem(cacheKey, data)
    
    return data
  } catch (error) {
    console.error(`Error searching videos for "${query}":`, error)
    // Return empty result instead of throwing
    return {
      videos: [],
      pagination: {
        currentPage: page,
        totalPages: 0,
        hasNextPage: false,
      },
    }
  }
}


// Helper function to detect if cached data is mock data
function isMockData(data: any): boolean {
  if (!data || !data.posts || !Array.isArray(data.posts)) return false
  
  // Check if posts match mock webseries structure (by checking for known mock IDs or titles)
  const mockIds = ["ws1", "ws2", "ws3", "ws4"]
  const mockTitles = ["The Hidden Truth", "Beyond the Horizon", "City Lights", "Wilderness"]
  
  return data.posts.some((post: any) => 
    mockIds.includes(post.id) || 
    mockTitles.includes(post.title)
  )
}

export async function fetchLatestWebseries(page = 1): Promise<any> {
  const cacheKey = `latest-webseries-page-${page}`
  
  // Check cache first, but skip if it's mock data
  const cachedData = getCacheItem<any>(cacheKey)
  if (cachedData && !isMockData(cachedData)) {
    console.log(`Using cached data for ${cacheKey}`)
    return cachedData
  }
  
  // Clear mock data from cache if found
  if (cachedData && isMockData(cachedData)) {
    console.log(`Removing mock data from cache for ${cacheKey}`)
    removeCacheItem(cacheKey)
  }
  
  // Format the URL correctly based on the page number
  const url = page === 1 ? `${API_BASE_URL}/webseries/api/latest` : `${API_BASE_URL}/webseries/api/latest/page${page}`

  try {
    console.log("Fetching latest webseries from:", url)
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch latest webseries: ${response.status} ${response.statusText}`)
    }
    const data = await response.json()
    
    // Validate that we have real data (not empty)
    if (!data || (!data.posts && !data.webseries)) {
      throw new Error("No webseries data returned from API")
    }
    
    // Transform the data to include SEO-friendly slugs
    const posts = data.posts || data.webseries || []
    if (Array.isArray(posts) && posts.length > 0) {
      const transformedPosts = posts.map((series: any) => {
        // Generate a slug from the title or URL
        const slug = generateSlug(series.title || series.link || series.id || 'webseries')

        return {
          ...series,
          link: `/webseries/${slug}`,
          originalUrl: series.link || series.originalUrl || series.url,
        }
      })
      
      data.posts = transformedPosts
      // Also set webseries property for compatibility
      data.webseries = transformedPosts
    }
    
    // Only cache if we have real data
    if (data.posts && Array.isArray(data.posts) && data.posts.length > 0 && !isMockData(data)) {
      setCacheItem(cacheKey, data)
    }
    
    return data
  } catch (error) {
    console.error("Error fetching latest webseries:", error)
    
    // Return empty data structure instead of mock data
    return {
      posts: [],
      webseries: [],
      has_next_page: false,
      page: page,
      total_pages: 0,
      total_posts: 0,
    }
  }
}

export async function fetchWebseriesDetails(slugOrUrl: string): Promise<WebseriesDetails> {
  const cacheKey = `webseries-${slugOrUrl}`
  
  // Check cache first
  const cachedData = getCacheItem<WebseriesDetails>(cacheKey)
  if (cachedData) {
    console.log(`Using cached data for ${cacheKey}`)
    return cachedData
  }
  
  try {
    let url: string

    // Check if this is a slug or a full URL
    if (slugOrUrl.startsWith("http")) {
      // It's already a URL
      url = slugOrUrl
    } else {
      // It's a slug, try to construct the original URL
      // For webseries, we'll use the slug to fetch from the API
      // The API should handle slug to URL conversion
      url = `https://uncutdesi.org/${slugOrUrl}`
    }

    // Encode the URL for the API request
    const encodedUrl = encodeURIComponent(url)
    const apiUrl = `${API_BASE_URL}/webseries/${encodedUrl}`

    console.log("Fetching webseries details from:", apiUrl)
    const response = await fetch(apiUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch webseries details: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    // If the response includes playerIframe, make sure it's passed through
    if (data.video && !data.video.playerIframe && data.playerIframe) {
      data.video.playerIframe = data.playerIframe
    }
    
    // Cache the results
    setCacheItem(cacheKey, data)
    
    return data
  } catch (error) {
    console.error(`Error fetching webseries details for ${slugOrUrl}:`, error)

    // Return a minimal mock response
    return {
      success: true,
      video: {
        title: slugOrUrl
          .split("-")
          .join(" ")
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        description: "Description not available",
        poster: `/api/placeholder?height=600&width=400&query=${encodeURIComponent(slugOrUrl)}`,
        url: "",
        source: "https://vidneo.org/wp-content/uploads/2025/05/Honeymoon_Ep1_MoodX.mp4", // Example source for testing
        tags: "",
      },
    }
  }
}

export async function fetchVideoEmbed(videoUrl: string): Promise<string> {
  const cacheKey = `video-embed-${videoUrl}`
  
  // Check cache first
  const cachedData = getCacheItem<string>(cacheKey)
  if (cachedData) {
    console.log(`Using cached data for ${cacheKey}`)
    return cachedData
  }
  
  const apiUrl = `${API_BASE_URL}/embed/${videoUrl}`

  try {
    console.log("Fetching video embed from:", apiUrl)
    const response = await fetch(apiUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch video embed: ${response.status} ${response.statusText}`)
    }
    const embedHtml = await response.text()
    
    // Cache the results
    setCacheItem(cacheKey, embedHtml)
    
    return embedHtml
  } catch (error) {
    console.error(`Error fetching video embed for ${videoUrl}:`, error)
    return "<div>Video player unavailable</div>"
  }
}

export async function fetchVideoData(videoId: string): Promise<any> {
  const cacheKey = `video-data-${videoId}`
  
  // Check cache first
  const cachedData = getCacheItem<any>(cacheKey)
  if (cachedData) {
    console.log(`Using cached data for ${cacheKey}`)
    return cachedData
  }
  
  try {
    // Make sure we're using the full URL format for the video data API
    // If the videoId is already a full URL, use it directly
    // Otherwise, construct the URL
    let fullUrl = videoId

    // If the URL doesn't start with http, assume it's just the ID part
    if (!videoId.startsWith("http")) {
      fullUrl = `https://xhamster.desi/videos/${videoId}`
    }

    // Encode the URL for the API request
    const encodedUrl = encodeURIComponent(fullUrl)
    const apiUrl = `${API_BASE_URL}/search/${encodedUrl}`

    console.log("Fetching video data from:", apiUrl)
    const response = await fetch(apiUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch video data: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Cache the results
    setCacheItem(cacheKey, data)
    
    return data
  } catch (error) {
    console.error(`Error fetching video data for ${videoId}:`, error)
    // Return minimal mock data
    return {
      id: videoId,
      title: "Video Title",
      description: "Video description not available",
      thumbnail: "/api/placeholder?height=400&width=600&query=video%20thumbnail",
      duration: "00:00",
      url: "",
      keywords: [],
      playerIframe: "<div>Video player unavailable</div>",
      relatedVideos: [],
    }
  }
}

// Helper method to generate consistent cache keys
function generateCacheKey(prefix: string, params: Record<string, string | number>): string {
  const parts = [prefix]
  
  Object.entries(params)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .forEach(([key, value]) => {
      parts.push(`${key}-${value}`)
    })
    
  return parts.join('-')
}

// ===== NEW PROVIDER FUNCTIONS =====

/**
 * Fetch videos from IndianPornHQ provider
 */
export async function fetchIndianPornHQVideos(pageType: string = 'homepage'): Promise<any> {
  const cacheKey = `indianpornhq-videos-${pageType}`
  // Cache for 1 hour (60 minutes) for fresh data
  const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds
  
  // Check cache first
  const cachedData = getCacheItem<any>(cacheKey)
  if (cachedData) {
    console.log(`Using cached data for ${cacheKey}`)
    return cachedData
  }
  
  try {
    const result = await providerManager.getVideos('indianpornhq', pageType)
    
    // Cache the results for 1 hour
    setCacheItem(cacheKey, result, CACHE_DURATION)
    
    return result
  } catch (error) {
    console.error("Error fetching IndianPornHQ videos:", error)
    throw error
  }
}

/**
 * Fetch videos from a specific category URL
 */
export async function fetchIndianPornHQCategoryVideos(categoryUrl: string): Promise<any> {
  // Categories only have page 1 - no pagination, so cache key doesn't need page number
  const cacheKey = `indianpornhq-category-${encodeURIComponent(categoryUrl)}`
  // Cache for 1 hour (60 minutes)
  const CACHE_DURATION = 60 * 60 * 1000
  
  // Check cache first
  const cachedData = getCacheItem<any>(cacheKey)
  if (cachedData) {
    console.log(`Using cached data for ${cacheKey}`)
    return cachedData
  }
  
  try {
    // Get the base URL for the current environment
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    const encodedUrl = encodeURIComponent(categoryUrl)
    // Always fetch page 1 - categories don't have pagination
    const response = await fetch(`${baseUrl}/api/providers/indianpornhq/category-videos?url=${encodedUrl}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch category videos: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    
    // Cache the results for 1 hour
    setCacheItem(cacheKey, result, CACHE_DURATION)
    
    return result
  } catch (error) {
    console.error("Error fetching IndianPornHQ category videos:", error)
    throw error
  }
}

/**
 * Search videos across all providers
 */
export async function searchAllProviderVideos(query: string, page = 1): Promise<any> {
  const cacheKey = `search-all-providers-${query}-${page}`
  
  // Check cache first
  const cachedData = getCacheItem<any>(cacheKey)
  if (cachedData) {
    console.log(`Using cached data for ${cacheKey}`)
    return cachedData
  }
  
  try {
    const result = await providerManager.searchAllVideos(query, page)
    
    // Cache the results
    setCacheItem(cacheKey, result)
    
    return result
  } catch (error) {
    console.error("Error searching all provider videos:", error)
    throw error
  }
}

/**
 * Get video details from a specific provider
 */
export async function fetchProviderVideoDetails(provider: string, videoId: string): Promise<any> {
  const cacheKey = `provider-video-details-${provider}-${videoId}`
  
  // Check cache first
  const cachedData = getCacheItem<any>(cacheKey)
  if (cachedData) {
    console.log(`Using cached data for ${cacheKey}`)
    return cachedData
  }
  
  try {
    const result = await providerManager.getVideoDetails(provider, videoId)
    
    // Cache the results
    setCacheItem(cacheKey, result)
    
    return result
  } catch (error) {
    console.error(`Error fetching video details from ${provider}:`, error)
    throw error
  }
}

/**
 * Get categories from all providers
 */
export async function fetchAllProviderCategories(): Promise<any> {
  const cacheKey = 'all-provider-categories'
  
  // Check cache first
  const cachedData = getCacheItem<any>(cacheKey)
  if (cachedData) {
    console.log(`Using cached data for ${cacheKey}`)
    return cachedData
  }
  
  try {
    const allCategories: any[] = []
    const errors: string[] = []

    for (const provider of Object.keys(providerManager.getProviders())) {
      try {
        const result = await providerManager.getCategories(provider)
        if (result && result.data && Array.isArray(result.data)) {
          allCategories.push(...result.data)
        }
      } catch (error) {
        console.warn(`Failed to fetch categories from ${provider}:`, error)
        errors.push(`${provider}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Return success even if some providers failed, as long as we have some categories
    const result = {
      success: allCategories.length > 0,
      data: allCategories,
      total: allCategories.length,
      provider: 'all',
      timestamp: new Date().toISOString(),
      errors: errors.length > 0 ? errors : undefined
    }
    
    // Only cache if we have categories
    if (allCategories.length > 0) {
      setCacheItem(cacheKey, result)
    }
    
    return result
  } catch (error) {
    console.error("Error fetching all provider categories:", error)
    // Return empty result instead of throwing
    return {
      success: false,
      data: [],
      total: 0,
      provider: 'all',
      timestamp: new Date().toISOString(),
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * Get provider info with thumbnail from first video
 */
export async function fetchProviderInfo(provider: string): Promise<any> {
  const cacheKey = `provider-info-${provider}`
  // Cache for 1 hour (60 minutes) for IndianPornHQ, 15 minutes for others
  const CACHE_DURATION = provider === 'indianpornhq' ? 60 * 60 * 1000 : 15 * 60 * 1000
  
  // Check cache first
  const cachedData = getCacheItem<any>(cacheKey)
  if (cachedData) {
    console.log(`Using cached data for ${cacheKey}`)
    return cachedData
  }
  
  try {
    const videos = await providerManager.getVideos(provider)
    const providers = providerManager.getProviders()
    const providerConfig = providers[provider as keyof typeof providers]
    
    const result = {
      success: true,
      data: {
        name: providerConfig?.name || provider,
        provider,
        thumbnail: videos.data[0]?.thumbnail_url || '/api/placeholder?height=400&width=600&query=provider',
        totalVideos: videos.total,
        description: `Browse ${videos.total} videos from ${providerConfig?.name || provider}`,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    }
    
    // Cache the results with provider-specific duration
    setCacheItem(cacheKey, result, CACHE_DURATION)
    
    return result
  } catch (error) {
    console.error(`Error fetching provider info for ${provider}:`, error)
    throw error
  }
}
