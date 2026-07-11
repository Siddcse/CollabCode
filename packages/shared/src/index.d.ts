export interface User {
    id: string;
    username: string;
    guestToken?: string;
    color: string;
    avatar?: string;
    createdAt: string;
}
export interface FileNode {
    id: string;
    name: string;
    content: string;
    language: SupportedLanguage;
    createdAt: string;
    updatedAt: string;
}
export interface Room {
    id: string;
    roomCode: string;
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
export interface Version {
    id: string;
    roomId: string;
    fileId: string;
    content: string;
    savedAt: string;
    savedBy: string;
    label?: string;
}
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
export type OTOperationType = 'insert' | 'delete' | 'retain';
export interface OTOperation {
    type: OTOperationType;
    position: number;
    content?: string;
    length?: number;
    userId: string;
    fileId: string;
    revision: number;
    timestamp: number;
}
export interface CursorPosition {
    userId: string;
    username: string;
    color: string;
    fileId: string;
    line: number;
    column: number;
    selectionStart?: {
        line: number;
        column: number;
    };
    selectionEnd?: {
        line: number;
        column: number;
    };
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
export type SupportedLanguage = 'javascript' | 'typescript' | 'python' | 'java' | 'c' | 'cpp' | 'go' | 'rust';
export declare const LANGUAGE_LABELS: Record<SupportedLanguage, string>;
export declare const LANGUAGE_EXTENSIONS: Record<SupportedLanguage, string>;
export declare const SOCKET_EVENTS: {
    readonly JOIN_ROOM: "join-room";
    readonly LEAVE_ROOM: "leave-room";
    readonly CODE_CHANGE: "code-change";
    readonly CURSOR_CHANGE: "cursor-change";
    readonly CHAT_MESSAGE: "chat-message";
    readonly RUN_CODE: "run-code";
    readonly RUN_COMMAND: "run-command";
    readonly TYPING: "typing";
    readonly LANGUAGE_CHANGE: "language-change";
    readonly FILE_CREATE: "file-create";
    readonly FILE_DELETE: "file-delete";
    readonly FILE_RENAME: "file-rename";
    readonly ROOM_USERS: "room-users";
    readonly CODE_UPDATE: "code-update";
    readonly CURSOR_UPDATE: "cursor-update";
    readonly CHAT_UPDATE: "chat-update";
    readonly EXECUTION_RESULT: "execution-result";
    readonly COMMAND_RESULT: "command-result";
    readonly USER_JOINED: "user-joined";
    readonly USER_LEFT: "user-left";
    readonly TYPING_STATUS: "typing-status";
    readonly LANGUAGE_UPDATED: "language-updated";
    readonly FILE_UPDATED: "file-updated";
    readonly ERROR: "error";
};
export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
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
//# sourceMappingURL=index.d.ts.map