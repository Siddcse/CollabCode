'use client';
import { useExecutionStore } from '@/store/executionStore';
import { Terminal, AlertCircle, CheckCircle2, Clock, Cpu, Trash2 } from 'lucide-react';

export default function BottomConsole() {
  const { result, isRunning, activeTab, setActiveTab, clearResult } = useExecutionStore();

  return (
    <div className="h-44 bg-[#111827] border-t border-white/5 flex flex-col shrink-0">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 border-b border-white/5 h-9 shrink-0">
        {(['output', 'terminal', 'problems'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'bg-white/10 text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
            {tab === 'problems' && result && result.exitCode !== 0 && (
              <span className="ml-1.5 text-red-400">1</span>
            )}
          </button>
        ))}

        <div className="flex-1" />

        {result && (
          <button
            onClick={clearResult}
            className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors"
            title="Clear output"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed">
        {/* ─── Output tab ─── */}
        {activeTab === 'output' && (
          <>
            {isRunning && (
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-3 h-3 rounded-full border border-purple-500 border-t-transparent animate-spin" />
                Executing…
              </div>
            )}

            {!isRunning && !result && (
              <div className="flex items-center gap-2 text-gray-500">
                <Terminal className="w-4 h-4" />
                <span>Click Run to execute your code</span>
              </div>
            )}

            {result && (
              <div className="space-y-2">
                {/* Metrics bar */}
                <div className="flex items-center gap-4 text-[10px] text-gray-500 border-b border-white/5 pb-2 mb-2 font-sans">
                  <span
                    className={`flex items-center gap-1 ${
                      result.exitCode === 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {result.exitCode === 0
                      ? <CheckCircle2 className="w-3 h-3" />
                      : <AlertCircle className="w-3 h-3" />}
                    Exit {result.exitCode}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />{result.executionTimeMs}ms
                  </span>
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3 h-3" />{result.memoryUsageMb.toFixed(1)}MB
                  </span>
                </div>

                {result.output && (
                  <pre className="text-green-400 whitespace-pre-wrap">{result.output}</pre>
                )}
                {result.error && (
                  <pre className="text-red-400 whitespace-pre-wrap">{result.error}</pre>
                )}
              </div>
            )}
          </>
        )}

        {/* ─── Terminal tab ─── */}
        {activeTab === 'terminal' && (
          <div className="text-gray-500">
            <span className="text-green-400">$</span> Interactive terminal — coming soon
          </div>
        )}

        {/* ─── Problems tab ─── */}
        {activeTab === 'problems' && (
          <div className="text-gray-500">
            {result && result.exitCode !== 0 && result.error ? (
              <div className="flex items-start gap-2 text-red-400">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <pre className="whitespace-pre-wrap">{result.error}</pre>
              </div>
            ) : (
              <span>No problems detected</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
