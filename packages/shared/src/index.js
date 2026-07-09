// @collabcode/shared — compiled CommonJS export
// This file is the production entry point (no TypeScript compilation needed)

'use strict';

// ── Socket Events ─────────────────────────────────────────────────────────────
const SOCKET_EVENTS = {
  // Client → Server
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  CODE_CHANGE: 'code-change',
  CURSOR_CHANGE: 'cursor-change',
  CHAT_MESSAGE: 'chat-message',
  RUN_CODE: 'run-code',
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
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  TYPING_STATUS: 'typing-status',
  LANGUAGE_UPDATED: 'language-updated',
  FILE_UPDATED: 'file-updated',
  ERROR: 'error',
};

// ── Language constants ────────────────────────────────────────────────────────
const LANGUAGE_LABELS = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  java: 'Java',
  c: 'C',
  cpp: 'C++',
  go: 'Go',
  rust: 'Rust',
};

const LANGUAGE_EXTENSIONS = {
  javascript: 'js',
  typescript: 'ts',
  python: 'py',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  go: 'go',
  rust: 'rs',
};

module.exports = {
  SOCKET_EVENTS,
  LANGUAGE_LABELS,
  LANGUAGE_EXTENSIONS,
};
