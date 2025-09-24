"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import Link from "next/link"
import { Play, Clock, ChevronLeft, ChevronRight } from "lucide-react"
import { fetchLatestWebseries } from "@/services/api"
import { useNavigation } from "@/contexts/NavigationContext"
import { hasCacheItem } from "@/services/cache"
import type { WebseriesPost } from "@/types"

export default function WebseriesPage() {
  const router = useRouter()
  const { page } = router.query
  const [webseries, setWebseries] = useState<WebseriesPost[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { navigationState, setWebseriesPage } = useNavigation()
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)

  // Set initial page from URL or navigation state
  useEffect(() => {
    if (router.isReady) {
      let initialPage = 1
      
      // First priority: URL parameter
      if (page && !Array.isArray(page)) {
        const pageNum = parseInt(page, 10)
        if (!isNaN(pageNum) && pageNum > 0) {
          initialPage = pageNum
        }
      } 
      // Second priority: navigation state
      else if (navigationState.webseriesPage > 1) {
        initialPage = navigationState.webseriesPage
      }
      
      setCurrentPage(initialPage)
    }
  }, [router.isReady, page, navigationState.webseriesPage])

  const loadWebseries = async (page: number) => {
    // Check if we have cached data before showing loading indicator
    const hasWebseriesCache = hasCacheItem(`latest-webseries-page-${page}`);
    
    if (!hasWebseriesCache) {
      setLoading(true);
    }
    
    try {
      setError(null)

      const data = await fetchLatestWebseries(page)

      setWebseries(data.posts)
      setCurrentPage(data.page || page)
      setTotalPages(data.total_pages || 1)
      setHasNextPage(data.has_next_page || false)
      
      // Save the current page to the navigation context
      setWebseriesPage(page)
    } catch (err) {
      console.error("Error loading webseries:", err)
      setError("Failed to load webseries. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentPage > 0) {
      loadWebseries(currentPage)
      
      // Update URL when page changes
      if (router.isReady && currentPage > 1) {
        router.push(`/webseries?page=${currentPage}`, undefined, { shallow: true })
      } else if (router.isReady && currentPage === 1 && router.query.page) {
        router.push('/webseries', undefined, { shallow: true })
      }
    }
  }, [currentPage, router.isReady])

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // When clicking on a webseries, we make sure the current page is saved
  const handleWebseriesClick = () => {
    setWebseriesPage(currentPage)
  }

  return (
    <>
      <Head>
        <title>Latest Webseries - PremiumHUB</title>
        <meta name="description" content="Watch the latest webseries on PremiumHUB." />
      </Head>

      <div className="pb-10">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <span className="w-1.5 h-8 bg-purple-500 rounded-full inline-block mr-3"></span>
              Latest Webseries
            </h1>
            <p className="text-gray-400 ml-4">Discover the newest and hottest webseries</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded mb-6">{error}</div>
          )}

          {/* Webseries grid */}
          {loading && webseries.length === 0 ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : webseries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 mb-8">
              {webseries.map((series) => (
                <Link
                  key={series.id}
                  href={series.link}
                  onClick={handleWebseriesClick}
                  className="group flex flex-col bg-gray-800/40 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-black/30 hover:shadow-purple-900/20"
                >
                  <div className="aspect-video relative">
                    <img
                      src={series.thumbnail || "/api/placeholder?height=400&width=600&query=webseries"}
                      alt={series.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 brightness-95"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.onerror = null
                        target.src = "/api/placeholder?height=400&width=600&query=webseries"
                      }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />

                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="w-14 h-14 bg-purple-600/90 backdrop-blur-sm rounded-full flex items-center justify-center transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg shadow-purple-600/30">
                        <Play className="w-7 h-7 text-white fill-current ml-1" />
                      </div>
                    </div>

                    {/* Quality badge */}
                    {series.quality && (
                      <div className="absolute top-3 left-3 bg-purple-600/90 text-white text-xs px-2.5 py-1 rounded-md shadow-md backdrop-blur-sm">
                        {series.quality}
                      </div>
                    )}

                    {/* Duration badge */}
                    <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full flex items-center shadow-lg border border-white/10">
                      <Clock size={12} className="mr-1" />
                      {series.duration}
                    </div>
                  </div>
                     
                  <div className="p-3 flex-grow flex flex-col">
                    <h3 className="font-medium text-white line-clamp-2 group-hover:text-purple-300 transition-colors">
                      {series.title}
                    </h3>

                    <div className="flex items-center mt-2 text-xs text-gray-300">
                      {series.quality && (
                        <span className="bg-purple-600/80 text-white px-2 py-0.5 rounded-md text-xs">
                          {series.quality}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700/50 backdrop-blur-sm">
              <h3 className="text-xl font-medium text-gray-400">No webseries available</h3>
              <p className="text-gray-500 mt-2">Check back later for new content.</p>
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
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasNextPage || loading}
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
