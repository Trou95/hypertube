import { Response } from 'express';
import { StreamingService } from './streaming.service';
export declare class StreamingController {
    private readonly streamingService;
    constructor(streamingService: StreamingService);
    getStreamingInfo(imdbId: string, req: any): Promise<{
        available: boolean;
        message: string;
        download?: undefined;
        watchHistory?: undefined;
        streaming?: undefined;
    } | {
        available: boolean;
        download: {
            id: any;
            status: any;
            progress: any;
            isConverted: any;
            hlsAvailable: any;
        };
        watchHistory: {
            progressSeconds: any;
            durationSeconds: any;
            completed: any;
            lastWatchedAt: any;
        };
        streaming: {
            canStream: boolean;
            hlsPlaylistUrl: string;
            directVideoUrl: string;
        };
        message?: undefined;
    }>;
    getHLSPlaylist(imdbId: string, res: Response): Promise<void>;
    getHLSSegment(imdbId: string, segmentName: string, res: Response): Promise<void>;
    updateProgress(imdbId: string, body: {
        progressSeconds: number;
        durationSeconds?: number;
    }, req: any): Promise<{
        message: string;
        watchHistory: {
            progressSeconds: any;
            durationSeconds: any;
            completed: any;
            lastWatchedAt: any;
        };
    }>;
}
