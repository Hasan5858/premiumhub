import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import { ArrowLeft, Clock, Eye, Lock, Film, User, Tag, ChevronUp, ChevronDown } from "lucide-react"
import Link from "next/link"
import { fetchWebseriesDetails, fetchLatestWebseries } from "@/services/api"
import { useNavigation } from "@/contexts/NavigationContext"
import MembershipCheck from "@/components/MembershipCheck"
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

        // Check if we're loading a specific episode/video from query params
        const episodeId = router.query.episode as string | undefined
        const videoId = router.query.video as string | undefined

        // Fetch video data using the slug
        const data = await fetchWebseriesDetails(slug as string)

        if (!data || !data.success) {
          throw new Error("Failed to load video data")
        }

        // If we have episodes/videos array and a specific episode/video ID requested
        let selectedVideo = data.video
        if ((episodeId || videoId) && (data.episodes || data.videos)) {
          const targetArray = data.episodes || data.videos
          const targetId = episodeId || videoId
          
          // Find the specific episode/video
          const found = targetArray.find((item: any) => 
            item.id === targetId || 
            item.id === `episode-${targetId}` || 
            item.id === `video-${targetId}` ||
            (typeof targetId === 'string' && parseInt(targetId) && targetArray[parseInt(targetId) - 1])
          )
          
          if (found) {
            // Use the found episode/video data
            selectedVideo = {
              ...data.video,
              ...found,
              // Ensure we use the episode's source/url
              source: found.source || found.url || data.video.source,
              url: found.url || found.source || data.video.url,
              playerIframe: found.playerIframe || data.video.playerIframe,
              title: found.title || data.video.title,
              description: found.description || data.video.description,
            }
          }
        }

        // Get the iframe source from either location
        const iframeSrc = extractIframeSrc(selectedVideo.playerIframe || (data as any).playerIframe || "")
        
        // Process the video data
        const processedData: ProcessedVideoData = {
          ...data,
          video: {
            ...selectedVideo,
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

              {/* Episodes Section - Show episodes if available */}
              {videoData.episodes && videoData.episodes.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-bold text-white mb-4">Episodes</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {videoData.episodes.map((episode, index) => {
                      // Generate slug for episode link
                      const episodeSlug = episode.title 
                        ? episode.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').substring(0, 100)
                        : `episode-${index + 1}`
                      
                      return (
                        <Link
                          key={episode.id || index}
                          href={`/webseries/${slug}?episode=${episode.id || index + 1}`}
                          className="bg-gray-900 rounded-lg overflow-hidden transition-transform hover:scale-105"
                        >
                          <div className="aspect-video relative">
                            <img
                              src={episode.thumbnail || videoData.video.poster || `/placeholder.svg?height=180&width=320`}
                              alt={episode.title || `Episode ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {episode.duration && (
                              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                {episode.duration}
                              </div>
                            )}
                          </div>
                          <div className="p-2">
                            <h3 className="text-sm font-medium text-white line-clamp-2">
                              {episode.title || `Episode ${index + 1}`}
                            </h3>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Videos Section - Show videos if available (alternative to episodes) */}
              {videoData.videos && videoData.videos.length > 0 && !videoData.episodes && (
                <div className="mt-8">
                  <h2 className="text-xl font-bold text-white mb-4">Videos</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {videoData.videos.map((video, index) => {
                      // Generate slug for video link
                      const videoSlug = video.title 
                        ? video.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').substring(0, 100)
                        : `video-${index + 1}`
                      
                      return (
                        <Link
                          key={video.id || index}
                          href={`/webseries/${slug}?video=${video.id || index + 1}`}
                          className="bg-gray-900 rounded-lg overflow-hidden transition-transform hover:scale-105"
                        >
                          <div className="aspect-video relative">
                            <img
                              src={video.thumbnail || videoData.video.poster || `/placeholder.svg?height=180&width=320`}
                              alt={video.title || `Video ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {video.duration && (
                              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                {video.duration}
                              </div>
                            )}
                          </div>
                          <div className="p-2">
                            <h3 className="text-sm font-medium text-white line-clamp-2">
                              {video.title || `Video ${index + 1}`}
                            </h3>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

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
