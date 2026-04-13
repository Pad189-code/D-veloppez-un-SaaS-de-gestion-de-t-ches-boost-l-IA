import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/dashboard_kanban', destination: '/dashboard?vue=kanban', permanent: true },
      { source: '/single_projet', destination: '/projets', permanent: true },
    ];
  },
};

export default nextConfig;
