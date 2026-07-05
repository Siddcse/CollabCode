'use client';
import { useEditorStore } from '@/store/editorStore';
import { useRoomStore } from '@/store/roomStore';
import { LANGUAGE_LABELS } from '@collabcode/shared';
import type { SupportedLanguage } from '@collabcode/shared';
import { Wifi, WifiOff } from 'lucide-react';

export default function StatusBar() {
  const { language, files, activeFileId } = useEditorStore();
  const { isConnected, participants } = useRoomStore();
  const activeFile = files.find((f) => f.id === activeFileId);

  return (
    <div className="h-6 flex items-center gap-4 px-4 bg-purple-700 text-white text-xs shrink-0 select-none">
      <div className="flex items-center gap-1.5">
        {isConnected
          ? <Wifi className="w-3 h-3" />
          : <WifiOff className="w-3 h-3 text-red-300" />}
        <span>{isConnected ? `${participants.length} online` : 'Disconnected'}</span>
      </div>

      <div className="w-px h-3 bg-white/30" />
      <span>{LANGUAGE_LABELS[language as SupportedLanguage] ?? language}</span>

      {activeFile && (
        <>
          <div className="w-px h-3 bg-white/30" />
          <span>{activeFile.name}</span>
        </>
      )}

      <div className="flex-1" />
      <span>UTF-8</span>
      <div className="w-px h-3 bg-white/30" />
      <span>CollabCode v1.0</span>
    </div>
  );
}
