import { Module } from '@nestjs/common';
import { VideoController } from './video.controller';
import { StreamingModule } from '../streaming/streaming.module';

@Module({
  imports: [StreamingModule],
  controllers: [VideoController],
})
export class VideoModule {}