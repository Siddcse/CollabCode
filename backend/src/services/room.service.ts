import { Room } from '../models/Room';
import { redisGet, redisSetex, redisIncr } from '../config/redis';
import { getRedis } from '../config/redis';
import type { SupportedLanguage } from '@collabcode/shared';
import { v4 as uuidv4 } from 'uuid';

// ── Prefixes ──────────────────────────────────────────────────────────────────
const CURSOR_POSITIONS_PREFIX = 'cursors:';
const ROOM_USERS_PREFIX       = 'room:users:';
const OT_REVISION_PREFIX      = 'ot:revision:';

// ── In-memory fallbacks (used when Redis is unavailable) ──────────────────────
const memoryOnlineUsers  = new Map<string, unknown[]>();
const memoryCursors      = new Map<string, Record<string, unknown>>();
const memoryRevisions    = new Map<string, number>();

// ── Room code generator ───────────────────────────────────────────────────────
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${part1}-${part2}`;
}

export const CURSOR_COLORS = [
  '#7C3AED', '#2563EB', '#DC2626', '#D97706', '#059669',
  '#DB2777', '#0891B2', '#65A30D', '#EA580C', '#8B5CF6',
];

export function assignColor(index: number): string {
  return CURSOR_COLORS[index % CURSOR_COLORS.length];
}

// ── Room CRUD ─────────────────────────────────────────────────────────────────
export async function createRoom(
  hostId: string,
  username: string,
  language: SupportedLanguage = 'javascript'
) {
  let roomCode!: string;
  let attempts = 0;
  do {
    roomCode = generateRoomCode();
    attempts++;
    if (attempts > 10) throw new Error('Failed to generate unique room code');
  } while (await Room.exists({ roomCode }).catch(() => false));

  const defaultFile = {
    id: uuidv4(),
    name: `main.${getExtension(language)}`,
    content: getDefaultContent(language),
    language,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const room = await Room.create({
    roomCode,
    hostId,
    language,
    files: [defaultFile],
    participants: [{
      userId: hostId,
      username,
      color: assignColor(0),
      isHost: true,
    }],
  });

  return room;
}

export async function findRoomByCode(roomCode: string) {
  try {
    return await Room.findOne({ roomCode: roomCode.toUpperCase(), isActive: true });
  } catch {
    return null;
  }
}

export async function addParticipant(roomId: string, userId: string, username: string, color: string) {
  try {
    return await Room.findByIdAndUpdate(
      roomId,
      { $push: { participants: { userId, username, color, joinedAt: new Date(), isHost: false } } },
      { new: true }
    );
  } catch {
    return null;
  }
}

export async function removeParticipant(roomId: string, userId: string) {
  try {
    return await Room.findByIdAndUpdate(
      roomId,
      { $pull: { participants: { userId } } },
      { new: true }
    );
  } catch {
    return null;
  }
}

// ── OT Revision (Redis-first, memory fallback) ────────────────────────────────
export async function getRevision(roomId: string, fileId: string): Promise<number> {
  const key = `${OT_REVISION_PREFIX}${roomId}:${fileId}`;
  const val = await redisGet(key);
  if (val !== null) return parseInt(val, 10);
  return memoryRevisions.get(key) ?? 0;
}

export async function incrementRevision(roomId: string, fileId: string): Promise<number> {
  const key = `${OT_REVISION_PREFIX}${roomId}:${fileId}`;

  // Try Redis first
  const result = await redisIncr(key);
  if (result > 0) return result;

  // Memory fallback
  const current = memoryRevisions.get(key) ?? 0;
  const next = current + 1;
  memoryRevisions.set(key, next);
  return next;
}

// ── Online Users (Redis-first, memory fallback) ───────────────────────────────
export async function setOnlineUsers(roomId: string, users: unknown[]): Promise<void> {
  const key = `${ROOM_USERS_PREFIX}${roomId}`;
  await redisSetex(key, 3600, JSON.stringify(users));
  // Always update memory too (acts as L1 cache)
  memoryOnlineUsers.set(roomId, users);
}

export async function getOnlineUsers(roomId: string): Promise<unknown[]> {
  // Try Redis first
  const key = `${ROOM_USERS_PREFIX}${roomId}`;
  const data = await redisGet(key);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      memoryOnlineUsers.set(roomId, parsed); // sync memory
      return parsed;
    } catch {
      // fall through
    }
  }
  // Memory fallback
  return memoryOnlineUsers.get(roomId) ?? [];
}

// ── Cursor Positions (Redis-first, memory fallback) ───────────────────────────
export async function setCursorPosition(roomId: string, userId: string, cursor: unknown): Promise<void> {
  const redis = getRedis();
  if (redis) {
    try {
      await redis.hset(`${CURSOR_POSITIONS_PREFIX}${roomId}`, userId, JSON.stringify(cursor));
      await redis.expire(`${CURSOR_POSITIONS_PREFIX}${roomId}`, 3600);
    } catch { /* ignore */ }
  }
  // Memory fallback
  const map = memoryCursors.get(roomId) ?? {};
  map[userId] = cursor;
  memoryCursors.set(roomId, map);
}

export async function getAllCursors(roomId: string): Promise<Record<string, unknown>> {
  const redis = getRedis();
  if (redis) {
    try {
      const data = await redis.hgetall(`${CURSOR_POSITIONS_PREFIX}${roomId}`);
      if (data && Object.keys(data).length > 0) {
        const result: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(data)) {
          try { result[key] = JSON.parse(val); } catch { result[key] = val; }
        }
        return result;
      }
    } catch { /* fall through */ }
  }
  return memoryCursors.get(roomId) ?? {};
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getExtension(lang: SupportedLanguage): string {
  const map: Record<SupportedLanguage, string> = {
    javascript: 'js', typescript: 'ts', python: 'py',
    java: 'java', c: 'c', cpp: 'cpp', go: 'go', rust: 'rs',
  };
  return map[lang];
}

function getDefaultContent(lang: SupportedLanguage): string {
  const contents: Record<SupportedLanguage, string> = {
    javascript: `// Welcome to CollabCode!\nconsole.log('Hello, World!');`,
    typescript: `// Welcome to CollabCode!\nconst greeting: string = 'Hello, World!';\nconsole.log(greeting);`,
    python:     `# Welcome to CollabCode!\nprint('Hello, World!')`,
    java:       `// Welcome to CollabCode!\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
    c:          `// Welcome to CollabCode!\n#include <stdio.h>\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
    cpp:        `// Welcome to CollabCode!\n#include <iostream>\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}`,
    go:         `// Welcome to CollabCode!\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}`,
    rust:       `// Welcome to CollabCode!\nfn main() {\n    println!("Hello, World!");\n}`,
  };
  return contents[lang];
}
