import { create } from 'zustand';

interface FileNode {
  id: string;
  name: string;
  content: string;
  language: string;
}

interface CursorInfo {
  userId: string;
  username: string;
  color: string;
  line: number;
  column: number;
}

interface EditorStore {
  files: FileNode[];
  activeFileId: string | null;
  language: string;
  theme: 'vs-dark' | 'light';
  cursors: Record<string, CursorInfo>;
  revision: number;
  setFiles: (files: FileNode[]) => void;
  setActiveFile: (id: string) => void;
  updateFileContent: (id: string, content: string) => void;
  updateFileName: (id: string, name: string) => void;
  addFile: (file: FileNode) => void;
  deleteFile: (id: string) => void;
  setLanguage: (lang: string) => void;
  setTheme: (theme: 'vs-dark' | 'light') => void;
  setCursor: (userId: string, info: CursorInfo) => void;
  removeCursor: (userId: string) => void;
  incrementRevision: () => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  files: [],
  activeFileId: null,
  language: 'javascript',
  theme: 'vs-dark',
  cursors: {},
  revision: 0,
  setFiles: (files) => set({ files, activeFileId: files[0]?.id ?? null }),
  setActiveFile: (activeFileId) => set({ activeFileId }),
  updateFileContent: (id, content) =>
    set((s) => ({ files: s.files.map((f) => (f.id === id ? { ...f, content } : f)) })),
  updateFileName: (id, name) =>
    set((s) => ({ files: s.files.map((f) => (f.id === id ? { ...f, name } : f)) })),
  addFile: (file) => set((s) => ({ files: [...s.files, file], activeFileId: file.id })),
  deleteFile: (id) =>
    set((s) => ({
      files: s.files.filter((f) => f.id !== id),
      activeFileId: s.activeFileId === id ? s.files.find((f) => f.id !== id)?.id ?? null : s.activeFileId,
    })),
  setLanguage: (language) => set({ language }),
  setTheme: (theme) => set({ theme }),
  setCursor: (userId, info) => set((s) => ({ cursors: { ...s.cursors, [userId]: info } })),
  removeCursor: (userId) =>
    set((s) => {
      const { [userId]: _, ...rest } = s.cursors;
      return { cursors: rest };
    }),
  incrementRevision: () => set((s) => ({ revision: s.revision + 1 })),
}));
