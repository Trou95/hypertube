import { Repository } from 'typeorm';
import { Download } from './entities/download.entity';
import { WatchHistory } from '../users/entities/watch-history.entity';
export declare class StreamingService {
    private downloadRepository;
    private watchHistoryRepository;
    constructor(downloadRepository: Repository<Download>, watchHistoryRepository: Repository<WatchHistory>);
    getStreamingInfo(imdbId: string, userId: number): Promise<{
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
    startHLSConversion(download: Download): Promise<string>;
    private convertToHLS;
    updateWatchProgress(imdbId: string, userId: number, progressSeconds: number, durationSeconds?: number): Promise<any>;
    getHLSPlaylist(imdbId: string): Promise<string>;
    getHLSSegment(imdbId: string, segmentName: string): Promise<Buffer>;
}
