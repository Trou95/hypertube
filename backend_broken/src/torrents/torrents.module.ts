import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { TorrentsController } from './torrents.controller';
import { DownloadController } from './download.controller';
import { TorrentsService } from './torrents.service';
import { YtsService } from './services/yts.service';
import { TorrentApiService } from './services/torrent-api.service';
import { TransmissionService } from './services/transmission.service';
import { DownloadService } from './services/download.service';
import { Download } from './entities/download.entity';
import { MoviesModule } from '../movies/movies.module';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([Download]),
    ScheduleModule.forRoot(),
    forwardRef(() => MoviesModule),
  ],
  controllers: [TorrentsController, DownloadController],
  providers: [
    TorrentsService, 
    YtsService, 
    TorrentApiService, 
    TransmissionService,
    DownloadService
  ],
  exports: [TorrentsService, DownloadService, TransmissionService],
})
export class TorrentsModule {}