import api from './axios';
import { SplitType } from '../types';

export const getExpenses = (groupId: string) =>
  api.get(`/expenses/group/${groupId}`).then((r) => r.data);

export interface SplitPayload {
  userId: string;
  amount?: number;
  percentage?: number;
}

export const createExpense = (data: {
  groupId: string;
  description: string;
  amount: number;
  paidById: string;
  splitType: SplitType;
  splits: SplitPayload[];
}) => api.post('/expenses', data).then((r) => r.data);

export const deleteExpense = (id: string) =>
  api.delete(`/expenses/${id}`).then((r) => r.data);
