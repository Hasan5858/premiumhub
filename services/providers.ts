// Provider service for managing multiple scraping providers

export interface ProviderVideo {
  title: string
  thumbnail_url: string
  duration: string
  url?: string
  id?: string
  quality?: string
  views?: string
  provider: string
}

export interface ProviderVideoDetails {
  title: string
  description?: string
  thumbnail_url: string
  duration: string
  video_url?: string
  embed_url?: string
  tags?: string[]
  views?: string
  upload_date?: string
  category?: string
  provider: string
}

export interface ProviderCategory {
  name: string
  url: string
  count?: number
  provider: string
}

export interface ProviderResponse<T> {
  success: boolean
  data: T[]
  total: number
  provider: string
  timestamp: string
}

// Provider configuration
const PROVIDERS = {
  indianpornhq: {
    name: 'IndianPornHQ',
    baseUrl: '/api/providers/indianpornhq',
    endpoints: {
      videos: '/videos',
      categories: '/categories',
      search: '/search',
      video: '/video'
    }
  },
  fsiblog5: {
    name: 'FSIBlog5',
    baseUrl: '/api/providers/fsiblog5',
    endpoints: {
      videos: '/videos',
      categories: '/category-videos',
      search: '/search',
      video: '/video-by-slug'
    }
  }
}

export class ProviderManager {
  private static instance: ProviderManager
  private providers = PROVIDERS

  static getInstance(): ProviderManager {
    if (!ProviderManager.instance) {
      ProviderManager.instance = new ProviderManager()
    }
    return ProviderManager.instance
  }

  /**
   * Get all available providers
   */
  getProviders() {
    return this.providers
  }

  /**
   * Get videos from a specific provider
   */
  async getVideos(provider: string, pageType: string = 'homepage'): Promise<ProviderResponse<ProviderVideo>> {
    const providerConfig = this.providers[provider as keyof typeof this.providers]
    if (!providerConfig) {
      throw new Error(`Provider ${provider} not found`)
    }

    // Get the base URL for the current environment
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    const url = `${baseUrl}${providerConfig.baseUrl}${providerConfig.endpoints.videos}?page=${pageType}`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch videos from ${provider}`)
    }

    const data = await response.json()
    return {
      ...data,
      data: data.data.map((video: any) => ({
        ...video,
        provider
      }))
    }
  }

  /**
   * Get video details from a specific provider
   */
  async getVideoDetails(provider: string, videoId: string): Promise<ProviderVideoDetails> {
    const providerConfig = this.providers[provider as keyof typeof this.providers]
    if (!providerConfig) {
      throw new Error(`Provider ${provider} not found`)
    }

    // Get the base URL for the current environment
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    // URL encode the video ID to handle special characters
    const encodedVideoId = encodeURIComponent(videoId)
    const response = await fetch(`${baseUrl}${providerConfig.baseUrl}${providerConfig.endpoints.video}/${encodedVideoId}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch video details from ${provider}`)
    }

    const data = await response.json()
    return {
      ...data.data,
      provider
    }
  }

  /**
   * Search videos across a specific provider
   */
  async searchVideos(provider: string, query: string, page = 1): Promise<ProviderResponse<ProviderVideo>> {
    const providerConfig = this.providers[provider as keyof typeof this.providers]
    if (!providerConfig) {
      throw new Error(`Provider ${provider} not found`)
    }

    // Get the base URL for the current environment
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    const response = await fetch(`${baseUrl}${providerConfig.baseUrl}${providerConfig.endpoints.search}?q=${encodeURIComponent(query)}&page=${page}`)
    if (!response.ok) {
      throw new Error(`Failed to search videos from ${provider}`)
    }

    const data = await response.json()
    return {
      ...data,
      data: data.data.map((video: any) => ({
        ...video,
        provider
      }))
    }
  }

  /**
   * Get categories from a specific provider
   */
  async getCategories(provider: string): Promise<ProviderResponse<ProviderCategory>> {
    const providerConfig = this.providers[provider as keyof typeof this.providers]
    if (!providerConfig) {
      throw new Error(`Provider ${provider} not found`)
    }

    // Get the base URL for the current environment
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    const response = await fetch(`${baseUrl}${providerConfig.baseUrl}${providerConfig.endpoints.categories}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch categories from ${provider}`)
    }

    const data = await response.json()
    return {
      ...data,
      data: data.data.map((category: any) => ({
        ...category,
        provider
      }))
    }
  }

  /**
   * Get videos from all providers
   */
  async getAllVideos(): Promise<ProviderResponse<ProviderVideo>> {
    const allVideos: ProviderVideo[] = []
    const errors: string[] = []

    for (const provider of Object.keys(this.providers)) {
      try {
        const result = await this.getVideos(provider)
        allVideos.push(...result.data)
      } catch (error) {
        errors.push(`${provider}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return {
      success: true,
      data: allVideos,
      total: allVideos.length,
      provider: 'all',
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Search videos across all providers
   */
  async searchAllVideos(query: string, page = 1): Promise<ProviderResponse<ProviderVideo>> {
    const allVideos: ProviderVideo[] = []
    const errors: string[] = []

    for (const provider of Object.keys(this.providers)) {
      try {
        const result = await this.searchVideos(provider, query, page)
        allVideos.push(...result.data)
      } catch (error) {
        errors.push(`${provider}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return {
      success: true,
      data: allVideos,
      total: allVideos.length,
      provider: 'all',
      timestamp: new Date().toISOString()
    }
  }
}

// Export singleton instance
export const providerManager = ProviderManager.getInstance()
