import Link from "next/link"
import { Eye, Film, TrendingUp, Star, Play } from "lucide-react"
import type { Creator } from "@/types"

interface CreatorCardProps {
  creator: Creator
}

const CreatorCard = ({ creator }: CreatorCardProps) => {
  // Format view count for display
  const formatViewCount = (views: number): string => {
    if (views >= 1000000000) {
      return `${(views / 1000000000).toFixed(1)}B`
    } else if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`
    } else {
      return views.toString()
    }
  }

  return (
    <Link
      href={`/creator/${creator.slug}`}
      className="group relative bg-gradient-to-br from-gray-800/60 to-gray-900/80 backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl hover:shadow-purple-900/30 aspect-square border border-gray-700/30 hover:border-purple-500/40"
    >
      {/* Background Image with Enhanced Overlays */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={creator.avatarUrl || "/api/placeholder?height=400&width=400&query=filmmaker"}
          alt={creator.name}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 brightness-50 group-hover:brightness-75"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.onerror = null
            target.src = "/api/placeholder?height=400&width=400&query=filmmaker"
          }}
        />
        
        {/* Enhanced gradient overlays for better readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20 opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
      </div>

      {/* Animated Rank Badge */}
      <div className="absolute top-4 left-4 z-10">
        <div className="relative">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg border border-white/20 backdrop-blur-sm transform group-hover:scale-105 transition-transform duration-300">
            #{creator.rank}
          </div>
          {/* Animated glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full opacity-0 group-hover:opacity-20 blur-lg animate-pulse transition-opacity duration-500" />
        </div>
      </div>

      {/* Trending Badge for top creators */}
      {creator.rank <= 3 && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-2 rounded-full shadow-lg backdrop-blur-sm animate-pulse">
            <TrendingUp size={16} />
          </div>
        </div>
      )}

      {/* Play Button Overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-10">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center transform scale-75 group-hover:scale-100 transition-all duration-500 shadow-2xl shadow-purple-600/50 border-2 border-white/20 backdrop-blur-lg">
            <Play className="w-8 h-8 text-white fill-current ml-1" />
          </div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-purple-500 opacity-20 animate-ping" />
        </div>
      </div>

      {/* Content Section with Improved Typography */}
      <div className="absolute inset-x-0 bottom-0 p-5 z-10">
        <div className="space-y-3">
          {/* Creator Name */}
          <h3 className="text-white font-bold text-lg leading-tight truncate group-hover:text-purple-300 transition-colors duration-300 drop-shadow-lg">
            {creator.name}
          </h3>

          {/* Stats Container */}
          <div className="space-y-2">
            {/* View Count */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
                <Eye size={14} className="text-purple-400 mr-2" />
                <span className="text-white text-sm font-medium">
                  {formatViewCount(creator.stats.views)}
                </span>
              </div>
              
              {/* Quality indicator */}
              <div className="flex items-center text-yellow-400">
                <Star size={12} className="fill-current" />
              </div>
            </div>

            {/* Video Count */}
            <div className="flex items-center bg-gradient-to-r from-purple-600/80 to-purple-700/80 backdrop-blur-sm rounded-full px-3 py-1.5 border border-purple-400/20 shadow-lg">
              <Film size={14} className="text-white mr-2" />
              <span className="text-white text-sm font-medium">
                {creator.stats.videoCount} videos
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Border Animation */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-purple-500/30 transition-all duration-500" />
      
      {/* Corner Accent Decoration */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </Link>
  )
}

export default CreatorCard
