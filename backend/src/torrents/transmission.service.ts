import { Injectable, Logger } from '@nestjs/common';
import * as Transmission from 'transmission';

export interface TorrentAddResult {
  success: boolean;
  torrentId?: number;
  hash?: string;
  error?: string;
}

@Injectable()
export class TransmissionService {
  private readonly logger = new Logger(TransmissionService.name);
  private transmission: any;

  constructor() {
    this.transmission = new Transmission({
      host: 'transmission',
      port: 9091,
      username: 'admin',
      password: 'admin123',
    });

    this.logger.log('Transmission client initialized for transmission:9091');
  }

  async addTorrentUrl(torrentUrl: string, movieTitle: string): Promise<TorrentAddResult> {
    try {
      this.logger.log(`Adding torrent URL for: ${movieTitle}`);
      
      return new Promise((resolve) => {
        const options = {
          filename: torrentUrl,
          'download-dir': '/downloads',
          paused: false
        };

        this.transmission.addUrl(torrentUrl, options, (err: any, result: any) => {
          if (err) {
            this.logger.error('Failed to add torrent:', err);
            resolve({
              success: false,
              error: err.message || 'Unknown error'
            });
            return;
          }

          // Check both possible response formats
          if (result && (result.id || result.hashString)) {
            this.logger.log(`Torrent added successfully: ${result.name || 'Unknown'} (ID: ${result.id})`);
            resolve({
              success: true,
              torrentId: result.id,
              hash: result.hashString || this.extractHashFromTorrentUrl(torrentUrl)
            });
          } else {
            this.logger.error('Failed to add torrent: Invalid response format', result);
            resolve({
              success: false,
              error: 'Invalid response format'
            });
          }
        });
      });
    } catch (error) {
      this.logger.error(`Error adding torrent: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async addMagnetLink(magnetUri: string, movieTitle: string): Promise<TorrentAddResult> {
    try {
      this.logger.log(`Adding magnet link for: ${movieTitle}`);
      
      return new Promise((resolve) => {
        const options = {
          filename: magnetUri,
          'download-dir': '/downloads',
          paused: false
        };

        this.transmission.addUrl(magnetUri, options, (err: any, result: any) => {
          if (err) {
            this.logger.error('Failed to add torrent:', err);
            resolve({
              success: false,
              error: err.message || 'Unknown error'
            });
            return;
          }

          // Check both possible response formats
          if (result && (result.id || result.hashString)) {
            this.logger.log(`Torrent added successfully: ${result.name || 'Unknown'} (ID: ${result.id})`);
            resolve({
              success: true,
              torrentId: result.id,
              hash: result.hashString || this.extractHashFromMagnet(magnetUri)
            });
          } else {
            this.logger.error('Failed to add torrent: Invalid response format', result);
            resolve({
              success: false,
              error: 'Invalid response format'
            });
          }
        });
      });
    } catch (error) {
      this.logger.error(`Error adding torrent: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getTorrentProgress(hash: string): Promise<{ 
    progress: number; 
    status: string; 
    downloadSpeed: number;
    uploadSpeed: number;
    seeds: number;
    peers: number;
    downloaded: number;
    total: number;
    eta: number;
    files?: any[];
    errorDetails?: string;
    trackerInfo?: any[];
    isStalled?: boolean;
  } | null> {
    try {
      return new Promise((resolve) => {
        this.transmission.get((err: any, result: any) => {
          if (err) {
            this.logger.error('Failed to get torrents:', err);
            resolve(null);
            return;
          }

          const torrents = result.torrents || [];
          const torrent = torrents.find((t: any) => 
            t.hashString && t.hashString.toLowerCase() === hash.toLowerCase()
          );

          if (torrent) {
            const progress = Math.round((torrent.percentDone || 0) * 100 * 100) / 100; // 2 decimal precision
            const status = this.getStatusText(torrent.status);
            
            resolve({
              progress,
              status,
              downloadSpeed: torrent.rateDownload || 0, // bytes/sec
              uploadSpeed: torrent.rateUpload || 0,
              seeds: torrent.seeders || 0,
              peers: torrent.peersConnected || 0,
              downloaded: torrent.downloadedEver || 0,
              total: torrent.sizeWhenDone || 0,
              eta: torrent.eta || -1,
              files: torrent.files || []
            });
          } else {
            resolve(null);
          }
        });
      });
    } catch (error) {
      this.logger.error(`Error getting torrent progress: ${error.message}`);
      return null;
    }
  }

  private getStatusText(status: number): string {
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

  private extractHashFromMagnet(magnetUri: string): string {
    const match = magnetUri.match(/btih:([a-fA-F0-9]+)/);
    return match ? match[1] : '';
  }

  private extractHashFromTorrentUrl(torrentUrl: string): string {
    // Extract hash from YTS download URL like: https://yts.mx/torrent/download/HASH
    const match = torrentUrl.match(/\/([A-F0-9]{40})$/);
    return match ? match[1].toLowerCase() : '';
  }

  createMagnetUri(hash: string, name: string): string {
    // Ensure hash is lowercase for better compatibility
    const cleanHash = hash.toLowerCase().replace(/[^a-f0-9]/g, '');
    
    // const trackers = [
    //   // Most reliable UDP trackers from trackers.txt
    //   'udp://tracker.opentrackr.org:1337/announce',
    //   'udp://open.demonii.com:1337/announce',
    //   'udp://exodus.desync.com:6969/announce',
    //   'udp://tracker.torrent.eu.org:451/announce',
    //   'udp://public.popcorn-tracker.org:6969/announce',
    //   'udp://tracker.openbittorrent.com:80/announce',
    //   'udp://tracker.tiny-vps.com:6969/announce',
    //   'udp://tracker.internetwarriors.net:1337/announce',
    //   'udp://tracker.leechers-paradise.org:6969/announce',
    //   'udp://9.rarbg.com:2710/announce',
    //   'udp://tracker.coppersurfer.tk:6969/announce',
    //   'udp://open.stealth.si:80/announce',
    //   'udp://tracker.piratepublic.com:1337/announce',
    //   'udp://tracker.mg64.net:6969/announce',
    //   'udp://tracker.cyberia.is:6969/announce',
    //   'udp://tracker.skyts.net:6969/announce',
    //   'udp://tracker.ololosh.space:6969/announce',
    //   'udp://tracker.dump.cl:6969/announce',
    //   'udp://opentracker.io:6969/announce',
    //   'udp://bt.ktrackers.com:6666/announce'
    // ];

    const trackers = [
  "udp://public.popcorn-tracker.org:6969/announce",
  "udp://107.150.14.110:6969/announce",
  "udp://109.121.134.121:1337/announce",
  "udp://114.55.113.60:6969/announce",
  "udp://128.199.70.66:5944/announce",
  "udp://151.80.120.114:2710/announce",
  "udp://168.235.67.63:6969/announce",
  "udp://178.33.73.26:2710/announce",
  "udp://182.176.139.129:6969/announce",
  "udp://185.5.97.139:8089/announce",
  "udp://185.86.149.205:1337/announce",
  "udp://188.165.253.109:1337/announce",
  "udp://191.101.229.236:1337/announce",
  "udp://194.106.216.222:80/announce",
  "udp://195.123.209.37:1337/announce",
  "udp://195.123.209.40:80/announce",
  "udp://208.67.16.113:8000/announce",
  "udp://213.163.67.56:1337/announce",
  "udp://37.19.5.155:2710/announce",
  "udp://46.4.109.148:6969/announce",
  "udp://5.79.249.77:6969/announce",
  "udp://5.79.83.193:6969/announce",
  "udp://51.254.244.161:6969/announce",
  "udp://62.138.0.158:6969/announce",
  "udp://62.212.85.66:2710/announce",
  "udp://74.82.52.209:6969/announce",
  "udp://85.17.19.180:80/announce",
  "udp://89.234.156.205:80/announce",
  "udp://9.rarbg.com:2710/announce",
  "udp://9.rarbg.me:2780/announce",
  "udp://9.rarbg.to:2730/announce",
  "udp://91.218.230.81:6969/announce",
  "udp://94.23.183.33:6969/announce",
  "udp://bt.xxx-tracker.com:2710/announce",
  "udp://eddie4.nl:6969/announce",
  "udp://explodie.org:6969/announce",
  "udp://mgtracker.org:2710/announce",
  "udp://open.stealth.si:80/announce",
  "udp://p4p.arenabg.com:1337/announce",
  "udp://shadowshq.eddie4.nl:6969/announce",
  "udp://shadowshq.yi.org:6969/announce",
  "udp://torrent.gresille.org:80/announce",
  "udp://tracker.aletorrenty.pl:2710/announce",
  "udp://tracker.bittor.pw:1337/announce",
  "udp://tracker.coppersurfer.tk:6969/announce",
  "udp://tracker.eddie4.nl:6969/announce",
  "udp://tracker.ex.ua:80/announce",
  "udp://tracker.filetracker.pl:8089/announce",
  "udp://tracker.flashtorrents.org:6969/announce",
  "udp://tracker.grepler.com:6969/announce",
  "udp://tracker.ilibr.org:80/announce",
  "udp://tracker.internetwarriors.net:1337/announce",
  "udp://tracker.kicks-ass.net:80/announce",
  "udp://tracker.kuroy.me:5944/announce",
  "udp://tracker.leechers-paradise.org:6969/announce",
  "udp://tracker.mg64.net:2710/announce",
  "udp://tracker.mg64.net:6969/announce",
  "udp://tracker.opentrackr.org:1337/announce",
  "udp://tracker.piratepublic.com:1337/announce",
  "udp://tracker.sktorrent.net:6969/announce",
  "udp://tracker.skyts.net:6969/announce",
  "udp://tracker.tiny-vps.com:6969/announce",
  "udp://tracker.yoshi210.com:6969/announce",
  "udp://tracker2.indowebster.com:6969/announce",
  "udp://tracker4.piratux.com:6969/announce",
  "udp://zer0day.ch:1337/announce",
  "udp://zer0day.to:1337/announce",
  "udp://open.demonii.com:1337/announce",
  "udp://exodus.desync.com:6969/announce",
  "udp://tracker.torrent.eu.org:451/announce",
  "udp://wepzone.net:6969/announce",
  "udp://tracker1.myporn.club:9337/announce",
  "udp://tracker.ololosh.space:6969/announce",
  "udp://tracker.dump.cl:6969/announce",
  "udp://tracker-udp.gbitt.info:80/announce",
  "udp://retracker01-msk-virt.corbina.net:80/announce",
  "udp://public.tracker.vraphim.com:6969/announce",
  "udp://opentracker.io:6969/announce",
  "udp://open.free-tracker.ga:6969/announce",
  "udp://leet-tracker.moe:1337/announce",
  "udp://ipv4announce.sktorrent.eu:6969/announce",
  "udp://bt.ktrackers.com:6666/announce",
  "udp://extracker.dahrkael.net:6969/announce",
  "udp://tracker.plx.im:6969/announce",
  "udp://open.demonii.si:1337/announce",
  "udp://tracker.ducks.party:1984/announce",
  "udp://tracker.kmzs123.cn:17272/announce",
  "udp://tracker.yume-hatsuyuki.moe:6969/announce",
  "udp://tracker.qu.ax:6969/announce",
  "udp://udp.tracker.projectk.org:23333/announce",
  "udp://tracker.dler.com:6969/announce",
  "udp://www.torrent.eu.org:451/announce",
  "udp://207.241.226.111:6969/announce",
  "udp://207.241.231.226:6969/announce",
  "udp://[2a04:ac00:1:3dd8::1:2710]:2710/announce",
  "udp://ipv4announce.sktorrent.eu:6969/announce",
  "udp://ipv6.rer.lol:6969/announce",
  "udp://ns3109441.mypdns.org:6969/announce",
  "udp://retracker.hotplug.ru:2710/announce",
  "udp://tracker.srv00.com:6969/announce",
  "udp://tracker.gmi.gd:6969/announce",
  "udp://tracker.gigantino.net:6969/announce",
  "udp://tracker.fnix.net:6969/announce",
  "udp://tracker.filemail.com:6969/announce",
  "udp://tracker.ddunlimited.net:6969/announce",
  "udp://tracker.darkness.services:6969/announce",
  "udp://tr4ck3r.duckdns.org:6969/announce",
  "udp://t.overflow.biz:6969/announce",
  "udp://retracker.lanta.me:2710/announce",
  "udp://p2p.publictracker.xyz:6969/announce",
  "udp://open.dstud.io:6969/announce",
  "udp://martin-gebhardt.eu:25/announce",
  "udp://ipv4.rer.lol:2710/announce",
  "udp://evan.im:6969/announce",
  "udp://d40969.acod.regrucolo.ru:6969/announce",
  "udp://concen.org:6969/announce",
  "udp://bt.rer.lol:6969/announce",
  "udp://bt.rer.lol:2710/announce",
  "udp://bittorrent-tracker.e-n-c-r-y-p-t.net:1337/announce",
  "udp://bandito.byterunner.io:6969/announce",
  "udp://tracker.cyberia.is:6969/announce",
  "udp://tracker.iperson.xyz:6969/announce",
  "udp://tracker.kmzs123.top:17272/announce",
  "udp://tracker.valete.tf:9999/announce",
  "udp://tracker2.itzmx.com:6961/announce",
  "udp://tracker3.itzmx.com:6961/announce",
  "udp://tracker4.itzmx.com:2710/announce"
];

    
    
    const trackerParams = trackers.map(tracker => `tr=${encodeURIComponent(tracker)}`).join('&');
    return `magnet:?xt=urn:btih:${cleanHash}&dn=${encodeURIComponent(name)}&${trackerParams}`;
  }
}