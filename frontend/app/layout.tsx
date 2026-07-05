import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '../providers/QueryProvider';

// next/font/google self-hosts these — no external @import needed
export const metadata: Metadata = {
  title: 'CollabCode — Real-Time Collaborative Code Editor',
  description:
    'Enterprise-grade collaborative code editor with real-time collaboration, ' +
    'multi-language support, and secure sandboxed code execution.',
  keywords: ['collaborative editor', 'code editor', 'real-time', 'Monaco Editor', 'Docker'],
  authors: [{ name: 'CollabCode' }],
  openGraph: {
    title: 'CollabCode — Code Together, In Real Time',
    description: 'Enterprise real-time collaborative code editor.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className="antialiased"
        style={{ background: '#0F172A', color: '#F9FAFB' }}
      >
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
