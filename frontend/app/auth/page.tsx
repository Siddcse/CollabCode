'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Code2, Users, ArrowRight, Loader2, Eye, EyeOff, Hash, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { roomApi } from '../../services/api';
import { useRoomStore } from '../../store/roomStore';

// ── Design tokens ──────────────────────────────────────────────────────────────
const T = {
  bg: '#07090F',
  surface: 'rgba(255,255,255,0.04)',
  surfaceHover: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.08)',
  borderFocus: '#7C3AED',
  primary: '#7C3AED',
  primaryHover: '#6D28D9',
  primaryLight: 'rgba(124,58,237,0.15)',
  text: '#F1F5F9',
  textSub: '#94A3B8',
  textMuted: '#475569',
  green: '#22C55E',
  red: '#EF4444',
  redBg: 'rgba(239,68,68,0.08)',
};

function AuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = (searchParams.get('mode') as 'create' | 'join') ?? 'create';
  const prefilledCode = searchParams.get('code') ?? '';

  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState(prefilledCode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeMode, setActiveMode] = useState<'create' | 'join'>(mode);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [codeFocused, setCodeFocused] = useState(false);

  const { setRoom, setToken, setUser } = useRoomStore();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) { setError('Please enter a username'); return; }
    if (activeMode === 'join' && roomCode.length !== 9) {
      setError('Room code must be 9 characters (e.g. ABCD-1234)');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      if (activeMode === 'create') {
        const data = await roomApi.create({ username: username.trim() });
        setRoom(data.room.id, data.room.roomCode);
        setToken(data.token);
        setUser(data.user);
        router.push(`/room/${data.room.roomCode}`);
      } else {
        const data = await roomApi.join({ roomCode: roomCode.toUpperCase(), username: username.trim() });
        setRoom(data.room.id, data.room.roomCode);
        setToken(data.token);
        setUser(data.user);
        router.push(`/room/${data.room.roomCode}`);
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: T.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: 'Inter, system-ui, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* ── Ambient background glows ───────────────────────────────────────── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {/* Primary purple glow */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        {/* Secondary blue glow */}
        <div style={{
          position: 'absolute', top: '40%', left: '20%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        {/* Right accent */}
        <div style={{
          position: 'absolute', bottom: '20%', right: '15%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        {/* Grid pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.018,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* ── Card ──────────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 440,
        zIndex: 10,
      }}>

        {/* Top badge */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 28 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px rgba(124,58,237,0.4)',
            }}>
              <Code2 style={{ width: 22, height: 22, color: '#fff' }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 22, color: T.text, letterSpacing: '-0.5px' }}>CollabCode</span>
          </Link>

          <h1 style={{ fontSize: 26, fontWeight: 700, color: T.text, margin: '0 0 8px' }}>
            {activeMode === 'create' ? 'Create a Room' : 'Join a Room'}
          </h1>
          <p style={{ fontSize: 14, color: T.textSub, margin: 0 }}>
            Start collaborating in seconds — no signup required.
          </p>
        </div>

        {/* Main card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${T.border}`,
          borderRadius: 20,
          padding: 32,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset',
        }}>

          {/* Mode toggle */}
          <div style={{
            display: 'flex',
            background: 'rgba(0,0,0,0.25)',
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: 4,
            marginBottom: 28,
            gap: 4,
          }}>
            {(['create', 'join'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setActiveMode(m); setError(''); }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  padding: '10px 16px',
                  borderRadius: 9,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                  background: activeMode === m
                    ? 'linear-gradient(135deg, #7C3AED, #6D28D9)'
                    : 'transparent',
                  color: activeMode === m ? '#fff' : T.textSub,
                  boxShadow: activeMode === m ? '0 4px 16px rgba(124,58,237,0.35)' : 'none',
                }}
              >
                {m === 'create'
                  ? <><Code2 style={{ width: 14, height: 14 }} /> Create Room</>
                  : <><Users style={{ width: 14, height: 14 }} /> Join Room</>
                }
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Username */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.textSub, marginBottom: 8, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setUsernameFocused(true)}
                  onBlur={() => setUsernameFocused(false)}
                  placeholder="Enter your username"
                  maxLength={32}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${usernameFocused ? T.borderFocus : T.border}`,
                    color: T.text,
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    boxShadow: usernameFocused ? '0 0 0 3px rgba(124,58,237,0.15)' : 'none',
                  }}
                />
              </div>
            </div>

            {/* Room code (join mode only) */}
            {activeMode === 'join' && (
              <div style={{ animation: 'slideDown 0.25s ease' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.textSub, marginBottom: 8, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                  Room Code
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <Hash style={{ width: 15, height: 15, color: T.textMuted }} />
                  </div>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    onFocus={() => setCodeFocused(true)}
                    onBlur={() => setCodeFocused(false)}
                    placeholder="ABCD-1234"
                    maxLength={9}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px 12px 38px',
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.04)',
                      border: `1.5px solid ${codeFocused ? T.borderFocus : T.border}`,
                      color: T.text,
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'JetBrains Mono, Consolas, monospace',
                      letterSpacing: '0.15em',
                      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                      boxShadow: codeFocused ? '0 0 0 3px rgba(124,58,237,0.15)' : 'none',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '11px 14px',
                borderRadius: 10,
                background: T.redBg,
                border: `1px solid rgba(239,68,68,0.2)`,
                color: '#FCA5A5',
                fontSize: 13,
                lineHeight: 1.5,
                animation: 'slideDown 0.2s ease',
              }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>⚠️</span>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '13px 24px',
                borderRadius: 10,
                background: isLoading
                  ? 'rgba(124,58,237,0.5)'
                  : 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
                boxShadow: isLoading ? 'none' : '0 4px 20px rgba(124,58,237,0.4)',
                marginTop: 4,
              }}
            >
              {isLoading
                ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> Loading…</>
                : <><ArrowRight style={{ width: 16, height: 16 }} /> {activeMode === 'create' ? 'Create Room' : 'Join Room'}</>
              }
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 20px' }}>
            <div style={{ flex: 1, height: 1, background: T.border }} />
            <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: T.border }} />
          </div>

          {/* Switch mode link */}
          <div style={{ textAlign: 'center' }}>
            {activeMode === 'create' ? (
              <p style={{ fontSize: 13, color: T.textSub, margin: 0 }}>
                Have a room code?{' '}
                <button
                  onClick={() => { setActiveMode('join'); setError(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A78BFA', fontWeight: 600, fontSize: 13, fontFamily: 'inherit', padding: 0 }}
                >
                  Join a Room →
                </button>
              </p>
            ) : (
              <p style={{ fontSize: 13, color: T.textSub, margin: 0 }}>
                Want to start fresh?{' '}
                <button
                  onClick={() => { setActiveMode('create'); setError(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A78BFA', fontWeight: 600, fontSize: 13, fontFamily: 'inherit', padding: 0 }}
                >
                  Create a Room →
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: 12, color: T.textMuted, marginTop: 20 }}>
          By continuing, you agree to our{' '}
          <a href="#" style={{ color: '#7C3AED', textDecoration: 'none' }}>Terms</a>
          {' '}and{' '}
          <a href="#" style={{ color: '#7C3AED', textDecoration: 'none' }}>Privacy Policy</a>.
        </p>

        {/* Feature pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 20 }}>
          {['⚡ Real-time sync', '👥 Multi-user', '▶ Code execution', '🔒 Secure'].map((f) => (
            <span key={f} style={{
              padding: '5px 12px',
              borderRadius: 20,
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${T.border}`,
              fontSize: 11,
              color: T.textSub,
              fontWeight: 500,
            }}>{f}</span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        input::placeholder { color: #475569; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px #0d0f1c inset !important;
          -webkit-text-fill-color: #F1F5F9 !important;
        }
        a:hover { text-decoration: underline !important; }
      `}</style>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#07090F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 style={{ width: 32, height: 32, color: '#7C3AED', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
