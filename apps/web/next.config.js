/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@my-app/core', '@my-app/types'],
}

module.exports = nextConfig
