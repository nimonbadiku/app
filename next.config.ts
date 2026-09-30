import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root so builds resolve from this project directory
  // even if a parent directory contains another lockfile.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
