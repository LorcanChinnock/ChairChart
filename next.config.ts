import type { NextConfig } from "next";

// Configure Next.js for static export to GitHub Pages
// - output: 'export' ensures `next build` emits static assets
// - basePath/assetPrefix are needed when hosted under /ChairChart
// - trailingSlash helps avoid 404s on static hosting (folder indexes)
// - images.unoptimized is required for export without the Image Optimization server
const isCI = process.env.CI === "true";
const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/ChairChart",
  assetPrefix: "/ChairChart/",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
