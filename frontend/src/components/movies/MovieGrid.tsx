'use client';

import { MovieThumbnail } from '@/types/movie';
import { MovieCard } from './MovieCard';
import { MovieCardSkeleton } from './MovieCardSkeleton';

interface MovieGridProps {
  movies: MovieThumbnail[];
  loading?: boolean;
  columns?: number;
}

export function MovieGrid({ movies, loading = false, columns = 6 }: MovieGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
  }[columns] || 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6';

  if (loading) {
    return (
      <div className={`grid gap-6 ${gridCols}`}>
        {Array.from({ length: 12 }).map((_, index) => (
          <MovieCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">No movies found</div>
        <div className="text-gray-500 text-sm">Try adjusting your search or filters</div>
      </div>
    );
  }

  return (
    <div className={`grid gap-6 ${gridCols}`}>
      {movies.map((movie) => (
        <MovieCard key={movie.id || movie.imdbId} movie={movie} />
      ))}
    </div>
  );
}