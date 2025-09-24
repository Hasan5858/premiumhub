/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    CATEGORY_API_URL: process.env.CATEGORY_API_URL,
    CREATOR_API_URL: process.env.CREATOR_API_URL,
    API_BASE_URL: process.env.API_BASE_URL,
    WEBSERIES_API_URL: process.env.WEBSERIES_API_URL,
    SEARCH_API_URL: process.env.SEARCH_API_URL,
    AUTH_API_URL: process.env.AUTH_API_URL,
    EMBED_API_URL: process.env.EMBED_API_URL,
    PLAYER_API_URL: process.env.PLAYER_API_URL,
  },
  images: {
    domains: ["cdn.premiumhub.workers.dev", "i.imgur.com"],
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
