import type { Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/User';
import { Room } from '../models/Room';
import { createRoom, findRoomByCode, addParticipant, assignColor } from '../services/room.service';
import {
  memCreateRoom, memFindRoom, memAddParticipant, CURSOR_COLORS,
} from '../services/memory.store';
import { signToken } from '../middlewares/auth.middleware';
import { isDBConnected } from '../config/db';
import type { SupportedLanguage } from '@collabcode/shared';

const createRoomSchema = z.object({
  username: z.string().min(2).max(32).trim(),
  language: z
    .enum(['javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'go', 'rust'])
    .optional(),
});

const joinRoomSchema = z.object({
  roomCode: z.string().min(9).max(9),
  username: z.string().min(2).max(32).trim(),
});

// ─── Create Room ─────────────────────────────────────────────────────────────

export async function handleCreateRoom(req: Request, res: Response): Promise<void> {
  const parsed = createRoomSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.flatten().fieldErrors });
    return;
  }

  const { username, language = 'javascript' } = parsed.data;
  const userId = uuidv4();
  const guestToken = uuidv4();
  const token = signToken({ userId, username, guestToken });

  // ── MongoDB available ──
  if (isDBConnected()) {
    try {
      const user = await User.create({ username, guestToken, color: CURSOR_COLORS[0] });
      const room = await createRoom(userId, username, language as SupportedLanguage);
      res.status(201).json({
        success: true,
        data: {
          room: {
            id: room._id.toString(),
            roomCode: room.roomCode,
            language: room.language,
            files: room.files,
          },
          user: { id: userId, username, color: user.color },
          token,
        },
      });
      return;
    } catch (err: any) {
      console.warn('MongoDB createRoom failed, falling back to memory store:', err.message);
    }
  }

  // ── Memory fallback ──
  const room = memCreateRoom(userId, username, language as SupportedLanguage);
  res.status(201).json({
    success: true,
    data: {
      room: {
        id: room._id,
        roomCode: room.roomCode,
        language: room.language,
        files: room.files,
      },
      user: { id: userId, username, color: CURSOR_COLORS[0] },
      token,
    },
  });
}

// ─── Join Room ────────────────────────────────────────────────────────────────

export async function handleJoinRoom(req: Request, res: Response): Promise<void> {
  const parsed = joinRoomSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.flatten().fieldErrors });
    return;
  }

  const { roomCode, username } = parsed.data;
  const code = roomCode.toUpperCase();
  const userId = uuidv4();
  const guestToken = uuidv4();
  const token = signToken({ userId, username, guestToken });

  // ── MongoDB available ──
  if (isDBConnected()) {
    try {
      const room = await findRoomByCode(code);
      if (!room) {
        res.status(404).json({ success: false, error: 'Room not found or no longer active' });
        return;
      }
      const usernameTaken = room.participants.some(
        (p) => p.username.toLowerCase() === username.toLowerCase()
      );
      if (usernameTaken) {
        res.status(409).json({ success: false, error: 'Username already taken in this room' });
        return;
      }
      const color = assignColor(room.participants.length);
      await User.create({ username, guestToken, color });
      await addParticipant(room._id.toString(), userId, username, color);

      res.status(200).json({
        success: true,
        data: {
          room: {
            id: room._id.toString(),
            roomCode: room.roomCode,
            language: room.language,
            files: room.files,
          },
          user: { id: userId, username, color },
          token,
        },
      });
      return;
    } catch (err: any) {
      console.warn('MongoDB joinRoom failed, falling back to memory store:', err.message);
    }
  }

  // ── Memory fallback ──
  const memRoom = memFindRoom(code);
  if (!memRoom) {
    res.status(404).json({ success: false, error: 'Room not found (memory mode)' });
    return;
  }
  const usernameTaken = memRoom.participants.some(
    (p) => p.username.toLowerCase() === username.toLowerCase()
  );
  if (usernameTaken) {
    res.status(409).json({ success: false, error: 'Username already taken in this room' });
    return;
  }
  const color = CURSOR_COLORS[memRoom.participants.length % CURSOR_COLORS.length];
  memAddParticipant(code, userId, username, color);

  res.status(200).json({
    success: true,
    data: {
      room: {
        id: memRoom._id,
        roomCode: memRoom.roomCode,
        language: memRoom.language,
        files: memRoom.files,
      },
      user: { id: userId, username, color },
      token,
    },
  });
}

// ─── Get Room ─────────────────────────────────────────────────────────────────

export async function handleGetRoom(req: Request, res: Response): Promise<void> {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ success: false, error: 'Missing room id' });
    return;
  }
  const code = Array.isArray(id) ? id[0].toUpperCase() : id.toUpperCase();

  if (isDBConnected()) {
    try {
      const room = await Room.findOne({ roomCode: code, isActive: true });
      if (room) {
        res.json({ success: true, data: room });
        return;
      }
    } catch {}
  }

  // Memory fallback
  const memRoom = memFindRoom(code);
  if (!memRoom) {
    res.status(404).json({ success: false, error: 'Room not found' });
    return;
  }
  res.json({ success: true, data: memRoom });
}
