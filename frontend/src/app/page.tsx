'use client';

import { useQuery } from '@tanstack/react-query';
import { moviesApi } from '@/api/movies';
import { MovieGrid } from '@/components/movies/MovieGrid';
import { TrendingUp, Clock, Star, Film, Zap, Heart } from 'lucide-react';

export default function HomePage() {
  // Fetch popular movies by subject/genre
  const { data: actionMovies, isLoading: actionLoading } = useQuery({
    queryKey: ['movies', 'action'],
    queryFn: () => moviesApi.searchMovies({ query: 'action', page: 1, limit: 6 }),
  });

  const { data: comedyMovies, isLoading: comedyLoading } = useQuery({
    queryKey: ['movies', 'comedy'],
    queryFn: () => moviesApi.searchMovies({ query: 'comedy', page: 1, limit: 6 }),
  });

  const { data: dramaMovies, isLoading: dramaLoading } = useQuery({
    queryKey: ['movies', 'drama'],
    queryFn: () => moviesApi.searchMovies({ query: 'drama', page: 1, limit: 6 }),
  });

  const { data: popularMovies, isLoading: popularLoading } = useQuery({
    queryKey: ['movies', 'popular'],
    queryFn: () => moviesApi.getPopularMovies(1, 6),
  });

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-12 bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          Welcome to Hypertube
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Stream movies instantly with our torrent-powered platform. 
          Subject-compliant, secure, and lightning fast.
        </p>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
          <div className="bg-black/20 rounded-lg p-4">
            <TrendingUp className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">2+ APIs</div>
            <div className="text-gray-400 text-sm">External Sources</div>
          </div>
          <div className="bg-black/20 rounded-lg p-4">
            <Clock className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">Instant</div>
            <div className="text-gray-400 text-sm">Streaming Start</div>
          </div>
          <div className="bg-black/20 rounded-lg p-4">
            <Star className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">HD Quality</div>
            <div className="text-gray-400 text-sm">Best Torrents</div>
          </div>
        </div>
      </section>

      {/* Action Movies Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Zap className="h-6 w-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-white">Action Movies</h2>
          </div>
          <p className="text-gray-400">
            {actionMovies && `${actionMovies.totalResults} movies`}
          </p>
        </div>

        <MovieGrid 
          movies={actionMovies?.results || []} 
          loading={actionLoading}
        />
      </section>

      {/* Comedy Movies Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Heart className="h-6 w-6 text-pink-500" />
            <h2 className="text-2xl font-bold text-white">Comedy Movies</h2>
          </div>
          <p className="text-gray-400">
            {comedyMovies && `${comedyMovies.totalResults} movies`}
          </p>
        </div>

        <MovieGrid 
          movies={comedyMovies?.results || []} 
          loading={comedyLoading}
        />
      </section>

      {/* Drama Movies Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Film className="h-6 w-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-white">Drama Movies</h2>
          </div>
          <p className="text-gray-400">
            {dramaMovies && `${dramaMovies.totalResults} movies`}
          </p>
        </div>

        <MovieGrid 
          movies={dramaMovies?.results || []} 
          loading={dramaLoading}
        />
      </section>

      {/* Popular Movies Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-6 w-6 text-green-500" />
            <h2 className="text-2xl font-bold text-white">Popular Movies</h2>
          </div>
          <p className="text-gray-400">
            {popularMovies && `${popularMovies.totalResults} movies`}
          </p>
        </div>

        <MovieGrid 
          movies={popularMovies?.results || []} 
          loading={popularLoading}
        />
      </section>

      {/* How it Works */}
      <section className="bg-gray-800/50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          How Hypertube Works
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-blue-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold">1</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Search Movies</h3>
            <p className="text-gray-400 text-sm">
              Browse through thousands of movies from multiple external APIs
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold">2</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Auto Download</h3>
            <p className="text-gray-400 text-sm">
              Click to watch and torrents start downloading automatically in background
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold">3</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Stream Instantly</h3>
            <p className="text-gray-400 text-sm">
              Start watching as soon as enough data is downloaded
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}