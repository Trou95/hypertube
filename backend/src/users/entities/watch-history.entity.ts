import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('watch_history')
export class WatchHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  imdbId: string;

  @Column()
  movieTitle: string;

  @Column({ default: 0 })
  progressSeconds: number;

  @Column({ default: 0 })
  durationSeconds: number;

  @Column({ default: false })
  completed: boolean;

  @Column({ default: false })
  watched: boolean;

  @CreateDateColumn()
  firstWatchedAt: Date;

  @UpdateDateColumn()
  lastWatchedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}