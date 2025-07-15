'use client';

import { useQuery } from '@tanstack/react-query';
import { streamingApi } from '@/api/streaming';
import { Download, Play, Clock } from 'lucide-react';

interface DownloadProgressProps {
  imdbId: string;
  onCanStream?: () => void;
}

export function DownloadProgress({ imdbId, onCanStream }: DownloadProgressProps) {
  const { data: streamingInfo, refetch } = useQuery({
    queryKey: ['streaming-info', imdbId],
    queryFn: () => streamingApi.getStreamingInfo(imdbId),
    refetchInterval: 2000, // Refetch every 2 seconds
  });

  if (!streamingInfo?.available) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <div className="text-gray-400">Movie not available for streaming</div>
      </div>
    );
  }

  const { download, streaming } = streamingInfo;

  if (!download) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <div className="text-gray-400">Download information not available</div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'downloading':
        return 'text-blue-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const getStatusIcon = (status: string, canStream: boolean) => {
    if (canStream) {
      return <Play className="h-5 w-5 text-green-400" />;
    }
    
    switch (status) {
      case 'completed':
        return <Download className="h-5 w-5 text-green-400" />;
      case 'downloading':
        return <Download className="h-5 w-5 text-blue-400 animate-pulse" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-400" />;
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {getStatusIcon(download.status, streaming?.canStream || false)}
          <div>
            <div className="text-white font-medium">
              {streaming?.canStream ? 'Ready to Stream' : 'Downloading...'}
            </div>
            <div className={`text-sm ${getStatusColor(download.status)}`}>
              Status: {download.status}
            </div>
          </div>
        </div>

        {streaming?.canStream && onCanStream && (
          <button
            onClick={onCanStream}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Play className="h-4 w-4" />
            Watch Now
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Download Progress</span>
          <span className="text-white font-mono text-lg">{Number(download.progress || 0).toFixed(2)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${
              Number(download.progress || 0) >= 100 
                ? 'bg-green-500' 
                : Number(download.progress || 0) >= 5 
                  ? 'bg-blue-500' 
                  : 'bg-yellow-500'
            }`}
            style={{ width: `${Math.min(Number(download.progress || 0), 100)}%` }}
          />
        </div>
        
        {/* Detailed Info Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-gray-400">
            <span>Status: </span>
            <span className="text-white">{download.status}</span>
          </div>
          <div className="text-gray-400">
            <span>ID: </span>
            <span className="text-white">{download.id}</span>
          </div>
        </div>
        
        <div className="text-xs text-gray-400">
          {Number(download.progress || 0) >= 5 
            ? '✅ Streaming available - Ready to watch!' 
            : `🔄 ${(5 - Number(download.progress || 0)).toFixed(2)}% more needed for streaming`
          }
        </div>
      </div>

      {/* Additional Info */}
      {download.isConverted && (
        <div className="mt-4 text-sm text-green-400">
          ✅ Video converted for streaming
        </div>
      )}
    </div>
  );
}