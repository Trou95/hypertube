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
exports.StreamingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const download_entity_1 = require("./entities/download.entity");
const watch_history_entity_1 = require("../users/entities/watch-history.entity");
const path = require("path");
const fs = require("fs");
const child_process_1 = require("child_process");
let StreamingService = class StreamingService {
    constructor(downloadRepository, watchHistoryRepository) {
        this.downloadRepository = downloadRepository;
        this.watchHistoryRepository = watchHistoryRepository;
    }
    async getStreamingInfo(imdbId, userId) {
        const download = await this.downloadRepository.findOne({
            where: { imdbId },
        });
        if (!download) {
            return {
                available: false,
                message: 'Movie not found in downloads',
            };
        }
        const watchHistory = await this.watchHistoryRepository.findOne({
            where: { imdbId, userId },
        });
        download.lastAccessedAt = new Date();
        await this.downloadRepository.save(download);
        const hlsAvailable = download.hlsPath && fs.existsSync(download.hlsPath);
        return {
            available: true,
            download: {
                id: download.id,
                status: download.status,
                progress: download.progress,
                isConverted: download.isConverted,
                hlsAvailable,
            },
            watchHistory: watchHistory ? {
                progressSeconds: watchHistory.progressSeconds,
                durationSeconds: watchHistory.durationSeconds,
                completed: watchHistory.completed,
                lastWatchedAt: watchHistory.lastWatchedAt,
            } : null,
            streaming: {
                canStream: download.progress >= 5 || download.status === download_entity_1.DownloadStatus.COMPLETED,
                hlsPlaylistUrl: hlsAvailable ? `/stream/${imdbId}/playlist.m3u8` : null,
                directVideoUrl: download.filePath && fs.existsSync(download.filePath) ? `/stream/${imdbId}/video` : null,
            },
        };
    }
    async startHLSConversion(download) {
        if (download.hlsPath && fs.existsSync(download.hlsPath)) {
            return download.hlsPath;
        }
        const hlsDir = path.join(process.env.DOWNLOADS_PATH || '/app/downloads', 'hls', download.imdbId);
        const playlistPath = path.join(hlsDir, 'playlist.m3u8');
        if (!fs.existsSync(hlsDir)) {
            fs.mkdirSync(hlsDir, { recursive: true });
        }
        this.convertToHLS(download.filePath, hlsDir, download.id);
        download.hlsPath = playlistPath;
        await this.downloadRepository.save(download);
        return playlistPath;
    }
    async convertToHLS(inputPath, outputDir, downloadId) {
        console.log(`🎬 Starting HLS conversion for download ${downloadId}: ${inputPath} -> ${outputDir}`);
        const playlistPath = path.join(outputDir, 'playlist.m3u8');
        const ffmpegArgs = [
            '-i', inputPath,
            '-c:v', 'libx264',
            '-c:a', 'aac',
            '-hls_time', '10',
            '-hls_list_size', '0',
            '-hls_segment_filename', path.join(outputDir, 'segment_%03d.ts'),
            '-f', 'hls',
            playlistPath
        ];
        const ffmpeg = (0, child_process_1.spawn)('ffmpeg', ffmpegArgs, {
            stdio: ['ignore', 'pipe', 'pipe']
        });
        ffmpeg.stdout.on('data', (data) => {
            console.log(`FFmpeg stdout: ${data}`);
        });
        ffmpeg.stderr.on('data', (data) => {
            console.log(`FFmpeg stderr: ${data}`);
        });
        ffmpeg.on('close', async (code) => {
            console.log(`FFmpeg process exited with code ${code}`);
            if (code === 0) {
                const download = await this.downloadRepository.findOne({ where: { id: downloadId } });
                if (download) {
                    download.isConverted = true;
                    await this.downloadRepository.save(download);
                }
                console.log(`✅ HLS conversion completed for download ${downloadId}`);
            }
            else {
                console.error(`❌ HLS conversion failed for download ${downloadId}`);
            }
        });
    }
    async updateWatchProgress(imdbId, userId, progressSeconds, durationSeconds) {
        let watchHistory = await this.watchHistoryRepository.findOne({
            where: { imdbId, userId },
        });
        if (!watchHistory) {
            watchHistory = this.watchHistoryRepository.create({
                imdbId,
                userId,
                movieTitle: '',
                progressSeconds,
                durationSeconds: durationSeconds || 0,
                watched: true,
            });
        }
        else {
            watchHistory.progressSeconds = progressSeconds;
            watchHistory.lastWatchedAt = new Date();
            if (durationSeconds) {
                watchHistory.durationSeconds = durationSeconds;
            }
        }
        if (watchHistory.durationSeconds > 0) {
            const watchedPercentage = (progressSeconds / watchHistory.durationSeconds) * 100;
            watchHistory.completed = watchedPercentage >= 90;
        }
        return this.watchHistoryRepository.save(watchHistory);
    }
    async getHLSPlaylist(imdbId) {
        const download = await this.downloadRepository.findOne({
            where: { imdbId },
        });
        if (!download?.hlsPath || !fs.existsSync(download.hlsPath)) {
            throw new Error('HLS playlist not found');
        }
        return fs.readFileSync(download.hlsPath, 'utf8');
    }
    async getHLSSegment(imdbId, segmentName) {
        const download = await this.downloadRepository.findOne({
            where: { imdbId },
        });
        if (!download?.hlsPath) {
            throw new Error('HLS not available');
        }
        const hlsDir = path.dirname(download.hlsPath);
        const segmentPath = path.join(hlsDir, segmentName);
        if (!fs.existsSync(segmentPath)) {
            throw new Error('Segment not found');
        }
        return fs.readFileSync(segmentPath);
    }
};
exports.StreamingService = StreamingService;
exports.StreamingService = StreamingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(download_entity_1.Download)),
    __param(1, (0, typeorm_1.InjectRepository)(watch_history_entity_1.WatchHistory)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object])
], StreamingService);
//# sourceMappingURL=streaming.service.js.map