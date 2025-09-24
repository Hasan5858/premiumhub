"use client"

import { useState } from "react"
import Link from "next/link"
import { Play, Clock, Star, Eye, Sparkles, TrendingUp, Heart } from "lucide-react"
import PremiumBadge from "./PremiumBadge"
import { useAuth } from "@/contexts/AuthContext"

interface VideoCardProps {
  id: string
  title: string
  thumbnail: string
  duration: string
  rating: number
  year: number
  category: string
  size?: "small" | "medium" | "large"
  playerUrl?: string
  views?: string
  url?: string
  thumbnailUrl?: string
  isPremium?: boolean
}

const VideoCard = ({
  id,
  title,
  thumbnail,
  thumbnailUrl,
  duration,
  rating,
  year,
  category,
  size = "medium",
  playerUrl,
  views,
  url,
  isPremium = true,
}: VideoCardProps) => {
  const [isHovered, setIsHovered] = useState(false)
  const { user } = useAuth()

  // Check if user has premium access
  const hasPremiumAccess =
    user &&
    (user.membership_status === "monthly" ||
      user.membership_status === "3month" ||
      user.membership_status === "halfyearly" ||
      user.membership_status === "yearly" ||
      user.membership_status === "admin")

  const sizeClasses = {
    small: "w-full",
    medium: "w-full",
    large: "col-span-2 md:col-span-1 md:row-span-2",
  }

  // Format view count
  const formatViewCount = (viewCount: string | undefined): string => {
    if (!viewCount) return "0"
    const num = parseInt(viewCount.replace(/[^\d]/g, ''))
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <Link
      href={{
        pathname: `/video/${id}`,
        query: {
          video: JSON.stringify({
            id,
            title,
            thumbnailUrl: thumbnailUrl || thumbnail,
            thumbnail: thumbnail || thumbnailUrl,
            duration,
            url: url || playerUrl,
            views,
            slug: id,
          }),
        },
      }}
      className={`group relative flex flex-col bg-gradient-to-br from-gray-800/60 to-gray-900/80 backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.03] shadow-xl shadow-black/40 hover:shadow-2xl hover:shadow-purple-900/30 border border-gray-700/30 hover:border-purple-500/40 ${sizeClasses[size]}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail Container with Enhanced Design */}
      <div className="aspect-video relative overflow-hidden">
        <img
          src={thumbnailUrl || thumbnail}
          alt={title}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 brightness-90 group-hover:brightness-100"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.onerror = null
            target.src = "/api/placeholder?height=400&width=600&query=movie%20scene"
          }}
        />

        {/* Enhanced gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

        {/* Premium badge with gradient styling */}
        {isPremium && !hasPremiumAccess && (
          <PremiumBadge className="top-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-500 border border-yellow-300/30" />
        )}

        {/* Trending indicator for high-rated content */}
        {rating >= 8 && (
          <div className="absolute top-3 right-3 bg-gradient-to-r from-green-500 to-green-600 text-white p-2 rounded-full shadow-lg backdrop-blur-sm animate-pulse border border-green-400/30">
            <TrendingUp className="w-3 h-3" />
          </div>
        )}

        {/* Enhanced Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
          <div className="relative">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center transform scale-75 group-hover:scale-100 transition-all duration-500 shadow-2xl shadow-purple-600/50 border-2 border-white/20 backdrop-blur-lg">
              <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white fill-current ml-1" />
            </div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-purple-500 opacity-20 animate-ping" />
          </div>
        </div>

        {/* Enhanced Duration Badge */}
        <div className="absolute bottom-3 right-3 bg-black/90 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full shadow-xl border border-white/10">
          <Clock className="w-3 h-3 inline mr-1.5 text-purple-400" />
          {duration}
        </div>

        {/* Quality Badge */}
        <div className="absolute bottom-3 left-3 bg-gradient-to-r from-blue-600/90 to-blue-700/90 text-white text-xs px-2.5 py-1 rounded-full shadow-lg border border-blue-400/30 backdrop-blur-sm">
          HD
        </div>
      </div>

      {/* Enhanced Content Section */}
      <div className="p-4 flex-grow flex flex-col space-y-3 relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/95 to-gray-800/60 rounded-b-2xl" />
        
        <div className="relative z-10 space-y-3">
          {/* Title with gradient hover effect */}
          <h3 className="font-semibold text-white line-clamp-2 group-hover:text-purple-300 transition-colors duration-300 leading-tight text-sm sm:text-base">
            {title}
          </h3>

          {/* Metadata Row */}
          <div className="flex items-center justify-between text-xs text-gray-300">
            <div className="flex items-center space-x-3">
              {/* Year */}
              <span className="bg-gray-700/50 px-2 py-1 rounded-md text-xs font-medium">
                {year}
              </span>
              
              {/* Category */}
              <span className="text-purple-400 font-medium">
                {category}
              </span>
            </div>

            {/* Rating with stars */}
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 text-yellow-400 fill-current" />
              <span className="text-yellow-400 font-medium">
                {rating.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Views and Interaction */}
          <div className="flex items-center justify-between">
            {views && (
              <div className="flex items-center text-gray-400 text-xs">
                <Eye className="w-3 h-3 mr-1.5 text-purple-400" />
                <span>{formatViewCount(views)} views</span>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-1.5 hover:bg-purple-600/20 rounded-full">
                <Heart className="w-4 h-4 text-gray-400 hover:text-red-400 transition-colors" />
              </button>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-1.5 hover:bg-purple-600/20 rounded-full">
                <Sparkles className="w-4 h-4 text-gray-400 hover:text-yellow-400 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle border animation */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-purple-500/30 transition-all duration-500 pointer-events-none" />
      
      {/* Corner accent decoration */}
      <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </Link>
  )
}

export default VideoCard
