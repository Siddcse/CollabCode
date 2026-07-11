'use client';

import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

const LOCAL_HOST_PATTERNS = ['localhost', '127.0.0.1', '[::1]'];
const DEFAULT_WS_URL = 'https://collabcode-backend.onrender.com';

const isLocalOrigin = (origin: string) =>
  LOCAL_HOST_PATTERNS.some((host) => origin.includes(host));

const getSocketUrl = () => {
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
  if (typeof window !== 'undefined' && isLocalOrigin(window.location.origin)) {
    return window.location.origin;
  }
  return DEFAULT_WS_URL;
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
