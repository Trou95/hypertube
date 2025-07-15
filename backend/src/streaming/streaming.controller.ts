import { Controller, Get, Post, Param, Body, Res, UseGuards, Request, SetMetadata } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { StreamingService } from './streaming.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('streaming')  
@Controller('stream')
export class StreamingController {
  constructor(private readonly streamingService: StreamingService) {}

  @Get(':imdbId/info')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get streaming information for a movie' })
  async getStreamingInfo(@Param('imdbId') imdbId: string, @Request() req) {
    return this.streamingService.getStreamingInfo(imdbId, req.user.id);
  }

  @Get(':imdbId/playlist.m3u8')
  @SetMetadata('isPublic', true)
  @ApiOperation({ summary: 'Get HLS playlist for streaming' })
  async getHLSPlaylist(@Param('imdbId') imdbId: string, @Res() res: Response) {
    try {
      const playlist = await this.streamingService.getHLSPlaylist(imdbId);
      res.set({
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      });
      res.send(playlist);
    } catch (error) {
      console.log(`❌ HLS playlist error for ${imdbId}: ${error.message}`);
      if (error.message.includes('conversion in progress')) {
        res.status(404).send('HLS conversion in progress, use direct video streaming');
      } else {
        res.status(404).send('Playlist not found');
      }
    }
  }

  @Get(':imdbId/video')
  @SetMetadata('isPublic', true)
  @ApiOperation({ summary: 'Stream video directly' })
  async getVideoStream(@Param('imdbId') imdbId: string, @Res() res: Response, @Request() req) {
    try {
      const filePath = await this.streamingService.getVideoFilePath(imdbId);
      
      if (!filePath) {
        return res.status(404).send('Video not available for streaming');
      }

      const fs = require('fs');
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).send('Video file not found');
      }

      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;
        const file = fs.createReadStream(filePath, { start, end });
        
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': 'video/mp4',
        });
        
        file.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
        });
        
        fs.createReadStream(filePath).pipe(res);
      }
    } catch (error) {
      console.error('Video streaming error:', error);
      res.status(500).send('Error streaming video');
    }
  }

  @Get(':imdbId/:segmentName')
  @SetMetadata('isPublic', true)
  @ApiOperation({ summary: 'Get HLS segment for streaming' })
  async getHLSSegment(
    @Param('imdbId') imdbId: string,
    @Param('segmentName') segmentName: string,
    @Res() res: Response,
  ) {
    try {
      const segment = await this.streamingService.getHLSSegment(imdbId, segmentName);
      res.set({
        'Content-Type': 'video/mp2t',
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
      });
      res.send(segment);
    } catch (error) {
      res.status(404).send('Segment not found');
    }
  }

  @Post(':imdbId/progress')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update watch progress' })
  async updateProgress(
    @Param('imdbId') imdbId: string,
    @Body() body: { progressSeconds: number; durationSeconds?: number },
    @Request() req,
  ) {
    const watchHistory = await this.streamingService.updateWatchProgress(
      imdbId,
      req.user.id,
      body.progressSeconds,
      body.durationSeconds,
    );

    return {
      message: 'Progress updated successfully',
      watchHistory: {
        progressSeconds: watchHistory.progressSeconds,
        durationSeconds: watchHistory.durationSeconds,
        completed: watchHistory.completed,
        lastWatchedAt: watchHistory.lastWatchedAt,
      },
    };
  }
}