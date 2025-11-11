import { useState, useEffect } from "react"
import Head from "next/head"
import { Grid3x3, Search } from "lucide-react"
import { getCacheItem, setCacheItem } from "@/services/cache"
import { useAuth } from "@/contexts/AuthContext"
import { useSidebar } from "@/contexts/SidebarContext"
import CategoryGrid from "@/components/CategoryGrid"

interface ProviderCategory {
  name: string
  url: string
  count?: number
  thumbnail?: string
  provider?: string
  slug?: string
  isEmpty?: boolean
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ProviderCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const categoriesPerPage = 24 // Show 24 categories per page (nice grid layout)
  const { user } = useAuth()
  const { isCollapsed } = useSidebar() // Get sidebar state

  const hasPremiumAccess =
    user &&
    (user.membership_status === "monthly" ||
      user.membership_status === "3month" ||
      user.membership_status === "halfyearly" ||
      user.membership_status === "yearly" ||
      user.membership_status === "admin")

  const loadAllCategories = async () => {
    setLoading(true)
    try {
      setError(null)

      // Ensure cache is initialized (this should be global, not user-specific)
      if (typeof window !== 'undefined') {
        const CACHE_VERSION_KEY = 'cache_version'
        const CACHE_VERSION = 'v2.4.0'
        const storedVersion = localStorage.getItem(CACHE_VERSION_KEY)
        if (!storedVersion) {
          localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION)
          console.log('[Categories] Cache version initialized')
        }

        // Clear old cache entries that might be invalid
        const keys = Object.keys(localStorage)
        const oldCacheKeys = keys.filter(k => 
          (k.includes('category-thumbnail') || k.includes('cat_thumb')) && 
          !k.startsWith('v2_')
        )
        if (oldCacheKeys.length > 0) {
          console.log(`[Categories] Clearing ${oldCacheKeys.length} old cache entries`)
          oldCacheKeys.forEach(key => localStorage.removeItem(key))
        }
      }

      // Fetch categories from all providers using unified API
      const providers = ['fsiblog5', 'indianpornhq', 'superporn', 'kamababa', 'webxseries']
      const allCategoriesPromises = providers.map(async (providerId) => {
        try {
          const apiUrl = `/api/v2/providers/${providerId}/categories`
          console.log(`[Categories] Fetching from ${providerId} at ${apiUrl}...`)
          const response = await fetch(apiUrl, {
            cache: 'no-store', // Disable caching
            headers: {
              'Cache-Control': 'no-cache',
            }
          })
          
          if (!response.ok) {
            console.error(`[Categories] ${providerId} HTTP error:`, response.status, response.statusText)
            return []
          }
          
          const result = await response.json()
          
          console.log(`[Categories] ${providerId} response:`, result.success ? `${result.data?.length || 0} categories` : result.error)
          
          if (!result.success) {
            console.error(`[Categories] ${providerId} API error:`, result.error)
          }
          
          if (result.success && result.data) {
            // Filter out special page types that aren't real categories
            const filteredData = result.data.filter((cat: any) => {
              const name = cat.name?.toLowerCase() || ''
              const slug = cat.slug?.toLowerCase() || ''
              
              // Filter out IndianPornHQ sorting/filter pages
              if (name.includes('longest videos') || name.includes('newest videos')) {
                console.log(`[Categories] Filtering out special page: ${cat.name}`)
                return false
              }
              
              return true
            })
            
            return filteredData.map((cat: any) => ({
              name: cat.name,
              url: cat.url,
              slug: cat.slug,
              count: cat.count,
              provider: providerId,
              thumbnail: cat.thumbnail || undefined // Keep thumbnail if provider returns it
            }))
          }
          return []
        } catch (err) {
          console.error(`[Categories] Error fetching categories from ${providerId}:`, err)
          return []
        }
      })

      const categoriesArrays = await Promise.all(allCategoriesPromises)
      let allCategories: ProviderCategory[] = categoriesArrays.flat()

      console.log(`[Categories] Total categories fetched: ${allCategories.length}`)
      console.log(`[Categories] By provider:`, 
        providers.map(p => `${p}: ${allCategories.filter(c => c.provider === p).length}`).join(', ')
      )

      // Load thumbnails from cache immediately and identify empty categories
      allCategories = allCategories.map(cat => {
        const cacheKey = `v2_${cat.provider}_cat_thumb_${cat.slug || cat.url}`
        const cachedThumbnail = getCacheItem<string>(cacheKey)
        if (cachedThumbnail && cachedThumbnail.startsWith('http')) {
          console.log(`[Categories] ✓ Loaded from cache: ${cat.name}`)
          return { ...cat, thumbnail: cachedThumbnail, isEmpty: false }
        }
        return { ...cat, isEmpty: false }
      })

      // Sort alphabetically
      allCategories.sort((a, b) => a.name.localeCompare(b.name))

      console.log(`[Categories] Setting ${allCategories.length} categories to state`)
      setCategories(allCategories)
      setLoading(false) // Set loading to false AFTER setting categories
      
      // Start fetching thumbnails in background for categories without cached thumbnails
      // This also validates which categories are empty
      fetchCategoryThumbnails(allCategories)
    } catch (err) {
      console.error("Error loading categories:", err)
      setError("Failed to load categories. Please try again later.")
      setLoading(false)
    }
  }

  const fetchCategoryThumbnails = async (categoriesList: ProviderCategory[]) => {
    const batchSize = 5 // Process 5 categories at a time
    const categoriesToFetch = categoriesList.filter(cat => !cat.thumbnail)

    console.log(`[Categories] Starting thumbnail fetch for ${categoriesToFetch.length} categories`)

    for (let i = 0; i < categoriesToFetch.length; i += batchSize) {
      const batch = categoriesToFetch.slice(i, i + batchSize)
      const batchNum = Math.floor(i/batchSize) + 1
      const totalBatches = Math.ceil(categoriesToFetch.length/batchSize)
      
      console.log(`[Categories] Batch ${batchNum}/${totalBatches}: Processing ${batch.map(c => c.name).join(', ')}`)

      const thumbnails = await Promise.allSettled(
        batch.map(async (category) => {
          try {
            const cacheKey = `v2_${category.provider}_cat_thumb_${category.slug || category.url}`
            const CACHE_DURATION = 12 * 60 * 60 * 1000

            // Check cache and validate it's a real URL
            const cachedThumbnail = getCacheItem<string>(cacheKey)
            if (cachedThumbnail && cachedThumbnail.startsWith('http')) {
              console.log(`[Categories] ✓ Cache hit: ${category.name}`)
              return { category, thumbnail: cachedThumbnail }
            } else if (cachedThumbnail) {
              console.log(`[Categories] ⚠ Invalid cache for ${category.name}, refetching...`)
            }

            // Use the slug for FSIBlog, but full URL for IndianPornHQ (which may have complex paths like /indian/longest-videos/)
            let apiSlug: string
            if (category.provider === 'fsiblog5') {
              // FSIBlog uses simple slugs
              apiSlug = category.slug || category.url.split('/').filter((p: string) => p).pop() || category.name
            } else {
              // IndianPornHQ may have complex URL paths that need to be passed as full URLs
              apiSlug = category.url || category.slug || category.name
            }
            const url = `/api/v2/providers/${category.provider}/category/${encodeURIComponent(apiSlug)}`
            
            console.log(`[Categories] → Fetching: ${category.name} from ${url}`)
            
            // Add timeout to prevent hanging requests
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
            
            const response = await fetch(url, { signal: controller.signal })
            clearTimeout(timeoutId)
            
            if (!response.ok) {
              console.error(`[Categories] ✗ HTTP ${response.status}: ${category.name}`)
              return { category, thumbnail: null }
            }
            
            const data = await response.json()

            if (data.success && data.data && data.data.length > 0) {
              const thumbnail = data.data[0].thumbnail
              if (thumbnail && thumbnail.startsWith('http')) {
                console.log(`[Categories] ✓ Success: ${category.name} - ${thumbnail.substring(0, 60)}...`)
                // Only cache successful fetches with valid URLs
                setCacheItem(cacheKey, thumbnail, CACHE_DURATION)
                return { category: { ...category, isEmpty: false }, thumbnail }
              } else {
                console.warn(`[Categories] ⚠ Invalid thumbnail URL for ${category.name}:`, thumbnail)
              }
            } else {
              console.warn(`[Categories] ⚠ No data for ${category.name}:`, data.error || 'Empty response')
              // Mark as empty category if no videos found
              return { category: { ...category, isEmpty: true }, thumbnail: null }
            }

            // Don't cache failures
            return { category: { ...category, isEmpty: true }, thumbnail: null }
          } catch (err) {
            if (err instanceof Error) {
              if (err.name === 'AbortError') {
                console.error(`[Categories] ⏱ Timeout: ${category.name}`)
              } else {
                console.error(`[Categories] ✗ Error (${category.name}):`, err.message)
              }
            }
            // Mark as empty on error
            return { category: { ...category, isEmpty: true }, thumbnail: null }
          }
        })
      )

      // Update state with fetched thumbnails
      setCategories((prev) => {
        const updated = [...prev]
        let updatedCount = 0
        
        thumbnails.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            const categoryIndex = updated.findIndex((c) => 
              (c.slug && c.slug === result.value.category.slug) || c.url === result.value.category.url
            )
            if (categoryIndex !== -1) {
              // Update with thumbnail and isEmpty flag
              if (result.value.thumbnail) {
                updated[categoryIndex] = {
                  ...updated[categoryIndex],
                  thumbnail: result.value.thumbnail,
                  isEmpty: false
                }
                console.log(`[State] ✓ Updated ${updated[categoryIndex].name}: ${result.value.thumbnail.substring(0, 60)}...`)
                updatedCount++
              } else if (result.value.category.isEmpty) {
                // Mark as empty if no thumbnail and isEmpty flag is set
                updated[categoryIndex] = {
                  ...updated[categoryIndex],
                  isEmpty: true
                }
                console.log(`[State] ℹ Marked as empty: ${updated[categoryIndex].name}`)
              }
            } else {
              console.warn(`[State] ⚠ Could not find category in state:`, result.value.category.name)
            }
          }
        })
        
        if (updatedCount > 0) {
          console.log(`[Categories] Updated ${updatedCount}/${batch.length} thumbnails in batch ${batchNum}`)
        } else {
          console.warn(`[Categories] ⚠ No thumbnails updated in batch ${batchNum}`)
        }
        
        return updated
      })

      // Small delay between batches
      if (i + batchSize < categoriesToFetch.length) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
    
    console.log('[Categories] ✓ Completed all thumbnail fetches')
  }

  useEffect(() => {
    loadAllCategories()
  }, [])

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) && !category.isEmpty
  )
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredCategories.length / categoriesPerPage)
  const startIndex = (currentPage - 1) * categoriesPerPage
  const endIndex = startIndex + categoriesPerPage
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex)
  
  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  return (
    <>
      <Head>
        <title>All Categories - PremiumHUB</title>
        <meta name="description" content="Browse all video categories from all providers on PremiumHUB." />
      </Head>

      <div className="pb-10 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="mb-8 pt-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 flex items-center">
              <Grid3x3 className="w-8 h-8 mr-3 text-purple-500" />
              All Categories
            </h1>
            <p className="text-sm sm:text-base text-gray-400 ml-11">
              Browse all categories from FSIBlog, IndianPornHQ, Superporn, KamaBaba, and WebXSeries
              {filteredCategories.length > 0 && ` • ${filteredCategories.length} ${filteredCategories.length === 1 ? 'category' : 'categories'}`}
              {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
            </p>
          </div>

          <div className="mb-8">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 transition-colors"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            
            {searchQuery && (
              <p className="text-gray-400 text-sm mt-2">
                Found {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'}
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          {loading && categories.length === 0 ? (
            <CategoryGrid 
              categories={[]} 
              hasPremiumAccess={hasPremiumAccess}
              loading={true}
              isCollapsed={isCollapsed}
            />
          ) : filteredCategories.length > 0 ? (
            <>
              <CategoryGrid 
                categories={paginatedCategories} 
                hasPremiumAccess={hasPremiumAccess}
                isCollapsed={isCollapsed}
              />
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-8">
                  <button
                    onClick={() => {
                      setCurrentPage(prev => Math.max(1, prev - 1))
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-gray-800/70 text-white hover:bg-purple-600/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                      // Show first 2, last 2, and pages around current
                      const showPage = 
                        pageNum <= 2 || 
                        pageNum >= totalPages - 1 || 
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      
                      if (!showPage && pageNum === 3 && currentPage > 4) {
                        return <span key={pageNum} className="text-gray-500">...</span>
                      }
                      if (!showPage && pageNum === totalPages - 2 && currentPage < totalPages - 3) {
                        return <span key={pageNum} className="text-gray-500">...</span>
                      }
                      if (!showPage) return null

                      return (
                        <button
                          key={pageNum}
                          onClick={() => {
                            setCurrentPage(pageNum)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === pageNum
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-800/70 text-gray-300 hover:bg-gray-700/80'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => {
                      setCurrentPage(prev => Math.min(totalPages, prev + 1))
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    disabled={currentPage >= totalPages}
                    className="p-2 rounded-lg bg-gray-800/70 text-white hover:bg-purple-600/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          ) : (
            <CategoryGrid 
              categories={[]} 
              hasPremiumAccess={hasPremiumAccess}
            />
          )}
        </div>
      </div>
    </>
  )
}
