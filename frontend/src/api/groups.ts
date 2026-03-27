import api from './axios';

export const getGroups = () => api.get('/groups').then((r) => r.data);

export const getGroup = (id: string) => api.get(`/groups/${id}`).then((r) => r.data);

export const createGroup = (name: string, description?: string) =>
  api.post('/groups', { name, description }).then((r) => r.data);

export const addMember = (groupId: string, email: string) =>
  api.post(`/groups/${groupId}/members`, { email }).then((r) => r.data);
