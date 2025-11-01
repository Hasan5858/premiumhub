"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import { ArrowLeft, Clock, Eye, Lock, Film, User, Tag, ChevronUp, ChevronDown } from "lucide-react"
import Link from "next/link"
import { fetchProviderVideoDetails } from "@/services/api"
import { useNavigation } from "@/contexts/NavigationContext"
import MembershipCheck from "@/components/MembershipCheck"
import { useAuth } from "@/contexts/AuthContext"
import dynamic from 'next/dynamic'
import type Artplayer from 'artplayer'

// Dynamically import ArtPlayer to avoid SSR issues
const ArtPlayer = dynamic(() => import('@/components/ArtPlayer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-black flex items-center justify-center">
      <div className="text-gray-400">Loading player...</div>
    </div>
  ),
})

export default function ProviderVideoPage() {
  const router = useRouter()
  const { provider, id } = router.query
  const { navigationState } = useNavigation()
  const { user } = useAuth()

  const [videoData, setVideoData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTags, setShowTags] = useState(false)
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
        if (isSlug) {
          // Use slug-based API endpoint
          const baseUrl = typeof window !== 'undefined' 
            ? window.location.origin 
            : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
          
          // Check if we came from a category and pass the category URL
          const categorySlug = router.query.cat
          let apiUrl = `${baseUrl}/api/providers/${provider}/video-by-slug/${id}`
          
          // If viewing from a category, we need to pass the category URL to the API
          // We'll need to reconstruct it from the category slug
          if (categorySlug && typeof categorySlug === 'string') {
            const categoryUrl = `https://www.indianpornhq.com/${categorySlug}/`
            apiUrl += `?cat_url=${encodeURIComponent(categoryUrl)}`
          }
          
          const response = await fetch(apiUrl)
          data = await response.json()
        } else {
          // Use original ID-based API endpoint
          data = await fetchProviderVideoDetails(provider as string, id as string)
        }

        if (!data || !data.success) {
          throw new Error("Failed to load video data")
        }

        // Ensure we have the data object
        if (!data.data) {
          throw new Error("No video data received")
        }

        setVideoData(data)

      } catch (err) {
        console.error("Error loading video:", err)
        setError("Failed to load video. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    loadVideoData()
  }, [id, provider])

  // Cleanup ArtPlayer on unmount
  useEffect(() => {
    return () => {
      if (artPlayerRef.current) {
        artPlayerRef.current.destroy(false)
        artPlayerRef.current = null
      }
    }
  }, [])


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
          {/* Back button - Modern design */}
          <button
            onClick={handleBackClick}
            className="group mb-6 inline-flex items-center text-gray-300 hover:text-white transition-all duration-200 font-medium"
          >
            <div className="mr-2 p-1.5 rounded-lg bg-gray-800/50 group-hover:bg-purple-600/20 transition-colors">
              <ArrowLeft size={18} className="group-hover:translate-x-[-2px] transition-transform" />
            </div>
            <span>{getBackButtonText()}</span>
          </button>

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
                {/* Video Player Section */}
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
                          {/* Check if it's a direct video URL for ArtPlayer */}
                          {(isIndianPornHQ && videoData.data?.video_url?.match(/\.(mp4|webm|ogg|avi|mov|m3u8)(\?|$)/i)) ||
                           (videoData.data?.video_url?.match(/\.(mp4|webm|ogg|avi|mov|m3u8)(\?|$)/i)) ? (
                            // Use ArtPlayer for direct video URLs
                            <ArtPlayer
                              option={{
                                url: videoData.data.video_url,
                                poster: videoData.data?.thumbnail_url || '',
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
                                  crossOrigin: 'anonymous',
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
                          ) : isIndianPornHQ && videoData.data?.embed_url ? (
                            // Use embed URL if available
                            <iframe
                              src={videoData.data.embed_url}
                              className="w-full h-full"
                              frameBorder="0"
                              allowFullScreen
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            ></iframe>
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
    </>
  )
}
