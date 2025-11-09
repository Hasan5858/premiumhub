import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import Link from "next/link"
import { ChevronDown, ChevronUp, Clock, Eye, Tag, User, Film } from "lucide-react"
import { fetchCategoryVideos } from "@/services/api"
import MembershipCheck from "@/components/MembershipCheck"

// Mock related videos for fallback
const mockRelatedVideos = [
  {
    id: "rebeca-linares-en-una-tijera-salvaje-con-dildo-incluido",
    title: "Rebeca Linares en una tijera salvaje con dildo incluído",
    url: "https://www.superporn.com/es/video/rebeca-linares-en-una-tijera-salvaje-con-dildo-incluido",
    thumbnailUrl: "https://img.superporn.com/videos/316/316/thumbs/thumbs_0012_custom_1643713618.3354.jpg",
    duration: "08:00",
    views: "30.4k",
    models: [
      {
        slug: "rebeca-linares",
        name: "Rebeca Linares",
      },
    ],
    categories: [
      {
        slug: "big-tits",
        name: "Big tits",
      },
      {
        slug: "lesbian",
        name: "Lesbian",
      },
      {
        slug: "sex-toys",
        name: "Sex Toys",
      },
    ],
  },
  {
    id: "video-example-2",
    title: "Amazing Video Experience 2",
    url: "https://www.superporn.com/es/video/video-example-2",
    thumbnailUrl: "/api/placeholder?height=300&width=500&query=video%20thumbnail%202",
    duration: "12:30",
    views: "45.2k",
    models: [
      {
        slug: "model-2",
        name: "Model Name 2",
      },
    ],
    categories: [
      {
        slug: "category-1",
        name: "Category 1",
      },
    ],
  },
  {
    id: "video-example-3",
    title: "Incredible Content 3",
    url: "https://www.superporn.com/es/video/video-example-3",
    thumbnailUrl: "/api/placeholder?height=300&width=500&query=video%20thumbnail%203",
    duration: "07:45",
    views: "18.9k",
    models: [
      {
        slug: "model-3",
        name: "Model Name 3",
      },
    ],
    categories: [
      {
        slug: "category-2",
        name: "Category 2",
      },
    ],
  },
  {
    id: "video-example-4",
    title: "Premium Content 4",
    url: "https://www.superporn.com/es/video/video-example-4",
    thumbnailUrl: "/api/placeholder?height=300&width=500&query=video%20thumbnail%204",
    duration: "10:15",
    views: "22.7k",
    models: [
      {
        slug: "model-4",
        name: "Model Name 4",
      },
    ],
    categories: [
      {
        slug: "category-3",
        name: "Category 3",
      },
    ],
  },
]


