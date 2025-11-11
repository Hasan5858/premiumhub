import { GetServerSideProps } from "next"
import Head from "next/head"
import Link from "next/link"
import { Play, Clock, ChevronLeft, ChevronRight } from "lucide-react"
import { useNavigation } from "@/contexts/NavigationContext"
import { useSidebar } from "@/contexts/SidebarContext"
import type { WebseriesPost } from "@/types"

interface MergedWebseries {
  id: string
  title: string
  thumbnail: string
  duration: string
  quality: string
  link: string
  source: 'webseries' | 'webxseries'
  badge: string
}

interface WebseriesPageProps {
  mergedWebseries: MergedWebseries[]
  currentPage: number
  totalPages: number
  totalItems: number
}

export default function WebseriesPage({ 
  mergedWebseries, 
  currentPage, 
  totalPages,
  totalItems 
}: WebseriesPageProps) {
  const { setWebseriesPage } = useNavigation()
  const { isCollapsed } = useSidebar()

  const itemsPerPage = 20
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedWebseries = mergedWebseries.slice(startIndex, endIndex)

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
              Latest Webseries & OTT Content
            </h1>
            <p className="text-gray-400 ml-4">Discover the newest webseries and OTT platform content</p>
          </div>

          {/* Webseries grid */}
          {paginatedWebseries.length > 0 ? (
            <>
              <div className={`grid gap-5 mb-8 ${
                isCollapsed 
                  ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6' 
                  : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              }`}>
                {paginatedWebseries.map((series) => (
                  <Link
                    key={`${series.source}-${series.id}`}
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

                      {/* Source badge */}
                      <div className="absolute top-2 left-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium backdrop-blur-sm ${
                          series.source === 'webseries' 
                            ? 'bg-gradient-to-r from-purple-500/90 to-pink-600/90 text-white' 
                            : 'bg-gradient-to-r from-cyan-500/90 to-blue-600/90 text-white'
                        }`}>
                          {series.badge}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="text-white font-medium text-sm line-clamp-2 mb-2 group-hover:text-purple-400 transition-colors">
                        {series.title}
                      </h3>
                      {series.quality && (
                        <div className="mt-auto">
                          <span className="inline-block px-2 py-1 bg-purple-600/20 text-purple-400 text-xs rounded border border-purple-500/30">
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
                href={currentPage > 1 ? `/webseries?page=${currentPage - 1}` : '#'}
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
                      href={pageNum === 1 ? '/webseries' : `/webseries?page=${pageNum}`}
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
                href={currentPage < totalPages ? `/webseries?page=${currentPage + 1}` : '#'}
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
            Page {currentPage} of {totalPages} • Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} items
          </div>
        </div>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { page = '1' } = context.query
  const currentPage = parseInt(Array.isArray(page) ? page[0] : page, 10) || 1
  
  try {
    console.log(`[SSR] Fetching data for page ${currentPage}`)
    
    // Calculate how many pages we need to fetch
    const itemsPerPage = 20
    const requiredItems = currentPage * itemsPerPage
    
    // With 2:1 ratio, we need (requiredItems * 2/3) old webseries items
    // Assuming ~12 items per page, calculate pages needed
    const neededOldPages = Math.ceil((requiredItems * 2) / 3 / 12)
    const pagesToFetch = Math.max(neededOldPages, 5) // Minimum 5 pages
    
    console.log(`[SSR] Need ${requiredItems} items, fetching ${pagesToFetch} pages of old webseries`)
    
    // Fetch old webseries pages
    const oldWebseriesPromises = []
    for (let p = 1; p <= pagesToFetch; p++) {
      oldWebseriesPromises.push(
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/webseries/api/latest${p === 1 ? '' : `/page${p}`}`)
          .then(res => res.json())
          .catch(err => {
            console.error(`Error fetching old webseries page ${p}:`, err)
            return { posts: [] }
          })
      )
    }
    
    // Fetch WebXSeries - calculate how many we need
    const neededWebXSeries = Math.ceil((requiredItems * 1) / 3)
    const webxseriesLimit = Math.max(neededWebXSeries, 150)
    
    console.log(`[SSR] Fetching ${webxseriesLimit} WebXSeries items`)
    
    const webxseriesPromise = fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/v2/providers/webxseries/videos?page=1&limit=${webxseriesLimit}`
    )
      .then(res => res.json())
      .catch(err => {
        console.error('Error fetching WebXSeries:', err)
        return { success: false, data: [] }
      })
    
    // Wait for all fetches to complete
    const [oldWebseriesResults, webxseriesResult] = await Promise.all([
      Promise.all(oldWebseriesPromises),
      webxseriesPromise
    ])
    
    // Combine all old webseries
    const allOldWebseries = oldWebseriesResults.flatMap(result => result.posts || [])
    const allWebXSeries = webxseriesResult.success ? webxseriesResult.data : []
    
    console.log(`[SSR] Fetched ${allOldWebseries.length} old webseries, ${allWebXSeries.length} WebXSeries`)
    
    // Transform old webseries
    const oldWebseries = allOldWebseries.map((post: any) => ({
      id: post.id,
      title: post.title,
      thumbnail: post.thumbnail,
      duration: post.duration,
      quality: post.quality || 'HD',
      link: post.link,
      source: 'webseries' as const,
      badge: '🎬 Web Series',
    }))

    // Transform WebXSeries
    const newWebxseries = allWebXSeries.map((video: any) => ({
      id: video.id || video.slug,
      title: video.title,
      thumbnail: video.thumbnail || video.thumbnailUrl,
      duration: video.duration || 'Unknown',
      quality: video.categories?.[0] || 'OTT',
      link: `/provider/webxseries/video/${video.slug}`,
      source: 'webxseries' as const,
      badge: '📺 OTT Platform',
    }))

    // Interleave both sources: 2 old, 1 new, repeat
    const merged: MergedWebseries[] = []
    let oldIndex = 0
    let newIndex = 0
    
    while (oldIndex < oldWebseries.length || newIndex < newWebxseries.length) {
      // Add 2 from old webseries
      if (oldIndex < oldWebseries.length) {
        merged.push(oldWebseries[oldIndex++])
      }
      if (oldIndex < oldWebseries.length) {
        merged.push(oldWebseries[oldIndex++])
      }
      
      // Add 1 from webxseries
      if (newIndex < newWebxseries.length) {
        merged.push(newWebxseries[newIndex++])
      }
    }
    
    console.log(`[SSR] Merged ${merged.length} total items`)
    
    const totalItems = merged.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    
    // If requested page is beyond available pages, redirect to last page
    if (currentPage > totalPages && totalPages > 0) {
      return {
        redirect: {
          destination: `/webseries?page=${totalPages}`,
          permanent: false,
        },
      }
    }
    
    return {
      props: {
        mergedWebseries: merged,
        currentPage,
        totalPages,
        totalItems,
      },
    }
  } catch (error) {
    console.error('[SSR] Error fetching webseries:', error)
    
    return {
      props: {
        mergedWebseries: [],
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
      },
    }
  }
}

interface MergedWebseries {
  id: string
  title: string
  thumbnail: string
  duration: string
  quality: string
  link: string
  source: 'webseries' | 'webxseries'
  badge: string
}
