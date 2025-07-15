import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MoviesService } from './movies.service';

@ApiTags('movies')
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search movies with thumbnails and watch status' })
  async searchMovies(
    @Query('query') query: string,
    @Query('page') page: string = '1',
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const pageNum = parseInt(page) || 1;
    return this.moviesService.searchMovies(query, pageNum, sortBy, sortOrder);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular movies' })
  async getPopularMovies(@Query('page') page: string = '1') {
    const pageNum = parseInt(page) || 1;
    return this.moviesService.getPopularMovies(pageNum);
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  async healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Hypertube backend is running (OMDB only)',
      apis: {
        omdb: process.env.OMDB_API_KEY ? 'configured' : 'missing',
      }
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get movie details by ID' })
  async getMovieById(@Param('id') id: string) {
    return this.moviesService.getMovieById(id);
  }
}