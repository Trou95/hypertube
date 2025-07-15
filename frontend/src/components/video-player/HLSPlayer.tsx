'use client';

import { useEffect, useRef, useState } from 'react';
import { streamingApi } from '@/api/streaming';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react';
import Hls from 'hls.js';

interface HLSPlayerProps {
  imdbId: string;
  onProgress?: (progressSeconds: number, durationSeconds: number) => void;
  initialProgress?: number;
}

export function HLSPlayer({ imdbId, onProgress, initialProgress = 0 }: HLSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekError, setSeekError] = useState<string | null>(null);
  const [hlsLoading, setHlsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const loadVideo = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setSeekError(null);
        setHlsLoading(false);
        setLoadingProgress(0);

        // Use direct video streaming only (HLS temporarily disabled due to conversion issues)
        const directUrl = `/api/stream/${imdbId}/video`;
        
        console.log(`🎬 Using direct video streaming: ${directUrl}`);
        video.src = directUrl;

        // Set initial progress if provided (after video loads)
        if (initialProgress > 0) {
          const setInitialTime = () => {
            if (video.readyState >= 1) {
              video.currentTime = initialProgress;
              console.log(`🎯 Set initial time to ${initialProgress}s`);
            } else {
              // Wait for metadata to load
              const onLoadedMetadata = () => {
                video.removeEventListener('loadedmetadata', onLoadedMetadata);
                video.currentTime = initialProgress;
                console.log(`🎯 Set initial time to ${initialProgress}s`);
              };
              video.addEventListener('loadedmetadata', onLoadedMetadata);
            }
          };
          setInitialTime();
        }

      } catch (err) {
        setError('Failed to load video');
        setIsLoading(false);
        setHlsLoading(false);
      }
    };

    loadVideo();
    
    return () => {
      // Cleanup HLS instance on unmount
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (hlsTimeoutRef.current) {
        clearTimeout(hlsTimeoutRef.current);
      }
    };
  }, [imdbId, initialProgress]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let lastProgressUpdate = 0;

    const updateTime = () => {
      if (!isSeeking) {
        setCurrentTime(video.currentTime);
      }
      // Only trigger progress callback every 2 seconds to reduce API calls
      const now = Date.now();
      if (onProgress && video.duration && now - lastProgressUpdate >= 2000) {
        onProgress(video.currentTime, video.duration);
        lastProgressUpdate = now;
      }
    };

    const updateDuration = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    const handleWaiting = () => {
      setIsBuffering(true);
      console.log('🔄 Video buffering...');
    };
    
    const handleCanPlay = () => {
      setIsBuffering(false);
      setIsLoading(false);
      console.log('✅ Video ready to play');
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      console.log('🔄 Video loading started');
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const duration = video.duration;
        if (duration > 0) {
          const bufferedPercent = (bufferedEnd / duration) * 100;
          setLoadingProgress(bufferedPercent);
          console.log(`📊 Buffer progress: ${bufferedPercent.toFixed(1)}%`);
        }
      }
    };

    const handleLoadedData = () => {
      setIsLoading(false);
      console.log('✅ Video data loaded');
    };

    const handleStalled = () => {
      setIsBuffering(true);
      console.log('⚠️ Video stalled - waiting for data');
    };

    const handleSuspend = () => {
      console.log('⏸️ Video loading suspended');
    };

    const handleError = (e: Event) => {
      const videoElement = e.target as HTMLVideoElement;
      const error = videoElement?.error;
      console.error('❌ Video error occurred:', {
        error: error?.message,
        code: error?.code,
        src: videoElement?.src,
        readyState: videoElement?.readyState,
        networkState: videoElement?.networkState
      });
      
      const errorMsg = error?.message || `Video error (code: ${error?.code})` || 'Video error occurred';
      setError(errorMsg);
      setIsLoading(false);
      setIsBuffering(false);
      setHlsLoading(false);
    };

    const handleSeeked = () => {
      setIsSeeking(false);
      setSeekError(null);
      console.log('✅ Seek completed');
    };

    const handleSeeking = () => {
      setIsSeeking(true);
      console.log('🔄 Seeking...');
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('stalled', handleStalled);
    video.addEventListener('suspend', handleSuspend);
    video.addEventListener('error', handleError);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('seeking', handleSeeking);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('stalled', handleStalled);
      video.removeEventListener('suspend', handleSuspend);
      video.removeEventListener('error', handleError);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('seeking', handleSeeking);
      // Cleanup timeouts
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (hlsTimeoutRef.current) {
        clearTimeout(hlsTimeoutRef.current);
      }
      // Cleanup HLS
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [onProgress, isSeeking]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video || !duration || isNaN(duration)) return;

    const seekTime = (parseFloat(e.target.value) / 100) * duration;
    
    // Validate seek time
    if (seekTime < 0 || seekTime > duration) {
      setSeekError('Invalid seek position');
      return;
    }
    
    // Update UI immediately for smooth experience
    setCurrentTime(seekTime);
    setIsSeeking(true);
    setSeekError(null);
    
    // Clear any existing seek timeout
    if (seekTimeoutRef.current) {
      clearTimeout(seekTimeoutRef.current);
    }
    
    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    seekTimeoutRef.current = setTimeout(() => {
      try {
        // Wait for video to be ready
        const performSeek = () => {
          if (video.readyState >= 1) { // HAVE_METADATA - reduced requirement
            // Pause video before seeking to prevent freezing
            const wasPlaying = !video.paused;
            
            if (wasPlaying) {
              video.pause();
            }
            
            video.currentTime = seekTime;
            console.log(`🎯 Seeking to ${seekTime.toFixed(1)}s`);
            
            // Create a one-time event listener for when seek completes
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked);
              setIsSeeking(false);
              
              // Resume playback if it was playing before
              if (wasPlaying) {
                video.play().catch(err => {
                  console.warn('⚠️ Could not resume playback after seek:', err);
                });
              }
            };
            
            // Add timeout fallback in case seeked event doesn't fire
            const seekTimeout = setTimeout(() => {
              video.removeEventListener('seeked', onSeeked);
              setIsSeeking(false);
              if (wasPlaying) {
                video.play().catch(err => {
                  console.warn('⚠️ Could not resume playback after seek timeout:', err);
                });
              }
            }, 3000); // 3 second timeout
            
            video.addEventListener('seeked', () => {
              clearTimeout(seekTimeout);
              onSeeked();
            });
            
          } else {
            console.warn('⚠️ Video not ready for seeking, retrying...');
            // Retry when video is ready with exponential backoff
            retryTimeoutRef.current = setTimeout(performSeek, 200);
          }
        };
        
        performSeek();
      } catch (error) {
        console.error('❌ Seek error:', error);
        setSeekError('Seek failed, please try again');
        setIsSeeking(false);
      }
    }, 300); // Increased debounce to 300ms for better stability
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value) / 100;
    video.volume = newVolume;
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="bg-gray-900 aspect-video flex items-center justify-center rounded-lg">
        <div className="text-center">
          <div className="text-red-400 mb-2">Failed to load video</div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
          >
            <RotateCcw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full aspect-video"
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        controls={false}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="text-white text-lg">Loading video...</div>
            {loadingProgress > 0 && (
              <div className="mt-2">
                <div className="w-48 bg-gray-700 rounded-full h-2 mx-auto mb-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(loadingProgress, 100)}%` }}
                  ></div>
                </div>
                <div className="text-white text-sm">
                  Buffer: {Math.round(loadingProgress)}%
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HLS Loading Overlay */}
      {hlsLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <div className="text-white text-lg">Preparing HLS stream...</div>
            <div className="text-gray-300 text-sm mt-2">Loading video chunks</div>
          </div>
        </div>
      )}

      {/* Buffering Overlay */}
      {isBuffering && !isLoading && !hlsLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <div className="text-white text-sm">Buffering...</div>
            {loadingProgress > 0 && (
              <div className="text-gray-300 text-xs mt-1">
                Buffer: {Math.round(loadingProgress)}%
              </div>
            )}
          </div>
        </div>
      )}

      {/* Seeking Indicator */}
      {isSeeking && (
        <div className="absolute top-4 right-4 bg-black/70 rounded px-3 py-1">
          <div className="text-white text-sm flex items-center gap-2">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
            Seeking...
          </div>
        </div>
      )}

      {/* Seek Error */}
      {seekError && (
        <div className="absolute top-4 left-4 bg-red-600/90 rounded px-3 py-1">
          <div className="text-white text-sm">{seekError}</div>
        </div>
      )}

      {/* Video Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        {/* Progress Bar */}
        <div className="mb-4 relative">
          {/* Buffer Progress Background */}
          <div className="absolute inset-0 h-1 bg-gray-600 rounded-lg">
            <div 
              className="h-1 bg-gray-400 rounded-lg transition-all duration-300"
              style={{ width: `${Math.min(loadingProgress, 100)}%` }}
            ></div>
          </div>
          
          {/* Seek Bar */}
          <input
            type="range"
            min="0"
            max="100"
            value={duration > 0 ? (currentTime / duration) * 100 : 0}
            onChange={handleSeek}
            className="relative w-full h-1 bg-transparent rounded-lg appearance-none cursor-pointer slider z-10"
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="text-white hover:text-blue-400 transition-colors"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-white hover:text-blue-400 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume * 100}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-blue-400 transition-colors"
          >
            <Maximize className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}