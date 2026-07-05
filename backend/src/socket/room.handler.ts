import type { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '@collabcode/shared';
import type { AuthPayload } from '../middlewares/auth.middleware';
import {
  findRoomByCode, addParticipant, removeParticipant,
  assignColor, setOnlineUsers, getOnlineUsers,
} from '../services/room.service';
import { memFindRoom, memAddParticipant, CURSOR_COLORS } from '../services/memory.store';
import { isDBConnected } from '../config/db';
import { Message } from '../models/Message';

declare module 'socket.io' {
  interface Socket {
    user?: AuthPayload & { color: string; roomCode?: string; roomId?: string };
  }
}

export function registerRoomHandlers(io: Server, socket: Socket): void {
  socket.on(
    SOCKET_EVENTS.JOIN_ROOM,
    async (payload: { roomCode: string; username: string; color: string; userId: string }) => {
      try {
        const { roomCode, username, color, userId } = payload;
        const code = roomCode.toUpperCase();

        // ── Find the room (MongoDB or memory fallback) ─────────────────────────
        let roomId: string;
        let resolvedColor = color;

        if (isDBConnected()) {
          const room = await findRoomByCode(code);
          if (room) {
            roomId = room._id.toString();
            resolvedColor = color || assignColor(room.participants.length);
          } else {
            // Try memory store as secondary fallback
            const memRoom = memFindRoom(code);
            if (!memRoom) {
              socket.emit(SOCKET_EVENTS.ERROR, { message: 'Room not found' });
              return;
            }
            roomId = memRoom._id;
          }
        } else {
          // No DB — use memory store
          const memRoom = memFindRoom(code);
          if (!memRoom) {
            socket.emit(SOCKET_EVENTS.ERROR, { message: 'Room not found (memory mode)' });
            return;
          }
          roomId = memRoom._id;
          resolvedColor = color || CURSOR_COLORS[memRoom.participants.length % CURSOR_COLORS.length];
        }

        // ── Attach user context to socket ──────────────────────────────────────
        socket.user = { userId, username, guestToken: '', color: resolvedColor, roomCode: code, roomId };
        await socket.join(code);

        // ── Update online users list ───────────────────────────────────────────
        const onlineUsers = await getOnlineUsers(roomId);
        const updatedUsers = [
          ...((onlineUsers as any[]).filter((u) => u.userId !== userId)),
          { userId, username, color: resolvedColor, socketId: socket.id },
        ];
        await setOnlineUsers(roomId, updatedUsers);

        // ── Broadcast join event ───────────────────────────────────────────────
        const systemMsg = {
          id: `${Date.now()}-${userId}`,
          roomId,
          userId: 'system',
          username: 'System',
          color: '#6B7280',
          content: `${username} joined the room`,
          type: 'system' as const,
          timestamp: new Date().toISOString(),
        };

        // Save to DB if available (non-blocking)
        if (isDBConnected()) {
          Message.create(systemMsg).catch(() => {});
        }

        io.to(code).emit(SOCKET_EVENTS.USER_JOINED, {
          user: { userId, username, color: resolvedColor },
          message: systemMsg,
        });
        io.to(code).emit(SOCKET_EVENTS.ROOM_USERS, updatedUsers);

        // Also send ROOM_USERS directly to the joining socket
        socket.emit(SOCKET_EVENTS.ROOM_USERS, updatedUsers);
      } catch (err) {
        console.error('join-room error:', err);
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to join room' });
      }
    }
  );

  socket.on('disconnect', async () => {
    try {
      const user = socket.user;
      if (!user?.roomCode || !user.roomId) return;

      const onlineUsers = await getOnlineUsers(user.roomId);
      const updatedUsers = (onlineUsers as any[]).filter((u) => u.userId !== user.userId);
      await setOnlineUsers(user.roomId, updatedUsers);

      const systemMsg = {
        id: `${Date.now()}-${user.userId}`,
        roomId: user.roomId,
        userId: 'system',
        username: 'System',
        color: '#6B7280',
        content: `${user.username} left the room`,
        type: 'system' as const,
        timestamp: new Date().toISOString(),
      };

      socket.to(user.roomCode).emit(SOCKET_EVENTS.USER_LEFT, {
        userId: user.userId,
        message: systemMsg,
      });
      socket.to(user.roomCode).emit(SOCKET_EVENTS.ROOM_USERS, updatedUsers);
    } catch (err) {
      console.error('disconnect error:', err);
    }
  });
}
