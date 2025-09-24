"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Play, Clock, Star, Eye, Heart, Plus, TrendingUp, Sparkles } from 'lucide-react'
import type { Video } from '@/types'

interface VideoGridProps {
  videos: Video[]
  columns?: number
  title?: string
  subtitle?: string
  showLoadMore?: boolean
  onLoadMore?: () => void
  loading?: boolean
  variant?: 'default' | 'featured' | 'compact'
}

const VideoGrid = ({ 
  videos, 
  columns = 4, 
  title,
  subtitle,
  showLoadMore = false,
  onLoadMore,
  loading = false,
  variant = 'default'
}: VideoGridProps) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [visibleVideos, setVisibleVideos] = useState<Video[]>([])

  useEffect(() => {
    // Staggered loading animation
    setVisibleVideos([])
    videos.forEach((video, index) => {
      setTimeout(() => {
        setVisibleVideos(prev => [...prev, video])
      }, index * 50)
    })
  }, [videos])

  // Dynamic grid classes based on columns and variant
  const getGridClass = () => {
    const baseGrid = "grid gap-4 sm:gap-5 md:gap-6"
    
    switch (variant) {
      case 'featured':
        return `${baseGrid} grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-${Math.min(columns, 4)} xl:grid-cols-${columns}`
      case 'compact':
        return `${baseGrid} grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-${Math.min(columns + 1, 6)} xl:grid-cols-${columns + 2}`
      default:
        return `${baseGrid} grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-${Math.min(columns, 5)} xl:grid-cols-${columns}`
    }
  }

  // Format view count
  const formatViews = (views: string | undefined) => {
    if (!views) return '0 views'
    const num = parseInt(views.replace(/[^\d]/g, ''))
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M views`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K views`
    return `${num} views`
  }

  return (
    <div className="w-full">
      {/* Section Header */}
      {(title || subtitle) && (
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-1 h-8 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full" />
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-purple-400 rounded-full animate-pulse" />
              </div>
              {title && (
                <h2 className="text-2xl sm:text-3xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {title}
                </h2>
              )}
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          {subtitle && (
            <p className="text-gray-400 text-sm sm:text-base ml-6">{subtitle}</p>
          )}
        </div>
      )}

      {/* Video Grid */}
      <div className={getGridClass()}>
        {visibleVideos.map((video, index) => (
          <div
            key={video.id || index}
            className="group relative flex flex-col bg-gradient-to-br from-gray-800/60 to-gray-900/80 backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.03] shadow-xl shadow-black/40 hover:shadow-2xl hover:shadow-purple-900/30 border border-gray-700/30 hover:border-purple-500/40"
            style={{
              animationDelay: `${index * 100}ms`,
              animation: 'fadeInUp 0.6s ease-out forwards'
            }}
            onMouseEnter={() => setHoveredId(video.id || index.toString())}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Thumbnail Container */}
            <Link href={`/video/${video.id}`} className="block relative">
              <div className="aspect-video relative overflow-hidden">
                <Image
                  src={video.thumbnail || video.thumbnailUrl || `/api/placeholder?height=400&width=600&query=${encodeURIComponent(video.title)}`}
                  alt={video.title}
                  fill
                  className="object-cover transition-all duration-700 group-hover:scale-110 brightness-90 group-hover:brightness-100"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement
                    target.src = `/api/placeholder?height=400&width=600&query=${encodeURIComponent(video.title)}`
                  }}
                />

                {/* Enhanced gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

                {/* Quality indicator */}
                {video.quality && (
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-green-600/90 to-green-700/90 text-white text-xs px-2.5 py-1 rounded-full shadow-lg border border-green-400/30 backdrop-blur-sm">
                    {video.quality}
                  </div>
                )}

                {/* Trending badge for high-rated videos */}
                {video.rating && video.rating >= 8 && (
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-2 rounded-full shadow-lg backdrop-blur-sm animate-pulse">
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

                {/* Duration Badge */}
                {video.duration && (
                  <div className="absolute bottom-3 right-3 bg-black/90 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full shadow-xl border border-white/10">
                    <Clock className="w-3 h-3 inline mr-1.5 text-purple-400" />
                    {video.duration}
                  </div>
                )}
              </div>
            </Link>

            {/* Enhanced Content Section */}
            <div className="p-4 flex-grow flex flex-col space-y-3 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/95 to-gray-800/60 rounded-b-2xl" />
              
              <div className="relative z-10 space-y-3">
                {/* Title */}
                <Link href={`/video/${video.id}`}>
                  <h3 className="font-semibold text-white line-clamp-2 group-hover:text-purple-300 transition-colors duration-300 leading-tight text-sm sm:text-base cursor-pointer">
                    {video.title}
                  </h3>
                </Link>

                {/* Metadata Row */}
                <div className="flex items-center justify-between text-xs text-gray-300">
                  <div className="flex items-center space-x-2">
                    {/* Views */}
                    <div className="flex items-center text-gray-400">
                      <Eye className="w-3 h-3 mr-1 text-purple-400" />
                      <span>{formatViews(video.views)}</span>
                    </div>
                  </div>

                  {/* Rating */}
                  {video.rating && (
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-yellow-400 font-medium">
                        {video.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {video.category && (
                      <span className="bg-purple-600/80 text-white px-2 py-1 rounded-md text-xs font-medium">
                        {video.category}
                      </span>
                    )}
                    {video.year && (
                      <span className="bg-gray-700/50 px-2 py-1 rounded-md text-xs font-medium text-gray-300">
                        {video.year}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-1.5 hover:bg-purple-600/20 rounded-full">
                      <Heart className="w-4 h-4 text-gray-400 hover:text-red-400 transition-colors" />
                    </button>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-1.5 hover:bg-purple-600/20 rounded-full">
                      <Plus className="w-4 h-4 text-gray-400 hover:text-green-400 transition-colors" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Subtle border animation */}
            <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-purple-500/30 transition-all duration-500 pointer-events-none" />
            
            {/* Corner accent decoration */}
            <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {showLoadMore && (
        <div className="flex justify-center mt-8 sm:mt-12">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-600/50 border border-purple-400/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <div className="relative flex items-center space-x-2">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Load More Videos</span>
                </>
              )}
            </div>
          </button>
        </div>
      )}

      {/* Empty State */}
      {videos.length === 0 && !loading && (
        <div className="text-center py-16 bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-3xl border border-gray-700/30 shadow-xl">
          <Play size={64} className="mx-auto text-gray-500 mb-6 opacity-50" />
          <h3 className="text-2xl font-bold text-gray-400 mb-2">No Videos Found</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            We couldn't find any videos to display. Try adjusting your filters or check back later for new content.
          </p>
        </div>
      )}

      {/* CSS Animation Styles */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}

export default VideoGrid
