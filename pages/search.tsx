import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useSidebar } from '@/contexts/SidebarContext';
import { Clock, Eye, Search, X, ArrowLeft } from 'lucide-react';

// Provider color themes for badges
const providerThemes: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  fsiblog5: { 
    bg: 'bg-gradient-to-r from-emerald-500/90 to-green-600/90', 
    border: 'border-emerald-500/50',
    text: 'FSIBlog', 
    icon: '📸' 
  },
  indianpornhq: { 
    bg: 'bg-gradient-to-r from-blue-500/90 to-indigo-600/90', 
    border: 'border-blue-500/50',
    text: 'IndianPornHQ', 
    icon: '🇮🇳' 
  },
  superporn: { 
    bg: 'bg-gradient-to-r from-purple-500/90 to-pink-600/90', 
    border: 'border-purple-500/50',
    text: 'Superporn', 
    icon: '🌍' 
  },
  kamababa: { 
    bg: 'bg-gradient-to-r from-rose-500/90 to-pink-600/90', 
    border: 'border-rose-500/50',
    text: 'KamaBaba', 
    icon: '🎬' 
  },
  webxseries: { 
    bg: 'bg-gradient-to-r from-cyan-500/90 to-blue-600/90', 
    border: 'border-cyan-500/50',
    text: 'WebXSeries', 
    icon: '📺' 
  },
};

