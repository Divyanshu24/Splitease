export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdById: string;
  createdBy?: User;
  createdAt: string;
  members?: Member[];
}

export interface Member {
  id: string;
  name: string;
  email: string;
  joinedAt?: string;
}

export type SplitType = 'equal' | 'percentage' | 'exact';

export interface SplitItem {
  id?: string;
  userId: string;
  userName?: string;
  amount: number;
  percentage?: number | null;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  splitType: SplitType;
  groupId: string;
  paidBy: User;
  createdAt: string;
  splits: SplitItem[];
}

export interface Balance {
  userId: string;
  userName: string;
  userEmail: string;
  amount: number; // positive = is owed money, negative = owes money
}

export interface Transaction {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
}

export interface SettlementRecord {
  id: string;
  groupId: string;
  fromUserId: string;
  fromUser: User;
  toUserId: string;
  toUser: User;
  amount: number;
  settledAt: string;
}

export interface SettlementData {
  balances: Balance[];
  transactions: Transaction[];
}
