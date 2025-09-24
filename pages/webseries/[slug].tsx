"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import { ArrowLeft, Clock, Eye, Lock, Film, User, Tag, ChevronUp, ChevronDown } from "lucide-react"
import Link from "next/link"
import { fetchWebseriesDetails, fetchLatestWebseries, fetchCreators } from "@/services/api"
import { useNavigation } from "@/contexts/NavigationContext"
import MembershipCheck from "@/components/MembershipCheck"
import CreatorCard from "@/components/CreatorCard"
import type { WebseriesDetails } from "@/types"

// Define an extended interface for our processed video data
interface ProcessedVideoData extends WebseriesDetails {
  video: WebseriesDetails['video'] & {
    iframeSrc?: string | null;
    views?: string;
  };
  playerIframe?: string;
}

export default function WebseriesVideoPage() {
  const router = useRouter()
  const { slug } = router.query
  const { navigationState } = useNavigation()

  const [videoData, setVideoData] = useState<ProcessedVideoData | null>(null)
  const [relatedSeries, setRelatedSeries] = useState<any[]>([])
  const [creators, setCreators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTags, setShowTags] = useState(false)

  // Extract a formatted title from the slug for SEO and display purposes
  const formattedTitle =
    typeof slug === "string"
      ? slug
          .split("-")
          .join(" ")
          .replace(/\b\w/g, (l) => l.toUpperCase())
      : "Webseries"

  // Back button handler with proper page
  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const pageQuery = navigationState.webseriesPage > 1 ? `?page=${navigationState.webseriesPage}` : '';
    router.push(`/webseries${pageQuery}`);
  };

  // Function to extract iframe src from HTML string
  const extractIframeSrc = (html: string): string | null => {
    if (!html) return null

    // Try to extract the src attribute from an iframe tag
    const srcMatch = html.match(/src=["'](https:\/\/player\.premiumhub\.workers\.dev\/[^"']+)["']/)
    if (srcMatch && srcMatch[1]) {
      return srcMatch[1]
    }

    // If no match found, return null
    return null
  }

  useEffect(() => {
    async function loadVideoData() {
      if (!slug) return

      try {
        setLoading(true)
        setError(null)

        // Fetch video data using the slug
        const data = await fetchWebseriesDetails(slug as string)

        if (!data || !data.success) {
          throw new Error("Failed to load video data")
        }

        // Get the iframe source from either location
        const iframeSrc = extractIframeSrc(data.video.playerIframe || (data as any).playerIframe || "")
        
        // Process the video data
        const processedData: ProcessedVideoData = {
          ...data,
          video: {
            ...data.video,
            iframeSrc,
          }
        }

        setVideoData(processedData)

        // Fetch related content - use a random page between 1-5 to get variety
        const randomPage = Math.floor(Math.random() * 5) + 1
        const relatedData = await fetchLatestWebseries(randomPage)

        if (relatedData && relatedData.posts) {
          // Filter out the current video if it's in the related content
          const filteredPosts = relatedData.posts.filter((post: any) => {
            // If the post has a link property that includes the current slug, filter it out
            return !post.link.includes(slug as string)
          })

          // Take up to 6 related videos
          setRelatedSeries(filteredPosts.slice(0, 6))
        }

        // Fetch random creators for the sidebar
        // Use a random country code from this list
        const countries = ["us", "in", "gb", "ca", "au", "fr", "de", "jp", "br", "mx"]
        const randomCountry = countries[Math.floor(Math.random() * countries.length)]
        const randomCreatorPage = Math.floor(Math.random() * 3) + 1

        const creatorsData = await fetchCreators(randomCountry, randomCreatorPage)
        if (creatorsData && creatorsData.creators) {
          // Take 4 creators for the sidebar
          setCreators(creatorsData.creators.slice(0, 4))
        }
      } catch (err) {
        console.error("Error loading video:", err)
        setError("Failed to load video. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    loadVideoData()
  }, [slug])

  return (
    <>
      <Head>
        <title>{videoData?.video?.title || formattedTitle} - PremiumHUB</title>
        <meta name="description" content={videoData?.video?.description || `Watch ${formattedTitle} on PremiumHUB`} />
        {/* Other meta tags... */}
      </Head>

      <div className="pb-10">
        <div className="container mx-auto px-4">
          {/* Back button */}
          <div className="mb-4">
            <a
              href="#"
              onClick={handleBackClick}
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} className="mr-1" />
              <span>Back to Webseries</span>
            </a>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded mb-6">{error}</div>
          )}

          {/* Loading state */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : videoData ? (
            <>
              {/* Video title and info */}
              <div className="bg-gray-900 rounded-xl overflow-hidden shadow-xl mb-6">
                <div className="p-4 md:p-6 border-b border-gray-800">
                  <h1 className="text-xl md:text-2xl font-bold text-white mb-2">{videoData.video.title || formattedTitle}</h1>

                  <div className="flex items-center text-gray-400 text-sm">
                    {videoData.video.duration && (
                      <div className="flex items-center mr-4">
                        <Clock size={14} className="mr-1" />
                        <span>{videoData.video.duration}</span>
                      </div>
                    )}
                    {videoData.video.views && (
                      <div className="flex items-center">
                        <Eye size={14} className="mr-1" />
                        <span>{videoData.video.views} views</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Video player and sidebar layout */}
                <div className="flex flex-col lg:flex-row">
                  {/* Video player - responsive container */}
                  <div className="lg:w-3/4">
                    <div className="relative aspect-video bg-black">
                      <MembershipCheck
                        fallbackComponent={
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-80 p-6 text-center">
                            <div className="mb-4 p-3 bg-purple-600 rounded-full">
                              <Lock size={24} className="text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Premium Content</h3>
                            <p className="text-gray-300 mb-4">
                              This content is available exclusively for premium members.
                            </p>
                            <Link
                              href="/membership"
                              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              Upgrade Now
                            </Link>
                          </div>
                        }
                      >
                        <div className="absolute inset-0">
                          {videoData.video.source ? (
                            // Use the source URL directly with the player prefix
                            <iframe
                              src={`https://player.premiumhub.workers.dev/${videoData.video.source}`}
                              className="w-full h-full"
                              frameBorder="0"
                              allowFullScreen
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            ></iframe>
                          ) : videoData.video.iframeSrc ? (
                            // Use the extracted iframe src if available
                            <iframe
                              src={videoData.video.iframeSrc}
                              className="w-full h-full"
                              frameBorder="0"
                              allowFullScreen
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            ></iframe>
                          ) : videoData.video.url ? (
                            // Use the direct URL if available
                            <iframe
                              src={`https://player.premiumhub.workers.dev/${videoData.video.url}`}
                              className="w-full h-full"
                              frameBorder="0"
                              allowFullScreen
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            ></iframe>
                          ) : (
                            // Fallback message if no video source is available
                            <div className="flex items-center justify-center h-full bg-gray-900">
                              <p className="text-gray-400">Video unavailable</p>
                            </div>
                          )}
                        </div>
                      </MembershipCheck>
                    </div>
                  </div>

                  {/* Sidebar with creators - desktop only */}
                  <div className="hidden lg:block lg:w-1/4 bg-gray-800/50 p-4">
                    <div className="mb-4 flex items-center">
                      <User size={18} className="mr-2 text-purple-400" />
                      <h3 className="text-lg font-semibold text-white">Popular Creators</h3>
                    </div>
                    <div className="space-y-4">
                      {creators.map((creator, index) => (
                        <Link
                          key={index}
                          href={`/creator/${creator.slug}`}
                          className="flex items-center p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="w-12 h-12 rounded-full overflow-hidden mr-3 flex-shrink-0">
                            <img
                              src={creator.avatarUrl || "/api/placeholder?height=100&width=100&query=creator"}
                              alt={creator.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.onerror = null
                                target.src = "/api/placeholder?height=100&width=100&query=creator"
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium truncate">{creator.name}</h4>
                            <div className="flex items-center text-xs text-gray-400">
                              <Film size={12} className="mr-1" />
                              <span>{creator.stats.videoCount} videos</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Video description */}
                {videoData.video.description && (
                  <div className="p-4 md:p-6 border-t border-gray-800">
                    <h2 className="text-lg font-semibold text-white mb-2">Description</h2>
                    <p className="text-gray-400 whitespace-pre-line">{videoData.video.description}</p>
                  </div>
                )}

                {/* Tags */}
                {videoData.video.tags && (
                  <div className="p-4 md:p-6 border-t border-gray-800">
                    <h2 className="text-lg font-semibold text-white mb-3">Tags</h2>
                    <button
                      onClick={() => setShowTags(!showTags)}
                      className="flex items-center text-purple-400 hover:text-purple-300 mb-2"
                    >
                      <Tag size={18} className="mr-2" />
                      <span className="font-medium">Show Tags</span>
                      {showTags ? <ChevronUp size={18} className="ml-2" /> : <ChevronDown size={18} className="ml-2" />}
                    </button>

                    {showTags && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {videoData.video.tags.split(",").map((tag: string, index: number) => (
                          <span key={index} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Related Content Section */}
              {relatedSeries.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-bold text-white mb-4">Related Web Series</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {relatedSeries.map((series, index) => (
                      <Link
                        key={index}
                        href={series.link}
                        className="bg-gray-900 rounded-lg overflow-hidden transition-transform hover:scale-105"
                      >
                        <div className="aspect-video relative">
                          <img
                            src={series.thumbnail || `/placeholder.svg?height=180&width=320`}
                            alt={series.title}
                            className="w-full h-full object-cover"
                          />
                          {series.duration && (
                            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                              {series.duration}
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <h3 className="text-sm font-medium text-white line-clamp-2">{series.title}</h3>
                          {series.quality && (
                            <span className="text-xs text-purple-400 mt-1 inline-block">{series.quality}</span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile-only creators section */}
              {creators.length > 0 && (
                <div className="mt-8 lg:hidden">
                  <h2 className="text-xl font-bold text-white mb-4">Popular Creators</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {creators.map((creator, index) => (
                      <CreatorCard key={index} creator={creator} />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-gray-800 rounded-lg">
              <h3 className="text-xl font-medium text-gray-400">Video not found</h3>
              <p className="text-gray-500 mt-2">The requested video could not be found.</p>
              <Link
                href="/webseries"
                className="mt-4 inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                Browse Webseries
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
