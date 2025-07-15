import { apiClient } from './client';

export interface StreamingInfo {
  available: boolean;
  download?: {
    id: number;
    status: string;
    progress: number;
    isConverted: boolean;
    hlsAvailable: boolean;
  };
  watchHistory?: {
    progressSeconds: number;
    durationSeconds: number;
    completed: boolean;
    lastWatchedAt: string;
  };
  streaming?: {
    canStream: boolean;
    hlsPlaylistUrl: string | null;
    directVideoUrl: string | null;
  };
}

export interface WatchProgress {
  progressSeconds: number;
  durationSeconds?: number;
}

export const streamingApi = {
  getStreamingInfo: async (imdbId: string): Promise<StreamingInfo> => {
    const { data } = await apiClient.get(`/stream/${imdbId}/info`);
    return data;
  },

  updateProgress: async (imdbId: string, progress: WatchProgress) => {
    const { data } = await apiClient.post(`/stream/${imdbId}/progress`, progress);
    return data;
  },

  getHLSPlaylistUrl: (imdbId: string): string => {
    return `http://localhost:3000/stream/${imdbId}/playlist.m3u8`;
  },
};