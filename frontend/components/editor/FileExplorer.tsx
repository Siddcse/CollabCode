'use client';
import React, {
  useState, useRef, useEffect, useCallback, useMemo
} from 'react';
import {
  FilePlus, FolderPlus, RotateCcw, ChevronsUpDown,
  ChevronRight, ChevronDown, Folder as FolderIcon, FolderOpen,
  Search, X, Trash2, Edit2, Copy, Clipboard, Files,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface FileNode {
  id: string;
  name: string;
  content: string;
  language: string;
}

interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
}

interface CtxMenu {
  x: number;
  y: number;
  itemId: string;
  itemType: 'file' | 'folder';
}

interface Creating {
  type: 'file' | 'folder';
  parentId: string | null;
}

interface Clipboard {
  type: 'file' | 'folder';
  id: string;
  op: 'copy';
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const EXT_LANG: Record<string, string> = {
  js: 'javascript', ts: 'typescript', py: 'python',
  java: 'java', c: 'c', cpp: 'cpp', go: 'go', rs: 'rust',
};

const STARTER: Record<string, string> = {
  javascript: `console.log("Hello World");`,
  typescript: `const greeting: string = "Hello World";\nconsole.log(greeting);`,
  python: `print("Hello World")`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}`,
  c: `#include <stdio.h>\n\nint main() {\n    printf("Hello World");\n    return 0;\n}`,
  cpp: `#include <iostream>\n\nint main() {\n    std::cout << "Hello World";\n    return 0;\n}`,
  go: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello World")\n}`,
  rust: `fn main() {\n    println!("Hello World");\n}`,
};

const FILE_COLORS: Record<string, string> = {
  js: '#F7DF1E', ts: '#3178C6', py: '#3572A5', java: '#ED8B00',
  c: '#6B7280', cpp: '#00599C', go: '#00ADD8', rs: '#CE422B',
  txt: '#ABABAB', md: '#ABABAB',
};
const FILE_LABELS: Record<string, string> = {
  js: 'JS', ts: 'TS', py: 'PY', java: 'JV',
  c: 'C', cpp: 'C+', go: 'GO', rs: 'RS',
};

function getExt(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? '';
}
function langFromName(name: string): string {
  return EXT_LANG[getExt(name)] ?? 'plaintext';
}
function starterFromName(name: string): string {
  return STARTER[langFromName(name)] ?? '';
}

// VS Code theme tokens (same as room page)
const VS = {
  sidebarBg: '#252526',
  hover: 'rgba(255,255,255,0.05)',
  hoverStrong: 'rgba(255,255,255,0.09)',
  border: '#3C3C3C',
  textActive: '#CCCCCC',
  textPrimary: '#CCCCCC',
  textSecondary: '#969696',
  textMuted: '#6B6B6B',
  accent: '#007ACC',
  accentBg: 'rgba(0,122,204,0.12)',
  inputBg: '#3C3C3C',
  red: '#F48771',
  green: '#4EC9B0',
};

// ─────────────────────────────────────────────────────────────────────────────
// File Icon Badge
// ─────────────────────────────────────────────────────────────────────────────

function FileBadge({ name, size = 14 }: { name: string; size?: number }) {
  const ext = getExt(name);
  const color = FILE_COLORS[ext] ?? '#6B7280';
  const label = (FILE_LABELS[ext] ?? ext.slice(0, 2).toUpperCase()) || '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: 3, background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.5, fontWeight: 800, color: '#fff', flexShrink: 0,
      fontFamily: 'monospace', letterSpacing: '-0.5px',
    }}>
      {label}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline Input (for creating / renaming)
// ─────────────────────────────────────────────────────────────────────────────

