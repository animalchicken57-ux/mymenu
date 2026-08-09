import path from "node:path";
import type { NextConfig } from "next";

// Dish photographs are served from Supabase Storage, so next/image has to be
// told that host is allowed. Derived from the same variable the app uses, so a
// new Supabase project needs no change here.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  // A stray package-lock.json sits in the home directory above this project,
  // so Turbopack's root inference walks too far up and warns. Pin it here.
  turbopack: {
    root: path.resolve(__dirname),
  },

  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/menu-photos/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
