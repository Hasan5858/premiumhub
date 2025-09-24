"use client"

import { useState, useEffect } from "react"
import Head from "next/head"
import { fetchCreators } from "@/services/api"
import CreatorCard from "@/components/CreatorCard"
import { ChevronLeft, ChevronRight, Filter } from "lucide-react"
import type { Creator } from "@/types"

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<"in" | "bd">("in")
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const countryNames = {
    in: "India",
    bd: "Bangladesh",
  }

  const loadCreators = async (country: "in" | "bd", page: number) => {
    try {
      setLoading(true)
      setError(null)

      const data = await fetchCreators(country, page)

      setCreators(data.creators)
      setCurrentPage(data.pagination.currentPage)
      setTotalPages(data.pagination.totalPages)
      setHasNextPage(data.pagination.hasNextPage)
    } catch (err) {
      console.error("Error loading creators:", err)
      setError("Failed to load creators. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCreators(selectedCountry, currentPage)
  }, [selectedCountry, currentPage])

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleCountryChange = (country: "in" | "bd") => {
    if (country === selectedCountry) return
    setSelectedCountry(country)
    setCurrentPage(1) // Reset to first page when changing country
    setIsFilterOpen(false) // Close filter dropdown
  }

  return (
    <>
      <Head>
        <title>Top Creators - PremiumHUB</title>
        <meta name="description" content="Discover top creators from India and Bangladesh on PremiumHUB." />
      </Head>

      <div className="pb-10">
        <div className="container mx-auto px-4">
          {/* Header with filter */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Top Creators</h1>
              <p className="text-gray-400">Discover popular creators from {countryNames[selectedCountry]}</p>
            </div>

            {/* Filter dropdown */}
            <div className="relative mt-4 md:mt-0">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Filter size={18} />
                <span>Filter: {countryNames[selectedCountry]}</span>
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl z-10">
                  <div className="py-1">
                    <button
                      onClick={() => handleCountryChange("in")}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        selectedCountry === "in" ? "bg-purple-600 text-white" : "text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      India
                    </button>
                    <button
                      onClick={() => handleCountryChange("bd")}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        selectedCountry === "bd" ? "bg-purple-600 text-white" : "text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      Bangladesh
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded mb-6">{error}</div>
          )}

          {/* Creators grid */}
          {loading && creators.length === 0 ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : creators.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
              {creators.map((creator) => (
                <CreatorCard key={creator.slug} creator={creator} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-800 rounded-lg">
              <h3 className="text-xl font-medium text-gray-400">No creators found</h3>
              <p className="text-gray-500 mt-2">Try changing your filter or check back later.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          : "bg-gray-800 text-white hover:bg-gray-700"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
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
                      className="w-10 h-10 rounded-lg bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasNextPage || loading}
                className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
