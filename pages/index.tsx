import type React from "react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Play, Clock, ChevronRight, Star, Sparkles, TrendingUp, Grid3x3 } from "lucide-react"
import HeroSection from "@/components/HeroSection"
import { fetchLatestWebseries, fetchCategories, fetchProviderInfo, fetchIndianPornHQVideos, fetchAllProviderCategories, fetchIndianPornHQCategoryVideos } from "@/services/api"
import type { WebseriesPost, Category } from "@/types"
import PremiumBadge from "@/components/PremiumBadge"
import { useAuth } from "@/contexts/AuthContext"
import { useSidebar } from "@/contexts/SidebarContext"
import { hasCacheItem, getCacheItem, setCacheItem } from "@/services/cache"
import ProviderCategoryGrid from "@/components/ProviderCategoryGrid"
import CategoryGrid from "@/components/CategoryGrid"

const ViewAllButton = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <Link 
    href={to} 
    className="group relative overflow-hidden px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-full transition-all duration-300 hover:from-purple-500 hover:to-purple-600 hover:shadow-lg hover:shadow-purple-500/25 flex items-center"
  >
    <span className="relative z-10 flex items-center">
      <span className="hidden sm:inline">{children}</span>
      <span className="sm:hidden">View All</span>
      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 transition-transform group-hover:translate-x-0.5" />
    </span>
    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
  </Link>
)

const SectionTitle = ({ 
  title, 
  subtitle, 
  icon: Icon 
}: { 
  title: string; 
  subtitle?: string; 
  icon?: any 
}) => (
  <div className="flex flex-col space-y-1">
    <div className="flex items-center space-x-2 sm:space-x-3">
      <div className="relative">
        <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full" />
        <div className="absolute -top-1 -left-1 w-2 h-2 sm:w-3 sm:h-3 bg-purple-400 rounded-full animate-pulse" />
      </div>
      {Icon && <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />}
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
        {title}
      </h2>
    </div>
    {subtitle && (
      <p className="text-xs sm:text-sm text-gray-400 ml-6">{subtitle}</p>
    )}
  </div>
)

