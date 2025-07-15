export declare enum DownloadStatus {
    PENDING = "pending",
    DOWNLOADING = "downloading",
    COMPLETED = "completed",
    FAILED = "failed",
    SEEDING = "seeding"
}
export declare class Download {
    id: number;
    imdbId: string;
    movieTitle: string;
    torrentHash: string;
    magnetUri: string;
    status: DownloadStatus;
    progress: number;
    downloadedBytes: number;
    totalBytes: number;
    downloadSpeed: number;
    seeders: number;
    leechers: number;
    filePath: string;
    hlsPath: string;
    isConverted: boolean;
    error: string;
    createdAt: Date;
    updatedAt: Date;
    lastAccessedAt: Date;
}
