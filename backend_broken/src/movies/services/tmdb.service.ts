import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
  imdb_id?: string;
}

export interface TmdbSearchResponse {
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
}

@Injectable()
export class TmdbService {
  private readonly baseUrl = 'https://api.themoviedb.org/3';
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('TMDB_API_KEY');
  }

  async searchMovies(query: string, page: number = 1): Promise<TmdbSearchResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/search/movie`, {
          params: {
            api_key: this.apiKey,
            query,
            page,
          },
        }),
      );
      return response.data;
    } catch (error) {
      console.error('TMDB search error:', error.message);
      return {
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      };
    }
  }

  async getPopularMovies(page: number = 1): Promise<TmdbSearchResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/movie/popular`, {
          params: {
            api_key: this.apiKey,
            page,
          },
        }),
      );
      return response.data;
    } catch (error) {
      console.error('TMDB popular movies error:', error.message);
      return {
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      };
    }
  }

  async getMovieDetails(tmdbId: number): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/movie/${tmdbId}`, {
          params: {
            api_key: this.apiKey,
            append_to_response: 'credits,external_ids',
          },
        }),
      );
      return response.data;
    } catch (error) {
      console.error('TMDB movie details error:', error.message);
      return null;
    }
  }
}