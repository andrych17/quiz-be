import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Question } from './question.entity';
import { Attempt } from './attempt.entity';

@Entity('attempt_answers')
@Index(['attemptId', 'questionId'])
export class AttemptAnswer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  attemptId: number;

  @Column()
  questionId: number;

  @Column({ name: 'answerText', type: 'text' })
  answerText: string;

  @Column({ name: 'selectedOption', nullable: true })
  selectedOption: number;

  @Column({ type: 'jsonb', name: 'selectedOptions', nullable: true })
  selectedOptions: number[];

  // Relations
  @ManyToOne(() => Attempt, (attempt) => attempt.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attemptId' })
  attempt: Attempt;

  @ManyToOne(() => Question, (question) => question.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'questionId' })
  question: Question;
}