export default function HomePage() {
  const [webseries, setWebseries] = useState<WebseriesPost[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [providerInfo, setProviderInfo] = useState<any>(null)
  const [fsiblogThumbnail, setFsiblogThumbnail] = useState<string>("/api/placeholder?height=400&width=600&query=fsiblog+desi+content")
  const [superpornThumbnail, setSuperpornThumbnail] = useState<string>("/api/placeholder?height=400&width=600&query=superporn+content")
  const [providerCategories, setProviderCategories] = useState<Array<{name: string, url: string, slug?: string, count?: number, thumbnail?: string, provider?: string, isEmpty?: boolean}>>([])
  const [loading, setLoading] = useState(false)
  const [loadingProviderCategories, setLoadingProviderCategories] = useState(false)
  const [categoriesPage, setCategoriesPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { isCollapsed } = useSidebar()
  
  // Ref for Browse by Category section
  const browseByCategoryRef = useRef<HTMLElement>(null)

  // Get responsive grid classes based on sidebar state
  const getGridClasses = () => {
    if (isCollapsed) {
      // When sidebar is collapsed, show 5 items per row
      return "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
    } else {
      // When sidebar is expanded, show 4 items max
      return "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
    }
  }

  // Get responsive grid classes for provider categories (2 columns on mobile)
  const getProviderCategoryGridClasses = () => {
    if (isCollapsed) {
      // When sidebar is collapsed, show more items
      return "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 gap-6"
    } else {
      // When sidebar is expanded, show 4 items max
      return "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
    }
  }

  // Check if user has premium access
  const hasPremiumAccess =
    user &&
    (user.membership_status === "monthly" ||
      user.membership_status === "3month" ||
      user.membership_status === "halfyearly" ||
      user.membership_status === "yearly" ||
      user.membership_status === "admin")

  const loadData = async () => {
    // Check if we have cached data for all sections before showing loading indicator
    const hasWebseriesCache = hasCacheItem('latest-webseries-page-1');
    const hasCategoriesCache1 = hasCacheItem('categories-page-1');
    const hasCategoriesCache2 = hasCacheItem('categories-page-2');
    
    // Only show loading indicator if we don't have cached data
    const shouldShowLoading = !(hasWebseriesCache && hasCategoriesCache1 && hasCategoriesCache2);
    
    if (shouldShowLoading) {
      setLoading(true);
    }
    
    try {
      setError(null)
      let hasError = false

      // Load each data type independently so if one fails, the others can still load
      try {
        const webseriesData = await fetchLatestWebseries()
        const webseriesList = webseriesData.posts || webseriesData.webseries || []
        
        // If no webseries found, try to use provider videos as fallback
        if (webseriesList.length === 0) {
          console.log("No webseries found, trying provider videos as fallback")
          try {
            const providerVideos = await fetchIndianPornHQVideos('homepage')
            if (providerVideos.data && providerVideos.data.length > 0) {
              // Transform provider videos to webseries format
              const transformedVideos = providerVideos.data.slice(0, 12).map((video: any) => ({
                id: video.id || video.seo_slug || `video-${video.original_id}`,
                title: video.title || 'Untitled Video',
                thumbnail: video.thumbnail_url || video.thumbnail || '/api/placeholder?height=400&width=600&query=video',
                duration: video.duration || '00:00',
                quality: video.quality || 'HD',
                link: video.seo_slug ? `/provider/indianpornhq/video/${video.seo_slug}` : `/provider/indianpornhq`,
                originalUrl: video.url || video.original_id,
              }))
              setWebseries(transformedVideos)
            } else {
              setWebseries([])
            }
          } catch (fallbackErr) {
            console.error("Error loading provider videos as fallback:", fallbackErr)
            setWebseries([])
          }
        } else {
          setWebseries(webseriesList)
        }
      } catch (err) {
        console.error("Error loading webseries:", err)
        // Try provider videos as fallback
        try {
          const providerVideos = await fetchIndianPornHQVideos('homepage')
          if (providerVideos.data && providerVideos.data.length > 0) {
            const transformedVideos = providerVideos.data.slice(0, 12).map((video: any) => ({
              id: video.id || video.seo_slug || `video-${video.original_id}`,
              title: video.title || 'Untitled Video',
              thumbnail: video.thumbnail_url || video.thumbnail || '/api/placeholder?height=400&width=600&query=video',
              duration: video.duration || '00:00',
              quality: video.quality || 'HD',
              link: video.seo_slug ? `/provider/indianpornhq/video/${video.seo_slug}` : `/provider/indianpornhq`,
              originalUrl: video.url || video.original_id,
            }))
            setWebseries(transformedVideos)
          } else {
            setWebseries([])
            hasError = true
          }
        } catch (fallbackErr) {
          console.error("Error loading provider videos as fallback:", fallbackErr)
          setWebseries([])
          hasError = true
        }
      }


      try {
        // Fetch categories from page 1
        const categoriesPage1 = await fetchCategories(1)
        
        // Fetch categories from page 2
        const categoriesPage2 = await fetchCategories(2)
        
        // Combine categories from both pages
        const allCategories = [
          ...categoriesPage1.categories,
          ...categoriesPage2.categories
        ]
        
        // Set all categories
        setCategories(allCategories)
      } catch (err) {
        console.error("Error loading categories:", err)
        hasError = true
      }

      // Load provider info
      try {
        const providerData = await fetchProviderInfo('indianpornhq')
        setProviderInfo(providerData.data)
      } catch (err) {
        console.error("Error loading provider info:", err)
        hasError = true
      }

      // Load FSIBlog homepage first post thumbnail
      try {
        const cacheKey = 'fsiblog-homepage-thumbnail'
        const CACHE_DURATION = 6 * 60 * 60 * 1000 // 6 hours
        
        const cachedThumbnail = getCacheItem<string>(cacheKey)
        if (cachedThumbnail) {
          setFsiblogThumbnail(cachedThumbnail)
        } else {
          // Fetch FSIBlog homepage videos (no page param means homepage)
          const response = await fetch('/api/providers/fsiblog5/videos')
          const data = await response.json()
          
          if (data.success && data.videos && data.videos.length > 0) {
            const firstVideo = data.videos[0]
            if (firstVideo.thumbnail) {
              const proxiedThumbnail = `https://fsiblog5.premiumhub.workers.dev/?url=${encodeURIComponent(firstVideo.thumbnail)}`
              setFsiblogThumbnail(proxiedThumbnail)
              setCacheItem(cacheKey, proxiedThumbnail, CACHE_DURATION)
            }
          }
        }
      } catch (err) {
        console.error("Error loading FSIBlog thumbnail:", err)
        // Keep default placeholder if fetch fails
      }

      // Load Superporn homepage first post thumbnail
      try {
        const cacheKey = 'superporn-homepage-thumbnail'
        const CACHE_DURATION = 6 * 60 * 60 * 1000 // 6 hours
        
        const cachedThumbnail = getCacheItem<string>(cacheKey)
        if (cachedThumbnail) {
          setSuperpornThumbnail(cachedThumbnail)
        } else {
          // Fetch Superporn homepage videos
          const response = await fetch('/api/v2/providers/superporn/videos?page=1')
          const data = await response.json()
          
          if (data.success && data.data && data.data.length > 0) {
            const firstVideo = data.data[0]
            if (firstVideo.thumbnail) {
              setSuperpornThumbnail(firstVideo.thumbnail)
              setCacheItem(cacheKey, firstVideo.thumbnail, CACHE_DURATION)
            }
          }
        }
      } catch (err) {
        console.error("Error loading Superporn thumbnail:", err)
        // Keep default placeholder if fetch fails
      }

      // Only show error if there was an actual error AND all data types failed to load
      if (hasError && webseries.length === 0 && categories.length === 0) {
        setError("Failed to load content. Please try again later.")
      }
    } catch (err) {
      console.error("Error loading content:", err)
      setError("Failed to load content. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  // Load provider categories separately (non-blocking)
  useEffect(() => {
    const loadProviderCategories = async () => {
      if (providerCategories.length === 0 && !loadingProviderCategories) {
        setLoadingProviderCategories(true)
        try {
          // Fetch categories from all providers using unified API
          const providers = ['fsiblog5', 'indianpornhq', 'superporn']
          const allCategoriesPromises = providers.map(async (providerId) => {
            try {
              const response = await fetch(`/api/v2/providers/${providerId}/categories`)
              const result = await response.json()
              
              if (result.success && result.data) {
                return result.data.map((cat: any) => ({
                  name: cat.name,
                  url: cat.url,
                  slug: cat.slug,
                  count: cat.count,
                  provider: providerId,
                  thumbnail: cat.thumbnail // Superporn already has thumbnails
                }))
              }
              return []
            } catch (err) {
              console.error(`Error fetching categories from ${providerId}:`, err)
              return []
            }
          })

          const categoriesArrays = await Promise.all(allCategoriesPromises)
          let allCategories = categoriesArrays.flat()
          
          if (allCategories.length > 0) {
            // Set ALL categories immediately (not just 24)
            setProviderCategories(allCategories)
              
            // Fetch thumbnails only for categories without them (FSIBlog and IndianPornHQ)
            const catsWithoutThumbs = allCategories.filter((cat: any) => !cat.thumbnail)
            const batchSize = 6
              
              // Fetch thumbnails for categories without them
              for (let i = 0; i < catsWithoutThumbs.length; i += batchSize) {
                const batch = catsWithoutThumbs.slice(i, i + batchSize)
                
                const thumbnails = await Promise.allSettled(
                  batch.map(async (category: any) => {
                    try {
                      // Check cache for category thumbnail first
                      const cacheKey = `category-thumbnail-${encodeURIComponent(category.url)}`
                      const CACHE_DURATION = 12 * 60 * 60 * 1000 // 12 hours - thumbnails don't change often
                      
                      const cachedThumbnail = getCacheItem<string>(cacheKey)
                      if (cachedThumbnail) {
                        console.log(`Using cached thumbnail for category: ${category.name}`)
                        return {
                          category,
                          thumbnail: cachedThumbnail
                        }
                      }
                      
                      // Cache miss - fetch first video from category to get thumbnail using unified API
                      const response = await fetch(`/api/v2/providers/${category.provider}/category/${category.slug || category.url}`)
                      const categoryVideos = await response.json()
                      
                      if (categoryVideos.success && categoryVideos.data && categoryVideos.data.length > 0) {
                        const firstVideo = categoryVideos.data[0]
                        const thumbnail = firstVideo.thumbnail || firstVideo.thumbnail_url
                        
                        // Cache the thumbnail for future use
                        if (thumbnail) {
                          setCacheItem(cacheKey, thumbnail, CACHE_DURATION)
                          console.log(`Cached thumbnail for category: ${category.name}`)
                        }
                        
                        return {
                          category,
                          thumbnail
                        }
                      }
                      return { category, thumbnail: null }
                    } catch (err) {
                      console.error(`Error fetching thumbnail for category ${category.name}:`, err)
                      return { category, thumbnail: null }
                    }
                  })
                )
                
                // Update categories with fetched thumbnails
                setProviderCategories((prev) => {
                  const updated = [...prev]
                  thumbnails.forEach((result, idx) => {
                    if (result.status === 'fulfilled' && result.value) {
                      const categoryIndex = updated.findIndex((c: any) => 
                        c.url === result.value.category.url && c.provider === result.value.category.provider
                      )
                      if (categoryIndex !== -1) {
                        // Mark as empty if no thumbnail found (no videos in category)
                        if (!result.value.thumbnail) {
                          updated[categoryIndex] = {
                            ...updated[categoryIndex],
                            isEmpty: true
                          }
                        } else {
                          updated[categoryIndex] = {
                            ...updated[categoryIndex],
                            thumbnail: result.value.thumbnail,
                            isEmpty: false
                          }
                        }
                      }
                    }
                  })
                  // Filter out empty categories
                  return updated.filter((cat: any) => !cat.isEmpty)
                })
                
                // Small delay between batches to avoid rate limiting
                if (i + batchSize < catsWithoutThumbs.length) {
                  await new Promise(resolve => setTimeout(resolve, 200))
                }
              }
            }
        } catch (err) {
          console.error("Error loading provider categories:", err)
        } finally {
          setLoadingProviderCategories(false)
        }
      }
    }
    
    loadProviderCategories()
  }, [providerCategories.length, loadingProviderCategories])

  useEffect(() => {
    loadData()
  }, [])

  // Transform webseries posts to VideoCard format
  const transformedWebseries = webseries.map((post) => ({
    id: post.id,
    title: post.title,
    thumbnail: post.thumbnail,
    duration: post.duration,
    year: new Date().getFullYear(),
    category: post.quality,
    link: post.link,
  }))

  // Get the first webseries for hero section
  const heroWebseries = webseries[0] && {
    id: webseries[0].id,
    title: webseries[0].title,
    description: webseries[0].title,
    backdropImage: webseries[0].thumbnail,
    year: new Date().getFullYear(),
    duration: webseries[0].duration,
    category: webseries[0].quality || "HD", // Provide a default value to avoid undefined
    link: webseries[0].link,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10">
        {/* Hero Section with Enhanced Overlay */}
        {heroWebseries && (
          <Link href={heroWebseries.link}>
            <div className="relative overflow-hidden">
              <HeroSection {...heroWebseries} />
              {/* Enhanced gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" />
              {!hasPremiumAccess && <PremiumBadge className="top-6 left-6 text-sm px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500" />}
            </div>
          </Link>
        )}

        {/* Error Message with Modern Design */}
        {error && (
          <div className="container mx-auto px-4 py-4">
            <div className="bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/20 backdrop-blur-sm text-red-300 px-6 py-4 rounded-2xl relative overflow-hidden" role="alert">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-red-600/5" />
              <div className="relative z-10">
                <strong className="font-bold">Connection Issue: </strong> 
                <span className="block sm:inline">{error}</span>
              </div>
            </div>
          </div>
        )}

        {/* Latest Webseries with Enhanced Design */}
        <section className="py-6 sm:py-8 md:py-12 relative">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-3 sm:gap-0">
              <SectionTitle 
                title="Latest Webseries" 
                subtitle="Discover the newest content just for you"
                icon={Sparkles}
              />
              <ViewAllButton to="/webseries">View All Webseries</ViewAllButton>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-purple-400/20"></div>
                </div>
              </div>
            ) : webseries.length > 0 ? (
              <div className={getGridClasses()}>
                {transformedWebseries.map((video, index) => (
                  <Link
                    key={video.id}
                    href={video.link}
                    className="group relative flex flex-col bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.03] hover:bg-gradient-to-br hover:from-gray-700/60 hover:to-gray-800/60 shadow-xl shadow-black/40 hover:shadow-2xl hover:shadow-purple-900/30 border border-gray-700/30 hover:border-purple-500/30"
                    style={{ 
                      animationDelay: `${index * 100}ms`,
                      animation: 'fadeInUp 0.6s ease-out forwards'
                    }}
                  >
                    <div className="aspect-video w-full relative overflow-hidden">
                      <img
                        src={video.thumbnail || "/api/placeholder?height=400&width=600&query=movie%20scene"}
                        alt={video.title}
                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 brightness-90 group-hover:brightness-100"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.onerror = null
                          target.src = "/api/placeholder?height=400&width=600&query=movie%20scene"
                        }}
                      />

                      {/* Enhanced gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

                      {/* Premium badge if not premium user */}
                      {!hasPremiumAccess && <PremiumBadge className="top-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-500" />}

                      {/* Enhanced play button overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                        <div className="relative">
                          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-700 backdrop-blur-lg rounded-full flex items-center justify-center transform scale-75 group-hover:scale-100 transition-all duration-500 shadow-2xl shadow-purple-600/50 border-2 border-white/20">
                            <Play className="w-8 h-8 text-white fill-current ml-1" />
                          </div>
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-purple-500 opacity-20 animate-ping"></div>
                        </div>
                      </div>

                      {/* Enhanced duration badge */}
                      <div className="absolute bottom-3 right-3 bg-black/90 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full flex items-center shadow-xl border border-white/10">
                        <Clock size={12} className="mr-1.5 text-purple-400" />
                        {video.duration}
                      </div>
                    </div>

                    <div className="p-4 flex-grow flex flex-col">
                      <h3 className="font-semibold text-white line-clamp-2 group-hover:text-purple-300 transition-colors duration-300 leading-tight">
                        {video.title}
                      </h3>

                      <div className="flex items-center justify-between mt-3">
                        <span className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                          {video.category}
                        </span>
                        <div className="flex items-center text-yellow-400">
                          <Star size={12} className="fill-current" />
                          <span className="text-xs ml-1 text-gray-300">NEW</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/30">
                  <p className="text-gray-400">No webseries available at the moment.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Desi Provider Section */}
        <section className="py-6 sm:py-8 md:py-12 relative">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-3 sm:gap-0">
              <SectionTitle 
                title="Providers" 
                subtitle="Fresh content updated daily from our premium sources"
                icon={TrendingUp}
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-purple-400/20"></div>
                </div>
              </div>
            ) : (
              <div className={`grid gap-4 md:gap-6 ${isCollapsed ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'}`}>
                {/* IndianPornHQ Provider Card */}
                {providerInfo && (
                  <Link
                    href={`/provider/${providerInfo.provider}`}
                    className="group relative flex flex-col bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:bg-gradient-to-br hover:from-gray-700/60 hover:to-gray-800/60 shadow-xl shadow-black/40 hover:shadow-2xl hover:shadow-purple-900/30 border border-gray-700/30 hover:border-purple-500/30"
                  >
                    <div className="aspect-video w-full relative overflow-hidden">
                      <img
                        src={providerInfo.thumbnail}
                        alt={providerInfo.name}
                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 brightness-90 group-hover:brightness-100"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.onerror = null
                          target.src = "/api/placeholder?height=400&width=600&query=provider"
                        }}
                      />

                      {/* Enhanced gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

                      {/* Premium badge if not premium user */}
                      {!hasPremiumAccess && <PremiumBadge className="top-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-500" />}

                      {/* Enhanced play button overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                        <div className="relative">
                          <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-purple-700 backdrop-blur-lg rounded-full flex items-center justify-center transform scale-75 group-hover:scale-100 transition-all duration-500 shadow-2xl shadow-purple-600/50 border-2 border-white/20">
                            <Play className="w-10 h-10 text-white fill-current ml-1" />
                          </div>
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-purple-500 opacity-20 animate-ping"></div>
                        </div>
                      </div>

                      {/* Video count badge */}
                      <div className="absolute bottom-3 right-3 bg-black/90 backdrop-blur-md text-white text-sm px-4 py-2 rounded-full flex items-center shadow-xl border border-white/10">
                        <TrendingUp size={16} className="mr-2 text-purple-400" />
                        {providerInfo.totalVideos} Videos
                      </div>
                    </div>

                    <div className="p-6 flex-grow flex flex-col">
                      <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors duration-300 leading-tight mb-2">
                        {providerInfo.name}
                      </h3>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {providerInfo.description}
                      </p>

                      <div className="flex items-center justify-between mt-auto">
                        <span className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                          Daily Updates
                        </span>
                        <div className="flex items-center text-yellow-400">
                          <Star size={16} className="fill-current" />
                          <span className="text-sm ml-1 text-gray-300">PREMIUM</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )}

                {/* FSIBlog Provider Card */}
                <Link
                  href="/provider/fsiblog5"
                  className="group relative flex flex-col bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:bg-gradient-to-br hover:from-gray-700/60 hover:to-gray-800/60 shadow-xl shadow-black/40 hover:shadow-2xl hover:shadow-purple-900/30 border border-gray-700/30 hover:border-purple-500/30"
                >
                  <div className="aspect-video w-full relative overflow-hidden">
                    <img
                      src={fsiblogThumbnail}
                      alt="FSIBlog"
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 brightness-90 group-hover:brightness-100"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.onerror = null
                        target.src = "/api/placeholder?height=400&width=600&query=provider"
                      }}
                    />

                    {/* Enhanced gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

                    {/* Premium badge if not premium user */}
                    {!hasPremiumAccess && <PremiumBadge className="top-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-500" />}

                    {/* Enhanced play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                      <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-purple-700 backdrop-blur-lg rounded-full flex items-center justify-center transform scale-75 group-hover:scale-100 transition-all duration-500 shadow-2xl shadow-purple-600/50 border-2 border-white/20">
                          <Play className="w-10 h-10 text-white fill-current ml-1" />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-purple-500 opacity-20 animate-ping"></div>
                      </div>
                    </div>

                    {/* NEW badge */}
                    <div className="absolute bottom-3 right-3 bg-gradient-to-r from-green-500 to-emerald-600 backdrop-blur-md text-white text-sm px-4 py-2 rounded-full flex items-center shadow-xl border border-white/10 font-semibold">
                      <Sparkles size={16} className="mr-2" />
                      NEW
                    </div>
                  </div>

                  <div className="p-6 flex-grow flex flex-col">
                    <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors duration-300 leading-tight mb-2">
                      FSIBlog
                    </h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      Premium Indian adult content with videos, galleries, and stories. Fresh updates daily.
                    </p>

                    <div className="flex items-center justify-between mt-auto">
                      <span className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                        Daily Updates
                      </span>
                      <div className="flex items-center text-yellow-400">
                        <Star size={16} className="fill-current" />
                        <span className="text-sm ml-1 text-gray-300">PREMIUM</span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Superporn Provider Card */}
                <Link
                  href="/provider/superporn"
                  className="group relative flex flex-col bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:bg-gradient-to-br hover:from-gray-700/60 hover:to-gray-800/60 shadow-xl shadow-black/40 hover:shadow-2xl hover:shadow-purple-900/30 border border-gray-700/30 hover:border-purple-500/30"
                >
                  <div className="aspect-video w-full relative overflow-hidden">
                    <img
                      src={superpornThumbnail}
                      alt="Superporn"
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 brightness-90 group-hover:brightness-100"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.onerror = null
                        target.src = "/api/placeholder?height=400&width=600&query=superporn+content"
                      }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

                    {!hasPremiumAccess && <PremiumBadge className="top-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-500" />}

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                      <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-purple-700 backdrop-blur-lg rounded-full flex items-center justify-center transform scale-75 group-hover:scale-100 transition-all duration-500 shadow-2xl shadow-purple-600/50 border-2 border-white/20">
                          <Play className="w-10 h-10 text-white fill-current ml-1" />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-purple-500 opacity-20 animate-ping"></div>
                      </div>
                    </div>

                    <div className="absolute bottom-3 right-3 bg-gradient-to-r from-pink-500 to-purple-600 backdrop-blur-md text-white text-sm px-4 py-2 rounded-full flex items-center shadow-xl border border-white/10 font-semibold">
                      <Sparkles size={16} className="mr-2" />
                      HOT
                    </div>
                  </div>

                  <div className="p-6 flex-grow flex flex-col">
                    <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors duration-300 leading-tight mb-2">
                      Superporn
                    </h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      Premium adult entertainment with extensive HD video collection and daily updates.
                    </p>

                    <div className="flex items-center justify-between mt-auto">
                      <span className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                        Daily Updates
                      </span>
                      <div className="flex items-center text-yellow-400">
                        <Star size={16} className="fill-current" />
                        <span className="text-sm ml-1 text-gray-300">PREMIUM</span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* All Providers Link */}
                <Link
                  href="/categories"
                  className="group relative flex flex-col bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.02] shadow-xl shadow-black/40 hover:shadow-2xl hover:shadow-purple-900/40 border border-purple-500/30 hover:border-purple-400/50"
                >
                  <div className="aspect-video w-full relative overflow-hidden bg-gradient-to-br from-purple-900/40 to-pink-900/40">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-4 transform group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-600/50">
                          <Grid3x3 className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors duration-300">
                          View All
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 flex-grow flex flex-col">
                    <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors duration-300 leading-tight mb-2">
                      Explore Categories
                    </h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      Browse all categories from all providers and discover more content.
                    </p>

                    <div className="flex items-center justify-center mt-auto">
                      <span className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-2 rounded-full text-sm font-medium shadow-lg flex items-center">
                        Browse All
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Browse by Category Section with Pagination */}
        <section ref={browseByCategoryRef} className="py-6 sm:py-8 md:py-12 relative">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-3 sm:gap-0">
              <SectionTitle 
                title="Browse by Category" 
                subtitle={providerCategories.length > 0 
                  ? `Explore content by category from all providers • Page ${categoriesPage} of ${Math.ceil(providerCategories.length / 24)}`
                  : "Explore content by category from all providers"
                }
                icon={Grid3x3}
              />
            </div>

            <CategoryGrid
              categories={providerCategories.slice((categoriesPage - 1) * 24, categoriesPage * 24)}
              hasPremiumAccess={hasPremiumAccess}
              loading={loadingProviderCategories}
              showProviderBadge={true}
            />

            {/* Pagination Controls */}
            {providerCategories.length > 24 && (
                <div className="flex justify-center items-center space-x-2 mt-8">
                  <button
                    onClick={() => {
                      setCategoriesPage(prev => Math.max(1, prev - 1))
                      browseByCategoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                    disabled={categoriesPage === 1}
                    className="p-2 rounded-lg bg-gray-800/70 text-white hover:bg-purple-600/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.ceil(providerCategories.length / 24) }, (_, i) => i + 1).map(pageNum => {
                      const totalPages = Math.ceil(providerCategories.length / 24)
                      const showPage = 
                        pageNum <= 2 || 
                        pageNum >= totalPages - 1 || 
                        (pageNum >= categoriesPage - 1 && pageNum <= categoriesPage + 1)
                      
                      if (!showPage && pageNum === 3 && categoriesPage > 4) {
                        return <span key={pageNum} className="text-gray-500">...</span>
                      }
                      if (!showPage && pageNum === totalPages - 2 && categoriesPage < totalPages - 3) {
                        return <span key={pageNum} className="text-gray-500">...</span>
                      }
                      if (!showPage) return null

                      return (
                        <button
                          key={pageNum}
                          onClick={() => {
                            setCategoriesPage(pageNum)
                            browseByCategoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            categoriesPage === pageNum
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
                      setCategoriesPage(prev => Math.min(Math.ceil(providerCategories.length / 24), prev + 1))
                      browseByCategoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                    disabled={categoriesPage >= Math.ceil(providerCategories.length / 24)}
                    className="p-2 rounded-lg bg-gray-800/70 text-white hover:bg-purple-600/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </section>



      </div>

      {/* Add CSS Animation Styles */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
