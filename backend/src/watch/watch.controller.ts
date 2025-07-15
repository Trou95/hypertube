import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WatchService } from './watch.service';

@ApiTags('watch')
@Controller('watch')
export class WatchController {
  constructor(private readonly watchService: WatchService) {}

  @Get(':imdbId')
  @ApiOperation({ summary: 'Subject-compliant watch flow - auto-trigger download' })
  async getMovieForWatch(
    @Param('imdbId') imdbId: string,
    @Query('userId') userId: number = 1,
  ) {
    return this.watchService.getMovieForWatch(imdbId, userId);
  }

  @Post(':imdbId/stream')
  @ApiOperation({ summary: 'Start streaming session' })
  async startStreaming(
    @Param('imdbId') imdbId: string,
    @Body() body: { userId?: number; startTime?: number },
  ) {
    return this.watchService.startStreaming(imdbId, body.userId || 1, body.startTime || 0);
  }

  @Post(':imdbId/stop')
  @ApiOperation({ summary: 'Stop streaming session' })
  async stopStreaming(
    @Param('imdbId') imdbId: string,
    @Body() body: { userId?: number; currentTime: number; completed?: boolean },
  ) {
    return this.watchService.stopStreaming(
      imdbId,
      body.userId || 1,
      body.currentTime,
      body.completed || false,
    );
  }
}