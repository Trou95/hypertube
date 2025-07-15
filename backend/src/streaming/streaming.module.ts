import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StreamingController } from './streaming.controller';
import { StreamingService } from './streaming.service';
import { Download } from './entities/download.entity';
import { WatchHistory } from '../users/entities/watch-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Download, WatchHistory])],
  controllers: [StreamingController],
  providers: [StreamingService],
  exports: [StreamingService],
})
export class StreamingModule {}