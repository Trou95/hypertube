import { User } from './user.entity';
export declare class WatchHistory {
    id: number;
    userId: number;
    imdbId: string;
    movieTitle: string;
    progressSeconds: number;
    durationSeconds: number;
    completed: boolean;
    watched: boolean;
    firstWatchedAt: Date;
    lastWatchedAt: Date;
    user: User;
}