function InlineInput({
  initial, placeholder, indent,
  onCommit, onCancel,
}: {
  initial?: string;
  placeholder?: string;
  indent: number;
  onCommit: (val: string) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState(initial ?? '');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);

  return (
    <div style={{ paddingLeft: indent + 4, paddingRight: 8, paddingTop: 2, paddingBottom: 2 }}>
      <input
        ref={ref}
        value={val}
        onChange={e => setVal(e.target.value)}
        placeholder={placeholder}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); if (val.trim()) onCommit(val.trim()); }
          if (e.key === 'Escape') onCancel();
        }}
        onBlur={() => { if (val.trim()) onCommit(val.trim()); else onCancel(); }}
        style={{
          width: '100%', padding: '3px 8px', borderRadius: 3,
          background: VS.inputBg, border: `1px solid ${VS.accent}`,
          color: VS.textActive, fontSize: 13, outline: 'none',
          boxSizing: 'border-box', fontFamily: 'Consolas, monospace',
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Context Menu
// ─────────────────────────────────────────────────────────────────────────────

function CtxMenuComp({
  menu, onClose, actions,
}: {
  menu: CtxMenu;
  onClose: () => void;
  actions: { label: string; danger?: boolean; separator?: boolean; onClick: () => void }[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref} style={{
      position: 'fixed', zIndex: 9999, left: menu.x, top: menu.y,
      background: '#2D2D30', border: `1px solid #454545`,
      borderRadius: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
      minWidth: 160, padding: '4px 0',
    }}>
      {actions.map((a, i) =>
        a.separator
          ? <div key={i} style={{ height: 1, background: '#454545', margin: '4px 0' }} />
          : (
            <button
              key={i}
              onClick={() => { a.onClick(); onClose(); }}
              style={{
                width: '100%', padding: '5px 16px', background: 'none',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                fontSize: 13, color: a.danger ? VS.red : VS.textPrimary,
                display: 'block',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = VS.hoverStrong)}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              {a.label}
            </button>
          )
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete Confirmation Dialog
// ─────────────────────────────────────────────────────────────────────────────

function DeleteDialog({
  name, onConfirm, onCancel,
}: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#252526', border: `1px solid #454545`,
        borderRadius: 6, padding: '20px 24px', maxWidth: 360, width: '90%',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: VS.textActive, marginBottom: 10 }}>
          Delete "{name}"?
        </div>
        <div style={{ fontSize: 13, color: VS.textSecondary, marginBottom: 20 }}>
          This action cannot be undone.
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            padding: '6px 16px', borderRadius: 3, background: '#3C3C3C',
            border: `1px solid #545454`, cursor: 'pointer', color: VS.textPrimary, fontSize: 13,
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            padding: '6px 16px', borderRadius: 3, background: '#C72E2E',
            border: 'none', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600,
          }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main FileExplorer Props
// ─────────────────────────────────────────────────────────────────────────────

export interface FileExplorerProps {
  roomCode: string;          // used as localStorage key
  files: FileNode[];
  activeFileId: string | null;
  onFileOpen: (fileId: string) => void;
  onFileCreate: (name: string, content: string, language: string) => void;
  onFileDelete: (fileId: string) => void;
  onFileRename: (fileId: string, newName: string, newLang: string) => void;
  onFileDuplicate: (file: FileNode) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// FileExplorer Component
// ─────────────────────────────────────────────────────────────────────────────

export default function FileExplorer({
  roomCode, files, activeFileId,
  onFileOpen, onFileCreate, onFileDelete, onFileRename, onFileDuplicate,
}: FileExplorerProps) {

  // ── Folder state (persisted to localStorage) ────────────────────────────────
  const lsKey = `fe-state-${roomCode}`;

  function loadState() {
    try {
      const raw = localStorage.getItem(lsKey);
      if (raw) return JSON.parse(raw) as {
        folders: FolderItem[];
        expanded: string[];
        parents: Record<string, string | null>;
      };
    } catch { /* ignore */ }
    return { folders: [], expanded: [] as string[], parents: {} as Record<string, string | null> };
  }

  const initial = useMemo(loadState, [lsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const [folders, setFolders] = useState<FolderItem[]>(initial.folders);
  const [expanded, setExpanded] = useState<string[]>(initial.expanded);
  const [parents, setParents] = useState<Record<string, string | null>>(initial.parents);

  // Persist on change
  useEffect(() => {
    localStorage.setItem(lsKey, JSON.stringify({ folders, expanded, parents }));
  }, [folders, expanded, parents, lsKey]);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [creating, setCreating] = useState<Creating | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingType, setRenamingType] = useState<'file' | 'folder'>('file');
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);
  const [clipboard, setClipboard] = useState<Clipboard | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [draggedType, setDraggedType] = useState<'file' | 'folder'>('file');
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // ── Keyboard: F2 rename, Escape close context ────────────────────────────
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') { setCtxMenu(null); setCreating(null); }
      if (e.key === 'F2' && activeFileId && !renamingId && !creating) {
        setRenamingId(activeFileId);
        setRenamingType('file');
      }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [activeFileId, renamingId, creating]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function toggleFolder(id: string) {
    setExpanded(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function collapseAll() {
    setExpanded([]);
  }

  function createFolder(name: string, parentId: string | null) {
    const id = crypto.randomUUID();
    setFolders(prev => [...prev, { id, name, parentId }]);
    setExpanded(prev => parentId ? (prev.includes(parentId) ? prev : [...prev, parentId]) : prev);
  }

  function renameFolder(id: string, name: string) {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f));
  }

  function deleteFolderCascade(id: string) {
    // Get all descendant folder IDs
    const all: string[] = [id];
    function collect(fid: string) {
      folders.filter(f => f.parentId === fid).forEach(f => { all.push(f.id); collect(f.id); });
    }
    collect(id);
    // Delete files in those folders
    const filesToDelete = files.filter(f => {
      const p = parents[f.id] ?? null;
      return p !== null && all.includes(p);
    });
    filesToDelete.forEach(f => onFileDelete(f.id));
    // Clean parents
    setParents(prev => {
      const next = { ...prev };
      filesToDelete.forEach(f => delete next[f.id]);
      return next;
    });
    setFolders(prev => prev.filter(f => !all.includes(f.id)));
    setExpanded(prev => prev.filter(x => !all.includes(x)));
  }

  function handleCreateCommit(name: string) {
    if (!creating) return;
    if (creating.type === 'file') {
      const lang = langFromName(name);
      const content = starterFromName(name);
      onFileCreate(name, content, lang);
      // We set parent after creation — but we don't have the new fileId yet.
      // We'll handle via a "pending parent" approach: store parentId and apply to last created file.
      pendingParentRef.current = creating.parentId ?? null;
    } else {
      createFolder(name, creating.parentId ?? null);
    }
    setCreating(null);
  }

  const pendingParentRef = useRef<string | null>(null);

  // Watch files array to assign parent to newly created file
  const prevFilesLen = useRef(files.length);
  useEffect(() => {
    if (files.length > prevFilesLen.current && pendingParentRef.current !== undefined) {
      const newFile = files[files.length - 1];
      if (newFile && pendingParentRef.current !== null) {
        setParents(prev => ({ ...prev, [newFile.id]: pendingParentRef.current }));
      }
      pendingParentRef.current = null;
    }
    prevFilesLen.current = files.length;
  }, [files]);

  function handleFileRename(id: string, newName: string) {
    const newLang = langFromName(newName);
    onFileRename(id, newName, newLang);
    setRenamingId(null);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'file') {
      onFileDelete(deleteTarget.id);
      setParents(prev => { const n = { ...prev }; delete n[deleteTarget.id]; return n; });
    } else {
      deleteFolderCascade(deleteTarget.id);
    }
    setDeleteTarget(null);
  }

  function handleDuplicate(file: FileNode) {
    onFileDuplicate(file);
  }

  function handlePaste(targetParentId: string | null) {
    if (!clipboard) return;
    if (clipboard.type === 'file') {
      const src = files.find(f => f.id === clipboard.id);
      if (src) {
        const baseName = src.name.replace(/(\.[^.]+)$/, '');
        const ext = getExt(src.name);
        const newName = `${baseName}_copy.${ext}`;
        const lang = langFromName(newName);
        onFileCreate(newName, src.content, lang);
        pendingParentRef.current = targetParentId;
      }
    }
  }

  function moveItem(itemId: string, itemType: 'file' | 'folder', targetFolderId: string | null) {
    if (itemType === 'file') {
      setParents(prev => ({ ...prev, [itemId]: targetFolderId }));
    } else {
      // Prevent moving folder into its own descendant
      const descendants: string[] = [];
      function collect(fid: string) {
        folders.filter(f => f.parentId === fid).forEach(f => { descendants.push(f.id); collect(f.id); });
      }
      collect(itemId);
      if (targetFolderId && descendants.includes(targetFolderId)) return;
      if (targetFolderId === itemId) return;
      setFolders(prev => prev.map(f => f.id === itemId ? { ...f, parentId: targetFolderId } : f));
    }
  }

  // ── Search filter ─────────────────────────────────────────────────────────

  const q = search.toLowerCase();
  const filteredFiles = q ? files.filter(f => f.name.toLowerCase().includes(q)) : null;
  const filteredFolders = q ? folders.filter(f => f.name.toLowerCase().includes(q)) : null;

  // ── Build tree ────────────────────────────────────────────────────────────

  function buildTree(parentId: string | null, depth: number): React.ReactNode {
    const foldersHere = (filteredFolders ?? folders).filter(f => f.parentId === parentId);
    const filesHere = (filteredFiles ?? files).filter(f => (parents[f.id] ?? null) === parentId);

    return (
      <>
        {foldersHere.map(folder => renderFolder(folder, depth))}
        {filesHere.map(file => renderFile(file, depth))}
        {creating && creating.parentId === parentId && (
          <InlineInput
            key="creating"
            placeholder={creating.type === 'file' ? 'filename.py' : 'folder name'}
            indent={depth * 12 + 20}
            onCommit={handleCreateCommit}
            onCancel={() => setCreating(null)}
          />
        )}
      </>
    );
  }

  function renderFolder(folder: FolderItem, depth: number) {
    const isExpanded = expanded.includes(folder.id);
    const isHovered = hoveredId === folder.id;
    const isOver = dragOverId === folder.id;
    const isRenaming = renamingId === folder.id && renamingType === 'folder';

    return (
      <div key={folder.id}>
        {isRenaming ? (
          <InlineInput
            initial={folder.name}
            indent={depth * 12 + 8}
            onCommit={name => { renameFolder(folder.id, name); setRenamingId(null); }}
            onCancel={() => setRenamingId(null)}
          />
        ) : (
          <div
            draggable
            onDragStart={e => { e.stopPropagation(); setDraggedId(folder.id); setDraggedType('folder'); e.dataTransfer.effectAllowed = 'move'; }}
            onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
            onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOverId(folder.id); }}
            onDragLeave={() => { if (dragOverId === folder.id) setDragOverId(null); }}
            onDrop={e => {
              e.preventDefault(); e.stopPropagation(); setDragOverId(null);
              if (draggedId) moveItem(draggedId, draggedType, folder.id);
            }}
            onMouseEnter={() => setHoveredId(folder.id)}
            onMouseLeave={() => setHoveredId(null)}
            onDoubleClick={() => { setRenamingId(folder.id); setRenamingType('folder'); }}
            onContextMenu={e => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, itemId: folder.id, itemType: 'folder' }); }}
            onClick={() => toggleFolder(folder.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              paddingLeft: depth * 12 + 8, paddingRight: 6,
              paddingTop: 3, paddingBottom: 3,
              cursor: 'pointer', userSelect: 'none',
              background: isOver ? 'rgba(0,122,204,0.2)' : isHovered ? VS.hover : 'transparent',
              outline: isOver ? `1px solid ${VS.accent}` : 'none',
            }}
          >
            <ChevronRight style={{
              width: 12, height: 12, color: VS.textMuted, flexShrink: 0,
              transform: isExpanded ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.15s',
            }} />
            {isExpanded
              ? <FolderOpen style={{ width: 14, height: 14, color: '#DCAA3C', flexShrink: 0 }} />
              : <FolderIcon style={{ width: 14, height: 14, color: '#DCAA3C', flexShrink: 0 }} />
            }
            <span style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: VS.textPrimary }}>{folder.name}</span>
            {isHovered && (
              <div style={{ display: 'flex', gap: 2 }} onClick={e => e.stopPropagation()}>
                <button
                  title="New File"
                  onClick={() => { setCreating({ type: 'file', parentId: folder.id }); setExpanded(prev => prev.includes(folder.id) ? prev : [...prev, folder.id]); }}
                  style={{ padding: 2, background: 'none', border: 'none', cursor: 'pointer', color: VS.textMuted, borderRadius: 3, display: 'flex' }}
                  onMouseEnter={e => (e.currentTarget.style.color = VS.textActive)}
                  onMouseLeave={e => (e.currentTarget.style.color = VS.textMuted)}
                >
                  <FilePlus style={{ width: 12, height: 12 }} />
                </button>
                <button
                  title="New Folder"
                  onClick={() => { setCreating({ type: 'folder', parentId: folder.id }); setExpanded(prev => prev.includes(folder.id) ? prev : [...prev, folder.id]); }}
                  style={{ padding: 2, background: 'none', border: 'none', cursor: 'pointer', color: VS.textMuted, borderRadius: 3, display: 'flex' }}
                  onMouseEnter={e => (e.currentTarget.style.color = VS.textActive)}
                  onMouseLeave={e => (e.currentTarget.style.color = VS.textMuted)}
                >
                  <FolderPlus style={{ width: 12, height: 12 }} />
                </button>
                <button
                  title="Delete Folder"
                  onClick={() => setDeleteTarget({ id: folder.id, name: folder.name, type: 'folder' })}
                  style={{ padding: 2, background: 'none', border: 'none', cursor: 'pointer', color: VS.textMuted, borderRadius: 3, display: 'flex' }}
                  onMouseEnter={e => (e.currentTarget.style.color = VS.red)}
                  onMouseLeave={e => (e.currentTarget.style.color = VS.textMuted)}
                >
                  <Trash2 style={{ width: 12, height: 12 }} />
                </button>
              </div>
            )}
          </div>
        )}
        {isExpanded && (
          <div>{buildTree(folder.id, depth + 1)}</div>
        )}
      </div>
    );
  }

  function renderFile(file: FileNode, depth: number) {
    const isActive = activeFileId === file.id;
    const isHovered = hoveredId === file.id;
    const isRenaming = renamingId === file.id && renamingType === 'file';

    if (isRenaming) {
      return (
        <InlineInput
          key={file.id}
          initial={file.name}
          indent={depth * 12 + 20}
          onCommit={name => handleFileRename(file.id, name)}
          onCancel={() => setRenamingId(null)}
        />
      );
    }

    return (
      <div
        key={file.id}
        draggable
        onDragStart={e => { e.stopPropagation(); setDraggedId(file.id); setDraggedType('file'); e.dataTransfer.effectAllowed = 'move'; }}
        onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
        onMouseEnter={() => setHoveredId(file.id)}
        onMouseLeave={() => setHoveredId(null)}
        onDoubleClick={() => { setRenamingId(file.id); setRenamingType('file'); }}
        onContextMenu={e => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, itemId: file.id, itemType: 'file' }); }}
      >
        <button
          onClick={() => onFileOpen(file.id)}
          title={file.name}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 6,
            paddingLeft: depth * 12 + 20, paddingRight: 6,
            paddingTop: 4, paddingBottom: 4,
            background: isActive ? VS.hoverStrong : isHovered ? VS.hover : 'transparent',
            border: 'none',
            borderLeft: isActive ? `2px solid ${VS.accent}` : '2px solid transparent',
            cursor: 'pointer', textAlign: 'left',
            color: isActive ? VS.textActive : VS.textPrimary,
            opacity: draggedId === file.id ? 0.4 : 1,
          }}
        >
          <FileBadge name={file.name} size={14} />
          <span style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.name}
          </span>
          {isHovered && (
            <div style={{ display: 'flex', gap: 2 }} onClick={e => e.stopPropagation()}>
              <button
                title="Rename (F2)"
                onClick={() => { setRenamingId(file.id); setRenamingType('file'); }}
                style={{ padding: 2, background: 'none', border: 'none', cursor: 'pointer', color: VS.textMuted, borderRadius: 3, display: 'flex' }}
                onMouseEnter={e => (e.currentTarget.style.color = VS.textActive)}
                onMouseLeave={e => (e.currentTarget.style.color = VS.textMuted)}
              >
                <Edit2 style={{ width: 11, height: 11 }} />
              </button>
              {files.length > 1 && (
                <button
                  title="Delete"
                  onClick={() => setDeleteTarget({ id: file.id, name: file.name, type: 'file' })}
                  style={{ padding: 2, background: 'none', border: 'none', cursor: 'pointer', color: VS.textMuted, borderRadius: 3, display: 'flex' }}
                  onMouseEnter={e => (e.currentTarget.style.color = VS.red)}
                  onMouseLeave={e => (e.currentTarget.style.color = VS.textMuted)}
                >
                  <Trash2 style={{ width: 11, height: 11 }} />
                </button>
              )}
            </div>
          )}
        </button>
      </div>
    );
  }

  // ── Context menu actions ──────────────────────────────────────────────────

  function getCtxActions() {
    if (!ctxMenu) return [];
    const { itemId, itemType } = ctxMenu;

    if (itemType === 'file') {
      const file = files.find(f => f.id === itemId);
      return [
        { label: 'Open', onClick: () => onFileOpen(itemId) },
        { label: 'Rename', onClick: () => { setRenamingId(itemId); setRenamingType('file'); } },
        { label: '', separator: true, onClick: () => {} },
        { label: 'Copy', onClick: () => setClipboard({ type: 'file', id: itemId, op: 'copy' }) },
        { label: 'Paste', onClick: () => handlePaste(parents[itemId] ?? null) },
        { label: 'Duplicate', onClick: () => file && handleDuplicate(file) },
        { label: '', separator: true, onClick: () => {} },
        { label: 'Delete', danger: true, onClick: () => file && setDeleteTarget({ id: itemId, name: file.name, type: 'file' }) },
      ];
    } else {
      const folder = folders.find(f => f.id === itemId);
      return [
        { label: 'New File', onClick: () => { setCreating({ type: 'file', parentId: itemId }); setExpanded(prev => prev.includes(itemId) ? prev : [...prev, itemId]); } },
        { label: 'New Folder', onClick: () => { setCreating({ type: 'folder', parentId: itemId }); setExpanded(prev => prev.includes(itemId) ? prev : [...prev, itemId]); } },
        { label: '', separator: true, onClick: () => {} },
        { label: 'Rename', onClick: () => { setRenamingId(itemId); setRenamingType('folder'); } },
        { label: 'Paste', onClick: () => handlePaste(itemId) },
        { label: '', separator: true, onClick: () => {} },
        { label: 'Delete', danger: true, onClick: () => folder && setDeleteTarget({ id: itemId, name: folder.name, type: 'folder' }) },
      ];
    }
  }

  // ── Drop on root (empty area) ─────────────────────────────────────────────
  const rootDropRef = useRef<HTMLDivElement>(null);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', userSelect: 'none' }}>

      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '4px 8px 4px 12px', gap: 2, flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: VS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, flex: 1 }}>FILES</span>
        {[
          { Icon: FilePlus, title: 'New File (root)', onClick: () => setCreating({ type: 'file', parentId: null }) },
          { Icon: FolderPlus, title: 'New Folder', onClick: () => setCreating({ type: 'folder', parentId: null }) },
          { Icon: RotateCcw, title: 'Refresh', onClick: () => {} },
          { Icon: ChevronsUpDown, title: 'Collapse All', onClick: collapseAll },
          { Icon: Search, title: 'Search Files', onClick: () => { setShowSearch(s => !s); if (showSearch) setSearch(''); } },
        ].map(({ Icon, title, onClick }) => (
          <button key={title} title={title} onClick={onClick} style={{
            width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer', color: VS.textMuted, borderRadius: 3,
          }}
            onMouseEnter={e => { e.currentTarget.style.background = VS.hover; e.currentTarget.style.color = VS.textActive; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = VS.textMuted; }}
          >
            <Icon style={{ width: 14, height: 14 }} />
          </button>
        ))}
      </div>

      {/* ── Search box ── */}
      {showSearch && (
        <div style={{ padding: '2px 8px 6px', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: VS.textMuted, pointerEvents: 'none' }} />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter files & folders…"
              style={{
                width: '100%', padding: '4px 8px 4px 26px',
                borderRadius: 3, background: VS.inputBg,
                border: `1px solid ${VS.border}`, color: VS.textPrimary,
                fontSize: 12, outline: 'none', boxSizing: 'border-box',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{
                position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: VS.textMuted,
                display: 'flex', padding: 0,
              }}>
                <X style={{ width: 12, height: 12 }} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── File Tree ── */}
      <div
        ref={rootDropRef}
        onDragOver={e => { e.preventDefault(); setDragOverId('__root__'); }}
        onDragLeave={() => { if (dragOverId === '__root__') setDragOverId(null); }}
        onDrop={e => {
          e.preventDefault(); setDragOverId(null);
          if (draggedId) moveItem(draggedId, draggedType, null);
        }}
        style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          outline: dragOverId === '__root__' ? `1px dashed ${VS.accent}` : 'none',
        }}
      >
        {buildTree(null, 0)}

        {/* Empty state */}
        {files.length === 0 && folders.length === 0 && !creating && (
          <div style={{ padding: '20px 16px', textAlign: 'center', color: VS.textMuted, fontSize: 12 }}>
            No files yet. Click + to create one.
          </div>
        )}
      </div>

      {/* ── Context Menu ── */}
      {ctxMenu && (
        <CtxMenuComp
          menu={ctxMenu}
          onClose={() => setCtxMenu(null)}
          actions={getCtxActions()}
        />
      )}

      {/* ── Delete Confirmation ── */}
      {deleteTarget && (
        <DeleteDialog
          name={deleteTarget.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
