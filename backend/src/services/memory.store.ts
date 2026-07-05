/**
 * In-memory store — used as fallback when MongoDB is unavailable.
 * Data is NOT persisted across restarts.
 */
import { v4 as uuidv4 } from 'uuid';
import type { SupportedLanguage } from '@collabcode/shared';

interface MemFile {
  id: string;
  name: string;
  content: string;
  language: SupportedLanguage;
  createdAt: Date;
  updatedAt: Date;
}

interface MemParticipant {
  userId: string;
  username: string;
  color: string;
  joinedAt: Date;
  isHost: boolean;
}

export interface MemRoom {
  _id: string;
  roomCode: string;
  hostId: string;
  language: SupportedLanguage;
  files: MemFile[];
  participants: MemParticipant[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const rooms = new Map<string, MemRoom>(); // key = roomCode

const LANG_EXT: Record<SupportedLanguage, string> = {
  javascript: 'js', typescript: 'ts', python: 'py',
  java: 'java', c: 'c', cpp: 'cpp', go: 'go', rust: 'rs',
};

const LANG_CONTENT: Record<SupportedLanguage, string> = {
  javascript: `// Welcome to CollabCode!\nconsole.log('Hello, World!');`,
  typescript: `// Welcome to CollabCode!\nconst greeting: string = 'Hello, World!';\nconsole.log(greeting);`,
  python: `# Welcome to CollabCode!\nprint('Hello, World!')`,
  java: `// Welcome to CollabCode!\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
  c: `// Welcome to CollabCode!\n#include <stdio.h>\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
  cpp: `// Welcome to CollabCode!\n#include <iostream>\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}`,
  go: `// Welcome to CollabCode!\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}`,
  rust: `// Welcome to CollabCode!\nfn main() {\n    println!("Hello, World!");\n}`,
};

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${part(4)}-${part(4)}`;
}

export const CURSOR_COLORS = [
  '#7C3AED', '#2563EB', '#DC2626', '#D97706', '#059669',
  '#DB2777', '#0891B2', '#65A30D', '#EA580C', '#7C3AED',
];

export function memCreateRoom(
  hostId: string,
  username: string,
  language: SupportedLanguage = 'javascript'
): MemRoom {
  let roomCode: string;
  do { roomCode = generateRoomCode(); } while (rooms.has(roomCode));

  const room: MemRoom = {
    _id: uuidv4(),
    roomCode,
    hostId,
    language,
    files: [{
      id: uuidv4(),
      name: `main.${LANG_EXT[language]}`,
      content: LANG_CONTENT[language],
      language,
      createdAt: new Date(),
      updatedAt: new Date(),
    }],
    participants: [{
      userId: hostId,
      username,
      color: CURSOR_COLORS[0],
      joinedAt: new Date(),
      isHost: true,
    }],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  rooms.set(roomCode, room);
  return room;
}

export function memFindRoom(roomCode: string): MemRoom | undefined {
  return rooms.get(roomCode.toUpperCase());
}

export function memAddParticipant(
  roomCode: string,
  userId: string,
  username: string,
  color: string
): MemRoom | undefined {
  const room = rooms.get(roomCode.toUpperCase());
  if (!room) return undefined;
  // remove if already in room
  room.participants = room.participants.filter((p) => p.userId !== userId);
  room.participants.push({ userId, username, color, joinedAt: new Date(), isHost: false });
  return room;
}

export function memUpdateFileContent(roomCode: string, fileId: string, content: string): void {
  const room = rooms.get(roomCode.toUpperCase());
  if (!room) return;
  const file = room.files.find((f) => f.id === fileId);
  if (file) { file.content = content; file.updatedAt = new Date(); }
}

export function memGetAllRooms(): MemRoom[] {
  return Array.from(rooms.values());
}
