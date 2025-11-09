/**
 * Get the base URL for internal API calls
 * This handles both local development and production (Vercel) environments
 */
export function getBaseUrl(): string {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  // Check for Vercel environment variable
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // Check for custom base URL
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }

  // Fallback to localhost for local development
  return 'http://localhost:3000'
}

/**
 * Build a full URL for an internal API endpoint
 * @param path - The API path (e.g., '/api/providers/indianpornhq/videos')
 */
export function getApiUrl(path: string): string {
  const baseUrl = getBaseUrl()
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${cleanPath}`
}
