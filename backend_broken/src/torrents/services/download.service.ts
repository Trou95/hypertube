import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Download, DownloadStatus } from '../entities/download.entity';
import { TransmissionService } from './transmission.service';
import { MoviesService } from '../../movies/movies.service';
import { TorrentsService } from '../torrents.service';

@Injectable()
export class DownloadService {
  private readonly logger = new Logger(DownloadService.name);

  constructor(
    @InjectRepository(Download)
    private readonly downloadRepository: Repository<Download>,
    private readonly transmissionService: TransmissionService,
    private readonly moviesService: MoviesService,
    private readonly torrentsService: TorrentsService,
  ) {}

  async startDownload(imdbId: string): Promise<Download> {
    // Check if movie exists and get details
    let movie = await this.moviesService.getMovieByImdbId(imdbId);
    if (!movie) {
      movie = await this.moviesService.getMovieDetails(imdbId);
      if (!movie) {
        throw new NotFoundException('Movie not found');
      }
    }

    // Check if already downloading or completed
    const existingDownload = await this.downloadRepository.findOne({
      where: { 
        movieId: movie.id,
        status: DownloadStatus.DOWNLOADING 
      }
    });

    if (existingDownload) {
      return existingDownload;
    }

    // Get best torrent
    const bestTorrent = await this.torrentsService.getBestTorrent(imdbId);
    if (!bestTorrent) {
      throw new NotFoundException('No torrents found for this movie');
    }

    // Create download record
    const download = this.downloadRepository.create({
      movieId: movie.id,
      torrentHash: bestTorrent.hash || '',
      magnetUrl: bestTorrent.magnetUrl || '',
      fileName: bestTorrent.title,
      fileSize: bestTorrent.sizeBytes || 0,
      status: DownloadStatus.QUEUED,
      seeders: bestTorrent.seeds,
      peers: bestTorrent.peers,
    });

    const savedDownload = await this.downloadRepository.save(download);

    try {
      // Add to transmission
      const torrentInfo = await this.transmissionService.addTorrent(
        bestTorrent.magnetUrl || bestTorrent.downloadUrl!,
        '/downloads'
      );

      // Update download with transmission info
      savedDownload.transmissionId = torrentInfo.id;
      savedDownload.status = DownloadStatus.DOWNLOADING;
      savedDownload.fileName = torrentInfo.name;

      await this.downloadRepository.save(savedDownload);

      this.logger.log(`Started download for movie: ${movie.title} (${imdbId})`);
      
      return savedDownload;
    } catch (error) {
      // Update download status to failed
      savedDownload.status = DownloadStatus.FAILED;
      savedDownload.errorMessage = error.message;
      await this.downloadRepository.save(savedDownload);
      
      throw error;
    }
  }

  async getDownloadStatus(downloadId: number): Promise<Download> {
    const download = await this.downloadRepository.findOne({
      where: { id: downloadId },
      relations: ['movie']
    });

    if (!download) {
      throw new NotFoundException('Download not found');
    }

    // Update status from transmission if still downloading
    if (download.transmissionId && download.status === DownloadStatus.DOWNLOADING) {
      await this.updateDownloadFromTransmission(download);
    }

    return download;
  }

  async getDownloadByMovieId(movieId: number): Promise<Download | null> {
    return this.downloadRepository.findOne({
      where: { movieId },
      relations: ['movie'],
      order: { createdAt: 'DESC' }
    });
  }

  async getAllDownloads(): Promise<Download[]> {
    return this.downloadRepository.find({
      relations: ['movie'],
      order: { createdAt: 'DESC' }
    });
  }

  async pauseDownload(downloadId: number): Promise<void> {
    const download = await this.downloadRepository.findOne({ where: { id: downloadId } });
    if (!download || !download.transmissionId) {
      throw new NotFoundException('Download not found');
    }

    await this.transmissionService.stopTorrent(download.transmissionId);
    download.status = DownloadStatus.PAUSED;
    await this.downloadRepository.save(download);
  }

  async resumeDownload(downloadId: number): Promise<void> {
    const download = await this.downloadRepository.findOne({ where: { id: downloadId } });
    if (!download || !download.transmissionId) {
      throw new NotFoundException('Download not found');
    }

    await this.transmissionService.startTorrent(download.transmissionId);
    download.status = DownloadStatus.DOWNLOADING;
    await this.downloadRepository.save(download);
  }

