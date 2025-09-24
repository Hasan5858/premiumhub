"use client"

import { useState, useEffect } from "react"
import Head from "next/head"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { fetchCategories } from "@/services/api"
import { hasCacheItem } from "@/services/cache"
import type { Category } from "@/types"

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)

  const loadCategories = async (page: number) => {
    // Check if we have cached data before showing loading indicator
    const hasCategoriesCache = hasCacheItem(`categories-page-${page}`);
    
    if (!hasCategoriesCache) {
      setLoading(true);
    }
    
    try {
      setError(null)

      const data = await fetchCategories(page)
      setCategories(data.categories)

      // Set pagination data
      setCurrentPage(data.pagination?.currentPage || page)
      setTotalPages(data.pagination?.totalPages || 1)
      setHasNextPage(data.pagination?.hasNextPage || false)
    } catch (err) {
      console.error("Error loading categories:", err)
      setError("Failed to load categories. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories(currentPage)
  }, [currentPage])

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <>
      <Head>
        <title>Categories - PremiumHUB</title>
        <meta name="description" content="Browse all video categories on PremiumHUB." />
      </Head>

      <div className="pb-10">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center">
              <span className="w-1 sm:w-1.5 h-6 sm:h-8 bg-purple-500 rounded-full inline-block mr-2 sm:mr-3"></span>
              Categories
            </h1>
            <p className="text-sm sm:text-base text-gray-400 ml-3 sm:ml-4">Browse all our video categories</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded mb-6">{error}</div>
          )}

          {/* Categories grid */}
          {loading && categories.length === 0 ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/category/${category.slug}`}
                  className="group relative aspect-square rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.03] shadow-lg shadow-black/30 hover:shadow-purple-900/20"
                >
                  <img
                    src={
                      category.imageUrl ||
                      `/api/placeholder?height=400&width=400&query=${encodeURIComponent(category.name)}%20videos`
                    }
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 brightness-95"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.onerror = null
                      target.src = `/api/placeholder?height=400&width=400&query=${encodeURIComponent(category.name)}%20videos`
                    }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-black/30 opacity-70 group-hover:opacity-50 transition-opacity duration-300" />

                  <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
                    <h3 className="text-sm sm:text-lg font-medium text-white group-hover:text-purple-300 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-300 mt-1">
                      <span className="bg-purple-600/80 text-white px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs">
                        {category.videoCount.toLocaleString()} videos
                      </span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700/50 backdrop-blur-sm">
              <h3 className="text-xl font-medium text-gray-400">No categories found</h3>
              <p className="text-gray-500 mt-2">Please try again later.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="p-2 rounded-lg bg-gray-800/70 text-white hover:bg-purple-600/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show pages around current page
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      className={`w-10 h-10 rounded-lg ${
                        currentPage === pageNum
                          ? "bg-purple-600 text-white"
                          : "bg-gray-800/70 text-white hover:bg-gray-700/80"
                      } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                    >
                      {pageNum}
                    </button>
                  )
                })}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="text-gray-500">...</span>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={loading}
                      className="w-10 h-10 rounded-lg bg-gray-800/70 text-white hover:bg-gray-700/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasNextPage || loading}
                className="p-2 rounded-lg bg-gray-800/70 text-white hover:bg-purple-600/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
