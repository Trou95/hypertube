import { Controller, Get, Query, Param, Post, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MoviesService } from './movies.service';
import { SearchMoviesDto } from './dto/search-movies.dto';
import { MovieSearchResponseDto } from './dto/movie-thumbnail.dto';

@ApiTags('movies')
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get('search')
  @ApiOperation({ 
    summary: 'Search movies with thumbnails - Subject compliant',
    description: 'Returns paginated movie thumbnails with watch status, sorting and filtering options'
  })
  @ApiResponse({ status: 200, description: 'Movies found successfully', type: MovieSearchResponseDto })
  async searchMovies(@Query() searchDto: SearchMoviesDto): Promise<MovieSearchResponseDto> {
    return this.moviesService.searchMovies(searchDto);
  }

  @Get('popular')
  @ApiOperation({ 
    summary: 'Get popular movies as thumbnails',
    description: 'Returns popular movies when no search query is provided'
  })
  @ApiResponse({ status: 200, description: 'Popular movies retrieved successfully', type: MovieSearchResponseDto })
  async getPopularMovies(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('userId') userId: number = 1
  ): Promise<MovieSearchResponseDto> {
    return this.moviesService.searchMovies({ page, limit, userId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get movie details by ID' })
  @ApiResponse({ status: 200, description: 'Movie details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async getMovie(@Param('id') id: number) {
    return this.moviesService.getMovieById(id);
  }

  @Get('watch/:imdbId')
  @ApiOperation({ 
    summary: 'Get movie details for watching - Subject compliant',
    description: 'Returns movie details with watch status and triggers download if needed'
  })
  @ApiParam({ name: 'imdbId', description: 'IMDB ID of the movie' })
  @ApiResponse({ status: 200, description: 'Movie details for watching retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async getMovieForWatch(
    @Param('imdbId') imdbId: string,
    @Query('userId') userId: number = 1
  ) {
    return this.moviesService.getMovieDetailsForWatch(imdbId, userId);
  }

  @Get('imdb/:imdbId')
  @ApiOperation({ summary: 'Get movie details by IMDB ID' })
  @ApiResponse({ status: 200, description: 'Movie details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async getMovieByImdbId(@Param('imdbId') imdbId: string) {
    return this.moviesService.getMovieDetails(imdbId);
  }

  @Post(':id/watch')
  @ApiOperation({ 
    summary: 'Mark movie as watched',
    description: 'Updates user watch status for the movie'
  })
  @ApiParam({ name: 'id', description: 'Movie ID' })
  @ApiResponse({ status: 200, description: 'Movie marked as watched successfully' })
  async markAsWatched(
    @Param('id') movieId: number,
    @Query('userId') userId: number = 1
  ) {
    const watchStatus = await this.moviesService.markAsWatched(movieId, userId);
    return { message: 'Movie marked as watched', watchStatus };
  }

  @Patch(':id/progress')
  @ApiOperation({ 
    summary: 'Update watch progress',
    description: 'Updates user watch progress for the movie'
  })
  @ApiParam({ name: 'id', description: 'Movie ID' })
  @ApiResponse({ status: 200, description: 'Watch progress updated successfully' })
  async updateWatchProgress(
    @Param('id') movieId: number,
    @Body() body: { progressSeconds: number; userId?: number }
  ) {
    const userId = body.userId || 1;
    const watchStatus = await this.moviesService.updateWatchProgress(
      movieId, 
      userId, 
      body.progressSeconds
    );
    return { message: 'Watch progress updated', watchStatus };
  }

  @Get(':id/watch-status')
  @ApiOperation({ 
    summary: 'Get watch status for movie',
    description: 'Returns user watch status and progress for the movie'
  })
  @ApiParam({ name: 'id', description: 'Movie ID' })
  @ApiResponse({ status: 200, description: 'Watch status retrieved successfully' })
  async getWatchStatus(
    @Param('id') movieId: number,
    @Query('userId') userId: number = 1
  ) {
    const watchStatus = await this.moviesService.getWatchStatus(movieId, userId);
    return { watchStatus };
  }
}