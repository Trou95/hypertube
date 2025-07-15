import { apiClient } from './client';
import { MovieSearchResponse, MovieDetails, SearchParams } from '@/types/movie';

export const moviesApi = {
  // Search movies with thumbnails
  searchMovies: async (params: SearchParams): Promise<MovieSearchResponse> => {
    const { data } = await apiClient.get('/movies/search', { params });
    return data;
  },

  // Get popular movies
  getPopularMovies: async (page: number = 1, limit: number = 20): Promise<MovieSearchResponse> => {
    const { data } = await apiClient.get('/movies/popular', {
      params: { page, limit }
    });
    return data;
  },

  // Get movie for watching (Subject compliant)
  getMovieForWatch: async (imdbId: string, userId: number = 1): Promise<MovieDetails> => {
    const { data } = await apiClient.get(`/watch/${imdbId}`, {
      params: { userId }
    });
    return data;
  },

  // Get movie details by IMDB ID
  getMovieDetails: async (imdbId: string): Promise<MovieDetails> => {
    const { data } = await apiClient.get(`/movies/imdb/${imdbId}`);
    return data;
  },

  // Start streaming session
  startStreaming: async (imdbId: string, userId: number = 1, startTime: number = 0) => {
    const { data } = await apiClient.post(`/watch/${imdbId}/stream`, {
      userId,
      startTime
    });
    return data;
  },

  // Stop streaming session
  stopStreaming: async (imdbId: string, currentTime: number, completed: boolean = false, userId: number = 1) => {
    const { data } = await apiClient.post(`/watch/${imdbId}/stop`, {
      userId,
      currentTime,
      completed
    });
    return data;
  },

  // Mark movie as watched
  markAsWatched: async (movieId: number, userId: number = 1) => {
    const { data } = await apiClient.post(`/movies/${movieId}/watch`, {}, {
      params: { userId }
    });
    return data;
  },

  // Update watch progress
  updateProgress: async (movieId: number, progressSeconds: number, userId: number = 1) => {
    const { data } = await apiClient.patch(`/movies/${movieId}/progress`, {
      progressSeconds,
      userId
    });
    return data;
  },

  // Get watch status
  getWatchStatus: async (movieId: number, userId: number = 1) => {
    const { data } = await apiClient.get(`/movies/${movieId}/watch-status`, {
      params: { userId }
    });
    return data;
  }
};