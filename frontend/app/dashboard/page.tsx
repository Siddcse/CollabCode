'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import Link from 'next/link';
import { Code2, Plus, Users, Clock, ArrowRight, LogOut, Copy, Check, Zap, Loader2 } from 'lucide-react';
import { useRoomStore } from '@/store/roomStore';
import { roomApi } from '@/services/api';

const RECENT_KEY = 'collabcode_recent_rooms';

interface RecentRoom { roomCode: string; language: string; lastVisited: string; }

const LANG_EMOJI: Record<string, string> = {
  javascript: '🟨', typescript: '🔷', python: '🐍',
  java: '☕', c: '⚙️', cpp: '⚙️', go: '🔵', rust: '🦀',
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, clearRoom } = useRoomStore();
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [recent, setRecent] = useState<RecentRoom[]>([]);
  const [copiedCode, setCopiedCode] = useState('');

  useEffect(() => {
    if (!token || !user) { router.push('/auth?mode=create'); return; }
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) setRecent(JSON.parse(stored));
    } catch {}
  }, [token, user, router]);

  function saveRecent(roomCode: string, language: string) {
    let rooms: RecentRoom[] = [];
    try { rooms = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'); } catch {}
    rooms = [{ roomCode, language, lastVisited: new Date().toISOString() },
      ...rooms.filter((r) => r.roomCode !== roomCode)].slice(0, 8);
    localStorage.setItem(RECENT_KEY, JSON.stringify(rooms));
  }

  async function handleCreate() {
    if (!user) return;
    setIsCreating(true); setError('');
    try {
      const data = await roomApi.create({ username: user.username });
      saveRecent(data.room.roomCode, data.room.language);
      router.push(`/room/${data.room.roomCode}`);
    } catch (err: any) {
      setError(err.message);
    } finally { setIsCreating(false); }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!user || joinCode.length !== 9) return;
    setIsJoining(true); setError('');
    try {
      const data = await roomApi.join({ roomCode: joinCode, username: user.username });
      saveRecent(data.room.roomCode, data.room.language);
      router.push(`/room/${data.room.roomCode}`);
    } catch (err: any) {
      setError(err.message);
    } finally { setIsJoining(false); }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Nav */}
      <nav className="glass border-b border-white/5 px-6 h-14 flex items-center justify-between sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Code2 className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm">CollabCode</span>
        </Link>
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg text-sm">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: user.color }}
              >
                {user.username[0].toUpperCase()}
              </div>
              <span className="text-gray-400">{user.username}</span>
            </div>
          )}
          <button
            onClick={() => { clearRoom(); router.push('/'); }}
            className="p-2 rounded-lg glass glass-hover text-gray-500 hover:text-gray-200 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl font-black mb-1">
            Welcome back, <span className="gradient-text">{user?.username}</span>
          </h1>
          <p className="text-gray-400 mb-10">
            Create a new room or join an existing one to start collaborating.
          </p>
        </motion.div>

        {/* Action cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Create */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="gradient-border p-6"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 shadow-glow-sm">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold mb-1">Create New Room</h2>
            <p className="text-gray-400 text-sm mb-5">Start a fresh coding session and invite teammates.</p>
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all shadow-glow-sm hover:shadow-glow disabled:opacity-50"
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {isCreating ? 'Creating…' : 'Create Room'}
            </button>
          </motion.div>

          {/* Join */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="glass rounded-xl p-6"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-lg font-bold mb-1">Join Existing Room</h2>
            <p className="text-gray-400 text-sm mb-5">Enter a room code to join your team.</p>
            <form onSubmit={handleJoin} className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABCD-1234"
                maxLength={9}
                className="flex-1 px-3 py-2.5 rounded-xl bg-[#1F2937] border border-white/10 focus:border-purple-500 focus:outline-none text-white placeholder-gray-600 text-sm font-mono tracking-widest"
              />
              <button
                type="submit"
                disabled={isJoining || joinCode.length !== 9}
                className="px-4 py-2.5 rounded-xl bg-[#1F2937] hover:bg-white/10 text-white font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Join
              </button>
            </form>
          </motion.div>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Recent rooms */}
        {recent.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-gray-500" />
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Recent Rooms</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recent.map((room, i) => (
                <motion.div
                  key={room.roomCode}
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="glass glass-hover p-4 rounded-xl group cursor-pointer"
                  onClick={() => router.push(`/room/${room.roomCode}`)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl">{LANG_EMOJI[room.language] ?? '💻'}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); copyCode(room.roomCode); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10"
                    >
                      {copiedCode === room.roomCode
                        ? <Check className="w-3.5 h-3.5 text-green-400" />
                        : <Copy className="w-3.5 h-3.5 text-gray-500" />}
                    </button>
                  </div>
                  <div className="font-mono text-sm font-bold text-white mb-1">{room.roomCode}</div>
                  <div className="text-xs text-gray-500 capitalize">{room.language}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {new Date(room.lastVisited).toLocaleDateString()}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
