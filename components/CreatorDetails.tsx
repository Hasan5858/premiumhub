"use client"

import { useState } from "react"
import Link from "next/link"
import { Play, Eye, Film, Users, Star, ChevronLeft, ChevronRight, MapPin, Calendar, Trophy, TrendingUp, Clock, Heart } from "lucide-react"
import type { CreatorDetailsResponse } from "@/types"

interface CreatorDetailsProps {
  data: CreatorDetailsResponse
  onPageChange: (page: number) => void
  currentCreatorSlug: string
}

const CreatorDetails = ({ data, onPageChange, currentCreatorSlug }: CreatorDetailsProps) => {
  const { creator, videos, pagination } = data
  const [isLoading, setIsLoading] = useState(false)

  // Format large numbers with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString()
  }

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

  const handlePageChange = async (page: number) => {
    if (page < 1 || page > pagination.totalPages) return
    setIsLoading(true)
    await onPageChange(page)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Hero Section with Creator Profile */}
        <div className="relative mb-12 overflow-hidden rounded-3xl bg-gradient-to-br from-gray-800/60 to-gray-900/80 backdrop-blur-xl border border-gray-700/30 shadow-2xl shadow-black/50">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20" />
          </div>

          <div className="relative p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
              
              {/* Avatar Section */}
              <div className="relative flex-shrink-0">
                <div className="relative w-48 h-48 lg:w-56 lg:h-56 rounded-3xl overflow-hidden border-4 border-gradient-to-r from-purple-400 to-blue-400 shadow-2xl shadow-purple-900/50">
                  <img
                    src={creator.avatarUrl || "/api/placeholder?height=300&width=300&query=filmmaker"}
                    alt={creator.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.onerror = null
                      target.src = "/api/placeholder?height=300&width=300&query=filmmaker"
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                
                {/* Rank Badge */}
                <div className="absolute -top-4 -right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold text-lg px-4 py-2 rounded-2xl shadow-lg border border-white/20 backdrop-blur-sm">
                  <Trophy className="w-5 h-5 inline mr-2" />
                  #{creator.rank}
                </div>

                {/* Status Indicator */}
                <div className="absolute bottom-4 left-4 bg-green-500 text-white text-sm font-medium px-3 py-1.5 rounded-full shadow-lg border border-white/20 backdrop-blur-sm flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                  Active
                </div>
              </div>

              {/* Info Section */}
              <div className="flex-1 text-center lg:text-left space-y-6">
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {creator.name}
                  </h1>
                  
                  {(creator.city || creator.country) && (
                    <div className="flex items-center justify-center lg:justify-start text-gray-300 mb-4">
                      <MapPin className="w-5 h-5 mr-2 text-purple-400" />
                      <span className="text-lg">{[creator.city, creator.country].filter(Boolean).join(", ")}</span>
                    </div>
                  )}

                  <p className="text-gray-300 text-lg leading-relaxed max-w-2xl">
                    {creator.about || "A talented creator bringing you amazing content. Stay tuned for more exciting videos and updates!"}
                  </p>
                </div>

                {/* Enhanced Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-sm rounded-2xl p-4 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 group">
                    <div className="flex items-center justify-center mb-2">
                      <Eye className="w-6 h-6 text-purple-400 group-hover:text-purple-300 transition-colors" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{formatViewCount(creator.stats.views)}</div>
                    <div className="text-sm text-gray-400">Total Views</div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 group">
                    <div className="flex items-center justify-center mb-2">
                      <Film className="w-6 h-6 text-blue-400 group-hover:text-blue-300 transition-colors" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{formatNumber(creator.stats.videoCount)}</div>
                    <div className="text-sm text-gray-400">Videos</div>
                  </div>

                  <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-sm rounded-2xl p-4 border border-green-500/30 hover:border-green-400/50 transition-all duration-300 group">
                    <div className="flex items-center justify-center mb-2">
                      <Users className="w-6 h-6 text-green-400 group-hover:text-green-300 transition-colors" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{formatNumber(creator.stats.subscribers)}</div>
                    <div className="text-sm text-gray-400">Followers</div>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 backdrop-blur-sm rounded-2xl p-4 border border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300 group">
                    <div className="flex items-center justify-center mb-2">
                      <Star className="w-6 h-6 text-yellow-400 group-hover:text-yellow-300 transition-colors fill-current" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{creator.stats.rating}</div>
                    <div className="text-sm text-gray-400">Rating</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Videos Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-1 h-8 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full" />
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-purple-400 rounded-full animate-pulse" />
            </div>
            <h2 className="text-3xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Latest Videos
            </h2>
            <TrendingUp className="w-6 h-6 text-purple-400" />
          </div>
          
          <div className="bg-gradient-to-r from-purple-600/20 to-purple-700/20 backdrop-blur-sm text-white px-4 py-2 rounded-full border border-purple-500/30 text-sm font-medium">
            Page {pagination.currentPage} of {pagination.totalPages}
          </div>
        </div>

        {/* Enhanced Videos Grid */}
        {videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-12">
            {videos.map((video, index) => (
              <Link
                key={video.id}
                href={{
                  pathname: `/video/${video.id}`,
                  query: { 
                    from: "creator", 
                    creatorSlug: currentCreatorSlug,
                    page: pagination.currentPage
                  },
                }}
                className="group relative flex flex-col bg-gradient-to-br from-gray-800/60 to-gray-900/80 backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.03] shadow-xl shadow-black/40 hover:shadow-2xl hover:shadow-purple-900/30 border border-gray-700/30 hover:border-purple-500/40"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
              >
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={video.thumbnailUrl || "/api/placeholder?height=300&width=500&query=video%20thumbnail"}
                    alt={video.title}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 brightness-90 group-hover:brightness-100"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.onerror = null
                      target.src = "/api/placeholder?height=300&width=500&query=video%20thumbnail"
                    }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

                  {/* Enhanced Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center transform scale-75 group-hover:scale-100 transition-all duration-500 shadow-2xl shadow-purple-600/50 border-2 border-white/20 backdrop-blur-lg">
                        <Play className="w-8 h-8 text-white fill-current ml-1" />
                      </div>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-purple-500 opacity-20 animate-ping" />
                    </div>
                  </div>

                  {/* Duration Badge */}
                  <div className="absolute bottom-3 right-3 bg-black/90 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {video.duration}
                  </div>
                </div>

                <div className="p-4 flex-grow flex flex-col space-y-3">
                  <h3 className="font-semibold text-white line-clamp-2 group-hover:text-purple-300 transition-colors duration-300 leading-tight">
                    {video.title}
                  </h3>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-300">
                      <Eye className="w-4 h-4 mr-1.5 text-purple-400" />
                      <span>{formatViewCount(video.viewCount)}</span>
                    </div>
                    <div className="flex items-center text-gray-400">
                      <Heart className="w-4 h-4 mr-1" />
                      <span className="text-xs">Like</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-3xl border border-gray-700/30 shadow-xl">
            <Film size={64} className="mx-auto text-gray-500 mb-6 opacity-50" />
            <h3 className="text-2xl font-bold text-gray-400 mb-2">No Videos Yet</h3>
            <p className="text-gray-500 max-w-md mx-auto">This creator hasn't uploaded any videos yet. Check back later for exciting content!</p>
          </div>
        )}

        {/* Enhanced Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center space-x-3">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1 || isLoading}
              className="group relative p-3 rounded-xl bg-gradient-to-r from-gray-800/60 to-gray-900/60 backdrop-blur-sm text-white hover:from-purple-600/80 hover:to-purple-700/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-gray-700/30 hover:border-purple-500/50 shadow-lg hover:shadow-purple-900/25"
            >
              <ChevronLeft className="w-5 h-5 group-hover:text-white transition-colors" />
            </button>

            <div className="flex items-center space-x-2">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1
                } else if (pagination.currentPage <= 3) {
                  pageNum = i + 1
                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i
                } else {
                  pageNum = pagination.currentPage - 2 + i
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={isLoading}
                    className={`w-12 h-12 rounded-xl font-medium transition-all duration-300 shadow-lg ${
                      pagination.currentPage === pageNum
                        ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-purple-900/50 border border-purple-400/50"
                        : "bg-gradient-to-r from-gray-800/60 to-gray-900/60 backdrop-blur-sm text-white hover:from-gray-700/80 hover:to-gray-800/80 border border-gray-700/30 hover:border-gray-600/50"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {pageNum}
                  </button>
                )
              })}

              {pagination.totalPages > 5 && pagination.currentPage < pagination.totalPages - 2 && (
                <>
                  <span className="text-gray-500 px-2">...</span>
                  <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={isLoading}
                    className="w-12 h-12 rounded-xl bg-gradient-to-r from-gray-800/60 to-gray-900/60 backdrop-blur-sm text-white hover:from-gray-700/80 hover:to-gray-800/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-gray-700/30 hover:border-gray-600/50 shadow-lg"
                  >
                    {pagination.totalPages}
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage || isLoading}
              className="group relative p-3 rounded-xl bg-gradient-to-r from-gray-800/60 to-gray-900/60 backdrop-blur-sm text-white hover:from-purple-600/80 hover:to-purple-700/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-gray-700/30 hover:border-purple-500/50 shadow-lg hover:shadow-purple-900/25"
            >
              <ChevronRight className="w-5 h-5 group-hover:text-white transition-colors" />
            </button>
          </div>
        )}
      </div>

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
      `}</style>
    </div>
  )
}

export default CreatorDetails
