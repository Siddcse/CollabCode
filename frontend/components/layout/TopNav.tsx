'use client';
import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Code2, Play, Copy, Check, Loader2, ChevronDown, Sun, Moon,
} from 'lucide-react';
import Link from 'next/link';
import { useEditorStore } from '@/store/editorStore';
import { useRoomStore } from '@/store/roomStore';
import { useExecutionStore } from '@/store/executionStore';
import { getSocket } from '@/services/socket';
import { SOCKET_EVENTS, LANGUAGE_LABELS } from '@collabcode/shared';
import type { SupportedLanguage } from '@collabcode/shared';

const LANGUAGES: SupportedLanguage[] = [
  'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'go', 'rust',
];

interface Props {
  roomCode: string;
}

export default function TopNav({ roomCode }: Props) {
  const [copied, setCopied] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const { language, setLanguage, theme, setTheme, files, activeFileId } = useEditorStore();
  const { participants, isConnected } = useRoomStore();
  const { isRunning, setRunning } = useExecutionStore();

  function copyRoomCode() {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRunCode() {
    const activeFile = files.find((f) => f.id === activeFileId);
    if (!activeFile || isRunning) return;
    setRunning(true);
    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.RUN_CODE, {
      language,
      code: activeFile.content,
      fileId: activeFile.id,
    });
  }

  function handleLanguageChange(lang: SupportedLanguage) {
    setLanguage(lang);
    setShowLangMenu(false);
    getSocket().emit(SOCKET_EVENTS.LANGUAGE_CHANGE, { language: lang });
  }

  return (
    <header className="h-12 flex items-center gap-2 px-4 border-b border-white/5 bg-[#111827] shrink-0 z-30 select-none">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-1.5 mr-2 shrink-0">
        <div className="w-6 h-6 rounded-md bg-gradient-primary flex items-center justify-center">
          <Code2 className="w-3 h-3 text-white" />
        </div>
        <span className="font-bold text-sm hidden md:block">CollabCode</span>
      </Link>

      <div className="w-px h-5 bg-white/10" />

      {/* Room Code */}
      <button
        onClick={copyRoomCode}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass glass-hover text-sm font-mono font-semibold transition-all"
        title="Click to copy room code"
      >
        <span className="text-purple-400">#</span>
        <span className="tracking-wider">{roomCode}</span>
        {copied
          ? <Check className="w-3 h-3 text-green-400" />
          : <Copy className="w-3 h-3 text-gray-500" />}
      </button>

      {/* Language Selector */}
      <div className="relative">
        <button
          onClick={() => setShowLangMenu((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass glass-hover text-sm transition-all"
        >
          <span className="text-gray-300">{LANGUAGE_LABELS[language as SupportedLanguage] ?? language}</span>
          <ChevronDown className="w-3 h-3 text-gray-500" />
        </button>
        {showLangMenu && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 mt-1 w-40 glass rounded-xl border border-white/10 shadow-glass z-50 overflow-hidden py-1"
          >
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-white/5 ${
                  lang === language ? 'text-purple-400 font-medium' : 'text-gray-400'
                }`}
              >
                {LANGUAGE_LABELS[lang]}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      <div className="flex-1" />

      {/* Online avatars */}
      <div className="flex -space-x-2 mr-2">
        {participants.slice(0, 5).map((p) => (
          <div
            key={p.userId}
            title={p.username}
            className="w-7 h-7 rounded-full border-2 border-[#111827] flex items-center justify-center text-xs font-bold text-white shadow-sm"
            style={{ backgroundColor: p.color }}
          >
            {p.username[0].toUpperCase()}
          </div>
        ))}
        {participants.length > 5 && (
          <div className="w-7 h-7 rounded-full border-2 border-[#111827] glass flex items-center justify-center text-xs text-gray-400">
            +{participants.length - 5}
          </div>
        )}
      </div>

      {/* Run Button */}
      <button
        onClick={handleRunCode}
        disabled={isRunning}
        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-green-500 hover:bg-green-400 disabled:bg-green-500/50 text-black font-semibold text-sm transition-all"
      >
        {isRunning
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <Play className="w-3.5 h-3.5" />}
        <span className="hidden sm:block">{isRunning ? 'Running…' : 'Run'}</span>
      </button>

      {/* Theme Toggle */}
      <button
        onClick={() => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}
        className="p-1.5 rounded-lg glass glass-hover text-gray-400 hover:text-gray-200 transition-colors"
      >
        {theme === 'vs-dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* Connection dot */}
      <div
        className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-500'} animate-pulse`}
        title={isConnected ? 'Connected' : 'Disconnected'}
      />
    </header>
  );
}
