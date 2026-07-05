import type { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '@collabcode/shared';
import { Message } from '../models/Message';
import { v4 as uuidv4 } from 'uuid';

export function registerChatHandlers(io: Server, socket: Socket): void {
  socket.on(SOCKET_EVENTS.CHAT_MESSAGE, async (payload: { content: string }) => {
    try {
      const user = socket.user;
      if (!user?.roomCode || !user.roomId) return;

      const msg = {
        id: uuidv4(),
        roomId: user.roomId,
        userId: user.userId,
        username: user.username,
        color: user.color,
        content: payload.content.slice(0, 2000),
        type: 'text' as const,
        timestamp: new Date().toISOString(),
      };

      await Message.create(msg);
      io.to(user.roomCode).emit(SOCKET_EVENTS.CHAT_UPDATE, msg);
    } catch (err) {
      console.error('chat-message error:', err);
    }
  });

  socket.on(SOCKET_EVENTS.TYPING, (payload: { isTyping: boolean }) => {
    const user = socket.user;
    if (!user?.roomCode) return;
    socket.to(user.roomCode).emit(SOCKET_EVENTS.TYPING_STATUS, {
      userId: user.userId,
      username: user.username,
      isTyping: payload.isTyping,
    });
  });
}
