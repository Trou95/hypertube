import { IsOptional, IsString, IsNumber, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchMoviesDto {
  @ApiPropertyOptional({ description: 'Search query' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ description: 'Page number', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Genre filter' })
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiPropertyOptional({ description: 'Minimum year' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  yearMin?: number;

  @ApiPropertyOptional({ description: 'Maximum year' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  yearMax?: number;

  @ApiPropertyOptional({ description: 'Minimum IMDB rating' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  ratingMin?: number;

  @ApiPropertyOptional({ description: 'Maximum IMDB rating' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  ratingMax?: number;

  @ApiPropertyOptional({ description: 'Sort by: title, year, rating, popularity' })
  @IsOptional()
  @IsString()
  @IsIn(['title', 'year', 'rating', 'popularity'])
  sortBy?: string = 'title';

  @ApiPropertyOptional({ description: 'Sort order: asc, desc' })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: string = 'asc';

  @ApiPropertyOptional({ description: 'User ID for watch status', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  userId?: number = 1; // Default user for now, will be from auth later
}