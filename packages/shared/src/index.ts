// ─────────────────────────────────────────────────────────────────────────────
// Shared Types — used by both frontend and backend
// ─────────────────────────────────────────────────────────────────────────────

// ── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  guestToken?: string;
  color: string; // hex color for cursor
  avatar?: string;
  createdAt: string;
}

// ── File System ───────────────────────────────────────────────────────────────

export interface FileNode {
  id: string;
  name: string;
  content: string;
  language: SupportedLanguage;
  createdAt: string;
  updatedAt: string;
}

// ── Room ──────────────────────────────────────────────────────────────────────

export interface Room {
  id: string;
  roomCode: string; // e.g. ABCD-1234
  hostId: string;
  language: SupportedLanguage;
  files: FileNode[];
  participants: Participant[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  userId: string;
  username: string;
  color: string;
  joinedAt: string;
  isHost: boolean;
}

// ── Chat ──────────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  color: string;
  content: string;
  type: 'text' | 'system';
  timestamp: string;
}

// ── Version History ───────────────────────────────────────────────────────────

export interface Version {
  id: string;
  roomId: string;
  fileId: string;
  content: string;
  savedAt: string;
  savedBy: string;
  label?: string;
}

// ── Code Execution ────────────────────────────────────────────────────────────

export interface ExecutionRequest {
  roomId: string;
  fileId: string;
  language: SupportedLanguage;
  code: string;
}

export interface ExecutionResult {
  id: string;
  roomId: string;
  language: SupportedLanguage;
  output: string;
  error: string;
  exitCode: number;
  executionTimeMs: number;
  memoryUsageMb: number;
  createdAt: string;
}

// ── OT (Operational Transformation) ──────────────────────────────────────────

export type OTOperationType = 'insert' | 'delete' | 'retain';

export interface OTOperation {
  type: OTOperationType;
  position: number;
  content?: string; // for insert
  length?: number;  // for delete/retain
  userId: string;
  fileId: string;
  revision: number;
  timestamp: number;
}

// ── Presence ──────────────────────────────────────────────────────────────────

export interface CursorPosition {
  userId: string;
  username: string;
  color: string;
  fileId: string;
  line: number;
  column: number;
  selectionStart?: { line: number; column: number };
  selectionEnd?: { line: number; column: number };
}

export interface PresenceState {
  userId: string;
  username: string;
  color: string;
  activeFileId: string;
  isTyping: boolean;
  cursor: CursorPosition | null;
  lastSeen: string;
}

// ── Supported Languages ───────────────────────────────────────────────────────

export type SupportedLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'c'
  | 'cpp'
  | 'go'
  | 'rust';

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  java: 'Java',
  c: 'C',
  cpp: 'C++',
  go: 'Go',
  rust: 'Rust',
};

export const LANGUAGE_EXTENSIONS: Record<SupportedLanguage, string> = {
  javascript: 'js',
  typescript: 'ts',
  python: 'py',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  go: 'go',
  rust: 'rs',
};

// ── Socket Events ─────────────────────────────────────────────────────────────

export const SOCKET_EVENTS = {
  // Client → Server
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  CODE_CHANGE: 'code-change',
  CURSOR_CHANGE: 'cursor-change',
  CHAT_MESSAGE: 'chat-message',
  RUN_CODE: 'run-code',
  RUN_COMMAND: 'run-command',
  TYPING: 'typing',
  LANGUAGE_CHANGE: 'language-change',
  FILE_CREATE: 'file-create',
  FILE_DELETE: 'file-delete',
  FILE_RENAME: 'file-rename',

  // Server → Client
  ROOM_USERS: 'room-users',
  CODE_UPDATE: 'code-update',
  CURSOR_UPDATE: 'cursor-update',
  CHAT_UPDATE: 'chat-update',
  EXECUTION_RESULT: 'execution-result',
  COMMAND_RESULT: 'command-result',
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  TYPING_STATUS: 'typing-status',
  LANGUAGE_UPDATED: 'language-updated',
  FILE_UPDATED: 'file-updated',
  ERROR: 'error',
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

// ── API Response Wrapper ──────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ── API Payloads ──────────────────────────────────────────────────────────────

export interface CreateRoomPayload {
  username: string;
  language?: SupportedLanguage;
}

export interface CreateRoomResponse {
  room: Room;
  user: User;
  token: string;
}

export interface JoinRoomPayload {
  roomCode: string;
  username: string;
}

export interface JoinRoomResponse {
  room: Room;
  user: User;
  token: string;
}
