import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Opt-in override only — unset (the default everywhere, including Vercel)
  // behaves exactly like plain ".next". This exists purely so local dev can
  // route around a root-owned ".next" left behind by an earlier `sudo` build
  // on this machine, without touching how production builds.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
