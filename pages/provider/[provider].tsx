"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import * as React from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import Link from "next/link"
import { Play, Clock, ChevronLeft, ChevronRight, TrendingUp, Star } from "lucide-react"
import { fetchIndianPornHQVideos, fetchIndianPornHQCategoryVideos } from "@/services/api"
import { useNavigation } from "@/contexts/NavigationContext"
import { hasCacheItem } from "@/services/cache"
import PremiumBadge from "@/components/PremiumBadge"
import { useAuth } from "@/contexts/AuthContext"

export default function ProviderPage() {
  const router = useRouter()
  const { provider } = router.query
  const { navigationState, setProviderPage } = useNavigation()
  const { user } = useAuth()

  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(5) // 5 different page types
  const [hasNextPage, setHasNextPage] = useState(true)
  const [pageTypes] = useState([
    { type: 'homepage', name: 'Latest Videos' },
    { type: 'longest', name: 'Longest Videos' },
    { type: 'newest', name: 'Newest Videos' },
    { type: 'trending', name: 'Trending Videos' },
    { type: 'popular', name: 'Popular Videos' }
  ])
  
  // Category state - categories don't have pagination, only page 1 videos
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Check if user has premium access
  const hasPremiumAccess =
    user &&
    (user.membership_status === "monthly" ||
      user.membership_status === "3month" ||
      user.membership_status === "halfyearly" ||
      user.membership_status === "yearly" ||
      user.membership_status === "admin")

  // Track if we've initialized the page and last category loaded
  const initializedRef = React.useRef<boolean>(false)
  const lastCategoryRef = React.useRef<string | null>(null)
  const isLoadingCategoryRef = React.useRef<boolean>(false)
  
  const loadCategoryVideos = useCallback(async (categoryUrl: string) => {
    // Set flag immediately to prevent regular video loading
    isLoadingCategoryRef.current = true
    
    // Check if we have cached data before showing loading indicator
    const hasVideosCache = hasCacheItem(`indianpornhq-category-${encodeURIComponent(categoryUrl)}`);
    
    if (!hasVideosCache) {
      setLoading(true);
    }
    
    try {
      setError(null)
      // Set category first to prevent regular page loading
      setSelectedCategory(categoryUrl)

      console.log(`Fetching videos from IndianPornHQ category: ${categoryUrl} (no pagination - page 1 only)`)
      const data = await fetchIndianPornHQCategoryVideos(categoryUrl)

      if (data && data.data) {
        setVideos(data.data || [])
        // Categories don't have pagination - always 1 page, no next page
        setTotalPages(1)
        setHasNextPage(false)
      }
      
      // Extract slug from category URL for cleaner URLs
      const urlParts = categoryUrl.split('/').filter((p: string) => p && p.length > 0)
      const categorySlug = urlParts[urlParts.length - 1] || ''
      
      // Update URL with category slug (no page parameter needed - no pagination)
      const currentUrl = router.asPath
      const expectedUrl = `/provider/${provider}?cat=${categorySlug}`
      
      if (!currentUrl.includes(`cat=${categorySlug}`)) {
        router.push(expectedUrl, undefined, { shallow: true })
      }
    } catch (err) {
      console.error("Error loading category videos:", err)
      setError("Failed to load category videos. Please try again later.")
      setVideos([])
      isLoadingCategoryRef.current = false
    } finally {
      setLoading(false)
      // Keep flag set - category is still selected
      isLoadingCategoryRef.current = true
    }
  }, [provider, router])

  // Set initial page from URL or navigation state
  useEffect(() => {
    if (!router.isReady) return
    
    // Check if category is specified in URL (support both old 'category' and new 'cat' param)
    const categorySlug = router.query.cat || router.query.category
    
    if (categorySlug && typeof categorySlug === 'string') {
      // Convert slug to full URL
      let categoryUrl: string
      if (categorySlug.startsWith('http')) {
        // Old format - full URL
        categoryUrl = decodeURIComponent(categorySlug)
      } else {
        // New format - slug, convert to full URL
        categoryUrl = `https://www.indianpornhq.com/${categorySlug}/`
      }
      
      // Check if this is a new category (no pagination, so just check URL)
      if (lastCategoryRef.current !== categoryUrl) {
        console.log('Category detected in URL:', categorySlug, '(no pagination - page 1 only)')
        
        // Set flag immediately to prevent regular video loading
        isLoadingCategoryRef.current = true
        
        // Set category state immediately to prevent regular video loading
        setSelectedCategory(categoryUrl)
        // Reset currentPage to 0 to prevent regular video loading from triggering
        setCurrentPage(0)
        
        // Track this category load
        lastCategoryRef.current = categoryUrl
        initializedRef.current = true
        
        // Load category videos immediately (always page 1 - no pagination)
        loadCategoryVideos(categoryUrl)
          .catch((err) => {
            console.error('Error loading category videos:', err)
          })
      }
      return
    }
    
    // No category - check if we were viewing a category before, if so reset
    if (lastCategoryRef.current !== null) {
      lastCategoryRef.current = null
      setSelectedCategory(null)
      isLoadingCategoryRef.current = false
      initializedRef.current = false
    }
    
    // Only proceed with regular page loading if no category and not initialized
    if (!initializedRef.current) {
      let initialPage = 1
      
      // First priority: URL parameter
      if (router.query.page && !Array.isArray(router.query.page)) {
        const pageNum = parseInt(router.query.page, 10)
        if (!isNaN(pageNum) && pageNum > 0 && pageNum <= 5) {
          initialPage = pageNum
        }
      } 
      // Second priority: navigation state (only read once)
      else if (navigationState.providerPage > 1 && navigationState.providerPage <= 5) {
        initialPage = navigationState.providerPage
      }
      
      setCurrentPage(initialPage)
      initializedRef.current = true
    }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [router.isReady, router.query.cat, router.query.category, router.query.page, loadCategoryVideos]) // Include loadCategoryVideos in dependencies

  const loadVideos = useCallback(async (page: number) => {
    // Don't load regular videos if we're currently loading a category
    if (isLoadingCategoryRef.current || selectedCategory) {
      console.log('[Provider] Skipping loadVideos - category is selected')
      return
    }
    
    // Get the page type based on the page number
    const pageType = pageTypes[page - 1]?.type || 'homepage'
    const pageName = pageTypes[page - 1]?.name || 'Latest Videos'
    
    // Check if we have cached data before showing loading indicator
    const hasVideosCache = hasCacheItem(`indianpornhq-videos-${pageType}`);
    
    if (!hasVideosCache) {
      setLoading(true);
    }
    
    try {
      setError(null)
      // Clear selected category when loading page types (only if not in category mode)
      if (!isLoadingCategoryRef.current && !selectedCategory) {
        setSelectedCategory(null)
      }

      console.log(`Fetching videos from IndianPornHQ page: ${pageName}`)
      const data = await fetchIndianPornHQVideos(pageType)

      setVideos(data.data || [])
      setTotalPages(pageTypes.length)
      setHasNextPage(page < pageTypes.length)
      
      // Save to navigation context (setProviderPage already checks if page changed internally)
      setProviderPage(page)
    } catch (err) {
      console.error("Error loading videos:", err)
      setError("Failed to load videos. Please try again later.")
    } finally {
      setLoading(false)
    }
  }, [pageTypes, setProviderPage, selectedCategory])


  // Track the last loaded page to prevent duplicate loads
  const lastLoadedPageRef = React.useRef<number>(0)
  const isLoadingRef = React.useRef<boolean>(false)

  useEffect(() => {
    // Don't load regular videos if we're viewing a category
    // Check both state and ref to avoid race conditions
    if (selectedCategory || isLoadingCategoryRef.current) {
      console.log('[Provider] Skipping regular video load - category is selected')
      return
    }
    
    // Only load if:
    // 1. currentPage is valid (1-5)
    // 2. It's different from what we last loaded
    // 3. We're not currently loading
    // 4. Page has been initialized
    if (
      initializedRef.current &&
      currentPage > 0 && 
      currentPage <= 5 &&
      currentPage !== lastLoadedPageRef.current && 
      !isLoadingRef.current &&
      !isLoadingCategoryRef.current
    ) {
      lastLoadedPageRef.current = currentPage
      isLoadingRef.current = true
      
      loadVideos(currentPage)
        .catch((err) => {
          console.error('Error in loadVideos:', err)
        })
        .finally(() => {
          isLoadingRef.current = false
        })
    }
  }, [currentPage, loadVideos, selectedCategory])

  // Separate effect for URL updates to avoid conflicts
  // Only update URL, don't read from it to avoid feedback loops
  const urlUpdateRef = React.useRef<boolean>(false)
  
  useEffect(() => {
    if (router.isReady && initializedRef.current && currentPage > 0 && !urlUpdateRef.current) {
      const currentUrlPage = router.query.page ? parseInt(router.query.page as string, 10) : 1
      
      // Only update URL if the current page is different from URL page
      if (currentPage !== currentUrlPage) {
        urlUpdateRef.current = true
        const url = currentPage > 1 
          ? `/provider/${provider}?page=${currentPage}`
          : `/provider/${provider}`
        
        router.push(url, undefined, { shallow: true }).finally(() => {
          // Reset flag after a short delay to allow URL to update
          setTimeout(() => {
            urlUpdateRef.current = false
          }, 100)
        })
      }
    }
  }, [currentPage, router.isReady, provider])

  const handlePageChange = useCallback((page: number) => {
    if (page < 1) return
    
    // Categories don't have pagination - ignore page changes for categories
    if (selectedCategory) {
      return
    }
    
    // Otherwise, change regular page
    if (page > totalPages) return
    
    // Only change page if it's different
    if (page !== currentPage) {
      setCurrentPage(page)
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [currentPage, totalPages, selectedCategory])

  // When clicking on a video, we make sure the current page is saved
  const handleVideoClick = useCallback(() => {
    setProviderPage(currentPage)
  }, [currentPage, setProviderPage])

  const getProviderName = (providerName: string) => {
    const names: Record<string, string> = {
      'indianpornhq': 'IndianPornHQ',
      'desi': 'Desi Provider'
    }
    return names[providerName] || providerName
  }

  return (
    <>
      <Head>
        <title>{getProviderName(provider as string)} - PremiumHUB</title>
        <meta name="description" content={`Browse videos from ${getProviderName(provider as string)} on PremiumHUB.`} />
      </Head>

      <div className="pb-10">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Link
                href="/"
                className="inline-flex items-center text-gray-400 hover:text-white transition-colors mr-4"
              >
                <ChevronLeft size={18} className="mr-1" />
                <span>Back to Home</span>
              </Link>
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <span className="w-1.5 h-8 bg-purple-500 rounded-full inline-block mr-3"></span>
              {getProviderName(provider as string)}
            </h1>
            <p className="text-gray-400 ml-4">Fresh content updated daily</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded mb-6">{error}</div>
          )}

          {/* Category selection indicator */}
          {selectedCategory && (
            <div className="mb-6 flex items-center justify-between bg-purple-600/20 border border-purple-500/30 rounded-xl px-4 py-3">
              <div className="flex items-center space-x-2">
                <span className="text-purple-300 text-sm">Viewing category:</span>
                <span className="text-white font-semibold">
                  {selectedCategory.split('/').filter((p: string) => p).pop()?.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Category'}
                </span>
              </div>
              <button
                onClick={() => {
                  isLoadingCategoryRef.current = false
                  lastCategoryRef.current = null
                  setSelectedCategory(null)
                  setCurrentPage(1)
                  router.push(`/provider/${provider}`, undefined, { shallow: true })
                  loadVideos(1)
                }}
                className="px-3 py-1.5 text-sm bg-purple-600/50 hover:bg-purple-600/70 text-white rounded-lg transition-colors"
              >
                Clear Category
              </button>
            </div>
          )}

          {/* Videos grid */}
          {loading && videos.length === 0 ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : videos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 mb-8">
              {videos.map((video, index) => {
                // Construct video URL with category info if viewing a category
                let videoUrl = `/provider/${provider}/video/${video.seo_slug || encodeURIComponent(video.id || video.url || `video-${index}`)}`
                if (selectedCategory) {
                  // Extract category slug from category URL
                  const urlParts = selectedCategory.split('/').filter((p: string) => p && p.length > 0)
                  const categorySlug = urlParts[urlParts.length - 1] || ''
                  if (categorySlug) {
                    videoUrl += `?cat=${categorySlug}`
                  }
                }
                
                return (
                <Link
                  key={video.id || index}
                  href={videoUrl}
                  className="group flex flex-col bg-gray-800/40 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-black/30 hover:shadow-purple-900/20"
                >
                  <div className="aspect-video relative">
                    <img
                      src={video.thumbnail_url || "/api/placeholder?height=400&width=600&query=video"}
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 brightness-95"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.onerror = null
                        target.src = "/api/placeholder?height=400&width=600&query=video"
                      }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />

                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="w-14 h-14 bg-purple-600/90 backdrop-blur-sm rounded-full flex items-center justify-center transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg shadow-purple-600/30">
                        <Play className="w-7 h-7 text-white fill-current ml-1" />
                      </div>
                    </div>

                    {/* Premium badge if not premium user */}
                    {!hasPremiumAccess && <PremiumBadge className="top-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-500" />}

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
                      <span className="bg-purple-600/80 text-white px-2 py-0.5 rounded-md text-xs">
                        {getProviderName(provider as string)}
                      </span>
                    </div>
                  </div>
                </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700/50 backdrop-blur-sm">
              <h3 className="text-xl font-medium text-gray-400">No videos available</h3>
              <p className="text-gray-500 mt-2">Check back later for new content.</p>
            </div>
          )}

          {/* Pagination */}
          {selectedCategory ? (
            // Categories don't have pagination - all videos shown on page 1
            null
          ) : totalPages > 1 ? (
            // Regular page type pagination
            <div className="mt-8">
              {/* Page Type Navigation */}
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {pageTypes.map((pageType, index) => (
                  <button
                    key={pageType.type}
                    onClick={() => handlePageChange(index + 1)}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === index + 1
                        ? "bg-purple-600 text-white"
                        : "bg-gray-800/70 text-gray-300 hover:bg-gray-700/80"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {pageType.name}
                  </button>
                ))}
              </div>

              {/* Arrow Navigation */}
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="p-2 rounded-lg bg-gray-800/70 text-white hover:bg-purple-600/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>

                <span className="text-gray-400 text-sm">
                  {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!hasNextPage || loading}
                  className="p-2 rounded-lg bg-gray-800/70 text-white hover:bg-purple-600/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
