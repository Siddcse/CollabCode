'use client';
import { useEffect, useRef, use, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  Files, Users, MessageSquare, History, Settings, Play, Share2,
  UserPlus, Sun, Moon, Copy, Check, ChevronDown, Loader2,
  Plus, X, Terminal, AlertCircle, CheckCircle2, Clock, Cpu,
  Trash2, Send, Smile, Wifi, WifiOff, FilePlus, FolderPlus,
  ChevronRight, ChevronLeft, MoreHorizontal, LogOut, Code2,
  Search, GitBranch, PanelLeft, PanelBottom, PanelRight,
  Command, Maximize2, Minimize2, LayoutGrid, Zap, ArrowUp,
  ChevronUp, AlignLeft, Coffee, Hash, Layers,
  RotateCcw, RotateCw, Edit2, FileText, Square, Keyboard
} from 'lucide-react';
import Link from 'next/link';
import { useRoomStore } from '@/store/roomStore';
import { useEditorStore } from '@/store/editorStore';
import { useChatStore } from '@/store/chatStore';
import { useExecutionStore } from '@/store/executionStore';
import { connectSocket, getSocket, disconnectSocket } from '@/services/socket';
import { roomApi } from '@/services/api';
import { SOCKET_EVENTS, LANGUAGE_LABELS } from '@collabcode/shared';
import type { SupportedLanguage } from '@collabcode/shared';
import { v4 as uuidv4 } from 'uuid';

// ── Monaco (no SSR) ───────────────────────────────────────────────────────────
const MonacoEditor = dynamic(() => import('@/components/editor/MonacoEditor'), {
  ssr: false,
  loading: () => (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: VS.editorBg }}>
      <div style={{ textAlign: 'center' }}>
        <Loader2 style={{ width: 28, height: 28, color: VS.accent, margin: '0 auto 10px', animation: 'vsc-spin 1s linear infinite' }} />
        <p style={{ color: VS.textMuted, fontSize: 13, margin: 0 }}>Loading editor…</p>
      </div>
    </div>
  ),
});

// ── FileExplorer (VS Code-like) ───────────────────────────────────────────────
import FileExplorer from '@/components/editor/FileExplorer';

// ── VS Code Design System ─────────────────────────────────────────────────────
const VS = {
  // Core backgrounds
  editorBg:     '#1E1E1E',
  sidebarBg:    '#252526',
  activityBg:   '#333333',
  titleBg:      '#3C3C3C',
  panelBg:      '#1E1E1E',
  tabActiveBg:  '#1E1E1E',
  tabInactiveBg:'#2D2D2D',
  inputBg:      '#3C3C3C',
  menuBg:       '#252526',
  statusBg:     '#007ACC',
  // Borders
  border:       '#3C3C3C',
  borderLight:  'rgba(255,255,255,0.06)',
  // Text
  textPrimary:  '#CCCCCC',
  textSecondary:'#ABABAB',
  textMuted:    '#858585',
  textActive:   '#FFFFFF',
  // Accent
  accent:       '#007ACC',
  accentHover:  '#1B8BD4',
  accentBg:     'rgba(0,122,204,0.15)',
  // Semantic
  green:        '#4EC9B0',
  greenBright:  '#23D18B',
  red:          '#F48771',
  yellow:       '#CCA700',
  // Hover
  hover:        '#2A2D2E',
  hoverStrong:  '#094771',
  selected:     '#37373D',
  // Special
  actIconActive: '#CCCCCC',
  actIconIdle:   '#858585',
};

// ── Constants ─────────────────────────────────────────────────────────────────
const LANGUAGES: SupportedLanguage[] = ['javascript','typescript','python','java','c','cpp','go','rust'];
const EMOJIS = ['👍','❤️','🔥','🎉','😂','🤔','👀','✅'];

// Default starter code shown when user switches language
const DEFAULT_CODE: Record<SupportedLanguage, string> = {
  javascript: `// Welcome to CollabCode!
console.log('Hello, World!');`,
  typescript: `// Welcome to CollabCode!
const greeting: string = 'Hello, World!';
console.log(greeting);`,
  python: `# Welcome to CollabCode!
print('Hello, World!')`,
  java: `// Welcome to CollabCode!
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  c: `// Welcome to CollabCode!
#include <stdio.h>
int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
  cpp: `// Welcome to CollabCode!
#include <iostream>
int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}`,
  go: `// Welcome to CollabCode!
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}`,
  rust: `// Welcome to CollabCode!
fn main() {
    println!("Hello, World!");
}`,
};

const FILE_COLORS: Record<string, string> = {
  js: '#F7DF1E', ts: '#3178C6', py: '#3572A5', java: '#ED8B00',
  css: '#264DE4', html: '#E34C26', go: '#00ADD8', rs: '#CE422B',
  c: '#6B7280', cpp: '#00599C', txt: '#ABABAB', md: '#ABABAB',
};
const FILE_ICON_LABELS: Record<string, string> = {
  js: 'JS', ts: 'TS', py: 'PY', java: 'JV', css: 'CS',
  html: 'HT', go: 'GO', rs: 'RS', c: 'C', cpp: 'C+', txt: '≡', md: '≡',
};

function getExt(n: string) { return n.split('.').pop()?.toLowerCase() ?? ''; }
function fmtTime(ts: string) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}
function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ═════════════════════════════════════════════════════════════════════════════
// COMMAND PALETTE
// ═════════════════════════════════════════════════════════════════════════════
interface CmdItem { label: string; desc?: string; icon: any; action: () => void; }

