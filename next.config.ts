import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3.ap-southeast-2.wasabisys.com',
        pathname: '/adventistcommunityservices/**',
      },
      {
        protocol: 'https',
        hostname: 's3.ap-southeast-2.wasabisys.com',
        pathname: '/alertison/**',
      },
      // Add any other image domains you need
    ],
  },
};

export default nextConfig;
