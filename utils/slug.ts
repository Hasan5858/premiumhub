/**
 * Generate SEO-friendly slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100) // Limit length for SEO
}

/**
 * Generate a clean video ID for slug generation
 */
export function cleanVideoId(videoId: string): string {
  // Remove special characters and keep only alphanumeric
  return videoId
    .replace(/[^\w]/g, '') // Keep only alphanumeric characters
    .substring(0, 12) // Limit length
}

/**
 * Generate unique video slug with ID fallback
 */
export function generateVideoSlug(title: string, videoId: string, provider: string, index?: number): string {
  const baseSlug = generateSlug(title)
  // Use index if provided, otherwise create a hash
  const idSuffix = index !== undefined ? index.toString() : btoa(videoId).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8)
  return `${baseSlug}-${provider}-${idSuffix}`
}

/**
 * Extract video ID from slug
 */
export function extractVideoIdFromSlug(slug: string): string | null {
  const parts = slug.split('-')
  if (parts.length >= 3) {
    // Last part should be the cleaned ID
    return parts[parts.length - 1]
  }
  return null
}

/**
 * Map cleaned ID back to original ID
 */
export function mapCleanedIdToOriginal(cleanedId: string, originalId: string): string {
  // If the cleaned ID is a substring of the original, return original
  if (originalId.includes(cleanedId)) {
    return originalId
  }
  return cleanedId
}

/**
 * Generate fallback slug when title is not available
 */
export function generateFallbackSlug(videoId: string, provider: string): string {
  const shortId = videoId.substring(0, 8)
  return `video-${provider}-${shortId}`
}