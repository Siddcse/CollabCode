import type { Server } from 'socket.io';
import { registerRoomHandlers } from './room.handler';
import { registerCodeHandlers } from './code.handler';
import { registerChatHandlers } from './chat.handler';
import { registerExecutionHandlers } from './execution.handler';

export function initializeSocket(io: Server): void {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    registerRoomHandlers(io, socket);
    registerCodeHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerExecutionHandlers(io, socket);

    socket.on('error', (err) => {
      console.error(`Socket error [${socket.id}]:`, err.message);
    });
  });
}
