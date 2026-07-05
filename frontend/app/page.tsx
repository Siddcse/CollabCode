'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Code2, Users, Zap, Shield, GitBranch, Globe,
  ArrowRight, Play, ChevronRight, Check, Menu, X,
  Terminal, Cpu, Lock, Star, Sparkles
} from 'lucide-react';

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  bg: '#07090F',
  bgSection: '#0B0D1A',
  surface: 'rgba(255,255,255,0.04)',
  surfaceHover: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.08)',
  primary: '#7C3AED',
  primaryGlow: 'rgba(124,58,237,0.35)',
  text: '#F1F5F9',
  textSub: '#94A3B8',
  textMuted: '#475569',
  green: '#22C55E',
  card: 'rgba(255,255,255,0.03)',
};

const FEATURES = [
  { icon: Code2, color: '#7C3AED', bg: 'rgba(124,58,237,0.15)', title: 'Monaco Editor', desc: 'VS Code-grade editing with IntelliSense, syntax highlighting, and auto-completion for 8+ languages.' },
  { icon: Users, color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', title: 'Real-Time Collaboration', desc: 'See every keystroke, cursor, and selection of your teammates live with sub-100ms latency.' },
  { icon: Zap, color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', title: 'Instant Code Execution', desc: 'Run code securely inside ephemeral Docker containers. Get output, errors, and performance metrics instantly.' },
  { icon: Shield, color: '#22C55E', bg: 'rgba(34,197,94,0.15)', title: 'Secure Sandboxing', desc: 'Every execution runs in an isolated container with memory limits, CPU quotas, and network disabled.' },
  { icon: GitBranch, color: '#EC4899', bg: 'rgba(236,72,153,0.15)', title: 'Version History', desc: 'Automatic snapshots with timeline view. Compare versions, restore previous states, and track changes.' },
  { icon: Globe, color: '#14B8A6', bg: 'rgba(20,184,166,0.15)', title: '8 Languages', desc: 'JavaScript, TypeScript, Python, Java, C, C++, Go, and Rust — all supported out of the box.' },
];

const PRICING = [
  {
    name: 'Free', price: '$0', period: '/mo', highlighted: false,
    features: ['5 rooms', '2 collaborators', 'Basic languages', '30s execution limit'],
    cta: 'Get Started', ctaLink: '/auth?mode=create',
  },
  {
    name: 'Pro', price: '$12', period: '/mo', highlighted: true,
    badge: 'Most Popular',
    features: ['Unlimited rooms', '10 collaborators', 'All languages', '5min execution', 'Version history', 'Priority support'],
    cta: 'Start Free Trial', ctaLink: '/auth?mode=create',
  },
  {
    name: 'Enterprise', price: 'Custom', period: '', highlighted: false,
    features: ['Unlimited everything', 'SSO / SAML', 'Self-hosted option', 'SLA guarantee', 'Dedicated support', 'Custom integrations'],
    cta: 'Contact Sales', ctaLink: '/auth?mode=create',
  },
];

const LANGS = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C', 'C++', 'Go', 'Rust'];

const CODE_DEMO = `import asyncio

# CollabCode Live Demo
async def collaborative_session(users: list[str]):
    for user in users:
        await asyncio.sleep(0.1)
        print(f"{user} is coding...")

users = ["Alice", "Bob", "Charlie"]
asyncio.run(collaborative_session(users))`;

// ═══════════════════════════════════════════════════════════════════════════════
export default function LandingPage() {
  const [joinCode, setJoinCode] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ─── Shared button styles ────────────────────────────────────────────────
  const btnPrimary = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
    background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
    color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: 'Inter, system-ui, sans-serif',
    boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
    textDecoration: 'none', transition: 'all 0.2s ease',
  } as React.CSSProperties;

  const btnSecondary = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '12px 24px', borderRadius: 10, cursor: 'pointer',
    background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`,
    color: C.text, fontWeight: 600, fontSize: 14, fontFamily: 'Inter, system-ui, sans-serif',
    textDecoration: 'none', transition: 'all 0.2s ease',
  } as React.CSSProperties;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Inter, system-ui, sans-serif', color: C.text, overflowX: 'hidden' }}>

      {/* ══════════════════ NAVBAR ═════════════════════════════════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 64,
        background: scrolled ? 'rgba(7,9,15,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid transparent',
        transition: 'all 0.3s ease',
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(124,58,237,0.4)' }}>
              <Code2 style={{ width: 18, height: 18, color: '#fff' }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, color: C.text, letterSpacing: '-0.3px' }}>CollabCode</span>
          </Link>

          {/* Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {['Features', 'Pricing', 'Docs'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} style={{ fontSize: 14, fontWeight: 500, color: C.textSub, textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = C.text)}
                onMouseLeave={e => (e.currentTarget.style.color = C.textSub)}>
                {item}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/auth?mode=join" style={{ fontSize: 14, fontWeight: 500, color: C.textSub, textDecoration: 'none', padding: '8px 16px', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = C.text)}
              onMouseLeave={e => (e.currentTarget.style.color = C.textSub)}>
              Sign In
            </Link>
            <Link href="/auth?mode=create" style={{ ...btnPrimary, padding: '9px 20px', fontSize: 13 }}>
              Create Room
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════════════════ HERO ═══════════════════════════════════════════════ */}
      <section style={{ position: 'relative', paddingTop: 130, paddingBottom: 80, overflow: 'hidden' }}>

        {/* Background glows */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(124,58,237,0.1) 0%, transparent 70%)', filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', top: '30%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', top: '20%', right: '5%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />
          {/* Grid */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.015, backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

          {/* Top badge */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 100, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', fontSize: 13, color: '#A78BFA', marginBottom: 36 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, display: 'inline-block', animation: 'pulse 2s infinite' }} />
              Real-time collaboration · Zero latency · Enterprise ready
            </div>

            {/* Headline */}
            <h1 style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-2px', margin: '0 0 24px', color: C.text }}>
              Code Together,{' '}
              <span style={{ background: 'linear-gradient(135deg, #A78BFA, #7C3AED, #6366F1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                In Real Time
              </span>
            </h1>

            <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: C.textSub, maxWidth: 600, margin: '0 auto 48px', lineHeight: 1.6 }}>
              The enterprise-grade collaborative code editor. Share rooms, sync cursors, execute code in Docker containers — all with sub-100ms latency.
            </p>

            {/* CTA row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 48 }}>
              <Link href="/auth?mode=create" style={{ ...btnPrimary, padding: '14px 28px', fontSize: 15 }}>
                <Play style={{ width: 16, height: 16 }} />
                Create Room
                <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>

              {/* Join form */}
              <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.04)' }}>
                <input
                  type="text"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter Room Code"
                  maxLength={9}
                  style={{ padding: '14px 18px', background: 'transparent', border: 'none', outline: 'none', color: C.text, fontSize: 14, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', width: 180 }}
                />
                <Link
                  href={joinCode.length === 9 ? `/auth?mode=join&code=${joinCode}` : '/auth?mode=join'}
                  style={{ padding: '14px 20px', background: 'rgba(124,58,237,0.2)', color: '#A78BFA', fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', borderLeft: `1px solid ${C.border}`, whiteSpace: 'nowrap', cursor: 'pointer' }}
                >
                  Join →
                </Link>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap', marginBottom: 64 }}>
            {[
              { value: '8', label: 'Languages' },
              { value: '<100ms', label: 'Latency' },
              { value: 'Docker', label: 'Sandboxed' },
              { value: 'OT', label: 'Conflict-free' },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: '-1px' }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 500, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Code editor preview */}
          <div style={{
            maxWidth: 860, margin: '0 auto',
            borderRadius: 16, overflow: 'hidden',
            border: `1px solid ${C.border}`,
            boxShadow: '0 40px 120px rgba(0,0,0,0.7), 0 0 60px rgba(124,58,237,0.08)',
            background: '#0D1117',
          }}>
            {/* Window chrome */}
            <div style={{ height: 44, background: '#161B22', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 0 }}>
              <div style={{ display: 'flex', gap: 8, marginRight: 16 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F56' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FEBC2E' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27C93F' }} />
              </div>
              {/* File tabs */}
              {['main.py', 'utils.ts'].map((f, i) => (
                <div key={f} style={{ padding: '0 16px', height: 44, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: i === 0 ? C.textSub : C.textMuted, borderBottom: i === 0 ? '2px solid #7C3AED' : '2px solid transparent', cursor: 'pointer' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: i === 0 ? '#3572A5' : '#3178C6' }} />
                  {f}
                </div>
              ))}
              <div style={{ flex: 1 }} />
              {/* User avatars */}
              <div style={{ display: 'flex', gap: -4 }}>
                {['A','B','C'].map((l, i) => (
                  <div key={l} style={{ width: 28, height: 28, borderRadius: '50%', background: ['#7C3AED','#3B82F6','#22C55E'][i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', border: '2px solid #161B22', marginLeft: i > 0 ? -8 : 0 }}>{l}</div>
                ))}
                <div style={{ marginLeft: 8, fontSize: 12, color: C.green, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.green }} />
                  3 online
                </div>
              </div>
            </div>

            {/* Code area */}
            <div style={{ display: 'flex' }}>
              {/* Line numbers */}
              <div style={{ width: 40, background: '#0D1117', borderRight: `1px solid ${C.border}`, padding: '20px 0', textAlign: 'right' }}>
                {CODE_DEMO.split('\n').map((_, i) => (
                  <div key={i} style={{ padding: '0 10px', fontSize: 13, lineHeight: '24px', color: C.textMuted, fontFamily: 'JetBrains Mono, monospace' }}>{i + 1}</div>
                ))}
              </div>
              {/* Code */}
              <div style={{ flex: 1, padding: '20px 24px', position: 'relative' }}>
                <pre style={{ margin: 0, fontFamily: 'JetBrains Mono, Consolas, monospace', fontSize: 13, lineHeight: '24px', color: '#E2E8F0', whiteSpace: 'pre' }}>
                  {CODE_DEMO.split('\n').map((line, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      {i === 8 && <span style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', borderRadius: 4, padding: '1px 8px', fontSize: 11, color: '#A78BFA', whiteSpace: 'nowrap', marginLeft: -4, zIndex: 1, left: 'calc(100% - 60px)' }}>Alice</span>}
                      {i === 9 && <span style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: 4, padding: '1px 8px', fontSize: 11, color: '#93C5FD', whiteSpace: 'nowrap', marginLeft: -4, zIndex: 1, left: 'calc(100% - 50px)' }}>Bob</span>}
                      <span style={{ color: highlightPython(line, i) }}>{line || ' '}</span>
                    </div>
                  ))}
                </pre>
              </div>
            </div>

            {/* Output bar */}
            <div style={{ borderTop: `1px solid ${C.border}`, background: '#0B0F16', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: C.textMuted }}>Output</span>
              <div style={{ width: 1, height: 14, background: C.border }} />
              <span style={{ fontSize: 11, color: C.green, display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.green }} />
                Execution: 142ms
              </span>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: C.textSub }}>Alice is coding…</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ FEATURES ═══════════════════════════════════════════ */}
      <section id="features" style={{ padding: '100px 24px', background: C.bgSection }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 100, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', fontSize: 12, color: '#A78BFA', marginBottom: 20, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Sparkles style={{ width: 12, height: 12 }} /> Features
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-1px', margin: '0 0 16px', color: C.text }}>
              Everything you need to{' '}
              <span style={{ background: 'linear-gradient(135deg, #A78BFA, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                code together
              </span>
            </h2>
            <p style={{ fontSize: 17, color: C.textSub, margin: 0 }}>Production-grade tools that professional teams rely on.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={f.title} style={{
                padding: 28, borderRadius: 16,
                background: C.card,
                border: `1px solid ${C.border}`,
                transition: 'all 0.2s ease',
                cursor: 'default',
                position: 'relative', overflow: 'hidden',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = C.surfaceHover; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(124,58,237,0.3)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = C.card; (e.currentTarget as HTMLDivElement).style.borderColor = C.border; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <f.icon style={{ width: 22, height: 22, color: f.color }} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: '0 0 10px' }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: C.textSub, margin: 0, lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ LANGUAGES ══════════════════════════════════════════ */}
      <section style={{ padding: '80px 24px', background: C.bg }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: C.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 20 }}>
            Supports 8 programming languages
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            {LANGS.map(lang => (
              <span key={lang} style={{
                padding: '10px 20px', borderRadius: 10,
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${C.border}`,
                fontSize: 14, fontWeight: 600, color: C.textSub,
                fontFamily: 'JetBrains Mono, monospace',
                transition: 'all 0.2s ease', cursor: 'default',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.text; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.4)'; (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.08)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.textSub; (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ PRICING ════════════════════════════════════════════ */}
      <section id="pricing" style={{ padding: '100px 24px', background: C.bgSection }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 100, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', fontSize: 12, color: '#A78BFA', marginBottom: 20, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Star style={{ width: 12, height: 12 }} /> Pricing
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-1px', margin: '0 0 16px', color: C.text }}>
              Simple{' '}
              <span style={{ background: 'linear-gradient(135deg, #A78BFA, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Pricing</span>
            </h2>
            <p style={{ fontSize: 17, color: C.textSub, margin: 0 }}>Start free. Scale as you grow.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {PRICING.map((plan) => (
              <div key={plan.name} style={{
                padding: 32, borderRadius: 20,
                background: plan.highlighted ? 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(99,102,241,0.08))' : C.card,
                border: `1px solid ${plan.highlighted ? 'rgba(124,58,237,0.4)' : C.border}`,
                position: 'relative',
                boxShadow: plan.highlighted ? '0 0 40px rgba(124,58,237,0.12)' : 'none',
                display: 'flex', flexDirection: 'column',
              }}>
                {plan.badge && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', padding: '4px 16px', borderRadius: 20, background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', fontSize: 11, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(124,58,237,0.4)' }}>
                    {plan.badge}
                  </div>
                )}

                <div style={{ marginBottom: 8 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: '0 0 12px' }}>{plan.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 40, fontWeight: 900, color: C.text, letterSpacing: '-1px' }}>{plan.price}</span>
                    {plan.period && <span style={{ fontSize: 14, color: C.textMuted }}>{plan.period}</span>}
                  </div>
                </div>

                <div style={{ flex: 1, margin: '24px 0' }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: plan.highlighted ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check style={{ width: 11, height: 11, color: plan.highlighted ? '#A78BFA' : C.green }} />
                      </div>
                      <span style={{ fontSize: 14, color: C.textSub }}>{f}</span>
                    </div>
                  ))}
                </div>

                <Link href={plan.ctaLink} style={{
                  display: 'block', textAlign: 'center',
                  padding: '13px 24px', borderRadius: 10, textDecoration: 'none',
                  background: plan.highlighted ? 'linear-gradient(135deg,#7C3AED,#6D28D9)' : 'rgba(255,255,255,0.06)',
                  border: plan.highlighted ? 'none' : `1px solid ${C.border}`,
                  color: plan.highlighted ? '#fff' : C.textSub,
                  fontWeight: 700, fontSize: 14,
                  boxShadow: plan.highlighted ? '0 4px 16px rgba(124,58,237,0.35)' : 'none',
                  transition: 'all 0.2s ease',
                }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ CTA BANNER ═════════════════════════════════════════ */}
      <section style={{ padding: '100px 24px', background: C.bg, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 800, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        </div>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
            <Cpu style={{ width: 28, height: 28, color: '#A78BFA' }} />
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-1.5px', color: C.text, margin: '0 0 16px' }}>
            Start coding together{' '}
            <span style={{ background: 'linear-gradient(135deg, #A78BFA, #22C55E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>right now</span>
          </h2>
          <p style={{ fontSize: 17, color: C.textSub, margin: '0 0 40px', lineHeight: 1.6 }}>
            No signup required. Create a room in seconds and share the code with your team.
          </p>
          <Link href="/auth?mode=create" style={{ ...btnPrimary, padding: '15px 36px', fontSize: 16, margin: '0 auto' }}>
            <Play style={{ width: 18, height: 18 }} />
            Create Your First Room
            <ArrowRight style={{ width: 18, height: 18 }} />
          </Link>
        </div>
      </section>

      {/* ══════════════════ FOOTER ═════════════════════════════════════════════ */}
      <footer style={{ borderTop: `1px solid ${C.border}`, background: C.bg, padding: '32px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Code2 style={{ width: 14, height: 14, color: '#fff' }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>CollabCode</span>
          </div>
          <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>© 2026 CollabCode. Enterprise Real-Time Collaborative Code Editor.</p>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy', 'Terms', 'Status'].map(l => (
              <a key={l} href="#" style={{ fontSize: 13, color: C.textMuted, textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = C.textSub)}
                onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        *::-webkit-scrollbar { width: 6px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.3); border-radius: 3px; }
        input::placeholder { color: #475569; }
      `}</style>
    </div>
  );
}

// ── Simple Python syntax highlighter ─────────────────────────────────────────
function highlightPython(line: string, i: number): string {
  if (line.startsWith('#')) return '#6B7280';
  if (line.includes('import') || line.includes('async def') || line.includes('for ') || line.includes('await') || line.includes('print')) return '#C792EA';
  if (line.includes('"') || line.includes("'")) return '#C3E88D';
  if (i === 0 || i === 1) return '#89DDFF';
  return '#E2E8F0';
}
