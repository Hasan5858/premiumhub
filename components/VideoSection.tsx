import Link from "next/link"
import { ChevronRight } from "lucide-react"
import VideoCard from "./VideoCard"
import type { VideoData } from "@/types"

interface VideoSectionProps {
  title: string
  videos: VideoData[]
  viewAllLink?: string
  layout?: "grid" | "hero" | "row"
  isPremium?: boolean
}

const VideoSection = ({ title, videos = [], viewAllLink, layout = "row", isPremium = true }: VideoSectionProps) => {
  return (
    <section className="py-6">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          {viewAllLink && (
            <Link
              href={viewAllLink}
              className="flex items-center text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              View All <ChevronRight size={16} />
            </Link>
          )}
        </div>

        {/* Videos */}
        {layout === "grid" && (
          <div className="grid grid-cols-1 min-[375px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                {...video}
                playerUrl={video.playerUrl}
                views={video.views}
                isPremium={isPremium}
              />
            ))}
          </div>
        )}

        {layout === "hero" && videos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="col-span-1 md:col-span-2 lg:col-span-2">
              <VideoCard
                key={videos[0].id}
                {...videos[0]}
                size="large"
                playerUrl={videos[0].playerUrl}
                views={videos[0].views}
                isPremium={isPremium}
              />
            </div>
            <div className="col-span-1 md:col-span-1 lg:col-span-2">
              <div className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-4">
                {videos.slice(1, 5).map((video) => (
                  <VideoCard
                    key={video.id}
                    {...video}
                    size="small"
                    playerUrl={video.playerUrl}
                    views={video.views}
                    isPremium={isPremium}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {layout === "row" && (
          <div className="relative">
            <div className="flex overflow-x-auto space-x-2 sm:space-x-3 pb-4 scrollbar-hide snap-x scroll-smooth">
              {videos.map((video) => (
                <div key={video.id} className="flex-none w-full min-[375px]:w-[280px] snap-start">
                  <VideoCard {...video} playerUrl={video.playerUrl} views={video.views} isPremium={isPremium} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default VideoSection
