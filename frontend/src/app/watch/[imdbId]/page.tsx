'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { moviesApi } from '@/api/movies';
import { streamingApi } from '@/api/streaming';
import { authApi } from '@/api/auth';
import { HLSPlayer } from '@/components/video-player/HLSPlayer';
import { DownloadProgress } from '@/components/video-player/DownloadProgress';
import { ArrowLeft, Star, Calendar, Clock, User, Globe } from 'lucide-react';

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const imdbId = params.imdbId as string;
  const [showPlayer, setShowPlayer] = useState(false);
  const [watchStarted, setWatchStarted] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check authentication
  useEffect(() => {
    if (isClient && !authApi.isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
  }, [router, isClient]);

  // Trigger subject-compliant watch flow
  const { data: watchData, isLoading: watchLoading } = useQuery({
    queryKey: ['watch-movie', imdbId],
    queryFn: () => moviesApi.getMovieForWatch(imdbId, 1),
    enabled: !!imdbId && isClient && authApi.isAuthenticated(),
  });

  // Get streaming info (only after watch data is loaded)
  const { data: streamingInfo } = useQuery({
    queryKey: ['streaming-info', imdbId],
    queryFn: () => streamingApi.getStreamingInfo(imdbId),
    enabled: !!imdbId && isClient && authApi.isAuthenticated() && !!watchData,
    refetchInterval: watchStarted ? 5000 : 2000, // 5s during playback, 2s during download
    staleTime: 1000, // Cache for 1 second
    gcTime: 30000, // Keep in cache for 30 seconds
  });

  // Update progress mutation
  const progressMutation = useMutation({
    mutationFn: ({ progressSeconds, durationSeconds }: { progressSeconds: number; durationSeconds: number }) =>
      streamingApi.updateProgress(imdbId, { progressSeconds, durationSeconds }),
  });

  const handleProgressUpdate = (progressSeconds: number, durationSeconds: number) => {
    // Update progress every 10 seconds
    if (Math.floor(progressSeconds) % 10 === 0) {
      progressMutation.mutate({ progressSeconds, durationSeconds });
    }
  };

  const handleStartWatching = () => {
    setShowPlayer(true);
    setWatchStarted(true);
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!authApi.isAuthenticated()) {
    return null; // Will redirect to login
  }

  if (watchLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading movie...</div>
      </div>
    );
  }

  if (!watchData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400">Movie not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold text-white">
            {watchData.title} ({watchData.year})
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player / Download Progress */}
          <div className="lg:col-span-2">
            {showPlayer && streamingInfo?.streaming?.canStream ? (
              <HLSPlayer
                imdbId={imdbId}
                onProgress={handleProgressUpdate}
                initialProgress={streamingInfo?.watchHistory?.progressSeconds || 0}
              />
            ) : (
              <DownloadProgress
                imdbId={imdbId}
                onCanStream={handleStartWatching}
              />
            )}
          </div>

          {/* Movie Details */}
          <div className="space-y-6">
            {/* Poster */}
            {watchData.poster && (
              <div className="aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden">
                <img
                  src={watchData.poster}
                  alt={watchData.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Basic Info */}
            <div className="bg-gray-800 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                <span className="text-white font-medium">
                  {watchData.imdbRating || watchData.rating}/10
                </span>
                {watchData.metascore && (
                  <span className="text-gray-400">
                    • Metascore: {watchData.metascore}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-gray-400">
                <Calendar className="h-4 w-4" />
                <span>{watchData.year}</span>
                {watchData.runtime && (
                  <>
                    <span>•</span>
                    <Clock className="h-4 w-4" />
                    <span>{watchData.runtime}</span>
                  </>
                )}
              </div>

              {watchData.genre && (
                <div className="text-gray-400">
                  <strong>Genre:</strong> {watchData.genre}
                </div>
              )}

              {watchData.director && (
                <div className="flex items-center gap-2 text-gray-400">
                  <User className="h-4 w-4" />
                  <span><strong>Director:</strong> {watchData.director}</span>
                </div>
              )}

              {watchData.country && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Globe className="h-4 w-4" />
                  <span><strong>Country:</strong> {watchData.country}</span>
                </div>
              )}
            </div>

            {/* Plot */}
            {watchData.plot && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-white font-semibold mb-3">Plot</h3>
                <p className="text-gray-300 leading-relaxed">
                  {watchData.plot}
                </p>
              </div>
            )}

            {/* Cast */}
            {watchData.actors && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-white font-semibold mb-3">Cast</h3>
                <p className="text-gray-300">
                  {watchData.actors}
                </p>
              </div>
            )}

            {/* Watch Status */}
            {streamingInfo?.watchHistory && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-white font-semibold mb-3">Watch Progress</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white">
                      {Math.floor(streamingInfo.watchHistory.progressSeconds / 60)}:
                      {String(Math.floor(streamingInfo.watchHistory.progressSeconds % 60)).padStart(2, '0')}
                      {streamingInfo.watchHistory.durationSeconds > 0 && (
                        <span className="text-gray-400">
                          {' '}/ {Math.floor(streamingInfo.watchHistory.durationSeconds / 60)}:
                          {String(Math.floor(streamingInfo.watchHistory.durationSeconds % 60)).padStart(2, '0')}
                        </span>
                      )}
                    </span>
                  </div>
                  {streamingInfo.watchHistory.completed && (
                    <div className="text-green-400 text-sm">✅ Completed</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}