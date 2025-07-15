import { Controller, Get, Param, Res, Request } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { StreamingService } from './streaming.service';

@ApiTags('public-streaming')
@Controller('video')
export class PublicStreamingController {
  constructor(private readonly streamingService: StreamingService) {}

  @Get(':imdbId')
  @ApiOperation({ summary: 'Stream video directly (public)' })
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
}