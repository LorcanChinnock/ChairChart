import path from 'path';
import { fileURLToPath } from 'url';

/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const basePath = isProd ? '/ChairChart' : '';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const emptyShim = path.join(__dirname, 'src', 'shims', 'empty.js');

const nextConfig = {
  // Export as static HTML for GitHub Pages
  output: 'export',
  // In production (GitHub Pages), the site is hosted under /ChairChart
  // In development, keep root path so assets like /next.svg resolve
  basePath,
  assetPrefix: isProd ? '/ChairChart/' : undefined,
  // Helps avoid 404s on static hosting (serves index.html in folder)
  trailingSlash: true,
  // Required for static export (no Image Optimization server)
  images: { unoptimized: true },
  // Expose basePath to the client so custom Image loader can prefix public assets
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  // Mirror aliases for Turbopack so dev doesn't warn about webpack-only config
  turbopack: {
    resolveAlias: {
  canvas: emptyShim,
    },
  },
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      canvas: false,
    };
    return config;
  },
};

export default nextConfig;
