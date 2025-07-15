import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
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
  
  // Add method to get magnet URI with trackers
  getMagnetUri?: (name: string) => string;
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
  private readonly baseUrl = 'https://yts.mx/api/v2';

  constructor(private readonly httpService: HttpService) {}

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

  async getMovieByImdbId(imdbId: string, movieTitle?: string): Promise<YtsMovie | null> {
    try {
      const startTime = Date.now();
      console.log(`🔍 YTS: Searching for ${imdbId}`);
      
      // First try with IMDB ID
      const imdbSearchStart = Date.now();
      let response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/list_movies.json`, {
          params: {
            query_term: imdbId,
            limit: 1,
          },
        }),
      );
      console.log(`⏱️ YTS IMDB search took: ${Date.now() - imdbSearchStart}ms`);

      // If IMDB ID search fails and we have movie title, try with title
      if ((!response.data.data.movies || response.data.data.movies.length === 0) && movieTitle) {
        console.log(`IMDB search failed for ${imdbId}, trying with title: ${movieTitle}`);
        
        const titleSearchStart = Date.now();
        response = await firstValueFrom(
          this.httpService.get(`${this.baseUrl}/list_movies.json`, {
            params: {
              query_term: movieTitle,
              limit: 10, // Get more results to find exact match
            },
          }),
        );
        console.log(`⏱️ YTS title search took: ${Date.now() - titleSearchStart}ms`);

        // Find movie with matching IMDB ID
        if (response.data.status === 'ok' && response.data.data.movies) {
          const exactMatch = response.data.data.movies.find(
            (movie: any) => movie.imdb_code === imdbId
          );
          if (exactMatch) {
            return exactMatch;
          }
          
          // If no exact IMDB match, return first result
          if (response.data.data.movies.length > 0) {
            console.log(`Using first result for ${movieTitle}: ${response.data.data.movies[0].title}`);
            return response.data.data.movies[0];
          }
        }
      }

      if (response.data.status === 'ok' && response.data.data.movies && response.data.data.movies.length > 0) {
        console.log(`✅ YTS total search took: ${Date.now() - startTime}ms`);
        return response.data.data.movies[0];
      }
      console.log(`❌ YTS search failed after: ${Date.now() - startTime}ms`);
      return null;
    } catch (error) {
      console.error('YTS search error:', error.message);
      return null;
    }
  }

  async getTorrentsByImdbId(imdbId: string, movieTitle?: string): Promise<YtsTorrent[]> {
    const movie = await this.getMovieByImdbId(imdbId, movieTitle);
    return movie?.torrents || [];
  }

  getBestTorrent(torrents: YtsTorrent[]): YtsTorrent | null {
    if (!torrents || torrents.length === 0) return null;
    
    // Prefer 1080p with good seeds, fallback to 720p
    const preferred = torrents.find(t => t.quality === '1080p' && t.seeds > 0);
    if (preferred) return preferred;
    
    const fallback = torrents.find(t => t.quality === '720p' && t.seeds > 0);
    if (fallback) return fallback;
    
    // Return any torrent with seeds
    return torrents.find(t => t.seeds > 0) || torrents[0];
  }
}