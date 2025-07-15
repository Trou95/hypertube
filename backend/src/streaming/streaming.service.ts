import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Download, DownloadStatus } from './entities/download.entity';
import { WatchHistory } from '../users/entities/watch-history.entity';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';

@Injectable()
export class StreamingService {
  private conversionLocks = new Set<string>(); // Track ongoing conversions

  constructor(
    @InjectRepository(Download)
    private downloadRepository: Repository<Download>,
    @InjectRepository(WatchHistory)
    private watchHistoryRepository: Repository<WatchHistory>,
  ) {}

  async getStreamingInfo(imdbId: string, userId: number) {
    // Get download info
    const download = await this.downloadRepository.findOne({
      where: { imdbId },
    });

    if (!download) {
      return {
        available: false,
        message: 'Movie not found in downloads',
      };
    }

    // Log for debugging
    console.log(`🔍 Streaming info for IMDB: ${imdbId}, Movie: ${download.movieTitle}, Progress: ${download.progress}%`);

    // Get user watch history
    const watchHistory = await this.watchHistoryRepository.findOne({
      where: { imdbId, userId },
    });

    // Update last accessed
    download.lastAccessedAt = new Date();
    await this.downloadRepository.save(download);

    // Check if HLS playlist exists
    const hlsAvailable = download.hlsPath && fs.existsSync(download.hlsPath);

    // Start HLS conversion if progress >= 5% and not already converted
    if (download.progress >= 5 && !download.isConverted && download.filePath && fs.existsSync(download.filePath)) {
      // Check if conversion is already in progress
      if (!this.conversionLocks.has(download.imdbId)) {
        console.log(`🎬 Starting HLS conversion for ${download.movieTitle} (${download.progress}% downloaded)`);
        this.startHLSConversion(download);
      } else {
        console.log(`⏳ HLS conversion already in progress for ${download.movieTitle}`);
      }
    }

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
        canStream: download.progress >= 5 || download.status === DownloadStatus.COMPLETED,
        hlsPlaylistUrl: hlsAvailable ? `/stream/${imdbId}/playlist.m3u8` : null,
        directVideoUrl: download.filePath && fs.existsSync(download.filePath) ? `/stream/${imdbId}/video` : null,
      },
    };
  }

  async startHLSConversion(download: Download): Promise<string> {
    // Add lock to prevent duplicate conversions
    this.conversionLocks.add(download.imdbId);

    if (download.hlsPath && fs.existsSync(download.hlsPath)) {
      this.conversionLocks.delete(download.imdbId);
      return download.hlsPath;
    }

    const hlsDir = path.join(process.env.DOWNLOADS_PATH || '/downloads', 'hls', download.imdbId);
    const playlistPath = path.join(hlsDir, 'playlist.m3u8');

    // Create HLS directory
    if (!fs.existsSync(hlsDir)) {
      fs.mkdirSync(hlsDir, { recursive: true });
    }

    // Start FFmpeg conversion to HLS
    this.convertToHLS(download.filePath, hlsDir, download.id, download.imdbId);

    // Update download record
    download.hlsPath = playlistPath;
    await this.downloadRepository.save(download);

    return playlistPath;
  }

  private async convertToHLS(inputPath: string, outputDir: string, downloadId: number, imdbId: string) {
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

    const ffmpeg = spawn('ffmpeg', ffmpegArgs, {
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
      
      // Remove lock regardless of success/failure
      this.conversionLocks.delete(imdbId);
      
      if (code === 0) {
        // Update download status
        const download = await this.downloadRepository.findOne({ where: { id: downloadId } });
        if (download) {
          download.isConverted = true;
          await this.downloadRepository.save(download);
        }
        console.log(`✅ HLS conversion completed for download ${downloadId}`);
      } else {
        console.error(`❌ HLS conversion failed for download ${downloadId}`);
      }
    });
  }

  async updateWatchProgress(imdbId: string, userId: number, progressSeconds: number, durationSeconds?: number) {
    let watchHistory = await this.watchHistoryRepository.findOne({
      where: { imdbId, userId },
    });

    // Convert to integers to avoid database type errors
    const progressSecondsInt = Math.floor(progressSeconds);
    const durationSecondsInt = durationSeconds ? Math.floor(durationSeconds) : 0;

    if (!watchHistory) {
      // Create new watch history
      watchHistory = this.watchHistoryRepository.create({
        imdbId,
        userId,
        movieTitle: '', // Will be filled later
        progressSeconds: progressSecondsInt,
        durationSeconds: durationSecondsInt,
        watched: true,
      });
    } else {
      // Update existing
      watchHistory.progressSeconds = progressSecondsInt;
      watchHistory.lastWatchedAt = new Date();
      if (durationSeconds) {
        watchHistory.durationSeconds = durationSecondsInt;
      }
    }

    // Mark as completed if watched > 90%
    if (watchHistory.durationSeconds > 0) {
      const watchedPercentage = (progressSecondsInt / watchHistory.durationSeconds) * 100;
      watchHistory.completed = watchedPercentage >= 90;
    }

    return this.watchHistoryRepository.save(watchHistory);
  }

  async getHLSPlaylist(imdbId: string): Promise<string> {
    const download = await this.downloadRepository.findOne({
      where: { imdbId },
    });

    if (!download?.hlsPath || !fs.existsSync(download.hlsPath)) {
      throw new Error('HLS playlist not found');
    }

    const playlist = fs.readFileSync(download.hlsPath, 'utf8');
    
    // Check if HLS conversion is complete by looking for EXT-X-ENDLIST tag
    const isComplete = playlist.includes('#EXT-X-ENDLIST');
    
    if (!isComplete && !download.isConverted) {
      console.log(`⚠️ HLS conversion still in progress for ${imdbId}, playlist incomplete`);
      // Return error to force fallback to direct video streaming
      throw new Error('HLS conversion in progress, use direct video streaming');
    }

    return playlist;
  }

  async getHLSSegment(imdbId: string, segmentName: string): Promise<Buffer> {
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

  async getVideoFilePath(imdbId: string): Promise<string | null> {
    const download = await this.downloadRepository.findOne({
      where: { imdbId },
    });

    if (!download || download.progress < 5) {
      return null;
    }

    return download.filePath;
  }
}