import Link from "next/link"
import PremiumBadge from "@/components/PremiumBadge"

interface CategoryGridProps {
  categories: Array<{
    name: string
    url?: string
    slug?: string
    count?: number
    videoCount?: number
    thumbnail?: string
    imageUrl?: string
    provider?: string
    isEmpty?: boolean
  }>
  hasPremiumAccess: boolean | null
  loading?: boolean
  showProviderBadge?: boolean
}

export default function CategoryGrid({ 
  categories, 
  hasPremiumAccess, 
  loading = false,
  showProviderBadge = true 
}: CategoryGridProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
          <div className="absolute inset-0 rounded-full border-4 border-purple-400/20"></div>
        </div>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/30">
          <p className="text-gray-400">No categories available at the moment.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {categories.map((category, index) => {
        const provider = category.provider || 'indianpornhq'
        const urlParts = category.url ? category.url.split('/').filter((p: string) => p && p.length > 0) : []
        const slug = category.slug || urlParts[urlParts.length - 1] || category.name.toLowerCase().replace(/\s+/g, '-')
        
        const providerInfo = provider === 'fsiblog5' 
          ? { name: 'FSIBlog', color: 'from-emerald-500/80 to-green-600/80' }
          : provider === 'superporn'
          ? { name: 'Superporn', color: 'from-purple-500/80 to-pink-600/80' }
          : { name: 'IndianPornHQ', color: 'from-blue-500/80 to-indigo-600/80' }
        
        // Handle both old Category format (with slug only) and new ProviderCategory format
        const href = category.provider ? `/provider/${provider}?cat=${slug}` : `/category/${slug}`
        const videoCount = category.count || category.videoCount || 0
        const thumbnailUrl = category.thumbnail || category.imageUrl

        return (
          <Link
            key={`${provider}-${category.url || index}`}
            href={href}
            className="group relative aspect-square rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.05] shadow-xl shadow-black/40 hover:shadow-2xl hover:shadow-purple-900/40 border border-gray-700/30 hover:border-purple-500/50"
            style={{ 
              animationDelay: `${index * 80}ms`,
              animation: 'fadeInUp 0.6s ease-out forwards'
            }}
          >
            <img
              src={
                thumbnailUrl ||
                `/api/placeholder?height=400&width=400&query=${encodeURIComponent(category.name)}%20videos`
              }
              alt={category.name}
              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 brightness-75 group-hover:brightness-90"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.onerror = null
                target.src = `/api/placeholder?height=400&width=400&query=${encodeURIComponent(category.name)}%20videos`
              }}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500" />

            {!hasPremiumAccess && <PremiumBadge className="top-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-500" />}

            {showProviderBadge && (
              <div className={`absolute top-3 right-3 bg-gradient-to-r ${providerInfo.color} backdrop-blur-sm text-white px-2 py-1 rounded-full text-[10px] font-semibold shadow-lg border border-white/20 uppercase tracking-wide`}>
                {providerInfo.name}
              </div>
            )}

            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              <h3 className="text-sm sm:text-lg font-bold text-white group-hover:text-purple-300 transition-colors duration-300 mb-2">
                {category.name}
              </h3>
              <div className="bg-gradient-to-r from-purple-600/90 to-purple-700/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg border border-white/20">
                {videoCount ? `${videoCount.toLocaleString()} videos` : 'View videos'}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
