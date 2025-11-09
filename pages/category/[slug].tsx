import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Clock, Eye } from "lucide-react"
import { fetchCategoryVideos } from "@/services/api"
import { hasCacheItem } from "@/services/cache"
import { useNavigation } from "@/contexts/NavigationContext"
import type { CategoryDetails } from "@/types"

export default function CategoryPage() {
  const router = useRouter()
  const { slug, page } = router.query
  const { navigationState, setCategoryPage } = useNavigation()
  const [categoryData, setCategoryData] = useState<CategoryDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Set initial page from URL or navigation state when component mounts
  useEffect(() => {
    if (router.isReady && slug && typeof slug === "string") {
      let initialPage = 1
      
      // First priority: URL parameter
      if (page && !Array.isArray(page)) {
        const pageNum = parseInt(page, 10)
        if (!isNaN(pageNum) && pageNum > 0) {
          initialPage = pageNum
        }
      } 
      // Second priority: navigation state
      else if (navigationState.categoryPage && 
               Object.prototype.hasOwnProperty.call(navigationState.categoryPage, slug) && 
               navigationState.categoryPage[slug] > 0) {
        initialPage = navigationState.categoryPage[slug]
      }
      
      setCurrentPage(initialPage)
    }
  }, [router.isReady, page, slug, navigationState.categoryPage])

  const loadCategoryData = async (categorySlug: string, pageNum = 1) => {
    if (!categorySlug) return

    // Check if we have cached data before showing loading indicator
    const hasCategoryCache = hasCacheItem(`category-${categorySlug}-page-${pageNum}`);
    
    if (!hasCategoryCache) {
      setLoading(true);
    }
    
    try {
      setError(null)
      const data = await fetchCategoryVideos(categorySlug, pageNum)
      
      setCategoryData(data)

      // Set pagination based on API response
      setCurrentPage(pageNum) // Always use the requested page number
      setTotalPages(data.pagination?.totalPages || 1)
      
      // Save current page in navigation context
      if (typeof categorySlug === "string") {
        setCategoryPage(categorySlug, pageNum)
      }
    } catch (err) {
      console.error("Error loading category data:", err)
      setError("Failed to load category data. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug && typeof slug === "string" && currentPage > 0) {
      loadCategoryData(slug, currentPage)
    }
  }, [slug, currentPage])

  // Separate effect for URL updates
  useEffect(() => {
    if (router.isReady && slug && typeof slug === "string" && currentPage > 0) {
      if (currentPage > 1) {
        router.push(`/category/${slug}?page=${currentPage}`, undefined, { shallow: true })
      } else {
        router.push(`/category/${slug}`, undefined, { shallow: true })
      }
    }
  }, [currentPage, slug, router.isReady])

  const handlePageChange = (pageNum: number) => {
    if (!slug || typeof slug !== "string") return
    if (pageNum < 1 || pageNum > totalPages) return
    
    // Always reload data when changing pages, even if it's the same page
    if (pageNum !== currentPage) {
      setCurrentPage(pageNum)
    } else {
      // If clicking the same page, force reload the data
      loadCategoryData(slug, pageNum)
    }
    
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Format view count for display
  const formatViews = (viewsStr: string) => {
    if (!viewsStr) return "0"
    return viewsStr
  }
  
  // Helper function to get the thumbnail URL
  const getThumbnailUrl = (video: any): string => {
    if (video.thumbnailUrl) return video.thumbnailUrl
    if (video.thumbnail) return video.thumbnail
    return "/api/placeholder?height=300&width=500&query=video%20thumbnail"
  }

  return (
    <>
      <Head>
        <title>{categoryData ? `${categoryData.category.name} - PremiumHUB` : "Category - PremiumHUB"}</title>
        <meta
          name="description"
          content={
            categoryData ? `Watch ${categoryData.category.name} videos on PremiumHUB` : "Watch premium content by category"
          }
        />
      </Head>

      <div className="pb-10">
        <div className="container mx-auto px-4">
          {/* Header */}
          {categoryData && (
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center">
                <span className="w-1 sm:w-1.5 h-6 sm:h-8 bg-purple-500 rounded-full inline-block mr-2 sm:mr-3"></span>
                {categoryData.category.name}
              </h1>
              <p className="text-sm sm:text-base text-gray-400 ml-3 sm:ml-4">
                {categoryData.videos.length} {categoryData.videos.length === 1 ? 'video' : 'videos'}
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded mb-6">{error}</div>
          )}

          {/* Videos grid */}
          {loading && !categoryData ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : categoryData && categoryData.videos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 mb-8">
              {categoryData.videos.map((video) => (
                <Link
                  key={video.id}
                  href={{
                    pathname: `/video/${video.id}`,
                    query: {
                      from: "category",
                      categorySlug: slug,
                      categoryPage: currentPage,
                      videoData: JSON.stringify(video)
                    },
                  }}
                  className="group flex flex-col bg-gray-800/40 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-black/30 hover:shadow-purple-900/20"
                >
                  <div className="aspect-video relative">
                    <img
                      src={getThumbnailUrl(video)}
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 brightness-95"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.onerror = null
                        target.src = "/api/placeholder?height=300&width=500&query=video%20thumbnail"
                      }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />

                    {/* Duration badge */}
                    <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full flex items-center shadow-lg border border-white/10">
                      <Clock size={12} className="mr-1" />
                      {video.duration}
                    </div>
                  </div>

                  <div className="p-3 flex-grow flex flex-col">
                    <h3 className="font-medium text-white line-clamp-2 group-hover:text-purple-300 transition-colors">
                      {video.title}
                    </h3>
                    <div className="flex items-center mt-2 text-xs text-gray-300">
                      <Eye size={12} className="mr-1" />
                      <span>{formatViews(video.views)} views</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700/50 backdrop-blur-sm">
              <h3 className="text-xl font-medium text-gray-400">No videos found</h3>
              <p className="text-gray-500 mt-2">Try another category or check back later.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="p-2 rounded-lg bg-gray-800/70 text-white hover:bg-purple-600/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show pages around current page
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  // Ensure pageNum is valid
                  if (pageNum < 1 || pageNum > totalPages) return null

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      className={`w-10 h-10 rounded-lg ${
                        currentPage === pageNum
                          ? "bg-purple-600 text-white"
                          : "bg-gray-800/70 text-white hover:bg-gray-700/80"
                      } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                    >
                      {pageNum}
                    </button>
                  )
                })}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="text-gray-500">...</span>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={loading}
                      className="w-10 h-10 rounded-lg bg-gray-800/70 text-white hover:bg-gray-700/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                {/* Always show page 1 if not already visible and we're not on first few pages */}
                {totalPages > 5 && currentPage > 3 && (
                  <>
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={loading}
                      className="w-10 h-10 rounded-lg bg-gray-800/70 text-white hover:bg-gray-700/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      1
                    </button>
                    <span className="text-gray-500">...</span>
                  </>
                )}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
                className="p-2 rounded-lg bg-gray-800/70 text-white hover:bg-purple-600/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
