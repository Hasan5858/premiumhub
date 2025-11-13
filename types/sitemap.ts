export interface SitemapMetadata {
  last_updated: string
  created_at: string
  total_urls: number
  total_categories: number
  total_tags: number
  total_providers: number
  total_videos: number
  total_webseries: number
  growth_rate_daily: string
  file_size_mb: number
  max_file_size_mb: number
}

export interface SitemapCategory {
  provider: string
  name: string
  url: string
  added_at: string
  post_count: number
  priority: number
  changefreq: string
}

export interface SitemapVideo {
  title: string
  provider: string
  category: string
  url: string
  thumbnail: string
  added_at: string
  views: number
  priority: number
  changefreq: string
  duration?: string
}

export interface SitemapTag {
  name: string
  providers: string[]
  post_count: number
  url: string
  added_at: string
  priority: number
  changefreq: string
}

export interface SitemapProvider {
  name: string
  url: string
  categories: string[]
  added_at: string
  priority: number
}

export interface SitemapWebseries {
  title: string
  provider: string
  url: string
  thumbnail: string
  added_at: string
  priority: number
  changefreq: string
}

export interface SitemapData {
  metadata: SitemapMetadata
  structure: {
    categories: Record<string, SitemapCategory>
    providers: Record<string, SitemapProvider>
    videos: Record<string, SitemapVideo>
    tags: Record<string, SitemapTag>
    webseries: Record<string, SitemapWebseries>
  }
}

export interface PageToTrack {
  type: 'category' | 'video' | 'tag' | 'provider' | 'webseries'
  data: {
    slug?: string
    title?: string
    provider?: string
    url: string
    thumbnail?: string
    views?: number
    duration?: string
    post_count?: number
    category?: string
    categories?: string[]
    [key: string]: any
  }
}
