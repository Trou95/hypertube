"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoviesService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
let MoviesService = class MoviesService {
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.omdbBaseUrl = 'http://www.omdbapi.com';
        this.omdbApiKey = this.configService.get('OMDB_API_KEY');
    }
    async searchMovies(query, page = 1, sortBy, sortOrder) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(this.omdbBaseUrl, {
                params: {
                    apikey: this.omdbApiKey,
                    s: query,
                    page: page.toString(),
                    type: 'movie',
                },
            }));
            if (response.data.Response === 'False') {
                return {
                    results: [],
                    page: 1,
                    totalPages: 1,
                    totalResults: 0,
                    message: response.data.Error,
                };
            }
            let movies = response.data.Search.map(movie => this.formatMovieThumbnail(movie));
            if (sortBy) {
                movies = this.sortMovies(movies, sortBy, sortOrder);
            }
            const totalResults = parseInt(response.data.totalResults) || 0;
            const totalPages = Math.ceil(totalResults / 10);
            return {
                results: movies,
                page: page,
                totalPages,
                totalResults,
            };
        }
        catch (error) {
            console.error('OMDB search error:', error.message);
            throw new Error('Failed to search movies');
        }
    }
    async getPopularMovies(page = 1) {
        try {
            const popularSearches = ['action', 'adventure', 'comedy', 'drama', 'horror', 'thriller'];
            const randomSearch = popularSearches[Math.floor(Math.random() * popularSearches.length)];
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(this.omdbBaseUrl, {
                params: {
                    apikey: this.omdbApiKey,
                    s: randomSearch,
                    page: page.toString(),
                    type: 'movie',
                },
            }));
            if (response.data.Response === 'False') {
                return {
                    results: [],
                    page: 1,
                    totalPages: 1,
                    totalResults: 0,
                    message: response.data.Error,
                };
            }
            const movies = response.data.Search.map(movie => this.formatMovieThumbnail(movie));
            const totalResults = parseInt(response.data.totalResults) || 0;
            const totalPages = Math.ceil(totalResults / 10);
            return {
                results: movies,
                page: page,
                totalPages,
                totalResults,
            };
        }
        catch (error) {
            console.error('OMDB popular movies error:', error.message);
            throw new Error('Failed to get popular movies');
        }
    }
    async getMovieById(imdbId) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(this.omdbBaseUrl, {
                params: {
                    apikey: this.omdbApiKey,
                    i: imdbId,
                    plot: 'full',
                },
            }));
            if (response.data.Response === 'False') {
                throw new Error(response.data.Error || 'Movie not found');
            }
            return this.formatMovieDetails(response.data);
        }
        catch (error) {
            console.error('OMDB movie details error:', error.message);
            throw new Error('Failed to get movie details');
        }
    }
    formatMovieThumbnail(movie) {
        return {
            id: movie.imdbID,
            imdbId: movie.imdbID,
            title: movie.Title,
            year: movie.Year ? parseInt(movie.Year) : null,
            poster: movie.Poster !== 'N/A' ? movie.Poster : null,
            rating: 0,
            popularity: 0,
            overview: '',
            watched: false,
            downloadProgress: 0,
            isDownloading: false,
            isStreaming: false,
            type: movie.Type,
        };
    }
    formatMovieDetails(omdbData) {
        return {
            id: omdbData.imdbID,
            imdbId: omdbData.imdbID,
            title: omdbData.Title,
            year: omdbData.Year ? parseInt(omdbData.Year) : null,
            releaseDate: omdbData.Released !== 'N/A' ? omdbData.Released : null,
            runtime: omdbData.Runtime !== 'N/A' ? omdbData.Runtime : null,
            poster: omdbData.Poster !== 'N/A' ? omdbData.Poster : null,
            rating: omdbData.imdbRating !== 'N/A' ? parseFloat(omdbData.imdbRating) : 0,
            imdbRating: omdbData.imdbRating !== 'N/A' ? parseFloat(omdbData.imdbRating) : null,
            metascore: omdbData.Metascore !== 'N/A' ? parseInt(omdbData.Metascore) : null,
            overview: omdbData.Plot !== 'N/A' ? omdbData.Plot : '',
            plot: omdbData.Plot !== 'N/A' ? omdbData.Plot : '',
            genre: omdbData.Genre !== 'N/A' ? omdbData.Genre : '',
            director: omdbData.Director !== 'N/A' ? omdbData.Director : null,
            writer: omdbData.Writer !== 'N/A' ? omdbData.Writer : null,
            actors: omdbData.Actors !== 'N/A' ? omdbData.Actors : null,
            language: omdbData.Language !== 'N/A' ? omdbData.Language : null,
            country: omdbData.Country !== 'N/A' ? omdbData.Country : null,
            awards: omdbData.Awards !== 'N/A' ? omdbData.Awards : null,
            boxOffice: omdbData.BoxOffice !== 'N/A' ? omdbData.BoxOffice : null,
            production: omdbData.Production !== 'N/A' ? omdbData.Production : null,
            website: omdbData.Website !== 'N/A' ? omdbData.Website : null,
            watched: false,
            downloadProgress: 0,
            isDownloading: false,
            isStreaming: false,
        };
    }
    sortMovies(movies, sortBy, sortOrder = 'desc') {
        return movies.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];
            if (sortBy === 'title') {
                aValue = aValue?.toLowerCase() || '';
                bValue = bValue?.toLowerCase() || '';
            }
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortOrder === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }
            if (sortOrder === 'asc') {
                return (aValue || 0) - (bValue || 0);
            }
            else {
                return (bValue || 0) - (aValue || 0);
            }
        });
    }
};
exports.MoviesService = MoviesService;
exports.MoviesService = MoviesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof axios_1.HttpService !== "undefined" && axios_1.HttpService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object])
], MoviesService);
//# sourceMappingURL=movies.service.js.map