  async deleteDownload(downloadId: number): Promise<void> {
    const download = await this.downloadRepository.findOne({ where: { id: downloadId } });
    if (!download) {
      throw new NotFoundException('Download not found');
    }

    // Remove from transmission if exists
    if (download.transmissionId) {
      try {
        await this.transmissionService.removeTorrent(download.transmissionId, true);
      } catch (error) {
        this.logger.warn(`Failed to remove torrent from transmission: ${error.message}`);
      }
    }

    await this.downloadRepository.remove(download);
  }

  private async updateDownloadFromTransmission(download: Download): Promise<void> {
    try {
      const torrentInfo = await this.transmissionService.getTorrent(download.transmissionId!);
      if (!torrentInfo) {
        download.status = DownloadStatus.FAILED;
        download.errorMessage = 'Torrent not found in transmission';
        await this.downloadRepository.save(download);
        return;
      }

      download.progress = Math.round(torrentInfo.progress * 100 * 100) / 100; // 2 decimal places
      download.downloadedBytes = torrentInfo.downloadedEver;
      download.downloadSpeed = torrentInfo.rateDownload;
      download.seeders = torrentInfo.seeders;
      download.peers = torrentInfo.peersConnected;

      if (this.transmissionService.hasError(torrentInfo)) {
        download.status = DownloadStatus.FAILED;
        download.errorMessage = torrentInfo.errorString;
      } else if (this.transmissionService.isCompleted(torrentInfo)) {
        download.status = DownloadStatus.COMPLETED;
        download.completedAt = new Date();
        download.filePath = `${torrentInfo.downloadDir}/${torrentInfo.name}`;
        
        // Update movie record
        if (download.movie) {
          download.movie.downloaded = true;
          download.movie.filePath = download.filePath;
          download.movie.fileSize = torrentInfo.sizeWhenDone;
          await this.moviesService.updateMovie(download.movieId, {
            downloaded: true,
            filePath: download.filePath,
            fileSize: torrentInfo.sizeWhenDone
          });
        }
      } else if (this.transmissionService.isDownloading(torrentInfo)) {
        download.status = DownloadStatus.DOWNLOADING;
      }

      await this.downloadRepository.save(download);
    } catch (error) {
      this.logger.error(`Failed to update download ${download.id} from transmission:`, error);
    }
  }

  // Cron job to update all active downloads every minute
  @Cron(CronExpression.EVERY_MINUTE)
  async updateAllDownloads(): Promise<void> {
    try {
      const activeDownloads = await this.downloadRepository.find({
        where: { status: DownloadStatus.DOWNLOADING },
        relations: ['movie']
      });

      this.logger.debug(`Updating ${activeDownloads.length} active downloads`);

      for (const download of activeDownloads) {
        if (download.transmissionId) {
          await this.updateDownloadFromTransmission(download);
        }
      }
    } catch (error) {
      this.logger.error('Failed to update downloads:', error);
    }
  }

  // Cron job to clean up old files every day at 2 AM
  @Cron('0 2 * * *')
  async cleanupOldFiles(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const oldDownloads = await this.downloadRepository.find({
        where: { 
          status: DownloadStatus.COMPLETED,
          lastAccessedAt: null // Only clean files that have never been accessed
        },
        relations: ['movie']
      });

      const filesToClean = oldDownloads.filter(d => 
        d.completedAt && d.completedAt < thirtyDaysAgo
      );

      this.logger.log(`Cleaning up ${filesToClean.length} old files`);

      for (const download of filesToClean) {
        try {
          if (download.transmissionId) {
            await this.transmissionService.removeTorrent(download.transmissionId, true);
          }
          
          // Update movie record
          if (download.movie) {
            await this.moviesService.updateMovie(download.movieId, {
              downloaded: false,
              filePath: null,
              fileSize: null
            });
          }

          await this.downloadRepository.remove(download);
          this.logger.log(`Cleaned up file: ${download.fileName}`);
        } catch (error) {
          this.logger.error(`Failed to clean up download ${download.id}:`, error);
        }
      }
    } catch (error) {
      this.logger.error('Failed to cleanup old files:', error);
    }
  }
}