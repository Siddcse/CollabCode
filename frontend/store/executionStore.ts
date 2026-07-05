import { create } from 'zustand';

interface ExecutionResult {
  output: string;
  error: string;
  exitCode: number;
  executionTimeMs: number;
  memoryUsageMb: number;
}

interface ExecutionStore {
  isRunning: boolean;
  result: ExecutionResult | null;
  history: ExecutionResult[];
  activeTab: 'output' | 'terminal' | 'problems';
  setRunning: (v: boolean) => void;
  setResult: (r: ExecutionResult) => void;
  setActiveTab: (t: 'output' | 'terminal' | 'problems') => void;
  clearResult: () => void;
}

export const useExecutionStore = create<ExecutionStore>((set) => ({
  isRunning: false,
  result: null,
  history: [],
  activeTab: 'output',
  setRunning: (isRunning) => set({ isRunning }),
  setResult: (result) =>
    set((s) => ({ result, isRunning: false, history: [...s.history.slice(-19), result] })),
  setActiveTab: (activeTab) => set({ activeTab }),
  clearResult: () => set({ result: null }),
}));
