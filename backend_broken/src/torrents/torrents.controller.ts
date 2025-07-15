import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TorrentsService } from './torrents.service';

@ApiTags('torrents')
@Controller('torrents')
export class TorrentsController {
  constructor(private readonly torrentsService: TorrentsService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search torrents by query' })
  @ApiResponse({ status: 200, description: 'Torrents found successfully' })
  async searchTorrents(@Query('q') query: string) {
    if (!query) {
      return { torrents: [], message: 'Query parameter is required' };
    }
    
    const torrents = await this.torrentsService.searchTorrents(query);
    return { torrents, count: torrents.length };
  }

  @Get('imdb/:imdbId')
  @ApiOperation({ summary: 'Search torrents by IMDB ID' })
  @ApiResponse({ status: 200, description: 'Torrents found successfully' })
  async searchTorrentsByImdbId(@Param('imdbId') imdbId: string) {
    const torrents = await this.torrentsService.searchTorrentsByImdbId(imdbId);
    return { torrents, count: torrents.length };
  }

  @Get('best/:imdbId')
  @ApiOperation({ summary: 'Get best torrent for a movie by IMDB ID' })
  @ApiResponse({ status: 200, description: 'Best torrent found successfully' })
  @ApiResponse({ status: 404, description: 'No torrents found for this movie' })
  async getBestTorrent(@Param('imdbId') imdbId: string) {
    const torrent = await this.torrentsService.getBestTorrent(imdbId);
    
    if (!torrent) {
      return { message: 'No torrents found for this movie' };
    }
    
    return { torrent };
  }
}