import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then(r => r.data),
  register: (email: string, password: string, nom: string) =>
    api.post('/auth/register', { email, password, nom }).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
};

export const clientApi = {
  list: () => api.get('/clients').then(r => r.data),
  get: (id: string) => api.get(`/clients/${id}`).then(r => r.data),
  create: (data: any) => api.post('/clients', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/clients/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/clients/${id}`).then(r => r.data),
};

export const invoiceApi = {
  list: () => api.get('/invoices').then(r => r.data),
  get: (id: string) => api.get(`/invoices/${id}`).then(r => r.data),
  create: (data: any) => api.post('/invoices', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/invoices/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/invoices/${id}`).then(r => r.data),
  changeStatus: (id: string, statut: string) =>
    api.patch(`/invoices/${id}/status`, { statut }).then(r => r.data),
  pending: () => api.get('/invoices/admin/pending').then(r => r.data),
  audit: (id: string) => api.get(`/invoices/${id}/audit`).then(r => r.data),
};

export const articleApi = {
  list: () => api.get('/articles').then(r => r.data),
  create: (data: any) => api.post('/articles', data).then(r => r.data),
  update: (id: number, data: any) => api.put(`/articles/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/articles/${id}`).then(r => r.data),
};

export const categoryApi = {
  list: () => api.get('/categories').then(r => r.data),
  create: (data: any) => api.post('/categories', data).then(r => r.data),
  update: (id: number, data: any) => api.put(`/categories/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/categories/${id}`).then(r => r.data),
};

export const quoteApi = {
  list: () => api.get('/quotes').then(r => r.data),
  get: (id: string) => api.get(`/quotes/${id}`).then(r => r.data),
  create: (data: any) => api.post('/quotes', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/quotes/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/quotes/${id}`).then(r => r.data),
};

export const signatureApi = {
  getKeys: (clientId: string) => api.get(`/signatures/keys?clientId=${clientId}`).then(r => r.data),
  sign: (invoice_id: string, privateKey: string) =>
    api.post('/signatures/sign', { invoice_id, privateKey }).then(r => r.data),
  verify: (invoice_id: string) =>
    api.post('/signatures/verify', { invoice_id }).then(r => r.data),
};
