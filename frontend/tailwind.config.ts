import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0F172A',
        surface: '#111827',
        'surface-2': '#1F2937',
        primary: {
          DEFAULT: '#7C3AED',
          50: '#F5F3FF',
          100: '#EDE9FE',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
        },
        accent: '#22C55E',
        border: 'rgba(255,255,255,0.08)',
        'text-primary': '#F9FAFB',
        'text-secondary': '#9CA3AF',
        'text-muted': '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '12px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
      },
      boxShadow: {
        glass: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
        glow: '0 0 40px rgba(124,58,237,0.3)',
        'glow-sm': '0 0 20px rgba(124,58,237,0.2)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)',
        'gradient-surface': 'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(37,99,235,0.05) 100%)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-right': 'slideRight 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-subtle': 'bounceSubtle 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        slideRight: { from: { transform: 'translateX(-20px)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(124,58,237,0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(124,58,237,0.5)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
