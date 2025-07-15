import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MoviesService {
  private readonly omdbApiKey: string;
  private readonly omdbBaseUrl = 'http://www.omdbapi.com';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.omdbApiKey = this.configService.get<string>('OMDB_API_KEY');
  }

  async searchMovies(query: string, page: number = 1, sortBy?: string, sortOrder?: 'asc' | 'desc') {
    try {
      const response = await firstValueFrom(
        this.httpService.get(this.omdbBaseUrl, {
          params: {
            apikey: this.omdbApiKey,
            s: query,
            page: page.toString(),
            type: 'movie',
          },
        }),
      );

      if (response.data.Response === 'False') {
        return {
          results: [],
          page: 1,
          totalPages: 1,
          totalResults: 0,
          message: response.data.Error,
        };
      }

      let movies = response.data.Search.map(movie => this.formatMovieThumbnail(movie));

      if (sortBy) {
        movies = this.sortMovies(movies, sortBy, sortOrder);
      }

      const totalResults = parseInt(response.data.totalResults) || 0;
      const totalPages = Math.ceil(totalResults / 10);

      return {
        results: movies,
        page: page,
        totalPages,
        totalResults,
      };
    } catch (error) {
      console.error('OMDB search error:', error.message);
      throw new Error('Failed to search movies');
    }
  }

  async getPopularMovies(page: number = 1) {
    try {
      // OMDB doesn't have a "popular" endpoint, so we'll search for common movie terms
      const popularSearches = ['action', 'adventure', 'comedy', 'drama', 'horror', 'thriller'];
      const randomSearch = popularSearches[Math.floor(Math.random() * popularSearches.length)];
      
      const response = await firstValueFrom(
        this.httpService.get(this.omdbBaseUrl, {
          params: {
            apikey: this.omdbApiKey,
            s: randomSearch,
            page: page.toString(),
            type: 'movie',
          },
        }),
      );

      if (response.data.Response === 'False') {
        return {
          results: [],
          page: 1,
          totalPages: 1,
          totalResults: 0,
          message: response.data.Error,
        };
      }

      const movies = response.data.Search.map(movie => this.formatMovieThumbnail(movie));

      const totalResults = parseInt(response.data.totalResults) || 0;
      const totalPages = Math.ceil(totalResults / 10);

      return {
        results: movies,
        page: page,
        totalPages,
        totalResults,
      };
    } catch (error) {
      console.error('OMDB popular movies error:', error.message);
      throw new Error('Failed to get popular movies');
    }
  }

  async getMovieById(imdbId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(this.omdbBaseUrl, {
          params: {
            apikey: this.omdbApiKey,
            i: imdbId,
            plot: 'full',
          },
        }),
      );

      if (response.data.Response === 'False') {
        throw new Error(response.data.Error || 'Movie not found');
      }

      return this.formatMovieDetails(response.data);
    } catch (error) {
      console.error('OMDB movie details error:', error.message);
      throw new Error('Failed to get movie details');
    }
  }

  private formatMovieThumbnail(movie: any) {
    return {
      id: movie.imdbID,
      imdbId: movie.imdbID,
      title: movie.Title,
      year: movie.Year ? parseInt(movie.Year) : null,
      poster: movie.Poster !== 'N/A' ? movie.Poster : null,
      rating: 0, // Will be filled when getting detailed info
      popularity: 0,
      overview: '', // Not available in search results
      watched: false,
      downloadProgress: 0,
      isDownloading: false,
      isStreaming: false,
      type: movie.Type,
    };
  }

  private formatMovieDetails(omdbData: any) {
    return {
      id: omdbData.imdbID,
      imdbId: omdbData.imdbID,
      title: omdbData.Title,
      year: omdbData.Year ? parseInt(omdbData.Year) : null,
      releaseDate: omdbData.Released !== 'N/A' ? omdbData.Released : null,
      runtime: omdbData.Runtime !== 'N/A' ? omdbData.Runtime : null,
      poster: omdbData.Poster !== 'N/A' ? omdbData.Poster : null,
      rating: omdbData.imdbRating !== 'N/A' ? parseFloat(omdbData.imdbRating) : 0,
      imdbRating: omdbData.imdbRating !== 'N/A' ? parseFloat(omdbData.imdbRating) : null,
      metascore: omdbData.Metascore !== 'N/A' ? parseInt(omdbData.Metascore) : null,
      overview: omdbData.Plot !== 'N/A' ? omdbData.Plot : '',
      plot: omdbData.Plot !== 'N/A' ? omdbData.Plot : '',
      genre: omdbData.Genre !== 'N/A' ? omdbData.Genre : '',
      director: omdbData.Director !== 'N/A' ? omdbData.Director : null,
      writer: omdbData.Writer !== 'N/A' ? omdbData.Writer : null,
      actors: omdbData.Actors !== 'N/A' ? omdbData.Actors : null,
      language: omdbData.Language !== 'N/A' ? omdbData.Language : null,
      country: omdbData.Country !== 'N/A' ? omdbData.Country : null,
      awards: omdbData.Awards !== 'N/A' ? omdbData.Awards : null,
      boxOffice: omdbData.BoxOffice !== 'N/A' ? omdbData.BoxOffice : null,
      production: omdbData.Production !== 'N/A' ? omdbData.Production : null,
      website: omdbData.Website !== 'N/A' ? omdbData.Website : null,
      
      // Download/streaming status
      watched: false,
      downloadProgress: 0,
      isDownloading: false,
      isStreaming: false,
    };
  }

  private sortMovies(movies: any[], sortBy: string, sortOrder: 'asc' | 'desc' = 'desc') {
    return movies.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'title') {
        aValue = aValue?.toLowerCase() || '';
        bValue = bValue?.toLowerCase() || '';
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (sortOrder === 'asc') {
        return (aValue || 0) - (bValue || 0);
      } else {
        return (bValue || 0) - (aValue || 0);
      }
    });
  }
}