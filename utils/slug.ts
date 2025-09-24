// In-memory storage for slug to URL mapping
const slugToUrlMap = new Map<string, string>()
const urlToSlugMap = new Map<string, string>()

/**
 * Generates a clean, SEO-friendly slug from a title or URL
 */
export function generateSlug(input: string): string {
  if (!input) return `video-${Math.random().toString(36).substring(2, 10)}`

  // Extract the last part of the URL if it's a URL
  if (input.startsWith("http")) {
    const urlParts = input.split("/")
    input = urlParts[urlParts.length - 1] || input
  }

  // Remove file extension if present
  input = input.replace(/\.[^/.]+$/, "")

  // Replace special characters with spaces
  let slug = input
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ") // Replace non-word chars with spaces
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .trim() // Trim leading/trailing spaces
    .replace(/^-+|-+$/g, "") // Trim hyphens from start and end

  // Ensure the slug isn't too long for URLs
  if (slug.length > 100) {
    slug = slug.substring(0, 100)
  }

  return slug
}

/**
 * Stores a mapping between a slug and its original URL
 */
export function mapSlugToUrl(slug: string, url: string): void {
  slugToUrlMap.set(slug, url)
  urlToSlugMap.set(url, slug)
}

/**
 * Retrieves the original URL for a given slug
 */
export function getUrlFromSlug(slug: string): string | undefined {
  return slugToUrlMap.get(slug)
}

/**
 * Retrieves the slug for a given URL
 */
export function getSlugFromUrl(url: string): string | undefined {
  return urlToSlugMap.get(url)
}

/**
 * Extracts a formatted title from a slug
 */
export function extractTitleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
