import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Transmission from 'transmission';

export interface TorrentInfo {
  id: number;
  name: string;
  hashString: string;
  status: number;
  progress: number;
  sizeWhenDone: number;
  downloadedEver: number;
  uploadedEver: number;
  rateDownload: number;
  rateUpload: number;
  peersConnected: number;
  seeders: number;
  downloadDir: string;
  files: Array<{
    name: string;
    length: number;
    bytesCompleted: number;
  }>;
  eta: number;
  error: number;
  errorString: string;
}

@Injectable()
export class TransmissionService {
  private readonly logger = new Logger(TransmissionService.name);
  private transmission: any;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('TRANSMISSION_HOST', 'localhost');
    const port = this.configService.get<number>('TRANSMISSION_PORT', 9091);
    
    this.transmission = new Transmission({
      host,
      port,
      username: 'admin',
      password: 'admin123',
    });

    this.logger.log(`Transmission client initialized for ${host}:${port}`);
  }

  async addTorrent(magnetUrl: string, downloadDir?: string): Promise<TorrentInfo> {
    return new Promise((resolve, reject) => {
      const options: any = {
        filename: magnetUrl,
      };

      if (downloadDir) {
        options['download-dir'] = downloadDir;
      }

      this.transmission.addUrl(magnetUrl, options, (err: any, result: any) => {
        if (err) {
          this.logger.error('Failed to add torrent:', err);
          reject(err);
          return;
        }

        const torrent = result['torrent-added'] || result['torrent-duplicate'];
        if (torrent) {
          this.logger.log(`Torrent added successfully: ${torrent.name} (ID: ${torrent.id})`);
          resolve(torrent);
        } else {
          reject(new Error('Failed to add torrent'));
        }
      });
    });
  }

  async getTorrent(torrentId: number): Promise<TorrentInfo | null> {
    return new Promise((resolve, reject) => {
      this.transmission.get(torrentId, (err: any, result: any) => {
        if (err) {
          this.logger.error(`Failed to get torrent ${torrentId}:`, err);
          reject(err);
          return;
        }

        const torrents = result.torrents;
        if (torrents && torrents.length > 0) {
          resolve(torrents[0]);
        } else {
          resolve(null);
        }
      });
    });
  }

  async getAllTorrents(): Promise<TorrentInfo[]> {
    return new Promise((resolve, reject) => {
      this.transmission.get((err: any, result: any) => {
        if (err) {
          this.logger.error('Failed to get all torrents:', err);
          reject(err);
          return;
        }

        resolve(result.torrents || []);
      });
    });
  }

  async removeTorrent(torrentId: number, deleteLocalData: boolean = false): Promise<void> {
    return new Promise((resolve, reject) => {
      this.transmission.remove(torrentId, deleteLocalData, (err: any) => {
        if (err) {
          this.logger.error(`Failed to remove torrent ${torrentId}:`, err);
          reject(err);
          return;
        }

        this.logger.log(`Torrent removed: ${torrentId}`);
        resolve();
      });
    });
  }

  async startTorrent(torrentId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.transmission.start(torrentId, (err: any) => {
        if (err) {
          this.logger.error(`Failed to start torrent ${torrentId}:`, err);
          reject(err);
          return;
        }

        this.logger.log(`Torrent started: ${torrentId}`);
        resolve();
      });
    });
  }

  async stopTorrent(torrentId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.transmission.stop(torrentId, (err: any) => {
        if (err) {
          this.logger.error(`Failed to stop torrent ${torrentId}:`, err);
          reject(err);
          return;
        }

        this.logger.log(`Torrent stopped: ${torrentId}`);
        resolve();
      });
    });
  }

  async getSessionStats(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.transmission.sessionStats((err: any, result: any) => {
        if (err) {
          this.logger.error('Failed to get session stats:', err);
          reject(err);
          return;
        }

        resolve(result);
      });
    });
  }

  getStatusText(status: number): string {
    const statusMap: { [key: number]: string } = {
      0: 'Stopped',
      1: 'Check queued',
      2: 'Checking',
      3: 'Download queued',
      4: 'Downloading',
      5: 'Seed queued',
      6: 'Seeding'
    };

    return statusMap[status] || 'Unknown';
  }

  isCompleted(torrent: TorrentInfo): boolean {
    return torrent.progress >= 1.0;
  }

  isDownloading(torrent: TorrentInfo): boolean {
    return torrent.status === 4; // Downloading
  }

  hasError(torrent: TorrentInfo): boolean {
    return torrent.error !== 0;
  }
}