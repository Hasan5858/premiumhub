import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import Link from "next/link"
import { ChevronDown, ChevronUp, Clock, Eye, Tag, User, Film, ArrowLeft } from "lucide-react"
import { fetchVideoData } from "@/services/api"
import MembershipCheck from "@/components/MembershipCheck"


// Mock video data for fallback
const mockVideoData = {
  title: "Sample Video Title",
  description: "This is a sample video description that will be displayed when the actual video data fails to load.",
  thumbnail: "/api/placeholder?height=720&width=1280&query=video%20thumbnail",
  playerIframe:
    '<iframe src="https://player.premiumhub.workers.dev/https://example.com/sample-video.mp4" width="100%" height="500px" frameborder="0" allowfullscreen></iframe>',
  keywords: ["sample", "video", "premium", "content"],
  relatedVideos: [
    {
      id: "related-1",
      title: "Related Video 1",
      pageUrl: "https://example.com/video/related-1",
      thumbnail: "/api/placeholder?height=300&width=500&query=related%20video%201",
      duration: "10:15",
      views: "24.5K",
      quality: "HD",
    },
    {
      id: "related-2",
      title: "Related Video 2",
      pageUrl: "https://example.com/video/related-2",
      thumbnail: "/api/placeholder?height=300&width=500&query=related%20video%202",
      duration: "08:30",
      views: "18.2K",
      quality: "4K",
    },
    {
      id: "related-3",
      title: "Related Video 3",
      pageUrl: "https://example.com/video/related-3",
      thumbnail: "/api/placeholder?height=300&width=500&query=related%20video%203",
      duration: "12:45",
      views: "32.7K",
      quality: "HD",
    },
    {
      id: "related-4",
      title: "Related Video 4",
      pageUrl: "https://example.com/video/related-4",
      thumbnail: "/api/placeholder?height=300&width=500&query=related%20video%204",
      duration: "07:20",
      views: "15.9K",
      quality: "HD",
    },
  ],
}

