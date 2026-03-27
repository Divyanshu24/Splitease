import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupsService } from '../groups/groups.service';
import { ExpensesService } from '../expenses/expenses.service';
import { SettlementRecord } from './entities/settlement-record.entity';

export interface UserBalance {
  userId: string;
  userName: string;
  userEmail: string;
  amount: number; // positive = is owed, negative = owes
}

export interface Transaction {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
}

@Injectable()
export class SettlementsService {
  constructor(
    private groupsService: GroupsService,
    private expensesService: ExpensesService,
    @InjectRepository(SettlementRecord)
    private settlementRepository: Repository<SettlementRecord>,
  ) {}

  async getGroupSettlements(groupId: string, userId: string) {
    const isMember = await this.groupsService.isMember(groupId, userId);
    if (!isMember) throw new ForbiddenException('Not a member of this group');

    const members = await this.groupsService.getMembers(groupId);
    const expenses = await this.expensesService.findByGroupRaw(groupId);

    // net[userId] = total paid for others - total owed by self
    const net = new Map<string, number>(members.map((m) => [m.id, 0]));

    for (const expense of expenses) {
      for (const split of expense.splits) {
        const splitAmt = Number(split.amount);
        // User who is split owes this amount → decrease their balance
        net.set(split.userId, (net.get(split.userId) ?? 0) - splitAmt);
        // Payer is owed this amount → increase their balance
        net.set(expense.paidById, (net.get(expense.paidById) ?? 0) + splitAmt);
      }
    }

    // Subtract settled amounts
    const settlements = await this.settlementRepository.find({ where: { groupId } });
    for (const s of settlements) {
      // The payer (fromUserId) paid to toUserId, so reduce their debt
      net.set(s.fromUserId, (net.get(s.fromUserId) ?? 0) + Number(s.amount));
      net.set(s.toUserId, (net.get(s.toUserId) ?? 0) - Number(s.amount));
    }

    const memberMap = new Map(members.map((m) => [m.id, m]));

    const balances: UserBalance[] = members.map((m) => ({
      userId: m.id,
      userName: m.name,
      userEmail: m.email,
      amount: Math.round((net.get(m.id) ?? 0) * 100) / 100,
    }));

    const transactions = this.minimizeTransactions(balances);

    return { balances, transactions };
  }

  async recordSettlement(
    groupId: string,
    fromUserId: string,
    toUserId: string,
    amount: number,
    userId: string,
  ) {
    // Check if requester is a member of the group
    const isMember = await this.groupsService.isMember(groupId, userId);
    if (!isMember) throw new ForbiddenException('Not a member of this group');

    // Check if both fromUser and toUser are members
    const fromMember = await this.groupsService.isMember(groupId, fromUserId);
    const toMember = await this.groupsService.isMember(groupId, toUserId);
    if (!fromMember || !toMember) {
      throw new ForbiddenException('One or both users are not members of this group');
    }

    // Only the person paying can record the settlement
    if (userId !== fromUserId) {
      throw new ForbiddenException('Only the payer can record this settlement');
    }

    if (amount <= 0) {
      throw new BadRequestException('Settlement amount must be positive');
    }

    // Record the settlement
    const settlement = this.settlementRepository.create({
      groupId,
      fromUserId,
      toUserId,
      amount: Math.round(amount * 100) / 100,
    });

    await this.settlementRepository.save(settlement);
    return settlement;
  }

  async getGroupSettlementHistory(groupId: string, userId: string) {
    // Check if requester is a member of the group
    const isMember = await this.groupsService.isMember(groupId, userId);
    if (!isMember) throw new ForbiddenException('Not a member of this group');

    return this.settlementRepository.find({
      where: { groupId },
      relations: ['fromUser', 'toUser'],
      order: { settledAt: 'DESC' },
    });
  }

  /**
   * Greedy debt-minimization algorithm.
   * Repeatedly matches the largest debtor with the largest creditor,
   * producing the fewest possible transactions.
   */
  private minimizeTransactions(balances: UserBalance[]): Transaction[] {
    const transactions: Transaction[] = [];

    // Work on mutable copies
    const debtors = balances
      .filter((b) => b.amount < -0.01)
      .map((b) => ({ ...b, amount: -b.amount })) // make positive for easier math
      .sort((a, b) => b.amount - a.amount);

    const creditors = balances
      .filter((b) => b.amount > 0.01)
      .sort((a, b) => b.amount - a.amount);

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.round(Math.min(debtor.amount, creditor.amount) * 100) / 100;

      if (amount > 0.01) {
        transactions.push({
          fromUserId: debtor.userId,
          fromUserName: debtor.userName,
          toUserId: creditor.userId,
          toUserName: creditor.userName,
          amount,
        });
      }

      debtor.amount = Math.round((debtor.amount - amount) * 100) / 100;
      creditor.amount = Math.round((creditor.amount - amount) * 100) / 100;

      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return transactions;
  }
}
