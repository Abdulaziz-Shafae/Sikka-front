import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backend = process.env.SIKKA_BACKEND_INTERNAL_URL || 'http://127.0.0.1:8080';
    return [{ source: '/api/v1/:path*', destination: backend.replace(/\/$/, '') + '/api/v1/:path*' }];
  },
  distDir: process.env.SIKKA_RAILWAY_NODE === '1' ? '.next-railway' : '.next',
};

export default nextConfig;
