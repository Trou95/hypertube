import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('movies')
export class Movie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  imdbId: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  year: number;

  @Column({ nullable: true })
  genre: string;

  @Column({ nullable: true })
  director: string;

  @Column({ nullable: true })
  cast: string;

  @Column({ type: 'text', nullable: true })
  plot: string;

  @Column({ nullable: true })
  poster: string;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  imdbRating: number;

  @Column({ nullable: true })
  runtime: number;

  @Column({ default: false })
  downloaded: boolean;

  @Column({ nullable: true })
  filePath: string;

  @Column({ nullable: true })
  fileSize: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastWatched: Date;

  @Column({ nullable: true })
  lastAccessedAt: Date;
}