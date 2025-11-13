import fs from 'fs'
import path from 'path'
import {
  SitemapData,
  SitemapCategory,
  SitemapVideo,
  SitemapTag,
  SitemapProvider,
  SitemapWebseries,
  PageToTrack,
} from '@/types/sitemap'

const SITEMAP_FILE_PATH = path.join(process.cwd(), 'public', 'data', 'sitemap-data.json')
const MAX_FILE_SIZE_MB = parseInt(process.env.SITEMAP_MAX_FILE_SIZE_MB || '10', 10)
const MAX_VIDEOS_STORED = parseInt(process.env.SITEMAP_MAX_VIDEOS_STORED || '15000', 10)
const AUTO_CLEANUP = process.env.SITEMAP_AUTO_CLEANUP !== 'false'
const CLEANUP_THRESHOLD_MB = parseInt(process.env.SITEMAP_CLEANUP_THRESHOLD_MB || '9', 10)

/**
 * Get empty sitemap structure
 */
function getEmptySitemap(): SitemapData {
  return {
    metadata: {
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString(),
      total_urls: 0,
      total_categories: 0,
      total_tags: 0,
      total_providers: 0,
      total_videos: 0,
      total_webseries: 0,
      growth_rate_daily: '0 URLs/day',
      file_size_mb: 0,
      max_file_size_mb: MAX_FILE_SIZE_MB,
    },
    structure: {
      categories: {},
      providers: {},
      videos: {},
      tags: {},
      webseries: {},
    },
  }
}

/**
 * Read sitemap data from JSON file
 */
