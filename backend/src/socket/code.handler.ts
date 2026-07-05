import type { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '@collabcode/shared';
import type { OTOperation, SupportedLanguage } from '@collabcode/shared';
import { Room } from '../models/Room';
import { memUpdateFileContent } from '../services/memory.store';
import { getRevision, incrementRevision } from '../services/room.service';
import { isDBConnected } from '../config/db';

// ── Pending OT operations per room:file ───────────────────────────────────────
const pendingOps = new Map<string, OTOperation[]>();

// ── Simple string-level OT transform ─────────────────────────────────────────
function transformOp(incoming: OTOperation, existing: OTOperation): OTOperation {
  if (existing.type === 'insert' && incoming.type === 'insert') {
    if (existing.position <= incoming.position) {
      return { ...incoming, position: incoming.position + (existing.content?.length ?? 0) };
    }
  }
  if (existing.type === 'delete' && incoming.type === 'insert') {
    if (existing.position < incoming.position) {
      return { ...incoming, position: incoming.position - (existing.length ?? 0) };
    }
  }
  return incoming;
}

export function registerCodeHandlers(io: Server, socket: Socket): void {
  // ── Code change event ─────────────────────────────────────────────────────
  socket.on(SOCKET_EVENTS.CODE_CHANGE, async (op: OTOperation) => {
    try {
      const user = socket.user;
      if (!user?.roomCode || !user.roomId) return;

      const key = `${user.roomId}:${op.fileId}`;
      const serverRevision = await getRevision(user.roomId, op.fileId);

      // Transform against un-acknowledged ops
      let transformedOp = { ...op };
      const ops = pendingOps.get(key) ?? [];
      if (op.revision < serverRevision) {
        const opsToTransform = ops.slice(op.revision);
        for (const serverOp of opsToTransform) {
          transformedOp = transformOp(transformedOp, serverOp);
        }
      }

      // Persist to DB (non-blocking — full content replace is more reliable than $function)
      if (isDBConnected() && op.type === 'insert' && op.content !== undefined) {
        Room.updateOne(
          { _id: user.roomId, 'files.id': op.fileId },
          { $set: { 'files.$.content': op.content, 'files.$.updatedAt': new Date() } }
        ).catch(() => {});
      }

      // Update memory store content too
      if (op.type === 'insert' && op.content !== undefined) {
        memUpdateFileContent(user.roomCode, op.fileId, op.content);
      }

      // Track revision
      const newRevision = await incrementRevision(user.roomId, op.fileId);
      const broadcastOp = { ...transformedOp, revision: newRevision };

      // Maintain sliding window of pending ops
      if (!pendingOps.has(key)) pendingOps.set(key, []);
      pendingOps.get(key)!.push(broadcastOp);
      const current = pendingOps.get(key)!;
      if (current.length > 200) pendingOps.get(key)!.splice(0, 100);

      // Broadcast to all other clients in the room
      socket.to(user.roomCode).emit(SOCKET_EVENTS.CODE_UPDATE, broadcastOp);
    } catch (err) {
      console.error('code-change error:', err);
    }
  });

  // ── Cursor change event ───────────────────────────────────────────────────
  socket.on(SOCKET_EVENTS.CURSOR_CHANGE, (cursor: unknown) => {
    const user = socket.user;
    if (!user?.roomCode) return;
    socket.to(user.roomCode).emit(SOCKET_EVENTS.CURSOR_UPDATE, {
      ...(cursor as object),
      userId: user.userId,
      username: user.username,
      color: user.color,
    });
  });

  // ── Language change event ─────────────────────────────────────────────────
  socket.on(SOCKET_EVENTS.LANGUAGE_CHANGE, async (payload: { language: SupportedLanguage }) => {
    const user = socket.user;
    if (!user?.roomCode || !user.roomId) return;
    if (isDBConnected()) {
      Room.updateOne({ _id: user.roomId }, { language: payload.language }).catch(() => {});
    }
    io.to(user.roomCode).emit(SOCKET_EVENTS.LANGUAGE_UPDATED, payload);
  });

  // ── File create event ─────────────────────────────────────────────────────
  socket.on(SOCKET_EVENTS.FILE_CREATE, async (file: { id: string; name: string; language: SupportedLanguage }) => {
    const user = socket.user;
    if (!user?.roomCode || !user.roomId) return;
    const newFile = { ...file, content: '', createdAt: new Date(), updatedAt: new Date() };
    if (isDBConnected()) {
      Room.updateOne({ _id: user.roomId }, { $push: { files: newFile } }).catch(() => {});
    }
    io.to(user.roomCode).emit(SOCKET_EVENTS.FILE_UPDATED, { action: 'create', file: newFile });
  });

  // ── File delete event ─────────────────────────────────────────────────────
  socket.on(SOCKET_EVENTS.FILE_DELETE, async (payload: { fileId: string }) => {
    const user = socket.user;
    if (!user?.roomCode || !user.roomId) return;
    if (isDBConnected()) {
      Room.updateOne({ _id: user.roomId }, { $pull: { files: { id: payload.fileId } } }).catch(() => {});
    }
    io.to(user.roomCode).emit(SOCKET_EVENTS.FILE_UPDATED, { action: 'delete', fileId: payload.fileId });
  });
}
