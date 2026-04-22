// import type { NextConfig } from "next";

import { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
//   reactCompiler: true,
// };

// export default nextConfig;



/** @type {import('next').NextConfig} */
const nextConfig : NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api-proxy/:path*',
        destination: 'https://demo.sempatech.com/api/:path*',
      },
    ]
  },
}
export default nextConfig;
