/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve these Node.js modules on the client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        dns: false,
        fs: false,
        crypto: false,
        os: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        path: false,
        querystring: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig 