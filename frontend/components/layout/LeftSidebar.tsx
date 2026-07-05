'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FilePlus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useEditorStore } from '@/store/editorStore';
import { getSocket } from '@/services/socket';
import { SOCKET_EVENTS, LANGUAGE_EXTENSIONS } from '@collabcode/shared';
import type { SupportedLanguage } from '@collabcode/shared';

const FILE_ICONS: Record<string, string> = {
  js: '🟨', ts: '🔷', py: '🐍', java: '☕',
  c: '⚙️', cpp: '⚙️', go: '🔵', rs: '🦀',
  json: '📋', md: '📝',
};

function getExt(name: string) {
  return name.split('.').pop() ?? '';
}

export default function LeftSidebar() {
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [activeSection, setActiveSection] = useState<'explorer' | 'history'>('explorer');

  const { files, activeFileId, setActiveFile, addFile, deleteFile, language } = useEditorStore();

  function handleCreateFile() {
    const name = newFileName.trim();
    if (!name) return;
    const id = uuidv4();
    const file = { id, name, content: '', language: language as SupportedLanguage };
    addFile(file);
    getSocket().emit(SOCKET_EVENTS.FILE_CREATE, { id, name, language });
    setNewFileName('');
    setIsCreating(false);
  }

  function handleDeleteFile(fileId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (files.length <= 1) return; // keep at least one file
    deleteFile(fileId);
    getSocket().emit(SOCKET_EVENTS.FILE_DELETE, { fileId });
  }

  return (
    <div className="w-52 bg-[#111827] border-r border-white/5 flex flex-col shrink-0 overflow-hidden">
      {/* Section tabs */}
      <div className="flex border-b border-white/5 shrink-0">
        {(['explorer', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSection(tab)}
            className={`flex-1 py-2 text-[10px] font-semibold uppercase tracking-widest transition-colors ${
              activeSection === tab
                ? 'text-white border-b-2 border-purple-500'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeSection === 'explorer' && (
        <div className="flex-1 overflow-y-auto py-2">
          {/* Files header */}
          <div className="flex items-center justify-between px-3 py-1 mb-1">
            <button
              onClick={() => setIsExplorerOpen((v) => !v)}
              className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors uppercase tracking-widest font-semibold"
            >
              {isExplorerOpen
                ? <ChevronDown className="w-3 h-3" />
                : <ChevronRight className="w-3 h-3" />}
              Files
            </button>
            <button
              onClick={() => setIsCreating(true)}
              className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors"
              title="New file"
            >
              <FilePlus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* New file input */}
          {isCreating && (
            <div className="px-3 mb-2">
              <input
                autoFocus
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFile();
                  if (e.key === 'Escape') { setIsCreating(false); setNewFileName(''); }
                }}
                onBlur={() => { if (!newFileName.trim()) setIsCreating(false); }}
                placeholder="filename.py"
                className="w-full px-2 py-1 text-xs rounded bg-[#1F2937] border border-purple-500/50 focus:outline-none text-white placeholder-gray-500"
              />
            </div>
          )}

          {/* File list */}
          <AnimatePresence>
            {isExplorerOpen && files.map((file) => (
              <motion.button
                key={file.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={() => setActiveFile(file.id)}
                className={`group w-full flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors text-left ${
                  activeFileId === file.id
                    ? 'bg-purple-600/20 text-white'
                    : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'
                }`}
              >
                <span className="text-sm shrink-0">
                  {FILE_ICONS[getExt(file.name)] ?? '📄'}
                </span>
                <span className="text-xs flex-1 truncate">{file.name}</span>
                {files.length > 1 && (
                  <button
                    onClick={(e) => handleDeleteFile(file.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/20 hover:text-red-400 transition-all shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}

      {activeSection === 'history' && (
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-xs text-gray-500 text-center mt-8 leading-relaxed">
            Version history will appear here as you code.
          </p>
        </div>
      )}
    </div>
  );
}
