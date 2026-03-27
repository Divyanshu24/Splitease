import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense, SplitType } from './entities/expense.entity';
import { ExpenseSplit } from './entities/expense-split.entity';
import { GroupsService } from '../groups/groups.service';
import { CreateExpenseDto, SplitTypeDto } from './dto/create-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expensesRepository: Repository<Expense>,
    @InjectRepository(ExpenseSplit)
    private splitsRepository: Repository<ExpenseSplit>,
    private groupsService: GroupsService,
  ) {}

  async create(dto: CreateExpenseDto, userId: string) {
    const isMember = await this.groupsService.isMember(dto.groupId, userId);
    if (!isMember) throw new ForbiddenException('Not a member of this group');

    const totalAmount = Number(dto.amount);
    const resolved = this.resolveSplits(dto, totalAmount);

    const expense = this.expensesRepository.create({
      description: dto.description,
      amount: totalAmount,
      splitType: dto.splitType as unknown as SplitType,
      groupId: dto.groupId,
      paidById: dto.paidById,
      createdById: userId,
    });
    const savedExpense = await this.expensesRepository.save(expense);

    const splitEntities = resolved.map((s) =>
      this.splitsRepository.create({
        expenseId: savedExpense.id,
        userId: s.userId,
        amount: s.amount,
        percentage: s.percentage,
      }),
    );
    await this.splitsRepository.save(splitEntities);

    return this.findById(savedExpense.id);
  }

  private resolveSplits(dto: CreateExpenseDto, totalAmount: number) {
    if (dto.splitType === SplitTypeDto.EQUAL) {
      const perPerson = Math.floor((totalAmount / dto.splits.length) * 100) / 100;
      const splits = dto.splits.map((s, i) => ({ userId: s.userId, amount: perPerson, percentage: null }));
      // Assign remainder to first person
      const allocated = perPerson * dto.splits.length;
      splits[0].amount = Math.round((splits[0].amount + totalAmount - allocated) * 100) / 100;
      return splits;
    }

    if (dto.splitType === SplitTypeDto.PERCENTAGE) {
      const totalPct = dto.splits.reduce((sum, s) => sum + (s.percentage || 0), 0);
      if (Math.abs(totalPct - 100) > 0.01) {
        throw new BadRequestException('Percentages must sum to 100');
      }
      return dto.splits.map((s) => ({
        userId: s.userId,
        amount: Math.round(totalAmount * (s.percentage || 0)) / 100,
        percentage: s.percentage,
      }));
    }

    // EXACT
    const splitTotal = dto.splits.reduce((sum, s) => sum + (s.amount || 0), 0);
    if (Math.abs(splitTotal - totalAmount) > 0.01) {
      throw new BadRequestException('Split amounts must sum to the total expense amount');
    }
    return dto.splits.map((s) => ({ userId: s.userId, amount: s.amount || 0, percentage: null }));
  }

  async findByGroup(groupId: string, userId: string) {
    const isMember = await this.groupsService.isMember(groupId, userId);
    if (!isMember) throw new ForbiddenException('Not a member of this group');

    const expenses = await this.expensesRepository.find({
      where: { groupId },
      relations: ['paidBy', 'splits', 'splits.user'],
      order: { createdAt: 'DESC' },
    });
    return expenses.map((e) => this.formatExpense(e));
  }

  async findById(id: string) {
    const expense = await this.expensesRepository.findOne({
      where: { id },
      relations: ['paidBy', 'createdBy', 'splits', 'splits.user'],
    });
    if (!expense) throw new NotFoundException('Expense not found');
    return this.formatExpense(expense);
  }

  async delete(id: string, userId: string) {
    const expense = await this.expensesRepository.findOne({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');
    const isMember = await this.groupsService.isMember(expense.groupId, userId);
    if (!isMember) throw new ForbiddenException('Not authorized');
    await this.expensesRepository.remove(expense);
    return { message: 'Expense deleted' };
  }

  /** Raw expense+splits used by settlements service */
  async findByGroupRaw(groupId: string) {
    return this.expensesRepository.find({ where: { groupId }, relations: ['splits'] });
  }

  private formatExpense(expense: Expense) {
    return {
      id: expense.id,
      description: expense.description,
      amount: Number(expense.amount),
      splitType: expense.splitType,
      groupId: expense.groupId,
      paidBy: expense.paidBy
        ? { id: expense.paidBy.id, name: expense.paidBy.name, email: expense.paidBy.email }
        : null,
      createdAt: expense.createdAt,
      splits: (expense.splits || []).map((s) => ({
        id: s.id,
        userId: s.userId,
        userName: s.user ? s.user.name : null,
        amount: Number(s.amount),
        percentage: s.percentage != null ? Number(s.percentage) : null,
      })),
    };
  }
}
