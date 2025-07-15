import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MoviesService } from '../movies/movies.service';
import { Download, DownloadStatus } from '../streaming/entities/download.entity';
import { WatchHistory } from '../users/entities/watch-history.entity';
import { YtsService } from '../torrents/yts.service';
import { TransmissionService } from '../torrents/transmission.service';

@Injectable()
export class WatchService {
  constructor(
    private readonly moviesService: MoviesService,
    private readonly ytsService: YtsService,
    private readonly transmissionService: TransmissionService,
    @InjectRepository(Download)
    private downloadRepository: Repository<Download>,
    @InjectRepository(WatchHistory)
    private watchHistoryRepository: Repository<WatchHistory>,
  ) {}

  async getMovieForWatch(imdbId: string, userId: number) {
    const startTime = Date.now();
    console.log(`🚀 Starting getMovieForWatch for ${imdbId}`);
    
    // 1. Get movie details from OMDB
    const omdbStart = Date.now();
    const movieDetails = await this.moviesService.getMovieById(imdbId);
    console.log(`⏱️ OMDB took: ${Date.now() - omdbStart}ms`);
    
    // 2. Check if movie is already downloaded/downloading
    const dbStart = Date.now();
    const downloadStatus = await this.checkDownloadStatus(imdbId);
    console.log(`⏱️ DB check took: ${Date.now() - dbStart}ms`);
    
    // 3. If not downloaded, trigger automatic download (Subject compliant)
    if (!downloadStatus.isDownloaded && !downloadStatus.isDownloading) {
      const downloadStart = Date.now();
      await this.triggerAutomaticDownload(imdbId, movieDetails);
      console.log(`⏱️ Download trigger took: ${Date.now() - downloadStart}ms`);
    }
    
    // 4. Get user watch status
    const watchStart = Date.now();
    const watchStatus = await this.getUserWatchStatus(imdbId, userId);
    console.log(`⏱️ Watch status took: ${Date.now() - watchStart}ms`);
    
    console.log(`✅ Total getMovieForWatch took: ${Date.now() - startTime}ms`);
    
    // 5. Return enriched movie data with download/watch status
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

  async startStreaming(imdbId: string, userId: number, startTime: number = 0) {
    console.log(`🎬 Starting streaming session for ${imdbId}, user ${userId}, startTime: ${startTime}s`);
    
    // Update user watch status
    await this.updateWatchStatus(imdbId, userId, startTime, false);
    
    return {
      status: 'streaming_started',
      imdbId,
      userId,
      startTime,
      timestamp: new Date().toISOString(),
    };
  }

  async stopStreaming(imdbId: string, userId: number, currentTime: number, completed: boolean) {
    console.log(`⏹️ Stopping streaming session for ${imdbId}, user ${userId}, currentTime: ${currentTime}s, completed: ${completed}`);
    
    // Update user watch status
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

  private async checkDownloadStatus(imdbId: string) {
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
      isDownloaded: download.status === DownloadStatus.COMPLETED,
      isDownloading: download.status === DownloadStatus.DOWNLOADING,
      progress: Number(download.progress),
    };
  }

  private async triggerAutomaticDownload(imdbId: string, movieDetails?: any) {
    console.log(`🚀 Subject-compliant: Auto-triggering download for movie ${imdbId}`);
    
    // Check if download already exists
    const existingDownload = await this.downloadRepository.findOne({
      where: { imdbId },
    });

    if (existingDownload) {
      console.log(`Download already exists for ${imdbId}`);
      // Check for progress updates if download exists
      this.updateDownloadProgress(existingDownload.id, existingDownload.torrentHash);
      return existingDownload;
    }

    // Use existing movie details or fetch if not provided
    if (!movieDetails) {
      movieDetails = await this.moviesService.getMovieById(imdbId);
    }

    // Search for torrents on YTS
    const torrents = await this.ytsService.getTorrentsByImdbId(imdbId, movieDetails.title);
    
    if (!torrents || torrents.length === 0) {
      console.log(`No torrents found for IMDB ID: ${imdbId}`);
      return {
        status: 'no_torrents_found',
        imdbId,
        message: 'No torrents available for this movie',
      };
    }

    // Get the best torrent (1080p preferred, with good seeds)
    const bestTorrent = this.ytsService.getBestTorrent(torrents);
    
    if (!bestTorrent) {
      console.log(`No suitable torrent found for IMDB ID: ${imdbId}`);
      return {
        status: 'no_suitable_torrent',
        imdbId,
        message: 'No suitable torrent found',
      };
    }

    // Use direct torrent URL from YTS instead of magnet link for better compatibility
    const torrentUrl = bestTorrent.url;
    console.log(`📥 Using direct torrent URL: ${torrentUrl}`);
    const addResult = await this.transmissionService.addTorrentUrl(torrentUrl, movieDetails.title);

    if (!addResult.success) {
      console.error(`Failed to add torrent for ${imdbId}: ${addResult.error}`);
      return {
        status: 'torrent_add_failed',
        imdbId,
        message: addResult.error || 'Failed to add torrent',
      };
    }

    // Create download entry in database
    const download = this.downloadRepository.create({
      imdbId,
      movieTitle: movieDetails.title,
      torrentHash: bestTorrent.hash,
      status: DownloadStatus.DOWNLOADING,
      progress: 0,
      filePath: `/downloads/${movieDetails.title}`, // Transmission downloads to /downloads
    });

    const savedDownload = await this.downloadRepository.save(download);
    
    // Start monitoring download progress
    this.monitorDownloadProgress(savedDownload.id, bestTorrent.hash);
    
    console.log(`✅ Successfully started download for ${movieDetails.title} (${bestTorrent.quality})`);
    
    return {
      status: 'download_started',
      imdbId,
      downloadId: savedDownload.id,
      torrentInfo: {
        quality: bestTorrent.quality,
        size: bestTorrent.size,
        seeds: bestTorrent.seeds,
        peers: bestTorrent.peers
      },
      message: `Download started: ${bestTorrent.quality} (${bestTorrent.size})`,
    };
  }

  private async monitorDownloadProgress(downloadId: number, torrentHash: string) {
    console.log(`📊 Starting progress monitoring for download ${downloadId} (hash: ${torrentHash})`);
    
    const checkProgress = async () => {
      try {
        const download = await this.downloadRepository.findOne({ where: { id: downloadId } });
        if (!download) {
          console.log(`Download ${downloadId} not found, stopping monitoring`);
          return;
        }

        const progressInfo = await this.transmissionService.getTorrentProgress(torrentHash);
        
        if (progressInfo) {
          const oldProgress = download.progress;
          download.progress = Number(progressInfo.progress);
          
          // Update status based on progress
          if (progressInfo.progress >= 100) {
            download.status = DownloadStatus.COMPLETED;
          } else if (progressInfo.progress > 0) {
            download.status = DownloadStatus.DOWNLOADING;
          }

          // Update file path if we have file info
          if (progressInfo.files && progressInfo.files.length > 0) {
            const videoFile = progressInfo.files.find((f: any) => 
              f.name.match(/\.(mp4|mkv|avi|mov)$/i)
            );
            if (videoFile && !download.filePath.includes(videoFile.name)) {
              download.filePath = `/downloads/${videoFile.name}`;
              console.log(`📁 Updated file path: ${download.filePath}`);
            }
          }

          await this.downloadRepository.save(download);
          
          // Format download speed
          const formatSpeed = (bytesPerSec: number): string => {
            if (bytesPerSec < 1024) return `${bytesPerSec.toFixed(0)} B/s`;
            if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
            return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
          };

          const formatSize = (bytes: number): string => {
            if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
            if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
            return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
          };

          const formatETA = (seconds: number): string => {
            if (seconds < 0) return 'Unknown';
            if (seconds < 60) return `${seconds}s`;
            if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
            return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
          };

          // Log detailed progress every time (not just significant changes)
          console.log(`📊 [${download.movieTitle}]`);
          console.log(`   Progress: ${download.progress.toFixed(2)}% (${progressInfo.status})`);
          console.log(`   Speed: ⬇️ ${formatSpeed(progressInfo.downloadSpeed)} ⬆️ ${formatSpeed(progressInfo.uploadSpeed)}`);
          console.log(`   Seeds/Peers: 🌱 ${progressInfo.seeds} / 👥 ${progressInfo.peers}`);
          console.log(`   Downloaded: ${formatSize(progressInfo.downloaded)} / ${formatSize(progressInfo.total)}`);
          console.log(`   ETA: ⏱️ ${formatETA(progressInfo.eta)}`);
          console.log(`   Files: 📁 ${progressInfo.files?.length || 0} files`);
          console.log(`---`);

          // Continue monitoring if not completed
          if (download.progress < 100) {
            setTimeout(checkProgress, 5000); // Check every 5 seconds for faster updates
          } else {
            console.log(`✅ Download completed for ${download.movieTitle}`);
          }
        } else {
          console.log(`❌ Could not get progress for torrent ${torrentHash}`);
          setTimeout(checkProgress, 10000); // Retry in 10 seconds
        }
      } catch (error) {
        console.error(`Error monitoring download ${downloadId}:`, error.message);
        setTimeout(checkProgress, 10000); // Retry in 10 seconds
      }
    };

    // Start monitoring immediately
    setTimeout(checkProgress, 2000); // Start after 2 seconds
  }

  private async updateDownloadProgress(downloadId: number, torrentHash: string) {
    try {
      const download = await this.downloadRepository.findOne({ where: { id: downloadId } });
      if (!download) return;

      const progressInfo = await this.transmissionService.getTorrentProgress(torrentHash);
      
      if (progressInfo) {
        download.progress = Number(progressInfo.progress);
        
        if (progressInfo.progress >= 100) {
          download.status = DownloadStatus.COMPLETED;
        } else if (progressInfo.progress > 0) {
          download.status = DownloadStatus.DOWNLOADING;
        }

        await this.downloadRepository.save(download);
      }
    } catch (error) {
      console.error(`Error updating download progress for ${downloadId}:`, error.message);
    }
  }

  private async getUserWatchStatus(imdbId: string, userId: number) {
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

  private async updateWatchStatus(imdbId: string, userId: number, progressSeconds: number, completed: boolean) {
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
    } else {
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
}