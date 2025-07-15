import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WatchController } from './watch.controller';
import { WatchService } from './watch.service';
import { MoviesModule } from '../movies/movies.module';
import { TorrentsModule } from '../torrents/torrents.module';
import { Download } from '../streaming/entities/download.entity';
import { WatchHistory } from '../users/entities/watch-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Download, WatchHistory]),
    MoviesModule,
    TorrentsModule,
  ],
  controllers: [WatchController],
  providers: [WatchService],
  exports: [WatchService],
})
export class WatchModule {}