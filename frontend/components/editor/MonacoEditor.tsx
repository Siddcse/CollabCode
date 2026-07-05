'use client';
import { useRef, useCallback } from 'react';
import Editor, { type OnMount, type OnChange, type BeforeMount } from '@monaco-editor/react';
import type * as MonacoNS from 'monaco-editor';
import { useEditorStore } from '@/store/editorStore';
import { useRoomStore } from '@/store/roomStore';
import { getSocket } from '@/services/socket';
import { SOCKET_EVENTS } from '@collabcode/shared';

interface Props {
  fileId: string;
  content: string;
  language: string;
  readOnly?: boolean;
  /** Called whenever the local cursor moves — used to update the status bar */
  onCursorChange?: (line: number, col: number) => void;
}

export default function MonacoEditorWrapper({
  fileId,
  content,
  language,
  readOnly = false,
  onCursorChange,
}: Props) {
  const editorRef = useRef<MonacoNS.editor.IStandaloneCodeEditor | null>(null);
  const isRemoteChange = useRef(false);

  const { theme, revision, incrementRevision } = useEditorStore();
  const { user } = useRoomStore();

  // ── Run BEFORE Monaco loads — disable all built-in error checking ──────────
  // Monaco applies JS/TS diagnostics globally (even on Python/C/C++ files).
  // We turn off semantic + syntax validation so no red underlines appear.
  const handleBeforeMount: BeforeMount = useCallback((monaco) => {
    // Disable JavaScript diagnostics
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
      noSuggestionDiagnostics: true,
    });
    // Disable TypeScript diagnostics
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
      noSuggestionDiagnostics: true,
    });
    // Relaxed compiler options so no implicit-any / strict errors
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      allowJs: true,
      checkJs: false,
      strict: false,
      noImplicitAny: false,
      strictNullChecks: false,
    });
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowJs: true,
      checkJs: false,
      strict: false,
      noImplicitAny: false,
    });
  }, []);

  const handleMount: OnMount = useCallback(
    (editor) => {
      editorRef.current = editor;

      editor.updateOptions({
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        fontLigatures: true,
        lineNumbers: 'on',
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        insertSpaces: true,
        wordWrap: 'off',
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        renderWhitespace: 'selection',
        bracketPairColorization: { enabled: true },
        guides: { bracketPairs: true, indentation: true },
        padding: { top: 16, bottom: 16 },
        readOnly,
      });

      editor.onDidChangeCursorPosition((e) => {
        const pos = e.position;

        // Update status bar in parent
        onCursorChange?.(pos.lineNumber, pos.column);

        // Broadcast cursor to other users
        if (!user) return;
        const socket = getSocket();
        const selection = editor.getSelection();
        socket.emit(SOCKET_EVENTS.CURSOR_CHANGE, {
          fileId,
          line: pos.lineNumber,
          column: pos.column,
          selectionStart: selection
            ? { line: selection.startLineNumber, column: selection.startColumn }
            : undefined,
          selectionEnd: selection
            ? { line: selection.endLineNumber, column: selection.endColumn }
            : undefined,
        });
      });
    },
    [fileId, user, readOnly, onCursorChange],
  );

  const handleChange: OnChange = useCallback(
    (value) => {
      if (isRemoteChange.current || !user || readOnly) return;
      const socket = getSocket();
      socket.emit(SOCKET_EVENTS.CODE_CHANGE, {
        type: 'insert',
        position: 0,
        content: value ?? '',
        length: value?.length ?? 0,
        userId: user.id,
        fileId,
        revision,
        timestamp: Date.now(),
      });
      incrementRevision();
    },
    [user, fileId, revision, readOnly, incrementRevision],
  );

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Editor
        value={content}
        language={language}
        theme={theme}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        onChange={handleChange}
        loading={
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e1e1e' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #7C3AED', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
              <span style={{ color: '#6B7280', fontSize: 13 }}>Loading editor...</span>
            </div>
          </div>
        }
      />
    </div>
  );
}
