import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Movie } from '../../movies/entities/movie.entity';

export enum DownloadStatus {
  QUEUED = 'queued',
  DOWNLOADING = 'downloading',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused'
}

@Entity('downloads')
export class Download {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  movieId: number;

  @ManyToOne(() => Movie)
  @JoinColumn({ name: 'movieId' })
  movie: Movie;

  @Column()
  torrentHash: string;

  @Column()
  magnetUrl: string;

  @Column()
  fileName: string;

  @Column({ type: 'bigint', default: 0 })
  fileSize: number;

  @Column({ type: 'bigint', default: 0 })
  downloadedBytes: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progress: number;

  @Column({ type: 'enum', enum: DownloadStatus, default: DownloadStatus.QUEUED })
  status: DownloadStatus;

  @Column({ nullable: true })
  filePath: string;

  @Column({ type: 'int', default: 0 })
  seeders: number;

  @Column({ type: 'int', default: 0 })
  peers: number;

  @Column({ type: 'int', default: 0 })
  downloadSpeed: number; // bytes per second

  @Column({ nullable: true })
  transmissionId: number;

  @Column({ nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  lastAccessedAt: Date;
}