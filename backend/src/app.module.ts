import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoviesModule } from './movies/movies.module';
import { WatchModule } from './watch/watch.module';
import { AuthModule } from './auth/auth.module';
import { StreamingModule } from './streaming/streaming.module';
import { VideoModule } from './video/video.module';
import { TestModule } from './test/test.module';
import { TorrentsModule } from './torrents/torrents.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true,
    }),
    AuthModule,
    MoviesModule,
    WatchModule,
    StreamingModule,
    VideoModule,
    TestModule,
    TorrentsModule,
  ],
})
export class AppModule {}