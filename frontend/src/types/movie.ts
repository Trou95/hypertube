export interface MovieThumbnail {
  id: number;
  imdbId: string;
  title: string;
  year: number;
  imdbRating: number;
  poster: string;
  genre: string;
  runtime: number;
  watched: boolean;
  downloaded: boolean;
  plot?: string;
  director?: string;
  cast?: string;
}

export interface MovieSearchResponse {
  results: MovieThumbnail[];
  page: number;
  totalPages: number;
  totalResults: number;
  message?: string;
}

export interface MovieDetails extends MovieThumbnail {
  watchStatus: {
    watched: boolean;
    progress: number;
    lastWatchedAt?: string;
  };
  canWatch: boolean;
  needsDownload: boolean;
  downloadStarted?: boolean;
  downloadId?: number;
  downloadStatus?: {
    id: number;
    status: string;
    progress: number;
    downloadSpeed: number;
    eta: string;
  };
  canStreamPartially?: boolean;
  message?: string;
  downloadError?: string;
}

export interface SearchParams {
  query?: string;
  page?: number;
  limit?: number;
  genre?: string;
  yearMin?: number;
  yearMax?: number;
  ratingMin?: number;
  ratingMax?: number;
  sortBy?: 'title' | 'year' | 'rating' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  userId?: number;
}