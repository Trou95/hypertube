import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { MoviesController } from './movies.controller';
import { WatchController } from './watch.controller';
import { MoviesService } from './movies.service';
import { TmdbService } from './services/tmdb.service';
import { OmdbService } from './services/omdb.service';
import { Movie } from './entities/movie.entity';
import { UserWatch } from './entities/user-watch.entity';
import { TorrentsModule } from '../torrents/torrents.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Movie, UserWatch]),
    HttpModule,
    forwardRef(() => TorrentsModule),
  ],
  controllers: [MoviesController, WatchController],
  providers: [MoviesService, TmdbService, OmdbService],
  exports: [MoviesService],
})
export class MoviesModule {}