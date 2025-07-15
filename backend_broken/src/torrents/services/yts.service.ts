import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface YtsTorrent {
  url: string;
  hash: string;
  quality: string;
  type: string;
  seeds: number;
  peers: number;
  size: string;
  size_bytes: number;
  date_uploaded: string;
  date_uploaded_unix: number;
}

export interface YtsMovie {
  id: number;
  url: string;
  imdb_code: string;
  title: string;
  title_english: string;
  title_long: string;
  slug: string;
  year: number;
  rating: number;
  runtime: number;
  genres: string[];
  summary: string;
  description_full: string;
  synopsis: string;
  yt_trailer_code: string;
  language: string;
  mpa_rating: string;
  background_image: string;
  background_image_original: string;
  small_cover_image: string;
  medium_cover_image: string;
  large_cover_image: string;
  state: string;
  torrents: YtsTorrent[];
  date_uploaded: string;
  date_uploaded_unix: number;
}

@Injectable()
export class YtsService {
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('YTS_API_URL') || 'https://yts.mx/api/v2';
  }

  async searchMovies(query: string, page: number = 1): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/list_movies.json`, {
          params: {
            query_term: query,
            page,
            limit: 20,
            sort_by: 'seeds',
            order_by: 'desc',
          },
        }),
      );
      return response.data;
    } catch (error) {
      console.error('YTS search error:', error.message);
      return { status: 'error', data: { movies: [], movie_count: 0 } };
    }
  }

  async getMovieDetails(movieId: number): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/movie_details.json`, {
          params: {
            movie_id: movieId,
            with_images: true,
            with_cast: true,
          },
        }),
      );
      return response.data;
    } catch (error) {
      console.error('YTS movie details error:', error.message);
      return { status: 'error', data: { movie: null } };
    }
  }

  async getMovieByImdbId(imdbId: string): Promise<YtsMovie | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/list_movies.json`, {
          params: {
            query_term: imdbId,
            limit: 1,
          },
        }),
      );

      if (response.data.status === 'ok' && response.data.data.movies && response.data.data.movies.length > 0) {
        return response.data.data.movies[0];
      }
      return null;
    } catch (error) {
      console.error('YTS IMDB search error:', error.message);
      return null;
    }
  }

  async getTorrentsByImdbId(imdbId: string): Promise<YtsTorrent[]> {
    const movie = await this.getMovieByImdbId(imdbId);
    return movie?.torrents || [];
  }
}