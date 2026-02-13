/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
  webpack: (config, { isServer }) => {
    // Exclude mcp-server from build
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/mcp-server/**'],
    };
    return config;
  },
}

module.exports = nextConfig
