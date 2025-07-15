'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Filter, SortAsc, SortDesc } from 'lucide-react';
import { moviesApi } from '@/api/movies';
import { MovieGrid } from '@/components/movies/MovieGrid';
import { SearchParams } from '@/types/movie';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  
  const [filters, setFilters] = useState<SearchParams>({
    query: queryParam,
    page: 1,
    limit: 20,
    sortBy: 'title',
    sortOrder: 'asc',
  });

  const [showFilters, setShowFilters] = useState(false);

  // Update filters when URL query changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, query: queryParam, page: 1 }));
  }, [queryParam]);

  // Search movies query
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['movies', 'search', filters],
    queryFn: () => moviesApi.searchMovies(filters),
    enabled: !!filters.query || filters.page === 1,
  });

  const handleFilterChange = (key: keyof SearchParams, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleLoadMore = () => {
    if (searchResults?.hasNext) {
      setFilters(prev => ({ ...prev, page: prev.page! + 1 }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          {filters.query ? `Search Results for "${filters.query}"` : 'Browse Movies'}
        </h1>
        {searchResults && (
          <p className="text-gray-400">
            {searchResults.totalResults} movies found
          </p>
        )}
      </div>

      {/* Filters & Sort */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
          >
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </button>

          {/* Sort Options */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="bg-gray-700 text-white rounded px-3 py-2 text-sm"
            >
              <option value="title">Title</option>
              <option value="year">Year</option>
              <option value="rating">Rating</option>
              <option value="popularity">Popularity</option>
            </select>
            
            <button
              onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
              className="bg-gray-700 text-white rounded px-3 py-2 text-sm hover:bg-gray-600 transition-colors flex items-center"
            >
              {filters.sortOrder === 'asc' ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Genre Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Genre
              </label>
              <input
                type="text"
                placeholder="e.g. Action, Comedy"
                value={filters.genre || ''}
                onChange={(e) => handleFilterChange('genre', e.target.value)}
                className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
              />
            </div>

            {/* Year Range */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Year From
              </label>
              <input
                type="number"
                placeholder="1990"
                value={filters.yearMin || ''}
                onChange={(e) => handleFilterChange('yearMin', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Year To
              </label>
              <input
                type="number"
                placeholder="2024"
                value={filters.yearMax || ''}
                onChange={(e) => handleFilterChange('yearMax', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
              />
            </div>

            {/* Rating Range */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Min Rating
              </label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                placeholder="7.0"
                value={filters.ratingMin || ''}
                onChange={(e) => handleFilterChange('ratingMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <MovieGrid 
        movies={searchResults?.results || []} 
        loading={isLoading}
      />

      {/* Load More */}
      {searchResults && searchResults.page < searchResults.totalPages && (
        <div className="text-center mt-8">
          <button
            onClick={handleLoadMore}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Load More Movies
          </button>
        </div>
      )}

      {/* No Results */}
      {searchResults && searchResults.results.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No movies found</div>
          <div className="text-gray-500 text-sm">
            Try adjusting your search query or filters
          </div>
        </div>
      )}
    </div>
  );
}