export default function SearchPage() {
  const router = useRouter();
  const { q, page } = router.query;
  const currentPage = page ? parseInt(page as string) : 1;
  const searchQuery = q as string || '';
  const { isCollapsed } = useSidebar(); // Get sidebar state
  
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage,
    totalPages: 0,
    totalResults: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [providerStats, setProviderStats] = useState<Record<string, number>>({});
  const [searchInput, setSearchInput] = useState<string>(searchQuery);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery) {
      setLoading(true);
      
      // Use unified search API
      fetch(`/api/v2/search?q=${encodeURIComponent(searchQuery)}&page=${currentPage}&limit=24`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setResults(data.data || []);
            setPagination(data.pagination || {
              currentPage,
              totalPages: 0,
              totalResults: 0,
              hasNextPage: false,
              hasPrevPage: false,
            });
            setProviderStats(data.resultsByProvider || {});
          } else {
            console.error('Search error:', data.error);
            setResults([]);
          }
        })
        .catch(error => {
          console.error('Error searching:', error);
          setResults([]);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [searchQuery, currentPage]);

  const handlePageChange = (newPage: number) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    router.push({
      pathname: '/search',
      query: { q: searchQuery, page: newPage }
    });
  };

  const getProviderBadge = (providerId: string) => {
    const theme = providerThemes[providerId] || { 
      bg: 'bg-gradient-to-r from-gray-500/90 to-gray-600/90',
      border: 'border-gray-500/50',
      text: providerId, 
      icon: '🎥' 
    };
    return (
      <span className={`inline-flex items-center px-2 py-1 ${theme.bg} backdrop-blur-sm text-white text-xs font-bold rounded-lg shadow-lg border ${theme.border}`}>
        <span className="mr-1">{theme.icon}</span>
        {theme.text}
      </span>
    );
  };

  return (
    <>
      <Head>
        <title>{searchQuery ? `Search results for "${searchQuery}"` : 'Search Videos'}</title>
        <meta name="description" content={`Search results for ${searchQuery}`} />
      </Head>

      {/* Full screen layout without sidebar */}
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="px-4 py-4">
        
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-4 group inline-flex items-center text-gray-300 hover:text-white transition-all duration-200 font-medium"
        >
          <div className="mr-2 p-1.5 rounded-lg bg-gray-800/50 group-hover:bg-purple-600/20 transition-colors">
            <ArrowLeft size={18} className="group-hover:translate-x-[-2px] transition-transform" />
          </div>
          <span>Back</span>
        </button>
        
        {/* Compact Header */}
        <div className="mb-3">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center flex-wrap">
            <Search className="mr-2 text-purple-400 flex-shrink-0" size={24} />
            <span className="mr-2">Search results for</span>
            <span className="text-purple-400">"{searchQuery}"</span>
          </h1>
          
          {pagination.totalResults > 0 && (
            <p className="text-gray-400 text-sm">
              Found <span className="font-bold text-purple-400">{pagination.totalResults}</span> results
              {pagination.currentPage > 1 && ` • Page ${pagination.currentPage} of ${pagination.totalPages}`}
            </p>
          )}
        </div>

        {/* Search Input - Full Width */}
        <form onSubmit={(e) => {
          e.preventDefault();
          if (searchInput && searchInput.trim()) {
            router.push({ pathname: '/search', query: { q: searchInput.trim() } });
          }
        }} className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={18} />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Refine your search..."
              className="w-full py-2.5 pl-10 pr-10 bg-gray-800 border border-gray-700 rounded-xl text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute inset-y-0 right-3 flex items-center"
              >
                <X size={16} className="text-gray-400 hover:text-gray-200" />
              </button>
            )}
          </div>
        </form>

        {/* Provider Stats - Compact */}
        {Object.keys(providerStats).length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {Object.entries(providerStats).map(([providerId, count]) => {
              const theme = providerThemes[providerId] || { 
                bg: 'bg-gradient-to-r from-gray-700 to-gray-800',
                border: 'border-gray-600',
                text: providerId, 
                icon: '🎥' 
              };
              return count > 0 ? (
                <div 
                  key={providerId} 
                  className={`px-3 py-1.5 ${theme.bg} border ${theme.border} rounded-lg shadow-md text-xs`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{theme.icon}</span>
                    <div>
                      <span className="text-white font-bold">{theme.text}</span>
                      <span className="text-white/70 ml-1">({count})</span>
                    </div>
                  </div>
                </div>
              ) : null;
            })}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500/20 border-t-purple-500"></div>
            </div>
            <p className="text-gray-400 text-sm">Searching...</p>
          </div>
        ) : results.length > 0 ? (
          <>
            {/* Video Grid - Responsive to sidebar state */}
            {/* Sidebar Collapsed (isCollapsed=true): 5 columns */}
            {/* Sidebar Expanded (isCollapsed=false): 4 columns */}
            <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5 ${
              isCollapsed ? 'lg:grid-cols-5 xl:grid-cols-5' : 'lg:grid-cols-4 xl:grid-cols-4'
            }`}>
              {results.map((video: any, index: number) => (
                <Link
                  key={`${video.provider}-${video.id}-${index}`}
                  href={`/provider/${video.provider}/video/${video.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden mb-1.5 bg-gray-800/50 border border-gray-700/30 shadow-md group-hover:shadow-xl group-hover:shadow-purple-500/20 transition-all duration-300">
                    <img
                      src={video.thumbnail || video.thumbnailUrl || '/api/placeholder?height=180&width=320&query=video'}
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    
                    {/* Provider Badge */}
                    <div className="absolute top-1.5 left-1.5 z-10">
                      {getProviderBadge(video.provider)}
                    </div>
                    
                    {/* Duration */}
                    {video.duration && (
                      <div className="absolute bottom-1.5 right-1.5 bg-black/90 px-1.5 py-0.5 rounded text-xs text-white font-bold flex items-center">
                        <Clock size={10} className="mr-0.5" />
                        {video.duration}
                      </div>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <div className="flex items-center text-xs text-gray-300">
                          <Eye size={10} className="mr-1" />
                          <span className="text-xs">{video.views || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-xs text-gray-300 group-hover:text-white font-medium line-clamp-2 leading-tight">
                    {video.title}
                  </h3>
                </Link>
              ))}
            </div>

            {/* Pagination - Compact */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <div className="flex items-center gap-1.5">
                  {pagination.hasPrevPage && (
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      className="px-3 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all text-sm font-medium"
                    >
                      ←
                    </button>
                  )}
                  
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all text-sm ${
                          pageNum === pagination.currentPage
                            ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white scale-105'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  {pagination.hasNextPage && (
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      className="px-3 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all text-sm font-medium"
                    >
                      →
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        ) : searchQuery ? (
          <div className="text-center py-16 bg-gray-800/50 rounded-2xl border border-gray-700/30 max-w-xl mx-auto">
            <Search size={40} className="text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-200 mb-2">No results found</h3>
            <p className="text-gray-400 text-sm mb-4">
              No videos found for <span className="text-purple-400 font-semibold">"{searchQuery}"</span>
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-semibold text-sm"
            >
              Browse Home
            </Link>
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-800/50 rounded-2xl border border-gray-700/30 max-w-xl mx-auto">
            <Search size={40} className="text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-200 mb-2">Start Searching</h3>
            <p className="text-gray-400 text-sm">
              Enter a search query to find videos
            </p>
          </div>
        )}
        </div>
      </div>
    </>
  );
} 