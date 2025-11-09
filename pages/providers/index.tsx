import { useState, useEffect } from "react"
import Head from "next/head"
import Link from "next/link"
import { Globe, Video, Image as ImageIcon, ArrowRight } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import PremiumBadge from "@/components/PremiumBadge"

interface Provider {
  id: string
  name: string
  displayName: string
  description: string
  icon: string
  color: string
  accentColor: string
  stats: {
    totalContent: string
    categories: number
  }
  features: {
    hasVideos: boolean
    hasGalleries: boolean
    hasStories: boolean
    hasHD: boolean
  }
}

export default function ProvidersPage() {
  const { user } = useAuth()
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)

  const hasPremiumAccess =
    user &&
    (user.membership_status === "monthly" ||
      user.membership_status === "3month" ||
      user.membership_status === "halfyearly" ||
      user.membership_status === "yearly" ||
      user.membership_status === "admin")

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const response = await fetch('/api/v2/providers')
        const result = await response.json()
        
        if (result.success && result.data) {
          const formattedProviders: Provider[] = result.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            displayName: p.displayName,
            description: p.description,
            icon: p.icon,
            color: p.color,
            accentColor: p.accentColor,
            stats: p.stats,
            features: p.features
          }))
          setProviders(formattedProviders)
        }
      } catch (error) {
        console.error('Failed to load providers:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProviders()
  }, [])

  return (
    <>
      <Head>
        <title>Providers - PremiumHUB</title>
        <meta name="description" content="Browse all content providers on PremiumHUB. Access premium Indian adult content from multiple sources." />
      </Head>

      <div className="pb-10 min-h-screen">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-12 pt-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-purple-600 to-purple-700">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Content Providers
            </h1>
            <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
              Choose from our curated collection of premium content providers. Each provider offers unique content and features.
            </p>
          </div>

          {/* Providers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {providers.map((provider) => (
              <Link
                key={provider.id}
                href={`/provider/${provider.name}`}
                onMouseEnter={() => setSelectedProvider(provider.id)}
                onMouseLeave={() => setSelectedProvider(null)}
                className="group relative bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/30 overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-purple-900/40 hover:border-purple-500/50"
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${provider.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                
                {/* Premium badge */}
                {!hasPremiumAccess && (
                  <PremiumBadge className="absolute top-4 right-4 z-10 bg-gradient-to-r from-yellow-400 to-orange-500" />
                )}

                <div className="relative p-8">
                  {/* Provider Icon & Name */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className={`text-5xl transform transition-transform duration-500 ${selectedProvider === provider.id ? 'scale-110 rotate-12' : ''}`}>
                        {provider.icon}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-1">
                          {provider.displayName}
                        </h2>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r ${provider.color} bg-opacity-20 border border-white/20`}>
                          <span className="text-xs font-semibold text-white uppercase tracking-wide">
                            Provider
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    {provider.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/30">
                      <div className="flex items-center mb-2">
                        <Video size={18} className={`text-transparent bg-clip-text bg-gradient-to-r ${provider.color}`} />
                        <span className="ml-2 text-xs text-gray-400 uppercase tracking-wide">Content</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{provider.stats.totalContent}</p>
                    </div>
                    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/30">
                      <div className="flex items-center mb-2">
                        <ImageIcon size={18} className={`text-transparent bg-clip-text bg-gradient-to-r ${provider.color}`} />
                        <span className="ml-2 text-xs text-gray-400 uppercase tracking-wide">Categories</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{provider.stats.categories}</p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Features</h3>
                    <div className="flex flex-wrap gap-2">
                      {provider.features.hasVideos && (
                        <span className="px-3 py-1.5 bg-gray-700/50 text-gray-300 rounded-lg text-sm font-medium border border-gray-600/50">
                          Videos
                        </span>
                      )}
                      {provider.features.hasGalleries && (
                        <span className="px-3 py-1.5 bg-gray-700/50 text-gray-300 rounded-lg text-sm font-medium border border-gray-600/50">
                          Galleries
                        </span>
                      )}
                      {provider.features.hasStories && (
                        <span className="px-3 py-1.5 bg-gray-700/50 text-gray-300 rounded-lg text-sm font-medium border border-gray-600/50">
                          Stories
                        </span>
                      )}
                      {provider.features.hasHD && (
                        <span className="px-3 py-1.5 bg-gray-700/50 text-gray-300 rounded-lg text-sm font-medium border border-gray-600/50">
                          HD Quality
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Browse Button */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-700/30">
                    <span className="text-gray-400 text-sm font-medium">Explore Content</span>
                    <div className={`flex items-center space-x-2 text-transparent bg-clip-text bg-gradient-to-r ${provider.color} font-semibold`}>
                      <span>Browse</span>
                      <ArrowRight 
                        size={20} 
                        className={`transform transition-transform duration-300 ${selectedProvider === provider.id ? 'translate-x-2' : ''}`}
                        style={{
                          filter: `drop-shadow(0 0 8px ${selectedProvider === provider.id ? 'rgba(168, 85, 247, 0.5)' : 'transparent'})`
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Hover effect border */}
                <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-purple-500/30 transition-all duration-500" />
              </Link>
            ))}
          </div>

          {/* Info Section */}
          <div className="mt-12 max-w-3xl mx-auto text-center">
            <div className="bg-gradient-to-r from-purple-600/10 to-purple-700/10 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-8">
              <h3 className="text-xl font-bold text-white mb-3">
                {hasPremiumAccess ? 'Unlimited Access' : 'Get Premium Access'}
              </h3>
              <p className="text-gray-300 mb-6">
                {hasPremiumAccess 
                  ? 'Enjoy unlimited access to all providers and their exclusive content.'
                  : 'Upgrade to premium membership to unlock unlimited access to all providers and exclusive content.'
                }
              </p>
              {!hasPremiumAccess && (
                <Link
                  href="/membership"
                  className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-purple-500/50 transform hover:scale-105"
                >
                  View Membership Plans
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
