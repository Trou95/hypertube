import { WatchService } from './watch.service';
export declare class WatchController {
    private readonly watchService;
    constructor(watchService: WatchService);
    getMovieForWatch(imdbId: string, userId?: number): Promise<{
        downloadProgress: number;
        isDownloading: boolean;
        isDownloaded: boolean;
        canStream: boolean;
        watched: any;
        watchProgress: any;
        lastWatchedAt: any;
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
        isStreaming: boolean;
    }>;
    startStreaming(imdbId: string, body: {
        userId?: number;
        startTime?: number;
    }): Promise<{
        status: string;
        imdbId: string;
        userId: number;
        startTime: number;
        timestamp: string;
    }>;
    stopStreaming(imdbId: string, body: {
        userId?: number;
        currentTime: number;
        completed?: boolean;
    }): Promise<{
        status: string;
        imdbId: string;
        userId: number;
        currentTime: number;
        completed: boolean;
        timestamp: string;
    }>;
}
