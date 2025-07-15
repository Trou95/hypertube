import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface OmdbMovie {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
  Plot?: string;
  Director?: string;
  Actors?: string;
  Genre?: string;
  Runtime?: string;
  imdbRating?: string;
}

@Injectable()
export class OmdbService {
  private readonly baseUrl = 'http://www.omdbapi.com';
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('OMDB_API_KEY');
  }

  async searchMovies(query: string, page: number = 1): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(this.baseUrl, {
          params: {
            apikey: this.apiKey,
            s: query,
            type: 'movie',
            page,
          },
        }),
      );
      return response.data;
    } catch (error) {
      console.error('OMDB search error:', error.message);
      return { Search: [], totalResults: '0' };
    }
  }

  async getMovieByImdbId(imdbId: string): Promise<OmdbMovie | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(this.baseUrl, {
          params: {
            apikey: this.apiKey,
            i: imdbId,
            plot: 'full',
          },
        }),
      );
      return response.data.Response === 'True' ? response.data : null;
    } catch (error) {
      console.error('OMDB movie details error:', error.message);
      return null;
    }
  }

  async getMovieByTitle(title: string, year?: string): Promise<OmdbMovie | null> {
    try {
      const params: any = {
        apikey: this.apiKey,
        t: title,
        plot: 'full',
      };
      if (year) params.y = year;

      const response = await firstValueFrom(
        this.httpService.get(this.baseUrl, { params }),
      );
      return response.data.Response === 'True' ? response.data : null;
    } catch (error) {
      console.error('OMDB movie by title error:', error.message);
      return null;
    }
  }
}