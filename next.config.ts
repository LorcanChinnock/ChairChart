import type { NextConfig } from "next";

// Mirror next.config.mjs to avoid divergence. Canonical config is the .mjs file.
const isProd = process.env.NODE_ENV === "production";
const basePath = isProd ? "/ChairChart" : "";

const nextConfig: NextConfig = {
  // Export as static HTML for GitHub Pages
  output: "export",
  // In production (GitHub Pages), the site is hosted under /ChairChart
  // In development, keep root path so assets like /next.svg resolve
  basePath,
  assetPrefix: isProd ? "/ChairChart/" : undefined,
  // Helps avoid 404s on static hosting (serves index.html in folder)
  trailingSlash: true,
  // Required for static export (no Image Optimization server)
  images: { unoptimized: true },
  // Expose basePath to the client so custom Image loader can prefix public assets
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
  canvas: false as unknown as string,
    } as typeof config.resolve.alias;
    return config;
  },
};

export default nextConfig;