function readSitemapData(): SitemapData {
  try {
    // Ensure directory exists
    const dir = path.dirname(SITEMAP_FILE_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // Check if file exists
    if (!fs.existsSync(SITEMAP_FILE_PATH)) {
      return getEmptySitemap()
    }

    const fileContent = fs.readFileSync(SITEMAP_FILE_PATH, 'utf-8')
    return JSON.parse(fileContent) as SitemapData
  } catch (error) {
    console.error('Error reading sitemap data:', error)
    return getEmptySitemap()
  }
}

/**
 * Write sitemap data to JSON file
 */
function writeSitemapData(data: SitemapData): void {
  try {
    // Ensure directory exists
    const dir = path.dirname(SITEMAP_FILE_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // Calculate file size
    const jsonString = JSON.stringify(data, null, 2)
    const fileSizeBytes = Buffer.byteLength(jsonString, 'utf-8')
    data.metadata.file_size_mb = parseFloat((fileSizeBytes / 1024 / 1024).toFixed(2))

    // Write to file
    fs.writeFileSync(SITEMAP_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error writing sitemap data:', error)
  }
}

/**
 * Update metadata counts
 */
function updateMetadata(data: SitemapData): void {
  data.metadata.last_updated = new Date().toISOString()
  data.metadata.total_categories = Object.keys(data.structure.categories).length
  data.metadata.total_providers = Object.keys(data.structure.providers).length
  data.metadata.total_videos = Object.keys(data.structure.videos).length
  data.metadata.total_tags = Object.keys(data.structure.tags).length
  data.metadata.total_webseries = Object.keys(data.structure.webseries).length
  data.metadata.total_urls =
    data.metadata.total_categories +
    data.metadata.total_providers +
    data.metadata.total_videos +
    data.metadata.total_tags +
    data.metadata.total_webseries
}

/**
 * Remove duplicate videos (keep most recent)
 */
function deduplicateVideos(data: SitemapData): void {
  const videos = data.structure.videos
  const videosByUrl = new Map<string, string>()

  // Find duplicates by URL
  for (const [slug, video] of Object.entries(videos)) {
    const existingSlug = videosByUrl.get(video.url)
    if (existingSlug) {
      // Keep the more recent one
      const existingVideo = videos[existingSlug]
      if (new Date(video.added_at) > new Date(existingVideo.added_at)) {
        delete videos[existingSlug]
        videosByUrl.set(video.url, slug)
      } else {
        delete videos[slug]
      }
    } else {
      videosByUrl.set(video.url, slug)
    }
  }
}

/**
 * Limit sitemap size by removing oldest videos
 */
function limitSitemapSize(data: SitemapData): void {
  const fileSizeMB = data.metadata.file_size_mb

  // Check if cleanup is needed
  if (AUTO_CLEANUP && fileSizeMB > CLEANUP_THRESHOLD_MB) {
    console.log(`Sitemap file size (${fileSizeMB}MB) exceeds threshold (${CLEANUP_THRESHOLD_MB}MB). Starting cleanup...`)

    // Remove oldest videos
    const videos = Object.entries(data.structure.videos)
      .sort((a, b) => new Date(b[1].added_at).getTime() - new Date(a[1].added_at).getTime())
      .slice(0, MAX_VIDEOS_STORED)

    data.structure.videos = Object.fromEntries(videos)
    console.log(`Kept ${videos.length} most recent videos`)
  }

  // Final check for video count limit
  const videoCount = Object.keys(data.structure.videos).length
  if (videoCount > MAX_VIDEOS_STORED) {
    const videos = Object.entries(data.structure.videos)
      .sort((a, b) => new Date(b[1].added_at).getTime() - new Date(a[1].added_at).getTime())
      .slice(0, MAX_VIDEOS_STORED)

    data.structure.videos = Object.fromEntries(videos)
  }
}

/**
 * Add category to sitemap
 */
function addCategoryToSitemap(data: SitemapData, page: PageToTrack): void {
  const slug = page.data.slug || ''
  const provider = page.data.provider || 'unknown'

  // Skip if already exists
  if (data.structure.categories[slug]) {
    console.log(`[Sitemap] Category already tracked: ${slug}`)
    return
  }

  const category: SitemapCategory = {
    provider,
    name: page.data.title || slug,
    url: page.data.url,
    added_at: new Date().toISOString(),
    post_count: page.data.post_count || 0,
    priority: 0.9,
    changefreq: 'weekly',
  }

  data.structure.categories[slug] = category
  console.log(`[Sitemap] Added category: ${slug}`)
}

/**
 * Add video to sitemap
 */
function addVideoToSitemap(data: SitemapData, page: PageToTrack): void {
  const slug = page.data.slug || ''

  // Skip if already exists
  if (data.structure.videos[slug]) {
    return
  }

  const video: SitemapVideo = {
    title: page.data.title || slug,
    provider: page.data.provider || 'unknown',
    category: page.data.category || 'uncategorized',
    url: page.data.url,
    thumbnail: page.data.thumbnail || '',
    added_at: new Date().toISOString(),
    views: page.data.views || 0,
    priority: 0.8,
    changefreq: 'never',
    duration: page.data.duration,
  }

  data.structure.videos[slug] = video
  console.log(`[Sitemap] Added video: ${slug}`)
}

/**
 * Add tag to sitemap
 */
function addTagToSitemap(data: SitemapData, page: PageToTrack): void {
  const slug = page.data.slug || ''
  const provider = page.data.provider || 'unknown'

  // If tag exists, add provider to list
  if (data.structure.tags[slug]) {
    if (!data.structure.tags[slug].providers.includes(provider)) {
      data.structure.tags[slug].providers.push(provider)
    }
    return
  }

  const tag: SitemapTag = {
    name: page.data.title || slug,
    providers: [provider],
    post_count: page.data.post_count || 0,
    url: page.data.url,
    added_at: new Date().toISOString(),
    priority: 0.7,
    changefreq: 'weekly',
  }

  data.structure.tags[slug] = tag
  console.log(`Added tag: ${slug}`)
}

/**
 * Add provider to sitemap
 */
function addProviderToSitemap(data: SitemapData, page: PageToTrack): void {
  const slug = page.data.slug || ''

  // If provider exists, merge categories
  if (data.structure.providers[slug]) {
    if (page.data.categories && Array.isArray(page.data.categories)) {
      const existingCategories = data.structure.providers[slug].categories
      const allCategories = [...existingCategories, ...page.data.categories]
      const newCategories = Array.from(new Set(allCategories))
      data.structure.providers[slug].categories = newCategories
    }
    return
  }

  const provider: SitemapProvider = {
    name: page.data.title || slug,
    url: page.data.url,
    categories: page.data.categories || [],
    added_at: new Date().toISOString(),
    priority: 0.85,
  }

  data.structure.providers[slug] = provider
  console.log(`Added provider: ${slug}`)
}

/**
 * Add webseries to sitemap
 */
function addWebseriesToSitemap(data: SitemapData, page: PageToTrack): void {
  const slug = page.data.slug || ''

  // Skip if already exists
  if (data.structure.webseries[slug]) {
    return
  }

  const webseries: SitemapWebseries = {
    title: page.data.title || slug,
    provider: page.data.provider || 'webseries',
    url: page.data.url,
    thumbnail: page.data.thumbnail || '',
    added_at: new Date().toISOString(),
    priority: 0.75,
    changefreq: 'weekly',
  }

  data.structure.webseries[slug] = webseries
}

/**
 * Main function to track page in sitemap
 */
export async function trackPageInSitemap(page: PageToTrack): Promise<void> {
  try {
    // Read current sitemap
    const data = readSitemapData()

    console.log(`[Sitemap] Tracking ${page.type}: ${page.data.slug || page.data.title}`)

    // Add page based on type
    switch (page.type) {
      case 'category':
        addCategoryToSitemap(data, page)
        break
      case 'video':
        addVideoToSitemap(data, page)
        break
      case 'tag':
        addTagToSitemap(data, page)
        break
      case 'provider':
        addProviderToSitemap(data, page)
        break
      case 'webseries':
        addWebseriesToSitemap(data, page)
        break
      default:
        console.warn(`[Sitemap] Unknown page type: ${page.type}`)
        return
    }

    // Deduplicate videos
    deduplicateVideos(data)

    // Update metadata
    updateMetadata(data)

    // Limit size if needed
    limitSitemapSize(data)

    // Write back to file
    writeSitemapData(data)
    
    console.log(`[Sitemap] Total URLs: ${data.metadata.total_urls} (${data.metadata.total_categories} categories, ${data.metadata.total_videos} videos)`)
  } catch (error) {
    console.error('[Sitemap] Error tracking page:', error)
    // Don't throw - tracking should never break user requests
  }
}

/**
 * Get sitemap statistics
 */
export function getSitemapStats(): SitemapData['metadata'] | null {
  try {
    const data = readSitemapData()
    return data.metadata
  } catch (error) {
    console.error('Error getting sitemap stats:', error)
    return null
  }
}
