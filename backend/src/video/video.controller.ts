import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { StreamingService } from '../streaming/streaming.service';

@ApiTags('video')
@Controller('video')
export class VideoController {
  constructor(private readonly streamingService: StreamingService) {}

  @Get(':imdbId')
  async streamVideo(@Param('imdbId') imdbId: string, @Res() res: Response) {
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
      const range = res.req.headers.range;

      res.set({
        'Accept-Ranges': 'bytes',
        'Content-Type': 'video/mp4',
      });

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;
        
        res.status(206);
        res.set({
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Content-Length': chunkSize.toString(),
        });
        
        const stream = fs.createReadStream(filePath, { start, end });
        stream.pipe(res);
      } else {
        res.set({
          'Content-Length': fileSize.toString(),
        });
        
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
      }
    } catch (error) {
      console.error('Video streaming error:', error);
      res.status(500).send('Error streaming video');
    }
  }
}