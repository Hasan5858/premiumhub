"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import { fetchCreatorDetails } from "@/services/api"
import { useNavigation } from "@/contexts/NavigationContext"
import { hasCacheItem } from "@/services/cache"
import CreatorDetails from "@/components/CreatorDetails"
import type { CreatorDetailsResponse } from "@/types"

export default function CreatorPage() {
  const router = useRouter()
  const { slug, page } = router.query
  const { navigationState, setCreatorPage } = useNavigation()
  const [creatorData, setCreatorData] = useState<CreatorDetailsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Set initial page from URL or navigation state when component mounts
  useEffect(() => {
    if (router.isReady && slug && typeof slug === "string") {
      let initialPage = 1
      
      // First priority: URL parameter
      if (page && !Array.isArray(page)) {
        const pageNum = parseInt(page, 10)
        if (!isNaN(pageNum) && pageNum > 0) {
          initialPage = pageNum
        }
      } 
      // Second priority: navigation state
      else if (navigationState.creatorPage && 
               Object.prototype.hasOwnProperty.call(navigationState.creatorPage, slug) && 
               navigationState.creatorPage[slug] > 0) {
        initialPage = navigationState.creatorPage[slug]
      }
      
      setCurrentPage(initialPage)
    }
  }, [router.isReady, page, slug, navigationState.creatorPage])

  const loadCreatorData = async (creatorSlug: string, pageNum = 1) => {
    if (!creatorSlug || typeof creatorSlug !== "string") return

    // Check if we have cached data before showing loading indicator
    const hasCacheData = hasCacheItem(`creator-${creatorSlug}-page-${pageNum}`);
    
    if (!hasCacheData) {
      setLoading(true);
    }

    try {
      setError(null)
      const data = await fetchCreatorDetails(creatorSlug, pageNum)
      setCreatorData(data)
      setCurrentPage(pageNum)
      
      // Save current page in navigation context
      setCreatorPage(creatorSlug, pageNum)
      
      // Update URL to reflect current page (for direct linking)
      if (router.isReady && pageNum > 1) {
        router.push(`/creator/${creatorSlug}?page=${pageNum}`, undefined, { shallow: true })
      } else if (router.isReady && pageNum === 1 && router.query.page) {
        router.push(`/creator/${creatorSlug}`, undefined, { shallow: true })
      }
    } catch (err) {
      console.error("Error loading creator data:", err)
      setError("Failed to load creator data. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug && typeof slug === "string" && currentPage > 0) {
      loadCreatorData(slug, currentPage)
    }
  }, [slug, currentPage])

  const handlePageChange = async (pageNum: number) => {
    if (pageNum === currentPage) return
    setCurrentPage(pageNum)
    // Scroll to top when changing pages - already handled in loadCreatorData
  }

  return (
    <>
      <Head>
        <title>{creatorData ? `${creatorData.creator.name} - PremiumHUB` : "Creator - PremiumHUB"}</title>
        <meta
          name="description"
          content={
            creatorData
              ? `Watch videos from ${creatorData.creator.name}. ${creatorData.creator.about}`
              : "Watch premium content from top creators"
          }
        />
      </Head>

      <div>
        {loading && !creatorData ? (
          <div className="container mx-auto px-4 py-16 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : error ? (
          <div className="container mx-auto px-4 py-8">
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded">{error}</div>
          </div>
        ) : creatorData ? (
          <CreatorDetails 
            data={creatorData} 
            onPageChange={handlePageChange} 
            currentCreatorSlug={typeof slug === "string" ? slug : ""}
          />
        ) : null}
      </div>
    </>
  )
}
