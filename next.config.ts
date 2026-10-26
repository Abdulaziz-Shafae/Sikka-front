import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.SIKKA_RAILWAY_NODE === '1' ? '.next-railway' : '.next',
};

export default nextConfig;
