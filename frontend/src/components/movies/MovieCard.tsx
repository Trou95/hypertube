'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, Clock, Eye, Download } from 'lucide-react';
import { MovieThumbnail } from '@/types/movie';
import { formatRating, formatRuntime, formatYear, getImageUrl, truncateText } from '@/utils';

interface MovieCardProps {
  movie: MovieThumbnail;
}

export function MovieCard({ movie }: MovieCardProps) {
  const handleWatchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = `/watch/${movie.imdbId}`;
  };

  return (
    <div className="movie-card bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={handleWatchClick}>
        {/* Movie Poster */}
        <div className="relative aspect-[2/3] overflow-hidden">
          <Image
            src={getImageUrl(movie.poster)}
            alt={movie.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Status Badges */}
          <div className="absolute top-2 left-2 flex flex-col space-y-1">
            {movie.watched && (
              <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                <Eye className="h-3 w-3 mr-1" />
                Watched
              </span>
            )}
            {movie.downloaded && (
              <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                <Download className="h-3 w-3 mr-1" />
                Downloaded
              </span>
            )}
          </div>

          {/* Rating Badge */}
          {movie.imdbRating > 0 && (
            <div className="absolute top-2 right-2 bg-yellow-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
              <Star className="h-3 w-3 mr-1 fill-current" />
              {formatRating(movie.imdbRating)}
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 gradient-overlay" />

          {/* Movie Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">
              {movie.title}
            </h3>
            <div className="flex items-center text-gray-300 text-xs space-x-2">
              <span>{formatYear(movie.year)}</span>
              {movie.runtime > 0 && (
                <>
                  <span>•</span>
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatRuntime(movie.runtime)}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Movie Details */}
        <div className="p-4">
          <h3 className="text-white font-semibold mb-2 line-clamp-1">
            {movie.title}
          </h3>
          
          {movie.genre && (
            <p className="text-gray-400 text-sm mb-2">
              {truncateText(movie.genre, 30)}
            </p>
          )}
          
          {movie.plot && (
            <p className="text-gray-300 text-xs line-clamp-3">
              {truncateText(movie.plot, 120)}
            </p>
          )}
        </div>
      </div>
  );
}