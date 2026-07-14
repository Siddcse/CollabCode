'use client';

import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

const LOCAL = ['localhost', '127.0.0.1', '[::1]'];
const RAILWAY_URL = 'https://web-production-8d98a.up.railway.app';

const getSocketUrl = () => {
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
  if (typeof window !== 'undefined' && LOCAL.some((h) => window.location.origin.includes(h))) {
    return 'http://localhost:4000';
  }
  return RAILWAY_URL;
};

export function getSocket(): Socket {
  if (!socket) {
    socket = io(getSocketUrl(), {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}
