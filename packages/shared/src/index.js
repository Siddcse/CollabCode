"use strict";
// ─────────────────────────────────────────────────────────────────────────────
// Shared Types — used by both frontend and backend
// ─────────────────────────────────────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOCKET_EVENTS = exports.LANGUAGE_EXTENSIONS = exports.LANGUAGE_LABELS = void 0;
exports.LANGUAGE_LABELS = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python',
    java: 'Java',
    c: 'C',
    cpp: 'C++',
    go: 'Go',
    rust: 'Rust',
};
exports.LANGUAGE_EXTENSIONS = {
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
exports.SOCKET_EVENTS = {
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
};
//# sourceMappingURL=index.js.map