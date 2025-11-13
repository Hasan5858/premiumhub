import { GetServerSideProps } from "next"
import { useState, useEffect } from "react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { Play, Clock, ChevronLeft, ChevronRight, Film, Tv, ArrowLeft } from "lucide-react"
import { useNavigation } from "@/contexts/NavigationContext"
import { useSidebar } from "@/contexts/SidebarContext"
import type { WebseriesPost } from "@/types"
import { trackPageInSitemap } from "@/services/sitemap-tracker"

interface WebseriesItem {
  id: string
  title: string
  thumbnail: string
  duration: string
  quality: string
  link: string
}

interface WebseriesPageProps {
  oldWebseries: WebseriesItem[]
  webxseries: WebseriesItem[]
  currentPage: number
  provider: 'webseries' | 'webxseries'
  totalPagesOld: number
  totalPagesWebx: number
  totalItemsOld: number
  totalItemsWebx: number
}

export default function WebseriesPage({ 
  oldWebseries,
  webxseries,
  currentPage,
  provider: initialProvider,
  totalPagesOld,
  totalPagesWebx,
  totalItemsOld,
  totalItemsWebx
}: WebseriesPageProps) {
  const router = useRouter()
  const { setWebseriesPage } = useNavigation()
  const { isCollapsed } = useSidebar()
  const [activeProvider, setActiveProvider] = useState<'webseries' | 'webxseries'>(initialProvider)

  // Save current state to sessionStorage whenever page or provider changes
  useEffect(() => {
    const webseriesState = {
      page: currentPage,
      provider: activeProvider
    }
    sessionStorage.setItem('webseriesState', JSON.stringify(webseriesState))
  }, [currentPage, activeProvider])

  // Get current data based on active provider
  const currentData = activeProvider === 'webseries' ? oldWebseries : webxseries
  const totalPages = activeProvider === 'webseries' ? totalPagesOld : totalPagesWebx
  const totalItems = activeProvider === 'webseries' ? totalItemsOld : totalItemsWebx

  const handleWebseriesClick = (e: React.MouseEvent) => {
    // Save state before navigation
    const webseriesState = {
      page: currentPage,
      provider: activeProvider,
      scrollPosition: window.scrollY
    }
    sessionStorage.setItem('webseriesState', JSON.stringify(webseriesState))
    setWebseriesPage(currentPage)
  }

  const handleProviderSwitch = (provider: 'webseries' | 'webxseries') => {
    setActiveProvider(provider)
    // Reset to page 1 when switching providers
    if (provider !== initialProvider) {
      window.location.href = `/webseries?provider=${provider}`
    }
  }

  const handleBackClick = () => {
    router.push('/')
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
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={handleBackClick}
                className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
                title="Go back"
              >
                <ArrowLeft size={24} className="text-white" />
              </button>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <span className="w-1.5 h-8 bg-purple-500 rounded-full inline-block mr-3"></span>
                Latest Webseries & OTT Content
              </h1>
            </div>
            <p className="text-gray-400 ml-14">Discover the newest webseries and OTT platform content</p>
          </div>

          {/* Provider Switch */}
          <div className="mb-8 flex justify-center">
            <div className="inline-flex bg-gray-800/50 backdrop-blur-sm rounded-xl p-1.5 border border-gray-700/50">
              <button
                onClick={() => handleProviderSwitch('webseries')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeProvider === 'webseries'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-600/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Film size={20} />
                <span>Web Series</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  {totalItemsOld}
                </span>
              </button>
              <button
                onClick={() => handleProviderSwitch('webxseries')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeProvider === 'webxseries'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-lg shadow-cyan-600/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Tv size={20} />
                <span>OTT Platform</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  {totalItemsWebx}
                </span>
              </button>
            </div>
          </div>

          {/* Webseries grid */}
          {currentData.length > 0 ? (
            <>
              <div className={`grid gap-4 mb-8 ${
                isCollapsed 
                  ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' 
                  : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              }`}>
                {currentData.map((series) => (
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

                      {/* Duration badge */}
                      {series.duration && (
                        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-white flex items-center space-x-1">
                          <Clock size={12} />
                          <span>{series.duration}</span>
                        </div>
                      )}

                      {/* Provider badge */}
                      <div className="absolute top-2 left-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium backdrop-blur-sm ${
                          activeProvider === 'webseries' 
                            ? 'bg-gradient-to-r from-purple-500/90 to-pink-600/90 text-white' 
                            : 'bg-gradient-to-r from-cyan-500/90 to-blue-600/90 text-white'
                        }`}>
                          {activeProvider === 'webseries' ? '🎬 Web Series' : '📺 OTT Platform'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="text-white font-medium text-sm line-clamp-2 mb-2 group-hover:text-purple-400 transition-colors">
                        {series.title}
                      </h3>
                      {series.quality && (
                        <div className="mt-auto">
                          <span className={`inline-block px-2 py-1 text-xs rounded border ${
                            activeProvider === 'webseries'
                              ? 'bg-purple-600/20 text-purple-400 border-purple-500/30'
                              : 'bg-cyan-600/20 text-cyan-400 border-cyan-500/30'
                          }`}>
                            {series.quality}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700/50 backdrop-blur-sm">
              <h3 className="text-xl font-medium text-gray-400">No webseries available</h3>
              <p className="text-gray-500 mt-2">Check back later for new content.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <Link
                href={currentPage > 1 ? `/webseries?provider=${activeProvider}&page=${currentPage - 1}` : '#'}
                className={`p-2 rounded-lg bg-gray-800/70 text-white hover:bg-purple-600/80 transition-colors ${
                  currentPage === 1 ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                }`}
              >
                <ChevronLeft size={20} />
              </Link>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 7) {
                    pageNum = i + 1
                  } else if (currentPage <= 4) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i
                  } else {
                    pageNum = currentPage - 3 + i
                  }

                  return (
                    <Link
                      key={pageNum}
                      href={pageNum === 1 ? `/webseries?provider=${activeProvider}` : `/webseries?provider=${activeProvider}&page=${pageNum}`}
                      className={`min-w-[40px] h-10 flex items-center justify-center rounded-lg font-medium transition-all ${
                        currentPage === pageNum
                          ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                          : "bg-gray-800/70 text-gray-300 hover:bg-gray-700/70"
                      }`}
                    >
                      {pageNum}
                    </Link>
                  )
                })}
              </div>

              <Link
                href={currentPage < totalPages ? `/webseries?provider=${activeProvider}&page=${currentPage + 1}` : '#'}
                className={`p-2 rounded-lg bg-gray-800/70 text-white hover:bg-purple-600/80 transition-colors ${
                  currentPage === totalPages ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                }`}
              >
                <ChevronRight size={20} />
              </Link>
            </div>
          )}

          {/* Page info */}
          <div className="text-center mt-4 text-gray-400 text-sm">
            Page {currentPage} of {totalPages} • Total {totalItems} items
          </div>
        </div>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { page = '1', provider = 'webxseries' } = context.query
  const currentPage = parseInt(Array.isArray(page) ? page[0] : page, 10) || 1
  const activeProvider = (Array.isArray(provider) ? provider[0] : provider) as 'webseries' | 'webxseries'
  
  const itemsPerPage = 48 // Increased from 20 to 48
  
  try {
    console.log(`[SSR Webseries] Fetching ${activeProvider} data for page ${currentPage}`)
    
    let oldWebseries: WebseriesItem[] = []
    let webxseries: WebseriesItem[] = []
    let totalPagesOld = 1
    let totalPagesWebx = 1
    let totalItemsOld = 0
    let totalItemsWebx = 0
    
    const baseUrl = typeof window === 'undefined' 
      ? (process.env.NEXT_PUBLIC_API_BASE_URL || `http://localhost:${process.env.PORT || 3000}`)
      : window.location.origin
    
    console.log('[SSR Webseries] Base URL:', baseUrl)
    console.log('[SSR Webseries] Current page:', currentPage, 'Active provider:', activeProvider)
    
    // Fetch Old Webseries data if that's the active provider
    if (activeProvider === 'webseries') {
      try {
        // Use client-side API that handles the proxy
        const oldWebseriesUrl = `${baseUrl}/api/proxy/webseries/api/latest${currentPage === 1 ? '' : `/page${currentPage}`}`
        console.log('[SSR Webseries] Fetching old webseries from:', oldWebseriesUrl)
        
        const response = await fetch(oldWebseriesUrl, {
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          console.error('[SSR Webseries] Old webseries response not OK:', response.status, response.statusText)
          throw new Error(`HTTP ${response.status}`)
        }
        
        const data = await response.json()
        console.log('[SSR Webseries] Old webseries response keys:', Object.keys(data))
        
        if (data.posts && Array.isArray(data.posts)) {
          oldWebseries = data.posts.map((post: any) => {
            // Extract slug from the link or use the ID
            let slug = post.slug || post.id
            
            // If link exists and contains a slug, extract it
            if (post.link && typeof post.link === 'string') {
              const linkMatch = post.link.match(/\/([^\/]+)\/?$/)
              if (linkMatch && linkMatch[1]) {
                slug = linkMatch[1]
              }
            }
            
            return {
              id: post.id || slug,
              title: post.title,
              thumbnail: post.thumbnail,
              duration: post.duration || 'Unknown',
              quality: post.quality || 'HD',
              link: `/webseries/${slug}`, // Use internal route instead of external link
            }
          })
          
          console.log('[SSR Webseries] Transformed old webseries:', oldWebseries.length)
          
          // Update totals based on actual data
          if (oldWebseries.length > 0) {
            totalItemsOld = oldWebseries.length + (currentPage - 1) * 12
            totalPagesOld = Math.ceil(totalItemsOld / 12) + 10
          }
        } else {
          console.error('[SSR Webseries] Invalid old webseries response format, data:', data)
        }
      } catch (err) {
        console.error('[SSR Webseries] Error fetching old webseries:', err)
        // Set estimate even on error so button shows
        totalItemsOld = 100
        totalPagesOld = 10
      }
    } else {
      // Set estimates for old webseries when not active
      totalItemsOld = 100
      totalPagesOld = 10
    }
    
    // Fetch WebXSeries data if that's the active provider
    if (activeProvider === 'webxseries') {
      try {
        const webxUrl = `${baseUrl}/api/v2/providers/webxseries/videos?page=${currentPage}&limit=${itemsPerPage}`
        console.log('[SSR Webseries] Fetching webxseries from:', webxUrl)
        
        const response = await fetch(webxUrl, {
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        console.log('[SSR Webseries] WebXSeries response status:', response.status)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('[SSR Webseries] WebXSeries response not OK:', response.status, response.statusText, errorText)
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }
        
        const data = await response.json()
        console.log('[SSR Webseries] WebXSeries response:', {
          success: data.success,
          dataLength: data.data?.length,
          pagination: data.pagination,
          hasData: !!data.data
        })
        
        if (data.success && data.data && Array.isArray(data.data)) {
          webxseries = data.data.map((video: any) => ({
            id: video.id || video.slug,
            title: video.title,
            thumbnail: video.thumbnail || video.thumbnailUrl,
            duration: video.duration || 'Unknown',
            quality: video.categories?.[0] || 'OTT',
            link: `/provider/webxseries/video/${video.slug}`,
          }))
          
          console.log('[SSR Webseries] Transformed webxseries:', webxseries.length, 'items')
          
          // Get pagination info from response
          if (data.pagination) {
            totalItemsWebx = data.pagination.total || webxseries.length
            totalPagesWebx = data.pagination.totalPages || Math.ceil(totalItemsWebx / itemsPerPage)
            console.log('[SSR Webseries] WebXSeries pagination:', { total: totalItemsWebx, pages: totalPagesWebx })
          } else {
            totalItemsWebx = webxseries.length
            totalPagesWebx = currentPage // At least current page exists
            console.log('[SSR Webseries] No pagination info, using data length')
          }
        } else {
          console.error('[SSR Webseries] Invalid webxseries response format')
          console.error('[SSR Webseries] Response data:', JSON.stringify(data, null, 2))
        }
      } catch (err) {
        console.error('[SSR Webseries] Error fetching WebXSeries:', err)
      }
    } else {
      // Always fetch count for webxseries to show on button
      try {
        const webxCountUrl = `${baseUrl}/api/v2/providers/webxseries/videos?page=1&limit=1`
        console.log('[SSR Webseries] Fetching webxseries count from:', webxCountUrl)
        
        const webxCountResponse = await fetch(webxCountUrl, {
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (webxCountResponse.ok) {
          const webxCountData = await webxCountResponse.json()
          console.log('[SSR Webseries] WebXSeries count response:', webxCountData.pagination)
          
          if (webxCountData.success && webxCountData.pagination) {
            totalItemsWebx = webxCountData.pagination.total || 0
            totalPagesWebx = webxCountData.pagination.totalPages || 1
          }
        }
      } catch (err) {
        console.error('[SSR Webseries] Error fetching webxseries count:', err)
      }
    }
    
    console.log(`[SSR Webseries] ========== FINAL RESULTS ==========`)
    console.log(`[SSR Webseries] Active Provider: ${activeProvider}`)
    console.log(`[SSR Webseries] Old Webseries: ${oldWebseries.length} items, Total: ${totalItemsOld}, Pages: ${totalPagesOld}`)
    console.log(`[SSR Webseries] WebXSeries: ${webxseries.length} items, Total: ${totalItemsWebx}, Pages: ${totalPagesWebx}`)
    console.log(`[SSR Webseries] =====================================`)
    
    // Track webseries in sitemap (limit to first 10)
    const currentItems = activeProvider === 'webseries' ? oldWebseries : webxseries
    const itemsToTrack = currentItems.slice(0, 10)
    
    for (const item of itemsToTrack) {
      await trackPageInSitemap({
        type: 'webseries',
        data: {
          slug: item.id,
          title: item.title,
          provider: activeProvider,
          url: item.link,
          thumbnail: item.thumbnail
        }
      })
    }
    
    return {
      props: {
        oldWebseries,
        webxseries,
        currentPage,
        provider: activeProvider,
        totalPagesOld,
        totalPagesWebx,
        totalItemsOld,
        totalItemsWebx,
      },
    }
  } catch (error) {
    console.error('[SSR Webseries] Fatal error:', error)
    
    return {
      props: {
        oldWebseries: [],
        webxseries: [],
        currentPage: 1,
        provider: activeProvider,
        totalPagesOld: 1,
        totalPagesWebx: 1,
        totalItemsOld: 0,
        totalItemsWebx: 0,
      },
    }
  }
}

interface WebseriesItem {
  id: string
  title: string
  thumbnail: string
  duration: string
  quality: string
  link: string
}