function CommandPalette({ items, onClose }: { items: CmdItem[]; onClose: () => void }) {
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [sel, setSel] = useState(0);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = useMemo(() =>
    items.filter(it => it.label.toLowerCase().includes(q.toLowerCase())),
    [q, items]
  );

  function handle(idx: number) { filtered[idx]?.action(); onClose(); }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { setSel(s => Math.min(s + 1, filtered.length - 1)); e.preventDefault(); }
    if (e.key === 'ArrowUp')   { setSel(s => Math.max(s - 1, 0)); e.preventDefault(); }
    if (e.key === 'Enter')     { handle(sel); }
    if (e.key === 'Escape')    { onClose(); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'center', paddingTop: '15vh', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div style={{ width: 560, maxHeight: 420, borderRadius: 8, background: VS.menuBg, border: `1px solid ${VS.border}`, boxShadow: '0 32px 80px rgba(0,0,0,0.7)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}>
        {/* Search bar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: `1px solid ${VS.border}`, gap: 10 }}>
          <Command style={{ width: 16, height: 16, color: VS.textMuted, flexShrink: 0 }} />
          <input ref={inputRef} value={q} onChange={e => { setQ(e.target.value); setSel(0); }} onKeyDown={onKey}
            placeholder="Type a command…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: VS.textActive, fontSize: 14, fontFamily: 'inherit' }} />
          <span style={{ fontSize: 11, color: VS.textMuted, background: VS.titleBg, padding: '2px 6px', borderRadius: 3 }}>Esc</span>
        </div>
        {/* Results */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {filtered.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: VS.textMuted, fontSize: 13 }}>No commands found</div>
          )}
          {filtered.map((item, i) => (
            <button key={item.label} onClick={() => handle(i)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px', background: i === sel ? VS.hoverStrong : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: VS.textPrimary, transition: 'background 0.1s' }}
              onMouseEnter={() => setSel(i)}>
              <item.icon style={{ width: 16, height: 16, color: VS.textMuted, flexShrink: 0 }} />
              <span style={{ fontSize: 13, flex: 1 }}>{item.label}</span>
              {item.desc && <span style={{ fontSize: 11, color: VS.textMuted }}>{item.desc}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MENU BAR DROPDOWN
// ═════════════════════════════════════════════════════════════════════════════
interface MenuItem {
  label: string;
  shortcut?: string;
  action?: () => void;
  separator?: boolean;
  disabled?: boolean;
  icon?: any;
}

function MenuBarDropdown({
  items,
  onClose,
  position = 'bottom-left',
}: {
  items: MenuItem[];
  onClose: () => void;
  position?: 'bottom-left' | 'bottom-right';
}) {
  const [selIdx, setSelIdx] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const clickableItems = items.filter(it => !it.separator && it.action);
  useEffect(() => { setSelIdx(0); }, [items]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelIdx(i => { let n = i + 1; while (n < items.length && items[n].separator) n++; return Math.min(n, items.length - 1); }); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelIdx(i => { let n = i - 1; while (n >= 0 && items[n].separator) n--; return Math.max(n, 0); }); }
    if (e.key === 'Enter') { const item = items[selIdx]; if (item?.action) { item.action(); onClose(); } }
    if (e.key === 'Escape') { onClose(); }
  }

  return (
    <div
      ref={ref}
      onKeyDown={handleKey}
      style={{
        position: 'absolute', top: '100%', left: position === 'bottom-right' ? 'auto' : 0,
        right: position === 'bottom-right' ? 0 : 'auto',
        minWidth: 220, background: '#2D2D30', border: `1px solid ${VS.border}`,
        borderRadius: 5, boxShadow: '0 8px 30px rgba(0,0,0,0.55)', padding: '4px 0', zIndex: 9999,
      }}
    >
      {items.map((item, i) =>
        item.separator ? (
          <div key={`sep-${i}`} style={{ height: 1, background: VS.border, margin: '4px 0' }} />
        ) : (
          <button
            key={item.label}
            onClick={() => { if (item.action && !item.disabled) { item.action(); onClose(); } }}
            onMouseEnter={() => setSelIdx(i)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '5px 12px 5px 14px', background: i === selIdx ? VS.hoverStrong : 'transparent',
              border: 'none', cursor: item.disabled ? 'default' : 'pointer', textAlign: 'left',
              color: item.disabled ? VS.textMuted : VS.textPrimary, fontSize: 12,
              opacity: item.disabled ? 0.5 : 1, transition: 'background 0.08s',
            }}
          >
            {item.icon && <item.icon style={{ width: 14, height: 14, color: VS.textMuted, flexShrink: 0 }} />}
            {!item.icon && <span style={{ width: 14 }} />}
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.shortcut && (
              <span style={{ fontSize: 11, color: VS.textMuted, fontFamily: "'JetBrains Mono', Consolas, monospace" }}>{item.shortcut}</span>
            )}
          </button>
        )
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// FILE ICON BADGE
// ═════════════════════════════════════════════════════════════════════════════
function FileIconBadge({ name, size = 16 }: { name: string; size?: number }) {
  const ext = getExt(name);
  const color = FILE_COLORS[ext] ?? '#6B7280';
  const label = FILE_ICON_LABELS[ext] ?? '?';
  return (
    <div style={{ width: size, height: size, borderRadius: 3, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.48, fontWeight: 800, color: '#fff', flexShrink: 0, fontFamily: 'monospace', letterSpacing: '-0.5px' }}>
      {label}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// RESIZER HANDLE
// ═════════════════════════════════════════════════════════════════════════════
function ResizeHandle({ onResize, direction = 'horizontal' }: { onResize: (delta: number) => void; direction?: 'horizontal' | 'vertical' }) {
  const isH = direction === 'horizontal';
  const dragging = useRef(false);
  const last = useRef(0);

  function onMouseDown(e: React.MouseEvent) {
    dragging.current = true;
    last.current = isH ? e.clientX : e.clientY;
    document.body.style.cursor = isH ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';

    const onMove = (me: MouseEvent) => {
      if (!dragging.current) return;
      const cur = isH ? me.clientX : me.clientY;
      onResize(cur - last.current);
      last.current = cur;
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  return (
    <div onMouseDown={onMouseDown}
      style={{
        flexShrink: 0, zIndex: 10, position: 'relative',
        width: isH ? 4 : '100%',
        height: isH ? '100%' : 4,
        cursor: isH ? 'col-resize' : 'row-resize',
        background: 'transparent',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = VS.accent)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    />
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN ROOM PAGE
// ═════════════════════════════════════════════════════════════════════════════
type ActivitySection = 'explorer' | 'search' | 'git' | 'run' | 'extensions' | 'collab' | 'settings';

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomCode } = use(params);
  const router = useRouter();
  const socketReady = useRef(false);
  const isRemoteChange = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── UI State ────────────────────────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState<ActivitySection>('explorer');
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const [sidebarWidth, setSidebarWidth]   = useState(260);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [rightPanelWidth, setRightPanelWidth] = useState(280);
  const [bottomOpen, setBottomOpen]       = useState(true);
  const [bottomHeight, setBottomHeight]   = useState(200);
  const [zenMode, setZenMode]             = useState(false);
  const [cmdOpen, setCmdOpen]             = useState(false);
  const [chatInput, setChatInput]         = useState('');
  const [showEmojis, setShowEmojis]       = useState(false);
  const [copiedCode, setCopiedCode]       = useState(false);
  const [showLangMenu, setShowLangMenu]   = useState(false);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName]     = useState('');
  const [cursorPos, setCursorPos]         = useState({ line: 1, col: 1 });
  const [filesExpanded, setFilesExpanded] = useState(true);
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const [hoveredFile, setHoveredFile]     = useState<string | null>(null);
  const [searchQuery, setSearchQuery]     = useState('');
  const [activeMenu, setActiveMenu]       = useState<string | null>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);
  const zenKeyRef = useRef(false);

  // ── Stores ──────────────────────────────────────────────────────────────────
  const { token, user, setRoom, setConnected, setParticipants, addParticipant, removeParticipant, participants, isConnected, clearRoom, roomId } = useRoomStore();
  const { files, activeFileId, setFiles, setActiveFile, setLanguage, updateFileContent, updateFileName, addFile, deleteFile, setCursor, removeCursor, language, theme, setTheme } = useEditorStore();
  const { messages, typingUsers, addMessage, setTyping } = useChatStore();
  const { isRunning, result, setResult, setRunning, clearResult } = useExecutionStore();
  const [consoleTab, setConsoleTab] = useState<'output'|'terminal'|'problems'>('output');
  const [termLines, setTermLines] = useState<{type:'cmd'|'out'|'err'; text:string}[]>([]);
  const [termInput, setTermInput] = useState('');
  const [termHistory, setTermHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const termRef = useRef<HTMLDivElement>(null);
  const termInputRef = useRef<HTMLInputElement>(null);

  const activeFile = files.find(f => f.id === activeFileId);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [termLines]);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Ctrl+Shift+P → Command Palette
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault(); setCmdOpen(v => !v); return;
      }
      // Ctrl+B → Toggle Sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault(); setSidebarOpen(v => !v); return;
      }
      // Ctrl+J → Toggle Bottom Panel
      if ((e.ctrlKey || e.metaKey) && e.key === 'j') {
        e.preventDefault(); setBottomOpen(v => !v); return;
      }
      // Ctrl+` → Toggle Terminal
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setBottomOpen(true);
        setConsoleTab('terminal');
        setTimeout(() => termInputRef.current?.focus(), 50);
        return;
      }
      // Ctrl+N → New File
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault(); setIsCreatingFile(true); setActiveSection('explorer'); setSidebarOpen(true); return;
      }
      // Ctrl+K Z → Zen Mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        zenKeyRef.current = true; return;
      }
      if (zenKeyRef.current && e.key === 'z') {
        e.preventDefault(); setZenMode(v => !v); zenKeyRef.current = false; return;
      }
      // Escape → Exit Zen Mode
      if (e.key === 'Escape' && zenMode) { setZenMode(false); return; }
      // Close Command Palette
      if (e.key === 'Escape' && cmdOpen)  { setCmdOpen(false); return; }
      // Close active menu
      if (e.key === 'Escape' && activeMenu) { setActiveMenu(null); return; }
      // Ctrl+W → Close active tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        if (activeFile && files.length > 1) {
          e.preventDefault();
          deleteFile(activeFile.id);
          getSocket().emit(SOCKET_EVENTS.FILE_DELETE, { fileId: activeFile.id });
        }
        return;
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === 'k' || e.key === 'Control' || e.key === 'Meta') zenKeyRef.current = false;
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, [zenMode, cmdOpen, activeMenu, activeFile, files]);

  // ── Click-outside handler for menus ─────────────────────────────────────────
  useEffect(() => {
    if (!activeMenu) return;
    function handleClick(e: MouseEvent) {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [activeMenu]);

  // ── Auto-scroll chat ────────────────────────────────────────────────────────
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── Socket setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !user) { router.push(`/auth?mode=join&code=${roomCode}`); return; }
    if (socketReady.current) return;
    socketReady.current = true;
    const socket = connectSocket();
    socket.on('connect', () => {
      setConnected(true);
      socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomCode, userId: user.id, username: user.username, color: user.color });
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));
    socket.on(SOCKET_EVENTS.ROOM_USERS, (us: any[]) => setParticipants(us.map(u => ({ userId: u.userId, username: u.username, color: u.color, isHost: false }))));
    socket.on(SOCKET_EVENTS.USER_JOINED, ({ user: j, message }: any) => { addParticipant({ userId: j.userId, username: j.username, color: j.color, isHost: false }); if (message) addMessage(message); });
    socket.on(SOCKET_EVENTS.USER_LEFT, ({ userId, message }: any) => { removeParticipant(userId); removeCursor(userId); if (message) addMessage(message); });
    socket.on(SOCKET_EVENTS.CODE_UPDATE, (op: any) => {
      if (op.content !== undefined) {
        isRemoteChange.current = true;
        updateFileContent(op.fileId, op.content);
        setTimeout(() => { isRemoteChange.current = false; }, 0);
      }
    });
    socket.on(SOCKET_EVENTS.CURSOR_UPDATE, (c: any) => { if (c.userId !== user.id) setCursor(c.userId, { userId: c.userId, username: c.username, color: c.color, line: c.line, column: c.column }); });
    socket.on(SOCKET_EVENTS.LANGUAGE_UPDATED, ({ language }: any) => setLanguage(language));
    socket.on(SOCKET_EVENTS.FILE_UPDATED, ({ action, file, fileId }: any) => { if (action === 'create' && file) addFile(file); if (action === 'delete' && fileId) deleteFile(fileId); });
    socket.on(SOCKET_EVENTS.CHAT_UPDATE, (msg: any) => addMessage(msg));
    socket.on(SOCKET_EVENTS.TYPING_STATUS, ({ userId, username, isTyping }: any) => { if (userId !== user.id) setTyping(userId, username, isTyping); });
    socket.on(SOCKET_EVENTS.EXECUTION_RESULT, (res: any) => { setResult(res); setRunning(false); setBottomOpen(true); setConsoleTab('output'); });
    socket.on(SOCKET_EVENTS.COMMAND_RESULT, (res: { output: string; error: string; exitCode: number }) => {
      setTermLines(prev => {
        const next = [...prev];
        if (res.output) next.push({ type: 'out', text: res.output });
        if (res.error) next.push({ type: 'err', text: res.error });
        if (res.output || res.error) next.push({ type: 'out', text: '' });
        return next;
      });
      setConsoleTab('terminal');
    });

    roomApi.get(roomCode).then((room: any) => {
      if (room?.files?.length) setFiles(room.files.map((f: any) => ({ id: f.id, name: f.name, content: f.content ?? '', language: f.language })));
      if (room?.language) setLanguage(room.language);
      const id = room?._id ?? room?.id;
      if (id) setRoom(id, roomCode);
    }).catch(() => {});

    return () => { socket.removeAllListeners(); disconnectSocket(); socketReady.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function runCode() {
    if (!activeFile || isRunning) return;
    setRunning(true);
    getSocket().emit(SOCKET_EVENTS.RUN_CODE, { language, code: activeFile.content, fileId: activeFile.id });
  }

  function sendCommand() {
    const cmd = termInput.trim();
    if (!cmd) return;
    setTermLines(prev => [...prev, { type: 'cmd', text: cmd }]);
    setTermHistory(prev => [cmd, ...prev].slice(0, 50));
    setHistIdx(-1);
    setTermInput('');
    getSocket().emit(SOCKET_EVENTS.RUN_COMMAND, { command: cmd });
  }
  function copyRoomCode() {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }
  function changeLanguage(lang: SupportedLanguage) {
    setLanguage(lang);
    setShowLangMenu(false);
    getSocket().emit(SOCKET_EVENTS.LANGUAGE_CHANGE, { language: lang });

    if (activeFile) {
      // ── 1. Rename file to correct extension (main.js → main.py etc) ──
      const EXT: Record<string, string> = {
        javascript: 'js', typescript: 'ts', python: 'py',
        java: 'java', c: 'c', cpp: 'cpp', go: 'go', rust: 'rs',
      };
      const baseName = activeFile.name.replace(/\.[^.]+$/, ''); // strip old ext
      const newName = `${baseName}.${EXT[lang] ?? 'txt'}`;
      updateFileName(activeFile.id, newName);

      // ── 2. Set default starter code for new language ──
      const defaultContent = DEFAULT_CODE[lang];
      updateFileContent(activeFile.id, defaultContent);

      // ── 3. Broadcast content change to all collaborators ──
      getSocket().emit(SOCKET_EVENTS.CODE_CHANGE, {
        type: 'insert',
        position: 0,
        content: defaultContent,
        length: defaultContent.length,
        userId: user?.id ?? '',
        fileId: activeFile.id,
        revision: 0,
        timestamp: Date.now(),
      });
    }
  }
  function sendChat(e: React.FormEvent) {
    e.preventDefault();
    const content = chatInput.trim();
    if (!content) return;
    getSocket().emit(SOCKET_EVENTS.CHAT_MESSAGE, { content });
    setChatInput('');
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    getSocket().emit(SOCKET_EVENTS.TYPING, { isTyping: false });
  }
  function handleChatTyping(val: string) {
    setChatInput(val);
    getSocket().emit(SOCKET_EVENTS.TYPING, { isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => getSocket().emit(SOCKET_EVENTS.TYPING, { isTyping: false }), 2000);
  }
  function createFile() {
    const name = newFileName.trim();
    if (!name) return;
    const id = uuidv4();
    addFile({ id, name, content: '', language: language as SupportedLanguage });
    getSocket().emit(SOCKET_EVENTS.FILE_CREATE, { id, name, language });
    setNewFileName(''); setIsCreatingFile(false);
  }
  function deleteFileHandler(fileId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (files.length <= 1) return;
    deleteFile(fileId);
    getSocket().emit(SOCKET_EVENTS.FILE_DELETE, { fileId });
  }

  // ── FileExplorer callbacks ────────────────────────────────────────────────────
  function explorerCreateFile(name: string, content: string, lang: string) {
    const id = uuidv4();
    addFile({ id, name, content, language: lang });
    getSocket().emit(SOCKET_EVENTS.FILE_CREATE, { id, name, language: lang });
    // Also set the content via CODE_CHANGE so collaborators get it
    if (content) {
      setTimeout(() => {
        getSocket().emit(SOCKET_EVENTS.CODE_CHANGE, {
          type: 'insert', position: 0, content,
          length: content.length, userId: user?.id ?? '',
          fileId: id, revision: 0, timestamp: Date.now(),
        });
      }, 100);
    }
  }
  function explorerDeleteFile(fileId: string) {
    if (files.length <= 1) return;
    deleteFile(fileId);
    getSocket().emit(SOCKET_EVENTS.FILE_DELETE, { fileId });
  }
  function explorerRenameFile(fileId: string, newName: string, newLang: string) {
    updateFileName(fileId, newName);
    // Also update language if active file
    const file = files.find(f => f.id === fileId);
    if (file && newLang !== file.language) {
      setLanguage(newLang as SupportedLanguage);
      getSocket().emit(SOCKET_EVENTS.LANGUAGE_CHANGE, { language: newLang });
    }
  }
  function explorerDuplicateFile(file: { id: string; name: string; content: string; language: string }) {
    const id = uuidv4();
    const baseName = file.name.replace(/(\.[^.]+)$/, '');
    const ext = file.name.split('.').pop() ?? '';
    const newName = `${baseName}_copy.${ext}`;
    addFile({ id, name: newName, content: file.content, language: file.language });
    getSocket().emit(SOCKET_EVENTS.FILE_CREATE, { id, name: newName, language: file.language });
  }
  function toggleActivitySection(section: ActivitySection) {
    if (activeSection === section && sidebarOpen) { setSidebarOpen(false); }
    else { setActiveSection(section); setSidebarOpen(true); }
  }

  // ── Command palette items ────────────────────────────────────────────────────
  const cmdItems: CmdItem[] = useMemo(() => [
    { label: 'Toggle Explorer',       icon: Files,          desc: 'Ctrl+B',      action: () => { toggleActivitySection('explorer'); } },
    { label: 'Toggle Terminal',       icon: Terminal,       desc: 'Ctrl+J',      action: () => setBottomOpen(v => !v) },
    { label: 'Toggle Chat',           icon: MessageSquare,  desc: '',            action: () => setRightPanelOpen(v => !v) },
    { label: 'New File',              icon: FilePlus,       desc: 'Ctrl+N',      action: () => { setIsCreatingFile(true); setSidebarOpen(true); setActiveSection('explorer'); } },
    { label: 'Run Code',              icon: Play,           desc: '',            action: runCode },
    { label: 'Invite User',           icon: UserPlus,       desc: '',            action: copyRoomCode },
    { label: 'Share Room',            icon: Share2,         desc: '',            action: copyRoomCode },
    { label: 'Toggle Theme',          icon: theme === 'vs-dark' ? Sun : Moon, desc: '', action: () => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark') },
    { label: 'Zen Mode',              icon: Maximize2,      desc: 'Ctrl+K Z',    action: () => setZenMode(v => !v) },
    { label: 'Toggle Collaborators',  icon: Users,          desc: '',            action: () => toggleActivitySection('collab') },
  ], [theme, activeSection, sidebarOpen]);

  // ── Menu bar items ────────────────────────────────────────────────────────
  function closeMenu() { setActiveMenu(null); }

  const fileMenuItems: MenuItem[] = useMemo(() => [
    { label: 'New File', shortcut: 'Ctrl+N', action: () => { setIsCreatingFile(true); setSidebarOpen(true); setActiveSection('explorer'); }, icon: FilePlus },
    { label: 'Close Tab', shortcut: 'Ctrl+W', action: () => { if (activeFile && files.length > 1) { deleteFile(activeFile.id); getSocket().emit(SOCKET_EVENTS.FILE_DELETE, { fileId: activeFile.id }); } }, disabled: !activeFile || files.length <= 1, icon: X },
    { separator: true, label: '' },
    { label: 'Rename File', shortcut: 'F2', action: () => { setActiveSection('explorer'); setSidebarOpen(true); }, icon: Edit2, disabled: !activeFile },
    { label: 'Duplicate File', shortcut: '', action: () => { if (activeFile) explorerDuplicateFile(activeFile); }, disabled: !activeFile, icon: Copy },
    { separator: true, label: '' },
    { label: 'Invite to Room', shortcut: '', action: copyRoomCode, icon: UserPlus },
    { label: 'Copy Room Code', shortcut: '', action: copyRoomCode, icon: Hash },
  ], [activeFile, files]);

  const editMenuItems: MenuItem[] = useMemo(() => [
    { label: 'Undo', shortcut: 'Ctrl+Z', action: () => { document.execCommand('undo'); }, icon: RotateCcw },
    { label: 'Redo', shortcut: 'Ctrl+Shift+Z', action: () => { document.execCommand('redo'); }, icon: RotateCw },
    { separator: true, label: '' },
    { label: 'Find', shortcut: 'Ctrl+F', action: () => { setActiveSection('search'); setSidebarOpen(true); }, icon: Search },
    { label: 'Find in Files', shortcut: 'Ctrl+Shift+F', action: () => { setActiveSection('search'); setSidebarOpen(true); }, icon: FileText },
  ], []);

  const viewMenuItems: MenuItem[] = useMemo(() => [
    { label: 'Explorer', shortcut: 'Ctrl+B', action: () => toggleActivitySection('explorer'), icon: Files, disabled: zenMode },
    { label: 'Search', shortcut: 'Ctrl+Shift+F', action: () => toggleActivitySection('search'), icon: Search, disabled: zenMode },
    { label: 'Collaborators', shortcut: '', action: () => toggleActivitySection('collab'), icon: Users, disabled: zenMode },
    { separator: true, label: '' },
    { label: bottomOpen ? 'Hide Panel' : 'Show Panel', shortcut: 'Ctrl+J', action: () => setBottomOpen(v => !v), icon: PanelBottom },
    { label: rightPanelOpen ? 'Hide Chat' : 'Show Chat', shortcut: '', action: () => setRightPanelOpen(v => !v), icon: MessageSquare },
    { separator: true, label: '' },
    { label: zenMode ? 'Exit Zen Mode' : 'Zen Mode', shortcut: 'Ctrl+K Z', action: () => setZenMode(v => !v), icon: zenMode ? Minimize2 : Maximize2 },
    { label: theme === 'vs-dark' ? 'Light Theme' : 'Dark Theme', shortcut: '', action: () => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark'), icon: theme === 'vs-dark' ? Sun : Moon },
  ], [zenMode, bottomOpen, rightPanelOpen, theme]);

  const goMenuItems: MenuItem[] = useMemo(() => [
    { label: 'Go to Line', shortcut: 'Ctrl+G', action: () => { /* Monaco go to line */ }, icon: ArrowUp },
    { label: 'Go to File', shortcut: 'Ctrl+P', action: () => { setCmdOpen(true); }, icon: FileText },
    { label: 'Go to Symbol', shortcut: 'Ctrl+Shift+O', action: () => { setCmdOpen(true); }, icon: Hash },
  ], []);

  const runMenuItems: MenuItem[] = useMemo(() => [
    { label: 'Run Code', shortcut: 'Ctrl+Enter', action: runCode, icon: Play, disabled: isRunning || !activeFile },
    { label: 'Stop', shortcut: '', action: () => { setRunning(false); }, icon: Square, disabled: !isRunning },
    { separator: true, label: '' },
    { label: 'Clear Output', shortcut: '', action: clearResult, icon: Trash2, disabled: !result },
  ], [isRunning, activeFile, result]);

  const terminalMenuItems: MenuItem[] = useMemo(() => [
    { label: bottomOpen ? 'Hide Panel' : 'Show Terminal', shortcut: 'Ctrl+J', action: () => setBottomOpen(v => !v), icon: PanelBottom },
    { label: 'Clear Terminal', shortcut: '', action: clearResult, icon: Trash2, disabled: !result },
    { separator: true, label: '' },
    { label: 'Output', shortcut: '', action: () => { setBottomOpen(true); setConsoleTab('output'); }, icon: Terminal },
    { label: 'Problems', shortcut: '', action: () => { setBottomOpen(true); setConsoleTab('problems'); }, icon: AlertCircle },
  ], [bottomOpen, result]);

  const helpMenuItems: MenuItem[] = useMemo(() => [
    { label: 'Command Palette', shortcut: 'Ctrl+Shift+P', action: () => setCmdOpen(true), icon: Command },
    { label: 'Keyboard Shortcuts', shortcut: '', action: () => setCmdOpen(true), icon: Keyboard },
    { separator: true, label: '' },
    { label: 'About CollabCode', shortcut: '', action: () => {}, icon: Code2 },
  ], []);

  // ── Activity Bar icons ────────────────────────────────────────────────────
  const ACT_ITEMS: { icon: any; section: ActivitySection; label: string }[] = [
    { icon: Files,        section: 'explorer',   label: 'Explorer (Ctrl+Shift+E)' },
    { icon: Search,       section: 'search',     label: 'Search (Ctrl+Shift+F)' },
    { icon: GitBranch,    section: 'git',        label: 'Source Control' },
    { icon: Play,         section: 'run',        label: 'Run & Debug' },
    { icon: LayoutGrid,   section: 'extensions', label: 'Extensions' },
    { icon: Users,        section: 'collab',     label: 'Collaborators' },
  ];

  const showSidebar  = !zenMode && sidebarOpen;
  const showRight    = !zenMode && rightPanelOpen;
  const showBottom   = !zenMode && bottomOpen;
  const showActivity = !zenMode;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: VS.editorBg, overflow: 'hidden', fontFamily: "'Segoe UI', Inter, system-ui, sans-serif", color: VS.textPrimary }}>

      {/* ════ COMMAND PALETTE ════════════════════════════════════════════════════ */}
      {cmdOpen && <CommandPalette items={cmdItems} onClose={() => setCmdOpen(false)} />}

      {/* ════ TITLE BAR (38px) ═══════════════════════════════════════════════════ */}
      {!zenMode && (
        <div style={{ height: 38, minHeight: 38, display: 'flex', alignItems: 'center', background: VS.titleBg, borderBottom: `1px solid ${VS.border}`, flexShrink: 0, zIndex: 50, padding: '0 12px', gap: 8 }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none', marginRight: 4, flexShrink: 0 }}>
            <div style={{ width: 22, height: 22, borderRadius: 5, background: 'linear-gradient(135deg,#007ACC,#4B5AE8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Code2 style={{ width: 12, height: 12, color: '#fff' }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 12, color: VS.textPrimary, letterSpacing: '-0.2px' }}>CollabCode</span>
          </Link>

          {/* Menu bar */}
          <div ref={menuBarRef} style={{ display: 'flex', gap: 0, position: 'relative' }}>
            {([
              { key: 'file', label: 'File', items: fileMenuItems },
              { key: 'edit', label: 'Edit', items: editMenuItems },
              { key: 'view', label: 'View', items: viewMenuItems },
              { key: 'go', label: 'Go', items: goMenuItems },
              { key: 'run', label: 'Run', items: runMenuItems },
              { key: 'terminal', label: 'Terminal', items: terminalMenuItems },
              { key: 'help', label: 'Help', items: helpMenuItems },
            ] as const).map(menu => (
              <div key={menu.key} style={{ position: 'relative' }}>
                <button
                  onClick={() => setActiveMenu(activeMenu === menu.key ? null : menu.key)}
                  onMouseEnter={() => { if (activeMenu && activeMenu !== menu.key) setActiveMenu(menu.key); }}
                  style={{
                    padding: '3px 8px', background: activeMenu === menu.key ? VS.hoverStrong : 'none',
                    border: 'none', cursor: 'pointer', color: VS.textSecondary, fontSize: 12, borderRadius: 3,
                    transition: 'background 0.08s',
                  }}
                >
                  {menu.label}
                </button>
                {activeMenu === menu.key && (
                  <MenuBarDropdown items={menu.items} onClose={closeMenu} />
                )}
              </div>
            ))}
          </div>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            {/* Command palette trigger — center of title bar */}
            <button onClick={() => setCmdOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 4, background: VS.hover, border: `1px solid ${VS.border}`, cursor: 'pointer', color: VS.textMuted, fontSize: 12, minWidth: 280 }}>
              <Search style={{ width: 12, height: 12 }} />
              <span style={{ flex: 1 }}>{activeFile?.name ?? 'CollabCode'} — Room {roomCode}</span>
              <span style={{ fontSize: 11, background: VS.border, padding: '1px 5px', borderRadius: 3 }}>Ctrl+Shift+P</span>
            </button>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
            {/* Room code */}
            <button onClick={copyRoomCode} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 4, background: VS.accentBg, border: `1px solid rgba(0,122,204,0.4)`, cursor: 'pointer', color: '#75BEFF', fontSize: 11, fontFamily: 'Consolas, monospace' }}>
              {copiedCode ? <Check style={{ width: 11, height: 11, color: VS.green }} /> : <Hash style={{ width: 11, height: 11 }} />}
              {roomCode}
            </button>
            {/* Online */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 4, background: 'rgba(78,201,176,0.1)', border: '1px solid rgba(78,201,176,0.25)', fontSize: 11, color: VS.green }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: VS.greenBright, boxShadow: `0 0 6px ${VS.greenBright}` }} />
              {participants.length} Online
            </div>
            {/* Theme */}
            <button onClick={() => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}
              style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, background: 'none', border: 'none', cursor: 'pointer', color: VS.textMuted }}
              onMouseEnter={e => (e.currentTarget.style.background = VS.hover)}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
              {theme === 'vs-dark' ? <Sun style={{ width: 14, height: 14 }} /> : <Moon style={{ width: 14, height: 14 }} />}
            </button>
            {/* User avatar */}
            {user && (
              <div title={user.username} style={{ width: 26, height: 26, borderRadius: '50%', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'default', border: `2px solid ${VS.border}` }}>
                {user.username.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════ MAIN ROW ═══════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* ── ACTIVITY BAR (48px) ─────────────────────────────────────────────── */}
        {showActivity && (
          <div style={{ width: 48, minWidth: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', background: VS.activityBg, borderRight: `1px solid ${VS.border}`, flexShrink: 0, paddingTop: 4 }}>
            {ACT_ITEMS.map(({ icon: Icon, section, label }) => {
              const isActive = activeSection === section && sidebarOpen;
              return (
                <button key={section} onClick={() => toggleActivitySection(section)} title={label}
                  style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', position: 'relative', color: isActive ? VS.actIconActive : VS.actIconIdle, borderLeft: isActive ? '2px solid #CCCCCC' : '2px solid transparent', transition: 'color 0.15s' }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = VS.textSecondary; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = VS.actIconIdle; }}>
                  <Icon style={{ width: 22, height: 22 }} />
                </button>
              );
            })}

            <div style={{ flex: 1 }} />

            {/* Settings */}
            <button title="Settings" onClick={() => toggleActivitySection('settings')}
              style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: VS.actIconIdle }}
              onMouseEnter={e => (e.currentTarget.style.color = VS.textSecondary)}
              onMouseLeave={e => (e.currentTarget.style.color = VS.actIconIdle)}>
              <Settings style={{ width: 22, height: 22 }} />
            </button>

            {/* Leave */}
            <button title="Leave room" onClick={() => { clearRoom(); router.push('/'); }}
              style={{ width: 48, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: VS.actIconIdle, marginBottom: 2 }}
              onMouseEnter={e => (e.currentTarget.style.color = VS.red)}
              onMouseLeave={e => (e.currentTarget.style.color = VS.actIconIdle)}>
              <LogOut style={{ width: 20, height: 20 }} />
            </button>

            {/* User avatar */}
            {user && (
              <div title={user.username} style={{ width: 26, height: 26, borderRadius: '50%', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'default', margin: '4px 0 8px', flexShrink: 0 }}>
                {user.username[0].toUpperCase()}
              </div>
            )}
          </div>
        )}

        {/* ── LEFT SIDEBAR ────────────────────────────────────────────────────── */}
        {showSidebar && (
          <>
            <div style={{ width: sidebarWidth, minWidth: 160, maxWidth: 500, display: 'flex', flexDirection: 'column', background: VS.sidebarBg, borderRight: `1px solid ${VS.border}`, overflow: 'hidden', flexShrink: 0, transition: 'width 0.15s ease' }}>

              {/* Section header */}
              <div style={{ height: 35, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px 0 16px', flexShrink: 0, borderBottom: `1px solid ${VS.border}` }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: VS.textMuted }}>
                  {activeSection === 'explorer' ? 'Explorer' : activeSection === 'search' ? 'Search' : activeSection === 'git' ? 'Source Control' : activeSection === 'run' ? 'Run & Debug' : activeSection === 'extensions' ? 'Extensions' : activeSection === 'collab' ? 'Collaborators' : 'Settings'}
                </span>
                <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: VS.textMuted, display: 'flex', padding: 2, borderRadius: 3 }}
                  onMouseEnter={e => (e.currentTarget.style.background = VS.hover)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  <PanelLeft style={{ width: 14, height: 14 }} />
                </button>
              </div>

              {/* ─ Explorer ─ */}
              {activeSection === 'explorer' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                  {/* FileExplorer — VS Code-like */}
                  <FileExplorer
                    roomCode={roomCode}
                    files={files}
                    activeFileId={activeFileId}
                    onFileOpen={(id) => setActiveFile(id)}
                    onFileCreate={explorerCreateFile}
                    onFileDelete={explorerDeleteFile}
                    onFileRename={explorerRenameFile}
                    onFileDuplicate={explorerDuplicateFile}
                  />

                  {/* VERSION HISTORY section */}
                  <div style={{ borderTop: `1px solid ${VS.border}`, flexShrink: 0 }}>
                    <div onClick={() => setHistoryExpanded(v => !v)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 8px 5px 12px', cursor: 'pointer', userSelect: 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = VS.hover)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <ChevronRight style={{ width: 12, height: 12, color: VS.textMuted, transform: historyExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: VS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>VERSION HISTORY</span>
                    </div>
                    {historyExpanded && (
                      <div style={{ overflowY: 'auto', maxHeight: 200 }}>
                        {[
                          { label: `Version ${Math.max(1, files.length)} (You)`, ago: '2m ago' },
                          { label: 'Version 3', ago: '15m ago' },
                          { label: 'Version 2', ago: '1h ago' },
                          { label: 'Version 1', ago: '3h ago' },
                        ].map((v, i) => (
                          <button key={i}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px 5px 28px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: VS.textSecondary }}
                            onMouseEnter={e => (e.currentTarget.style.background = VS.hover)}
                            onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                            <Clock style={{ width: 12, height: 12, color: VS.textMuted, flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: 12 }}>{v.label}</div>
                              <div style={{ fontSize: 11, color: VS.textMuted }}>{v.ago}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1 }} />

                  {/* User card */}
                  {user && (
                    <div style={{ borderTop: `1px solid ${VS.border}`, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <div style={{ position: 'relative' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>{user.username[0].toUpperCase()}</div>
                        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, borderRadius: '50%', background: VS.greenBright, border: `2px solid ${VS.sidebarBg}` }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: VS.textPrimary }}>{user.username}</div>
                        <div style={{ fontSize: 11, color: VS.green }}>● Online</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─ Search ─ */}
              {activeSection === 'search' && (
                <div style={{ padding: '8px', flex: 1, overflow: 'hidden' }}>
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search in files…"
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 4, background: VS.inputBg, border: `1px solid ${VS.border}`, color: VS.textPrimary, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                  <div style={{ marginTop: 12, padding: '0 4px', color: VS.textMuted, fontSize: 12, textAlign: 'center' }}>
                    {searchQuery ? `Searching for "${searchQuery}"…` : 'Enter search term above'}
                  </div>
                </div>
              )}

              {/* ─ Collaborators ─ */}
              {activeSection === 'collab' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
                  {participants.map(p => (
                    <div key={p.userId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px' }}
                      onMouseEnter={e => (e.currentTarget.style.background = VS.hover)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div style={{ position: 'relative' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>{p.username[0].toUpperCase()}</div>
                        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, borderRadius: '50%', background: VS.greenBright, border: `2px solid ${VS.sidebarBg}` }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, color: VS.textPrimary }}>{p.username}{p.userId === user?.id && <span style={{ color: VS.textMuted, fontSize: 11 }}> (You)</span>}</div>
                        <div style={{ fontSize: 11, color: VS.green }}>Online</div>
                      </div>
                    </div>
                  ))}
                  {participants.length === 0 && <p style={{ color: VS.textMuted, fontSize: 12, padding: '16px', textAlign: 'center' }}>No participants yet</p>}
                </div>
              )}

              {/* ─ Other sections placeholder ─ */}
              {(['git','run','extensions','settings'] as ActivitySection[]).includes(activeSection) && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                  <div style={{ textAlign: 'center', color: VS.textMuted, fontSize: 13 }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>
                      {activeSection === 'git' ? '🌿' : activeSection === 'run' ? '▶' : activeSection === 'extensions' ? '🧩' : '⚙️'}
                    </div>
                    <div>{activeSection === 'git' ? 'No source control' : activeSection === 'run' ? 'Configure debug' : activeSection === 'extensions' ? 'Browse Extensions' : 'Settings'}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Resize handle */}
            <ResizeHandle onResize={delta => setSidebarWidth(w => Math.max(160, Math.min(500, w + delta)))} />
          </>
        )}

        {/* ── EDITOR CENTER ─────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* ─ Top toolbar (42px) ─ */}
          {!zenMode && (
            <div style={{ height: 42, minHeight: 42, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', background: VS.titleBg, borderBottom: `1px solid ${VS.border}`, flexShrink: 0 }}>

              {/* Panel toggles */}
              <div style={{ display: 'flex', gap: 2, marginRight: 4 }}>
                <button onClick={() => setSidebarOpen(v => !v)} title="Toggle Sidebar (Ctrl+B)"
                  style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, background: sidebarOpen ? VS.hover : 'none', border: 'none', cursor: 'pointer', color: sidebarOpen ? VS.textPrimary : VS.textMuted }}
                  onMouseEnter={e => (e.currentTarget.style.background = VS.hover)}
                  onMouseLeave={e => (e.currentTarget.style.background = sidebarOpen ? VS.hover : 'none')}>
                  <PanelLeft style={{ width: 15, height: 15 }} />
                </button>
                <button onClick={() => setBottomOpen(v => !v)} title="Toggle Panel (Ctrl+J)"
                  style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, background: bottomOpen ? VS.hover : 'none', border: 'none', cursor: 'pointer', color: bottomOpen ? VS.textPrimary : VS.textMuted }}
                  onMouseEnter={e => (e.currentTarget.style.background = VS.hover)}
                  onMouseLeave={e => (e.currentTarget.style.background = bottomOpen ? VS.hover : 'none')}>
                  <PanelBottom style={{ width: 15, height: 15 }} />
                </button>
                <button onClick={() => setRightPanelOpen(v => !v)} title="Toggle Chat"
                  style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, background: rightPanelOpen ? VS.hover : 'none', border: 'none', cursor: 'pointer', color: rightPanelOpen ? VS.textPrimary : VS.textMuted }}
                  onMouseEnter={e => (e.currentTarget.style.background = VS.hover)}
                  onMouseLeave={e => (e.currentTarget.style.background = rightPanelOpen ? VS.hover : 'none')}>
                  <PanelRight style={{ width: 15, height: 15 }} />
                </button>
              </div>

              <div style={{ width: 1, height: 20, background: VS.border }} />

              {/* Language selector */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowLangMenu(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 4, background: 'none', border: 'none', cursor: 'pointer', color: VS.textPrimary, fontSize: 12 }}
                  onMouseEnter={e => (e.currentTarget.style.background = VS.hover)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  <span style={{ fontSize: 10, background: '#1B3F6E', padding: '2px 5px', borderRadius: 3, color: '#75BEFF', fontWeight: 700, fontFamily: 'Consolas, monospace' }}>
                    {(LANGUAGE_LABELS[language as SupportedLanguage] ?? language).slice(0,2).toUpperCase()}
                  </span>
                  {LANGUAGE_LABELS[language as SupportedLanguage] ?? language}
                  <ChevronDown style={{ width: 11, height: 11, color: VS.textMuted }} />
                </button>
                {showLangMenu && (
                  <div style={{ position: 'absolute', top: '110%', left: 0, width: 170, background: VS.menuBg, border: `1px solid ${VS.border}`, borderRadius: 6, boxShadow: '0 12px 40px rgba(0,0,0,0.6)', zIndex: 200, overflow: 'hidden', padding: '4px 0' }}
                    onMouseLeave={() => setShowLangMenu(false)}>
                    {LANGUAGES.map(lang => (
                      <button key={lang} onClick={() => changeLanguage(lang)}
                        style={{ width: '100%', textAlign: 'left', padding: '7px 12px', background: lang === language ? VS.hoverStrong : 'none', border: 'none', cursor: 'pointer', color: lang === language ? '#75BEFF' : VS.textSecondary, fontSize: 13 }}
                        onMouseEnter={e => { if (lang !== language) e.currentTarget.style.background = VS.hover; }}
                        onMouseLeave={e => { if (lang !== language) e.currentTarget.style.background = 'none'; }}>
                        {LANGUAGE_LABELS[lang]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ flex: 1 }} />

              {/* Run */}
              <button onClick={runCode} disabled={isRunning}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 4, background: isRunning ? 'rgba(35,209,139,0.2)' : '#23D18B', border: 'none', cursor: isRunning ? 'not-allowed' : 'pointer', color: isRunning ? VS.green : '#000', fontWeight: 700, fontSize: 12, flexShrink: 0, transition: 'all 0.15s' }}>
                {isRunning ? <Loader2 style={{ width: 13, height: 13, animation: 'vsc-spin 1s linear infinite' }} /> : <Play style={{ width: 13, height: 13 }} />}
                {isRunning ? 'Running…' : '▶ Run'}
              </button>

              {/* Share */}
              <button onClick={copyRoomCode}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 4, background: 'none', border: `1px solid ${VS.border}`, cursor: 'pointer', color: VS.textSecondary, fontSize: 12, flexShrink: 0 }}
                onMouseEnter={e => (e.currentTarget.style.background = VS.hover)}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                <Share2 style={{ width: 12, height: 12 }} />
                {copiedCode ? 'Copied!' : 'Share'}
              </button>

              {/* Invite */}
              <button onClick={copyRoomCode}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 4, background: 'none', border: `1px solid ${VS.border}`, cursor: 'pointer', color: VS.textSecondary, fontSize: 12, flexShrink: 0 }}
                onMouseEnter={e => (e.currentTarget.style.background = VS.hover)}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                <UserPlus style={{ width: 12, height: 12 }} />
                Invite
              </button>

              {/* Zen mode */}
              <button onClick={() => setZenMode(v => !v)} title="Zen Mode (Ctrl+K Z)"
                style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, background: 'none', border: 'none', cursor: 'pointer', color: VS.textMuted }}
                onMouseEnter={e => (e.currentTarget.style.background = VS.hover)}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                <Maximize2 style={{ width: 13, height: 13 }} />
              </button>
            </div>
          )}

          {/* ─ File Tabs (35px) ─ */}
          <div style={{ height: 35, minHeight: 35, display: 'flex', alignItems: 'stretch', background: VS.sidebarBg, borderBottom: `1px solid ${VS.border}`, overflowX: 'auto', flexShrink: 0 }}>
            {files.map(file => {
              const isActive = activeFileId === file.id;
              const ext = getExt(file.name);
              const color = FILE_COLORS[ext] ?? '#6B7280';
              return (
                <div key={file.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', minWidth: 110, height: '100%', background: isActive ? VS.tabActiveBg : VS.tabInactiveBg, borderRight: `1px solid ${VS.border}`, borderBottom: isActive ? `1px solid ${VS.tabActiveBg}` : `1px solid ${VS.border}`, borderTop: isActive ? `1px solid ${VS.accent}` : '1px solid transparent', cursor: 'pointer', flexShrink: 0, position: 'relative' }}
                  onClick={() => setActiveFile(file.id)}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = VS.hover; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = VS.tabInactiveBg; }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: isActive ? VS.textActive : VS.textMuted, whiteSpace: 'nowrap', flex: 1 }}>{file.name}</span>
                  {files.length > 1 && (
                    <button onClick={e => deleteFileHandler(file.id, e)}
                      style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: VS.textMuted, borderRadius: 3, flexShrink: 0 }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}>
                      <X style={{ width: 12, height: 12 }} />
                    </button>
                  )}
                </div>
              );
            })}
            <button onClick={() => { setIsCreatingFile(true); setSidebarOpen(true); setActiveSection('explorer'); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 35, height: '100%', background: 'none', border: 'none', borderRight: `1px solid ${VS.border}`, cursor: 'pointer', color: VS.textMuted, flexShrink: 0 }}
              onMouseEnter={e => (e.currentTarget.style.background = VS.hover)}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
              <Plus style={{ width: 14, height: 14 }} />
            </button>
          </div>

          {/* ─ Breadcrumb (22px) ─ */}
          <div style={{ height: 22, minHeight: 22, display: 'flex', alignItems: 'center', padding: '0 12px', background: VS.editorBg, borderBottom: `1px solid ${VS.border}`, flexShrink: 0, gap: 4 }}>
            <span style={{ fontSize: 11, color: VS.textMuted }}>workspace</span>
            <ChevronRight style={{ width: 10, height: 10, color: VS.textMuted }} />
            {activeFile && (
              <>
                <FileIconBadge name={activeFile.name} size={12} />
                <span style={{ fontSize: 11, color: VS.textSecondary }}>{activeFile.name}</span>
              </>
            )}
          </div>

          {/* ─ Monaco editor — position absolute inside relative ─ */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
            <div style={{ position: 'absolute', inset: 0 }}>
              {activeFile
                ? <MonacoEditor key={activeFile.id} fileId={activeFile.id} content={activeFile.content} language={activeFile.language} onCursorChange={(line, col) => setCursorPos({ line, col })} />
                : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: VS.editorBg }}>
                    <div style={{ textAlign: 'center' }}>
                      <Code2 style={{ width: 56, height: 56, color: VS.textMuted, margin: '0 auto 16px', opacity: 0.3 }} />
                      <p style={{ color: VS.textMuted, fontSize: 14, marginBottom: 8 }}>No file open</p>
                      <button onClick={() => setIsCreatingFile(true)}
                        style={{ padding: '6px 16px', borderRadius: 4, background: VS.accent, border: 'none', cursor: 'pointer', color: '#fff', fontSize: 13 }}>
                        New File
                      </button>
                    </div>
                  </div>
                )
              }
            </div>
          </div>

          {/* ─ Bottom Panel Resize Handle ─ */}
          {showBottom && (
            <ResizeHandle direction="vertical" onResize={delta => setBottomHeight(h => Math.max(80, Math.min(500, h - delta)))} />
          )}

          {/* ─ Bottom Panel ─ */}
          {showBottom && (
            <div style={{ height: bottomHeight, minHeight: 80, display: 'flex', flexDirection: 'column', background: VS.panelBg, borderTop: `1px solid ${VS.border}`, flexShrink: 0 }}>
              {/* Tab bar */}
              <div style={{ height: 35, display: 'flex', alignItems: 'center', borderBottom: `1px solid ${VS.border}`, flexShrink: 0, background: VS.sidebarBg }}>
                <div style={{ display: 'flex', height: '100%' }}>
                  {([
                    { key: 'output', icon: Terminal, label: 'Output' },
                    { key: 'terminal', icon: ChevronRight, label: 'Terminal' },
                    { key: 'problems', icon: AlertCircle, label: 'Problems', badge: result?.exitCode !== 0 && result ? 1 : 0 },
                  ] as const).map(tab => (
                    <button key={tab.key} onClick={() => setConsoleTab(tab.key)}
                      style={{ display: 'flex', alignItems: 'center', padding: '0 14px', height: '100%', background: 'none', border: 'none', borderBottom: consoleTab === tab.key ? `1px solid ${VS.accent}` : '1px solid transparent', borderTop: '1px solid transparent', cursor: 'pointer', color: consoleTab === tab.key ? VS.textActive : VS.textMuted, fontSize: 12, fontWeight: consoleTab === tab.key ? 600 : 400, gap: 6 }}
                      onMouseEnter={e => { if (consoleTab !== tab.key) e.currentTarget.style.color = VS.textPrimary; }}
                      onMouseLeave={e => { if (consoleTab !== tab.key) e.currentTarget.style.color = VS.textMuted; }}>
                      <tab.icon style={{ width: 12, height: 12 }} />
                      {tab.label}
                      {(tab as any).badge > 0 && (
                        <span style={{ background: VS.red, color: '#fff', fontSize: 10, padding: '1px 5px', borderRadius: 8, lineHeight: 1.5 }}>
                          {(tab as any).badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px' }}>
                  {(result || (consoleTab === 'terminal' && termLines.length > 0)) && (
                    <button onClick={() => { if (consoleTab === 'terminal') setTermLines([]); else clearResult(); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'none', border: 'none', cursor: 'pointer', color: VS.textMuted, fontSize: 12, borderRadius: 3 }}
                      onMouseEnter={e => (e.currentTarget.style.background = VS.hover)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                      <Trash2 style={{ width: 12, height: 12 }} /> Clear
                    </button>
                  )}
                  <button onClick={() => setBottomOpen(false)}
                    style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: VS.textMuted, borderRadius: 3 }}
                    onMouseEnter={e => (e.currentTarget.style.background = VS.hover)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <X style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              </div>

              {/* Panel content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px', fontFamily: 'Consolas, "Courier New", monospace', fontSize: 13, lineHeight: 1.6 }}>
                {consoleTab === 'output' && (
                  <>
                    {isRunning && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: VS.textMuted }}>
                        <div style={{ width: 11, height: 11, borderRadius: '50%', border: `2px solid ${VS.accent}`, borderTopColor: 'transparent', animation: 'vsc-spin 1s linear infinite' }} />
                        Running…
                      </div>
                    )}
                    {!isRunning && !result && (
                      <div style={{ color: VS.textMuted }}>
                        <span style={{ color: VS.accent }}>$</span> Press <strong style={{ color: VS.green }}>▶ Run</strong> to execute code
                      </div>
                    )}
                    {result && !isRunning && (
                      <div>
                        <div style={{ display: 'flex', gap: 16, marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${VS.border}`, fontFamily: "'Segoe UI', sans-serif", fontSize: 11, color: VS.textMuted }}>
                          <span style={{ color: result.exitCode === 0 ? VS.green : VS.red, display: 'flex', alignItems: 'center', gap: 4 }}>
                            {result.exitCode === 0 ? <CheckCircle2 style={{ width: 12, height: 12 }} /> : <AlertCircle style={{ width: 12, height: 12 }} />}
                            Exit {result.exitCode}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock style={{ width: 11, height: 11 }} />{result.executionTimeMs}ms</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Cpu style={{ width: 11, height: 11 }} />{result.memoryUsageMb?.toFixed?.(1) ?? 0}MB</span>
                        </div>
                        {result.output && <pre style={{ color: VS.green, margin: 0, whiteSpace: 'pre-wrap' }}>{result.output}</pre>}
                        {result.error && <pre style={{ color: VS.red, margin: 0, whiteSpace: 'pre-wrap' }}>{result.error}</pre>}
                        {result.exitCode === 0 && <div style={{ color: VS.green, marginTop: 6 }}>Process exited with code 0</div>}
                      </div>
                    )}
                  </>
                )}
                {consoleTab === 'terminal' && (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                    onClick={() => termInputRef.current?.focus()}>
                    <div ref={termRef} style={{ flex: 1, overflowY: 'auto', paddingBottom: 4 }}>
                      {termLines.length === 0 && (
                        <div style={{ color: VS.textMuted }}>
                          <span style={{ color: VS.green }}>$</span> Type a command and press Enter
                        </div>
                      )}
                      {termLines.map((line, i) => (
                        <div key={i} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                          {line.type === 'cmd' && (
                            <div><span style={{ color: VS.green }}>$ </span><span style={{ color: '#D4D4D4' }}>{line.text}</span></div>
                          )}
                          {line.type === 'out' && <span style={{ color: '#D4D4D4' }}>{line.text}</span>}
                          {line.type === 'err' && <span style={{ color: VS.red }}>{line.text}</span>}
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0, borderTop: `1px solid ${VS.border}`, paddingTop: 4 }}>
                      <span style={{ color: VS.green, fontFamily: 'Consolas, "Courier New", monospace', fontSize: 13, marginRight: 2 }}>$</span>
                      <input
                        ref={termInputRef}
                        value={termInput}
                        onChange={e => { setTermInput(e.target.value); setHistIdx(-1); }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { e.preventDefault(); sendCommand(); }
                          if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            if (termHistory.length > 0) {
                              const next = Math.min(histIdx + 1, termHistory.length - 1);
                              setHistIdx(next);
                              setTermInput(termHistory[next]);
                            }
                          }
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            if (histIdx > 0) {
                              const next = histIdx - 1;
                              setHistIdx(next);
                              setTermInput(termHistory[next]);
                            } else {
                              setHistIdx(-1);
                              setTermInput('');
                            }
                          }
                          if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault();
                            setTermLines([]);
                          }
                        }}
                        placeholder="Enter command…"
                        style={{
                          flex: 1, background: 'none', border: 'none', outline: 'none',
                          color: '#D4D4D4', fontFamily: 'Consolas, "Courier New", monospace', fontSize: 13,
                          caretColor: VS.green,
                        }}
                        autoFocus
                      />
                    </div>
                  </div>
                )}
                {consoleTab === 'problems' && (
                  result?.exitCode !== 0 && result?.error
                    ? <div style={{ color: VS.red, display: 'flex', gap: 8 }}><AlertCircle style={{ width: 13, height: 13, marginTop: 2, flexShrink: 0 }} /><pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{result.error}</pre></div>
                    : <div style={{ color: VS.textMuted }}>No problems detected ✓</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel Resize Handle */}
        {showRight && (
          <ResizeHandle onResize={delta => setRightPanelWidth(w => Math.max(220, Math.min(480, w - delta)))} />
        )}

        {/* ── RIGHT PANEL ─────────────────────────────────────────────────────── */}
        {showRight && (
          <div style={{ width: rightPanelWidth, minWidth: 220, display: 'flex', flexDirection: 'column', background: VS.sidebarBg, borderLeft: `1px solid ${VS.border}`, overflow: 'hidden', flexShrink: 0 }}>

            {/* COLLABORATORS */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ height: 35, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', borderBottom: `1px solid ${VS.border}` }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: VS.textMuted }}>Collaborators</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: VS.greenBright }} />
                  <span style={{ fontSize: 11, color: VS.green }}>{participants.length}</span>
                  <button onClick={() => setRightPanelOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: VS.textMuted, display: 'flex', padding: 2, borderRadius: 3 }}
                    onMouseEnter={e => (e.currentTarget.style.background = VS.hover)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <X style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              </div>
              <div style={{ borderBottom: `1px solid ${VS.border}`, paddingBottom: 4, paddingTop: 4 }}>
                {participants.map(p => (
                  <div key={p.userId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px' }}
                    onMouseEnter={e => (e.currentTarget.style.background = VS.hover)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>{p.username[0].toUpperCase()}</div>
                      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, borderRadius: '50%', background: VS.greenBright, border: `2px solid ${VS.sidebarBg}` }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: VS.textPrimary, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.username}{p.userId === user?.id && <span style={{ color: VS.textMuted, fontSize: 11 }}> (You)</span>}
                        {p.isHost && <span style={{ fontSize: 10, marginLeft: 4 }}>👑</span>}
                      </div>
                      <div style={{ fontSize: 11, color: VS.green }}>● Online</div>
                    </div>
                  </div>
                ))}
                {participants.length === 0 && <p style={{ color: VS.textMuted, fontSize: 12, padding: '8px 14px', margin: 0 }}>No participants yet</p>}
              </div>
            </div>

            {/* CHAT */}
            <div style={{ height: 35, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', borderBottom: `1px solid ${VS.border}`, flexShrink: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: VS.textMuted }}>Chat</span>
              {isConnected ? <Wifi style={{ width: 12, height: 12, color: VS.green }} /> : <WifiOff style={{ width: 12, height: 12, color: VS.red }} />}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ padding: '2px 12px 5px' }}>
                  {msg.type === 'system'
                    ? <div style={{ textAlign: 'center', fontSize: 11, color: VS.textMuted, padding: '3px 0', fontStyle: 'italic' }}>{msg.content}</div>
                    : (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: msg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{msg.username[0].toUpperCase()}</div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: VS.textPrimary }}>{msg.username}</span>
                          <span style={{ fontSize: 10, color: VS.textMuted }}>{fmtTime(msg.timestamp)}</span>
                        </div>
                        <div style={{ marginLeft: 27, padding: '7px 10px', borderRadius: msg.userId === user?.id ? '8px 8px 2px 8px' : '8px 8px 8px 2px', background: msg.userId === user?.id ? 'rgba(0,122,204,0.2)' : VS.hover, border: `1px solid ${msg.userId === user?.id ? 'rgba(0,122,204,0.4)' : VS.border}`, fontSize: 13, color: VS.textPrimary, lineHeight: 1.5, wordBreak: 'break-word' }}>
                          {msg.content}
                        </div>
                      </div>
                    )
                  }
                </div>
              ))}
              {Object.keys(typingUsers).length > 0 && (
                <div style={{ padding: '3px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: VS.textMuted }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[0, 1, 2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: VS.textMuted, display: 'inline-block', animation: `vsc-bounce 1s ${i * 0.15}s infinite` }} />)}
                  </div>
                  {Object.values(typingUsers).join(', ')} typing…
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat input */}
            <div style={{ padding: '8px 10px', borderTop: `1px solid ${VS.border}`, flexShrink: 0 }}>
              <form onSubmit={sendChat} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input type="text" value={chatInput} onChange={e => handleChatTyping(e.target.value)}
                    placeholder="Type a message…" maxLength={500}
                    style={{ width: '100%', padding: '7px 32px 7px 10px', borderRadius: 4, background: VS.inputBg, border: `1px solid ${VS.border}`, color: VS.textPrimary, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    onFocus={e => (e.currentTarget.style.borderColor = VS.accent)}
                    onBlur={e => (e.currentTarget.style.borderColor = VS.border)} />
                  <button type="button" onClick={() => setShowEmojis(v => !v)}
                    style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: VS.textMuted, display: 'flex', padding: 0 }}>
                    <Smile style={{ width: 14, height: 14 }} />
                  </button>
                  {showEmojis && (
                    <div style={{ position: 'absolute', bottom: '110%', right: 0, display: 'flex', gap: 3, padding: 8, background: VS.menuBg, border: `1px solid ${VS.border}`, borderRadius: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 50 }}>
                      {EMOJIS.map(e => (
                        <button key={e} type="button" onClick={() => { setChatInput(c => c + e); setShowEmojis(false); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '2px', borderRadius: 3 }}
                          onMouseEnter={e2 => (e2.currentTarget.style.background = VS.hover)}
                          onMouseLeave={e2 => (e2.currentTarget.style.background = 'none')}>
                          {e}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit" disabled={!chatInput.trim()}
                  style={{ width: 32, height: 32, borderRadius: 4, background: chatInput.trim() ? VS.accent : VS.inputBg, border: 'none', cursor: chatInput.trim() ? 'pointer' : 'not-allowed', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>
                  <Send style={{ width: 13, height: 13 }} />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ════ STATUS BAR (22px) ══════════════════════════════════════════════════ */}
      <footer style={{ height: 22, minHeight: 22, display: 'flex', alignItems: 'center', padding: '0 8px', background: isConnected ? VS.statusBg : '#5C2D2D', borderTop: `1px solid ${VS.border}`, flexShrink: 0, fontSize: 11, color: '#ffffff', gap: 0 }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginRight: 8 }}>
          <button onClick={() => setSidebarOpen(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px', height: 22, background: 'rgba(0,0,0,0.15)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 11 }}>
            <PanelLeft style={{ width: 11, height: 11 }} />
          </button>
        </div>

        <span style={{ padding: '0 8px', cursor: 'pointer' }} title="Go to Line" onClick={() => {}}>Ln {cursorPos.line}, Col {cursorPos.col}</span>
        <span style={{ padding: '0 8px', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>Spaces: 2</span>
        <span style={{ padding: '0 8px', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>UTF-8</span>
        <span style={{ padding: '0 8px', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>LF</span>
        <span style={{ padding: '0 8px', borderLeft: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.9)' }}>{LANGUAGE_LABELS[language as SupportedLanguage] ?? language}</span>
        {activeFile && <span style={{ padding: '0 8px', borderLeft: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }}>{activeFile.name}</span>}

        <div style={{ flex: 1 }} />

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ padding: '0 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
            {isConnected
              ? <><Wifi style={{ width: 10, height: 10 }} /> Connected</>
              : <><WifiOff style={{ width: 10, height: 10 }} /> Disconnected</>
            }
          </span>
          <span style={{ padding: '0 8px', borderLeft: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Users style={{ width: 10, height: 10 }} />
            {participants.length} online
          </span>
          <button onClick={() => setCmdOpen(true)}
            style={{ padding: '0 8px', height: 22, background: 'rgba(0,0,0,0.15)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
            <Command style={{ width: 10, height: 10 }} />
            Ctrl+Shift+P
          </button>
        </div>
      </footer>

      {/* ════ ZEN MODE EXIT HINT ════════════════════════════════════════════════ */}
      {zenMode && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', padding: '8px 16px', borderRadius: 6, background: 'rgba(0,0,0,0.7)', border: `1px solid ${VS.border}`, fontSize: 12, color: VS.textSecondary, zIndex: 9990, backdropFilter: 'blur(8px)' }}>
          Press <kbd style={{ background: VS.hover, padding: '2px 6px', borderRadius: 3, border: `1px solid ${VS.border}` }}>Esc</kbd> or <kbd style={{ background: VS.hover, padding: '2px 6px', borderRadius: 3, border: `1px solid ${VS.border}` }}>Ctrl+K Z</kbd> to exit Zen Mode
        </div>
      )}

      <style>{`
        @keyframes vsc-spin { to { transform: rotate(360deg); } }
        @keyframes vsc-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        * { box-sizing: border-box; }
        *::-webkit-scrollbar { width: 8px; height: 8px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: rgba(121,121,121,0.4); border-radius: 4px; }
        *::-webkit-scrollbar-thumb:hover { background: rgba(100,100,100,0.7); }
        * { scrollbar-width: thin; scrollbar-color: rgba(121,121,121,0.4) transparent; }
        input::placeholder { color: ${VS.textMuted}; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px ${VS.inputBg} inset !important; -webkit-text-fill-color: ${VS.textPrimary} !important; }
        .explorer-section:hover .explorer-actions { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
