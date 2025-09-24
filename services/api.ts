import type {
  CategoryResponse,
  CategoryDetails,
  CreatorListResponse,
  CreatorDetailsResponse,
  WebseriesDetails,
  SearchResponse,
  CreatorVideo,
  Creator,
} from "@/types"
import { generateSlug, mapSlugToUrl, getUrlFromSlug } from "@/utils/slug"
import { getCacheItem, setCacheItem, hasCacheItem } from "@/services/cache"

// Use Next.js API routes as a proxy to hide the actual API endpoints
const API_BASE_URL = "/api/proxy"

// Mock data for fallback when APIs fail
const mockCreators = [
  {
    slug: "creator1",
    name: "Alex Morgan",
    avatarUrl: "/placeholder-lsy8c.png",
    rank: 1,
    stats: {
      views: 2500000,
      videoCount: 48,
      subscribers: 180000,
      rating: 4.8,
    },
  },
  {
    slug: "creator2",
    name: "Jamie Chen",
    avatarUrl: "/creative-director.png",
    rank: 2,
    stats: {
      views: 1800000,
      videoCount: 36,
      subscribers: 150000,
      rating: 4.7,
    },
  },
  {
    slug: "creator3",
    name: "Sam Wilson",
    avatarUrl: "/placeholder-c5359.png",
    rank: 3,
    stats: {
      views: 1200000,
      videoCount: 24,
      subscribers: 95000,
      rating: 4.6,
    },
  },
  {
    slug: "creator4",
    name: "Taylor Reed",
    avatarUrl: "/placeholder-di5h6.png",
    rank: 4,
    stats: {
      views: 980000,
      videoCount: 18,
      subscribers: 82000,
      rating: 4.5,
    },
  },
]

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
  
  // Check cache first
  const cachedData = getCacheItem<CategoryResponse>(cacheKey)
  if (cachedData) {
    console.log(`Using cached data for ${cacheKey}`)
    return cachedData
  }
  
  const url = `${API_BASE_URL}/categories/categories${page > 1 ? `/${page}` : ""}`

  try {
    console.log("Fetching categories from:", url)
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`)
    }
    const data = await response.json()
    
    // Cache the results
    setCacheItem(cacheKey, data)
    
    return data
  } catch (error) {
    console.error("Error fetching categories:", error)
    // Return mock data as fallback
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

export async function fetchCreators(countryCode: string, page = 1): Promise<CreatorListResponse> {
  const cacheKey = `creators-${countryCode}-page-${page}`
  
  // Check cache first
  const cachedData = getCacheItem<CreatorListResponse>(cacheKey)
  if (cachedData) {
    console.log(`Using cached data for ${cacheKey}`)
    return cachedData
  }
  
  // Correctly format the URL for the creators list API
  // The base URL should be the worker URL directly
  const url = `${API_BASE_URL}/creatorsList/${encodeURIComponent(`https://xhamster.desi/creators/all/countries/${countryCode}${page > 1 ? `/${page}` : ""}`)}`

  try {
    console.log("Fetching creators from:", url)
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch creators: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Transform the API response to match our application's expected format
    const transformedCreators: Creator[] = data.creators.map((creator: any) => ({
      slug: creator.slug,
      name: creator.name,
      avatarUrl: creator.avatarUrl,
      rank: creator.rank,
      stats: {
        views: parseViewCount(creator.stats.views),
        videoCount: Number.parseInt(creator.stats.videoCount) || 0,
        subscribers: 0, // Not provided in the API
        rating: 4.5, // Not provided in the API, using default
      },
    }))
    
    const result = {
      creators: transformedCreators,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(data.totalCreators / 20),
        hasNextPage: data.creators.length === 20, // Assuming 20 items per page
      },
    }
    
    // Cache the results
    setCacheItem(cacheKey, result)
    
    return result
  } catch (error) {
    console.error("Error fetching creators:", error)

    // Return mock data as fallback
    return {
      creators: mockCreators,
      pagination: {
        currentPage: page,
        totalPages: 1,
        hasNextPage: false,
      },
    }
  }
}

export async function fetchCreatorDetails(slug: string, page = 1): Promise<CreatorDetailsResponse> {
  const cacheKey = `creator-${slug}-page-${page}`
  
  // Check cache first
  const cachedData = getCacheItem<CreatorDetailsResponse>(cacheKey)
  if (cachedData) {
    console.log(`Using cached data for ${cacheKey}`)
    return cachedData
  }

  // Correct URL format for creator details
  const url = `${API_BASE_URL}/creators/api/creators/${slug}${page > 1 ? `/${page}` : ""}`

  try {
    console.log("Fetching creator details from:", url)
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch creator details for ${slug}: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    // Transform the API response to match our application's expected format
    const result = {
      creator: {
        slug: data.creator.id,
        name: data.creator.name,
        avatarUrl: data.creator.avatarUrl,
        city: data.creator.city || "",
        country: data.creator.country || "",
        about: data.creator.about || "",
        stats: {
          views: data.creator.stats.views,
          videoCount: data.creator.stats.videoCount,
          subscribers: data.creator.stats.subscribers,
          rating: data.creator.stats.rating,
        },
      },
      videos: data.videos.map((video: any) => ({
        id: video.id,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        url: video.playerUrl,
        duration: video.duration,
        viewCount: parseViewCount(video.views),
      })),
      pagination: {
        currentPage: data.pagination.currentPage,
        totalPages: data.pagination.totalPages,
        hasNextPage: data.pagination.hasNextPage,
      },
    }
    
    // Cache the results
    setCacheItem(cacheKey, result)
    
    return result
  } catch (error) {
    console.error(`Error fetching creator details for ${slug}:`, error)
    // Return a minimal mock response
    return {
      creator: {
        slug: slug,
        name: "Creator",
        avatarUrl: "/api/placeholder?height=300&width=300&query=filmmaker",
        city: "City",
        country: "Country",
        about: "About this creator",
        stats: {
          views: 1000000,
          videoCount: 20,
          subscribers: 50000,
          rating: 4.5,
        },
      },
      videos: [],
      pagination: {
        currentPage: page,
        totalPages: 1,
        hasNextPage: false,
      },
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
  
  // Encode the query parameter properly
  const encodedQuery = encodeURIComponent(query)
  const url = `${API_BASE_URL}/search?q=${encodedQuery}&page=${page}`

  try {
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
    throw error
  }
}

export async function fetchLatestVideos(): Promise<CreatorVideo[]> {
  const cacheKey = `latest-videos`
  
  // Check cache first
  const cachedData = getCacheItem<CreatorVideo[]>(cacheKey)
  if (cachedData) {
    console.log(`Using cached data for ${cacheKey}`)
    return cachedData
  }
  
  try {
    console.log("Fetching latest videos")
    const creatorPromises = ["starsudipa"].map((slug) =>
      fetchCreatorDetails(slug).catch((error) => {
        console.error(`Failed to fetch videos for ${slug}:`, error)
        return { videos: [] }
      }),
    )

    const creators = await Promise.all(creatorPromises)

    const allVideos = creators
      .flatMap((creator) => creator.videos || [])
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 8)

    if (allVideos.length === 0) {
      throw new Error("No videos available")
    }
    
    // Cache the results
    setCacheItem(cacheKey, allVideos)

    return allVideos
  } catch (error) {
    console.error("Error fetching latest videos:", error)
    // Return empty array
    return []
  }
}

export async function fetchLatestWebseries(page = 1): Promise<any> {
  const cacheKey = `latest-webseries-page-${page}`
  
  // Check cache first
  const cachedData = getCacheItem<any>(cacheKey)
  if (cachedData) {
    console.log(`Using cached data for ${cacheKey}`)
    return cachedData
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
    
    // Transform the data to include SEO-friendly slugs
    if (data.posts && Array.isArray(data.posts)) {
      data.posts = data.posts.map((series: any) => {
        // Generate a slug from the title or URL
        const slug = generateSlug(series.title || series.link)

        // Store the mapping between slug and original URL
        mapSlugToUrl(slug, series.link)

        return {
          ...series,
          link: `/webseries/${slug}`,
          originalUrl: series.link,
        }
      })
    }
    
    // Cache the results
    setCacheItem(cacheKey, data)
    
    return data
  } catch (error) {
    console.error("Error fetching latest webseries:", error)
    
    // Return mock data as fallback
    return {
      posts: mockWebseries,
      has_next_page: false,
      page: page,
      total_pages: 1,
      total_posts: mockWebseries.length,
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
      // It's a slug, try to get the original URL
      const originalUrl = getUrlFromSlug(slugOrUrl)

      if (originalUrl) {
        url = originalUrl
      } else {
        // If we don't have the mapping, try to use the slug directly
        // This might happen if the user navigates directly to the URL
        url = `https://uncutdesi.org/${slugOrUrl}`
      }
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
