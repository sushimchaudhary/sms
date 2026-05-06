// import type { NextConfig } from "next";
import withPWAInit from 'next-pwa';
import { NextConfig } from "next";


// const nextConfig: NextConfig = {
//   /* config options here */
//   reactCompiler: true,
// };

// export default nextConfig;



/** @type {import('next').NextConfig} */



const nextConfig : NextConfig = {
  turbopack: {
    // Empty config le webpack compatibility ko warning/error lai silence garcha
  },
  async rewrites() {
    return [
      {
        source: '/api-proxy/:path*',
        destination: 'https://schoolapi.edifynepal.com/api/:path*',
      },
    ]
  },
}


const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

export default withPWA((nextConfig));
