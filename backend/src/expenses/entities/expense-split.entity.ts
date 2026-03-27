import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Expense } from './expense.entity';

@Entity('expense_splits')
export class ExpenseSplit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'expense_id' })
  expenseId: string;

  @ManyToOne(() => Expense, (expense) => expense.splits)
  @JoinColumn({ name: 'expense_id' })
  expense: Expense;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  percentage: number;
}
