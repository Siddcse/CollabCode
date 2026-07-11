import axios from 'axios';

const LOCAL_HOST_PATTERNS = ['localhost', '127.0.0.1', '[::1]'];
const DEFAULT_BACKEND_URL = 'https://collabcode-backend.onrender.com/api';
const DEFAULT_WS_URL = 'https://collabcode-backend.onrender.com';

const isLocalOrigin = (origin: string) =>
  LOCAL_HOST_PATTERNS.some((host) => origin.includes(host));

const getBackendUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined' && isLocalOrigin(window.location.origin)) {
    return `${window.location.origin}/api`;
  }
  return DEFAULT_BACKEND_URL;
};

export function getWsUrl() {
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
  if (typeof window !== 'undefined' && isLocalOrigin(window.location.origin)) {
    return window.location.origin;
  }
  return DEFAULT_WS_URL;
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
