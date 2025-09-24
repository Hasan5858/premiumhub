import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/Layout';
import VideoGrid from '@/components/VideoGrid';
import SearchBar from '@/components/SearchBar';
import { searchVideos } from '@/services/api';
import type { Video } from '@/types';

export default function SearchPage() {
  const router = useRouter();
  const { q, page } = router.query;
  const currentPage = page ? parseInt(page as string) : 1;
  const searchQuery = q as string || '';
  
  const [results, setResults] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage,
    totalPages: 0,
    hasNextPage: false
  });

  useEffect(() => {
    if (searchQuery) {
      setLoading(true);
      
      // Use the original API search function
      searchVideos(searchQuery, currentPage)
        .then(data => {
          setResults(data.videos);
          setPagination(data.pagination);
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
    router.push({
      pathname: '/search',
      query: { q: searchQuery, page: newPage }
    });
  };

  return (
    <Layout>
      <Head>
        <title>{searchQuery ? `Search results for "${searchQuery}"` : 'Search'}</title>
        <meta name="description" content={`Search results for ${searchQuery}`} />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <SearchBar fullWidth initialQuery={searchQuery} />
        </div>

        <h1 className="text-2xl font-bold text-white mb-6">
          {searchQuery ? `Search results for "${searchQuery}"` : 'Search'}
        </h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : results.length > 0 ? (
          <>
            <VideoGrid videos={results} />
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex space-x-2">
                  {pagination.currentPage > 1 && (
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                    >
                      Previous
                    </button>
                  )}
                  <span className="px-4 py-2 bg-purple-600 text-white rounded">
                    {pagination.currentPage}
                  </span>
                  {pagination.hasNextPage && (
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        ) : searchQuery ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No results found for "{searchQuery}"</p>
            <p className="text-gray-500 mt-2">Try different keywords or check your spelling</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Enter a search term to find videos</p>
          </div>
        )}
      </div>
    </Layout>
  );
} 