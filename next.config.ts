
import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

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


const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl((nextConfig));
