import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Movie } from './movie.entity';

@Entity('user_watches')
@Unique(['userId', 'movieId'])
export class UserWatch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number; // Future: relation to User entity

  @Column()
  movieId: number;

  @ManyToOne(() => Movie)
  @JoinColumn({ name: 'movieId' })
  movie: Movie;

  @Column({ default: false })
  watched: boolean;

  @Column({ type: 'int', default: 0 })
  watchProgress: number; // in seconds

  @Column({ nullable: true })
  lastWatchedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}