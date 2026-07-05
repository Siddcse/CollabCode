import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {},
  experimental: {
    optimizePackageImports: ['lucide-react', '@monaco-editor/react'],
  },
};

export default nextConfig;
