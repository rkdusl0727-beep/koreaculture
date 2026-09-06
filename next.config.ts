import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Vercel serves this client-only learning app as a static site. The normal
  // Sites build remains a Worker build so the existing deployment is unchanged.
  output: process.env.VERCEL ? 'export' : undefined,
};

export default nextConfig;
