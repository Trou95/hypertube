import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoviesModule } from './movies/movies.module';
import { TorrentsModule } from './torrents/torrents.module';
import { Movie } from './movies/entities/movie.entity';
import { UserWatch } from './movies/entities/user-watch.entity';
import { Download } from './torrents/entities/download.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Movie, UserWatch, Download],
      synchronize: process.env.NODE_ENV === 'development',
      logging: process.env.NODE_ENV === 'development',
    }),
    MoviesModule,
    TorrentsModule,
  ],
})
export class AppModule {}