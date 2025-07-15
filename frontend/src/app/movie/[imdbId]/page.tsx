'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Play, 
  Download, 
  Star, 
  Clock, 
  Calendar, 
  User, 
  Eye,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { moviesApi } from '@/api/movies';
import { 
  formatRating, 
  formatRuntime, 
  formatYear, 
  getImageUrl, 
  formatProgress,
  formatSpeed 
} from '@/utils';

export default function MovieDetailPage() {
  const params = useParams();
  const router = useRouter();
  const imdbId = params.imdbId as string;
  const queryClient = useQueryClient();

  // Fetch movie for watching (Subject compliant)
  const { data: movie, isLoading, error } = useQuery({
    queryKey: ['movie', 'watch', imdbId],
    queryFn: () => moviesApi.getMovieForWatch(imdbId, 1),
    enabled: !!imdbId,
  });

  // Start streaming mutation
  const startStreamingMutation = useMutation({
    mutationFn: () => moviesApi.startStreaming(imdbId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movie', 'watch', imdbId] });
      // Redirect to watch page after starting streaming
      router.push(`/watch/${imdbId}`);
    },
  });

  const handleWatch = () => {
    if (movie?.canStream || movie?.isDownloaded) {
      startStreamingMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="aspect-[2/3] bg-gray-700 rounded-lg" />
            </div>
            <div className="lg:col-span-2">
              <div className="h-8 bg-gray-700 rounded mb-4" />
              <div className="h-4 bg-gray-700 rounded w-1/2 mb-6" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-4 bg-gray-700 rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Movie Not Found</h1>
        <p className="text-gray-400">The movie you're looking for doesn't exist or couldn't be loaded.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Movie Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Movie Poster */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-2xl">
              <Image
                src={getImageUrl(movie.poster)}
                alt={movie.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>

        {/* Movie Info */}
        <div className="lg:col-span-2">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {movie.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 mb-6 text-gray-300">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {formatYear(movie.year)}
            </div>
            {movie.runtime > 0 && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {formatRuntime(movie.runtime)}
              </div>
            )}
            {movie.imdbRating > 0 && (
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                {formatRating(movie.imdbRating)}
              </div>
            )}
          </div>

          {/* Genre */}
          {movie.genre && (
            <div className="mb-4">
              <span className="text-gray-400">Genre: </span>
              <span className="text-white">{movie.genre}</span>
            </div>
          )}

          {/* Director & Cast */}
          {movie.director && (
            <div className="mb-2">
              <span className="text-gray-400">Director: </span>
              <span className="text-white">{movie.director}</span>
            </div>
          )}
          {movie.cast && (
            <div className="mb-4">
              <span className="text-gray-400">Cast: </span>
              <span className="text-white">{movie.cast}</span>
            </div>
          )}

          {/* Watch Status */}
          <div className="flex items-center gap-2 mb-6">
            {movie.watchStatus?.watched && (
              <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                Watched
              </span>
            )}
            {movie.downloaded && (
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                Downloaded
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 mb-6">
            {/* Watch Button */}
            <button
              onClick={handleWatch}
              disabled={!movie.canStream && !movie.isDownloaded || startStreamingMutation.isPending}
              className={`w-full md:w-auto px-8 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors ${
                movie.canStream || movie.isDownloaded
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-600 text-gray-300 cursor-not-allowed'
              }`}
            >
              {startStreamingMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Play className="h-5 w-5" />
              )}
              <span>
                {movie.isDownloaded 
                  ? 'Watch Now' 
                  : movie.canStream 
                    ? 'Stream (Downloading)' 
                    : movie.isDownloading 
                      ? 'Downloading...' 
                      : 'Not Available'}
              </span>
            </button>

            {/* Status Message */}
            {movie.message && (
              <div className={`p-4 rounded-lg ${
                movie.downloadError 
                  ? 'bg-red-900/50 border border-red-700' 
                  : 'bg-blue-900/50 border border-blue-700'
              }`}>
                <p className="text-white text-sm">{movie.message}</p>
              </div>
            )}
          </div>

          {/* Download Status */}
          {movie.isDownloading && (
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <Download className="h-5 w-5 mr-2" />
                Download Status
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-white">{movie.downloadProgress?.toFixed(1) || 0}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${movie.downloadProgress || 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Status</span>
                  <span className="text-white">
                    {movie.isDownloaded ? 'Completed' : movie.canStream ? 'Streamable' : 'Downloading...'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Plot */}
          {movie.plot && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Synopsis</h3>
              <p className="text-gray-300 leading-relaxed">{movie.plot}</p>
            </div>
          )}
        </div>
      </div>

      {/* Comments Section - Coming Soon */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Comments</h3>
        <p className="text-gray-400">Comments feature coming soon...</p>
      </div>
    </div>
  );
}