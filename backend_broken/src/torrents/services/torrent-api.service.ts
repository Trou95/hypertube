import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface TorrentApiResult {
  filename: string;
  category: string;
  download: string;
  seeders: number;
  leechers: number;
  size: number;
  pubdate: string;
  episode_info?: any;
  ranked: number;
  info_page: string;
}

@Injectable()
export class TorrentApiService {
  private readonly baseUrl: string;
  private token: string | null = null;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('TORRENT_API_URL') || 'https://torrentapi.org/pubapi_v2.php';
  }

  private async getToken(): Promise<string> {
    if (this.token) return this.token;

    try {
      const response = await firstValueFrom(
        this.httpService.get(this.baseUrl, {
          params: {
            get_token: 'get_token',
          },
        }),
      );

      this.token = response.data.token;
      return this.token;
    } catch (error) {
      console.error('TorrentAPI token error:', error.message);
      throw new Error('Failed to get TorrentAPI token');
    }
  }

  async searchMovies(query: string, category: string = 'movies'): Promise<TorrentApiResult[]> {
    try {
      const token = await this.getToken();
      
      const response = await firstValueFrom(
        this.httpService.get(this.baseUrl, {
          params: {
            mode: 'search',
            search_string: query,
            category,
            token,
            format: 'json_extended',
            limit: 25,
            sort: 'seeders',
          },
        }),
      );

      if (response.data.error) {
        console.error('TorrentAPI search error:', response.data.error);
        return [];
      }

      return response.data.torrent_results || [];
    } catch (error) {
      console.error('TorrentAPI search error:', error.message);
      return [];
    }
  }

  async searchByImdbId(imdbId: string): Promise<TorrentApiResult[]> {
    try {
      const token = await this.getToken();
      
      const response = await firstValueFrom(
        this.httpService.get(this.baseUrl, {
          params: {
            mode: 'search',
            search_imdb: imdbId,
            token,
            format: 'json_extended',
            limit: 25,
            sort: 'seeders',
          },
        }),
      );

      if (response.data.error) {
        console.error('TorrentAPI IMDB search error:', response.data.error);
        return [];
      }

      return response.data.torrent_results || [];
    } catch (error) {
      console.error('TorrentAPI IMDB search error:', error.message);
      return [];
    }
  }
}