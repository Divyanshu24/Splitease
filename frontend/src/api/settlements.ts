import api from './axios';

export const getSettlements = (groupId: string) =>
  api.get(`/settlements/group/${groupId}`).then((r) => r.data);

export const recordSettlement = (groupId: string, fromUserId: string, toUserId: string, amount: number) =>
  api.post(`/settlements/group/${groupId}/settle`, {
    fromUserId,
    toUserId,
    amount,
  }).then((r) => r.data);

export const getSettlementHistory = (groupId: string) =>
  api.get(`/settlements/group/${groupId}/history`).then((r) => r.data);
