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
import { useSidebar } from "@/contexts/SidebarContext"

export default function ProviderPage() {
  const router = useRouter()
  const { provider } = router.query
  const providerName = typeof provider === 'string' ? provider : 'indianpornhq'
  const { navigationState, setProviderPage, setProviderScrollPosition } = useNavigation()
  const { user } = useAuth()
  const { isCollapsed } = useSidebar()

  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(5) // 5 different page types for IndianPornHQ, dynamic for FSIBlog
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
  
  // Categories display state for Superporn
  const [categories, setCategories] = useState<any[]>([])
  const [showCategories, setShowCategories] = useState(false)
  const [categoryPage, setCategoryPage] = useState(1)
  const categoriesPerPage = 20

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
  const hasCheckedInitialUrl = React.useRef<boolean>(false)
  
  const loadCategoryVideos = useCallback(async (categoryUrl: string, pageNum: number = 1) => {
    // Set flag immediately to prevent regular video loading
    isLoadingCategoryRef.current = true
    
    // Check if we have cached data before showing loading indicator
    const cacheKey = `${providerName}-category-${encodeURIComponent(categoryUrl)}-page-${pageNum}`;
    const hasVideosCache = hasCacheItem(cacheKey);
    
    if (!hasVideosCache) {
      setLoading(true);
    }
    
    try {
      setError(null)
      // Set category first to prevent regular page loading
      setSelectedCategory(categoryUrl)

      console.log(`Fetching videos from ${providerName} category: ${categoryUrl} (page ${pageNum})`)
      
      let data;
      if (providerName === 'fsiblog5') {
        // Fetch FSIBlog category videos with pagination
        const categorySlug = categoryUrl.split('/').filter((p: string) => p && p.length > 0).pop() || ''
        const response = await fetch(`/api/v2/providers/fsiblog5/category/${categorySlug}?page=${pageNum}`)
        data = await response.json()
      } else if (providerName === 'superporn') {
        // Fetch Superporn category videos directly from API proxy (same as /category/[slug] page)
        const categorySlug = categoryUrl.split('/').filter((p: string) => p && p.length > 0).pop() || ''
        const response = await fetch(`/api/proxy/categories/${categorySlug}${pageNum > 1 ? `/${pageNum}` : ''}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch Superporn category videos: ${response.status}`)
        }
        data = await response.json()
      } else {
        // Fetch IndianPornHQ category videos (no pagination support)
        data = await fetchIndianPornHQCategoryVideos(categoryUrl)
      }

      if (data && (data.data || data.videos)) {
        const videoList = data.videos || data.data || []
        setVideos(videoList)
        
        // FSIBlog and Superporn categories have pagination, IndianPornHQ don't
        if (providerName === 'fsiblog5') {
          setTotalPages(10) // FSIBlog supports up to 10 pages per category
          setHasNextPage(pageNum < 10 && videoList.length > 0)
          setCurrentPage(pageNum)
        } else if (providerName === 'superporn') {
          setTotalPages(20) // Superporn supports up to 20 pages per category
          setHasNextPage(data.pagination?.hasNextPage || (pageNum < 20 && videoList.length > 0))
          setCurrentPage(pageNum)
        } else {
          // IndianPornHQ categories don't have pagination
          setTotalPages(1)
          setHasNextPage(false)
          setCurrentPage(1)
        }
      }
      
      // Don't update URL here - the URL is already correct from navigation
      // Updating it causes unnecessary re-renders and can cause redirect issues
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
  }, [provider, providerName, router])

  // Load categories for Superporn when no category is selected
  useEffect(() => {
    if (!router.isReady) return
    
    // For Superporn, check if we need to show categories
    const categorySlug = router.query.cat || router.query.category
    
    if (providerName === 'superporn' && !categorySlug) {
      setShowCategories(true)
      
      // Fetch categories if not already loaded
      if (categories.length === 0 && !loading) {
        const fetchCategories = async () => {
          setLoading(true)
          try {
            const response = await fetch('/api/v2/providers/superporn/categories')
            const data = await response.json()
            
            if (data.success && data.data) {
              setCategories(data.data)
            }
          } catch (err) {
            console.error('Error loading Superporn categories:', err)
            setError('Failed to load categories. Please try again later.')
          } finally {
            setLoading(false)
          }
        }
        
        fetchCategories()
      }
      return
    } else {
      setShowCategories(false)
    }
  }, [router.isReady, router.query.cat, router.query.category, providerName, categories.length, loading])
  
  // Set initial page from URL or navigation state
  useEffect(() => {
    if (!router.isReady) return
    
    // Check if category is specified in URL (support both old 'category' and new 'cat' param)
    const categorySlug = router.query.cat || router.query.category
    
    if (categorySlug && typeof categorySlug === 'string') {
      // Get page number from URL (default to 1)
      let pageNum = 1
      if (router.query.page && !Array.isArray(router.query.page)) {
        const parsedPage = parseInt(router.query.page, 10)
        if (!isNaN(parsedPage) && parsedPage > 0) {
          pageNum = parsedPage
        }
      }
      
      // Convert slug to full URL based on provider
      let categoryUrl: string
      if (categorySlug.startsWith('http')) {
        // Old format - full URL
        categoryUrl = decodeURIComponent(categorySlug)
      } else {
        // New format - slug, convert to full URL based on provider
        if (providerName === 'fsiblog5') {
          categoryUrl = `https://www.fsiblog5.com/category/${categorySlug}/`
        } else {
          categoryUrl = `https://www.indianpornhq.com/${categorySlug}/`
        }
      }
      
      // Create a unique key for this category + page combination
      const categoryPageKey = `${categoryUrl}:${pageNum}`
      const lastCategoryPageKey = lastCategoryRef.current ? `${lastCategoryRef.current}:${currentPage}` : null
      
      // Check if this is a new category or page change
      if (categoryPageKey !== lastCategoryPageKey) {
        console.log('Category detected in URL:', categorySlug, 'page:', pageNum)
        
        // Set flag immediately to prevent regular video loading
        isLoadingCategoryRef.current = true
        
        // Set category state immediately to prevent regular video loading
        setSelectedCategory(categoryUrl)
        // Reset currentPage to 0 to prevent regular video loading from triggering
        setCurrentPage(0)
        
        // Track this category load
        lastCategoryRef.current = categoryUrl
        initializedRef.current = true
        hasCheckedInitialUrl.current = true
        
        // Load category videos with page number
        loadCategoryVideos(categoryUrl, pageNum)
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
    // Mark that we've checked the initial URL to prevent re-initialization
    if (!initializedRef.current && router.isReady) {
      let initialPage = 1
      
      // Determine max pages based on provider
      const maxPages = providerName === 'fsiblog5' ? 10 : 5
      
      // First priority: URL parameter
      if (router.query.page && !Array.isArray(router.query.page)) {
        const pageNum = parseInt(router.query.page, 10)
        if (!isNaN(pageNum) && pageNum > 0 && pageNum <= maxPages) {
          initialPage = pageNum
        }
      } 
      // Second priority: navigation state (only read once)
      else if (navigationState.providerPage > 1 && navigationState.providerPage <= maxPages) {
        initialPage = navigationState.providerPage
      }
      
      setCurrentPage(initialPage)
      initializedRef.current = true
      hasCheckedInitialUrl.current = true
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
    const cacheKey = `${providerName}-videos-${pageType}`;
    const hasVideosCache = hasCacheItem(cacheKey);
    
    if (!hasVideosCache) {
      setLoading(true);
    }
    
    try {
      setError(null)
      // Clear selected category when loading page types (only if not in category mode)
      if (!isLoadingCategoryRef.current && !selectedCategory) {
        setSelectedCategory(null)
      }

      console.log(`Fetching videos from ${providerName} page: ${pageName}`)
      
      let data;
      if (providerName === 'fsiblog5') {
        // Fetch FSIBlog videos using unified API with pagination
        const response = await fetch(`/api/v2/providers/fsiblog5/videos?page=${page}`)
        data = await response.json()
      } else {
        // Fetch IndianPornHQ videos
        data = await fetchIndianPornHQVideos(pageType)
      }

      const videoList = data.videos || data.data || []
      setVideos(videoList)
      
      // For FSIBlog, support real pagination (assume up to 10 pages exist)
      if (providerName === 'fsiblog5') {
        setTotalPages(10) // FSIBlog supports pagination
        setHasNextPage(videoList.length > 0) // If we got videos, there might be more
      } else {
        setTotalPages(pageTypes.length)
        setHasNextPage(page < pageTypes.length)
      }
      
      // Save to navigation context (setProviderPage already checks if page changed internally)
      setProviderPage(page)
    } catch (err) {
      console.error("Error loading videos:", err)
      setError("Failed to load videos. Please try again later.")
    } finally {
      setLoading(false)
    }
  }, [pageTypes, setProviderPage, selectedCategory, providerName])


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
    
    // Determine max pages based on provider
    const maxPages = providerName === 'fsiblog5' ? totalPages : 5
    
    // Only load if:
    // 1. currentPage is valid
    // 2. It's different from what we last loaded
    // 3. We're not currently loading
    // 4. Page has been initialized
    if (
      initializedRef.current &&
      currentPage > 0 && 
      currentPage <= maxPages &&
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
  }, [currentPage, loadVideos, selectedCategory, providerName, totalPages])

  // Separate effect for URL updates to avoid conflicts
  // Only update URL, don't read from it to avoid feedback loops
  const urlUpdateRef = React.useRef<boolean>(false)
  
  useEffect(() => {
    // Skip if we have category in URL - category pages handle their own URLs
    const hasCategoryInUrl = router.query.cat || router.query.category
    if (hasCategoryInUrl) {
      return
    }
    
    if (router.isReady && initializedRef.current && currentPage > 0 && !urlUpdateRef.current) {
      const currentUrlPage = router.query.page ? parseInt(router.query.page as string, 10) : 1
      
      // Only update URL if the current page is different from URL page
      // Don't update URL for category pages - loadCategoryVideos handles that
      if (currentPage !== currentUrlPage && !selectedCategory) {
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
  }, [currentPage, router.isReady, provider, selectedCategory, router.query.cat, router.query.category])

  // Restore scroll position when returning from video page (only once per session)
  const scrollRestoredRef = useRef(false)
  useEffect(() => {
    // Only restore if we have a saved position and haven't restored yet
    if (!loading && videos.length > 0 && !scrollRestoredRef.current && navigationState.providerScrollPosition > 0) {
      scrollRestoredRef.current = true
      setTimeout(() => {
        window.scrollTo({
          top: navigationState.providerScrollPosition,
          behavior: 'smooth'
        })
        // Clear the saved position after restoring
        setProviderScrollPosition(0)
      }, 100)
    }
  }, [loading, videos.length, navigationState.providerScrollPosition, setProviderScrollPosition])

  const handlePageChange = useCallback((page: number) => {
    if (page < 1) return
    
    // Reset scroll restoration flag when manually changing pages
    scrollRestoredRef.current = false
    
    // Handle category pagination for FSIBlog and Superporn
    if (selectedCategory) {
      if (providerName === 'fsiblog5' || providerName === 'superporn') {
        // FSIBlog and Superporn categories support pagination
        loadCategoryVideos(selectedCategory, page)
        // Scroll to top when changing pages
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
      // IndianPornHQ categories don't have pagination - ignore
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
  }, [currentPage, totalPages, selectedCategory, providerName, loadCategoryVideos])

  // When clicking on a video, save current page and scroll position
  const handleVideoClick = useCallback(() => {
    setProviderPage(currentPage)
    // Save current scroll position
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop
    setProviderScrollPosition(scrollPosition)
  }, [currentPage, setProviderPage, setProviderScrollPosition])

  const getProviderName = (providerName: string) => {
    const names: Record<string, string> = {
      'indianpornhq': 'IndianPornHQ',
      'fsiblog5': 'FSIBlog',
      'superporn': 'Superporn',
      'desi': 'Desi Provider'
    }
    return names[providerName] || providerName
  }

  // Check if user came from categories page
  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (typeof window !== 'undefined' && window.history.length > 1) {
      const referrer = document.referrer
      // Check if referrer includes /categories or if we're viewing a category
      if (referrer.includes('/categories') || selectedCategory) {
        router.push('/categories')
      } else {
        router.push('/')
      }
    } else {
      router.push('/')
    }
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
          <div className="mb-8 pt-4">
            {/* Navigation Bar */}
            <div className="mb-6 flex items-center justify-between">
              <button
                onClick={handleBackClick}
                className="group inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-gray-800/80 to-gray-800/40 hover:from-purple-600/20 hover:to-purple-600/10 border border-gray-700/50 hover:border-purple-500/50 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-purple-900/20"
              >
                <ChevronLeft size={20} className="mr-2 text-gray-400 group-hover:text-purple-400 transition-colors" />
                <span className="text-sm font-semibold text-gray-300 group-hover:text-purple-300 transition-colors">
                  {selectedCategory ? '← Categories' : '← Home'}
                </span>
              </button>
              
              {/* Breadcrumb / Context */}
              {selectedCategory && (
                <div className="text-sm text-gray-400 flex items-center gap-2">
                  <span>Viewing:</span>
                  <span className="text-purple-400 font-semibold">
                    {selectedCategory.split('/').filter((p: string) => p).pop()?.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Category'}
                  </span>
                </div>
              )}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center">
              <span className="w-1.5 h-8 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full inline-block mr-3 shadow-lg shadow-purple-500/50"></span>
              {getProviderName(provider as string)}
            </h1>
            <p className="text-gray-400 ml-4">
              {showCategories && providerName === 'superporn' 
                ? 'Browse all categories' 
                : 'Fresh content updated daily'}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded mb-6">{error}</div>
          )}

          {/* Category selection indicator - removed since we now show it in header */}

          {/* Categories Grid for Superporn */}
          {showCategories && providerName === 'superporn' ? (
            loading && categories.length === 0 ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : categories.length > 0 ? (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Browse by Category</h2>
                <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 ${isCollapsed ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4 mb-8`}>
                  {categories.slice((categoryPage - 1) * categoriesPerPage, categoryPage * categoriesPerPage).map((category, index) => (
                    <Link
                      key={category.slug || index}
                      href={`/provider/superporn?cat=${category.slug}`}
                      className="group relative bg-gray-800/40 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-black/30 hover:shadow-purple-900/20"
                    >
                      <div className="aspect-video relative overflow-hidden">
                        {category.thumbnail ? (
                          <img
                            src={category.thumbnail}
                            alt={category.name}
                            className="w-full h-full object-cover brightness-75 group-hover:brightness-90 transition-all duration-300 group-hover:scale-110"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.onerror = null
                              target.src = "/api/placeholder?height=200&width=300&query=category"
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-600/30 to-pink-600/30 flex items-center justify-center">
                            <span className="text-4xl">🎬</span>
                          </div>
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                        
                        {/* Category info overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2 group-hover:text-purple-300 transition-colors">
                            {category.name}
                          </h3>
                          {category.count && (
                            <p className="text-gray-300 text-xs">
                              {category.count} videos
                            </p>
                          )}
                        </div>
                        
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-purple-600/0 group-hover:bg-purple-600/20 transition-all duration-300" />
                      </div>
                    </Link>
                  ))}
                </div>
                
                {/* Pagination for categories */}
                {categories.length > categoriesPerPage && (
                  <div className="flex justify-center items-center space-x-2 mt-8">
                    <button
                      onClick={() => {
                        setCategoryPage(prev => Math.max(1, prev - 1))
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      disabled={categoryPage === 1}
                      className="p-2 rounded-lg bg-gray-800/70 text-white hover:bg-purple-600/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.ceil(categories.length / categoriesPerPage) }, (_, i) => i + 1).map(pageNum => {
                        const totalPages = Math.ceil(categories.length / categoriesPerPage)
                        // Show first 2, last 2, and pages around current
                        const showPage = 
                          pageNum <= 2 || 
                          pageNum >= totalPages - 1 || 
                          (pageNum >= categoryPage - 1 && pageNum <= categoryPage + 1)
                        
                        if (!showPage && pageNum === 3 && categoryPage > 4) {
                          return <span key={pageNum} className="text-gray-500">...</span>
                        }
                        if (!showPage && pageNum === totalPages - 2 && categoryPage < totalPages - 3) {
                          return <span key={pageNum} className="text-gray-500">...</span>
                        }
                        if (!showPage) return null

                        return (
                          <button
                            key={pageNum}
                            onClick={() => {
                              setCategoryPage(pageNum)
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              categoryPage === pageNum
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
                        setCategoryPage(prev => Math.min(Math.ceil(categories.length / categoriesPerPage), prev + 1))
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      disabled={categoryPage >= Math.ceil(categories.length / categoriesPerPage)}
                      className="p-2 rounded-lg bg-gray-800/70 text-white hover:bg-purple-600/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700/50 backdrop-blur-sm">
                <h3 className="text-xl font-medium text-gray-400">No categories available</h3>
                <p className="text-gray-500 mt-2">Check back later for new content.</p>
              </div>
            )
          ) : (
            <>
              {/* Videos grid */}
              {loading && videos.length === 0 ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : videos.length > 0 ? (
            <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${isCollapsed ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-5 mb-8`}>
              {videos.map((video, index) => {
                // Construct video URL based on provider
                let videoUrl: string
                let videoQuery: any = {}
                
                if (providerName === 'fsiblog5') {
                  // FSIBlog uses slug directly
                  videoUrl = `/provider/${provider}/video/${video.slug || encodeURIComponent(video.id || `video-${index}`)}`
                  if (selectedCategory) {
                    const urlParts = selectedCategory.split('/').filter((p: string) => p && p.length > 0)
                    const categorySlug = urlParts[urlParts.length - 1] || ''
                    if (categorySlug) {
                      videoQuery.cat = categorySlug
                    }
                  }
                } else if (providerName === 'superporn') {
                  // Superporn uses /video/{id} format (same as /category/[slug] page)
                  videoUrl = `/video/${video.id || encodeURIComponent(video.slug || `video-${index}`)}`
                  // Pass video data and category context (use 'category' as from value to match /video/[id] page logic)
                  const urlParts = selectedCategory?.split('/').filter((p: string) => p && p.length > 0) || []
                  const categorySlug = urlParts[urlParts.length - 1] || ''
                  videoQuery = {
                    from: 'category',
                    provider: 'superporn', // Add provider to know where to return
                    categorySlug: categorySlug,
                    categoryPage: currentPage,
                    videoData: JSON.stringify(video)
                  }
                } else {
                  // IndianPornHQ uses seo_slug
                  videoUrl = `/provider/${provider}/video/${video.seo_slug || encodeURIComponent(video.id || video.url || `video-${index}`)}`
                  if (selectedCategory) {
                    const urlParts = selectedCategory.split('/').filter((p: string) => p && p.length > 0)
                    const categorySlug = urlParts[urlParts.length - 1] || ''
                    if (categorySlug) {
                      videoQuery.cat = categorySlug
                    }
                  }
                }
                
                // Construct thumbnail URL based on provider
                const isFSIBlog = providerName === 'fsiblog5' || provider === 'fsiblog5'
                const isSuperporn = providerName === 'superporn'
                
                let thumbnailSrc: string
                if (isFSIBlog) {
                  // FSIBlog thumbnails are already proxied by the provider implementation
                  // Use them directly without double-proxying
                  thumbnailSrc = video.thumbnail || video.thumbnail_url || "/api/placeholder?height=400&width=600&query=video"
                } else if (isSuperporn) {
                  // Superporn thumbnails are direct URLs from API (thumbnailUrl or thumbnail field)
                  thumbnailSrc = video.thumbnailUrl || video.thumbnail || video.thumbnail_url || "/api/placeholder?height=400&width=600&query=video"
                } else {
                  // Default fallback for other providers
                  thumbnailSrc = video.thumbnail_url || video.thumbnail || "/api/placeholder?height=400&width=600&query=video"
                }
                
                return (
                <Link
                  key={video.id || index}
                  href={providerName === 'superporn' ? {
                    pathname: videoUrl,
                    query: videoQuery
                  } : videoUrl + (Object.keys(videoQuery).length > 0 ? `?${new URLSearchParams(videoQuery).toString()}` : '')}
                  onClick={handleVideoClick}
                  className="group flex flex-col bg-gray-800/40 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-black/30 hover:shadow-purple-900/20"
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={thumbnailSrc}
                      alt={video.title}
                      className="w-full h-full object-cover brightness-95"
                      style={{ 
                        transform: (isFSIBlog || isSuperporn) ? 'scale(1)' : 'scaleY(-1) scale(1)',
                        transition: 'transform 0.5s ease-in-out'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = (isFSIBlog || isSuperporn) ? 'scale(1.05)' : 'scaleY(-1) scale(1.05)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = (isFSIBlog || isSuperporn) ? 'scale(1)' : 'scaleY(-1) scale(1)'
                      }}
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
          {selectedCategory && providerName === 'indianpornhq' ? (
            // IndianPornHQ categories don't have pagination
            null
          ) : !showCategories && totalPages > 1 ? (
            // Pagination
            <div className="mt-8">
              {(providerName === 'fsiblog5' || providerName === 'superporn') ? (
                // FSIBlog & Superporn: Numeric pagination
                <div className="flex justify-center items-center space-x-2 flex-wrap gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="p-2 rounded-lg bg-gray-800/70 text-white hover:bg-purple-600/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  {/* Show page numbers */}
                  {Array.from({ length: Math.min(totalPages, providerName === 'superporn' ? 20 : 10) }, (_, i) => i + 1).map((pageNum) => {
                    // Show first 2, last 2, and pages around current page
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
                    if (!showPage) {
                      return null
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        disabled={loading}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? "bg-purple-600 text-white"
                            : "bg-gray-800/70 text-gray-300 hover:bg-gray-700/80"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!hasNextPage || loading}
                    className="p-2 rounded-lg bg-gray-800/70 text-white hover:bg-purple-600/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              ) : (
                // IndianPornHQ: Page type navigation
                <>
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
                </>
              )}
            </div>
          ) : null}
            </>
          )}
        </div>
      </div>
    </>
  )
}
