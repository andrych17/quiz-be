import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Quiz } from './quiz.entity';

@Entity('user_quiz_assignments')
@Index(['userId', 'quizId'], { unique: true }) // Prevent duplicate assignments
@Index(['userId'])
@Index(['quizId'])
export class UserQuizAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  quizId: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  assignedBy: string; // Email of superadmin who assigned this

  @Column({ nullable: true })
  notes: string; // Optional notes about the assignment

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.quizAssignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Quiz, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;
}
