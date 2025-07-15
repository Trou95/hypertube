"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatchService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const movies_service_1 = require("../movies/movies.service");
const download_entity_1 = require("../streaming/entities/download.entity");
const watch_history_entity_1 = require("../users/entities/watch-history.entity");
let WatchService = class WatchService {
    constructor(moviesService, downloadRepository, watchHistoryRepository) {
        this.moviesService = moviesService;
        this.downloadRepository = downloadRepository;
        this.watchHistoryRepository = watchHistoryRepository;
    }
    async getMovieForWatch(imdbId, userId) {
        const movieDetails = await this.moviesService.getMovieById(imdbId);
        const downloadStatus = await this.checkDownloadStatus(imdbId);
        if (!downloadStatus.isDownloaded && !downloadStatus.isDownloading) {
            await this.triggerAutomaticDownload(imdbId);
        }
        const watchStatus = await this.getUserWatchStatus(imdbId, userId);
        return {
            ...movieDetails,
            downloadProgress: downloadStatus.progress || 0,
            isDownloading: downloadStatus.isDownloading || false,
            isDownloaded: downloadStatus.isDownloaded || false,
            canStream: downloadStatus.progress >= 5 || downloadStatus.isDownloaded,
            watched: watchStatus.watched || false,
            watchProgress: watchStatus.progressSeconds || 0,
            lastWatchedAt: watchStatus.lastWatchedAt || null,
        };
    }
    async startStreaming(imdbId, userId, startTime = 0) {
        console.log(`🎬 Starting streaming session for ${imdbId}, user ${userId}, startTime: ${startTime}s`);
        await this.updateWatchStatus(imdbId, userId, startTime, false);
        return {
            status: 'streaming_started',
            imdbId,
            userId,
            startTime,
            timestamp: new Date().toISOString(),
        };
    }
    async stopStreaming(imdbId, userId, currentTime, completed) {
        console.log(`⏹️ Stopping streaming session for ${imdbId}, user ${userId}, currentTime: ${currentTime}s, completed: ${completed}`);
        await this.updateWatchStatus(imdbId, userId, currentTime, completed);
        return {
            status: 'streaming_stopped',
            imdbId,
            userId,
            currentTime,
            completed,
            timestamp: new Date().toISOString(),
        };
    }
    async checkDownloadStatus(imdbId) {
        const download = await this.downloadRepository.findOne({
            where: { imdbId },
        });
        if (!download) {
            return {
                isDownloaded: false,
                isDownloading: false,
                progress: 0,
            };
        }
        return {
            isDownloaded: download.status === download_entity_1.DownloadStatus.COMPLETED,
            isDownloading: download.status === download_entity_1.DownloadStatus.DOWNLOADING,
            progress: Number(download.progress),
        };
    }
    async triggerAutomaticDownload(imdbId) {
        console.log(`🚀 Subject-compliant: Auto-triggering download for movie ${imdbId}`);
        const existingDownload = await this.downloadRepository.findOne({
            where: { imdbId },
        });
        if (existingDownload) {
            console.log(`Download already exists for ${imdbId}`);
            return existingDownload;
        }
        const movieDetails = await this.moviesService.getMovieById(imdbId);
        const download = this.downloadRepository.create({
            imdbId,
            movieTitle: movieDetails.title,
            torrentHash: 'mock-hash-' + imdbId,
            status: download_entity_1.DownloadStatus.PENDING,
            progress: 0,
        });
        const savedDownload = await this.downloadRepository.save(download);
        this.simulateDownloadProgress(savedDownload.id);
        return {
            status: 'download_triggered',
            imdbId,
            downloadId: savedDownload.id,
            message: 'Movie download started automatically',
        };
    }
    async simulateDownloadProgress(downloadId) {
        const download = await this.downloadRepository.findOne({ where: { id: downloadId } });
        if (!download)
            return;
        download.status = download_entity_1.DownloadStatus.DOWNLOADING;
        await this.downloadRepository.save(download);
        let progress = 0;
        const interval = setInterval(async () => {
            progress += Math.random() * 10;
            if (progress >= 100) {
                progress = 100;
                download.status = download_entity_1.DownloadStatus.COMPLETED;
                clearInterval(interval);
            }
            download.progress = Number(progress.toFixed(2));
            await this.downloadRepository.save(download);
            console.log(`📊 Download progress for ${download.imdbId}: ${progress.toFixed(2)}%`);
        }, 5000);
    }
    async getUserWatchStatus(imdbId, userId) {
        const watchHistory = await this.watchHistoryRepository.findOne({
            where: { imdbId, userId },
        });
        if (!watchHistory) {
            return {
                watched: false,
                progressSeconds: 0,
                lastWatchedAt: null,
            };
        }
        return {
            watched: watchHistory.watched,
            progressSeconds: watchHistory.progressSeconds,
            lastWatchedAt: watchHistory.lastWatchedAt,
        };
    }
    async updateWatchStatus(imdbId, userId, progressSeconds, completed) {
        console.log(`📊 Updating watch status: ${imdbId}, user ${userId}, progress: ${progressSeconds}s, completed: ${completed}`);
        let watchHistory = await this.watchHistoryRepository.findOne({
            where: { imdbId, userId },
        });
        if (!watchHistory) {
            const movieDetails = await this.moviesService.getMovieById(imdbId);
            watchHistory = this.watchHistoryRepository.create({
                imdbId,
                userId,
                movieTitle: movieDetails.title,
                progressSeconds,
                completed,
                watched: true,
            });
        }
        else {
            watchHistory.progressSeconds = progressSeconds;
            watchHistory.completed = completed;
            watchHistory.lastWatchedAt = new Date();
        }
        const savedHistory = await this.watchHistoryRepository.save(watchHistory);
        return {
            imdbId,
            userId,
            progressSeconds: savedHistory.progressSeconds,
            completed: savedHistory.completed,
            updatedAt: savedHistory.lastWatchedAt.toISOString(),
        };
    }
};
exports.WatchService = WatchService;
exports.WatchService = WatchService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(download_entity_1.Download)),
    __param(2, (0, typeorm_1.InjectRepository)(watch_history_entity_1.WatchHistory)),
    __metadata("design:paramtypes", [movies_service_1.MoviesService, typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object])
], WatchService);
//# sourceMappingURL=watch.service.js.map