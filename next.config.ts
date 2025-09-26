import type { NextConfig } from "next";

// Set this to your repository name if deploying to <user>.github.io/<repo>.
// If deploying to <user>.github.io root, keep basePath empty.
const repoName = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: repoName ? `/${repoName}` : undefined,
  images: { unoptimized: true },
  trailingSlash: true,
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
