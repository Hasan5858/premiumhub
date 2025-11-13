import { PageToTrack } from '@/types/sitemap'

/**
 * Track a page in the sitemap (client-side helper)
 * Calls the API route to track the page server-side
 */
export async function trackPage(page: PageToTrack): Promise<void> {
  // Fire and forget - don't block user experience
  fetch('/api/sitemap/track', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(page),
  })
    .then(response => {
      if (response.ok) {
        console.log('[Sitemap] Tracked:', page.type, page.data.slug || page.data.title)
      } else {
        console.warn('[Sitemap] Track failed:', response.status)
      }
    })
    .catch(error => {
      // Silently fail - tracking errors should not affect user experience
      console.debug('[Sitemap] Track error (non-critical):', error)
    })
}
