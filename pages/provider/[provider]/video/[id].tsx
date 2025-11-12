import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import { ArrowLeft, Clock, Eye, Lock, Film, User, Tag, ChevronUp, ChevronDown, Search, X } from "lucide-react"
import Link from "next/link"
import { fetchProviderVideoDetails } from "@/services/api"
import { useNavigation } from "@/contexts/NavigationContext"
import MembershipCheck from "@/components/MembershipCheck"
import { useAuth } from "@/contexts/AuthContext"
import dynamic from 'next/dynamic'
import type Artplayer from 'artplayer'
import { GetServerSideProps } from "next"

// Dynamically import ArtPlayer to avoid SSR issues
const ArtPlayer = dynamic(() => import('@/components/ArtPlayer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-black flex items-center justify-center">
      <div className="text-gray-400">Loading player...</div>
    </div>
  ),
})

interface ProviderVideoPageProps {
  initialVideoData?: any
}

export default function ProviderVideoPage({ initialVideoData }: ProviderVideoPageProps) {
  const router = useRouter()
  const { provider, id } = router.query
  const { navigationState } = useNavigation()
  const { user } = useAuth()

  const [videoData, setVideoData] = useState<any>(initialVideoData || null)
  const [loading, setLoading] = useState(!initialVideoData)
  const [error, setError] = useState<string | null>(null)
  const [showTags, setShowTags] = useState(false)
  const [iframeLoading, setIframeLoading] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const artPlayerRef = useRef<Artplayer | null>(null)

  // Normalize provider to string (handle array case from router.query)
  const providerName = typeof provider === 'string' ? provider : Array.isArray(provider) ? provider[0] : ''
  const isIndianPornHQ = providerName === 'indianpornhq'

  // Check if user has premium access
  const hasPremiumAccess =
    user &&
    (user.membership_status === "monthly" ||
      user.membership_status === "3month" ||
      user.membership_status === "halfyearly" ||
      user.membership_status === "yearly" ||
      user.membership_status === "admin")

  // Extract a formatted title from the ID for SEO and display purposes
  const formattedTitle =
    typeof id === "string"
      ? decodeURIComponent(id)
          .replace(/[?&=]/g, ' ')
          .split("-")
          .join(" ")
          .replace(/\b\w/g, (l) => l.toUpperCase())
      : "Video"

  // Get category info if viewing from a category
  const categorySlug = router.query.cat && typeof router.query.cat === 'string' ? router.query.cat : null
  
  // Format category name for display (convert slug to readable name)
  const getCategoryName = (slug: string) => {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
  
  // Back button handler with proper page and category
  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Check if we came from a category page (via URL query param)
    if (categorySlug) {
      // Navigate back to category page
      router.push(`/provider/${provider}?cat=${categorySlug}`)
      return
    }
    
    // Otherwise, navigate back to provider page with saved page number
    const pageQuery = navigationState.providerPage > 1 ? `?page=${navigationState.providerPage}` : '';
    router.push(`/provider/${provider}${pageQuery}`);
  };
  
  // Get back button text
  const getBackButtonText = () => {
    if (categorySlug) {
      return `Back to ${getCategoryName(categorySlug)}`
    }
    return `Back to ${getProviderName(provider as string)}`
  }

  useEffect(() => {
    async function loadVideoData() {
      // Skip loading if we already have initial data from SSR
      if (initialVideoData) {
        console.log('[Client] Using SSR data, skipping fetch')
        return
      }

      if (!id || !provider) return

      try {
        setLoading(true)
        setError(null)

        // Check if the ID looks like a slug (contains hyphens and doesn't start with special chars)
        const isSlug = typeof id === 'string' && 
          id.includes('-') && 
          !id.startsWith('?') && 
          !id.startsWith('http') &&
          !id.includes('%')

        let data
        
        // Providers that should use the unified API
        const unifiedProviders = ['fsiblog5', 'indianpornhq', 'superporn', 'kamababa', 'webxseries']
        const useUnifiedApi = unifiedProviders.includes(providerName)
        
        if (isSlug && useUnifiedApi) {
          // Use unified API endpoint
          const baseUrl = typeof window !== 'undefined' 
            ? window.location.origin 
            : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
          
          // Check if we came from a category and pass the category slug
          const categorySlug = router.query.cat
          let apiUrl = `${baseUrl}/api/v2/providers/${provider}/video/${id}`
          
          // If viewing from a category, pass the category slug as a query parameter
          if (categorySlug && typeof categorySlug === 'string') {
            apiUrl += `?categorySlug=${encodeURIComponent(categorySlug)}`
          }
          
          const response = await fetch(apiUrl)
          data = await response.json()
          
          // The unified API returns data directly, but we need to wrap it
          // to match the expected structure
          if (data.success && data.data) {
            // Already in correct format
          } else if (data.success && !data.data) {
            // Wrap the result in data property if needed
            const videoData = { ...data }
            delete videoData.success
            data = {
              success: true,
              data: videoData
            }
          }
        } else if (isSlug) {
          // Use legacy slug-based API endpoint for older providers
          const baseUrl = typeof window !== 'undefined' 
            ? window.location.origin 
            : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
          
          // Check if we came from a category and pass the category parameter
          const categorySlug = router.query.cat
          let apiUrl = `${baseUrl}/api/providers/${provider}/video-by-slug/${id}`
          
          // Pass category context for proper video index lookup
          if (categorySlug && typeof categorySlug === 'string') {
            if (provider === 'fsiblog5') {
              // FSIBlog5 uses category slug for proper URL construction
              apiUrl += `?cat=${encodeURIComponent(categorySlug)}`
            } else if (provider === 'indianpornhq') {
              // IndianPornHQ needs category URL to fetch correct video by index from that category
              const categoryUrl = `https://www.indianpornhq.com/${categorySlug}/`
              apiUrl += `?cat_url=${encodeURIComponent(categoryUrl)}`
            }
          }
          
          const response = await fetch(apiUrl)
          data = await response.json()
          
          // Normalize FSIBlog response structure (uses 'video' instead of 'data')
          if (data.success && data.video && !data.data) {
            data.data = data.video
          }
        } else {
          // Use original ID-based API endpoint
          data = await fetchProviderVideoDetails(provider as string, id as string)
        }

        if (!data || !data.success) {
          console.error("API returned unsuccessful response:", data)
          throw new Error(data?.error || "Failed to load video data")
        }

        // Ensure we have the data object
        if (!data.data) {
          console.error("No video data in response:", data)
          throw new Error("No video data received")
        }

        // Log video data for debugging
        console.log("Video data loaded:", {
          title: data.data.title,
          type: data.data.type,
          has_video_url: !!data.data.video_url,
          has_embed_url: !!data.data.embed_url,
          has_gallery: !!data.data.galleryImages,
          gallery_count: data.data.galleryImages?.length || 0,
          video_url: data.data.video_url,
          embed_url: data.data.embed_url
        })

        setVideoData(data)
        setIframeLoading(true) // Reset iframe loading state for new video

      } catch (err) {
        console.error("Error loading video:", err)
        const errorMessage = err instanceof Error ? err.message : "Failed to load video. Please try again later."
        
        // Provide more specific error messages
        if (errorMessage.includes("404") || errorMessage.includes("not found")) {
          setError("Video not found. It may have been removed or the link is incorrect.")
        } else if (errorMessage.includes("Network") || errorMessage.includes("fetch")) {
          setError("Network error. Please check your connection and try again.")
        } else {
          setError(errorMessage)
        }
      } finally {
        setLoading(false)
      }
    }

    loadVideoData()
  }, [id, provider, initialVideoData])

  // Cleanup ArtPlayer on unmount
  useEffect(() => {
    return () => {
      if (artPlayerRef.current) {
        artPlayerRef.current.destroy(false)
        artPlayerRef.current = null
      }
    }
  }, [])

  // Lightbox functions for gallery images
  const openLightbox = (index: number) => {
    setCurrentImageIndex(index)
    setLightboxOpen(true)
    document.body.style.overflow = 'hidden' // Prevent background scrolling
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    document.body.style.overflow = 'unset'
  }

  const nextImage = () => {
    if (videoData?.data?.galleryImages) {
      setCurrentImageIndex((prev) => 
        prev === videoData.data.galleryImages.length - 1 ? 0 : prev + 1
      )
    }
  }

  const prevImage = () => {
    if (videoData?.data?.galleryImages) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? videoData.data.galleryImages.length - 1 : prev - 1
      )
    }
  }

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return
      
      if (e.key === 'Escape') {
        closeLightbox()
      } else if (e.key === 'ArrowRight') {
        nextImage()
      } else if (e.key === 'ArrowLeft') {
        prevImage()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen, currentImageIndex])

  const getProviderName = (providerName: string) => {
    const names: Record<string, string> = {
      'indianpornhq': 'IndianPornHQ',
      'desi': 'Desi Provider',
      'fsiblog5': 'FSIBlog'
    }
    return names[providerName] || providerName
  }

  return (
    <>
      <Head>
        <title>{videoData?.data?.title || formattedTitle} - {getProviderName(provider as string)}</title>
        <meta name="description" content={videoData?.data?.description || `Watch ${formattedTitle} on PremiumHUB`} />
        <style jsx global>{`
          /* ArtPlayer Container Styles - Responsive */
          .art-video-player {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            background: #000 !important;
          }

          .art-video-player .art-video {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100% !important;
            height: 100% !important;
          }

          .art-video-player video {
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            object-fit: cover !important;
          }

          /* ArtPlayer theme customization */
          .art-video-player .art-control-progress-inner {
            background: rgba(139, 92, 246, 0.9) !important;
          }

          .art-video-player .art-control-progress {
            background: rgba(139, 92, 246, 0.3) !important;
          }

          .art-video-player .art-control-volume-panel {
            background: rgba(139, 92, 246, 0.9) !important;
          }

          .art-video-player .art-icon:hover {
            color: rgba(139, 92, 246, 1) !important;
          }

          .art-video-player .art-layers .art-layer-auto-playback {
            background: rgba(139, 92, 246, 0.1) !important;
          }

          .art-video-player .art-bottom {
            background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent) !important;
          }

          .art-video-player .art-control {
            background: rgba(0, 0, 0, 0.8) !important;
          }
          
          /* Ensure parent containers are properly sized */
          .art-video-player * {
            box-sizing: border-box;
          }

          .art-video-player .art-layers,
          .art-video-player .art-subtitle,
          .art-video-player .art-danmaku,
          .art-video-player .art-mask,
          .art-video-player .art-bottom {
            width: 100% !important;
          }

          /* Responsive adjustments */
          @media (max-width: 768px) {
            .art-video-player {
              border-radius: 0 !important;
            }
          }
          
          @media (max-width: 640px) {
            .art-video-player {
              min-height: 200px;
            }
          }
          
          /* Fix for mobile landscape */
          @media (orientation: landscape) and (max-height: 500px) {
            .art-video-player video {
              object-fit: contain !important;
            }
          }

          /* Modern App-like Animations */
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }

          /* Smooth transitions for all interactive elements */
          * {
            transition-property: color, background-color, border-color, transform, opacity, box-shadow;
            transition-duration: 200ms;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          }

          /* Modern scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }

          ::-webkit-scrollbar-track {
            background: rgba(17, 24, 39, 0.5);
            border-radius: 10px;
          }

          ::-webkit-scrollbar-thumb {
            background: rgba(139, 92, 246, 0.5);
            border-radius: 10px;
          }

          ::-webkit-scrollbar-thumb:hover {
            background: rgba(139, 92, 246, 0.7);
          }

          /* Card hover effects */
          .bg-gray-800\/50:hover {
            background-color: rgba(31, 41, 55, 0.6);
          }
        `}</style>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Navigation buttons - Back and Search */}
          <div className="mb-6 flex items-center justify-between">
            {/* Back button - Modern design */}
            <button
              onClick={handleBackClick}
              className="group inline-flex items-center text-gray-300 hover:text-white transition-all duration-200 font-medium"
            >
              <div className="mr-2 p-1.5 rounded-lg bg-gray-800/50 group-hover:bg-purple-600/20 transition-colors">
                <ArrowLeft size={18} className="group-hover:translate-x-[-2px] transition-transform" />
              </div>
              <span>{getBackButtonText()}</span>
            </button>

            {/* Search button - Modern design */}
            <button
              onClick={() => setSearchOpen(true)}
              className="group inline-flex items-center text-gray-300 hover:text-white transition-all duration-200 font-medium"
            >
              <div className="p-1.5 rounded-lg bg-gray-800/50 group-hover:bg-purple-600/20 transition-colors">
                <Search size={18} className="group-hover:scale-110 transition-transform" />
              </div>
            </button>
          </div>

          {/* Search Modal */}
          {searchOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => {
                  setSearchOpen(false)
                  setSearchQuery('')
                }}
              />
              {/* Modal */}
              <div className="relative z-10 w-full max-w-2xl mx-4 sm:mx-auto">
                <div className="bg-gray-900 rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-700/30">
                    <h3 className="text-xl font-bold text-white">Search Videos</h3>
                    <button
                      onClick={() => {
                        setSearchOpen(false)
                        setSearchQuery('')
                      }}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <X size={20} className="text-gray-400 hover:text-white transition-colors" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Enter search query..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && searchQuery.trim()) {
                            router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
                            setSearchOpen(false)
                            setSearchQuery('')
                          }
                        }}
                        autoFocus
                        className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:bg-gray-800 transition-colors"
                      />
                      <button
                        onClick={() => {
                          if (searchQuery.trim()) {
                            router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
                            setSearchOpen(false)
                            setSearchQuery('')
                          }
                        }}
                        disabled={!searchQuery.trim()}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-purple-500/50 transform hover:scale-105 disabled:hover:scale-100"
                      >
                        Search
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error message - Modern alert */}
          {error && (
            <div className="mb-6 rounded-2xl bg-red-500/10 backdrop-blur-sm border border-red-500/30 p-4 shadow-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3 p-2 bg-red-500/20 rounded-xl">
                  <Film size={20} className="text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-red-400 mb-1">{error}</p>
                  <p className="text-sm text-red-300/80">Please try refreshing the page or contact support if the issue persists.</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading state - Modern spinner */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/20 border-t-purple-500"></div>
                <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-transparent border-r-purple-600/40" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
              <p className="mt-4 text-gray-400 font-medium">Loading video...</p>
            </div>
          ) : videoData ? (
            <div className="space-y-6">
              {/* Video Player Card - Main Content */}
              <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/30 overflow-hidden">
                {/* Conditional rendering: Video Player OR Image Gallery */}
                {videoData.data?.type === 'sex-gallery' && videoData.data?.galleryImages && videoData.data.galleryImages.length > 0 ? (
                  /* Image Gallery Section */
                  <div className="p-6 md:p-8">
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                        <Film size={24} className="mr-2 text-purple-400" />
                        Image Gallery ({videoData.data.galleryImages.length} images)
                      </h2>
                    </div>
                    
                    <MembershipCheck
                      fallbackComponent={
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {/* Show only first 4 images as preview for non-premium */}
                          {videoData.data.galleryImages.slice(0, 4).map((imgUrl: string, index: number) => (
                            <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                              <img
                                src={`https://fsiblog5.premiumhub.workers.dev/?url=${encodeURIComponent(imgUrl)}`}
                                alt={`Gallery image ${index + 1}`}
                                className="w-full h-full object-cover blur-md grayscale"
                              />
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <div className="text-center">
                                  <Lock size={32} className="text-white mb-2 mx-auto" />
                                  <p className="text-white text-sm font-medium">Premium Only</p>
                                </div>
                              </div>
                            </div>
                          ))}
                          <div className="col-span-2 md:col-span-3 lg:col-span-4 mt-4 text-center">
                            <Link
                              href="/membership"
                              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-purple-500/50 transform hover:scale-105"
                            >
                              <Lock size={20} className="mr-2" />
                              Upgrade to View All {videoData.data.galleryImages.length} Images
                            </Link>
                          </div>
                        </div>
                      }
                    >
                      {/* Full gallery for premium users */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {videoData.data.galleryImages.map((imgUrl: string, index: number) => (
                          <button
                            key={index}
                            onClick={() => openLightbox(index)}
                            className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <img
                              src={`https://fsiblog5.premiumhub.workers.dev/?url=${encodeURIComponent(imgUrl)}`}
                              alt={`Gallery image ${index + 1}`}
                              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="absolute bottom-2 left-2 right-2">
                                <p className="text-white text-sm font-medium">Click to view full size</p>
                              </div>
                            </div>
                            {/* Image number badge */}
                            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-lg text-xs font-medium">
                              {index + 1}/{videoData.data.galleryImages.length}
                            </div>
                          </button>
                        ))}
                      </div>
                    </MembershipCheck>
                  </div>
                ) : (
                  /* Video Player Section */
                  <div className="relative w-full aspect-video bg-black">
                  <MembershipCheck
                    fallbackComponent={
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-sm p-8 text-center">
                        <div className="mb-6 p-4 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl shadow-xl">
                          <Lock size={32} className="text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Premium Content</h3>
                        <p className="text-gray-300 mb-6 max-w-md">
                          This content is available exclusively for premium members. Upgrade now to unlock unlimited access.
                        </p>
                        <Link
                          href="/membership"
                          className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-purple-500/50 transform hover:scale-105"
                        >
                          Upgrade Now
                        </Link>
                      </div>
                    }
                  >
                    <div className="absolute inset-0">
                          {/* Priority 1: Use direct video URLs with ArtPlayer */}
                          {((isIndianPornHQ && videoData.data?.video_url?.match(/\.(mp4|webm|ogg|avi|mov|m3u8)(\?|$)/i)) ||
                           (provider === 'fsiblog5' && videoData.data?.videoUrl?.match(/\.(mp4|webm|ogg|avi|mov|m3u8)(\?|$)/i)) ||
                           (provider === 'kamababa' && videoData.data?.videoUrl?.match(/\.(mp4|webm|ogg|avi|mov|m3u8)(\?|$)/i)) ||
                           (provider === 'webxseries' && videoData.data?.videoUrl?.match(/\.(mp4|webm|ogg|avi|mov|m3u8)(\?|$)/i)) ||
                           (videoData.data?.video_url?.match(/\.(mp4|webm|ogg|avi|mov|m3u8)(\?|$)/i))) ? (
                            // Use ArtPlayer for direct video URLs
                            <ArtPlayer
                              option={{
                                // FSIBlog needs proxying through worker, but Kamababa and WebXSeries CDN URLs are direct
                                url: provider === 'fsiblog5' && videoData.data.videoUrl
                                  ? `https://fsiblog5.premiumhub.workers.dev/?url=${encodeURIComponent(videoData.data.videoUrl)}`
                                  : (videoData.data.videoUrl || videoData.data.video_url),
                                // FSIBlog thumbnails need proxying, Kamababa and WebXSeries thumbnails are already direct/proxied
                                poster: provider === 'fsiblog5' && (videoData.data?.thumbnail || videoData.data?.thumbnail_url)
                                  ? `https://fsiblog5.premiumhub.workers.dev/?url=${encodeURIComponent(videoData.data.thumbnail || videoData.data.thumbnail_url)}`
                                  : (videoData.data?.thumbnail || videoData.data?.thumbnail_url || ''),
                                title: videoData.data?.title || formattedTitle,
                                volume: 0.5,
                                isLive: false,
                                muted: false,
                                autoplay: false,
                                pip: true,
                                autoSize: false,
                                autoMini: false,
                                screenshot: true,
                                setting: true,
                                loop: false,
                                flip: true,
                                playbackRate: true,
                                aspectRatio: true,
                                fullscreen: true,
                                fullscreenWeb: true,
                                subtitleOffset: true,
                                miniProgressBar: true,
                                mutex: true,
                                backdrop: true,
                                playsInline: true,
                                autoPlayback: true,
                                airplay: true,
                                theme: '#8b5cf6',
                                lang: 'en',
                                moreVideoAttr: {
                                  // Only use crossOrigin for providers that properly support CORS
                                  // FSIBlog, Kamababa, and WebXSeries don't need crossOrigin attribute
                                  ...(provider !== 'fsiblog5' && provider !== 'kamababa' && provider !== 'webxseries' && { crossOrigin: 'anonymous' }),
                                  preload: 'metadata',
                                  style: 'width: 100%; height: 100%; object-fit: cover;',
                                },
                              }}
                              getInstance={(art) => {
                                artPlayerRef.current = art
                              }}
                              style={{
                                width: '100%',
                                height: '100%',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                              }}
                            />
                          ) : (provider === 'webxseries' || provider === 'superporn') && videoData.data?.embedUrl && !videoData.data?.videoUrl ? (
                            // WebXSeries and Superporn use embed URLs
                            <>
                              {iframeLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                                  <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500/20 border-t-purple-500 mx-auto mb-4"></div>
                                    <p className="text-gray-400">Loading player...</p>
                                  </div>
                                </div>
                              )}
                              <iframe
                                src={videoData.data.embedUrl}
                                className="w-full h-full"
                                frameBorder="0"
                                allowFullScreen
                                scrolling="no"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                onError={(e) => {
                                  console.error("Embed player failed to load:", videoData.data?.embedUrl)
                                  setIframeLoading(false)
                                }}
                                onLoad={() => {
                                  console.log("Embed player loaded successfully:", videoData.data?.embedUrl)
                                  setIframeLoading(false)
                                }}
                              ></iframe>
                            </>
                          ) : isIndianPornHQ && videoData.data?.xhamster_embed_url ? (
                            // Priority 2: Use xHamster worker proxy (ad-free player)
                            <>
                              {iframeLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                                  <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500/20 border-t-purple-500 mx-auto mb-4"></div>
                                    <p className="text-gray-400">Loading player...</p>
                                  </div>
                                </div>
                              )}
                              <iframe
                                src={videoData.data.xhamster_embed_url}
                                className="w-full h-full"
                                frameBorder="0"
                                allowFullScreen
                                scrolling="no"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                onError={(e) => {
                                  console.error("Worker player failed to load:", videoData.data?.xhamster_embed_url)
                                  setIframeLoading(false)
                                }}
                                onLoad={() => {
                                  console.log("Worker player loaded successfully:", videoData.data?.xhamster_embed_url)
                                  setIframeLoading(false)
                                }}
                              ></iframe>
                            </>
                          ) : isIndianPornHQ && videoData.data?.embed_url ? (
                            // Priority 3: Use Indian PornHQ embed URL (fallback)
                            <>
                              {iframeLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black">
                                  <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500/20 border-t-purple-500 mx-auto mb-4"></div>
                                    <p className="text-gray-400">Loading player...</p>
                                  </div>
                                </div>
                              )}
                              <iframe
                                src={videoData.data.embed_url}
                                className="w-full h-full"
                                frameBorder="0"
                                allowFullScreen
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                onError={(e) => {
                                  console.error("Iframe failed to load:", videoData.data?.embed_url)
                                  setIframeLoading(false)
                                }}
                                onLoad={() => {
                                  console.log("Iframe loaded successfully:", videoData.data?.embed_url)
                                  setIframeLoading(false)
                                }}
                              ></iframe>
                            </>
                          ) : isIndianPornHQ && videoData.data?.video_url ? (
                            // Use video_url directly with player prefix (encode for query params)
                            <iframe
                              src={`https://player.premiumhub.workers.dev/${encodeURIComponent(videoData.data.video_url)}`}
                              className="w-full h-full"
                              frameBorder="0"
                              allowFullScreen
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            ></iframe>
                          ) : videoData.data?.video_url ? (
                            // Use iframe for page URLs (for non-IndianPornHQ providers)
                            <iframe
                              src={videoData.data.video_url}
                              className="w-full h-full"
                              frameBorder="0"
                              allowFullScreen
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                            ></iframe>
                          ) : videoData.data?.embed_url ? (
                            // Use iframe for embed URLs (for non-IndianPornHQ providers)
                            <iframe
                              src={videoData.data.embed_url}
                              className="w-full h-full"
                              frameBorder="0"
                              allowFullScreen
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                            ></iframe>
                          ) : (
                            // Fallback message if no video source is available
                            <div className="flex items-center justify-center h-full bg-gray-900">
                              <div className="text-center">
                                <div className="mb-4 p-3 bg-purple-600 rounded-full inline-block">
                                  <Film size={24} className="text-white" />
                                </div>
                                <p className="text-gray-400 mb-2">Video unavailable</p>
                                <p className="text-gray-500 text-sm">Please try again later</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </MembershipCheck>
                  </div>
                )}

                {/* Video Info Section */}
                <div className="p-6 md:p-8">
                  {/* Title and Meta Info */}
                  <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
                      {videoData.data?.title || formattedTitle}
                    </h1>
                    
                    {/* Meta Badges */}
                    <div className="flex flex-wrap items-center gap-4">
                      {videoData.data?.duration && (
                        <div className="inline-flex items-center px-4 py-2 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50">
                          <Clock size={16} className="mr-2 text-purple-400" />
                          <span className="text-gray-300 font-medium">{videoData.data.duration}</span>
                        </div>
                      )}
                      {videoData.data?.views && (
                        <div className="inline-flex items-center px-4 py-2 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50">
                          <Eye size={16} className="mr-2 text-purple-400" />
                          <span className="text-gray-300 font-medium">{videoData.data.views} views</span>
                        </div>
                      )}
                      <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600/20 to-purple-700/20 backdrop-blur-sm rounded-xl border border-purple-500/30">
                        <Film size={16} className="mr-2 text-purple-400" />
                        <span className="text-gray-300 font-medium">{getProviderName(provider as string)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description Section */}
                  {videoData.data?.description && (
                    <div className="mb-6 p-6 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30">
                      <h2 className="text-lg font-bold text-white mb-3 flex items-center">
                        <div className="mr-2 w-1 h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
                        Description
                      </h2>
                      <p className="text-gray-300 leading-relaxed whitespace-pre-line">{videoData.data.description}</p>
                    </div>
                  )}

                  {/* Tags Section */}
                  {videoData.data?.tags && videoData.data.tags.length > 0 && (
                    <div className="mb-6 p-6 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30">
                      <button
                        onClick={() => setShowTags(!showTags)}
                        className="flex items-center text-purple-400 hover:text-purple-300 transition-colors mb-4 font-semibold group"
                      >
                        <Tag size={20} className="mr-2 group-hover:scale-110 transition-transform" />
                        <span>Tags</span>
                        <div className="ml-auto transform transition-transform duration-200" style={{ transform: showTags ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                          <ChevronDown size={20} />
                        </div>
                      </button>

                      {showTags && (
                        <div className="flex flex-wrap gap-2.5 animate-fadeIn">
                          {videoData.data.tags.map((tag: string, index: number) => (
                            <span 
                              key={index} 
                              className="px-4 py-2 bg-gradient-to-r from-gray-700/50 to-gray-800/50 hover:from-purple-600/30 hover:to-purple-700/30 text-gray-300 hover:text-white rounded-xl text-sm font-medium border border-gray-600/50 hover:border-purple-500/50 transition-all duration-200 cursor-default"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Related Videos Section */}
                  {videoData.data?.relatedVideos && videoData.data.relatedVideos.length > 0 && (
                    <div className="mt-6 p-6 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30">
                      <h2 className="text-lg font-bold text-white mb-4 flex items-center">
                        <Film size={20} className="mr-2 text-purple-400" />
                        Related Videos ({videoData.data.relatedVideos.length})
                      </h2>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {videoData.data.relatedVideos.map((relatedVideo: any) => (
                          <Link
                            key={relatedVideo.id}
                            href={`/provider/${provider}/video/${relatedVideo.slug}${categorySlug ? `?cat=${categorySlug}` : ''}`}
                            className="group block"
                          >
                            <div className="relative aspect-video rounded-xl overflow-hidden mb-2">
                              <img
                                src={relatedVideo.thumbnail || '/api/placeholder?height=180&width=320&query=video'}
                                alt={relatedVideo.title}
                                className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
                                loading="lazy"
                              />
                              {relatedVideo.duration && (
                                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white font-medium">
                                  {relatedVideo.duration}
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                            <h3 className="text-sm text-gray-300 group-hover:text-white font-medium line-clamp-2 transition-colors">
                              {relatedVideo.title}
                            </h3>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/30">
              <div className="mb-6 p-5 bg-gradient-to-br from-purple-600/20 to-purple-700/20 rounded-2xl inline-block">
                <Film size={40} className="text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-200 mb-3">Video not found</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">The requested video could not be found or is no longer available.</p>
              <div className="space-y-4">
                <Link
                  href={`/provider/${provider}`}
                  className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-purple-500/50 transform hover:scale-105"
                >
                  Browse {getProviderName(provider as string)}
                </Link>
                <p className="text-sm text-gray-500">Try refreshing the page or check back later.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal for Gallery Images */}
      {lightboxOpen && videoData?.data?.galleryImages && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center">
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-all duration-200 group"
            aria-label="Close lightbox"
          >
            <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-black/70 rounded-full">
            <span className="text-white font-medium">
              {currentImageIndex + 1} / {videoData.data.galleryImages.length}
            </span>
          </div>

          {/* Previous button */}
          {videoData.data.galleryImages.length > 1 && (
            <button
              onClick={prevImage}
              className="absolute left-4 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-all duration-200 group"
              aria-label="Previous image"
            >
              <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Main image */}
          <div className="max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
            <img
              src={`https://fsiblog5.premiumhub.workers.dev/?url=${encodeURIComponent(videoData.data.galleryImages[currentImageIndex])}`}
              alt={`Gallery image ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Next button */}
          {videoData.data.galleryImages.length > 1 && (
            <button
              onClick={nextImage}
              className="absolute right-4 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-all duration-200 group"
              aria-label="Next image"
            >
              <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Click outside to close */}
          <div
            className="absolute inset-0 -z-10"
            onClick={closeLightbox}
          />

          {/* Download button */}
          <a
            href={`https://fsiblog5.premiumhub.workers.dev/?url=${encodeURIComponent(videoData.data.galleryImages[currentImageIndex])}`}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 right-4 z-10 p-3 bg-purple-600 hover:bg-purple-700 rounded-full transition-all duration-200 group"
            aria-label="Download image"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>

          {/* Keyboard hints */}
          <div className="absolute bottom-4 left-4 z-10 px-4 py-2 bg-black/70 rounded-lg">
            <p className="text-white text-sm">
              <span className="font-medium">ESC</span> to close • 
              <span className="font-medium"> ←→</span> to navigate
            </p>
          </div>
        </div>
      )}
    </>
  )
}

/**
 * Server-side rendering to fetch video data before page renders
 * This ensures the video data is available immediately
 */
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { provider, id } = context.params as { provider: string; id: string }
  const { cat } = context.query as { cat?: string }
  
  try {
    // Validate required parameters
    if (!provider || !id) {
      return { notFound: true }
    }

    let videoData = null

    try {
      // Determine if ID is a slug or raw video ID
      const isSlug = typeof id === 'string' && 
        id.includes('-') && 
        !id.startsWith('?') && 
        !id.startsWith('http') &&
        !id.includes('%')
      
      let apiPath: string
      
      // Providers that use the unified API
      const unifiedProviders = ['fsiblog5', 'indianpornhq', 'superporn', 'kamababa', 'webxseries']
      const useUnifiedApi = unifiedProviders.includes(provider)
      
      if (isSlug && useUnifiedApi) {
        // Use unified API endpoint for modern providers
        apiPath = `/api/v2/providers/${provider}/video/${encodeURIComponent(id)}`
        
        // Pass category slug for unified API
        if (cat) {
          apiPath += `?categorySlug=${encodeURIComponent(cat)}`
        }
      } else if (isSlug) {
        // Use legacy slug-based API endpoint for older providers
        apiPath = `/api/providers/${provider}/video-by-slug/${encodeURIComponent(id)}`
        
        // Pass category context for proper video index lookup (legacy API)
        if (cat) {
          if (provider === 'fsiblog5') {
            // FSIBlog5 uses category slug for proper URL construction
            apiPath += `?cat=${encodeURIComponent(cat)}`
          } else if (provider === 'indianpornhq') {
            // IndianPornHQ needs category URL to fetch correct video by index from that category
            const categoryUrl = `https://www.indianpornhq.com/${cat}/`
            apiPath += `?cat_url=${encodeURIComponent(categoryUrl)}`
          }
        }
      } else {
        // ID is a raw video ID (query string or direct ID)
        // Use video/[id] endpoint
        apiPath = `/api/providers/${provider}/video/${encodeURIComponent(id)}`
      }
      
      console.log(`[getServerSideProps] ID type: ${isSlug ? 'slug' : 'raw'}, API path: ${apiPath}`)
      
      // Construct full URL for server-side fetch
      const protocol = context.req.headers['x-forwarded-proto'] || 'http'
      const host = context.req.headers.host
      const url = `${protocol}://${host}${apiPath}`
      
      console.log(`[getServerSideProps] Fetching from: ${url}`)
      
      const response = await fetch(url, { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Normalize response structure - FSIBlog uses 'video', others use 'data'
          if (data.video && !data.data) {
            data.data = data.video
          }
          
          if (data.data) {
            videoData = data
            console.log(`[getServerSideProps] Successfully fetched video data for ${provider}/${id}`)
          } else {
            console.error(`[getServerSideProps] API response missing video data:`, data)
          }
        } else {
          console.error(`[getServerSideProps] API response not successful:`, data.error)
        }
      } else {
        console.error(`[getServerSideProps] API returned status ${response.status}`)
      }
    } catch (error) {
      console.error(`[getServerSideProps] Failed to fetch video from API: ${error}`)
    }

    // If no video data found or unsuccessful response
    if (!videoData || !videoData.success || !videoData.data) {
      console.error(`[getServerSideProps] No valid video data found for ${provider}/${id}, returning 404`)
      return { notFound: true }
    }

    console.log(`[getServerSideProps] Returning props with video data`)
    // Return video data as props with cache control headers
    context.res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    )
    context.res.setHeader('Pragma', 'no-cache')
    context.res.setHeader('Expires', '0')
    
    return {
      props: {
        initialVideoData: videoData
      }
    }
  } catch (error) {
    console.error(`[getServerSideProps] Unexpected error: ${error}`)
    return { notFound: true }
  }
}
