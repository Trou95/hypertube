import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
export declare class MoviesService {
    private readonly httpService;
    private readonly configService;
    private readonly omdbApiKey;
    private readonly omdbBaseUrl;
    constructor(httpService: HttpService, configService: ConfigService);
    searchMovies(query: string, page?: number, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<{
        results: any[];
        page: number;
        totalPages: number;
        totalResults: number;
        message: any;
    } | {
        results: any;
        page: number;
        totalPages: number;
        totalResults: number;
        message?: undefined;
    }>;
    getPopularMovies(page?: number): Promise<{
        results: any[];
        page: number;
        totalPages: number;
        totalResults: number;
        message: any;
    } | {
        results: any;
        page: number;
        totalPages: number;
        totalResults: number;
        message?: undefined;
    }>;
    getMovieById(imdbId: string): Promise<{
        id: any;
        imdbId: any;
        title: any;
        year: number;
        releaseDate: any;
        runtime: any;
        poster: any;
        rating: number;
        imdbRating: number;
        metascore: number;
        overview: any;
        plot: any;
        genre: any;
        director: any;
        writer: any;
        actors: any;
        language: any;
        country: any;
        awards: any;
        boxOffice: any;
        production: any;
        website: any;
        watched: boolean;
        downloadProgress: number;
        isDownloading: boolean;
        isStreaming: boolean;
    }>;
    private formatMovieThumbnail;
    private formatMovieDetails;
    private sortMovies;
}