export default function VideoPage() {
  const router = useRouter()
  const { id, from, page, webseriesSlug, webseriesPage, categorySlug, categoryPage, videoData: videoDataParam } = router.query
  const [videoData, setVideoData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTags, setShowTags] = useState(false)

  useEffect(() => {
    const loadVideoData = async () => {
      if (!id || typeof id !== "string") return

      try {
        setLoading(true)
        setError(null)

        // If the video is from a category, the format is different
        if (from === "category" && videoDataParam) {
          try {
            // Try to parse video data from query params first
            let parsedVideoData = null;
            if (typeof videoDataParam === 'string') {
              parsedVideoData = JSON.parse(videoDataParam);
            }
            
            if (parsedVideoData) {
              console.log("Using video data from query params for category video");
              setVideoData({
                ...parsedVideoData,
                // Ensure we have a playerIframe property for the template
                playerIframe: `<iframe src="https://suppn.premiumhub.workers.dev/${parsedVideoData.url}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`
              });
              setLoading(false);
              return;
            }
          } catch (err) {
            console.error("Error parsing video data from query params:", err);
            // Continue with standard fetch if parsing fails
          }
        }

        // Extract the video ID from the URL if it contains a full URL
        const videoId = id.includes("https://") ? id : `https://xhamster.desi/videos/${id}`

        try {
          const data = await fetchVideoData(videoId)
          if (data) {
            setVideoData(data)
          } else {
            console.error("No video data returned from API")
            throw new Error("Failed to fetch video data");
          }
        } catch (err) {
          console.error("Error fetching video data:", err)
          
          // If this is a category video and we have a categorySlug, use different player format
          if (from === "category" && categorySlug) {
            // Create a minimal video object for category videos
            setVideoData({
              id,
              title: id.split("-").join(" ").replace(/\b\w/g, (l) => l.toUpperCase()),
              description: "Video description not available",
              thumbnail: `/api/placeholder?height=720&width=1280&query=${encodeURIComponent(id)}`,
              url: `https://www.superporn.com/es/video/${id}`,
              playerIframe: `<iframe src="https://suppn.premiumhub.workers.dev/https://www.superporn.com/es/video/${id}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`,
              keywords: [],
              relatedVideos: []
            });
          } else {
            throw err; // Re-throw for standard error handling
          }
        }

      } catch (err) {
        console.error("Error loading video data:", err)
        setError("Failed to load video. Please try again later.")
        setVideoData(mockVideoData)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadVideoData()
    }
  }, [id, router.query])

  // Format view count with commas
  const formatViews = (viewsStr: string) => {
    if (!viewsStr) return "0"
    return viewsStr.replace(/,/g, ",")
  }

  // Create a preview element for the membership check
  const renderPreview = () => (
    <div className="video-container rounded-lg overflow-hidden bg-black">
      <img
        src={videoData?.thumbnail || "/api/placeholder?height=720&width=1280&query=video%20thumbnail"}
        alt={videoData?.title || "Video thumbnail"}
        className="w-full h-full object-cover opacity-50"
      />
    </div>
  )

  // Render the video player based on where the video came from
  const renderVideoPlayer = () => {
    // Special handling for category videos
    if (from === "category") {
      return (
        <div className="relative aspect-video bg-black">
          <iframe
            src={`https://suppn.premiumhub.workers.dev/${videoData.url}`}
            className="absolute inset-0 w-full h-full"
            frameBorder="0"
            allowFullScreen
            title={videoData.title}
          ></iframe>
        </div>
      );
    }
    
    // Standard player for non-category videos
    return (
      <div className="relative aspect-video bg-black">
        <div
          className="absolute inset-0"
          dangerouslySetInnerHTML={{
            __html: videoData.playerIframe
              ? videoData.playerIframe
                  .replace('width="100%"', 'width="100%"')
                  .replace('height="500px"', 'height="100%"')
              : `<iframe src="https://player.premiumhub.workers.dev/https://example.com/sample-video.mp4" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`,
          }}
        />
      </div>
    );
  };

  // Determine back button URL based on query parameters
  const getBackUrl = () => {
    if (from === "webseries" && webseriesSlug) {
      // Back to webseries page
      const pageParam = webseriesPage ? `?page=${webseriesPage}` : ""
      return `/webseries/${webseriesSlug}${pageParam}`
    } else if (from === "category" && router.query.categorySlug) {
      // Check if this came from a provider page
      if (router.query.provider) {
        // Back to provider category page
        const providerName = router.query.provider
        const categorySlug = router.query.categorySlug
        const pageParam = router.query.categoryPage && router.query.categoryPage !== '1' 
          ? `&page=${router.query.categoryPage}` 
          : ""
        return `/provider/${providerName}?cat=${categorySlug}${pageParam}`
      } else {
        // Back to standalone category page
        const categoryPage = router.query.categoryPage ? `?page=${router.query.categoryPage}` : ""
        return `/category/${router.query.categorySlug}${categoryPage}`
      }
    } else {
      // Default fallback to homepage
      return "/"
    }
  }

  return (
    <>
      <Head>
        <title>{videoData ? `${videoData.title} - PremiumHUB` : "Video - PremiumHUB"}</title>
        <meta name="description" content={videoData ? videoData.description || videoData.title : "Watch premium video content"} />
      </Head>

      <div className="pb-10 bg-gray-900">
        {loading ? (
          <div className="container mx-auto px-4 py-16 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : error ? (
          <div className="container mx-auto px-4 py-8">
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded">{error}</div>
          </div>
        ) : videoData ? (
          <div className="container mx-auto px-4">
            {/* Back button */}
            <div className="mb-4">
              <Link 
                href={getBackUrl()}
                className="inline-flex items-center text-gray-300 hover:text-purple-400 transition-colors bg-gray-800/40 px-3 py-1.5 rounded-lg"
              >
                <ArrowLeft size={16} className="mr-1" />
                <span>Back</span>
              </Link>
            </div>

            {/* Video title */}
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">{videoData.title}</h1>

            {/* Video Player with Membership Check and Sidebar */}
            <div className="flex flex-col lg:flex-row mb-6 bg-gray-800 rounded-lg overflow-hidden">
              {/* Video Player */}
              <div className="lg:w-3/4">
                <MembershipCheck fallbackComponent={renderPreview()}>
                  {renderVideoPlayer()}
                </MembershipCheck>
              </div>

            </div>

            {/* This Video Info */}
            <div className="mb-8">
              <div className="text-gray-400 mb-4">{videoData.description}</div>

              {/* Tags Section */}
              {videoData.keywords && videoData.keywords.length > 0 && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowTags(!showTags)}
                    className="flex items-center text-purple-400 hover:text-purple-300 mb-2"
                  >
                    <Tag size={18} className="mr-2" />
                    <span className="font-medium">Tags</span>
                    {showTags ? <ChevronUp size={18} className="ml-2" /> : <ChevronDown size={18} className="ml-2" />}
                  </button>

                  {showTags && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {videoData.keywords.filter(Boolean).map((tag: string, index: number) => (
                        <Link
                          key={index}
                          href={`/search?q=${encodeURIComponent(tag)}`}
                          className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm transition-colors"
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Related Videos */}
            {videoData.relatedVideos && videoData.relatedVideos.length > 0 && (
              <div className="mt-10">
                <h2 className="text-xl font-bold text-white mb-6">Related Videos</h2>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {videoData.relatedVideos.map((video: any, index: number) => (
                    <Link
                      key={index}
                      href={`/video/${encodeURIComponent(video.pageUrl || `video-${index}`)}`}
                      className="group bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-all duration-300"
                    >
                      <div className="aspect-video relative">
                        <img
                          src={video.thumbnail || "/api/placeholder?height=300&width=500&query=video%20thumbnail"}
                          alt={video.title || "Video thumbnail"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.onerror = null
                            target.src = "/api/placeholder?height=300&width=500&query=video%20thumbnail"
                          }}
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                        {/* Quality badge */}
                        {video.quality && (
                          <div className="absolute top-2 left-2 bg-purple-600/90 text-white text-xs px-2 py-1 rounded">
                            {video.quality}
                          </div>
                        )}

                        {/* Duration badge */}
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center">
                          <Clock size={12} className="mr-1" />
                          {video.duration || "00:00"}
                        </div>
                      </div>

                      <div className="p-3">
                        <h3 className="text-white text-sm font-medium line-clamp-2 group-hover:text-purple-400 transition-colors">
                          {video.title || "Video Title"}
                        </h3>
                        <div className="flex items-center mt-2 text-xs text-gray-400">
                          <Eye size={12} className="mr-1" />
                          <span>{formatViews(video.views || "0")} views</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : null}
      </div>
    </>
  )
}
