import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    // During transition
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
