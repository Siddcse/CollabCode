'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, MessageSquare, Send, Smile } from 'lucide-react';
import { useRoomStore } from '@/store/roomStore';
import { useChatStore } from '@/store/chatStore';
import { getSocket } from '@/services/socket';
import { SOCKET_EVENTS } from '@collabcode/shared';

const EMOJIS = ['👍', '❤️', '🔥', '🎉', '😂', '🤔', '👀', '✅'];

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export default function RightSidebar() {
  const [activeTab, setActiveTab] = useState<'collaborators' | 'chat'>('collaborators');
  const [message, setMessage] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { participants, user } = useRoomStore();
  const { messages, typingUsers, addMessage } = useChatStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const content = message.trim();
    if (!content) return;
    getSocket().emit(SOCKET_EVENTS.CHAT_MESSAGE, { content });
    setMessage('');
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    getSocket().emit(SOCKET_EVENTS.TYPING, { isTyping: false });
  }

  function handleTyping(value: string) {
    setMessage(value);
    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.TYPING, { isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit(SOCKET_EVENTS.TYPING, { isTyping: false });
    }, 2000);
  }

  const chatCount = messages.filter((m) => m.type === 'text').length;

  return (
    <div className="w-60 bg-[#111827] border-l border-white/5 flex flex-col shrink-0">
      {/* Tabs */}
      <div className="flex border-b border-white/5 shrink-0">
        {([
          ['collaborators', Users] as const,
          ['chat', MessageSquare] as const,
        ]).map(([tab, Icon]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-semibold uppercase tracking-widest transition-colors ${
              activeTab === tab
                ? 'text-white border-b-2 border-purple-500'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {tab}
            {tab === 'chat' && chatCount > 0 && (
              <span className="px-1.5 py-px rounded-full bg-purple-600 text-white text-[9px] leading-none">
                {chatCount > 9 ? '9+' : chatCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── Collaborators Tab ─── */}
      {activeTab === 'collaborators' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <AnimatePresence>
            {participants.map((p) => (
              <motion.div
                key={p.userId}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="relative">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.username[0].toUpperCase()}
                  </div>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#111827]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-200 truncate flex items-center gap-1.5">
                    {p.username}
                    {p.userId === user?.id && (
                      <span className="text-[9px] text-gray-500">(you)</span>
                    )}
                    {p.isHost && (
                      <span className="text-[9px] text-purple-400">host</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">Online</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {participants.length === 0 && (
            <p className="text-xs text-gray-500 text-center mt-8">
              No participants yet
            </p>
          )}
        </div>
      )}

      {/* ─── Chat Tab ─── */}
      {activeTab === 'chat' && (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {msg.type === 'system' ? (
                    <div className="text-center text-[10px] text-gray-500 py-0.5">
                      {msg.content}
                    </div>
                  ) : (
                    <div
                      className={`flex flex-col ${
                        msg.userId === user?.id ? 'items-end' : 'items-start'
                      }`}
                    >
                      {msg.userId !== user?.id && (
                        <span
                          className="text-[10px] font-semibold mb-0.5"
                          style={{ color: msg.color }}
                        >
                          {msg.username}
                        </span>
                      )}
                      <div
                        className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                          msg.userId === user?.id
                            ? 'bg-purple-600 text-white rounded-br-sm'
                            : 'bg-[#1F2937] text-gray-200 rounded-bl-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[9px] text-gray-600 mt-0.5">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {Object.keys(typingUsers).length > 0 && (
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                <div className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1 h-1 rounded-full bg-gray-500 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                {Object.values(typingUsers).join(', ')} typing…
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/5 shrink-0">
            <form onSubmit={sendMessage} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => handleTyping(e.target.value)}
                  placeholder="Message…"
                  maxLength={500}
                  className="w-full px-3 py-2 pr-8 rounded-xl bg-[#1F2937] border border-white/10 focus:border-purple-500 focus:outline-none text-gray-200 placeholder-gray-600 text-xs transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowEmojis((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <Smile className="w-3.5 h-3.5" />
                </button>
                {showEmojis && (
                  <div className="absolute bottom-full right-0 mb-1 flex gap-1 p-2 glass rounded-xl border border-white/10 shadow-glass">
                    {EMOJIS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => { setMessage((m) => m + e); setShowEmojis(false); }}
                        className="text-base hover:scale-125 transition-transform"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={!message.trim()}
                className="p-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
