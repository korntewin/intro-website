import type { NextConfig } from "next";
const isProd = process.env.NODE_ENV === 'production';
const repositoryName = 'intro-website'; 

const nextConfig: NextConfig = {
  /* config options here */
  output: "export",
  images: {
    unoptimized: true
  },
  basePath: isProd ? `/${repositoryName}` : "",
  assetPrefix: isProd ? `/${repositoryName}/` : "",
};

export default nextConfig;
