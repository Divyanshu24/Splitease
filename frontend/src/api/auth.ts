import api from './axios';

export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password }).then((r) => r.data);

export const register = (name: string, email: string, password: string) =>
  api.post('/auth/register', { name, email, password }).then((r) => r.data);

export const getMe = () => api.get('/users/me').then((r) => r.data);

export const searchUsers = (email: string) =>
  api.get('/users/search', { params: { email } }).then((r) => r.data);
