import { Controller, Get, Post, Param, Query, Body, Inject, forwardRef } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MoviesService } from './movies.service';
import { DownloadService } from '../torrents/services/download.service';

@ApiTags('watch')
@Controller('watch')
export class WatchController {
  constructor(
    private readonly moviesService: MoviesService,
    @Inject(forwardRef(() => DownloadService))
    private readonly downloadService: DownloadService,
  ) {}

  @Get(':imdbId')
  @ApiOperation({ 
    summary: 'Watch movie - Subject compliant flow',
    description: 'Gets movie details and automatically starts download if not available. Returns streaming info when ready.'
  })
  @ApiParam({ name: 'imdbId', description: 'IMDB ID of the movie' })
  @ApiResponse({ status: 200, description: 'Movie watch details retrieved successfully' })
  async watchMovie(
    @Param('imdbId') imdbId: string,
    @Query('userId') userId: number = 1
  ) {
    // Get movie details with watch status
    const movieDetails = await this.moviesService.getMovieDetailsForWatch(imdbId, userId);
    
    if (!movieDetails) {
      return { error: 'Movie not found' };
    }

    // Subject requirement: If movie not downloaded, start download automatically
    if (movieDetails.needsDownload) {
      try {
        const download = await this.downloadService.startDownload(imdbId);
        movieDetails.downloadStarted = true;
        movieDetails.downloadId = download.id;
        movieDetails.message = 'Download started. Movie will be available for streaming soon.';
      } catch (error) {
        movieDetails.downloadError = error.message;
        movieDetails.message = 'Failed to start download. Please try again.';
      }
    }

    // Check if movie is currently downloading
    if (movieDetails.canWatch === false && !movieDetails.needsDownload) {
      const download = await this.downloadService.getDownloadByMovieId(movieDetails.id);
      if (download) {
        movieDetails.downloadStatus = {
          id: download.id,
          status: download.status,
          progress: download.progress,
          downloadSpeed: download.downloadSpeed,
          eta: this.calculateETA(download.downloadedBytes, download.fileSize, download.downloadSpeed)
        };
        
        // Subject requirement: Stream as soon as enough data is downloaded
        if (download.progress > 5) { // 5% downloaded
          movieDetails.canStreamPartially = true;
          movieDetails.message = 'Streaming available with partial download';
        } else {
          movieDetails.message = `Download in progress: ${download.progress}%`;
        }
      }
    }

    return movieDetails;
  }

  @Post(':imdbId/stream')
  @ApiOperation({ 
    summary: 'Start streaming session',
    description: 'Starts a streaming session and marks movie access time'
  })
  @ApiParam({ name: 'imdbId', description: 'IMDB ID of the movie' })
  @ApiResponse({ status: 200, description: 'Streaming session started successfully' })
  async startStreaming(
    @Param('imdbId') imdbId: string,
    @Body() body: { userId?: number; startTime?: number }
  ) {
    const userId = body.userId || 1;
    const movie = await this.moviesService.getMovieByImdbId(imdbId);
    
    if (!movie) {
      return { error: 'Movie not found' };
    }

    // Update last accessed time (for cleanup job)
    await this.moviesService.updateMovie(movie.id, {
      lastAccessedAt: new Date()
    });

    // Create/update watch progress
    const startTime = body.startTime || 0;
    await this.moviesService.updateWatchProgress(movie.id, userId, startTime);

    return {
      message: 'Streaming session started',
      movie: {
        id: movie.id,
        title: movie.title,
        filePath: movie.filePath,
        runtime: movie.runtime
      },
      streamingUrl: `/api/stream/${movie.id}`, // Will be implemented in video streaming
      startTime
    };
  }

  @Post(':imdbId/stop')
  @ApiOperation({ 
    summary: 'Stop streaming session',
    description: 'Stops streaming and saves final watch progress'
  })
  @ApiParam({ name: 'imdbId', description: 'IMDB ID of the movie' })
  @ApiResponse({ status: 200, description: 'Streaming session stopped successfully' })
  async stopStreaming(
    @Param('imdbId') imdbId: string,
    @Body() body: { userId?: number; currentTime: number; completed?: boolean }
  ) {
    const userId = body.userId || 1;
    const movie = await this.moviesService.getMovieByImdbId(imdbId);
    
    if (!movie) {
      return { error: 'Movie not found' };
    }

    // Update watch progress
    await this.moviesService.updateWatchProgress(movie.id, userId, body.currentTime);

    // Mark as watched if completed
    if (body.completed) {
      await this.moviesService.markAsWatched(movie.id, userId);
    }

    return {
      message: 'Streaming session stopped',
      finalProgress: body.currentTime,
      completed: body.completed || false
    };
  }

  private calculateETA(downloadedBytes: number, totalBytes: number, speedBps: number): string {
    if (speedBps <= 0) return 'Unknown';
    
    const remainingBytes = totalBytes - downloadedBytes;
    const etaSeconds = remainingBytes / speedBps;
    
    if (etaSeconds < 60) {
      return `${Math.round(etaSeconds)}s`;
    } else if (etaSeconds < 3600) {
      return `${Math.round(etaSeconds / 60)}m`;
    } else {
      return `${Math.round(etaSeconds / 3600)}h`;
    }
  }
}