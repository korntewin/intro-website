/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}
const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  reactStrictMode: true,
  assetPrefix: isProd ? '/intro-website/' : '',
  images: {
    unoptimized: true
  }
}
