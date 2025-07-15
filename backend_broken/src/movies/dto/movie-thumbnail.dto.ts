import { ApiProperty } from '@nestjs/swagger';

export class MovieThumbnailDto {
  @ApiProperty({ description: 'Movie ID' })
  id: number;

  @ApiProperty({ description: 'IMDB ID' })
  imdbId: string;

  @ApiProperty({ description: 'Movie title' })
  title: string;

  @ApiProperty({ description: 'Production year' })
  year: number;

  @ApiProperty({ description: 'IMDB rating' })
  imdbRating: number;

  @ApiProperty({ description: 'Cover image URL' })
  poster: string;

  @ApiProperty({ description: 'Movie genres' })
  genre: string;

  @ApiProperty({ description: 'Movie runtime in minutes' })
  runtime: number;

  @ApiProperty({ description: 'Whether user has watched this movie' })
  watched: boolean;

  @ApiProperty({ description: 'Whether movie is downloaded on server' })
  downloaded: boolean;

  @ApiProperty({ description: 'Movie plot/summary' })
  plot?: string;

  @ApiProperty({ description: 'Director name' })
  director?: string;

  @ApiProperty({ description: 'Main cast' })
  cast?: string;
}

export class MovieSearchResponseDto {
  @ApiProperty({ type: [MovieThumbnailDto], description: 'Array of movie thumbnails' })
  movies: MovieThumbnailDto[];

  @ApiProperty({ description: 'Current page number' })
  currentPage: number;

  @ApiProperty({ description: 'Total pages available' })
  totalPages: number;

  @ApiProperty({ description: 'Total number of results' })
  totalResults: number;

  @ApiProperty({ description: 'Whether there are more pages' })
  hasNext: boolean;
}