export default function CategoryVideoPage() {
  const router = useRouter()
  const { id } = router.query
  const [videoData, setVideoData] = useState<any>(null)
  const [relatedVideos, setRelatedVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTags, setShowTags] = useState(false)

  useEffect(() => {
    const loadVideoData = async () => {
      if (!id || typeof id !== "string") return

      try {
        setLoading(true)
        setError(null)

        // Check if video data was passed in query params
        const videoParam = router.query.video
        let parsedVideo = null

        if (videoParam && typeof videoParam === "string") {
          try {
            parsedVideo = JSON.parse(videoParam)
            console.log("Using video data from query params:", parsedVideo)
            setVideoData(parsedVideo)
          } catch (err) {
            console.error("Error parsing video data from query params:", err)
            // Continue with fallback if parsing fails
          }
        }

        // If no video data from query params, use fallback data
        if (!parsedVideo) {
          const fallbackVideo = {
            id: id,
            title: id
              .split("-")
              .join(" ")
              .replace(/\b\w/g, (l) => l.toUpperCase()),
            url: `https://www.superporn.com/es/video/${id}`,
            thumbnailUrl: `/api/placeholder?height=400&width=600&query=${encodeURIComponent(id)}`,
            duration: "08:00",
            views: "30.4k",
            models: [
              {
                slug: "model-name",
                name: "Model Name",
              },
            ],
            categories: [
              {
                slug: "category-1",
                name: "Category 1",
              },
              {
                slug: "category-2",
                name: "Category 2",
              },
            ],
          }
          setVideoData(fallbackVideo)
          parsedVideo = fallbackVideo
        }

        // Get category from video data for related videos
        let categorySlug = "category-1" // Default fallback category

        if (parsedVideo && parsedVideo.categories && parsedVideo.categories.length > 0) {
          categorySlug = parsedVideo.categories[0].slug
        }

        // Generate a random page number between 1 and 5
        const randomPage = Math.floor(Math.random() * 5) + 1

        try {
          // Fetch videos from the same category but from a random page
          console.log(`Fetching related videos from category ${categorySlug}, page ${randomPage}`)
          const categoryVideos = await fetchCategoryVideos(categorySlug, randomPage)

          if (categoryVideos && categoryVideos.videos && categoryVideos.videos.length > 0) {
            // Filter out the current video and limit to 8 videos
            const filteredVideos = categoryVideos.videos.filter((video: any) => video.id !== id).slice(0, 8)

            if (filteredVideos.length > 0) {
              setRelatedVideos(filteredVideos)
            } else {
              // If no videos after filtering, use mock data
              setRelatedVideos(mockRelatedVideos)
            }
          } else {
            // If no videos in category, use mock data
            setRelatedVideos(mockRelatedVideos)
          }
        } catch (err) {
          console.error(`Error fetching related videos from category ${categorySlug}:`, err)
          // Use mock data if API call fails
          setRelatedVideos(mockRelatedVideos)
        }

      } catch (err) {
        console.error("Error loading video data:", err)
        setError("Failed to load video. Please try again later.")
        // Use mock data for video if all else fails
        setVideoData({
          id: id,
          title: id
            .split("-")
            .join(" ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          url: `https://www.superporn.com/es/video/${id}`,
          thumbnailUrl: `/api/placeholder?height=400&width=600&query=${encodeURIComponent(id)}`,
          duration: "08:00",
          views: "10k",
          models: [
            {
              slug: "model-name",
              name: "Model Name",
            },
          ],
          categories: [
            {
              slug: "category-1",
              name: "Category 1",
            },
          ],
        })
        setRelatedVideos(mockRelatedVideos)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadVideoData()
    }
  }, [id, router.query])

  // Format view count for display
  const formatViews = (viewsStr: string) => {
    if (!viewsStr) return "0"
    return viewsStr
  }

  // Create a preview element for the membership check
  const renderPreview = () => (
    <div className="video-container rounded-lg overflow-hidden bg-black">
      <img
        src={videoData?.thumbnailUrl || "/api/placeholder?height=720&width=1280&query=video%20thumbnail"}
        alt={videoData?.title || "Video thumbnail"}
        className="w-full h-full object-cover opacity-50"
      />
    </div>
  )

  return (
    <>
      <Head>
        <title>{videoData ? `${videoData.title} - PremiumHUB` : "Video - PremiumHUB"}</title>
        <meta
          name="description"
          content={videoData ? videoData.description || videoData.title : "Watch premium video content"}
        />
      </Head>

      <div className="pt-20 pb-10 bg-gray-900">
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
            {/* Video title */}
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">{videoData.title}</h1>

            <div className="flex flex-wrap items-center text-gray-400 mb-4">
              <div className="flex items-center mr-4 mb-2">
                <Eye size={16} className="mr-1" />
                <span>{formatViews(videoData.views)} views</span>
              </div>
              <div className="flex items-center mr-4 mb-2">
                <Clock size={16} className="mr-1" />
                <span>{videoData.duration}</span>
              </div>
            </div>

            {/* Video Player with Membership Check and Sidebar */}
            <div className="flex flex-col lg:flex-row mb-6 bg-gray-800 rounded-lg overflow-hidden">
              {/* Video Player */}
              <div className="lg:w-3/4">
                <MembershipCheck fallbackComponent={renderPreview()}>
                  <div className="relative aspect-video bg-black">
                    <iframe
                      src={`https://suppn.premiumhub.workers.dev/${videoData.url}`}
                      className="absolute inset-0 w-full h-full"
                      frameBorder="0"
                      allowFullScreen
                      title={videoData.title}
                    ></iframe>
                  </div>
                </MembershipCheck>
              </div>

            </div>

            {/* Video Info */}
            <div className="mb-8">
              {/* Models */}
              {videoData.models && videoData.models.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-white font-medium mb-2">Models:</h3>
                  <div className="flex flex-wrap gap-2">
                    {videoData.models.map((model: any, index: number) => (
                      <Link
                        key={index}
                        href={`/search?q=${encodeURIComponent(model.name)}`}
                        className="bg-purple-600/20 border border-purple-500/30 text-purple-400 px-3 py-1 rounded-full text-sm transition-colors hover:bg-purple-600/30"
                      >
                        {model.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories Section */}
              {videoData.categories && videoData.categories.length > 0 && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowTags(!showTags)}
                    className="flex items-center text-purple-400 hover:text-purple-300 mb-2"
                  >
                    <Tag size={18} className="mr-2" />
                    <span className="font-medium">Categories</span>
                    {showTags ? <ChevronUp size={18} className="ml-2" /> : <ChevronDown size={18} className="ml-2" />}
                  </button>

                  {showTags && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {videoData.categories.map((category: any, index: number) => (
                        <Link
                          key={index}
                          href={`/category/${category.slug}`}
                          className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm transition-colors"
                        >
                          {category.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Related Videos */}
            {relatedVideos.length > 0 && (
              <div className="mt-10">
                <h2 className="text-xl font-bold text-white mb-6">Related Videos</h2>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {relatedVideos.map((video: any, index: number) => (
                    <Link
                      key={index}
                      href={{
                        pathname: `/video/${video.id || `video-${index}`}`,
                        query: {
                          from: "category",
                          categorySlug: router.query.categorySlug,
                          videoData: JSON.stringify(video),
                        },
                      }}
                      className="group bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-all duration-300"
                    >
                      <div className="aspect-video relative">
                        <img
                          src={video.thumbnailUrl || "/api/placeholder?height=300&width=500&query=video%20thumbnail"}
                          alt={video.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.onerror = null
                            target.src = "/api/placeholder?height=300&width=500&query=video%20thumbnail"
                          }}
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

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
                          <span>{formatViews(video.views) || "0"} views</span>
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
