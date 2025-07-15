import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('test')
export class TestController {
  @Get('video')
  async testVideo(@Res() res: Response) {
    const fs = require('fs');
    const path = '/downloads/Batman Begins (2005) [REMASTERED] [REPACK] [1080p] [BluRay] [5.1] [YTS.MX]/Batman.Begins.2005.REMASTERED.REPACK.1080p.BluRay.x264.AAC5.1-[YTS.MX].mp4';
    
    try {
      if (!fs.existsSync(path)) {
        return res.status(404).send('File not found');
      }

      const stat = fs.statSync(path);
      const stream = fs.createReadStream(path);
      
      res.set({
        'Content-Type': 'video/mp4',
        'Content-Length': stat.size.toString(),
        'Accept-Ranges': 'bytes'
      });
      
      stream.pipe(res);
    } catch (error) {
      res.status(500).send('Error: ' + error.message);
    }
  }
}