import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root so builds resolve from this project directory
  // even if a parent directory contains another lockfile.
  turbopack: {
    root: path.join(__dirname),
  },
  // Allow cross-origin preview embedding and HMR in sandbox environment
  allowedDevOrigins: ["*.e2b.app", "*.e2b.dev", "localhost:3000"],
};

export default nextConfig;
