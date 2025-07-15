import { MoviesService } from './movies.service';
export declare class MoviesController {
    private readonly moviesService;
    constructor(moviesService: MoviesService);
    searchMovies(query: string, page?: string, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<{
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
    getPopularMovies(page?: string): Promise<{
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
    healthCheck(): Promise<{
        status: string;
        timestamp: string;
        message: string;
        apis: {
            omdb: string;
        };
    }>;
    getMovieById(id: string): Promise<{
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
}
