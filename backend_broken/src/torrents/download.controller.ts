import { Controller, Post, Get, Delete, Patch, Param, Body, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { DownloadService } from './services/download.service';
import { TransmissionService } from './services/transmission.service';

@ApiTags('downloads')
@Controller('downloads')
export class DownloadController {
  constructor(
    private readonly downloadService: DownloadService,
    private readonly transmissionService: TransmissionService,
  ) {}

  @Post('start/:imdbId')
  @ApiOperation({ summary: 'Start downloading a movie by IMDB ID' })
  @ApiParam({ name: 'imdbId', description: 'IMDB ID of the movie' })
  @ApiResponse({ status: 201, description: 'Download started successfully' })
  @ApiResponse({ status: 404, description: 'Movie or torrents not found' })
  async startDownload(@Param('imdbId') imdbId: string) {
    const download = await this.downloadService.startDownload(imdbId);
    return {
      message: 'Download started successfully',
      download: {
        id: download.id,
        movieId: download.movieId,
        fileName: download.fileName,
        status: download.status,
        progress: download.progress,
        fileSize: download.fileSize,
        transmissionId: download.transmissionId
      }
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all downloads' })
  @ApiResponse({ status: 200, description: 'Downloads retrieved successfully' })
  async getAllDownloads() {
    const downloads = await this.downloadService.getAllDownloads();
    return {
      downloads: downloads.map(d => ({
        id: d.id,
        movieId: d.movieId,
        movieTitle: d.movie?.title,
        fileName: d.fileName,
        status: d.status,
        progress: d.progress,
        fileSize: d.fileSize,
        downloadedBytes: d.downloadedBytes,
        downloadSpeed: d.downloadSpeed,
        seeders: d.seeders,
        peers: d.peers,
        createdAt: d.createdAt,
        completedAt: d.completedAt,
        errorMessage: d.errorMessage
      }))
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get download status by ID' })
  @ApiParam({ name: 'id', description: 'Download ID' })
  @ApiResponse({ status: 200, description: 'Download status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Download not found' })
  async getDownloadStatus(@Param('id') id: number) {
    const download = await this.downloadService.getDownloadStatus(id);
    return {
      download: {
        id: download.id,
        movieId: download.movieId,
        movieTitle: download.movie?.title,
        fileName: download.fileName,
        status: download.status,
        progress: download.progress,
        fileSize: download.fileSize,
        downloadedBytes: download.downloadedBytes,
        downloadSpeed: download.downloadSpeed,
        seeders: download.seeders,
        peers: download.peers,
        filePath: download.filePath,
        createdAt: download.createdAt,
        completedAt: download.completedAt,
        errorMessage: download.errorMessage
      }
    };
  }

  @Get('movie/:movieId')
  @ApiOperation({ summary: 'Get download by movie ID' })
  @ApiParam({ name: 'movieId', description: 'Movie ID' })
  @ApiResponse({ status: 200, description: 'Download retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Download not found' })
  async getDownloadByMovieId(@Param('movieId') movieId: number) {
    const download = await this.downloadService.getDownloadByMovieId(movieId);
    if (!download) {
      throw new NotFoundException('Download not found for this movie');
    }
    
    return {
      download: {
        id: download.id,
        movieId: download.movieId,
        movieTitle: download.movie?.title,
        fileName: download.fileName,
        status: download.status,
        progress: download.progress,
        fileSize: download.fileSize,
        downloadedBytes: download.downloadedBytes,
        downloadSpeed: download.downloadSpeed,
        seeders: download.seeders,
        peers: download.peers,
        filePath: download.filePath,
        createdAt: download.createdAt,
        completedAt: download.completedAt
      }
    };
  }

  @Patch(':id/pause')
  @ApiOperation({ summary: 'Pause a download' })
  @ApiParam({ name: 'id', description: 'Download ID' })
  @ApiResponse({ status: 200, description: 'Download paused successfully' })
  @ApiResponse({ status: 404, description: 'Download not found' })
  async pauseDownload(@Param('id') id: number) {
    await this.downloadService.pauseDownload(id);
    return { message: 'Download paused successfully' };
  }

  @Patch(':id/resume')
  @ApiOperation({ summary: 'Resume a paused download' })
  @ApiParam({ name: 'id', description: 'Download ID' })
  @ApiResponse({ status: 200, description: 'Download resumed successfully' })
  @ApiResponse({ status: 404, description: 'Download not found' })
  async resumeDownload(@Param('id') id: number) {
    await this.downloadService.resumeDownload(id);
    return { message: 'Download resumed successfully' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a download and its files' })
  @ApiParam({ name: 'id', description: 'Download ID' })
  @ApiResponse({ status: 200, description: 'Download deleted successfully' })
  @ApiResponse({ status: 404, description: 'Download not found' })
  async deleteDownload(@Param('id') id: number) {
    await this.downloadService.deleteDownload(id);
    return { message: 'Download deleted successfully' };
  }

  @Get('transmission/stats')
  @ApiOperation({ summary: 'Get transmission daemon statistics' })
  @ApiResponse({ status: 200, description: 'Transmission stats retrieved successfully' })
  async getTransmissionStats() {
    const stats = await this.transmissionService.getSessionStats();
    return { stats };
  }

  @Get('transmission/torrents')
  @ApiOperation({ summary: 'Get all torrents from transmission daemon' })
  @ApiResponse({ status: 200, description: 'Torrents retrieved successfully' })
  async getTransmissionTorrents() {
    const torrents = await this.transmissionService.getAllTorrents();
    return {
      torrents: torrents.map(t => ({
        id: t.id,
        name: t.name,
        status: this.transmissionService.getStatusText(t.status),
        progress: Math.round(t.progress * 100 * 100) / 100,
        downloadSpeed: t.rateDownload,
        uploadSpeed: t.rateUpload,
        seeders: t.seeders,
        peers: t.peersConnected,
        eta: t.eta,
        sizeWhenDone: t.sizeWhenDone,
        downloadedEver: t.downloadedEver,
        error: t.error > 0 ? t.errorString : null
      }))
    };
  }
}