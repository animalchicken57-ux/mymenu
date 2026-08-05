import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray package-lock.json sits in the home directory above this project,
  // so Turbopack's root inference walks too far up and warns. Pin it here.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
