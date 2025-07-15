import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum DownloadStatus {
  PENDING = 'pending',
  DOWNLOADING = 'downloading',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SEEDING = 'seeding',
}

@Entity('downloads')
export class Download {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  imdbId: string;

  @Column()
  movieTitle: string;

  @Column()
  torrentHash: string;

  @Column({ nullable: true })
  magnetUri: string;

  @Column({
    type: 'enum',
    enum: DownloadStatus,
    default: DownloadStatus.PENDING,
  })
  status: DownloadStatus;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progress: number;

  @Column({ type: 'bigint', default: 0 })
  downloadedBytes: number;

  @Column({ type: 'bigint', default: 0 })
  totalBytes: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  downloadSpeed: number; // bytes per second

  @Column({ type: 'int', default: 0 })
  seeders: number;

  @Column({ type: 'int', default: 0 })
  leechers: number;

  @Column({ nullable: true })
  filePath: string;

  @Column({ nullable: true })
  hlsPath: string; // Path to HLS playlist

  @Column({ default: false })
  isConverted: boolean;

  @Column({ nullable: true })
  error: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastAccessedAt: Date;
}