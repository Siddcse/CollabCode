import axios from 'axios';

const LOCAL = ['localhost', '127.0.0.1', '[::1]'];
const RAILWAY_URL = 'https://web-production-8d98a.up.railway.app';

const isLocal = () =>
  typeof window !== 'undefined' && LOCAL.some((h) => window.location.origin.includes(h));

const getBackendUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (isLocal()) return 'http://localhost:4000/api';
  return `${RAILWAY_URL}/api`;
};

export function getWsUrl() {
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
  if (isLocal()) return 'http://localhost:4000';
  return RAILWAY_URL;
}

const api = axios.create({
  baseURL: getBackendUrl(),
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('collabcode_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.error ?? err.message ?? 'Request failed';
    return Promise.reject(new Error(msg));
  }
);

export default api;

export const roomApi = {
  create: (body: { username: string; language?: string }) =>
    api.post('/room/create', body).then((r) => r.data.data),
  join: (body: { roomCode: string; username: string }) =>
    api.post('/room/join', body).then((r) => r.data.data),
  get: (id: string) => api.get(`/room/${id}`).then((r) => r.data.data),
};

export const codeApi = {
  run: (body: { roomId: string; language: string; code: string }) =>
    api.post('/code/run', body).then((r) => r.data.data),
};

export const historyApi = {
  getByRoom: (roomId: string) => api.get(`/history/${roomId}`).then((r) => r.data.data),
  save: (body: { roomId: string; fileId: string; content: string; savedBy: string; label?: string }) =>
    api.post('/history/save', body).then((r) => r.data.data),
};
