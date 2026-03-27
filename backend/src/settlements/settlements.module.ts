import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettlementsService } from './settlements.service';
import { SettlementsController } from './settlements.controller';
import { SettlementRecord } from './entities/settlement-record.entity';
import { GroupsModule } from '../groups/groups.module';
import { ExpensesModule } from '../expenses/expenses.module';

@Module({
  imports: [TypeOrmModule.forFeature([SettlementRecord]), GroupsModule, ExpensesModule],
  providers: [SettlementsService],
  controllers: [SettlementsController],
})
export class SettlementsModule {}
