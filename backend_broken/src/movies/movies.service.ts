import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from './entities/movie.entity';
import { UserWatch } from './entities/user-watch.entity';
import { TmdbService } from './services/tmdb.service';
import { OmdbService } from './services/omdb.service';
import { SearchMoviesDto } from './dto/search-movies.dto';
import { MovieThumbnailDto, MovieSearchResponseDto } from './dto/movie-thumbnail.dto';

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(UserWatch)
    private readonly userWatchRepository: Repository<UserWatch>,
    private readonly tmdbService: TmdbService,
    private readonly omdbService: OmdbService,
  ) {}

  async searchMovies(searchDto: SearchMoviesDto): Promise<MovieSearchResponseDto> {
    const { 
      query, 
      page = 1, 
      limit = 20,
      genre,
      yearMin,
      yearMax,
      ratingMin,
      ratingMax,
      sortBy = 'title',
      sortOrder = 'asc',
      userId = 1
    } = searchDto;

    let movies: any[];
    let totalResults = 0;
    let totalPages = 0;

    if (query) {
      // Search with query
      const result = await this.searchExternalMovies(query, page, limit);
      movies = result.movies;
      totalResults = result.totalResults;
      totalPages = result.totalPages;
    } else {
      // Get popular movies when no query
      const result = await this.getPopularMovies(page, limit);
      movies = result.movies;
      totalResults = result.totalResults;
      totalPages = result.totalPages;
    }

    // Apply filters
    if (genre) {
      movies = movies.filter(m => m.genre && m.genre.toLowerCase().includes(genre.toLowerCase()));
    }
    
    if (yearMin) {
      movies = movies.filter(m => m.year && m.year >= yearMin);
    }
    
    if (yearMax) {
      movies = movies.filter(m => m.year && m.year <= yearMax);
    }
    
    if (ratingMin) {
      movies = movies.filter(m => m.imdbRating && m.imdbRating >= ratingMin);
    }
    
    if (ratingMax) {
      movies = movies.filter(m => m.imdbRating && m.imdbRating <= ratingMax);
    }

    // Apply sorting
    movies = this.sortMovies(movies, sortBy, sortOrder);

    // Convert to thumbnails with watch status
    const thumbnails = await this.convertToThumbnails(movies, userId);

    return {
      movies: thumbnails,
      currentPage: page,
      totalPages,
      totalResults,
      hasNext: page < totalPages
    };
  }

  private sortMovies(movies: any[], sortBy: string, sortOrder: string): any[] {
    return movies.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case 'year':
          valueA = a.year || 0;
          valueB = b.year || 0;
          break;
        case 'rating':
          valueA = a.imdbRating || 0;
          valueB = b.imdbRating || 0;
          break;
        case 'popularity':
          // Use seeds as popularity metric
          valueA = a.seeds || 0;
          valueB = b.seeds || 0;
          break;
        default: // title
          valueA = (a.title || '').toLowerCase();
          valueB = (b.title || '').toLowerCase();
      }

      if (sortOrder === 'desc') {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      } else {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      }
    });
  }

  private async convertToThumbnails(movies: any[], userId: number): Promise<MovieThumbnailDto[]> {
    const thumbnails: MovieThumbnailDto[] = [];

    for (const movie of movies) {
      // Save movie to database if not exists
      let dbMovie = movie.imdbId ? await this.getMovieByImdbId(movie.imdbId) : null;
      
      if (!dbMovie && movie.imdbId) {
        dbMovie = await this.saveMovie({
          imdbId: movie.imdbId,
          title: movie.title,
          year: movie.year,
          genre: movie.genre,
          director: movie.director,
          cast: movie.cast,
          plot: movie.plot,
          poster: movie.poster,
          imdbRating: movie.imdbRating,
          runtime: movie.runtime
        });
      }

      // Check if user has watched this movie
      const userWatch = dbMovie ? await this.userWatchRepository.findOne({
        where: { userId, movieId: dbMovie.id }
      }) : null;

      thumbnails.push({
        id: dbMovie?.id || 0,
        imdbId: movie.imdbId || '',
        title: movie.title,
        year: movie.year,
        imdbRating: movie.imdbRating,
        poster: movie.poster,
        genre: movie.genre,
        runtime: movie.runtime,
        watched: userWatch?.watched || false,
        downloaded: dbMovie?.downloaded || false,
        plot: movie.plot,
        director: movie.director,
        cast: movie.cast
      });
    }

    return thumbnails;
  }

  private async searchExternalMovies(query: string, page: number, limit: number = 20) {
    const [tmdbResults, omdbResults] = await Promise.all([
      this.tmdbService.searchMovies(query, page),
      this.omdbService.searchMovies(query, page),
    ]);

    const movies = await this.mergeMovieResults(tmdbResults.results, omdbResults.Search || []);
    
    return {
      movies,
      totalPages: Math.max(tmdbResults.total_pages, Math.ceil(parseInt(omdbResults.totalResults || '0') / 10)),
      currentPage: page,
      totalResults: Math.max(tmdbResults.total_results, parseInt(omdbResults.totalResults || '0')),
    };
  }

  private async getPopularMovies(page: number, limit: number = 20) {
    const tmdbResults = await this.tmdbService.getPopularMovies(page);
    const movies = await this.mergeMovieResults(tmdbResults.results, []);
    
    return {
      movies,
      totalPages: tmdbResults.total_pages,
      currentPage: page,
      totalResults: tmdbResults.total_results,
    };
  }

  private async mergeMovieResults(tmdbMovies: any[], omdbMovies: any[]) {
    const movieMap = new Map();

    // Process TMDB results
    for (const tmdbMovie of tmdbMovies) {
      const movieData = {
        id: tmdbMovie.id,
        title: tmdbMovie.title,
        year: tmdbMovie.release_date ? new Date(tmdbMovie.release_date).getFullYear() : null,
        poster: tmdbMovie.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}` : null,
        plot: tmdbMovie.overview,
        imdbRating: tmdbMovie.vote_average,
        source: 'tmdb',
      };

      movieMap.set(tmdbMovie.title.toLowerCase(), movieData);
    }

    // Process OMDB results and merge with TMDB data
    for (const omdbMovie of omdbMovies) {
      const key = omdbMovie.Title.toLowerCase();
      if (movieMap.has(key)) {
        const existing = movieMap.get(key);
        existing.imdbId = omdbMovie.imdbID;
        existing.genre = omdbMovie.Genre;
        existing.director = omdbMovie.Director;
        existing.cast = omdbMovie.Actors;
        existing.runtime = omdbMovie.Runtime;
        if (omdbMovie.imdbRating && omdbMovie.imdbRating !== 'N/A') {
          existing.imdbRating = parseFloat(omdbMovie.imdbRating);
        }
      } else {
        movieMap.set(key, {
          imdbId: omdbMovie.imdbID,
          title: omdbMovie.Title,
          year: omdbMovie.Year !== 'N/A' ? parseInt(omdbMovie.Year) : null,
          poster: omdbMovie.Poster !== 'N/A' ? omdbMovie.Poster : null,
          genre: omdbMovie.Genre,
          director: omdbMovie.Director,
          cast: omdbMovie.Actors,
          runtime: omdbMovie.Runtime,
          imdbRating: omdbMovie.imdbRating && omdbMovie.imdbRating !== 'N/A' ? parseFloat(omdbMovie.imdbRating) : null,
          source: 'omdb',
        });
      }
    }

    return Array.from(movieMap.values());
  }

  async getMovieById(id: number): Promise<Movie> {
    return this.movieRepository.findOne({ where: { id } });
  }

  async getMovieByImdbId(imdbId: string): Promise<Movie> {
    return this.movieRepository.findOne({ where: { imdbId } });
  }

  async saveMovie(movieData: Partial<Movie>): Promise<Movie> {
    const movie = this.movieRepository.create(movieData);
    return this.movieRepository.save(movie);
  }

  async updateMovie(id: number, movieData: Partial<Movie>): Promise<Movie> {
    await this.movieRepository.update(id, movieData);
    return this.getMovieById(id);
  }

  async getMovieDetails(imdbId: string) {
    let movie = await this.getMovieByImdbId(imdbId);
    
    if (!movie) {
      const omdbMovie = await this.omdbService.getMovieByImdbId(imdbId);
      if (omdbMovie) {
        movie = await this.saveMovie({
          imdbId: omdbMovie.imdbID,
          title: omdbMovie.Title,
          year: omdbMovie.Year !== 'N/A' ? parseInt(omdbMovie.Year) : null,
          genre: omdbMovie.Genre,
          director: omdbMovie.Director,
          cast: omdbMovie.Actors,
          plot: omdbMovie.Plot,
          poster: omdbMovie.Poster !== 'N/A' ? omdbMovie.Poster : null,
          imdbRating: omdbMovie.imdbRating && omdbMovie.imdbRating !== 'N/A' ? parseFloat(omdbMovie.imdbRating) : null,
          runtime: omdbMovie.Runtime ? parseInt(omdbMovie.Runtime.replace(' min', '')) : null,
        });
      }
    }

    return movie;
  }

  // Watch status management
  async markAsWatched(movieId: number, userId: number = 1): Promise<UserWatch> {
    let userWatch = await this.userWatchRepository.findOne({
      where: { userId, movieId }
    });

    if (!userWatch) {
      userWatch = this.userWatchRepository.create({
        userId,
        movieId,
        watched: true,
        lastWatchedAt: new Date()
      });
    } else {
      userWatch.watched = true;
      userWatch.lastWatchedAt = new Date();
    }

    return this.userWatchRepository.save(userWatch);
  }

  async updateWatchProgress(movieId: number, userId: number, progressSeconds: number): Promise<UserWatch> {
    let userWatch = await this.userWatchRepository.findOne({
      where: { userId, movieId }
    });

    if (!userWatch) {
      userWatch = this.userWatchRepository.create({
        userId,
        movieId,
        watchProgress: progressSeconds,
        lastWatchedAt: new Date()
      });
    } else {
      userWatch.watchProgress = progressSeconds;
      userWatch.lastWatchedAt = new Date();
    }

    return this.userWatchRepository.save(userWatch);
  }

  async getWatchStatus(movieId: number, userId: number = 1): Promise<UserWatch | null> {
    return this.userWatchRepository.findOne({
      where: { userId, movieId },
      relations: ['movie']
    });
  }

  // Subject requirement: Movie details with auto-download trigger
  async getMovieDetailsForWatch(imdbId: string, userId: number = 1): Promise<any> {
    try {
      const movie = await this.getMovieDetails(imdbId);
      if (!movie) {
        throw new Error('Movie not found');
      }

      let watchStatus = null;
      try {
        watchStatus = await this.getWatchStatus(movie.id, userId);
      } catch (error) {
        console.log('Watch status error:', error.message);
        // Continue without watch status
      }
      
      return {
        ...movie,
        watchStatus: {
          watched: watchStatus?.watched || false,
          progress: watchStatus?.watchProgress || 0,
          lastWatchedAt: watchStatus?.lastWatchedAt
        },
        canWatch: movie.downloaded, // Only allow watching if downloaded
        needsDownload: !movie.downloaded // Trigger download if needed
      };
    } catch (error) {
      console.error('Error in getMovieDetailsForWatch:', error);
      throw error;
    }
  }
}