import { Injectable } from '@nestjs/common';
import { YtsService, YtsTorrent } from './services/yts.service';
import { TorrentApiService, TorrentApiResult } from './services/torrent-api.service';

export interface TorrentSearchResult {
  source: string;
  title: string;
  hash?: string;
  magnetUrl?: string;
  downloadUrl?: string;
  quality?: string;
  seeds: number;
  peers: number;
  size: string;
  sizeBytes?: number;
  uploadDate?: string;
}

@Injectable()
export class TorrentsService {
  constructor(
    private readonly ytsService: YtsService,
    private readonly torrentApiService: TorrentApiService,
  ) {}

  async searchTorrents(query: string): Promise<TorrentSearchResult[]> {
    const [ytsResults, torrentApiResults] = await Promise.all([
      this.searchYtsTorrents(query),
      this.searchTorrentApiTorrents(query),
    ]);

    return [...ytsResults, ...torrentApiResults];
  }

  async searchTorrentsByImdbId(imdbId: string): Promise<TorrentSearchResult[]> {
    const [ytsTorrents, torrentApiTorrents] = await Promise.all([
      this.ytsService.getTorrentsByImdbId(imdbId),
      this.torrentApiService.searchByImdbId(imdbId),
    ]);

    const ytsResults = this.mapYtsTorrents(ytsTorrents);
    const torrentApiResults = this.mapTorrentApiResults(torrentApiTorrents);

    return [...ytsResults, ...torrentApiResults];
  }

  private async searchYtsTorrents(query: string): Promise<TorrentSearchResult[]> {
    try {
      const response = await this.ytsService.searchMovies(query);
      if (response.status === 'ok' && response.data.movies) {
        const allTorrents: YtsTorrent[] = [];
        response.data.movies.forEach(movie => {
          if (movie.torrents) {
            allTorrents.push(...movie.torrents);
          }
        });
        return this.mapYtsTorrents(allTorrents);
      }
      return [];
    } catch (error) {
      console.error('YTS search error:', error);
      return [];
    }
  }

  private async searchTorrentApiTorrents(query: string): Promise<TorrentSearchResult[]> {
    try {
      const results = await this.torrentApiService.searchMovies(query);
      return this.mapTorrentApiResults(results);
    } catch (error) {
      console.error('TorrentAPI search error:', error);
      return [];
    }
  }

  private mapYtsTorrents(torrents: YtsTorrent[]): TorrentSearchResult[] {
    return torrents.map(torrent => ({
      source: 'YTS',
      title: `${torrent.quality} - ${torrent.type}`,
      hash: torrent.hash,
      magnetUrl: `magnet:?xt=urn:btih:${torrent.hash}`,
      downloadUrl: torrent.url,
      quality: torrent.quality,
      seeds: torrent.seeds,
      peers: torrent.peers,
      size: torrent.size,
      sizeBytes: torrent.size_bytes,
      uploadDate: torrent.date_uploaded,
    }));
  }

  private mapTorrentApiResults(results: TorrentApiResult[]): TorrentSearchResult[] {
    return results.map(result => ({
      source: 'TorrentAPI',
      title: result.filename,
      downloadUrl: result.download,
      seeds: result.seeders,
      peers: result.leechers,
      size: this.formatBytes(result.size),
      sizeBytes: result.size,
      uploadDate: result.pubdate,
    }));
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async getBestTorrent(imdbId: string): Promise<TorrentSearchResult | null> {
    const torrents = await this.searchTorrentsByImdbId(imdbId);
    
    if (torrents.length === 0) return null;

    // Sort by seeds (descending) and prefer 1080p quality
    const sortedTorrents = torrents.sort((a, b) => {
      if (a.quality === '1080p' && b.quality !== '1080p') return -1;
      if (b.quality === '1080p' && a.quality !== '1080p') return 1;
      return b.seeds - a.seeds;
    });

    return sortedTorrents[0];
  }
}