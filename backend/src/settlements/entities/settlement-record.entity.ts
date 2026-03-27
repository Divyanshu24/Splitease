import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Group } from '../../groups/entities/group.entity';

@Entity('settlement_records')
export class SettlementRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  groupId: string;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  group: Group;

  @Column('uuid')
  fromUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  fromUser: User;

  @Column('uuid')
  toUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  toUser: User;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @CreateDateColumn()
  settledAt: Date;
}
