import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '..'),
  async redirects() {
    return [
      { source: '/dashboard_kanban', destination: '/dashboard?vue=kanban', permanent: true },
      { source: '/single_projet', destination: '/projets', permanent: true },
    ];
  },
};

export default nextConfig;
